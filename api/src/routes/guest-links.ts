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

// Submit a signed agreement through a guest link (public).
//
// This writes back onto the agreement the link points at. It used to be
// split across two calls — GuestForm POSTed a brand-new agreement while a
// separate endpoint marked the link used — so the original stayed 'pending'
// forever and an orphan copy got the signature. That is why every one of the
// 21 links in the database sits at used_count 0.
router.post('/submit/:token', async (req: express.Request, res: express.Response) => {
  try {
    const { token } = req.params;
    const { tourist_data, signature, start_date, end_date, daily_rate, total_amount, requested_model, outside_area } = req.body as {
      tourist_data?: {
        first_name?: string;
        last_name?: string;
        passport_no?: string;
        nationality?: string;
        home_address?: string;
        phone_number?: string;
        email?: string;
        hotel_name?: string;
      };
      signature?: string;
      start_date?: string;
      end_date?: string;
      daily_rate?: number;
      total_amount?: number;
      requested_model?: string;
      outside_area?: boolean;
    };

    if (!signature || !String(signature).startsWith('data:image/')) {
      return res.status(400).json({ error: 'A signature is required' });
    }
    if (!tourist_data?.first_name || !tourist_data?.last_name || !tourist_data?.passport_no) {
      return res.status(400).json({ error: 'Name and passport number are required' });
    }

    const { data: guestLink, error: linkError } = await supabase
      .from('guest_links')
      .select('*, agreements (*)')
      .eq('token', token)
      .single();

    if (linkError || !guestLink) {
      return res.status(404).json({ error: 'Invalid guest link' });
    }

    const now = new Date();
    if (now > new Date(guestLink.expires_at)) {
      await supabase.from('guest_links').update({ status: 'expired' }).eq('id', guestLink.id);
      return res.status(410).json({ error: 'Guest link has expired' });
    }
    if (guestLink.used_count >= guestLink.max_uses) {
      return res.status(410).json({ error: 'Guest link has already been used' });
    }

    const agreement = guestLink.agreements as { id: string; tourist_id: string; agreement_no: string; status: string };
    if (!agreement) {
      return res.status(404).json({ error: 'Agreement not found' });
    }

    // Upload the signature
    const signatureBuffer = Buffer.from(String(signature).split(',')[1], 'base64');
    const signatureFileName = `signatures/${uuidv4()}.png`;
    const { error: uploadError } = await supabase.storage
      .from('rental-agreements')
      .upload(signatureFileName, signatureBuffer, { contentType: 'image/png', upsert: false });
    if (uploadError) throw uploadError;

    const signatureUrl = supabase.storage
      .from('rental-agreements')
      .getPublicUrl(signatureFileName).data.publicUrl;

    // The tourist row already exists (the admin created it with the booking),
    // so update it in place rather than inserting a duplicate.
    const { error: touristError } = await supabase
      .from('tourists')
      .update(tourist_data)
      .eq('id', agreement.tourist_id);
    if (touristError) throw touristError;

    const agreementUpdate: Record<string, unknown> = {
      signature_url: signatureUrl,
      signed_at: now.toISOString(),
      updated_at: now.toISOString()
    };
    if (start_date) agreementUpdate.start_date = start_date;
    if (end_date) agreementUpdate.end_date = end_date;
    if (requested_model !== undefined) agreementUpdate.requested_model = requested_model;
    if (outside_area !== undefined) agreementUpdate.outside_area = outside_area;
    // The guest can adjust dates/model on this form, so store the repriced
    // figures alongside — same client-side pricing trust model as POST /.
    // Deposit is deliberately NOT accepted here: it is agreed offline between
    // the owner and the tourist, and a guest edit must not wipe it.
    if (typeof daily_rate === 'number') agreementUpdate.daily_rate = daily_rate;
    if (typeof total_amount === 'number') agreementUpdate.total_amount = total_amount;
    // Signing moves the booking forward. If the admin already handed the bike
    // over there is nothing to undo, so only advance out of 'pending'.
    if (agreement.status === 'pending') agreementUpdate.status = 'signed';

    const { data: updated, error: updateError } = await supabase
      .from('agreements')
      .update(agreementUpdate)
      .eq('id', agreement.id)
      .select()
      .single();
    if (updateError) throw updateError;

    // Burn the link in the same flow as the write, so a retry cannot re-submit.
    const newUsedCount = guestLink.used_count + 1;
    await supabase
      .from('guest_links')
      .update({
        used_count: newUsedCount,
        status: newUsedCount >= guestLink.max_uses ? 'used' : 'active'
      })
      .eq('id', guestLink.id);

    try {
      await supabase.from('audit_events').insert([{
        actor: tourist_data.email || 'guest',
        action: 'guest_sign',
        agreement_id: agreement.id,
        timestamp: now.toISOString()
      }]);
    } catch (auditError) {
      console.error('Guest sign audit error:', auditError);
    }

    res.json({
      agreement_no: agreement.agreement_no,
      status: updated.status
    });

  } catch (error) {
    console.error('Guest link submit error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message });
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
