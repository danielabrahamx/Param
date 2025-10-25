import { pgTable, uuid, varchar, text, timestamp, boolean, integer, jsonb, index } from 'drizzle-orm/pg-core';

export const notificationLogs = pgTable(
  'notification_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: varchar('user_id', { length: 255 }).notNull(),
    type: varchar('type', { length: 50 }).notNull(), // 'email', 'sms', 'push', 'webhook'
    channel: varchar('channel', { length: 50 }).notNull(), // 'sendgrid', 'twilio', 'web-push', 'custom'
    recipient: varchar('recipient', { length: 255 }).notNull(),
    subject: varchar('subject', { length: 255 }),
    content: text('content').notNull(),
    metadata: jsonb('metadata'),
    status: varchar('status', { length: 50 }).notNull().default('pending'), // 'pending', 'sent', 'failed', 'delivered'
    deliveredAt: timestamp('delivered_at'),
    failureReason: text('failure_reason'),
    retryCount: integer('retry_count').default(0),
    maxRetries: integer('max_retries').default(3),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    userIdIdx: index('notification_logs_user_id_idx').on(table.userId),
    statusIdx: index('notification_logs_status_idx').on(table.status),
    typeIdx: index('notification_logs_type_idx').on(table.type),
    createdAtIdx: index('notification_logs_created_at_idx').on(table.createdAt),
  })
);

export const notificationPreferences = pgTable('notification_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 255 }).notNull().unique(),
  enableEmail: boolean('enable_email').default(true),
  enableSms: boolean('enable_sms').default(true),
  enablePush: boolean('enable_push').default(true),
  enableInApp: boolean('enable_in_app').default(true),
  emailAddress: varchar('email_address', { length: 255 }),
  phoneNumber: varchar('phone_number', { length: 20 }),
  floodAlertThreshold: integer('flood_alert_threshold').default(2400), // 80% of 3000
  policyExpirationWarningDays: integer('policy_expiration_warning_days').default(7),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const notificationTemplates = pgTable('notification_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventType: varchar('event_type', { length: 100 }).notNull().unique(), // 'policy_created', 'claim_triggered', etc.
  emailSubject: varchar('email_subject', { length: 255 }),
  emailTemplate: text('email_template'),
  smsTemplate: text('sms_template'),
  pushTitle: varchar('push_title', { length: 255 }),
  pushBody: text('push_body'),
  inAppTitle: varchar('in_app_title', { length: 255 }),
  inAppContent: text('in_app_content'),
  language: varchar('language', { length: 10 }).default('en'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const inAppNotifications = pgTable(
  'in_app_notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: varchar('user_id', { length: 255 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    content: text('content').notNull(),
    type: varchar('type', { length: 50 }).notNull(), // 'info', 'warning', 'alert', 'success'
    relatedId: varchar('related_id', { length: 255 }), // policy ID, claim ID, etc.
    isRead: boolean('is_read').default(false),
    readAt: timestamp('read_at'),
    expiresAt: timestamp('expires_at'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    userIdIdx: index('in_app_notifications_user_id_idx').on(table.userId),
    isReadIdx: index('in_app_notifications_is_read_idx').on(table.isRead),
  })
);

export const webhookSubscriptions = pgTable(
  'webhook_subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    partnerId: varchar('partner_id', { length: 255 }).notNull(),
    webhookUrl: varchar('webhook_url', { length: 500 }).notNull(),
    events: text('events').array(), // ['policy_created', 'claim_triggered', etc.]
    isActive: boolean('is_active').default(true),
    secret: varchar('secret', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    partnerIdIdx: index('webhook_subscriptions_partner_id_idx').on(table.partnerId),
  })
);

export const deadLetterQueue = pgTable(
  'dead_letter_queue',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    notificationLogId: uuid('notification_log_id').references(() => notificationLogs.id),
    jobData: jsonb('job_data').notNull(),
    error: text('error'),
    attemptedAt: timestamp('attempted_at').defaultNow(),
    resolvedAt: timestamp('resolved_at'),
    isResolved: boolean('is_resolved').default(false),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    isResolvedIdx: index('dead_letter_queue_is_resolved_idx').on(table.isResolved),
  })
);
