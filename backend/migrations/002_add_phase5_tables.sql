-- Phase 5: Notification Service Tables
-- Created: 2025-10-24

-- ============================================
-- Notification Service Tables
-- ============================================

-- Notification Logs: Track all notification delivery attempts
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- email, sms, push, webhook, in-app
  channel VARCHAR(100) NOT NULL, -- sendgrid, twilio, web-push, custom
  recipient VARCHAR(500) NOT NULL,
  subject VARCHAR(255),
  content TEXT,
  metadata JSONB,
  status VARCHAR(50) DEFAULT 'pending', -- pending, sent, failed, delivered
  delivered_at TIMESTAMP,
  failure_reason TEXT,
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX idx_notification_logs_status ON notification_logs(status);
CREATE INDEX idx_notification_logs_created_at ON notification_logs(created_at);
CREATE INDEX idx_notification_logs_type ON notification_logs(type);

-- Notification Preferences: User opt-in/out settings
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) UNIQUE NOT NULL,
  enable_email BOOLEAN DEFAULT true,
  enable_sms BOOLEAN DEFAULT true,
  enable_push BOOLEAN DEFAULT true,
  enable_in_app BOOLEAN DEFAULT true,
  email_address VARCHAR(255),
  phone_number VARCHAR(20),
  flood_alert_threshold INT DEFAULT 2400,
  policy_expiration_warning_days INT DEFAULT 7,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Notification Templates: Event-specific templates
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) UNIQUE NOT NULL,
  email_subject VARCHAR(255),
  email_template TEXT,
  sms_template TEXT,
  push_title VARCHAR(255),
  push_body TEXT,
  in_app_title VARCHAR(255),
  in_app_content TEXT,
  language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notification_templates_event_type ON notification_templates(event_type);
CREATE INDEX idx_notification_templates_language ON notification_templates(language);

-- In-App Notifications: Database-stored notifications
CREATE TABLE IF NOT EXISTS in_app_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  content TEXT,
  type VARCHAR(50) DEFAULT 'info', -- info, warning, alert, success
  related_id VARCHAR(255),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_in_app_notifications_user_id ON in_app_notifications(user_id);
CREATE INDEX idx_in_app_notifications_is_read ON in_app_notifications(is_read);
CREATE INDEX idx_in_app_notifications_created_at ON in_app_notifications(created_at);

-- Webhook Subscriptions: Partner webhook registrations
CREATE TABLE IF NOT EXISTS webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id VARCHAR(255),
  webhook_url VARCHAR(500) NOT NULL,
  events TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT true,
  secret VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhook_subscriptions_partner_id ON webhook_subscriptions(partner_id);
CREATE INDEX idx_webhook_subscriptions_is_active ON webhook_subscriptions(is_active);

-- Dead Letter Queue: Failed notifications for manual retry
CREATE TABLE IF NOT EXISTS dead_letter_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_log_id UUID REFERENCES notification_logs(id),
  job_data JSONB,
  error TEXT,
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dead_letter_queue_notification_log_id ON dead_letter_queue(notification_log_id);
CREATE INDEX idx_dead_letter_queue_is_resolved ON dead_letter_queue(is_resolved);

-- ============================================
-- Analytics Service Tables
-- ============================================

-- Hourly Snapshots: Historical metric data
CREATE TABLE IF NOT EXISTS analytics_hourly_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_time TIMESTAMP NOT NULL,
  total_policies INT DEFAULT 0,
  active_policies INT DEFAULT 0,
  expired_policies INT DEFAULT 0,
  total_coverage DECIMAL(18, 2) DEFAULT 0,
  total_premiums DECIMAL(18, 2) DEFAULT 0,
  total_claims INT DEFAULT 0,
  pending_claims INT DEFAULT 0,
  approved_claims INT DEFAULT 0,
  denied_claims INT DEFAULT 0,
  total_payout DECIMAL(18, 2) DEFAULT 0,
  pool_reserve DECIMAL(18, 2) DEFAULT 0,
  pool_available DECIMAL(18, 2) DEFAULT 0,
  reserve_ratio DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_hourly_snapshots_time ON analytics_hourly_snapshots(snapshot_time);

-- Policy Metrics: Per-policy analytics
CREATE TABLE IF NOT EXISTS analytics_policy_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id VARCHAR(255) UNIQUE NOT NULL,
  user_id VARCHAR(255),
  location VARCHAR(255),
  coverage_amount DECIMAL(18, 2),
  premium_amount DECIMAL(18, 2),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_policy_metrics_user_id ON analytics_policy_metrics(user_id);
CREATE INDEX idx_analytics_policy_metrics_location ON analytics_policy_metrics(location);
CREATE INDEX idx_analytics_policy_metrics_status ON analytics_policy_metrics(status);

-- Claim Metrics: Per-claim analytics
CREATE TABLE IF NOT EXISTS analytics_claim_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id VARCHAR(255) UNIQUE NOT NULL,
  policy_id VARCHAR(255),
  user_id VARCHAR(255),
  amount DECIMAL(18, 2),
  status VARCHAR(50),
  trigger_reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_claim_metrics_user_id ON analytics_claim_metrics(user_id);
