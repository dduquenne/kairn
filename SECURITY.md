# Security Policy

## Private Repository

This is a private repository. Security is critical as it handles practitioner and potentially patient data.

## Security Measures

### Code Level
- All dependencies are audited via `pnpm audit`
- ESLint security plugin enabled for static analysis
- No secrets in code (use environment variables)
- Input validation with Zod schemas
- SQL injection prevention via Prisma ORM
- XSS prevention via React's built-in escaping

### Authentication
- JWT tokens with short expiration
- Secure password hashing (bcrypt)
- Rate limiting on auth endpoints
- 2FA support

### Data Protection
- HTTPS enforced
- Sensitive data encrypted at rest
- Environment variables for all secrets
- No logging of sensitive information

## Environment Variables

Never commit `.env` files. Use `.env.example` as a template.

Required secrets:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing key (min 32 chars)
- `JWT_ACCESS_SECRET` - Access token secret
- `JWT_REFRESH_SECRET` - Refresh token secret

## Dependency Management

- Dependabot enabled for automatic security updates
- Review all dependency updates before merging
- Run `pnpm audit` before each release

## Reporting Vulnerabilities

As this is a private repository, report security issues directly to the repository owner.
