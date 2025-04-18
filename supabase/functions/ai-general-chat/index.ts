// supabase/functions/ai-general-chat/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts'; // Import des headers

// --- Configuration ---
const CONVERSATIONAL_AI_MODEL = "mistralai/mistral-7b-instruct:free"; // Utilisation de Mistral 7B Instruct (gratuit)
const MAX_TOKENS_CHAT = 350; // Un peu plus de tokens pour le chat

console.log(`[ai-general-chat] Initializing function... Model: ${CONVERSATIONAL_AI_MODEL}`);

serve(async (req: Request) => {
  const requestStartTime = Date.now();
  console.log(`[ai-general-chat] Request received: ${req.method} ${req.url}`);

  // --- Handle CORS Preflight (OPTIONS) ---
  if (req.method === 'OPTIONS') {
    console.log("[ai-general-chat] Handling OPTIONS request");
    return new Response('ok', { headers: corsHeaders });
  }

  // --- Retrieve Secrets ---
  const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
  const appUrlReferer = Deno.env.get("APP_URL_REFERER"); // Requis par OpenRouter

  if (!openRouterApiKey) {
    console.error(`[ai-general-chat] CRITICAL: OPENROUTER_API_KEY secret is not set!`);
    return new Response(JSON.stringify({
        reply: null, error: `Config serveur: Secret 'OPENROUTER_API_KEY' manquant.`
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
   if (!appUrlReferer) {
     console.error(`[ai-general-chat] CRITICAL: APP_URL_REFERER secret is not set! OpenRouter requires it.`);
     return new Response(JSON.stringify({
        reply: null, error: `Config serveur: Secret 'APP_URL_REFERER' manquant.`
     }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }


  let userQuery: string | null = null;
  let history: { role: string, content: string }[] = [];

  try {
    // Vérification méthode POST
    if (req.method !== 'POST') {
        throw new Error("Méthode non autorisée. Seul POST est accepté.");
    }

    const body = await req.json();
    userQuery = body.query?.trim() || null;

    if (body.history && Array.isArray(body.history)) {
        history = body.history.filter(
            (msg): msg is { role: string, content: string } =>
                typeof msg === 'object' && msg !== null &&
                typeof msg.role === 'string' &&
                typeof msg.content === 'string'
        ).slice(-10); // Garde les 10 derniers messages valides
    }

    if (!userQuery) {
      throw new Error("Texte utilisateur (clé 'query') manquante dans le corps JSON.");
    }
    console.log(`[ai-general-chat] Processing query: "${userQuery}" with ${history.length} history messages.`);

    const systemPrompt = "Tu es StockAV, un assistant IA utile spécialisé dans l'électronique et la gestion de stock pour une petite entreprise ou un maker space. Réponds de manière concise, technique mais accessible, et pertinente à la demande de l'utilisateur en tenant compte de la conversation précédente. N'invente pas d'informations si tu ne sais pas.";
    const messages = [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: userQuery }
    ];
    const requestPayload = {
        model: CONVERSATIONAL_AI_MODEL,
        messages: messages,
        max_tokens: MAX_TOKENS_CHAT,
        temperature: 0.7 // Température standard pour le chat
    };

    console.log("[ai-general-chat] Calling OpenRouter API...");
    const apiStartTime = Date.now();

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${openRouterApiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": appUrlReferer,
            // "X-Title": "StockAV-Chat", // Optionnel
        },
        body: JSON.stringify(requestPayload),
    });
    const apiEndTime = Date.now();
    console.log(`[ai-general-chat] API call duration: ${apiEndTime - apiStartTime} ms. Status: ${response.status}`);

    if (!response.ok) {
        const errorBodyText = await response.text();
        console.error(`[ai-general-chat] OpenRouter API Error: Status ${response.status}, Body: ${errorBodyText}`);
        throw new Error(`Erreur API OpenRouter (${response.status}): ${errorBodyText.substring(0, 150)}${errorBodyText.length > 150 ? '...' : ''}`);
    }

    const data = await response.json();
    let aiReply = "Désolé, je n'ai pas pu obtenir de réponse valide de l'IA."; // Message par défaut amélioré
    if (data && data.choices && Array.isArray(data.choices) && data.choices.length > 0 &&
        data.choices[0].message && typeof data.choices[0].message.content === 'string') {
        aiReply = data.choices[0].message.content.trim();
    } else {
        console.warn("[ai-general-chat] Invalid or empty response structure received from OpenRouter:", data);
    }

    // --- Retourner la réponse texte ---
    const finalResponse = { reply: aiReply, error: null };
    const requestEndTime = Date.now();
    console.log(`[ai-general-chat] Returning successful reply. Duration: ${requestEndTime - requestStartTime} ms.`);

    return new Response(JSON.stringify(finalResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    // --- General Error Handling ---
    const requestEndTime = Date.now();
    console.error(`[ai-general-chat] !!! TOP LEVEL ERROR (Query: ${userQuery || 'N/A'}, Duration: ${requestEndTime - requestStartTime} ms):`, error instanceof Error ? error.message : String(error));
    return new Response(JSON.stringify({
        reply: null,
        error: `Erreur Edge Function: ${error instanceof Error ? error.message : "Erreur interne inconnue."}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

console.log("[ai-general-chat] Edge Function listener started.");