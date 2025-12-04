# Automation Logic Module - Implementation Summary

## Overview
Comprehensive automation system with scheduled Cloud Functions for rain checks, stalled job detection, inventory alerts, and collection reminders. Includes SMS (Twilio) and email capabilities.

## Features Implemented

### 1. Rain Check Automation ✅
**Location:** `functions/automations.js` - `rainCheckAutomation`

- ✅ Scheduled: Daily at 6 AM (America/Denver)
- ✅ Checks weather for scheduled jobs
- ✅ Reschedules jobs if rain is forecast
- ✅ Sends email notification to customer
- ✅ Sends SMS notification (if phone available)
- ✅ Creates admin notification
- ✅ Reschedules to 3 days later

**Trigger:** Scheduled Cloud Function (daily at 6 AM)

### 2. Stalled Job Detection ✅
**Location:** `functions/automations.js` - `stalledJobDetection`

- ✅ Scheduled: Daily at 8 AM
- ✅ Detects jobs that haven't progressed in 7+ days
- ✅ Sends email alert to customer
- ✅ Creates admin notification
- ✅ Marks job as stalled with metadata

**Trigger:** Scheduled Cloud Function (daily at 8 AM)

### 3. Inventory Alert Automation ✅
**Location:** `functions/automations.js` - `inventoryAlertAutomation`

- ✅ Scheduled: Daily at 9 AM
- ✅ Checks all inventory items
- ✅ Alerts when stock < reorder point
- ✅ Sends email to all admins
- ✅ Creates notification
- ✅ Prevents duplicate alerts

**Trigger:** Scheduled Cloud Function (daily at 9 AM)

### 4. Collection Bot Automation ✅
**Location:** `functions/automations.js` - `collectionBotAutomation`

- ✅ Scheduled: Daily at 10 AM
- ✅ Finds overdue invoices
- ✅ Sends payment reminders at 7, 14, 21, 30 days overdue
- ✅ Sends email reminders
- ✅ Sends SMS for 30+ days overdue
- ✅ Logs reminders in `invoice_reminders` collection

**Trigger:** Scheduled Cloud Function (daily at 10 AM)

### 5. SMS Integration (Twilio) ✅
**Location:** `functions/automations.js` - `sendSMS`

- ✅ Twilio integration
- ✅ Configurable via Firebase Functions config
- ✅ Fallback to logging if not configured
- ✅ Used for:
  - Rain check notifications
  - Collection reminders (30+ days)

**Configuration:**
```bash
firebase functions:config:set twilio.account_sid="ACxxx"
firebase functions:config:set twilio.auth_token="xxx"
firebase functions:config:set twilio.phone_number="+1234567890"
```

### 6. Email Templates ✅
**Location:** `functions/automations.js` - `emailTemplates`

- ✅ Rain Check template
- ✅ Stalled Job template
- ✅ Inventory Alert template
- ✅ Collection Reminder template
- ✅ HTML formatted emails
- ✅ Placeholder for SendGrid/Mailgun integration

**Email Service Integration:**
- Currently logs emails (placeholder)
- Ready for SendGrid, Mailgun, or similar
- Template structure in place

### 7. Automation UI ✅
**Location:** `frontend/src/pages/automation/Automation.jsx`

- ✅ List all automations
- ✅ Enable/disable toggles
- ✅ Create custom automations
- ✅ Execution logs display
- ✅ Backend integration
- ✅ Visual icons for automation types

## Cloud Functions Schedule

| Automation | Schedule | Time Zone |
|------------|----------|-----------|
| Rain Check | Daily 6 AM | America/Denver |
| Stalled Job | Daily 8 AM | America/Denver |
| Inventory Alert | Daily 9 AM | America/Denver |
| Collection Bot | Daily 10 AM | America/Denver |

## Email Templates

### Rain Check Email
- Subject: "Job Rescheduled Due to Weather - Job {jobId}"
- Content: New date, address, confirmation message

### Stalled Job Email
- Subject: "Action Required: Job {jobId} Has Not Progressed"
- Content: Days stalled, address, action required

### Inventory Alert Email
- Subject: "Low Stock Alert: {itemName}"
- Content: SKU, current stock, reorder point

### Collection Reminder Email
- Subject: "Payment Reminder: Invoice {invoiceNumber}"
- Content: Days overdue, amount due, payment options

## SMS Messages

### Rain Check SMS
```
DTRS PRO: Job {jobId} rescheduled to {newDate} due to weather. Check email for details.
```

