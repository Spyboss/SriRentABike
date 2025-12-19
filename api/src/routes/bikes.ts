import express from 'express'
import { supabase } from '../config/database'
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth'
import multer from 'multer'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

// Create bike (admin)
router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const { model, frame_no, plate_no, availability_status } = req.body as {
      model?: string
      frame_no?: string
      plate_no?: string
      availability_status?: 'available' | 'rented' | 'maintenance'
    }
    if (!model || !frame_no || !plate_no) {
      return res.status(400).json({ error: 'model, frame_no and plate_no are required' })
    }
    const { data, error } = await supabase
      .from('bikes')
      .insert([{
        model,
        frame_no,
        plate_no,
        availability_status: availability_status || 'available'
      }])
      .select()
      .single()
    if (error) throw error
    res.json({ bike: data })
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// List bikes (admin)
router.get('/', authenticateToken, requireAdmin, async (_req: AuthRequest, res: express.Response) => {
  try {
    const { data, error } = await supabase
      .from('bikes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    res.json({ bikes: data })
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update bike (admin)
router.put('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params
    const updates = req.body as {
      model?: string
      frame_no?: string
      plate_no?: string
      availability_status?: 'available' | 'rented' | 'maintenance'
    }
    const { data, error } = await supabase
      .from('bikes')
      .update({ ...updates })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    res.json({ bike: data })
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// List available bikes (admin)
router.get('/available', authenticateToken, requireAdmin, async (_req: AuthRequest, res: express.Response) => {
  try {
    const { data, error } = await supabase
      .from('bikes')
      .select('*')
      .eq('availability_status', 'available')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    res.json({ bikes: data })
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Archive (soft-delete) bike (admin)
router.post('/:id/archive', authenticateToken, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params
    const { data, error } = await supabase
      .from('bikes')
      .update({ availability_status: 'maintenance' })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    res.json({ bike: data })
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete bike (admin) with guard
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params
    const { data: refs } = await supabase
      .from('agreements')
      .select('id,status')
      .eq('bike_id', id)
      .in('status', ['pending', 'signed'])
    if (refs && refs.length > 0) {
      return res.status(400).json({ error: 'Bike is referenced by active agreements' })
    }
    const { error } = await supabase
      .from('bikes')
      .delete()
      .eq('id', id)
    if (error) throw error
    res.json({ message: 'Bike deleted' })
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Bike metadata (color/specs) stored in storage as JSON
router.get('/:id/meta', authenticateToken, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params
    const filePath = `bike-meta/${id}.json`
    const { data } = await supabase.storage.from('rental-agreements').download(filePath)
    if (!data) {
      return res.json({ meta: null })
    }
    const text = await (data as unknown as Blob).text()
    res.json({ meta: JSON.parse(text) })
  } catch {
    res.json({ meta: null })
  }
})

router.put('/:id/meta', authenticateToken, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params
    const meta = req.body as { color?: string; specs?: string }
    const filePath = `bike-meta/${id}.json`
    const buffer = Buffer.from(JSON.stringify(meta, null, 2))
    const { error } = await supabase.storage.from('rental-agreements').upload(filePath, buffer, {
      contentType: 'application/json',
      upsert: true
    })
    if (error) throw error
    res.json({ meta })
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Bike documentation uploads
router.post('/:id/docs', authenticateToken, requireAdmin, upload.array('files', 5), async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params
    const files = (req as unknown as { files?: Express.Multer.File[] }).files || []
    const uploaded: string[] = []
    for (const f of files) {
      const path = `bike-docs/${id}/${Date.now()}-${f.originalname}`
      const { error } = await supabase.storage.from('rental-agreements').upload(path, f.buffer, {
        contentType: f.mimetype,
        upsert: false
      })
      if (error) throw error
      const { data: urlData } = supabase.storage.from('rental-agreements').getPublicUrl(path)
      uploaded.push(urlData.publicUrl)
    }
    res.json({ urls: uploaded })
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/:id/docs', authenticateToken, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params
    const prefix = `bike-docs/${id}`
    const { data, error } = await supabase.storage.from('rental-agreements').list(prefix)
    if (error) throw error
    const urls = (data || []).map((obj: { name: string }) => supabase.storage.from('rental-agreements').getPublicUrl(`${prefix}/${obj.name}`).data.publicUrl)
    res.json({ urls })
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
