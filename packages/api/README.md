# @kairn/api

Handlers API réutilisables et middlewares pour les sites Kairn.

## Installation

```bash
pnpm add @kairn/api
```

## Middlewares

### withAuth

Authentification JWT requise.

```typescript
import { withAuth } from '@kairn/api';

export const GET = withAuth(async (request, { user }) => {
  // user est garanti d'être défini
  return Response.json({ userId: user.id });
});
```

### withAdmin

Authentification admin requise.

```typescript
import { withAdmin } from '@kairn/api';

export const POST = withAdmin(async (request, { user }) => {
  // Seuls les admins peuvent accéder
  return Response.json({ success: true });
});
```

### withRateLimit

Rate limiting configurable.

```typescript
import { withRateLimit } from '@kairn/api';

export const POST = withRateLimit({
  limit: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
})(async (request) => {
  return Response.json({ success: true });
});
```

### withValidation

Validation Zod du body/query.

```typescript
import { withValidation } from '@kairn/api';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  message: z.string().min(10),
});

export const POST = withValidation(schema)(async (request, { data }) => {
  // data est typé et validé
  return Response.json({ received: data });
});
```

### withCsrf

Protection CSRF.

```typescript
import { withCsrf } from '@kairn/api';

export const POST = withCsrf(async (request) => {
  return Response.json({ success: true });
});
```

### Composition

Combinez plusieurs middlewares :

```typescript
import { compose, withAuth, withAdmin, withRateLimit } from '@kairn/api';

export const POST = compose(
  withRateLimit({ limit: 10, windowMs: 60000 }),
  withAdmin,
)(async (request, { user }) => {
  return Response.json({ user });
});
```

## Handlers

### Auth

```typescript
// app/api/auth/login/route.ts
import { loginHandler } from '@kairn/api';

export const POST = loginHandler({
  onSuccess: async (user) => {
    // Log, analytics, etc.
  },
});

// app/api/auth/logout/route.ts
import { logoutHandler } from '@kairn/api';
export const POST = logoutHandler();

// app/api/auth/refresh/route.ts
import { refreshHandler } from '@kairn/api';
export const POST = refreshHandler();
```

### Blog

```typescript
// app/api/blog/posts/route.ts
import { blogPostsHandler } from '@kairn/api';

export const GET = blogPostsHandler.list({
  siteId: process.env.SITE_ID,
});

export const POST = blogPostsHandler.create({
  siteId: process.env.SITE_ID,
});

// app/api/blog/posts/[slug]/route.ts
import { blogPostHandler } from '@kairn/api';

export const GET = blogPostHandler.get({
  siteId: process.env.SITE_ID,
});

export const PUT = blogPostHandler.update({
  siteId: process.env.SITE_ID,
});

export const DELETE = blogPostHandler.delete({
  siteId: process.env.SITE_ID,
});
```

### Analytics

```typescript
// app/api/analytics/track/route.ts
import { trackHandler } from '@kairn/api';

export const POST = trackHandler({
  siteId: process.env.SITE_ID,
  excludeBots: true,
});

// app/api/analytics/dashboard/route.ts
import { dashboardHandler } from '@kairn/api';

export const GET = dashboardHandler({
  siteId: process.env.SITE_ID,
});
```

### Contact

```typescript
// app/api/contact/route.ts
import { contactHandler } from '@kairn/api';

export const POST = contactHandler({
  siteId: process.env.SITE_ID,
  honeypotField: 'website',
  rateLimit: { limit: 3, windowMs: 3600000 },
  onSubmit: async (contact) => {
    // Envoyer email de notification
  },
});
```

## Utilitaires

### Réponses

```typescript
import { success, error, paginated, notFound } from '@kairn/api';

// Succès simple
return success({ message: 'OK' });

// Erreur
return error('Invalid input', 400);

// Not found
return notFound('Post not found');

// Paginated
return paginated({
  data: posts,
  page: 1,
  pageSize: 10,
  total: 100,
});
```

### Pagination

```typescript
import { parsePagination, calculatePagination } from '@kairn/api';

const { page, pageSize, offset } = parsePagination(request);

const { totalPages, hasNext, hasPrev } = calculatePagination({
  total: 100,
  page,
  pageSize,
});
```

### Filtres

```typescript
import { parseFilters, buildWhereClause } from '@kairn/api';

// ?status=published&tags=tech,news
const filters = parseFilters(request);
// { status: 'published', tags: ['tech', 'news'] }

const where = buildWhereClause(filters, {
  status: 'status',
  tags: { field: 'tags', array: true },
});
```

## Types

```typescript
import type {
  ApiHandler,
  AuthContext,
  PaginationParams,
  PaginatedResponse,
  ApiError,
} from '@kairn/api';
```

## Configuration

Les handlers utilisent les variables d'environnement :

```env
JWT_SECRET=...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
DATABASE_URL=...
```

## Dépendances

- `@kairn/core` - Auth, validation
- `@kairn/db` - Client Prisma
- `zod` - Validation

## Licence

MIT
