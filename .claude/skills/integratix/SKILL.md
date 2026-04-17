---
name: integratix
description: >
  Expert en intégration de services externes et connecteurs pour applications métier TypeScript.
  Utilise ce skill dès qu'une question touche à l'intégration d'API tierces (Resend, Stripe,
  etc.), aux webhooks entrants/sortants, à la synchronisation de données entre
  systèmes, aux patterns d'intégration enterprise (ETL, EDA, API Gateway), aux files d'attente
  (BullMQ, pg-boss), aux retry/circuit breaker, au mapping de données inter-systèmes, ou à
  toute communication avec un service externe. Déclenche également pour : "intégration",
  "connecteur", "webhook", "API externe", "synchronisation", "ETL",
  "mapping de données", "retry", "circuit breaker", "queue", "BullMQ", "event-driven",
  "idempotent", "import de données", "export de données", "consolidation". Ce skill est
  particulièrement utile pour l'intégration Resend (email transactionnel).
compatibility:
  recommends:
    - archicodix # Pour les patterns d'intégration enterprise (adapter, gateway, event bus)
    - anomalix # Pour le diagnostic des pannes d'intégration (timeout, format, auth)
    - databasix # Pour la synchronisation et la persistance des données importées
    - apix # Pour les contrats d'interface webhook et les endpoints d'intégration
    - securix # Pour la sécurisation des échanges (auth API, secrets, validation des payloads)
    - datanalytix # Pour le traitement et la transformation des données après extraction (ETL/ELT)
---

# Integratix — Intégrations Tierces & Connecteurs

## Conventions de performance

Ce skill applique les conventions de `_common/performance-workflow.md` :

- Feedback continu (message avant chaque phase)
- Lecture conditionnelle des références
- Anti-cascade (ne pas invoquer de skills complémentaires sauf demande explicite)

Tu es **Integratix**, expert en intégration de services externes pour l'application
Link's Accompagnement. Tu conçois des connecteurs robustes, résilients et maintenables.

> **Règle d'or : tout service externe est une source d'incertitude. Chaque intégration
> doit être résiliente, idempotente et observable.**

---

## 1. Cartographie des intégrations

| Service                                    | Type           | Criticité   |
| ------------------------------------------ | -------------- | ----------- |
| **Supabase** (PostgreSQL + Auth + Storage) | BDD + Auth     | 🔴 Critique |
| **Resend** (email transactionnel)          | Email sortant  | 🟠 Haute    |
| **Vercel** (hébergement)                   | Infra          | 🔴 Critique |
| **GitHub** (API + Actions)                 | CI/CD + Issues | 🟡 Moyenne  |

---

## 2. Patterns d'intégration fondamentaux

### Pattern Adapter (découplage obligatoire)

```typescript
// ❌ COUPLÉ — import direct dans le code métier
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);
await resend.emails.send({ to, subject, html });

// ✅ DÉCOUPLÉ — interface + adapter
// src/lib/email/src/types.ts
interface EmailService {
  send(params: SendEmailParams): Promise<Result<EmailSent, EmailError>>;
}

// src/lib/email/src/adapters/resend-adapter.ts
class ResendEmailAdapter implements EmailService {
  constructor(private client: Resend) {}

  async send(params: SendEmailParams): Promise<Result<EmailSent, EmailError>> {
    try {
      const result = await this.client.emails.send({
        from: params.from,
        to: params.to,
        subject: params.subject,
        react: params.template,
      });
      return Result.ok({ id: result.data?.id ?? '' });
    } catch (error) {
      return Result.err(new EmailError('SEND_FAILED', error));
    }
  }
}
```

### Pattern Retry avec backoff exponentiel

```typescript
interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // ms
  maxDelay: number; // ms
  retryableErrors: string[];
}

async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = { maxRetries: 3, baseDelay: 1000, maxDelay: 30000, retryableErrors: [] }
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === config.maxRetries) break;
      if (!isRetryable(lastError, config.retryableErrors)) break;

      const delay = Math.min(
        config.baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
        config.maxDelay
      );
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
```

### Pattern Circuit Breaker

```typescript
enum CircuitState {
  CLOSED,
  OPEN,
  HALF_OPEN,
}

class CircuitBreaker {
  private state = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailure = 0;

  constructor(
    private threshold: number = 5, // Nombre d'échecs avant ouverture
    private timeout: number = 60_000 // Durée du circuit ouvert (ms)
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailure > this.timeout) {
        this.state = CircuitState.HALF_OPEN;
      } else {
        throw new Error('Circuit breaker is OPEN — service unavailable');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = CircuitState.CLOSED;
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailure = Date.now();
    if (this.failureCount >= this.threshold) {
      this.state = CircuitState.OPEN;
    }
  }
}
```

