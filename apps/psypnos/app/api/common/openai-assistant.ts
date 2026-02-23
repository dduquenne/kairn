/**
 * Utilitaire pour interagir avec l'API des Assistants d'OpenAI
 * Utilise le SDK OpenAI v6 avec polling intégré
 */

import OpenAI from 'openai';

type AssistantResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

/**
 * Envoie un message à l'Assistant OpenAI et attend la réponse
 *
 * @param userMessage - Le message de l'utilisateur
 * @param assistantId - L'ID de votre assistant OpenAI (commence par "asst_")
 * @param apiKey - Votre clé API OpenAI
 * @returns La réponse de l'assistant
 */
export async function sendToAssistant(
  userMessage: string,
  assistantId: string,
  apiKey: string
): Promise<AssistantResponse> {
  try {
    const openai = new OpenAI({ apiKey });

    // Créer un thread avec le message et lancer le run en une seule opération
    // createAndRunPoll gère automatiquement le polling jusqu'à un état terminal
    const run = await openai.beta.threads.createAndRunPoll(
      {
        assistant_id: assistantId,
        thread: {
          messages: [{ role: 'user', content: userMessage }],
        },
      },
      { pollIntervalMs: 1000 }
    );

    if (run.status !== 'completed') {
      throw new Error(`Le run n'a pas abouti. Statut: ${run.status}`);
    }

    // Récupérer les messages de la conversation
    const messages = await openai.beta.threads.messages.list(run.thread_id);

    // Le premier message (le plus récent) est la réponse de l'assistant
    const assistantMessage = messages.data.find(msg => msg.role === 'assistant');

    if (!assistantMessage) {
      throw new Error("Aucune réponse de l'assistant trouvée");
    }

    // Extraire le contenu textuel
    const textContent = assistantMessage.content.find(block => block.type === 'text');

    if (!textContent || textContent.type !== 'text') {
      throw new Error('Aucun contenu textuel dans la réponse');
    }

    return {
      success: true,
      message: textContent.text.value,
    };
  } catch (error) {
    console.error("Erreur lors de l'appel à l'Assistant OpenAI:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}
