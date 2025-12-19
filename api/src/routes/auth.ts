import express from 'express';
import bcrypt from 'bcrypt';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { supabase, config } from '../config/database';
import { AdminLoginRequest, AuthResponse } from '../models/types';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Admin login
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password }: AdminLoginRequest = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const payload = { id: user.id, email: user.email, role: user.role };
    const secret: Secret = config.jwtSecret as Secret;
    const options: SignOptions = { expiresIn: config.jwtExpiresIn as SignOptions['expiresIn'] };
    const token = jwt.sign(payload, secret, options);

    const response: AuthResponse = {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
router.get('/me', authenticateToken, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

// Create initial admin user (for development)
router.post('/setup-admin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if admin already exists
    const { data: existingAdmin } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const { data: newAdmin, error } = await supabase
      .from('users')
      .insert([{
        email,
        password_hash: hashedPassword,
        role: 'admin'
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({ 
      message: 'Admin created successfully',
      admin: { id: newAdmin.id, email: newAdmin.email, role: newAdmin.role }
    });
  } catch (error) {
    console.error('Setup admin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
