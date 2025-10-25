#!/usr/bin/env bash
# Test Setup Script for Phase 5 Services
# Runs database migrations and sets up test environment

set -e

echo "🧪 Phase 5 Integration Test Setup"
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if PostgreSQL is running
echo -e "${BLUE}✓ Checking database connection...${NC}"
until psql -h localhost -U user -d postgres -c '\q' 2>/dev/null; do
  echo "  Waiting for PostgreSQL..."
  sleep 2
done
echo -e "${GREEN}  Database ready!${NC}"

# Create test database if it doesn't exist
echo -e "${BLUE}✓ Setting up test database...${NC}"
psql -h localhost -U user -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'param_test'" | grep -q 1 || \
  psql -h localhost -U user -d postgres -c "CREATE DATABASE param_test;"
echo -e "${GREEN}  Test database created/exists${NC}"

# Run migrations
echo -e "${BLUE}✓ Running database migrations...${NC}"
psql -h localhost -U user -d param_test -f migrations/001_initial_schema.sql 2>/dev/null || true
psql -h localhost -U user -d param_test -f migrations/002_add_phase5_tables.sql
echo -e "${GREEN}  Migrations complete${NC}"

# Check if Redis is running
echo -e "${BLUE}✓ Checking Redis connection...${NC}"
until redis-cli -h localhost ping > /dev/null 2>&1; do
  echo "  Waiting for Redis..."
  sleep 2
done
echo -e "${GREEN}  Redis ready!${NC}"

# Seed test data
echo -e "${BLUE}✓ Seeding test data...${NC}"
psql -h localhost -U user -d param_test << 'EOF'
-- Insert test user preferences
INSERT INTO notification_preferences (user_id, email_address, phone_number, enable_email, enable_sms, enable_push, enable_in_app)
VALUES 
  ('test-user-1', 'test1@example.com', '+1-555-0001', true, true, true, true),
  ('test-user-2', 'test2@example.com', '+1-555-0002', true, false, true, true),
  ('test-user-3', 'test3@example.com', '+1-555-0003', false, true, false, true)
ON CONFLICT DO NOTHING;

-- Insert test webhook subscription
INSERT INTO webhook_subscriptions (partner_id, webhook_url, events, is_active, secret)
VALUES 
  ('partner-1', 'https://partner.example.com/webhooks', ARRAY['policy_created', 'claim_approved'], true, 'test-secret-123')
ON CONFLICT DO NOTHING;

-- Insert test in-app notifications
INSERT INTO in_app_notifications (user_id, title, content, type, is_read)
VALUES 
  ('test-user-1', 'Welcome to Paramify', 'Get started with your first policy', 'info', false),
  ('test-user-1', 'Complete Your Profile', 'Add emergency contact information', 'info', false)
ON CONFLICT DO NOTHING;
EOF
echo -e "${GREEN}  Test data seeded${NC}"

echo ""
echo -e "${GREEN}✅ Test environment ready!${NC}"
echo ""
echo "Next steps:"
echo "1. Run tests: npm run test --workspaces"
echo "2. Or run specific service: cd notification-service && npm test"
echo ""
