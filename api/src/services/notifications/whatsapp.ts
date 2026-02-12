import https from 'https';
import { CreateAgreementRequest } from '../../models/types';

/**
 * Service to handle WhatsApp notifications using Meta Cloud API
 */
export class NotificationService {
  private static readonly WHATSAPP_API_HOST = 'graph.facebook.com';
  private static readonly WHATSAPP_API_PATH = '/v21.0';
  private static readonly ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
  private static readonly PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
  private static readonly RECIPIENT_PHONE = process.env.ADMIN_NOTIFICATION_PHONE; // Client's phone number

  /**
   * Sends a notification to the client when a new booking is created
   */
  static async sendBookingAlert(agreementData: CreateAgreementRequest, agreementNo: string): Promise<any> {
    if (!this.ACCESS_TOKEN || !this.PHONE_NUMBER_ID || !this.RECIPIENT_PHONE) {
      console.warn('WhatsApp Notification Service: Missing credentials. Skipping notification.');
      return;
    }

    const { tourist_data, requested_model, start_date, end_date } = agreementData;
    const customerName = `${tourist_data.first_name} ${tourist_data.last_name}`;
    const dateRange = `${start_date} to ${end_date}`;

    const postData = JSON.stringify({
      messaging_product: 'whatsapp',
      to: this.RECIPIENT_PHONE,
      type: 'template',
      template: {
        name: 'new_booking_alert',
        language: {
          code: 'en_US'
        },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: customerName },
              { type: 'text', text: requested_model || 'Standard Bike' },
              { type: 'text', text: dateRange },
              { type: 'text', text: agreementNo }
            ]
          }
        ]
      }
    });

    const options = {
      hostname: this.WHATSAPP_API_HOST,
      path: `${this.WHATSAPP_API_PATH}/${this.PHONE_NUMBER_ID}/messages`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`WhatsApp notification sent successfully for booking ${agreementNo}`);
            resolve(JSON.parse(data));
          } else {
            console.error(`WhatsApp API Error (${res.statusCode}):`, data);
            reject(new Error(`WhatsApp API Error: ${data}`));
          }
        });
      });

      req.on('error', (e) => {
        console.error('Failed to send WhatsApp notification:', e);
        reject(e);
      });

      req.write(postData);
      req.end();
    });
  }
}
