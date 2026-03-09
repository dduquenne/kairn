/**
 * Génération de pré-réponse IA pour les emails de notification admin.
 *
 * Appelle OpenAI GPT-4o-mini avec un timeout court (5 s).
 * En cas d'échec (timeout, erreur API, clé absente), retombe sur un
 * template statique contextuel — le praticien reçoit toujours une suggestion.
 */

const PRE_RESPONSE_TIMEOUT_MS = 5_000;
const PRE_RESPONSE_MODEL = 'gpt-4o-mini';
const PRE_RESPONSE_MAX_TOKENS = 300;

// ─── System Prompt (léger, adapté aux emails) ────────────────────────────────

const SYSTEM_PROMPT = `Tu es Nathalie Duquenne, sophrologue (sophrologie et relaxation, somatothérapie, breathwork & rebirth) à Saint-Julien-du-Sault.

Tu rédiges une réponse courte et chaleureuse à un message reçu via ton site appreciezvotrevie.fr.

Consignes :
- Vouvoie le correspondant, utilise son prénom si disponible.
- Ton empathique, bienveillant, professionnel — jamais familier.
- 3 à 5 phrases maximum.
- Accuse réception du message, montre que tu as compris la demande.
- Propose un prochain pas concret (prise de rendez-vous, appel, etc.).
- Ne fais aucune promesse thérapeutique ni diagnostic.
- Termine par une formule chaleureuse et ton nom complet.`;

// ─── Types ───────────────────────────────────────────────────────────────────

export type PreResponseInput = {
  /** Nom ou prénom du correspondant */
  name: string;
  /** Message envoyé */
  message: string;
  /** Sujet ou type de demande (optionnel) */
  subject?: string;
};

export type PreResponseResult = {
  /** Texte de la pré-réponse */
  text: string;
  /** Source : 'ai' si générée par OpenAI, 'fallback' si template statique */
  source: 'ai' | 'fallback';
};

// ─── Fallback statique ───────────────────────────────────────────────────────

function getStaticFallback(input: PreResponseInput): string {
  const firstName = input.name.split(' ')[0];

  if (input.subject?.toLowerCase().includes('rendez-vous') ||
      input.subject?.toLowerCase().includes('consultation') ||
      input.subject === 'premiere_consultation') {
    return (
      `Bonjour ${firstName},\n\n` +
      `Merci pour votre message et votre intérêt pour un accompagnement thérapeutique. ` +
      `J'ai bien pris note de votre demande et je reviendrai vers vous très prochainement ` +
      `pour convenir ensemble d'un créneau.\n\n` +
      `À très bientôt,\nNathalie Duquenne`
    );
  }

  if (input.subject?.toLowerCase().includes('séminaire') ||
      input.subject?.toLowerCase().includes('respiration') ||
      input.subject === 'seminaire') {
    return (
      `Bonjour ${firstName},\n\n` +
      `Merci pour votre message concernant les séminaires de breathwork & rebirth. ` +
      `Je reviendrai vers vous rapidement avec toutes les informations pratiques ` +
      `(dates, lieu, déroulement).\n\n` +
      `Chaleureusement,\nNathalie Duquenne`
    );
  }

  return (
    `Bonjour ${firstName},\n\n` +
    `Merci d'avoir pris le temps de me contacter. J'ai bien reçu votre message ` +
    `et je vous répondrai personnellement dans les meilleurs délais.\n\n` +
    `N'hésitez pas à me rappeler si vous souhaitez échanger par téléphone.\n\n` +
    `Bien à vous,\nNathalie Duquenne`
  );
}

// ─── Appel OpenAI ────────────────────────────────────────────────────────────

async function callOpenAI(input: PreResponseInput): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY manquante');
  }

  const userPrompt = [
    `Correspondant : ${input.name}`,
    input.subject ? `Objet : ${input.subject}` : null,
    `\nMessage :\n${input.message}`,
  ]
    .filter(Boolean)
    .join('\n');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PRE_RESPONSE_TIMEOUT_MS);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: PRE_RESPONSE_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: PRE_RESPONSE_MAX_TOKENS,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OpenAI API ${response.status}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) {
      throw new Error('Réponse OpenAI vide');
    }

    return text;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// ─── Export principal ────────────────────────────────────────────────────────

/**
 * Génère une pré-réponse pour l'email de notification admin.
 * Ne lève jamais d'exception — retombe toujours sur le fallback statique.
 */
export async function generatePreResponse(input: PreResponseInput): Promise<PreResponseResult> {
  try {
    const text = await callOpenAI(input);
    return { text, source: 'ai' };
  } catch (error) {
    console.warn('[pre-response] Fallback statique utilisé :', (error as Error).message ?? error);
    return { text: getStaticFallback(input), source: 'fallback' };
  }
}
