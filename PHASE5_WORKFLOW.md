# Phase 5: Notification & Analytics Services - End-to-End Workflow

## 🎯 What Has Been Implemented

### Two New Microservices

#### 1. **Notification Service** (Port 3004)
Multi-channel notification delivery system with the following capabilities:

**Supported Channels:**
- 📧 **Email** via SendGrid
- 💬 **SMS** via Twilio  
- 🔔 **Web Push** via Web Push API
- 📲 **In-App** stored in PostgreSQL
- 🪝 **Webhooks** with HMAC signing

**Features:**
- Event-driven trigger system (8+ event types: policy_created, flood_alert, claim_triggered, etc.)
- User notification preferences (opt-in/out per channel)
- Template-based messages with variable substitution
- Automatic retry logic (exponential backoff)
- Dead-letter queue for failed notifications
- Delivery logs and audit trail

**Database Tables (6):**
- `notification_logs` - Delivery history
- `notification_preferences` - User settings
- `notification_templates` - Message templates
- `in_app_notifications` - Database-stored messages
- `webhook_subscriptions` - Partner webhooks
- `dead_letter_queue` - Failed notifications

**API Endpoints (5):**
1. `POST /api/v1/notifications/send` - Direct send
2. `POST /api/v1/notifications/trigger` - Event-based trigger
3. `GET /api/v1/notifications/logs/:userId` - View delivery logs
4. `GET /api/v1/notifications/in-app/:userId` - Get in-app messages
5. `PUT /api/v1/notifications/in-app/:id/read` - Mark as read

**Background Jobs:**
- `notificationWorker` - Processes queued notifications (retries, state management)
- `triggerWorker` - Listens for events and dispatches notifications

---

#### 2. **Analytics Service** (Port 3005)
Real-time metrics aggregation and BI endpoints with caching.

**Metrics Tracked:**
- **Policy Metrics**: Count, active, expired, total coverage
- **Claim Metrics**: Count, approved, denied, pending, total payout
- **Pool Metrics**: Total reserve, available funds, reserve ratio
- **Revenue Metrics**: Premium collected, claims paid, net profit

**Features:**
- Redis caching (5-10min TTL) for performance
- Real-time dashboard aggregation
- Hourly metric snapshots for trending
- Prometheus-format metrics export
- Efficient SQL queries with proper indexing

**Database Tables (4):**
- `analytics_hourly_snapshots` - Hourly metric history
- `analytics_policy_metrics` - Policy-specific data
- `analytics_claim_metrics` - Claim statistics
- `analytics_pool_metrics` - Pool health data

**API Endpoints (5):**
1. `GET /api/v1/analytics/dashboard` - Combined dashboard metrics
2. `GET /api/v1/analytics/policies` - Policy breakdown
3. `GET /api/v1/analytics/claims` - Claim breakdown
4. `GET /api/v1/analytics/pool` - Pool health
5. `GET /api/v1/analytics/revenue` - Revenue analysis

**Background Jobs:**
- `aggregationWorker` - Runs hourly/daily to pre-compute metrics

---

### Integration Points

Both services are integrated into the existing ecosystem:

```
API Gateway (3000)
    ├─ Proxy: /api/v1/notifications → Notification Service (3004)
    └─ Proxy: /api/v1/analytics → Analytics Service (3005)

Notification Service (3004)
    ├─ PostgreSQL (for logs, templates, preferences)
    ├─ Redis/BullMQ (for job queue)
    ├─ SendGrid API (for email)
    ├─ Twilio API (for SMS)
    └─ Web Push API (for push notifications)

Analytics Service (3005)
    ├─ PostgreSQL (for aggregation data)
    ├─ Redis (for caching)
    └─ Existing Policy/Claims tables (reads only)
```

---

## 📊 Theoretical End-to-End Workflow

### Scenario: User Buys an Insurance Policy

#### **Timeline:**

1. **User Action** (Frontend)
   ```
   User clicks "Buy Policy" → Submits transaction
   ```

2. **Policy Created** (Policy Service - existing)
   ```
   Smart contract creates policy → Policy stored in DB
   Event: policy_created emitted
   ```

