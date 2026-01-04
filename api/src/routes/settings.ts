import express from 'express'
import { supabase } from '../config/database'
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth'

const router = express.Router()
const SETTINGS_PATH = 'settings/daily-rate.json'
const PRICING_PATH = 'settings/pricing.json'

const DEFAULT_PRICING = {
  models: [
    {
      id: 'honda-dio',
      name: 'Honda Dio',
      dailyRateLKR: 2500,
      monthlyRateLKR: 60000,
    },
    {
      id: 'yamaha-ray-z',
      name: 'Yamaha Ray-Z',
      dailyRateLKR: 2800,
      monthlyRateLKR: 70000,
    },
    {
      id: 'tvs-jupiter',
      name: 'TVS Jupiter',
      dailyRateLKR: 2600,
      monthlyRateLKR: 65000,
    },
    {
      id: 'suzuki-access',
      name: 'Suzuki Access',
      dailyRateLKR: 3000,
      monthlyRateLKR: 75000,
    },
    {
      id: 'bajaj-pulsar',
      name: 'Bajaj Pulsar',
      dailyRateLKR: 4500,
      monthlyRateLKR: 110000,
    },
  ],
  rules: {
    longTermDiscountDays: 3,
    longTermDiscountPercentage: 0.10,
    outsideAreaRateLKR: 500,
  }
}

// Get pricing config (public)
router.get('/pricing', async (_req, res) => {
  try {
    const { data } = await supabase.storage.from('rental-agreements').download(PRICING_PATH)
    if (!data) {
      return res.json(DEFAULT_PRICING)
    }
    const text = await (data as unknown as Blob).text()
    const parsed = JSON.parse(text || '{}')
    // Merge with default to ensure structure
    res.json({
      models: parsed.models || DEFAULT_PRICING.models,
      rules: { ...DEFAULT_PRICING.rules, ...parsed.rules }
    })
  } catch {
    res.json(DEFAULT_PRICING)
  }
})

// Update pricing config (admin only)
router.put('/pricing', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { models, rules } = req.body
    
    // Basic validation
    if (!Array.isArray(models) || typeof rules !== 'object') {
      return res.status(400).json({ error: 'Invalid configuration format' })
    }

    const config = { models, rules }
    const buffer = Buffer.from(JSON.stringify(config, null, 2))
    
    const { error } = await supabase.storage.from('rental-agreements').upload(PRICING_PATH, buffer, {
      contentType: 'application/json',
      upsert: true
    })
    
    if (error) throw error

    await supabase
      .from('audit_events')
      .insert([{
        actor: req.user!.email,
        action: 'update_pricing_config',
        timestamp: new Date().toISOString()
      }])

    res.json(config)
  } catch (error) {
    console.error('Update pricing error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get current daily rate (public)
router.get('/daily-rate', async (_req, res) => {
  try {
    const { data } = await supabase.storage.from('rental-agreements').download(SETTINGS_PATH)
    if (!data) {
      return res.json({ daily_rate: 5000 }) // default fallback
    }
    const text = await (data as unknown as Blob).text()
    const parsed = JSON.parse(text || '{}') as { daily_rate?: number }
    const rate = typeof parsed.daily_rate === 'number' ? parsed.daily_rate : 5000
    res.json({ daily_rate: rate })
  } catch {
    res.json({ daily_rate: 5000 })
  }
})

// Update daily rate (admin only)
router.put('/daily-rate', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { daily_rate } = req.body as { daily_rate?: number }
    if (daily_rate === undefined || Number.isNaN(Number(daily_rate)) || Number(daily_rate) < 0) {
      return res.status(400).json({ error: 'Invalid rate value' })
    }
    const buffer = Buffer.from(JSON.stringify({ daily_rate: Number(daily_rate) }, null, 2))
    const { error } = await supabase.storage.from('rental-agreements').upload(SETTINGS_PATH, buffer, {
      contentType: 'application/json',
      upsert: true
    })
    if (error) throw error

    await supabase
      .from('audit_events')
      .insert([{
        actor: req.user!.email,
        action: 'update_daily_rate',
        timestamp: new Date().toISOString()
      }])

    res.json({ daily_rate: Number(daily_rate) })
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
