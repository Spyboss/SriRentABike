import twilio from 'twilio';
import { CreateAgreementRequest } from '../../models/types';

/**
 * Service to handle WhatsApp notifications using Twilio API
 */
export class TwilioNotificationService {
  private static readonly ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
  private static readonly AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  private static readonly FROM_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
  private static readonly RECIPIENT_PHONE = process.env.ADMIN_NOTIFICATION_PHONE;

  /**
   * Sends a notification to the client when a new booking is created via Twilio
   */
  static async sendBookingAlert(agreementData: CreateAgreementRequest, agreementNo: string) {
    if (!this.ACCOUNT_SID || !this.AUTH_TOKEN || !this.RECIPIENT_PHONE) {
      console.warn('Twilio Notification Service: Missing credentials. Skipping notification.');
      return;
    }

    const client = twilio(this.ACCOUNT_SID, this.AUTH_TOKEN);
    const { tourist_data, requested_model, start_date, end_date } = agreementData;
    const customerName = `${tourist_data.first_name} ${tourist_data.last_name}`;
    const dateRange = `${start_date} to ${end_date}`;

    // Format the recipient number to ensure it has 'whatsapp:' prefix
    const to = this.RECIPIENT_PHONE.startsWith('whatsapp:') 
      ? this.RECIPIENT_PHONE 
      : `whatsapp:${this.RECIPIENT_PHONE}`;

    try {
      const message = await client.messages.create({
        body: `*New Booking Alert!* 🚲\n\n*Customer:* ${customerName}\n*Model:* ${requested_model || 'Standard Bike'}\n*Dates:* ${dateRange}\n*Agreement No:* ${agreementNo}\n\nPlease check the admin dashboard for details.`,
        from: this.FROM_NUMBER,
        to: to
      });

      console.log(`Twilio WhatsApp notification sent successfully. SID: ${message.sid}`);
      return message;
    } catch (error) {
      console.error('Failed to send Twilio WhatsApp notification:', error);
      throw error; // Rethrow to allow fallback handling in the route
    }
  }
}
