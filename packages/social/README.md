# @kairn/social

Module de gestion des réseaux sociaux pour la plateforme Kairn.

## Installation

```bash
pnpm add @kairn/social
```

## OAuth

### Configuration

```typescript
import {
  FacebookOAuth,
  InstagramOAuth,
  LinkedInOAuth,
  TwitterOAuth,
  ThreadsOAuth,
} from '@kairn/social';

const facebook = new FacebookOAuth({
  clientId: process.env.FACEBOOK_CLIENT_ID,
  clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
  redirectUri: 'https://example.com/api/social/auth/facebook/callback',
});
```

### Flow d'authentification

```typescript
// 1. Générer l'URL d'autorisation
const authUrl = facebook.getAuthUrl({
  state: 'random-state-string',
  scopes: ['pages_manage_posts', 'pages_read_engagement'],
});

// 2. Rediriger l'utilisateur vers authUrl

// 3. Dans le callback, échanger le code
const tokens = await facebook.exchangeCode(code);
// { accessToken, refreshToken?, expiresAt, scope }

// 4. Stocker les tokens (chiffrés)
import { TokenManager } from '@kairn/social';

const tokenManager = new TokenManager({
  encryptionKey: process.env.TOKEN_ENCRYPTION_KEY,
});

await tokenManager.store(userId, 'facebook', tokens);
```

### Refresh automatique

```typescript
// Le TokenManager gère le refresh automatiquement
const tokens = await tokenManager.getValid(userId, 'facebook');

// Ou manuellement
if (tokens.expiresAt < Date.now()) {
  const newTokens = await facebook.refreshToken(tokens.refreshToken);
  await tokenManager.store(userId, 'facebook', newTokens);
}
```

## Publication

### Post simple

```typescript
import { FacebookPublisher, LinkedInPublisher } from '@kairn/social';

const fbPublisher = new FacebookPublisher(accessToken, pageId);

const result = await fbPublisher.publish({
  content: 'Mon nouveau post !',
  link: 'https://example.com/article',
});

// { success: true, platformPostId: '123456' }
```

### Post avec média

```typescript
const result = await fbPublisher.publish({
  content: 'Découvrez notre nouvel article',
  mediaUrls: ['https://example.com/image.jpg'],
});
```

### Publication multi-plateformes

```typescript
import { MultiPublisher } from '@kairn/social';

const publisher = new MultiPublisher({
  facebook: { accessToken, pageId },
  instagram: { accessToken, accountId },
  linkedin: { accessToken },
});

const results = await publisher.publishToAll({
  content: 'Mon contenu',
  platforms: ['facebook', 'instagram', 'linkedin'],
  adaptContent: true, // Adapte le contenu par plateforme
});

// {
//   facebook: { success: true, platformPostId: '...' },
//   instagram: { success: true, platformPostId: '...' },
//   linkedin: { success: true, platformPostId: '...' },
// }
```

### Adaptation par plateforme

```typescript
const results = await publisher.publishToAll({
  content: originalContent,
  platforms: ['facebook', 'instagram', 'linkedin'],
  adaptContent: true,
  adaptOptions: {
    instagram: {
      addHashtags: true,
      maxHashtags: 30,
    },
    linkedin: {
      tone: 'professional',
    },
  },
});
```

## Planification

### Scheduler

```typescript
import { PostScheduler } from '@kairn/social';

const scheduler = new PostScheduler({
  database: prisma,
  publisher: multiPublisher,
});

// Planifier un post
await scheduler.schedule({
  content: 'Post programmé',
  platforms: ['facebook', 'linkedin'],
  scheduledAt: new Date('2024-03-15T10:00:00'),
  siteId,
  userId,
});

// Lister les posts planifiés
const scheduled = await scheduler.getScheduled(siteId);

// Annuler un post
await scheduler.cancel(postId);

// Modifier
await scheduler.update(postId, {
  scheduledAt: new Date('2024-03-16T10:00:00'),
});
```

