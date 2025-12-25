import puppeteer from 'puppeteer';
import { supabase } from '../config/database';
import { BRANDING } from '../config/branding';

export interface PDFData {
  agreement: {
    agreement_no: string;
    start_date: string;
    end_date: string;
    daily_rate: number;
    total_amount: number;
    deposit: number;
    signature_url: string;
  };
  tourist: {
    first_name: string;
    last_name: string;
    passport_no: string;
    nationality: string;
    home_address: string;
    phone_number: string;
    email: string;
    hotel_name?: string;
  };
  bike: {
    model: string;
    frame_no: string;
    plate_no: string;
  };
}

export class PDFService {
  private generateHTML(data: PDFData): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Rental Agreement - ${data.agreement.agreement_no}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        @page { size: A4; margin: 4mm; }
        
        body {
          font-family: Arial, sans-serif;
          font-size: 10px;
          line-height: 1.4;
          color: #000;
          background: white;
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 6px;
        }
        
        .header {
          text-align: center;
          margin-bottom: 8px;
          border-bottom: 2px solid #000;
          padding-bottom: 6px;
        }
        
        .logo-section {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 15px;
        }
        
        .logo {
          width: 60px;
          height: 60px;
          background: #fbbf24;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 15px;
          overflow: hidden;
        }
        
        .logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .company-name {
          font-size: 16px;
          font-weight: bold;
        }
        
        .company-name .highlight {
          color: #fbbf24;
        }
        
        .contact-info {
          text-align: center;
          margin-bottom: 10px;
          font-size: 12px;
        }
        
