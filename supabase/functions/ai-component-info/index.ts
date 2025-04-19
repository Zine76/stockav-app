// --- START OF FILE supabase/functions/ai-component-info/index.ts (CORRECTED) ---

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts'; // Import des headers

// --- Configuration ---
const AI_MODEL = "mistralai/mistral-7b-instruct:free"; // Utilisation de Gemini 2.5 Pro (vérifier dispo/nom exact si besoin)
const MAX_EQUIVALENTS = 5;
const MAX_TOKENS_EQUIVALENTS = 250; // Un peu plus de tokens pour la sortie JSON

console.log(`[ai-component-info] Initializing function... Model: ${AI_MODEL}`);

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
  try {
     // Vérification méthode POST
    if (req.method !== 'POST') {
        throw new Error("Méthode non autorisée. Seul POST est accepté.");
    }

    const body = await req.json();
    // Accepte 'reference' (nouvelle version) ou 'param1' (ancienne ?)
    reference = body.reference?.trim().toUpperCase() || body.param1?.trim().toUpperCase() || null;
    console.log(`[ai-component-info] Processing request for equivalents: Ref='${reference}'`);

    if (!reference) {
      throw new Error("Référence composant (clé 'reference' ou 'param1') manquante dans le corps JSON.");
    }

    // Prompt amélioré pour forcer le format JSON strict
    const userPrompt = `Analyze the electronic component reference "${reference}". Identify up to ${MAX_EQUIVALENTS} direct technical equivalents. Focus on common, functional replacements. For each equivalent, provide ONLY its reference (key "ref") and a very brief justification (key "reason", e.g., 'Pin-compatible', 'Similar specs', 'CMOS version', 'Generic NPN'). Format the entire response STRICTLY as a valid JSON array of objects, like this example: [{"ref": "EQUIV1", "reason": "Justification 1"}, {"ref": "EQUIV2", "reason": "Justification 2"}]. Do not include any text before or after the JSON array. If no reliable equivalents are found, return an empty JSON array: []`;

    const requestPayload = {
        model: AI_MODEL,
        messages: [{ role: "user", content: userPrompt }],
        max_tokens: MAX_TOKENS_EQUIVALENTS,
        temperature: 0.1, // Très basse température pour forcer le format JSON
        // response_format: { "type": "json_object" }, // Décommenter si le modèle le supporte bien et si besoin
    };

    console.log("[ai-component-info] Calling OpenRouter API...");
    const apiStartTime = Date.now();

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${openRouterApiKey}`,
            "Content-Type": "application/json",
            "Accept": "application/json", // Bonne pratique d'indiquer ce qu'on accepte
            "HTTP-Referer": appUrlReferer,
            // "X-Title": "StockAV-Equivalents", // Optionnel
        },
        body: JSON.stringify(requestPayload),
    });
    const apiEndTime = Date.now();
    console.log(`[ai-component-info] API call duration: ${apiEndTime - apiStartTime} ms. Status: ${response.status}`);

    if (!response.ok) {
      const errorBodyText = await response.text();
      console.error(`[ai-component-info] OpenRouter API Error: Status ${response.status}, Body: ${errorBodyText}`);
      let detail = `Erreur API OpenRouter (${response.status})`;
       try { // Essayer de parser pour un message d'erreur plus clair
           const errJson = JSON.parse(errorBodyText);
           detail = errJson.error?.message || errJson.error || detail;
       } catch (_) {
           detail = errorBodyText.length > 150 ? errorBodyText.substring(0, 150) + "..." : errorBodyText;
       }
      throw new Error(detail);
    }

    const data = await response.json();
    let equivalentList: { ref: string, reason: string }[] = [];

    if (data && data.choices && Array.isArray(data.choices) && data.choices.length > 0 &&
        data.choices[0].message && typeof data.choices[0].message.content === 'string') {

        const rawContent = data.choices[0].message.content.trim();
        // Log Raw Content peut être utile si extractJsonArray échoue encore
        // console.log("[ai-component-info] Raw content from AI:", rawContent);
        const parsedArray = extractJsonArray(rawContent);

        if (parsedArray !== null) {
            equivalentList = parsedArray
                .filter((item): item is { ref: string, reason: string } => // Type guard pour vérifier la structure
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
             console.warn("[ai-component-info] Could not extract a valid JSON array from AI response. Raw content was logged. Returning empty list as per prompt.");
             equivalentList = []; // Comme demandé dans le prompt si pas d'équivalent ou erreur format
        }
    } else {
        console.warn("[ai-component-info] Invalid response structure received from OpenRouter:", data);
        equivalentList = []; // Retourner vide si la structure de réponse est inattendue
    }

    // --- Return Structured Response to Frontend ---
    const finalResponse = { equivalents: equivalentList, error: null };
    const requestEndTime = Date.now();
    console.log(`[ai-component-info] Returning successful response. Found ${equivalentList.length} equivalents. Duration: ${requestEndTime - requestStartTime} ms.`);

    return new Response(JSON.stringify(finalResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    // --- General Error Handling ---
    const requestEndTime = Date.now();
    console.error(`[ai-component-info] !!! TOP LEVEL ERROR (Ref: ${reference || 'N/A'}, Duration: ${requestEndTime - requestStartTime} ms):`, error instanceof Error ? error.message : String(error));

    // S'assurer de toujours renvoyer la structure attendue par le frontend
    return new Response(JSON.stringify({
        equivalents: [], // Toujours retourner un tableau vide en cas d'erreur pour la fonction équivalents
        error: `Erreur Edge Function (ai-component-info): ${error instanceof Error ? error.message : "Erreur interne inconnue."}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500, // Indiquer une erreur serveur
    });
  }
});

console.log("[ai-component-info] Edge Function listener started.");
// --- END OF FILE supabase/functions/ai-component-info/index.ts (CORRECTED) ---