### Worker de publication

```typescript
import { createSchedulerWorker } from '@kairn/social';

// À lancer en cron job ou background worker
const worker = createSchedulerWorker({
  database: prisma,
  publisher: multiPublisher,
  interval: 60000, // Check toutes les minutes
  onError: (error, post) => {
    console.error(`Failed to publish ${post.id}:`, error);
  },
  onSuccess: (post, results) => {
    console.log(`Published ${post.id}:`, results);
  },
});

worker.start();
```

## Plateformes supportées

### Facebook

```typescript
import { FacebookOAuth, FacebookPublisher } from '@kairn/social';

// Scopes recommandés
const scopes = [
  'pages_manage_posts',
  'pages_read_engagement',
  'pages_show_list',
];

// Publication
const publisher = new FacebookPublisher(accessToken, pageId);
await publisher.publish({ content, link?, mediaUrls? });

// Statistiques
const stats = await publisher.getPostStats(postId);
```

### Instagram

```typescript
import { InstagramOAuth, InstagramPublisher } from '@kairn/social';

// Via Facebook Business (Instagram Graph API)
const scopes = [
  'instagram_basic',
  'instagram_content_publish',
  'instagram_manage_insights',
];

// Publication (image obligatoire)
const publisher = new InstagramPublisher(accessToken, accountId);
await publisher.publish({
  content: 'Caption avec #hashtags',
  mediaUrls: ['https://example.com/image.jpg'],
});

// Carousel
await publisher.publishCarousel({
  content: 'Mon carousel',
  mediaUrls: ['image1.jpg', 'image2.jpg', 'image3.jpg'],
});
```

### LinkedIn

```typescript
import { LinkedInOAuth, LinkedInPublisher } from '@kairn/social';

const scopes = ['w_member_social', 'r_liteprofile'];

const publisher = new LinkedInPublisher(accessToken);
await publisher.publish({
  content: 'Post LinkedIn professionnel',
  link?: 'https://example.com',
});
```

### Twitter/X

```typescript
import { TwitterOAuth, TwitterPublisher } from '@kairn/social';

// OAuth 2.0
const scopes = ['tweet.read', 'tweet.write', 'users.read'];

const publisher = new TwitterPublisher(accessToken);
await publisher.publish({
  content: 'Tweet (max 280 caractères)',
  mediaUrls?: ['image.jpg'],
});
```

### Threads

```typescript
import { ThreadsOAuth, ThreadsPublisher } from '@kairn/social';

// Via Instagram
const publisher = new ThreadsPublisher(accessToken, accountId);
await publisher.publish({
  content: 'Post Threads',
  mediaUrls?: ['image.jpg'],
});
```

## Types

```typescript
import type {
  OAuthProvider,
  OAuthTokens,
  SocialPost,
  PostResult,
  SocialPlatform,
  PublishOptions,
  ScheduledPost,
} from '@kairn/social';
```

## Gestion des erreurs

```typescript
import {
  SocialError,
  TokenExpiredError,
  RateLimitError,
  MediaUploadError,
} from '@kairn/social';

try {
  await publisher.publish(post);
} catch (error) {
  if (error instanceof TokenExpiredError) {
    // Refresh token et réessayer
  } else if (error instanceof RateLimitError) {
    // Attendre error.retryAfter
  } else if (error instanceof MediaUploadError) {
    // Problème avec l'image
  }
}
```

## Variables d'environnement

```env
# Facebook
FACEBOOK_CLIENT_ID=...
FACEBOOK_CLIENT_SECRET=...

# Instagram (via Facebook)
# Utilise les mêmes credentials Facebook

# LinkedIn
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...

# Twitter
TWITTER_CLIENT_ID=...
TWITTER_CLIENT_SECRET=...

# Threads (via Instagram)
# Utilise les credentials Instagram

# Encryption
TOKEN_ENCRYPTION_KEY=...
```

## Licence

MIT
