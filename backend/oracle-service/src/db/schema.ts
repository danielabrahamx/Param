import { pgTable, serial, varchar, integer, timestamp } from 'drizzle-orm/pg-core';

export const floodReadings = pgTable('flood_readings', {
  id: serial('id').primaryKey(),
  location: varchar('location', { length: 100 }).notNull(),
  level: integer('level').notNull(),
  timestamp: timestamp('timestamp').defaultNow(),
});