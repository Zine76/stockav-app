// --- START OF FILE supabase/functions/ai-general-chat/index.ts (V-GoogleAI) ---
// Modifié pour utiliser l'API Google Gemini directement

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts'; // Import des headers CORS partagés

// --- Configuration Google AI ---
const GOOGLE_AI_MODEL_CHAT = 'gemini-1.5-flash-latest'; // Modèle Gemini optimisé pour le chat rapide
const MAX_TOKENS_GOOGLE_CHAT = 500; // Limite de tokens pour la réponse du chat Gemini

console.log(`[ai-general-chat V-GoogleAI] Initializing function... Model: ${GOOGLE_AI_MODEL_CHAT}`);

serve(async (req: Request) => {
  const requestStartTime = Date.now();
  console.log(`[ai-general-chat V-GoogleAI] Request received: ${req.method} ${req.url}`);

  // --- Handle CORS Preflight (OPTIONS) (INCHANGÉ) ---
  if (req.method === 'OPTIONS') {
    console.log("[ai-general-chat V-GoogleAI] Handling OPTIONS request");
    return new Response('ok', { headers: corsHeaders });
  }

  // --- Retrieve Secrets (Modifié) ---
  const googleApiKey = Deno.env.get("GOOGLE_AI_API_KEY"); // Utilisation de la clé Google

  if (!googleApiKey) {
    console.error(`[ai-general-chat V-GoogleAI] CRITICAL: GOOGLE_AI_API_KEY secret is not set!`);
    return new Response(JSON.stringify({
        reply: null, error: `Config serveur: Secret 'GOOGLE_AI_API_KEY' manquant.`
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
  // Pas besoin d'APP_URL_REFERER pour l'API Google

  // --- Process POST Request (Logique similaire, adaptée pour Google) ---
  let userQuery: string | null = null;
  let history: { role: string, content: string }[] = [];

  try {
    // Vérification méthode POST (INCHANGÉ)
    if (req.method !== 'POST') {
        throw new Error("Méthode non autorisée. Seul POST est accepté.");
    }

    const body = await req.json();
    userQuery = body.query?.trim() || null;

    // Validation et filtrage de l'historique (INCHANGÉ, sauf rôle 'assistant' -> 'model')
    if (body.history && Array.isArray(body.history)) {
        history = body.history.filter(
            (msg): msg is { role: string, content: string } =>
                typeof msg === 'object' && msg !== null &&
                typeof msg.role === 'string' && typeof msg.content === 'string'
        ).map(msg => ({ // Mapper 'assistant' vers 'model' pour Google
            role: msg.role === 'assistant' ? 'model' : msg.role,
            content: msg.content
        })).slice(-10); // Garde les 10 derniers messages valides
    }

    if (!userQuery) {
      throw new Error("Texte utilisateur (clé 'query') manquante dans le corps JSON.");
    }
    console.log(`[ai-general-chat V-GoogleAI] Processing query: "${userQuery}" with ${history.length} history messages.`);

    // Construction des messages pour l'API Google
    const systemPromptText = "Tu es StockAV, un assistant IA utile spécialisé dans l'électronique et la gestion de stock pour une petite entreprise ou un maker space. Réponds de manière concise, technique mais accessible, et pertinente à la demande de l'utilisateur en tenant compte de la conversation précédente. N'invente pas d'informations si tu ne sais pas. Évite de proposer de rechercher des composants ou équivalents, sauf si l'utilisateur insiste lourdement, car une autre fonction IA spécialisée gère cela.";

    // Structure 'contents' pour Google Gemini
    const googleContents = history.map(msg => ({
        // Assure que le rôle est 'user' ou 'model'
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
    }));
    // Ajoute la requête actuelle de l'utilisateur
    googleContents.push({
        role: 'user',
        parts: [{ text: userQuery }]
    });

    // Préparation de la requête vers Google Gemini
    const googleRequestPayload = {
        contents: googleContents,
        systemInstruction: { // Instruction système pour Gemini 1.5+
             parts: [{ text: systemPromptText }]
        },
        generationConfig: {
            // responseMimeType: "text/plain", // On veut du texte simple
            maxOutputTokens: MAX_TOKENS_GOOGLE_CHAT,
            temperature: 0.75, // Température standard pour un chat créatif mais cohérent
            topP: 0.95,
            topK: 40 // Paramètres standards pour un chat
        },
        // Ajout des Safety Settings (optionnel mais recommandé)
        safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        ]
    };

    console.log("[ai-general-chat V-GoogleAI] Calling Google AI API...");
    const apiStartTime = Date.now();

    // --- Appel API Google Gemini (Modifié) ---
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GOOGLE_AI_MODEL_CHAT}:generateContent?key=${googleApiKey}`;

    const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json", // On attend du JSON
        },
        body: JSON.stringify(googleRequestPayload),
    });

    const apiEndTime = Date.now();
    console.log(`[ai-general-chat V-GoogleAI] Google API call duration: ${apiEndTime - apiStartTime} ms. Status: ${response.status}`);

    // --- Gestion Réponse Google Gemini (Modifié) ---
    if (!response.ok) {
        const errorBodyText = await response.text();
        console.error(`[ai-general-chat V-GoogleAI] Google AI API Error: Status ${response.status}, Body: ${errorBodyText}`);
        let detail = `Erreur API Google AI Chat (${response.status})`;
         try {
             const errJson = JSON.parse(errorBodyText);
             detail = errJson.error?.message || detail;
             if (errJson.error?.status) detail += ` (${errJson.error.status})`;
             // Gérer spécifiquement les erreurs de quota ou clé invalide
             if (detail.includes("API key not valid") || detail.includes("invalid API key")) {
                 detail = "Clé API Google invalide ou non autorisée.";
             } else if (detail.includes("quota") || response.status === 429) {
                 detail = "Quota Google AI atteint. Réessayez plus tard.";
             }
         } catch (_) { /* keep generated detail */ }
         // Retourner 429 si Google retourne 429, sinon 502 (Bad Gateway)
         return new Response(JSON.stringify({ reply: null, error: detail }),
             { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status === 429 ? 429 : 502 });
    }

    const data = await response.json();
    let aiReply = "Désolé, je n'ai pas pu obtenir de réponse valide de l'IA."; // Message par défaut
    let errorFromAI: string | null = null;
    let rawContent: string | null = null;

    // Extraction de la réponse texte de Gemini
    try {
        // Vérifier si la réponse a été bloquée
        if (data?.candidates?.[0]?.finishReason && data.candidates[0].finishReason !== 'STOP') {
            console.warn(`[ai-general-chat V-GoogleAI] Google AI response finished due to: ${data.candidates[0].finishReason}`);
            if (data.candidates[0].finishReason === 'SAFETY') {
                 errorFromAI = "La réponse a été bloquée par les filtres de sécurité de l'IA.";
            } else if (data.candidates[0].finishReason === 'MAX_TOKENS') {
                 aiReply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || aiReply; // Prendre le texte partiel
                 aiReply += "... (réponse tronquée)";
                 console.log("[ai-general-chat V-GoogleAI] Response truncated due to MAX_TOKENS.");
            } else {
                 errorFromAI = `La réponse a été interrompue (${data.candidates[0].finishReason}).`;
            }
        }
        // Vérifier si le prompt a été bloqué
        else if (data?.promptFeedback?.blockReason) {
             console.warn(`[ai-general-chat V-GoogleAI] Google AI blocked the prompt: ${data.promptFeedback.blockReason}`);
             errorFromAI = `La requête a été bloquée par les filtres de sécurité de l'IA (${data.promptFeedback.blockReason}).`;
        }
        // Extraire le contenu si tout va bien
        else {
            rawContent = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
            if (rawContent) {
                aiReply = rawContent;
            } else {
                 console.warn("[ai-general-chat V-GoogleAI] Invalid or empty text content in Google AI response:", JSON.stringify(data));
                 // Garder le message par défaut "Désolé..." si aucun texte n'est trouvé mais pas d'erreur explicite
            }
        }

    } catch (parseError) {
         console.error("[ai-general-chat V-GoogleAI] Error processing Google AI response structure:", parseError, JSON.stringify(data));
         errorFromAI = "Erreur interne lors du traitement de la réponse IA.";
    }

    // --- Retourner la réponse texte au frontend ---
    const finalResponse = {
        reply: errorFromAI ? null : aiReply, // Si une erreur spécifique est détectée, on ne renvoie pas de reply
        error: errorFromAI // Renvoie l'erreur détectée le cas échéant
    };
    const requestEndTime = Date.now();
    console.log(`[ai-general-chat V-GoogleAI] Returning response. Reply generated: ${!errorFromAI}. Duration: ${requestEndTime - requestStartTime} ms.`);

    return new Response(JSON.stringify(finalResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // Toujours 200 OK ici, l'erreur est dans le JSON si besoin
    });

  } catch (error) {
    // --- Gestion Générale des Erreurs (INCHANGÉ) ---
    const requestEndTime = Date.now();
    console.error(`[ai-general-chat V-GoogleAI] !!! TOP LEVEL CATCH ERROR (Query: ${userQuery || 'N/A'}, Duration: ${requestEndTime - requestStartTime} ms):`, error instanceof Error ? error.message : String(error));

    return new Response(JSON.stringify({
        reply: null,
        error: `Erreur Edge Function (ai-general-chat V-GoogleAI): ${error instanceof Error ? error.message : "Erreur interne inconnue."}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

console.log("[ai-general-chat V-GoogleAI] Edge Function listener started.");
// --- END OF FILE supabase/functions/ai-general-chat/index.ts (V-GoogleAI) ---
