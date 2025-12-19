import express from 'express';
import { supabase } from '../config/database';
import { authenticateToken, AuthRequest, requireAdmin } from '../middleware/auth';
import { PDFService } from '../services/pdf-service';

const router = express.Router();
const pdfService = new PDFService();

// Generate PDF for agreement
router.post('/generate/:agreementId', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { agreementId } = req.params;

    // Get agreement with related data
    const { data: agreement, error: agreementError } = await supabase
      .from('agreements')
      .select(`
        *,
        tourists (*),
        bikes (*)
      `)
      .eq('id', agreementId)
      .single();

    if (agreementError || !agreement) {
      return res.status(404).json({ error: 'Agreement not found' });
    }

    // Check if agreement has required data for PDF generation
    if (!agreement.signature_url) {
      return res.status(400).json({ error: 'Agreement does not have a signature' });
    }

    let bikeData = agreement.bikes;
    if (!bikeData) {
      if (!agreement.bike_id) {
        return res.status(400).json({ error: 'Agreement does not have a bike assigned' });
      }
      const { data: bike, error: bikeErr } = await supabase
        .from('bikes')
        .select('*')
        .eq('id', agreement.bike_id)
        .single();
      if (bikeErr || !bike) {
        return res.status(400).json({ error: 'Agreement does not have a valid bike assigned' });
      }
      bikeData = bike;
    }

    // Prepare PDF data
    const pdfData = {
      agreement: {
        agreement_no: agreement.agreement_no,
        start_date: agreement.start_date,
        end_date: agreement.end_date,
        daily_rate: agreement.daily_rate,
        total_amount: agreement.total_amount,
        deposit: agreement.deposit,
        signature_url: agreement.signature_url
      },
      tourist: agreement.tourists,
      bike: bikeData
    };

    // Generate PDF
    const pdfBuffer = await pdfService.generatePDF(pdfData);

    // Upload PDF to storage
    const pdfUrl = await pdfService.uploadPDFToStorage(pdfBuffer, agreement.agreement_no);

    // Update agreement with PDF URL
    const { error: updateError } = await supabase
      .from('agreements')
      .update({ pdf_url: pdfUrl, pdf_status: 'generated' })
      .eq('id', agreementId);

    if (updateError) {
      // If migration not applied yet for pdf_status, continue without failing
      const code = (updateError as import('@supabase/supabase-js').PostgrestError | { code?: string })?.code;
      if (code !== 'PGRST204') {
        throw updateError;
      } else {
        await supabase.from('agreements').update({ pdf_url: pdfUrl }).eq('id', agreementId);
      }
    }

    // Send PDF as response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="rental-agreement-${agreement.agreement_no}.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Generate PDF error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download existing PDF
router.get('/download/:agreementId', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { agreementId } = req.params;

    // Get agreement
    const { data: agreement, error } = await supabase
      .from('agreements')
      .select('pdf_url, agreement_no')
      .eq('id', agreementId)
      .single();

    if (error || !agreement) {
      return res.status(404).json({ error: 'Agreement not found' });
    }

    // Mark agreement as completed upon download
    const { error: statusErr } = await supabase
      .from('agreements')
      .update({ status: 'completed', updated_at: new Date().toISOString(), pdf_status: 'downloaded' })
      .eq('id', agreementId);
    if (statusErr) {
      const code = (statusErr as import('@supabase/supabase-js').PostgrestError | { code?: string })?.code;
      if (code !== 'PGRST204') {
        throw statusErr;
      } else {
        await supabase.from('agreements').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', agreementId);
      }
    }

    // Audit event for download
    await supabase
      .from('audit_events')
      .insert([{
        actor: req.user!.email,
        action: 'download_pdf',
        agreement_id: agreementId,
        timestamp: new Date().toISOString()
      }]);

    if (!agreement.pdf_url) {
      return res.status(404).json({ error: 'PDF not generated yet' });
    }

    // Fetch PDF from storage
    const response = await fetch(agreement.pdf_url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch PDF');
    }

    const pdfBuffer = Buffer.from(await response.arrayBuffer());

    // Send PDF as response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="rental-agreement-${agreement.agreement_no}.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Download PDF error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get PDF URL (for preview)
router.get('/url/:agreementId', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { agreementId } = req.params;

    // Get agreement
    const { data: agreement, error } = await supabase
      .from('agreements')
      .select('pdf_url, agreement_no')
      .eq('id', agreementId)
      .single();

    if (error || !agreement) {
      return res.status(404).json({ error: 'Agreement not found' });
    }

    if (!agreement.pdf_url) {
      return res.status(404).json({ error: 'PDF not generated yet' });
    }

    res.json({ 
      pdf_url: agreement.pdf_url,
      agreement_no: agreement.agreement_no
    });

  } catch (error) {
    console.error('Get PDF URL error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
