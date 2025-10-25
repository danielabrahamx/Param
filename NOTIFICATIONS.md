# Notification Service Documentation

## Overview

The Notification Service is a robust, multi-channel notification system for the Paramify platform. It handles email, SMS, push notifications, in-app messages, and webhook deliveries with built-in retry logic and dead-letter queue handling.

## Architecture

### Components

- **Email Service**: Integrates with SendGrid for transactional email
- **SMS Service**: Integrates with Twilio for SMS delivery
- **Push Service**: Web push notifications using Web Push standard
- **Webhook Service**: HMAC-signed webhook delivery to partners
- **Notification Worker**: BullMQ-based job queue for async processing
- **Trigger Worker**: Event-driven notification orchestration

### Database Schema

#### notification_logs
Tracks all notification delivery attempts with status, retries, and failures.

```sql
- id (UUID, PK)
- userId (varchar) - User who received notification
- type (varchar) - email, sms, push, webhook
- channel (varchar) - sendgrid, twilio, web-push, custom
- recipient (varchar) - Email, phone, URL, etc.
- subject (varchar) - Email subject
- content (text) - Message body
- metadata (jsonb) - Additional data
- status (varchar) - pending, sent, failed, delivered
- deliveredAt (timestamp) - When delivered
- failureReason (text) - Error details
- retryCount (int) - Attempts made
- maxRetries (int) - Max attempts allowed
- createdAt (timestamp)
- updatedAt (timestamp)
```

#### notification_preferences
User preferences for notification channels.

```sql
- id (UUID, PK)
- userId (varchar, UNIQUE) - User identifier
- enableEmail (boolean) - Email notifications enabled
- enableSms (boolean) - SMS notifications enabled
- enablePush (boolean) - Push notifications enabled
- enableInApp (boolean) - In-app notifications enabled
- emailAddress (varchar) - Email for delivery
- phoneNumber (varchar) - Phone for SMS
- floodAlertThreshold (int) - Flood level threshold (default 2400)
- policyExpirationWarningDays (int) - Days before expiration to notify (default 7)
- createdAt (timestamp)
- updatedAt (timestamp)
```

#### notification_templates
Event-specific notification templates with i18n support.

```sql
- id (UUID, PK)
- eventType (varchar, UNIQUE) - policy_created, claim_triggered, etc.
- emailSubject (varchar)
- emailTemplate (text) - HTML with {{variable}} placeholders
- smsTemplate (text) - SMS with {{variable}} placeholders
- pushTitle (varchar)
- pushBody (text)
- inAppTitle (varchar)
- inAppContent (text)
- language (varchar) - Language code (default 'en')
- createdAt (timestamp)
- updatedAt (timestamp)
```

#### in_app_notifications
In-app notifications stored in database.

```sql
- id (UUID, PK)
- userId (varchar) - User identifier
- title (varchar)
- content (text)
- type (varchar) - info, warning, alert, success
- relatedId (varchar) - Policy ID, claim ID, etc.
- isRead (boolean) - Read status
- readAt (timestamp)
- expiresAt (timestamp) - Auto-delete after
- createdAt (timestamp)
```

#### webhook_subscriptions
Partner webhook registrations.

```sql
- id (UUID, PK)
- partnerId (varchar) - Partner identifier
- webhookUrl (varchar) - HTTPS URL for callbacks
- events (text[]) - Array of subscribed events
- isActive (boolean)
- secret (varchar) - HMAC secret
- createdAt (timestamp)
- updatedAt (timestamp)
```

#### dead_letter_queue
Failed notifications that exhausted retries.

```sql
- id (UUID, PK)
- notificationLogId (UUID, FK) - Reference to notification_logs
- jobData (jsonb) - Original job data
- error (text) - Error message
- attemptedAt (timestamp)
- resolvedAt (timestamp) - When manually resolved
- isResolved (boolean)
- createdAt (timestamp)
```

## API Endpoints

### Send Notification

**POST** `/api/v1/notifications/send`

Send a notification directly without using event triggers.

**Request:**
```json
{
  "userId": "user-123",
  "type": "email",
  "recipient": "user@example.com",
  "subject": "Policy Created",
  "content": "<h1>Your policy is active</h1>",
  "metadata": {
    "policyId": "policy-456",
    "coverage": 50000
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification queued",
  "jobId": "job-uuid"
}
```

### Trigger Event-Based Notifications

**POST** `/api/v1/notifications/trigger`

Trigger notifications based on event type (uses templates and user preferences).

**Request:**
```json
{
  "eventType": "policy_created",
  "userId": "user-123",
  "data": {
    "policyId": "policy-456",
    "coverage": 50000,
    "premium": 5000,
    "policyHolder": "John Doe"
  }
}
```

**Supported Events:**
- `policy_created` - New policy created
- `premium_paid` - Premium payment received
- `flood_alert` - Flood level approaching threshold (>80% of 3000)
- `claim_triggered` - Claim automatically triggered
- `claim_approved` - Claim approved for payout
- `claim_denied` - Claim denied
- `policy_expiring` - Policy expiring soon (configurable days)
- `payout_processed` - Payout completed

**Response:**
```json
{
  "success": true,
  "message": "Trigger event queued",
  "jobId": "job-uuid"
}
```

### Get Notification Logs

**GET** `/api/v1/notifications/logs/:userId`

Retrieve notification delivery logs for a user.

