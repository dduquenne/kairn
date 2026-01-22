/**
 * @kairn/social/posting - Publishing Module
 *
 * Social media post publishing utilities.
 */

// Types
export * from './types';

// Publishers
export { FacebookPublisher } from './facebook';
export { InstagramPublisher } from './instagram';
export { LinkedInPublisher } from './linkedin';
export { TwitterPublisher } from './twitter';
export { ThreadsPublisher } from './threads';

// Scheduler
export { PostScheduler, type SchedulerConfig, type SchedulerBatchResult } from './scheduler';

// Multi-Publisher
export {
  MultiPublisher,
  type MultiPublisherConfig,
  type ContentAdaptOptions,
} from './multi-publisher';

// Factory function to get a publisher
import type { SocialPlatform } from '../types';

import { FacebookPublisher } from './facebook';
import { InstagramPublisher } from './instagram';
import { LinkedInPublisher } from './linkedin';
import { ThreadsPublisher } from './threads';
import { TwitterPublisher } from './twitter';
import type { SocialPublisher } from './types';

/**
 * Get a publisher instance for a platform
 *
 * @param platform - Social platform
 * @param baseUrl - Base URL for media (optional)
 * @returns Publisher instance
 */
export function getPublisher(platform: SocialPlatform, baseUrl?: string): SocialPublisher {
  switch (platform) {
    case 'FACEBOOK':
      return new FacebookPublisher(baseUrl);
    case 'INSTAGRAM':
      return new InstagramPublisher(baseUrl);
    case 'LINKEDIN':
      return new LinkedInPublisher();
    case 'TWITTER':
      return new TwitterPublisher();
    case 'THREADS':
      return new ThreadsPublisher(baseUrl);
    default: {
      const unknownPlatform: string = platform;
      throw new Error(`Unsupported platform: ${unknownPlatform}`);
    }
  }
}
