import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/database';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Validate guest token
router.get('/validate/:token', async (req: express.Request, res: express.Response) => {
  try {
    const { token } = req.params;

    const { data: guestLink, error } = await supabase
      .from('guest_links')
      .select(`
        *,
        agreements (*)
      `)
      .eq('token', token)
      .single();

    if (error || !guestLink) {
      return res.status(404).json({ 
        valid: false, 
        error: 'Invalid guest link' 
      });
    }

    // Check if link is expired
    const now = new Date();
    const expiresAt = new Date(guestLink.expires_at);
    
    if (now > expiresAt) {
      // Update status to expired
      await supabase
        .from('guest_links')
        .update({ status: 'expired' })
        .eq('id', guestLink.id);

      return res.status(410).json({ 
        valid: false, 
        error: 'Guest link has expired' 
      });
    }

    // Check if link has been used
    if (guestLink.used_count >= guestLink.max_uses) {
      return res.status(410).json({ 
        valid: false, 
        error: 'Guest link has already been used' 
      });
    }

    res.json({
      valid: true,
      agreement_id: guestLink.agreement_id,
      expires_at: guestLink.expires_at,
      max_uses: guestLink.max_uses,
      used_count: guestLink.used_count
    });

  } catch (error) {
    console.error('Validate guest link error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get agreement details by guest token
router.get('/agreement/:token', async (req: express.Request, res: express.Response) => {
  try {
    const { token } = req.params;

    const { data: guestLink, error } = await supabase
      .from('guest_links')
      .select(`
        *,
        agreements!inner (
          *,
          tourists (*)
        )
      `)
      .eq('token', token)
      .eq('status', 'active')
      .single();

    if (error || !guestLink) {
      return res.status(404).json({ error: 'Invalid or expired guest link' });
    }

    // Check if link is expired
    const now = new Date();
    const expiresAt = new Date(guestLink.expires_at);
    
    if (now > expiresAt) {
      await supabase
        .from('guest_links')
        .update({ status: 'expired' })
        .eq('id', guestLink.id);

      return res.status(410).json({ error: 'Guest link has expired' });
    }

    // Check if link has been used
    if (guestLink.used_count >= guestLink.max_uses) {
      return res.status(410).json({ error: 'Guest link has already been used' });
    }

    res.json({
      agreement: guestLink.agreements
    });

  } catch (error) {
    console.error('Get agreement by guest link error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark guest link as used
router.post('/use/:token', async (req: express.Request, res: express.Response) => {
  try {
    const { token } = req.params;

    const { data: guestLink, error } = await supabase
      .from('guest_links')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !guestLink) {
      return res.status(404).json({ error: 'Invalid guest link' });
    }

    // Check if link is expired
    const now = new Date();
    const expiresAt = new Date(guestLink.expires_at);
    
    if (now > expiresAt) {
      await supabase
        .from('guest_links')
        .update({ status: 'expired' })
        .eq('id', guestLink.id);

      return res.status(410).json({ error: 'Guest link has expired' });
    }

    // Check if link has been used
    if (guestLink.used_count >= guestLink.max_uses) {
      return res.status(410).json({ error: 'Guest link has already been used' });
    }

    // Update usage count
    const newUsedCount = guestLink.used_count + 1;
    const newStatus = newUsedCount >= guestLink.max_uses ? 'used' : 'active';

    await supabase
      .from('guest_links')
      .update({ 
        used_count: newUsedCount,
        status: newStatus
      })
      .eq('id', guestLink.id);

    res.json({ 
      message: 'Guest link usage updated',
      used_count: newUsedCount,
      status: newStatus
    });

  } catch (error) {
    console.error('Use guest link error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a guest link for an existing agreement (admin)
router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const { agreement_id, expires_in_days = 7, max_uses = 1 } = req.body as {
      agreement_id?: string;
      expires_in_days?: number;
      max_uses?: number;
    };

    if (!agreement_id) {
      return res.status(400).json({ error: 'agreement_id is required' });
    }

    const { data: agreement, error: agreementErr } = await supabase
      .from('agreements')
      .select('id, status')
      .eq('id', agreement_id)
      .single();

    if (agreementErr || !agreement) {
      return res.status(404).json({ error: 'Agreement not found' });
    }

    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + Number(expires_in_days || 7));

    const { data: created, error: createErr } = await supabase
      .from('guest_links')
      .insert([{
        agreement_id,
        token,
        expires_at: expiresAt.toISOString(),
        max_uses: Number(max_uses || 1),
        used_count: 0,
        status: 'active'
      }])
      .select()
      .single();

    if (createErr) {
      throw createErr;
    }

    res.json({
      token: created?.token,
      expires_at: created?.expires_at,
      status: created?.status,
      agreement_id
    });
  } catch (error) {
    console.error('Create guest link error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
