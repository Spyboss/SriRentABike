import express from 'express'
import { supabase } from '../config/database'
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth'

const router = express.Router()
const SETTINGS_PATH = 'settings/daily-rate.json'

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
