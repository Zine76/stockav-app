// supabase/functions/openai-equivalents/index.ts
// (ou supabase/functions/ai-component-info/index.ts si vous l'avez renommé)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// Assure-toi que le chemin vers cors.ts est correct
import { corsHeaders } from '../_shared/cors.ts';

// --- Configuration ---
const AI_MODEL = "meta-llama/llama-3.1-70b-instruct:free"; // Modèle IA utilisé
const MAX_EQUIVALENTS = 5; // Max équivalents à retourner
const MAX_TOKENS_EQUIVALENTS = 150; // Tokens pour la liste d'équivalents

console.log("Edge Function 'ai-component-info' (Equivalents Focus) initializing...");

// --- Helper: Fonction pour extraire et parser le premier bloc JSON array ---
// (Cette fonction aide à gérer si l'IA retourne du texte avant/après le JSON)
function extractJsonArray(text: string): any[] | null {
  console.log("Attempting to extract JSON array from text...");
  const firstSquare = text.indexOf('[');
  if (firstSquare === -1) {
    console.log("No opening square bracket found.");
    return null;
  }

  let openCount = 0;
  let end = -1;
  for (let i = firstSquare; i < text.length; i++) {
    if (text[i] === '[') {
      openCount++;
    } else if (text[i] === ']') {
      openCount--;
      if (openCount === 0) {
        end = i;
        break;
      }
    }
  }

  if (end === -1) {
    console.log("Incomplete JSON array structure (no matching closing bracket).");
    return null;
  }

  const jsonString = text.substring(firstSquare, end + 1);
  console.log("Extracted potential JSON array string:", jsonString);

  try {
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed)) {
        console.log("Successfully parsed as JSON array.");
        return parsed;
    } else {
        console.warn("Parsed content is JSON, but not an array.");
        return null;
    }
  } catch (e) {
    console.error("JSON Array Parsing failed:", e.message);
    return null;
  }
}


