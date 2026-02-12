# Real-Time Notification System Strategy

This document outlines the research, technical requirements, and implementation strategy for alerting the SriRentABike client instantly when a new booking is completed on `https://www.srirentabike.com/rent`.

## 1. Overview
The goal is to move away from traditional email notifications and implement instant messaging alerts (WhatsApp/SMS) to ensure the client can respond to rental requests immediately, especially while on the move in Tangalle.

---

## 2. Comparison of Viable Solutions

### Solution 1: Meta WhatsApp Cloud API (Recommended)
Direct integration with Meta's infrastructure.

- **Pros:**
  - Lowest per-message cost (only Meta's official utility rates).
  - Rich notifications (can include links to the signed agreement PDF).
  - Highly reliable and scalable.
- **Cons:**
  - Requires Meta Business Verification.
  - Complex initial setup (Template approvals, Webhooks).
- **Estimated Cost:** ~$0.01 - $0.04 per utility message (varies by market).
- **Technical Requirement:** Node.js `axios` or Meta's SDK, Webhook for status tracking.

### Solution 2: Twilio WhatsApp Business API
Using Twilio as a Business Solution Provider (BSP).

- **Pros:**
  - Faster setup than Meta Direct.
  - Excellent documentation and developer tools.
  - Unified platform for SMS and WhatsApp.
- **Cons:**
  - Higher cost ($0.005 markup per message + Meta fees).
  - Subject to Twilio's platform stability.
- **Estimated Cost:** Meta Rate + $0.005 per message.
- **Technical Requirement:** `twilio` npm package, API Key, Account SID.

### Solution 3: Local SMS Gateway (e.g., Notify.lk / Dialog ESMS)
Direct SMS to the client's phone via Sri Lankan providers.

- **Pros:**
  - Works without mobile data/internet on the receiver's end.
  - Lowest cost for local (Sri Lankan) numbers.
  - Simple API (REST/HTTP).
- **Cons:**
  - No rich media (text only).
  - No "read" receipts.
  - Limited international scalability.
- **Estimated Cost:** ~LKR 0.50 - 1.50 per SMS.
- **Technical Requirement:** Simple HTTP POST request to the provider's endpoint.

---

## 3. Recommended Implementation Strategy

We have implemented a **Hybrid Approach** with Twilio as the primary provider:
1. **Primary:** Twilio WhatsApp API for quick delivery and ease of management.
2. **Backup/Fallback:** Meta WhatsApp Cloud API as a secondary channel if Twilio fails.
3. **Tertiary Fallback:** Simple console logging of errors for all failed delivery attempts.

### Implementation Steps
1. **Account Setup:**
   - Register on [Meta for Developers](https://developers.facebook.com/).
   - Set up a WhatsApp Business Account (WABA).
   - Verify Business identity.
2. **Template Creation:**
   - Create a "Utility" template: 
     *"New Booking Alert! 🚲\nCustomer: {{1}}\nModel: {{2}}\nDates: {{3}} to {{4}}\nView details: {{5}}"*
3. **Backend Integration:**
   - Add `WHATSAPP_API_KEY` and `WHATSAPP_PHONE_ID` to `.env`.
   - Modify `api/src/routes/agreements.ts` to trigger the API call after successful DB insertion.
4. **Security & Compliance:**
   - Use environment variables for all API keys.
   - Implement rate limiting to prevent spam.
   - Ensure tourist data is transmitted over HTTPS only.

---

## 4. Technical Requirements & Credentials

| Provider | Required Credentials | API Endpoint |
|----------|----------------------|--------------|
| **Meta** | Access Token, Phone Number ID, WABA ID | `https://graph.facebook.com/v21.0/{phone-id}/messages` |
| **Twilio** | Account SID, Auth Token, Twilio Phone Number | `https://api.twilio.com/2010-04-01/...` |
| **Notify.lk**| API Key, User ID, Sender ID | `https://app.notify.lk/api/v1/send` |

---

## 5. Testing & Fallback Procedures

### Testing Plan
1. **Sandbox Testing:** Use Meta/Twilio sandbox numbers to verify message formatting.
2. **End-to-End Test:** Submit a dummy booking on `srirentabike.com/rent` and verify the alert on the client's phone.
3. **Template Validation:** Ensure all dynamic variables (customer name, dates) are mapped correctly.

### Fallback Mechanism
```typescript
try {
  await sendWhatsAppNotification(bookingData);
} catch (error) {
  console.error("WhatsApp failed, triggering SMS fallback...");
  await sendSMSNotification(bookingData);
}
```

---

## 6. Compliance
- **GDPR/Data Privacy:** Do not include full passport numbers in the notification. Use a link to the secure admin dashboard instead.
- **WhatsApp Policy:** Messages must be transactional (Utility category) and not promotional to avoid account suspension.
