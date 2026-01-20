/**
 * @kairn/social - Social Media Integration Module
 * 
 * This module provides social media integration for Kairn sites.
 * Features will be added progressively:
 * - OAuth integration for social platforms
 * - Social post publishing
 * - Analytics integration
 */

export const VERSION = '0.0.1';

// Placeholder exports - actual features to be implemented
export interface SocialConfig {
  enabled: boolean;
  platforms: string[];
}

export const defaultSocialConfig: SocialConfig = {
  enabled: false,
  platforms: [],
};