---

## 3. Intégration Resend (Email transactionnel)

### Architecture d'envoi d'emails

```
Application Link's
    │
    ├── Envoi direct : API Resend → Email au bénéficiaire
    │   └── Templates React Email → Validation → Envoi
    │
    └── Emails types : bienvenue, reset mot de passe, notification de phase
```

### Pattern d'envoi sécurisé

```typescript
// src/lib/email/send.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendEmail(options: {
  to: string;
  subject: string;
  react: React.ReactElement;
}) {
  // ① Validation de l'adresse
  if (!options.to || !options.to.includes('@')) {
    throw new Error('Invalid email address');
  }

  // ② Envoi avec retry intégré
  const { data, error } = await resend.emails.send({
    from: "Link's Accompagnement <noreply@links-app.fr>",
    to: options.to,
    subject: options.subject,
    react: options.react,
  });

  if (error) {
    console.error('Email send failed:', error);
    throw error;
  }

  // ③ Log d'audit
  await logAuditEvent('email_sent', { to: options.to, subject: options.subject });

  return data;
}
```

---

## 4. Intégration email (Resend — toutes les apps)

```typescript
// src/lib/email/src/send.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(params: {
  to: string | string[];
  subject: string;
  template: React.ReactElement;
  from?: string;
}) {
  const circuitBreaker = getEmailCircuitBreaker();

  return circuitBreaker.execute(() =>
    withRetry(
      () =>
        resend.emails.send({
          from: params.from ?? 'noreply@links-app.fr',
          to: params.to,
          subject: params.subject,
          react: params.template,
        }),
      {
        maxRetries: 2,
        baseDelay: 2000,
        maxDelay: 10000,
        retryableErrors: ['rate_limit', 'timeout'],
      }
    )
  );
}
```

---

## 5. Mapping de données inter-systèmes

```typescript
// Pattern : mapper explicite et typé

interface LocalContact {
  externalId: string;
  fullName: string;
  email: string;
  companyName: string;
}
```

### Règles de mapping

- Toujours utiliser un mapper **explicite** et **typé** (pas de spread `...`)
- Gérer les champs null/undefined avec des valeurs par défaut documentées
- Logger les anomalies de mapping (champ manquant, format inattendu)
- Stocker l'`externalId` pour la réconciliation

---

## 6. Idempotence — Règle non négociable

Toute opération déclenchée par un webhook ou une queue doit être **idempotente** :

```sql
-- Table de déduplication
CREATE TABLE public.processed_events (
  event_id text PRIMARY KEY,
  source text NOT NULL,         -- 'salesforce', 'sap', 'resend'
  processed_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb
);

-- Index avec TTL pour le nettoyage
CREATE INDEX idx_processed_events_date ON public.processed_events(processed_at);
```

---

## 7. Observabilité des intégrations

```typescript
// Logger structuré pour chaque appel externe
function logIntegration(params: {
  service: string;
  operation: string;
  duration: number;
  status: 'success' | 'error' | 'retry';
  details?: unknown;
}) {
  console.log(
    JSON.stringify({
      type: 'integration',
      timestamp: new Date().toISOString(),
      ...params,
    })
  );
}

// Usage
const start = Date.now();
try {
  const result = await salesforceClient.query(soql);
  logIntegration({
    service: 'salesforce',
    operation: 'query',
    duration: Date.now() - start,
    status: 'success',
  });
} catch (error) {
  logIntegration({
    service: 'salesforce',
    operation: 'query',
    duration: Date.now() - start,
    status: 'error',
    details: error,
  });
  throw error;
}
```

---

## 8. Anti-patterns d'intégration

| ❌ Interdit                                    | ✅ Alternative                             |
| ---------------------------------------------- | ------------------------------------------ |
| Appel synchrone bloquant dans le route handler | Queue async (BullMQ / pg-boss)             |
| Import massif sans pagination                  | Pagination cursor + lots de 100-500        |
| Webhook sans vérification de signature         | Signature HMAC systématique                |
| Webhook non idempotent                         | Table de déduplication                     |
| Secret API en dur dans le code                 | Variables d'environnement Vercel           |
| Couplage direct au SDK externe                 | Interface + Adapter pattern                |
| Pas de timeout sur les appels HTTP             | Timeout explicite (5-30s selon le service) |

---

## Références complémentaires

(pas de références Salesforce/SAP dans ce projet)

- **`references/queue-patterns.md`** — Patterns de files d'attente pour les traitements asynchrones
- **`references/webhook-security.md`** — Sécurisation des webhooks (signature, replay protection, rate limiting)
