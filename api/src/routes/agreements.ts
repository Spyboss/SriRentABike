import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/database';
import { authenticateToken, AuthRequest, requireAdmin } from '../middleware/auth';
import { CreateAgreementRequest, UpdateAgreementRequest } from '../models/types';

const router = express.Router();

// Create new agreement (guest)
router.post('/', async (req: express.Request, res: express.Response) => {
  try {
    const { tourist_data, signature }: CreateAgreementRequest = req.body;

    // Validate required fields
    if (!tourist_data || !signature) {
      return res.status(400).json({ error: 'Tourist data and signature are required' });
    }

    const requiredFields = ['first_name', 'last_name', 'passport_no', 'nationality', 'home_address', 'phone_number', 'email'];
    for (const field of requiredFields) {
      if (!tourist_data[field as keyof typeof tourist_data]) {
        return res.status(400).json({ error: `${field} is required` });
      }
    }

    // Upload signature to Supabase Storage
    const signatureBuffer = Buffer.from(signature.split(',')[1], 'base64');
    const signatureFileName = `signatures/${uuidv4()}.png`;
    
    const { error: uploadError } = await supabase.storage
      .from('rental-agreements')
      .upload(signatureFileName, signatureBuffer, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    const signatureUrl = supabase.storage
      .from('rental-agreements')
      .getPublicUrl(signatureFileName).data.publicUrl;

    // Create tourist record
    const { data: tourist, error: touristError } = await supabase
      .from('tourists')
      .insert([tourist_data])
      .select()
      .single();

    if (touristError) {
      throw touristError;
    }

    // Create agreement
    const agreementNo = `SRI-${Date.now().toString().slice(-6)}`;
    const { data: agreement, error: agreementError } = await supabase
      .from('agreements')
      .insert([{
        agreement_no: agreementNo,
        tourist_id: tourist.id,
        status: 'pending',
        signature_url: signatureUrl,
        signed_at: new Date().toISOString(),
        // Default values that admin will update
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        daily_rate: 0,
        total_amount: 0,
        deposit: 0
      }])
      .select()
      .single();

    if (agreementError) {
      throw agreementError;
    }

    // Create guest link
    const guestToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const { error: guestLinkError } = await supabase
      .from('guest_links')
      .insert([{
        agreement_id: agreement.id,
        token: guestToken,
        expires_at: expiresAt.toISOString(),
        max_uses: 1,
        used_count: 0,
        status: 'active'
      }])
      .select()
      .single();

    if (guestLinkError) {
      throw guestLinkError;
    }

    res.json({
      agreement_id: agreement.id,
      agreement_no: agreementNo,
      status: 'pending',
      guest_token: guestToken
    });

  } catch (error) {
    console.error('Create agreement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Public agreement status by reference
router.get('/public/:reference', async (req: express.Request, res: express.Response) => {
  try {
    const { reference } = req.params;
    const { data: agreement, error } = await supabase
      .from('agreements')
      .select(`
        agreement_no,
        status,
        pdf_url,
        tourists (
          first_name,
          last_name
        )
      `)
      .eq('agreement_no', reference)
      .single();
    
    if (error || !agreement) {
      return res.status(404).json({ error: 'Agreement not found' });
    }

    type TouristName = { first_name: string; last_name: string };
    const touristsField = (agreement as unknown as { tourists?: TouristName | TouristName[] }).tourists;
    const t = Array.isArray(touristsField) ? touristsField[0] : touristsField;
    res.json({
      agreement_no: agreement.agreement_no,
      status: agreement.status,
      pdf_url: agreement.pdf_url || null,
      tourist: t ? {
        first_name: t.first_name,
        last_name: t.last_name
      } : null
    });
  } catch (error) {
    console.error('Public agreement status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all agreements (admin)
router.get('/', authenticateToken, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const { page = 1, limit = 20, search, status, start_date, end_date } = req.query;
    
    let query = supabase
      .from('agreements')
      .select(`
        *,
        tourists (*),
        bikes (*)
      `)
      .order('created_at', { ascending: false });

    // Exclude soft-deleted
    query = query.is('deleted_at', null);
    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`agreement_no.ilike.%${search}%,tourists.first_name.ilike.%${search}%,tourists.last_name.ilike.%${search}%,tourists.passport_no.ilike.%${search}%`);
    }

    if (start_date) {
      query = query.gte('start_date', start_date);
    }

    if (end_date) {
      query = query.lte('end_date', end_date);
    }

    // Pagination
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    query = query.range(offset, offset + parseInt(limit as string) - 1);

    const { data: agreements, error } = await query;

    if (error) {
      throw error;
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('agreements')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw countError;
    }

    res.json({
      agreements,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / parseInt(limit as string))
      }
    });

  } catch (error) {
    console.error('Get agreements error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single agreement (admin)
router.get('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params;

    const { data: agreement, error } = await supabase
      .from('agreements')
      .select(`
        *,
        tourists (*),
        bikes (*),
        users!agreements_admin_id_fkey (*)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Agreement not found' });
      }
      throw error;
    }

    res.json({ agreement });

  } catch (error) {
    console.error('Get agreement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update agreement (admin)
router.put('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params;
    const updates: UpdateAgreementRequest = req.body;

    // Validate status if provided
    if (updates.status && !['pending', 'signed', 'completed'].includes(updates.status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // If assigning a bike, update bike availability
    if (updates.bike_id) {
      const { data: bike, error: bikeError } = await supabase
        .from('bikes')
        .select('availability_status')
        .eq('id', updates.bike_id)
        .single();

      if (bikeError) {
        return res.status(400).json({ error: 'Invalid bike ID' });
      }

      if (bike.availability_status !== 'available') {
        return res.status(400).json({ error: 'Bike is not available' });
      }

      // Update bike status
      await supabase
        .from('bikes')
        .update({ availability_status: 'rented' })
        .eq('id', updates.bike_id);
    }

    // Update agreement
    const updateBody: Record<string, unknown> = {
      ...updates,
      admin_id: req.user!.id,
      updated_at: new Date().toISOString()
    };
    if (updates.bike_id) {
      updateBody.status = 'completed';
    }
    const { data: agreement, error } = await supabase
      .from('agreements')
      .update(updateBody)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Agreement not found' });
      }
      throw error;
    }

    if (updates.bike_id) {
      await supabase
        .from('audit_events')
        .insert([{
          actor: req.user!.email,
          action: 'assign_bike',
          agreement_id: id,
          timestamp: new Date().toISOString()
        }])
    }

    res.json({ agreement });

  } catch (error) {
    console.error('Update agreement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Soft delete agreement (admin)
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params;
    const now = new Date().toISOString();
    const { data: agreement, error } = await supabase
      .from('agreements')
      .update({ deleted_at: now, updated_at: now })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      const code = (error as import('@supabase/supabase-js').PostgrestError | { code?: string })?.code;
      if (code === 'PGRST116') {
        return res.status(404).json({ error: 'Agreement not found' });
      }
      const message = (error as { message?: string })?.message || '';
      const missingDeletedAt =
        code === '42703' ||
        /deleted_at/i.test(message) && /(column|schema cache)/i.test(message);
      if (missingDeletedAt) {
        const { data: hardDeleted, error: hardDeleteError } = await supabase
          .from('agreements')
          .delete()
          .eq('id', id)
          .select()
          .single();
        if (hardDeleteError) throw hardDeleteError;
        try {
          await supabase
            .from('audit_events')
            .insert([{
              actor: req.user!.email,
              action: 'delete_agreement',
              agreement_id: id,
              timestamp: now
            }]);
        } catch (auditError) {
          console.error('Delete agreement audit error:', auditError);
        }
        return res.json({ agreement: hardDeleted });
      }
      throw error;
    }
    try {
      await supabase
        .from('audit_events')
        .insert([{
          actor: req.user!.email,
          action: 'delete_agreement',
          agreement_id: id,
          timestamp: now
        }]);
    } catch (auditError) {
      console.error('Delete agreement audit error:', auditError);
    }
    res.json({ agreement });
  } catch (error) {
    console.error('Delete agreement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// Agreement audit events (admin)
router.get('/:id/audit', authenticateToken, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params
    const { data, error } = await supabase
      .from('audit_events')
      .select('*')
      .eq('agreement_id', id)
      .order('timestamp', { ascending: false })
    if (error) throw error
    res.json({ events: data })
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router;