### Collection Reminder SMS (30+ days)
```
DTRS PRO: Invoice {invoiceNumber} is {days} days overdue. Amount: ${amount}. Please pay at your earliest convenience.
```

## Firestore Collections

- `automations` - Automation rule definitions
- `automation_logs` - Execution logs
- `invoice_reminders` - Collection reminder history
- `notifications` - System notifications
- `schedule` - Schedule entries (for rain check)
- `jobs` - Job records (for stalled detection)
- `invoices` - Invoice records (for collection bot)
- `inventory_items` - Inventory items (for alerts)

## Configuration

### Twilio Setup
```bash
cd functions
npm install twilio
firebase functions:config:set twilio.account_sid="ACxxx"
firebase functions:config:set twilio.auth_token="xxx"
firebase functions:config:set twilio.phone_number="+1234567890"
```

### Email Service Setup (SendGrid example)
```bash
npm install @sendgrid/mail
firebase functions:config:set sendgrid.api_key="SG.xxx"
```

Then update `sendEmail` function in `automations.js`:
```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
await sgMail.send({ to, from: 'noreply@dtrspro.com', subject, html: htmlBody });
```

## API Endpoints

- `GET /api/automation/` - List automations
- `POST /api/automation/` - Create automation
- `PUT /api/automation/{id}` - Update automation
- `DELETE /api/automation/{id}` - Delete automation
- `POST /api/automation/{id}/toggle` - Enable/disable
- `GET /api/automation/logs` - Get execution logs

## Automation Rules

### Built-in Automations (Scheduled)
1. **Rain Check** - Auto-reschedules jobs on rainy days
2. **Stalled Job** - Detects and alerts on stalled jobs
3. **Inventory Alert** - Low stock notifications
4. **Collection Bot** - Payment reminder system

### Custom Automations
- Can be created via UI
- Supports various triggers and actions
- Enable/disable toggle
- Execution logging

## Workflow

### Rain Check Workflow
1. Function runs at 6 AM daily
2. Checks weather for today/tomorrow schedules
3. If rain forecast:
   - Reschedules to 3 days later
   - Sends email to customer
   - Sends SMS (if phone available)
   - Creates notification
4. Logs rescheduled count

### Stalled Job Workflow
1. Function runs at 8 AM daily
2. Checks all active jobs
3. Finds jobs not updated in 7+ days
4. Sends email to customer
5. Creates admin notification
6. Marks job as stalled

### Inventory Alert Workflow
1. Function runs at 9 AM daily
2. Checks all inventory items
3. Finds items below reorder point
4. Sends email to all admins
5. Creates notification
6. Marks alert as sent (prevents duplicates)

### Collection Bot Workflow
1. Function runs at 10 AM daily
2. Finds overdue invoices
3. Checks days overdue (7, 14, 21, 30)
4. Sends email reminder
5. Sends SMS if 30+ days overdue
6. Logs reminder in database

## Files Created/Modified

### New Files
- `functions/automations.js` - All automation logic
- `AUTOMATION_LOGIC_IMPLEMENTATION.md` - This documentation

### Modified Files
- `functions/index.js` - Added automation exports
- `functions/package.json` - Added Twilio dependency
- `frontend/src/pages/automation/Automation.jsx` - Enhanced UI

## Next Steps

1. **Configure Twilio:**
   ```bash
   firebase functions:config:set twilio.account_sid="ACxxx"
   firebase functions:config:set twilio.auth_token="xxx"
   firebase functions:config:set twilio.phone_number="+1234567890"
   ```

2. **Configure Email Service:**
   - Install SendGrid or Mailgun
   - Update `sendEmail` function
   - Set API keys in Functions config

3. **Deploy Functions:**
   ```bash
   cd functions
   npm install
   firebase deploy --only functions
   ```

4. **Test Automations:**
   - Manually trigger functions for testing
   - Verify email/SMS delivery
   - Check execution logs

## Testing

1. **Rain Check:**
   - Create schedule entry with rain forecast
   - Wait for 6 AM or trigger manually
   - Verify rescheduling and notifications

2. **Stalled Job:**
   - Create job and don't update for 7+ days
   - Verify alert is sent

3. **Inventory Alert:**
   - Set item below reorder point
   - Verify admin receives alert

4. **Collection Bot:**
   - Create overdue invoice
   - Verify reminders sent at 7, 14, 21, 30 days