        .title {
          font-size: 16px;
          font-weight: bold;
          text-align: center;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        
        .section {
          margin-bottom: 10px;
          border: 1px solid #000;
          padding: 8px;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        .section-title {
          font-size: 11px;
          font-weight: bold;
          text-transform: uppercase;
          margin-bottom: 6px;
          background: #f5f5f5;
          padding: 5px;
        }
        
        .table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        .table th,
        .table td {
          border: 1px solid #000;
          padding: 4px;
          text-align: left;
          vertical-align: top;
          word-break: break-word;
          font-size: 10px;
        }
        
        .table th {
          background: #f5f5f5;
          font-weight: bold;
          text-transform: uppercase;
          width: 30%;
        }
        
        .signature-section {
          display: flex;
          justify-content: space-between;
          margin-top: 12px;
          padding-top: 6px;
          border-top: 1px solid #000;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        .signature-box {
          text-align: center;
          width: 45%;
        }
        
        .signature-line {
          border-bottom: 1px solid #000;
          margin: 8px 0 4px 0;
          height: 30px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        
        .signature-image {
          max-width: 100%;
          max-height: 28px;
          object-fit: contain;
        }
        
        .signature-label {
          font-size: 10px;
          margin-top: 5px;
        }
        
        .highlight-box {
          background: #f5f5f5;
          padding: 6px;
          border: 1px solid #000;
          margin-bottom: 8px;
        }
        
        .total-amount {
          font-size: 12px;
          font-weight: bold;
          text-align: right;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="logo-section">
            <div class="logo">
              <img src="${BRANDING.logo.url}" alt="${BRANDING.logo.alt}" />
            </div>
            <div class="company-name">
              <span class="highlight">SRI</span> RENT BIKE
            </div>
          </div>
          <div class="contact-info">
            +94704984008
          </div>
        </div>

        <!-- Title -->
        <h1 class="title">RENTAL AGREEMENT</h1>

        <!-- The Parties -->
        <div class="section">
          <div class="section-title">01 THE PARTIES TO THIS AGREEMENT</div>
          
          <div class="table">
            <table>
              <tr>
                <th>THE OWNER</th>
                <td>SRI RENT BIKE</td>
              </tr>
            </table>
          </div>
          
          <div class="table">
            <table>
              <tr>
                <th>FIRST NAME</th>
                <th>LAST NAME</th>
              </tr>
              <tr>
                <td>${data.tourist.first_name}</td>
                <td>${data.tourist.last_name}</td>
              </tr>
              <tr>
                <th>NATIONALITY</th>
                <th>DOCUMENT TYPE AND NUMBER</th>
              </tr>
              <tr>
                <td>${data.tourist.nationality}</td>
                <td>${data.tourist.passport_no}</td>
              </tr>
              <tr>
                <th colspan="2">HOME ADDRESS</th>
              </tr>
              <tr>
                <td colspan="2">${data.tourist.home_address}</td>
              </tr>
              <tr>
                <th>PHONE NUMBER(S)</th>
                <th>E-MAIL</th>
              </tr>
              <tr>
                <td>${data.tourist.phone_number}</td>
                <td>${data.tourist.email}</td>
              </tr>
              ${data.tourist.hotel_name ? `
              <tr>
                <th colspan="2">STAYING AT (HOTEL)</th>
              </tr>
              <tr>
                <td colspan="2">${data.tourist.hotel_name}</td>
              </tr>
              ` : ''}
            </table>
          </div>
        </div>

        <!-- The Object -->
        <div class="section">
          <div class="section-title">02 THE OBJECT OF THE RENTAL</div>
          <div class="table">
            <table>
              <tr>
                <th>TYPE OF VEHICLE</th>
                <th>MAKE</th>
                <th>MODEL</th>
                <th>COLOR</th>
              </tr>
              <tr>
                <td>Scooter</td>
                <td>-</td>
                <td>${data.bike.model}</td>
                <td>-</td>
              </tr>
              <tr>
                <th>PLATE NO</th>
                <th>ENGINE NO</th>
                <th>CHASSIS NO</th>
                <th>OPTIONS</th>
              </tr>
              <tr>
                <td>${data.bike.plate_no}</td>
                <td>-</td>
                <td>${data.bike.frame_no}</td>
                <td>HELMET<br>DOCUMENTS<br>FUEL TANK</td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Rental Period and Rate -->
        <div class="section">
          <div class="section-title">03 RENTAL PERIOD AND RATE</div>
          
          <div class="clause">
            <span class="clause-number">03.1.</span> The Owner agrees to rent the above-described vehicle or bike to the rental for the following period.
          </div>
          
          <div class="highlight-box">
            <strong>STARTING DATE AND TIME:</strong> ${new Date(data.agreement.start_date).toLocaleDateString()}<br>
            <strong>ENDING DATE AND TIME:</strong> ${new Date(data.agreement.end_date).toLocaleDateString()}
          </div>
          
          <div class="clause">
            <span class="clause-number">03.2.</span> The Rental merely agrees to return the above-described vehicle or bike to the pick up location no later than the date and time indicated above
          </div>
          
          <div class="clause">
            <span class="clause-number">03.3.</span> The Rental merely to pay the owner at the rate of
          </div>
          
          <div class="table">
            <table>
              <tr>
                <th>DAILY RATE</th>
                <th>NUMBER OF DAYS</th>
                <th>TOTAL AMOUNT</th>
              </tr>
              <tr>
                <td>$${data.agreement.daily_rate.toFixed(2)}</td>
                <td>${Math.ceil((new Date(data.agreement.end_date).getTime() - new Date(data.agreement.start_date).getTime()) / (1000 * 60 * 60 * 24))}</td>
                <td>$${data.agreement.total_amount.toFixed(2)}</td>
              </tr>
            </table>
          </div>
          
          <div class="clause">
            <span class="clause-number">03.4.</span> The Full Rental rate for the specified period stated in subject to payment before pickup time and is non-refundable.
          </div>
        </div>

        <!-- Deposit -->
        <div class="section">
          <div class="section-title">04 DEPOSIT</div>
          <div class="clause">
            <span class="clause-number">04.1.</span> The Rental further agrees to make a deposit of <strong>$${data.agreement.deposit.toFixed(2)}</strong> with the owner, said deposit to be used, in the event of loss or damage to the vehicle/scooter or equipment during the term of this motor vehicle/scooter rental agreement, to defray fully or partially the cost of necessary repairs or replacement.
          </div>
        </div>

        <!-- Signature Section -->
        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-line">
              <img src="${data.agreement.signature_url}" alt="Tourist Signature" class="signature-image">
            </div>
            <div class="signature-label">Signature: ${data.tourist.first_name} ${data.tourist.last_name}</div>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">Date: ${new Date().toLocaleDateString()}</div>
          </div>
        </div>

        <!-- Legal Disclaimer -->
        <div class="section">
          <div class="section-title">05 TERMS AND CONDITIONS</div>
          <div class="clause">
            The renter agrees to comply with all local traffic laws and regulations. The vehicle must be returned in the same condition as delivered, normal wear and tear excepted. 
            The renter is responsible for any fines, penalties, or damages incurred during the rental period. Insurance coverage, if applicable, is subject to the policy terms. 
            By signing, the renter acknowledges reading and agreeing to this agreement.
          </div>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  async generatePDF(data: PDFData): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      const html = this.generateHTML(data);
      
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      // Set PDF options for A4 format
      const pdfBuffer = await page.pdf({
        width: '210mm',
        height: '297mm',
        printBackground: true,
        preferCSSPageSize: true,
        scale: 0.85,
        margin: {
          top: '5mm',
          right: '5mm',
          bottom: '5mm',
          left: '5mm'
        }
      });

      return pdfBuffer;
    } finally {
      await browser.close();
    }
  }

  async uploadPDFToStorage(pdfBuffer: Buffer, agreementNo: string): Promise<string> {
    const fileName = `agreements/${agreementNo}-${Date.now()}.pdf`;
    
    const { error } = await supabase.storage
      .from('rental-agreements')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (error) {
      throw error;
    }

    const { data: publicUrlData } = supabase.storage
      .from('rental-agreements')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  }
}