CREATE INDEX idx_analytics_claim_metrics_policy_id ON analytics_claim_metrics(policy_id);
CREATE INDEX idx_analytics_claim_metrics_status ON analytics_claim_metrics(status);

-- Pool Metrics: Pool health tracking
CREATE TABLE IF NOT EXISTS analytics_pool_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_time TIMESTAMP NOT NULL,
  total_reserve DECIMAL(18, 2),
  total_claimed DECIMAL(18, 2),
  available_funds DECIMAL(18, 2),
  reserve_ratio DECIMAL(5, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_pool_metrics_time ON analytics_pool_metrics(snapshot_time);

-- ============================================
-- Initial Template Data
-- ============================================

-- Insert default notification templates
INSERT INTO notification_templates (event_type, email_subject, email_template, sms_template, push_title, push_body, in_app_title, in_app_content) VALUES
(
  'policy_created',
  'Your Paramify Insurance Policy is Active',
  '<h2>Welcome to Paramify!</h2><p>Your policy for {{coverage}}{{currency}} coverage is now active.</p><p>Premium: {{premium}}{{currency}}</p>',
  'Paramify: Your policy is active! Coverage: {{coverage}}, Premium: {{premium}}',
  'Policy Active',
  'Your insurance policy is now protecting you',
  'Policy Created',
  'Your flood insurance policy has been created with {{coverage}} coverage'
),
(
  'flood_alert',
  '⚠️ FLOOD ALERT - Water Level Rising',
  '<h2 style="color: red;">FLOOD ALERT</h2><p>Water level in {{zone}} is at {{percentage}}% of threshold</p><p>Current level: {{currentLevel}}cm</p>',
  'ALERT: Flood level {{percentage}}% in {{zone}}. Your policy covers this area.',
  '⚠️ Flood Alert',
  'Water level rising to {{percentage}}% in {{zone}}',
  'Flood Alert',
  'Water level in {{zone}} is at {{percentage}}% - You are covered by your policy'
),
(
  'claim_triggered',
  'Your Flood Claim Has Been Triggered',
  '<h2>Claim Activated</h2><p>Your automatic flood claim has been triggered.</p><p>Claim ID: {{claimId}}</p><p>Amount: {{amount}}{{currency}}</p>',
  'Paramify: Your flood claim #{{claimId}} has been triggered for {{amount}}',
  'Claim Triggered',
  'Your flood insurance claim has been automatically activated',
  'Claim Triggered',
  'Claim #{{claimId}} triggered. Estimated payout: {{amount}}'
),
(
  'claim_approved',
  'Your Claim Has Been Approved ✅',
  '<h2>Claim Approved</h2><p>Congratulations! Your claim has been approved for {{amount}}{{currency}}</p><p>Payout will be processed within 5 business days.</p>',
  'Approved! Your claim for {{amount}} will be paid within 5 business days.',
  'Claim Approved',
  'Your claim for {{amount}} has been approved',
  'Claim Approved',
  'Your claim for {{amount}} has been approved and will be paid soon'
),
(
  'claim_denied',
  'Claim Status Update',
  '<h2>Claim Decision</h2><p>Your claim has been reviewed and unfortunately denied.</p><p>Reason: {{reason}}</p>',
  'Your claim has been denied. Reason: {{reason}}',
  'Claim Status',
  'Your claim decision is available',
  'Claim Denied',
  'Your claim was not approved. Review details in your account.'
),
(
  'premium_paid',
  'Premium Payment Received',
  '<h2>Payment Confirmed</h2><p>We received your premium payment of {{amount}}{{currency}}</p><p>Transaction ID: {{transactionId}}</p>',
  'Paramify: Payment {{amount}} confirmed. Policy active until {{expiryDate}}',
  'Payment Received',
  'Your premium payment has been processed',
  'Payment Confirmed',
  'Premium payment of {{amount}} received. Policy valid until {{expiryDate}}'
),
(
  'policy_expiring',
  'Your Policy is Expiring Soon',
  '<h2>Renew Your Coverage</h2><p>Your policy expires in {{daysLeft}} days.</p><p>Click here to renew: {{renewalLink}}</p>',
  'Reminder: Your Paramify policy expires in {{daysLeft}} days. Renew now: {{renewalLink}}',
  'Renewal Reminder',
  'Your policy expires soon',
  'Policy Expiring',
  'Your flood insurance policy expires in {{daysLeft}} days. Renew to stay protected.'
),
(
  'payout_processed',
  'Your Payout Has Been Processed',
  '<h2>Funds Transferred</h2><p>Your claim payout of {{amount}}{{currency}} has been transferred to your account.</p>',
  'Your {{amount}} payout has been transferred. Check your account.',
  'Payout Complete',
  'Your insurance payout has been processed',
  'Payout Processed',
  'Payout of {{amount}} for claim #{{claimId}} has been sent to your account'
);
