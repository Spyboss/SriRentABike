# Real-Time Notification System Strategy

Instant alerts via **Telegram Bot API** when a new booking is completed on `srirentabike.com/rent`.

---

## Architecture

```
Customer submits form → API creates agreement in Supabase → TelegramNotificationService
  → Telegram Bot API (sendMessage) → Admin Telegram Channel
```

Notifications are fired in the background (async IIFE) so the HTTP response to the customer is never blocked.

---

## Why Telegram?

| | Telegram Bot API | Twilio WhatsApp | Meta Cloud API |
|---|---|---|---|
| **Cost** | Free | ~$0.005+ per msg | ~$0.01-0.04 per msg |
| **Setup** | 2 min via @BotFather | Business verification | Meta Business verification |
| **Rich formatting** | MarkdownV2, emojis | Limited templates | Template approval required |
| **Rate limits** | 30 msg/sec per channel | Account-level | Tiered |
| **Dependencies** | None (Node `https`) | `twilio` npm package | `axios` or raw HTTP |

---

## Service Features

1. **Retry with exponential backoff** — up to 3 attempts (1s → 2s → 4s)
2. **Rate limiting** — Sliding-window, 20 msg/min (configurable)
3. **MarkdownV2 formatting** with emojis for readable alerts
4. **Webhook secret validation** for future webhook integration
5. **Graceful degradation** — missing config skips notifications with a warning

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `TELEGRAM_BOT_TOKEN` | ✅ | — | Token from @BotFather |
| `TELEGRAM_CHAT_ID` | ✅ | — | Channel/group chat ID |
| `TELEGRAM_WEBHOOK_SECRET` | ❌ | — | For webhook validation |
| `TELEGRAM_NOTIFICATIONS_ENABLED` | ❌ | `true` | Kill switch |
| `TELEGRAM_MAX_RETRIES` | ❌ | `3` | Retry attempts |
| `TELEGRAM_RATE_LIMIT_PER_MIN` | ❌ | `20` | Max msgs per minute |

---

## Setup Guide

1. Open Telegram → message [@BotFather](https://t.me/BotFather) → `/newbot`
2. Copy the bot token → set `TELEGRAM_BOT_TOKEN` in `.env`
3. Create a channel or group → add the bot as admin
4. Get the chat ID (forward a message to [@userinfobot](https://t.me/userinfobot) or use the Telegram API `getUpdates` endpoint)
5. Set `TELEGRAM_CHAT_ID` in `.env`

---

## Testing

```bash
cd api
npx ts-node src/services/notifications/test-telegram.ts
```

This sends a dummy booking alert and measures delivery time.

---

## Compliance

- **GDPR/Data Privacy:** Full passport numbers are NOT included in the notification. Messages link to the admin dashboard for sensitive data.
- **Telegram ToS:** All messages are transactional notifications, not promotional.
