import https from 'https';
import { CreateAgreementRequest } from '../../models/types';
import { telegramConfig, validateTelegramConfig } from '../../config/telegram-config';

/**
 * Telegram Bot API notification service.
 * Sends rich, formatted booking alerts to a Telegram channel/group.
 *
 * Features:
 * - Retry with exponential backoff (configurable, default 3 attempts)
 * - In-memory sliding-window rate limiter
 * - MarkdownV2 formatted messages with emojis
 * - Webhook secret validation helper
 */
export class TelegramNotificationService {
    // ── Rate limiter state ──────────────────────────────────────────────
    private static messageTimestamps: number[] = [];

    // ── Public API ──────────────────────────────────────────────────────

    /**
     * Send a booking alert notification to Telegram.
     * Includes retry logic with exponential backoff.
     */
    static async sendBookingAlert(
        agreementData: CreateAgreementRequest,
        agreementNo: string
    ): Promise<void> {
        if (!telegramConfig.enabled) {
            console.log('Telegram notifications are disabled via config. Skipping.');
            return;
        }

        if (!validateTelegramConfig()) {
            return;
        }

        // Rate limit check
        if (!this.checkRateLimit()) {
            console.warn('Telegram rate limit reached. Notification skipped to prevent spam.');
            return;
        }

        const message = this.formatBookingMessage(agreementData, agreementNo);

        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= telegramConfig.maxRetries; attempt++) {
            try {
                await this.sendMessage(message);
                console.log(
                    `✅ Telegram notification sent successfully for booking ${agreementNo} (attempt ${attempt})`
                );
                return;
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                console.error(
                    `❌ Telegram send attempt ${attempt}/${telegramConfig.maxRetries} failed:`,
                    lastError.message
                );

                if (attempt < telegramConfig.maxRetries) {
                    const delayMs = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s …
                    console.log(`   Retrying in ${delayMs}ms…`);
                    await this.sleep(delayMs);
                }
            }
        }

        throw lastError ?? new Error('All Telegram notification attempts failed');
    }

    /**
     * Validate that an incoming webhook request carries the correct secret.
     * Useful if you later configure a Telegram webhook to point at your server.
     */
    static validateWebhookSecret(token: string): boolean {
        if (!telegramConfig.webhookSecret) {
            console.warn('Telegram webhook secret is not configured. Rejecting request.');
            return false;
        }
        return token === telegramConfig.webhookSecret;
    }

    // ── Internals ───────────────────────────────────────────────────────

    /**
     * Format a booking into a MarkdownV2 message with emojis.
     */
    private static formatBookingMessage(
        data: CreateAgreementRequest,
        agreementNo: string
    ): string {
        const { tourist_data, requested_model, start_date, end_date, daily_rate, total_amount, deposit, outside_area } = data;
        const customerName = `${tourist_data.first_name} ${tourist_data.last_name}`;

        // Build lines — each value is escaped for MarkdownV2
        const lines = [
            `🚲 *New Booking Alert\\!*`,
            ``,
            `👤 *Customer:* ${esc(customerName)}`,
            `📧 *Email:* ${esc(tourist_data.email)}`,
            `📱 *Phone:* ${esc(tourist_data.phone_number)}`,
        ];

        if (tourist_data.hotel_name) {
            lines.push(`🏨 *Hotel:* ${esc(tourist_data.hotel_name)}`);
        }

        lines.push(
            ``,
            `🏍️ *Bike Model:* ${esc(requested_model || 'Standard Bike')}`,
            `📅 *Dates:* ${esc(start_date)} → ${esc(end_date)}`,
            `💰 *Daily Rate:* ${esc(String(daily_rate))}`,
            `💵 *Total:* ${esc(String(total_amount))}`,
            `🔒 *Deposit:* ${esc(String(deposit))}`,
            `📍 *Outside Area:* ${outside_area ? 'Yes' : 'No'}`,
            ``,
            `📋 *Agreement:* ${esc(agreementNo)}`,
            `🔖 *Status:* Pending`,
        );

        return lines.join('\n');
    }

    /**
     * POST to the Telegram Bot API sendMessage endpoint.
     */
    private static sendMessage(text: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const payload = JSON.stringify({
                chat_id: telegramConfig.chatId,
                text,
                parse_mode: 'MarkdownV2',
                disable_web_page_preview: true,
            });

            const options: https.RequestOptions = {
                hostname: 'api.telegram.org',
                path: `/bot${telegramConfig.botToken}/sendMessage`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload),
                },
            };

            const req = https.request(options, (res) => {
                let body = '';
                res.on('data', (chunk: Buffer | string) => {
                    body += chunk;
                });
                res.on('end', () => {
                    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                        resolve();
                    } else {
                        reject(
                            new Error(
                                `Telegram API responded with ${res.statusCode}: ${body}`
                            )
                        );
                    }
                });
            });

            req.on('error', (err) => reject(err));
            req.write(payload);
            req.end();
        });
    }

    // ── Rate limiter ────────────────────────────────────────────────────

    /**
     * Sliding-window rate limiter.
     * Returns true if the send is allowed; false if the limit is hit.
     */
    private static checkRateLimit(): boolean {
        const now = Date.now();
        const windowMs = 60_000; // 1 minute

        // Prune expired timestamps
        this.messageTimestamps = this.messageTimestamps.filter(
            (ts) => now - ts < windowMs
        );

        if (this.messageTimestamps.length >= telegramConfig.rateLimitPerMin) {
            return false;
        }

        this.messageTimestamps.push(now);
        return true;
    }

    // ── Helpers ─────────────────────────────────────────────────────────

    private static sleep(ms: number): Promise<void> {
        return new Promise((r) => setTimeout(r, ms));
    }
}

// ── MarkdownV2 escape helper ────────────────────────────────────────────
// Telegram MarkdownV2 requires escaping these characters:
// _ * [ ] ( ) ~ ` > # + - = | { } . !
function esc(text: unknown): string {
    return String(text ?? '').replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}