3. **Trigger Notification** (Should be called by Policy Service)
   ```
   POST /api/v1/notifications/trigger
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

4. **Notification Worker** (Async job queue)
   ```
   BullMQ receives job
   ├─ Check user preferences (notification_preferences table)
   ├─ Load template for policy_created event
   ├─ Substitute variables: {{coverage}}, {{premium}}, etc.
   └─ Queue notifications to all enabled channels
   ```

5. **Multi-Channel Delivery**
   ```
   If email enabled:
   └─ EmailService → SendGrid API → user@example.com ✉️
   
   If SMS enabled:
   └─ SmsService → Twilio API → +1-555-0123 📱
   
   If push enabled:
   └─ PushService → Web Push API → Browser notification 🔔
   
   If in-app enabled:
   └─ InAppService → Store in DB → Show in next login 📲
   
   If webhook subscribed:
   └─ WebhookService → Partner URL (with HMAC signature) 🪝
   ```

6. **Tracking & Logging**
   ```
   Each delivery attempt logged to notification_logs table:
   ├─ Timestamp
   ├─ Channel used
   ├─ Delivery status (sent/failed/delivered)
   ├─ Retry count
   └─ Error details (if failed)
   ```

7. **Failed Notification Handling**
   ```
   If first attempt fails:
   ├─ Retry with exponential backoff (1s, 2s, 4s, 8s, etc.)
   ├─ Max 5 retries (configurable)
   └─ If all fail → Move to dead_letter_queue
   
   Dead Letter Queue allows:
   ├─ Manual review by admin
   ├─ Automatic retry after intervention
   └─ Audit trail of failures
   ```

---

### Scenario: Flood Alert Triggered

#### **Timeline:**

1. **Oracle Updates Flood Level** (Oracle Service - existing)
   ```
   USGS data updated → Oracle contract updated
   Event: FloodLevelUpdated emitted
   ```

2. **System Detects Threshold** (Claims Service should trigger this)
   ```
   Current level > 2400 (80% of 3000)
   User has policy in that zone
   Flood alert enabled in preferences
   ```

3. **Trigger Flood Alert Notification**
   ```
   POST /api/v1/notifications/trigger
   {
     "eventType": "flood_alert",
     "userId": "user-123",
     "data": {
       "currentLevel": 2500,
       "threshold": 3000,
       "percentage": 83,
       "zone": "downtown"
     }
   }
   ```

4. **User Receives Alert** (via enabled channels)
   ```
   Email: "⚠️ FLOOD ALERT - Water level is at 83% in downtown zone"
   SMS: "Alert: Flood level 2500cm in downtown. Your policy covers this area."
   Push: "Flood Alert - Level 83% - Check your coverage"
   In-App: Visible on dashboard with warning badge
   ```

5. **Analytics Updated** (Hourly job)
   ```
   Aggregation worker runs every hour:
   ├─ Count triggered alerts
   ├─ Count affected policies
   ├─ Aggregate by location
   └─ Cache for dashboard
   ```

6. **Dashboard Shows Metrics**
   ```
   GET /api/v1/analytics/dashboard
   Response:
   {
     "policies": {
       "total": 150,
       "active": 145,
       "claimed": 2
     },
     "claims": {
       "total": 5,
       "pending": 2,
       "approved": 2,
       "totalPayout": 75000
     },
     "pool": {
       "totalReserve": 500000,
       "claimed": 75000,
       "reserved": 425000,
       "reserveRatio": 0.85
     }
   }
   ```

---

### Scenario: Claim Approved & Payout

#### **Timeline:**

1. **Admin Approves Claim** (Claims Service)
   ```
   Smart contract approves claim → Payout processed
   Event: claim_approved emitted
   ```

2. **Trigger Notification**
   ```
   POST /api/v1/notifications/trigger
   {
     "eventType": "claim_approved",
     "userId": "user-123",
     "data": {
       "claimId": "claim-789",
       "amount": 25000,
       "approvedAt": "2025-10-24T12:00:00Z"
     }
   }
   ```

3. **User Gets Notified**
   ```
   All channels activated:
   ├─ Email with claim details
   ├─ SMS confirmation of payout
   ├─ Push notification
   └─ In-app badge
   ```

4. **Analytics Record Updated**
   ```
   Pool metrics updated:
   ├─ Claims paid: +25000
   ├─ Available reserve: -25000
   ├─ Reserve ratio recalculated
   └─ Dashboard refreshed
   ```

5. **Historical Data Preserved**
   ```
   Hourly snapshot records:
   ├─ Timestamp
   ├─ Total reserves
   ├─ Total claims paid
   ├─ Active policies
   └─ Useful for trending/reporting
   ```

---

## 🔗 Integration Points Needed

### Currently Missing Connections:

1. **Policy Service → Notification Service**
   - When policy created → trigger `policy_created` event
   - When policy expiring → trigger `policy_expiring` event

2. **Claims Service → Notification Service**
   - When claim triggered → trigger `claim_triggered` event
   - When claim approved → trigger `claim_approved` event
   - When claim denied → trigger `claim_denied` event

3. **Oracle Service → Notification Service**
   - When flood level crosses threshold → trigger `flood_alert` event

4. **All Services → Analytics Service**
   - Calls to `/api/v1/analytics/*` to get dashboard metrics

---

## 🧪 Testing Strategy (Phase 5 Option A)

### Infrastructure Setup Required:

1. **PostgreSQL Database**
   - Run existing `create_tables.sql` + new 10 tables
   - Test database separate from production

2. **Redis Instance**
   - For job queue (BullMQ)
   - For caching (Analytics service)

3. **Test Credentials**
   - SendGrid test API key
   - Twilio test account SID/token
   - Web Push test vapid keys

4. **Test Data**
   - Seed notification templates
   - Create test users with preferences
   - Create webhook subscriptions

### Test Execution Path:

```
✓ Unit Tests (mocked)
  ├─ Notification formatting logic
  ├─ Template variable substitution
  ├─ Retry logic
  └─ Analytics calculations

✓ Integration Tests (with infrastructure)
  ├─ Send notification via each channel
  ├─ Track delivery logs
  ├─ Test retry mechanism
  ├─ Test dead-letter queue
  ├─ Verify metrics aggregation
  └─ Test cache invalidation

✓ End-to-End Tests (full flow)
  ├─ Create policy → Notification sent → Log recorded
  ├─ Trigger flood alert → Users notified → Analytics updated
  ├─ Claim workflow → Notifications → Pool metrics changed
  └─ Dashboard reflects all changes
```

---

## 🚀 What Happens Next (Option A)

1. **Spin up test infrastructure**
   - PostgreSQL with test data
   - Redis for job queue
   - Mock SendGrid/Twilio responses

2. **Run integration tests**
   - Verify services start cleanly
   - Test notification delivery paths
   - Verify database logging
   - Test metrics aggregation

3. **Document integration** 
   - How other services should trigger notifications
   - How to query analytics endpoints
   - Example payloads and responses

4. **Mark Phase 5 complete**
   - All services tested
   - Documentation complete
   - Ready for Phase 6 deployment

---

## 📝 Current Build Status

```
✅ notification-service: Compiles, runs, ready for testing
✅ analytics-service: Compiles, runs, ready for testing
✅ Docker images: Created, multi-stage Alpine builds
✅ API Gateway: Routes configured
✅ Database: Schemas defined (not yet created)
✅ Package.json: All dependencies correct
✅ TypeScript: All code type-safe

🟡 Integration tests: Need infrastructure
🟡 End-to-end testing: Needs full environment
🟡 Connection to other services: Not yet wired
```

---

## 📚 Key Files Created

### Notification Service
- `backend/notification-service/src/services/` - Email, SMS, Push, Webhook services
- `backend/notification-service/src/jobs/` - Notification and trigger workers
- `backend/notification-service/src/routes/` - 5 API endpoints
- `backend/notification-service/src/db/` - Database schema and migrations

### Analytics Service
- `backend/analytics-service/src/services/` - Analytics and cache services
- `backend/analytics-service/src/jobs/` - Aggregation worker
- `backend/analytics-service/src/routes/` - 5 API endpoints
- `backend/analytics-service/src/db/` - Database schema

### Documentation
- `NOTIFICATIONS.md` - Complete API reference
- `ANALYTICS.md` - Complete API reference
- Docker setup with proper port mappings
- Environment configuration templates
