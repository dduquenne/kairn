import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  sendEmail,
  createEmailSender,
  buildAdminEmailHtml,
  buildAdminEmailText,
  buildConfirmationEmailHtml,
  buildConfirmationEmailText,
  escapeHtml,
  nl2br,
  formatSubmittedAt,
} from '../email';
import type { EmailBranding, AdminEmailOptions, ConfirmationEmailOptions } from '../email';

const mockBranding: EmailBranding = {
  siteName: 'TestSite',
  domain: 'testsite.fr',
  tagline: 'Thérapie · Hypnose',
  practitionerName: 'Dr. Test',
  address: '1 rue Test · 75001 Paris',
  contactEmail: 'contact@testsite.fr',
  colors: {
    primary: '#c7a962',
    primaryLight: '#f0d9a3',
    secondary: '#0e1f2f',
    foreground: '#f5f1e6',
  },
};

// ─── Utilities ──────────────────────────────────────────────────────────────

describe('escapeHtml', () => {
  it('should escape HTML special characters', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  it('should escape ampersands', () => {
    expect(escapeHtml('A & B')).toBe('A &amp; B');
  });

  it('should escape single quotes', () => {
    expect(escapeHtml("l'email")).toBe('l&#039;email');
  });

  it('should handle empty string', () => {
    expect(escapeHtml('')).toBe('');
  });
});

describe('nl2br', () => {
  it('should convert newlines to br tags with escaping', () => {
    expect(nl2br('ligne 1\nligne 2')).toBe('ligne 1<br />ligne 2');
  });

  it('should escape HTML in content', () => {
    expect(nl2br('<b>bold</b>\nnext')).toBe('&lt;b&gt;bold&lt;/b&gt;<br />next');
  });
});

describe('formatSubmittedAt', () => {
  it('should format a valid ISO string', () => {
    const result = formatSubmittedAt('2026-03-06T10:30:00Z');
    expect(result).toContain('2026');
    expect(result).not.toBe('Non précisé');
  });

  it('should return default for undefined', () => {
    expect(formatSubmittedAt(undefined)).toBe('Non précisé');
  });

  it('should return default for invalid date', () => {
    expect(formatSubmittedAt('invalid-date')).toBe('Non précisé');
  });
});

// ─── Admin Email Templates ─────────────────────────────────────────────────

describe('buildAdminEmailHtml', () => {
  const baseOptions: AdminEmailOptions = {
    heading: 'Nouveau contact',
    sections: [
      {
        title: 'Coordonnées',
        fields: [
          { label: 'Nom', value: 'Jean Dupont' },
          { label: 'Email', value: 'jean@example.com', emailLink: true },
        ],
      },
    ],
  };

  it('should build a valid HTML email', () => {
    const html = buildAdminEmailHtml(baseOptions, mockBranding);

    expect(html).toContain('<!doctype html>');
    expect(html).toContain('Nouveau contact');
    expect(html).toContain('Jean Dupont');
    expect(html).toContain('TESTSITE');
    expect(html).toContain('mailto:jean@example.com');
  });

  it('should include badge when provided', () => {
    const html = buildAdminEmailHtml({ ...baseOptions, badge: 'Urgent' }, mockBranding);

    expect(html).toContain('Urgent');
  });

  it('should include message block', () => {
    const html = buildAdminEmailHtml(
      {
        ...baseOptions,
        messageBlock: { label: 'Message', content: 'Bonjour, je souhaite...' },
      },
      mockBranding
    );

    expect(html).toContain('Bonjour, je souhaite...');
  });

  it('should include pre-response suggestion', () => {
    const html = buildAdminEmailHtml(
      {
        ...baseOptions,
        preResponse: { text: 'Suggestion de réponse', source: 'ai' },
      },
      mockBranding
    );

    expect(html).toContain('Suggestion IA');
    expect(html).toContain('Suggestion de réponse');
  });

  it('should include metadata as HTML comment', () => {
    const html = buildAdminEmailHtml(
      {
        ...baseOptions,
        metadata: { type: 'contact', id: '123' },
      },
      mockBranding
    );

    expect(html).toContain('KAIRN_METADATA_START');
    expect(html).toContain('"type":"contact"');
  });

  it('should include phone link field', () => {
    const options: AdminEmailOptions = {
      heading: 'Test',
      sections: [
        {
          title: 'Info',
          fields: [{ label: 'Tél', value: '01 23 45 67 89', phoneLink: true }],
        },
      ],
    };
    const html = buildAdminEmailHtml(options, mockBranding);

    expect(html).toContain('tel:0123456789');
  });

  it('should include badge field', () => {
    const options: AdminEmailOptions = {
      heading: 'Test',
      sections: [
        {
          title: 'Info',
          fields: [{ label: 'Type', value: 'Prioritaire', badge: true }],
        },
      ],
    };
    const html = buildAdminEmailHtml(options, mockBranding);

    expect(html).toContain('border-radius:12px');
    expect(html).toContain('Prioritaire');
  });

  it('should escape XSS in heading', () => {
    const html = buildAdminEmailHtml(
      { ...baseOptions, heading: '<script>alert("xss")</script>' },
      mockBranding
    );

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

describe('buildAdminEmailText', () => {
  it('should build plain text version', () => {
    const text = buildAdminEmailText({
      heading: 'Nouveau contact',
      sections: [
        {
          title: 'Coordonnées',
          fields: [{ label: 'Nom', value: 'Jean Dupont' }],
        },
      ],
    });

    expect(text).toContain('Nouveau contact');
    expect(text).toContain('Nom : Jean Dupont');
  });

  it('should include message block and pre-response', () => {
    const text = buildAdminEmailText({
      heading: 'Test',
      sections: [],
      messageBlock: { label: 'Message', content: 'Hello' },
      preResponse: { text: 'Réponse suggérée', source: 'fallback' },
    });

    expect(text).toContain('── Message ──');
    expect(text).toContain('Hello');
    expect(text).toContain('── Suggestion ──');
    expect(text).toContain('Réponse suggérée');
  });
});

// ─── Confirmation Email Templates ──────────────────────────────────────────

describe('buildConfirmationEmailHtml', () => {
  const baseOptions: ConfirmationEmailOptions = {
    recipientName: 'Marie',
    intro: 'Votre demande a bien été reçue.',
    closing: 'Cordialement,',
    signer: 'Dr. Test',
  };

  it('should build a valid HTML email', () => {
    const html = buildConfirmationEmailHtml(baseOptions, mockBranding);

    expect(html).toContain('<!doctype html>');
    expect(html).toContain('Bonjour <strong>Marie</strong>');
    expect(html).toContain('Votre demande a bien été reçue.');
    expect(html).toContain('Cordialement,');
    expect(html).toContain('Dr. Test');
    expect(html).toContain('TESTSITE');
  });

  it('should include sections', () => {
    const html = buildConfirmationEmailHtml(
      {
        ...baseOptions,
        sections: [
          {
            title: 'Récapitulatif',
            fields: [{ label: 'Service', value: 'Thérapie' }],
          },
        ],
      },
      mockBranding
    );

    expect(html).toContain('Récapitulatif');
    expect(html).toContain('Thérapie');
  });

  it('should include callout', () => {
    const html = buildConfirmationEmailHtml(
      {
        ...baseOptions,
        callout: {
          icon: '💡',
          title: 'Information importante',
          lines: ['Première ligne', 'Deuxième ligne'],
        },
      },
      mockBranding
    );

    expect(html).toContain('Information importante');
    expect(html).toContain('Première ligne');
  });

  it('should include bullet list', () => {
    const html = buildConfirmationEmailHtml(
      {
        ...baseOptions,
        bulletList: {
          title: 'À prévoir',
          items: ['Document 1', 'Document 2'],
        },
      },
      mockBranding
    );

    expect(html).toContain('À prévoir');
    expect(html).toContain('Document 1');
  });

  it('should include reference', () => {
    const html = buildConfirmationEmailHtml(
      { ...baseOptions, reference: 'REF-2026-001' },
      mockBranding
    );

    expect(html).toContain('REF-2026-001');
  });

  it('should include RGPD notice', () => {
    const html = buildConfirmationEmailHtml(baseOptions, mockBranding);

    expect(html).toContain('RGPD');
  });
});

describe('buildConfirmationEmailText', () => {
  it('should build plain text version', () => {
    const text = buildConfirmationEmailText(
      {
        recipientName: 'Marie',
        intro: 'Merci pour votre message.',
        closing: 'À bientôt,',
        signer: 'Dr. Test',
      },
      mockBranding
    );

    expect(text).toContain('Bonjour Marie,');
    expect(text).toContain('Merci pour votre message.');
    expect(text).toContain('Dr. Test');
    expect(text).toContain('testsite.fr');
  });

  it('should include all optional sections', () => {
    const text = buildConfirmationEmailText(
      {
        recipientName: 'Marie',
        intro: 'Test.',
        closing: 'CDT',
        signer: 'Dr.',
        reference: 'REF-001',
        sections: [{ title: 'Détails', fields: [{ label: 'Type', value: 'A' }] }],
        callout: { title: 'Note', lines: ['Important'] },
        bulletList: { title: 'Liste', items: ['Item 1'] },
        recap: { title: 'Récap', fields: [{ label: 'Total', value: '100€' }] },
      },
      mockBranding
    );

    expect(text).toContain('Réf. : REF-001');
    expect(text).toContain('Type : A');
    expect(text).toContain('Note');
    expect(text).toContain('• Item 1');
    expect(text).toContain('Total : 100€');
  });
});

// ─── Email Sending ─────────────────────────────────────────────────────────

describe('sendEmail', () => {
  const mockConfig = {
    apiKey: 'test-api-key',
    defaultFrom: 'Test <no-reply@test.fr>',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should send email successfully', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'msg-123' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await sendEmail(
      {
        from: 'Test <no-reply@test.fr>',
        to: 'user@example.com',
        content: {
          subject: 'Test',
          text: 'Hello',
          html: '<p>Hello</p>',
        },
      },
      mockConfig
    );

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('msg-123');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-api-key',
        }),
      })
    );
  });

  it('should return error on API failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ message: 'Invalid API key' }),
      })
    );

    const result = await sendEmail(
      {
        from: 'Test <no-reply@test.fr>',
        to: 'user@example.com',
        content: { subject: 'Test', text: 'Hello', html: '<p>Hello</p>' },
      },
      mockConfig
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid API key');
  });

  it('should handle network errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const result = await sendEmail(
      {
        from: 'Test <no-reply@test.fr>',
        to: 'user@example.com',
        content: { subject: 'Test', text: 'Hello', html: '<p>Hello</p>' },
      },
      mockConfig
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');
  });

  it('should include replyTo when provided', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'msg-456' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await sendEmail(
      {
        from: 'Test <no-reply@test.fr>',
        to: 'user@example.com',
        replyTo: 'reply@test.fr',
        content: { subject: 'Test', text: 'Hello', html: '<p>Hello</p>' },
      },
      mockConfig
    );

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.reply_to).toEqual(['reply@test.fr']);
  });
});

describe('createEmailSender', () => {
  it('should create a bound sender function', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 'msg-789' }),
      })
    );

    const send = createEmailSender({ apiKey: 'test-key' });
    const result = await send({
      from: 'Test <no-reply@test.fr>',
      to: 'user@example.com',
      content: { subject: 'Test', text: 'Hello', html: '<p>Hello</p>' },
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('msg-789');
  });
});
