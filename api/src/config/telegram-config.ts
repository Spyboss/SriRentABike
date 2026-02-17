/**
 * Telegram Bot API Configuration
 * Centralized config for the Telegram notification system.
 */

export const telegramConfig = {
  /** Bot token from @BotFather */
  botToken: process.env.TELEGRAM_BOT_TOKEN || '',

  /** Target chat/channel ID for notifications */
  chatId: process.env.TELEGRAM_CHAT_ID || '',

  /** Secret for validating incoming webhook requests */
  webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || '',

  /** Global on/off switch for notifications */
  enabled: (process.env.TELEGRAM_NOTIFICATIONS_ENABLED ?? 'true') === 'true',

  /** Max retry attempts for failed sends */
  maxRetries: parseInt(process.env.TELEGRAM_MAX_RETRIES || '3', 10),

  /** Max messages allowed per minute (rate limiting) */
  rateLimitPerMin: parseInt(process.env.TELEGRAM_RATE_LIMIT_PER_MIN || '20', 10),
} as const;

/**
 * Validates that required Telegram config vars are present.
 * Logs an actionable warning if anything is missing.
 * @returns true if the config is valid and notifications can be sent
 */
export function validateTelegramConfig(): boolean {
  const missing: string[] = [];

  if (!telegramConfig.botToken) missing.push('TELEGRAM_BOT_TOKEN');
  if (!telegramConfig.chatId) missing.push('TELEGRAM_CHAT_ID');

  if (missing.length > 0) {
    console.warn(
      `⚠️  Telegram Notification Service: Missing required env vars: ${missing.join(', ')}. ` +
      `Notifications will be skipped. Set these in your .env file.`
    );
    return false;
  }

  return true;
}
