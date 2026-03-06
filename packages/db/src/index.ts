/**
 * @kairn/db - Database Package
 *
 * Provides Prisma client, types, and utilities for database access.
 */

// Re-export Prisma client
export { prisma, getPrismaClient, disconnectPrisma } from './client';

// Re-export generated types (will be available after prisma generate)
export type {
  Site,
  User,
  UserRole,
  Session,
  RefreshToken,
  SecretKey,
  BlogPost,
  PostStatus,
  Tag,
  BlogPostTag,
  Testimonial,
  Contact,
  ContactStatus,
  AnalyticsEvent,
  EventType,
  Appointment,
  AppointmentStatus,
} from '@prisma/client';

// Export Prisma utilities
export { Prisma } from '@prisma/client';

// Error handling
export { handlePrismaError, type PrismaErrorResult } from './errors';