serve(async (req: Request) => {
  console.log(`Request received: ${req.method} ${req.url}`);

  // --- Gestion CORS Pré-vol (OPTIONS) ---
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request (CORS preflight)");
    return new Response('ok', { headers: corsHeaders });
  }

  // --- Récupération des Secrets ---
  const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
  const appUrlReferer = Deno.env.get("APP_URL_REFERER");

  if (!openRouterApiKey || !appUrlReferer) {
    const missingKey = !openRouterApiKey ? "OPENROUTER_API_KEY" : "APP_URL_REFERER";
    console.error(`CRITICAL: ${missingKey} secret is not set!`);
    // Utilisation de la structure de réponse attendue par le frontend
    return new Response(JSON.stringify({
        equivalents: [], // Ou null, selon ce que gère le mieux le frontend en cas d'erreur serveur
        error: `Configuration serveur: Secret '${missingKey}' manquant.`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
    });
  }

  // --- Traitement de la Requête POST ---
  let reference: string | null = null;

  try {
    const body = await req.json();
    // Accepte 'reference' ou 'param1' pour la compatibilité
    reference = body.reference?.trim().toUpperCase() || body.param1?.trim().toUpperCase() || null;

    console.log(`Processing request for equivalents: Ref='${reference}'`);

    // --- Validation de l'entrée ---
    if (!reference) {
      throw new Error("Référence composant (reference/param1) manquante.");
    }

    // --- Construction du Prompt Spécifique pour Équivalents ---
    const userPrompt = `Trouve jusqu'à ${MAX_EQUIVALENTS} équivalents techniques directs pour le composant électronique "${reference}". Concentre-toi sur les remplacements courants et fonctionnels. Pour chaque équivalent, fournis uniquement sa référence et une très courte justification (ex: 'Pin-compatible', 'Specs similaires', 'Version CMOS', 'NPN générique'). Formate la réponse **UNIQUEMENT** comme un tableau JSON d'objets, comme ceci : [{"ref": "REF_1", "reason": "Raison 1"}, {"ref": "REF_2", "reason": "Raison 2"}]. Si aucun équivalent fiable n'est trouvé, retourne un tableau JSON vide : []`;

    console.log(`Prompt for equivalents (${reference}):\n${userPrompt}`);

    // --- Préparation de l'appel API OpenRouter ---
    const requestPayload = {
        model: AI_MODEL,
        messages: [{ role: "user", content: userPrompt }],
        max_tokens: MAX_TOKENS_EQUIVALENTS,
        temperature: 0.2, // Très factuel
        // Demande explicite de JSON si le modèle le supporte bien
        response_format: { type: "json_object" }
    };

    console.log("Calling OpenRouter API with payload:", JSON.stringify(requestPayload));

    // --- Appel à l'API OpenRouter ---
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterApiKey}`,
        "Content-Type": "application/json",
        // *** AJOUT CRUCIAL ICI ***
        "Accept": "application/json", // Indique qu'on attend du JSON en retour
        // **************************
        "HTTP-Referer": appUrlReferer,
        "X-Title": "StockAV - Equivalents"
      },
      body: JSON.stringify(requestPayload),
    });

    // --- Gestion de la Réponse OpenRouter ---
    if (!response.ok) {
      // Si le statut n'est PAS 2xx (ex: 406, 401, 500 etc.)
      const errorBody = await response.text();
      console.error(`ERROR - OpenRouter API Error (${response.status}): ${errorBody}`);
      let detail = `Erreur API IA (${response.status})`;
      try {
          // Essayer de parser le message d'erreur si c'est du JSON
          const errJson = JSON.parse(errorBody);
          detail = errJson.error?.message || errJson.error || detail;
      } catch (_) {
          // Si ce n'est pas du JSON, utiliser le texte brut (tronqué si trop long)
          detail = errorBody.length > 150 ? errorBody.substring(0, 150) + "..." : errorBody;
      }
      throw new Error(detail); // Lance une erreur qui sera catchée plus bas
    }

    // Si response.ok est true (statut 2xx)
    const data = await response.json(); // On s'attend à du JSON maintenant
    console.log("Raw response from OpenRouter:", JSON.stringify(data));

    // --- Extraction et Formatage de la Réponse ---
    let equivalentList: any[] = []; // Initialise à un tableau vide

    if (data.choices && data.choices.length > 0 && data.choices[0].message?.content) {
        const rawContent = data.choices[0].message.content.trim();
        console.log(`Raw content received from AI for equivalents:\n${rawContent}`);

        // Utilise l'helper pour extraire le tableau JSON, même s'il y a du texte autour
        const parsedArray = extractJsonArray(rawContent);

        if (parsedArray !== null) {
            console.log("Successfully parsed JSON array content.");
            equivalentList = parsedArray
                .filter(item => item && typeof item.ref === 'string' && item.ref.trim() !== '')
                .map(item => ({
                    ref: item.ref.trim().toUpperCase(),
                    reason: typeof item.reason === 'string' ? item.reason.trim() : 'Suggestion AI'
                }))
                .slice(0, MAX_EQUIVALENTS);
            console.log(`${equivalentList.length} equivalents processed.`);
        } else {
             console.warn("Failed to extract/parse JSON array from AI response. Returning empty list as requested in prompt.");
             // Conformément au prompt, on retourne [] si le parsing échoue ou si ce n'est pas un tableau
             equivalentList = [];
        }
    } else {
        console.warn("No valid content/choices found in AI response. Returning empty list.");
        equivalentList = []; // Retourne aussi une liste vide si l'IA ne répond rien
    }

    // --- Retourner la Réponse Structurée au Frontend ---
    // Le frontend (script.js) attend un objet { equivalents: [...] } ou { error: "..." }
    const finalResponse = {
        equivalents: equivalentList,
        error: null // Pas d'erreur si on arrive ici
    };

    console.log("Returning structured response:", JSON.stringify(finalResponse));
    return new Response(JSON.stringify(finalResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    });

  } catch (error) {
    // --- Gestion Générale des Erreurs ---
    console.error(`!!! TOP LEVEL ERROR in Edge Function (Ref: ${reference}):`, error.message, error.stack);
    // Retourner une structure d'erreur que le frontend peut gérer
    return new Response(JSON.stringify({
        equivalents: null, // Ou [], selon la préférence de gestion d'erreur frontend
        error: error.message || "Erreur interne du serveur Edge Function."
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
    });
  }
});

console.log("Edge Function 'ai-component-info' (Equivalents Focus) listener started.");
