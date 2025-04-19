<<<<<<< HEAD
// supabase/functions/ai-component-info/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts'; // Import des headers

// --- Configuration ---
const AI_MODEL = "mistralai/mistral-7b-instruct:free"; // Utilisation de Mistral 7B Instruct (gratuit)
const MAX_EQUIVALENTS = 5;
const MAX_TOKENS_EQUIVALENTS = 250; // Un peu plus de tokens pour la sortie JSON

console.log(`[ai-component-info] Initializing function... Model: ${AI_MODEL}`);
=======
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

>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99

// --- Helper: extractJsonArray ---
// Extrait le premier bloc JSON ```json ... ``` ou un tableau JSON standard
function extractJsonArray(text: string): any[] | null {
    console.log("[extractJsonArray] Trying to extract JSON from text:", text.substring(0, 200) + (text.length > 200 ? '...' : ''));
    // Essayer d'abord avec les blocs de code Markdown ```json ... ```
    const codeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
        try {
            const parsed = JSON.parse(codeBlockMatch[1]);
            if (Array.isArray(parsed)) {
                console.log("[extractJsonArray] Extracted JSON array from code block.");
                return parsed;
            }
        } catch (e) {
            console.warn("[extractJsonArray] Failed to parse JSON from code block:", e.message);
        }
    }

    // Essayer de trouver un tableau JSON directement
    const startIndex = text.indexOf('[');
    const endIndex = text.lastIndexOf(']');
    if (startIndex !== -1 && endIndex > startIndex) {
         const potentialJson = text.substring(startIndex, endIndex + 1);
         try {
             const parsed = JSON.parse(potentialJson);
             if (Array.isArray(parsed)) {
                 console.log("[extractJsonArray] Extracted JSON array directly.");
                 return parsed;
             }
         } catch (e) {
             // Loguer l'erreur seulement si le bloc de code n'a pas fonctionné avant
             if (!codeBlockMatch) {
                 console.warn("[extractJsonArray] Failed to parse JSON directly:", e.message, "Text snippet:", potentialJson.substring(0, 100));
             }
         }
    }

    console.warn("[extractJsonArray] No valid JSON array found in text.");
    return null; // Retourner null si aucun tableau JSON valide n'est trouvé
}


