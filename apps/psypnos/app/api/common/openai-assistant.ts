// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Utilitaire pour interagir avec l'API des Assistants d'OpenAI
 */

type AssistantMessage = {
  role: "user" | "assistant";
  content: string;
};

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
    // Étape 1: Créer un thread (fil de conversation)
    const threadResponse = await fetch("https://api.openai.com/v1/threads", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v2"
      }
    });

    if (!threadResponse.ok) {
      const error = await threadResponse.json().catch(() => ({}));
      throw new Error(error.error?.message || "Impossible de créer le thread");
    }

    const thread = await threadResponse.json();
    const threadId = thread.id;

    // Étape 2: Ajouter le message de l'utilisateur au thread
    const messageResponse = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "OpenAI-Beta": "assistants=v2"
        },
        body: JSON.stringify({
          role: "user",
          content: userMessage
        })
      }
    );

    if (!messageResponse.ok) {
      const error = await messageResponse.json().catch(() => ({}));
      throw new Error(error.error?.message || "Impossible d'ajouter le message");
    }

    // Étape 3: Lancer un "run" avec l'assistant
    const runResponse = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/runs`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "OpenAI-Beta": "assistants=v2"
        },
        body: JSON.stringify({
          assistant_id: assistantId
        })
      }
    );

    if (!runResponse.ok) {
      const error = await runResponse.json().catch(() => ({}));
      throw new Error(error.error?.message || "Impossible de lancer le run");
    }

    const run = await runResponse.json();
    const runId = run.id;

    // Étape 4: Attendre que le run se termine (polling)
    let runStatus = run.status;
    let attempts = 0;
    const maxAttempts = 30; // 30 secondes max

    while (
      runStatus !== "completed" &&
      runStatus !== "failed" &&
      runStatus !== "cancelled" &&
      runStatus !== "expired" &&
      attempts < maxAttempts
    ) {
      // Attendre 1 seconde entre chaque vérification
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const statusResponse = await fetch(
        `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "OpenAI-Beta": "assistants=v2"
          }
        }
      );

      if (!statusResponse.ok) {
        throw new Error("Impossible de vérifier le statut du run");
      }

      const statusData = await statusResponse.json();
      runStatus = statusData.status;
      attempts++;
    }

    if (runStatus !== "completed") {
      throw new Error(`Le run n'a pas abouti. Statut: ${runStatus}`);
    }

    // Étape 5: Récupérer les messages (la réponse de l'assistant)
    const messagesResponse = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/messages`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "OpenAI-Beta": "assistants=v2"
        }
      }
    );

    if (!messagesResponse.ok) {
      throw new Error("Impossible de récupérer les messages");
    }

    const messagesData = await messagesResponse.json();
    const messages = messagesData.data;

    // Le premier message (le plus récent) est la réponse de l'assistant
    const assistantMessage = messages.find(
      (msg: any) => msg.role === "assistant"
    );

    if (!assistantMessage) {
      throw new Error("Aucune réponse de l'assistant trouvée");
    }

    // Extraire le contenu textuel
    const textContent = assistantMessage.content.find(
      (content: any) => content.type === "text"
    );

    if (!textContent) {
      throw new Error("Aucun contenu textuel dans la réponse");
    }

    return {
      success: true,
      message: textContent.text.value
    };
  } catch (error) {
    console.error("Erreur lors de l'appel à l'Assistant OpenAI:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue"
    };
  }
}
