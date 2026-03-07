/**
 * Chatbot system prompt builder
 *
 * Generates context-aware system prompts for the conversational chatbot,
 * parametrized by site configuration.
 */

/** Configuration for building a chatbot system prompt */
export interface ChatbotPromptConfig {
  /** Site/practice name */
  siteName: string;
  /** Practitioner name */
  practitionerName: string;
  /** Practitioner title/specialty */
  practitionerTitle: string;
  /** List of specialties/services */
  specialties: string[];
  /** Practice location */
  location?: string;
  /** Contact information */
  contact?: {
    phone?: string;
    email?: string;
  };
  /** Session format description */
  sessionFormat?: string;
  /** Language for responses */
  language?: string;
  /** Additional context or rules */
  additionalContext?: string;
}

/** Suggested action types the chatbot can emit */
export type ChatbotActionType = 'appointment' | 'contact' | 'blog';

/** Parsed suggested action from chatbot response */
export interface ChatbotSuggestedAction {
  type: ChatbotActionType;
  label: string;
  url?: string;
}

/** Pattern to detect suggested actions in chatbot responses */
export const ACTION_PATTERN = /\[ACTION:(\w+)\]/g;

/** Default action labels in French */
const ACTION_LABELS: Record<string, string> = {
  appointment: 'Prendre rendez-vous',
  contact: 'Nous contacter',
  blog: 'Voir nos articles',
};

/** Default action URLs */
const ACTION_URLS: Record<string, string> = {
  appointment: '/contact',
  contact: '/contact',
  blog: '/blog',
};

/**
 * Build a system prompt for the chatbot based on site configuration.
 * The prompt instructs the AI to act as a helpful assistant for the practice.
 */
export function buildChatbotSystemPrompt(config: ChatbotPromptConfig): string {
  const lang = config.language || 'français';
  const specialtiesList = config.specialties.map(s => `- ${s}`).join('\n');

  let prompt = `Tu es l'assistant virtuel du cabinet "${config.siteName}".
Tu aides les visiteurs du site à obtenir des informations sur les services proposés.

## Praticien
- Nom : ${config.practitionerName}
- Titre : ${config.practitionerTitle}

## Spécialités
${specialtiesList}
`;

  if (config.location) {
    prompt += `\n## Localisation\n${config.location}\n`;
  }

  if (config.contact) {
    prompt += '\n## Contact\n';
    if (config.contact.phone) prompt += `- Téléphone : ${config.contact.phone}\n`;
    if (config.contact.email) prompt += `- Email : ${config.contact.email}\n`;
  }

  if (config.sessionFormat) {
    prompt += `\n## Format des séances\n${config.sessionFormat}\n`;
  }

  prompt += `
## Règles de réponse
- Réponds en ${lang}
- Sois chaleureux, empathique et professionnel
- Limite tes réponses à 2-3 paragraphes maximum
- Réponds directement aux questions avec empathie
- Quand c'est pertinent, suggère des actions : [ACTION:appointment], [ACTION:contact], [ACTION:blog]
- Ne pose pas de diagnostic médical, redirige vers un médecin pour les questions médicales
- Si tu ne connais pas la réponse, invite le visiteur à contacter directement le cabinet
`;

  if (config.additionalContext) {
    prompt += `\n## Contexte supplémentaire\n${config.additionalContext}\n`;
  }

  return prompt;
}

/**
 * Parse suggested actions from a chatbot response.
 * Extracts [ACTION:type] markers and replaces them with clean text.
 */
export function parseSuggestedActions(response: string): {
  cleanResponse: string;
  actions: ChatbotSuggestedAction[];
} {
  const actions: ChatbotSuggestedAction[] = [];
  const seen = new Set<string>();

  let match;
  const pattern = /\[ACTION:(\w+)\]/g;
  while ((match = pattern.exec(response)) !== null) {
    const type = match[1] as ChatbotActionType;
    if (!seen.has(type)) {
      seen.add(type);
      actions.push({
        type,
        label: ACTION_LABELS[type] || type,
        url: ACTION_URLS[type],
      });
    }
  }

  const cleanResponse = response.replace(ACTION_PATTERN, '').trim();
  return { cleanResponse, actions };
}

/**
 * Sanitize message history for API compatibility.
 * Ensures alternating user/assistant roles and valid structure.
 */
export function sanitizeMessageHistory(
  messages: Array<{ role: string; content: string }>
): Array<{ role: 'user' | 'assistant'; content: string }> {
  return messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .reduce<Array<{ role: 'user' | 'assistant'; content: string }>>((acc, msg) => {
      const role = msg.role as 'user' | 'assistant';
      // Skip if same role as previous (API needs alternating)
      const last = acc[acc.length - 1];
      if (acc.length > 0 && last && last.role === role) {
        return acc;
      }
      // First message must be from user
      if (acc.length === 0 && role !== 'user') {
        return acc;
      }
      acc.push({ role, content: msg.content });
      return acc;
    }, []);
}
