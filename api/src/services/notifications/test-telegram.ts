/**
 * Standalone test script for the Telegram notification service.
 *
 * Usage:
 *   cd api
 *   npx ts-node src/services/notifications/test-telegram.ts
 *
 * Requires TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in your .env
 */
import dotenv from 'dotenv';
dotenv.config();

import { TelegramNotificationService } from './telegram';
import { CreateAgreementRequest } from '../../models/types';

const dummyBooking: CreateAgreementRequest = {
    tourist_data: {
        first_name: 'Jane',
        last_name: 'Smith',
        passport_no: 'AB1234567',
        nationality: 'British',
        home_address: '42 Baker Street, London',
        phone_number: '+447700900000',
        email: 'jane.smith@example.com',
        hotel_name: 'Tangalle Bay Resort',
    },
    signature: 'data:image/png;base64,TEST',
    start_date: '2026-02-18',
    end_date: '2026-02-25',
    daily_rate: 3000,
    total_amount: 21000,
    deposit: 5000,
    requested_model: 'Honda Dio',
    outside_area: false,
};

async function main() {
    console.log('🧪 Sending test Telegram notification…\n');

    const start = Date.now();

    try {
        await TelegramNotificationService.sendBookingAlert(dummyBooking, 'SRI-TEST01');
        const elapsed = Date.now() - start;
        console.log(`\n✅ Test passed! Message delivered in ${elapsed}ms.`);

        if (elapsed > 5000) {
            console.warn('⚠️  Delivery exceeded the 5-second target.');
        }
    } catch (error) {
        console.error('\n❌ Test failed:', error);
        process.exit(1);
    }
}

main();