// --- Serve Function ---
serve(async (req: Request) => {
  const requestStartTime = Date.now();
  console.log(`[ai-component-info] Request received: ${req.method} ${req.url}`);

  // --- Handle CORS Preflight (OPTIONS) ---
  if (req.method === 'OPTIONS') {
    console.log("[ai-component-info] Handling OPTIONS request");
    return new Response('ok', { headers: corsHeaders });
  }

  // --- Retrieve Secrets ---
  const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
  const appUrlReferer = Deno.env.get("APP_URL_REFERER");

<<<<<<< HEAD
  if (!openRouterApiKey) {
    console.error(`[ai-component-info] CRITICAL: OPENROUTER_API_KEY secret is not set!`);
    return new Response(JSON.stringify({
        equivalents: [], error: `Config serveur: Secret 'OPENROUTER_API_KEY' manquant.`
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
  if (!appUrlReferer) {
     console.error(`[ai-component-info] CRITICAL: APP_URL_REFERER secret is not set! OpenRouter requires it.`);
     return new Response(JSON.stringify({
        equivalents: [], error: `Config serveur: Secret 'APP_URL_REFERER' manquant.`
     }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }

  // --- Process POST Request ---
  let reference: string | null = null;
=======
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

>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99
  try {
     // Vérification méthode POST
    if (req.method !== 'POST') {
        throw new Error("Méthode non autorisée. Seul POST est accepté.");
    }

    const body = await req.json();
<<<<<<< HEAD
    reference = body.reference?.trim().toUpperCase() || null;
    console.log(`[ai-component-info] Processing request for equivalents: Ref='${reference}'`);

    if (!reference) {
      throw new Error("Référence composant (clé 'reference') manquante dans le corps JSON.");
    }

    // Prompt amélioré pour Mistral, insistant sur le format JSON strict
    const userPrompt = `Analyze the electronic component reference "${reference}". Identify up to ${MAX_EQUIVALENTS} direct technical equivalents. Focus on common, functional replacements. For each equivalent, provide ONLY its reference (key "ref") and a very brief justification (key "reason", e.g., 'Pin-compatible', 'Similar specs', 'CMOS version', 'Generic NPN'). Format the entire response STRICTLY as a valid JSON array of objects, like this example: [{"ref": "EQUIV1", "reason": "Justification 1"}, {"ref": "EQUIV2", "reason": "Justification 2"}]. Do not include any text before or after the JSON array. If no reliable equivalents are found, return an empty JSON array: []`;

=======
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
>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99
    const requestPayload = {
        model: AI_MODEL,
        messages: [{ role: "user", content: userPrompt }],
        max_tokens: MAX_TOKENS_EQUIVALENTS,
<<<<<<< HEAD
        temperature: 0.1, // Très basse température pour forcer le format JSON
        // response_format: { "type": "json_object" }, // Peut aider mais pas tous les modèles le supportent
    };

    console.log("[ai-component-info] Calling OpenRouter API...");
    const apiStartTime = Date.now();

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${openRouterApiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": appUrlReferer,
            // "X-Title": "StockAV-Equivalents", // Optionnel
        },
        body: JSON.stringify(requestPayload),
    });
    const apiEndTime = Date.now();
    console.log(`[ai-component-info] API call duration: ${apiEndTime - apiStartTime} ms. Status: ${response.status}`);
=======
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
>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99

    if (!response.ok) {
<<<<<<< HEAD
      const errorBodyText = await response.text();
      console.error(`[ai-component-info] OpenRouter API Error: Status ${response.status}, Body: ${errorBodyText}`);
      throw new Error(`Erreur API OpenRouter (${response.status}): ${errorBodyText.substring(0, 150)}${errorBodyText.length > 150 ? '...' : ''}`);
    }

    const data = await response.json();
    let equivalentList: { ref: string, reason: string }[] = [];

    if (data && data.choices && Array.isArray(data.choices) && data.choices.length > 0 &&
        data.choices[0].message && typeof data.choices[0].message.content === 'string') {
=======
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
>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99

        const rawContent = data.choices[0].message.content.trim();
<<<<<<< HEAD
        // Log Raw Content (utile si extractJsonArray échoue)
        // console.log("[ai-component-info] Raw content from AI:", rawContent);
        const parsedArray = extractJsonArray(rawContent);

        if (parsedArray !== null) {
            equivalentList = parsedArray
                .filter((item): item is { ref: string, reason: string } => // Type guard
                    typeof item === 'object' && item !== null &&
                    typeof item.ref === 'string' && item.ref.trim() !== '' &&
                    typeof item.reason === 'string' // raison peut être vide
                )
                .map(item => ({
                    ref: item.ref.trim().toUpperCase(), // Nettoyer et mettre en majuscule
                    reason: item.reason.trim()
                }))
                .slice(0, MAX_EQUIVALENTS);

            console.log(`[ai-component-info] Parsed and filtered equivalents: ${equivalentList.length} items.`);
        } else {
             console.warn("[ai-component-info] Could not extract a valid JSON array from AI response. Raw content logged above.");
             equivalentList = [];
        }
    } else {
        console.warn("[ai-component-info] Invalid response structure received from OpenRouter:", data);
        equivalentList = [];
    }

    // --- Return Structured Response to Frontend ---
    const finalResponse = { equivalents: equivalentList, error: null };
    const requestEndTime = Date.now();
    console.log(`[ai-component-info] Returning successful response. Found ${equivalentList.length} equivalents. Duration: ${requestEndTime - requestStartTime} ms.`);

=======
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
>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99
    return new Response(JSON.stringify(finalResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
<<<<<<< HEAD
    // --- General Error Handling ---
    const requestEndTime = Date.now();
    console.error(`[ai-component-info] !!! TOP LEVEL ERROR (Ref: ${reference || 'N/A'}, Duration: ${requestEndTime - requestStartTime} ms):`, error instanceof Error ? error.message : String(error));

    return new Response(JSON.stringify({
        equivalents: [], // Toujours retourner un tableau vide en cas d'erreur
        error: `Erreur Edge Function: ${error instanceof Error ? error.message : "Erreur interne inconnue."}`
=======
    // --- Gestion Générale des Erreurs ---
    console.error(`!!! TOP LEVEL ERROR in Edge Function (Ref: ${reference}):`, error.message, error.stack);
    // Retourner une structure d'erreur que le frontend peut gérer
    return new Response(JSON.stringify({
        equivalents: null, // Ou [], selon la préférence de gestion d'erreur frontend
        error: error.message || "Erreur interne du serveur Edge Function."
>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

<<<<<<< HEAD
console.log("[ai-component-info] Edge Function listener started.");
=======
console.log("Edge Function 'ai-component-info' (Equivalents Focus) listener started.");
>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99
