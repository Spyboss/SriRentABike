import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const nodeEnv = process.env.NODE_ENV || 'development';
const jwtSecretEnv = process.env.JWT_SECRET;
const jwtSecretFallback = nodeEnv === 'development' ? 'dev-insecure-secret' : '';
const jwtSecret = jwtSecretEnv || jwtSecretFallback;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing required Supabase environment variables');
}
if (!jwtSecretEnv && nodeEnv !== 'development') {
  throw new Error('JWT_SECRET is required in production');
}
if (!jwtSecretEnv) {
  console.warn('JWT_SECRET is not set; using an insecure development-only fallback');
}

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv,
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'),
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  setupAdminToken: process.env.SETUP_ADMIN_TOKEN || ''
};