**Query Parameters:**
- `limit` (int, default 50) - Records per page
- `offset` (int, default 0) - Pagination offset

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "notif-uuid",
      "userId": "user-123",
      "type": "email",
      "channel": "sendgrid",
      "recipient": "user@example.com",
      "subject": "Policy Created",
      "status": "sent",
      "deliveredAt": "2025-10-24T10:30:00Z",
      "createdAt": "2025-10-24T10:29:00Z"
    }
  ],
  "count": 1
}
```

### Get In-App Notifications

**GET** `/api/v1/notifications/in-app/:userId`

Retrieve in-app notifications for a user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "in-app-uuid",
      "userId": "user-123",
      "title": "Policy Created",
      "content": "Your flood insurance policy is now active",
      "type": "info",
      "isRead": false,
      "createdAt": "2025-10-24T10:30:00Z"
    }
  ],
  "count": 1
}
```

### Mark In-App Notification as Read

**PUT** `/api/v1/notifications/in-app/:id/read`

Mark a specific in-app notification as read.

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

## Metrics Endpoint

### Prometheus Metrics

**GET** `/metrics`

Exposed in Prometheus text format for scraping.

**Metrics:**
- `notifications_sent_total` - Total sent in last hour
- `notifications_failed_total` - Total failed in last hour
- `notifications_pending_total` - Current pending count
- `delivery_success_rate` - Percentage of successful deliveries
- `average_delivery_time_ms` - Average delivery time
- `notifications_by_type{type="email|sms|push"}` - Count by type
- `notifications_by_channel{channel="sendgrid|twilio|web-push"}` - Count by channel

### JSON Metrics

**GET** `/metrics/json`

Same metrics in JSON format.

```json
{
  "timestamp": 1729779600000,
  "notifications_sent_total": 150,
  "notifications_failed_total": 5,
  "notifications_pending_total": 12,
  "notifications_by_type": {
    "email": 100,
    "sms": 30,
    "push": 20
  },
  "notifications_by_channel": {
    "sendgrid": 100,
    "twilio": 30,
    "web-push": 20
  },
  "delivery_success_rate": 96.77,
  "average_delivery_time_ms": 2500,
  "queue_lengths": {
    "notifications": 12
  }
}
```

## Environment Variables

```env
# Database
DATABASE_URL=postgres://user:password@localhost:5432/param

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Server
PORT=3004
NODE_ENV=production

# SendGrid
SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_FROM_EMAIL=noreply@paramify.io

# Twilio
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Web Push
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:support@paramify.io

# Feature Flags
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_SMS_NOTIFICATIONS=true
ENABLE_PUSH_NOTIFICATIONS=true
ENABLE_WEBHOOKS=true
```

## Retry Logic

### Exponential Backoff

Failed notifications are retried with exponential backoff:
- Retry 1: 2s delay
- Retry 2: 4s delay
- Retry 3: 8s delay

After 3 retries, the notification is moved to the dead-letter queue for manual review.

### Dead-Letter Queue

The DLQ stores failed notifications permanently for:
- Troubleshooting delivery issues
- Manual retries
- Analytics on failure patterns

## Notification Triggers

### Trigger Flow

1. Event occurs (policy created, claim approved, etc.)
2. Trigger enqueued to `triggerQueue`
3. Trigger worker retrieves user preferences and templates
4. Multi-channel notifications enqueued based on preferences
5. Notification worker delivers to each channel

### Template Variables

Templates use `{{variable}}` syntax for substitution:

```
Policy Created Email Template:
Subject: Your Flood Insurance Policy {{policyId}} is Active

Body:
Dear {{policyHolder}},

Your flood insurance policy is now active.

Coverage: {{coverage}} USD
Premium: {{premium}} USD

Thank you for choosing Paramify.
```

## Webhook Delivery

### Signature Verification

Webhooks are signed with HMAC-SHA256:

```
Header: X-Webhook-Signature
Value: HMAC-SHA256(secret, timestamp.payload)

Header: X-Webhook-Timestamp
Value: Unix timestamp when webhook was sent
```

### Webhook Payload

```json
{
  "event": "policy_created",
  "timestamp": 1729779600,
  "data": {
    "policyId": "policy-456",
    "userId": "user-123",
    "coverage": 50000,
    "premium": 5000
  }
}
```

### Webhook Retry

Webhooks are retried on:
- Network timeouts (> 10s)
- HTTP 5xx responses
- Connection refused

Max 3 retries with exponential backoff.

## Deployment

### Docker

```bash
# Build
docker build -t notification-service:latest ./notification-service

# Run
docker run -e DATABASE_URL=... -e SENDGRID_API_KEY=... notification-service:latest
```

### Docker Compose

Services are included in root `docker-compose.yml`:

```bash
docker compose up notification-service analytics-service
```

### Health Checks

**Liveness:** `GET /health`
**Readiness:** `GET /health/ready`

## Troubleshooting

### No Notifications Delivered

1. Check `notification_logs` table for status
2. Verify user preferences enabled correct channel
3. Check service logs for delivery errors
4. Verify SendGrid/Twilio credentials in env vars

### High Failure Rate

1. Check DLQ table for patterns
2. Verify Redis connection
3. Monitor queue depth with `/metrics/json`
4. Check SendGrid/Twilio rate limits

### Stuck Jobs

1. Check BullMQ dashboard (if available)
2. Manually move from DLQ to notification_logs
3. Restart worker to process

## Best Practices

- Store sensitive credentials in secrets manager, not .env
- Monitor delivery success rates and set up alerts
- Regularly clean up old notification logs (>30 days)
- Test templates with template variables before deploying
- Implement rate limiting on notification API endpoints
- Use webhook subscriptions for partner integrations
