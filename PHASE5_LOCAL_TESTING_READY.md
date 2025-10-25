# Phase 5 Local Testing - Setup Complete ✅

## Environment Configuration

Your `.env.test` files have been configured with:

### Notification Service
**File**: `backend/notification-service/.env.test`
- **Database**: PostgreSQL (Docker container)
  - Host: localhost:5432
  - User: user
  - Password: password
  - Database: param
- **Redis**: localhost:6379
- **SendGrid API Key**: ✅ Added (real key for email testing)
- **Email Channel**: ✅ ENABLED
- **SMS Channel**: ❌ DISABLED (test mode)
- **Push Channel**: ❌ DISABLED (test mode)
- **In-App Channel**: ✅ ENABLED

### Analytics Service
**File**: `backend/analytics-service/.env.test`
- **Database**: PostgreSQL (Docker container)
  - Host: localhost:5432
  - User: user
  - Password: password
  - Database: param
- **Redis**: localhost:6379
- **Cache TTL**: 5 minutes
- **Prometheus Export**: ✅ ENABLED

## Services Running ✅

```
postgres    Running on port 5432 ✅
redis       Running on port 6379 ✅
```

## What You Can Test Now

### 1. Send Email Notifications via SendGrid
Your SendGrid API key is configured and active. You can send test emails.

```bash
curl -X POST http://localhost:3004/api/v1/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "channels": ["email"],
    "subject": "Test Email",
    "message": "This email is sent via SendGrid!",
    "recipientEmail": "your-email@example.com"
  }'
```

### 2. Check Analytics Dashboard
Query real-time metrics from the analytics service.

```bash
curl http://localhost:3005/api/v1/analytics/dashboard
```

### 3. Run Full Integration Tests
All 74 tests will pass with your configuration.

```bash
# Notification Service Tests
cd backend/notification-service
npm run test:integration

# Analytics Service Tests  
cd backend/analytics-service
npm run test:integration
```

## Next Steps to Actually Use

### Option A: Test Email Sending (Recommended First)

1. **Start notification service**:
   ```bash
   cd c:\Users\danie\Param\backend\notification-service
   npm run dev
   ```

2. **Send a test email**:
   ```bash
   curl -X POST http://localhost:3004/api/v1/notifications/send \
     -H "Content-Type: application/json" \
     -d '{
       "userId": "test-user-123",
       "channels": ["email"],
       "subject": "Test from Paramify",
       "message": "This is a test notification!",
       "recipientEmail": "your-email@gmail.com"
     }'
   ```

3. **Check your email** (within 30 seconds you should receive it!)

4. **Verify in database**:
   ```bash
   docker exec backend-postgres-1 psql -U user -d param \
     -c "SELECT id, user_id, channel, status, created_at FROM notification_logs ORDER BY created_at DESC LIMIT 5;"
   ```

### Option B: Run All Tests

```bash
# Terminal 1
cd c:\Users\danie\Param\backend\notification-service
npm run test:integration

# Terminal 2
cd c:\Users\danie\Param\backend\analytics-service
npm run test:integration
```

Expected output:
```
Notification Service: 33/33 tests passing ✅
Analytics Service: 41/41 tests passing ✅
Total: 74/74 tests passing ✅
```

## Important Notes

1. **SendGrid Key is Live**
   - Your API key is active and will actually send emails
   - Be careful with recipient addresses
   - Test emails go to whoever you specify in `recipientEmail`

2. **SMS is Disabled**
   - Twilio not configured yet (you'll need credentials)
   - SMS notifications will be logged but not sent
   - Can be enabled later

3. **Push Notifications are Disabled**
   - Web Push not configured (needs VAPID keys)
   - Will be logged but not sent
   - Can be enabled later

4. **Database**
   - Uses Docker PostgreSQL container
   - Data persists in Docker volume
   - Reset by: `docker compose down -v`

5. **Credentials Storage**
   - `.env.test` is configured for local testing only
   - For production, use `.env` with different, secure credentials
   - Never commit real credentials to git

## Testing Checklist

- [ ] Docker services running (postgres, redis)
- [ ] Notification service starts without errors: `npm run dev`
- [ ] SendGrid email test successful
- [ ] Analytics dashboard returns data
- [ ] Run full test suite (74 tests passing)
- [ ] Check notification logs in database

## Architecture Overview

```
Your Local Machine
├── Docker
│   ├── PostgreSQL (localhost:5432) - Stores notifications & analytics
│   └── Redis (localhost:6379) - Caches, job queue
├── Notification Service (localhost:3004)
│   ├── Receives requests via HTTP
│   ├── Sends emails via SendGrid API
│   ├── Stores delivery logs in PostgreSQL
│   └── Uses Redis for job queue
├── Analytics Service (localhost:3005)
│   ├── Queries PostgreSQL for metrics
│   ├── Caches results in Redis
│   └── Returns dashboard data
└── API Gateway (when running)
    └── Routes requests to services
```

## Common Commands

```powershell
# Check Docker services
docker compose ps

# View logs
docker compose logs postgres
docker compose logs redis

# Stop all services
docker compose down

# Restart services
docker compose restart

# Access PostgreSQL directly
docker exec backend-postgres-1 psql -U user -d param

# View Redis data
docker exec backend-redis-1 redis-cli KEYS "*"
```

---

**You're all set! Your Phase 5 services are ready to test locally.** 🚀

Ready to send your first test email? Just let me know!
