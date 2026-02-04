/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { NextResponse } from "next/server";
import { z } from "zod";

import { validateCSRFMiddleware } from "../common/csrf-middleware";
import { sendToAssistant } from "../common/openai-assistant";
import { recordAttempt, getClientIP } from "../common/rate-limiter";

const assistantSchema = z.object({
  message: z.string().trim().min(1).max(10000),
  meta: z
    .object({
      honeypot: z.string().optional().transform((value) => value?.trim() ?? "")
    })
    .default({ honeypot: "" })
});

type AssistantPayload = z.infer<typeof assistantSchema>;

export async function POST(request: Request) {
  // PROTECTION : Rate limiting - 10 requêtes par heure par IP (API coûteuse)
  const clientIP = getClientIP(request);
  const rateLimitResult = recordAttempt("assistant", clientIP);

  if (rateLimitResult.limited) {
    return NextResponse.json(
      {
        message: "Trop de requêtes. Veuillez réessayer plus tard.",
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
        },
      }
    );
  }

  // Valider le token CSRF
  const csrfError = await validateCSRFMiddleware(request);
  if (csrfError) {
    return csrfError;
  }

  let payload: AssistantPayload;

  try {
    const body = await request.json();
    const parsed = assistantSchema.safeParse(body);

    if (!parsed.success) {
      // SÉCURITÉ : Messages d'erreur génériques
      return NextResponse.json({ message: "Données invalides." }, { status: 400 });
    }

    payload = parsed.data;
  } catch (error) {
    return NextResponse.json({ message: "Données invalides." }, { status: 400 });
  }

  // Protection anti-spam (honeypot)
  if (payload.meta.honeypot) {
    return NextResponse.json({ success: true, message: "Message reçu" });
  }

  // Récupérer les variables d'environnement
  const apiKey = process.env.OPENAI_API_KEY;
  const assistantId = process.env.OPENAI_ASSISTANT_ID;

  if (!apiKey) {
    console.error("OPENAI_API_KEY n'est pas configurée");
    return NextResponse.json(
      { message: "Le service n'est pas configuré." },
      { status: 500 }
    );
  }

  if (!assistantId) {
    console.error("OPENAI_ASSISTANT_ID n'est pas configurée");
    return NextResponse.json(
      { message: "L'assistant n'est pas configuré." },
      { status: 500 }
    );
  }

  try {
    // Envoyer le message à l'Assistant OpenAI
    const response = await sendToAssistant(payload.message, assistantId, apiKey);

    if (!response.success) {
      throw new Error(response.error || "Erreur lors de l'appel à l'assistant");
    }

    return NextResponse.json({
      success: true,
      message: response.message
    });
  } catch (error) {
    console.error("Erreur lors de l'appel à l'assistant:", error);
    return NextResponse.json(
      {
        message: "Une erreur est survenue. Veuillez réessayer dans quelques instants."
      },
      { status: 500 }
    );
  }
}
