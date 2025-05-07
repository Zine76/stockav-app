// --- START OF FILE supabase/functions/ai-advanced-search/index.ts (V-GoogleAI - MODIFIED MODEL + JSON Fallback) ---
// Changements:
// 1. Utilise gemini-1.5-flash-latest
// 2. Ajout d'un fallback pour renvoyer un JSON d'erreur standard si l'extraction du JSON de l'IA échoue.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';

// --- Configuration Google AI ---
const GOOGLE_AI_MODEL = 'gemini-1.5-flash-latest'; // Utilisation de Flash
const MAX_RESULTS = 6;
const MAX_TOKENS_GOOGLE = 2048;

console.log(`[ai-advanced-search V-GoogleAI Modified+Fallback] Initializing function... Model: ${GOOGLE_AI_MODEL}`);

// --- Helper: extractJsonArray (INCHANGÉ) ---
function extractJsonArray(text: string): any[] | null {
    console.log("[extractJsonArray] Attempting extraction from text:", text.substring(0, 300) + (text.length > 300 ? '...' : ''));
    const codeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
        try {
            let potentialJson = codeBlockMatch[1].replace(/,\s*([}\]])/g, '$1');
            const parsed = JSON.parse(potentialJson);
            if (Array.isArray(parsed)) {
                console.log("[extractJsonArray] Extracted JSON array from code block.");
                return parsed;
            }
        } catch (e) {
            console.warn("[extractJsonArray] Failed to parse JSON from code block:", e.message);
        }
    }
    const startIndex = text.indexOf('[');
    const endIndex = text.lastIndexOf(']');
    if (startIndex !== -1 && endIndex > startIndex) {
         let potentialJson = text.substring(startIndex, endIndex + 1).replace(/,\s*([}\]])/g, '$1');
         try {
             const parsed = JSON.parse(potentialJson);
             if (Array.isArray(parsed)) {
                 console.log("[extractJsonArray] Extracted JSON array using fallback.");
                 return parsed;
             }
         } catch (e) {
             console.warn("[extractJsonArray] Fallback extraction failed:", e.message);
         }
    }
    console.error("[extractJsonArray] No valid JSON array found in text.");
    return null;
}

// --- Serve Function ---
serve(async (req: Request) => {
  const requestStartTime = Date.now();
  console.log(`[ai-advanced-search V-GoogleAI Modified+Fallback] Request received: ${req.method} ${req.url}`);

  // --- CORS Handling (INCHANGÉ) ---
  if (req.method === 'OPTIONS') {
    console.log("[ai-advanced-search V-GoogleAI Modified+Fallback] Handling OPTIONS request");
    return new Response('ok', { headers: corsHeaders });
  }

  // --- Récupération des Secrets (INCHANGÉ) ---
  const googleApiKey = Deno.env.get("GOOGLE_AI_API_KEY");
  if (!googleApiKey) {
    console.error(`[ai-advanced-search V-GoogleAI Modified+Fallback] CRITICAL: GOOGLE_AI_API_KEY secret is not set!`);
    return new Response(JSON.stringify({ results: [], error: `Config serveur: Secret 'GOOGLE_AI_API_KEY' manquant.` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }

  let userQuery: string | null = null;
  let history: { role: string, content: string }[] = [];
  let localStockContext: Record<string, { qty: number, drawer: string | null }> | null = null;

  try {
    if (req.method !== 'POST') throw new Error("Méthode non autorisée.");
    const body = await req.json();
    userQuery = body.query?.trim() || null;
    localStockContext = body.localStockContext || null;
    if (body.history && Array.isArray(body.history)) {
        history = body.history.filter( /* ... (filtrage inchangé) ... */
             (msg): msg is { role: string, content: string } =>
                typeof msg === 'object' && msg !== null &&
                typeof msg.role === 'string' && typeof msg.content === 'string'
        ).map(msg => ({ role: msg.role === 'assistant' ? 'model' : msg.role, content: msg.content })).slice(-4);
    }
    if (!userQuery) throw new Error("Texte utilisateur (clé 'query') manquante.");

    console.log(`[ai-advanced-search V-GoogleAI Modified+Fallback] Processing query: "${userQuery}"`);

    // --- SYSTEM PROMPT (INCHANGÉ) ---
    const systemPromptText = `Tu es StockAV, un assistant IA expert en composants électroniques. Analyse la requête et fournis des suggestions VÉRIFIABLES.

    **Instructions STRICTES :**

    1.  **Analyse l'intention:**
        *   **Juste une référence** (ex: "LM358N"): Vérifie \`localStockContext\` d'abord. Trouve jusqu'à ${MAX_RESULTS - 1} équivalents RÉELS.
        *   **Recherche par specs** (ex: "Capacité 100nF 50V"): Trouve max ${MAX_RESULTS} composants RÉELS correspondants. Priorise le stock local.
        *   **Demande d'équivalents** (ex: "équivalent pour NE555 DIP"): Trouve max ${MAX_RESULTS} équivalents RÉELS. Priorise le stock local.
        *   **Demande de comparaison** ou **autre requête non listée** : Ne fournis PAS de réponse libre. Retourne **UNIQUEMENT** le JSON d'erreur standard (voir point 8).
    2.  **Détecte type composant:** Précis (Résistor, Capacitor, Op-Amp...).
    3.  **Extrais contraintes:** Valeur, Tension(V), Courant(A), Package, etc.
    4.  **Contexte local:** Si un composant demandé/équivalent est dans \`localStockContext\` (qty > 0), mentionne-le en PREMIER (is_local: true, local_qty, local_drawer). Vérifie REF exacte (casse non sensible).
    5.  **Suggestions RÉELLES:** UNIQUEMENT des références EXISTANTES. N'INVENTE JAMAIS.
    6.  **Liens de RECHERCHE (Canada + Ali):** Génère les liens Digi-Key Canada (.ca/en/), Mouser Canada (.ca/Search/Refine), ET AliExpress (.com/wholesale) pour CHAQUE suggestion (locale ou externe). Encode la référence pour l'URL (ex: '+' -> '%2B', espaces -> '+').
        *   DK.ca: \`https://www.digikey.ca/en/products/result?keywords={ENCODED_REF}\`
        *   Mouser.ca: \`https://www.mouser.ca/Search/Refine?Keyword={ENCODED_REF}\`
        *   AliExpress: \`https://www.aliexpress.com/wholesale?SearchText={ENCODED_REF}\`
    7.  **Format OBLIGATOIRE:** Réponds **UNIQUEMENT** avec un tableau JSON valide et **AUCUN AUTRE TEXTE**. Structure objet:
        \`\`\`json
        {
          "ref": "REF_EXACTE",
          "type": "Type précis détecté",
          "is_local": boolean,
          "local_qty": number | null,
          "local_drawer": string | null,
          "specs": { /* 3-4 specs CLÉS selon type */ },
          "reason": "Justification si équivalent" | null,
          "availability": {
            "digikey": "URL DK.ca",
            "mouser": "URL Mouser.ca",
            "aliexpress": "URL AliExpress"
          }
        }
        \`\`\`
    8.  **Gestion d'erreur STRICTE:** Si requête trop vague, comparaison demandée, etc. -> Retourne **IMPÉRATIVEMENT et UNIQUEMENT** ce JSON: \`[{\\"ref\\": \\"Désolé, je ne peux pas traiter cette demande précisément ou fournir de comparaison directe.\\", \\"type\\": \\"error\\", \\"is_local\\": false, \\"local_qty\\": null, \\"local_drawer\\": null, \\"specs\\": {}, \\"reason\\": null, \\"availability\\": {}}]\`. **Jamais** de texte libre ou tableau vide [].
    9.  **Conciseness:** Infos essentielles dans le JSON.

    **Contexte Stock Local (Ignorer si vide {}):**
    \`\`\`json
    ${localStockContext ? JSON.stringify(localStockContext, null, 2) : "{}"}
    \`\`\`
    `;

    // --- Construction du Payload pour Google Gemini (INCHANGÉ) ---
    const googleContents = history.map(msg => ({ role: msg.role, parts: [{ text: msg.content }] }));
    googleContents.push({ role: 'user', parts: [{ text: userQuery }] });
    const googleRequestPayload = {
        contents: googleContents,
        systemInstruction: { parts: [{ text: systemPromptText }] },
        generationConfig: {
            responseMimeType: "application/json",
            maxOutputTokens: MAX_TOKENS_GOOGLE,
            temperature: 0.1, topP: 0.9, topK: 1
        },
        safetySettings: [ /* ... (inchangé) ... */
             { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
             { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
             { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
             { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        ]
    };

    // --- Appel API Google Gemini (INCHANGÉ) ---
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GOOGLE_AI_MODEL}:generateContent?key=${googleApiKey}`;
    console.log(`[ai-advanced-search V-GoogleAI Modified+Fallback] Calling Google AI API (Model: ${GOOGLE_AI_MODEL})...`);
    const apiStartTime = Date.now();
    const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(googleRequestPayload),
    });
    const apiEndTime = Date.now();
    console.log(`[ai-advanced-search V-GoogleAI Modified+Fallback] Google API call duration: ${apiEndTime - apiStartTime} ms. Status: ${response.status}`);

    // --- Gestion Réponse Google Gemini (INCHANGÉ jusqu'à l'extraction) ---
    if (!response.ok) { /* ... (gestion erreur API inchangée) ... */
        const errorBodyText = await response.text();
        console.error(`[ai-advanced-search V-GoogleAI Modified+Fallback] Google AI API Error: Status ${response.status}, Body: ${errorBodyText}`);
        let detail = `Erreur API Google AI (${response.status})`;
         try {
             const errJson = JSON.parse(errorBodyText);
             detail = errJson.error?.message || detail;
             if (errJson.error?.status) detail += ` (${errJson.error.status})`;
              if (detail.includes("API key not valid") || detail.includes("invalid API key")) {
                  detail = "Clé API Google invalide ou non autorisée.";
              } else if (detail.includes("quota") || response.status === 429) {
                  detail = "Quota Google AI atteint. Réessayez plus tard.";
              }
         } catch (_) { /* keep generated detail */ }
        return new Response(JSON.stringify({ results: [], error: detail }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status === 429 ? 429 : 502 });
    }

    const data = await response.json();
    let searchResults: any[] = [];
    let errorFromAI: string | null = null;
    let rawContent: string | null = null;

    // Extraction de la réponse de Gemini (logique inchangée pour détecter erreurs sécurité/blocage/max_tokens)
    try {
        const candidate = data?.candidates?.[0];
        if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
             console.warn(`[ai-advanced-search V-GoogleAI Modified+Fallback] Google AI response finished due to: ${candidate.finishReason}`);
             if (candidate.finishReason === 'SAFETY') { errorFromAI = "La réponse (recherche avancée) a été bloquée par les filtres de sécurité de l'IA."; }
             else if (candidate.finishReason === 'MAX_TOKENS') { rawContent = candidate?.content?.parts?.[0]?.text?.trim() || null; errorFromAI = "Réponse IA tronquée (MAX_TOKENS), tentative d'extraction JSON échouée."; }
             else { errorFromAI = `La réponse (recherche avancée) a été interrompue (${candidate.finishReason}).`; }
        } else if (data?.promptFeedback?.blockReason) {
             console.warn(`[ai-advanced-search V-GoogleAI Modified+Fallback] Google AI blocked the prompt: ${data.promptFeedback.blockReason}`);
             errorFromAI = `La requête (recherche avancée) a été bloquée par les filtres de sécurité de l'IA (${data.promptFeedback.blockReason}).`;
        } else {
             rawContent = candidate?.content?.parts?.[0]?.text?.trim() || null;
        }
        if (!rawContent && !errorFromAI) { errorFromAI = "Structure de réponse Google AI invalide ou vide."; }
    } catch (parseError) {
         console.error("[ai-advanced-search V-GoogleAI Modified+Fallback] Error processing Google AI response structure:", parseError);
         errorFromAI = "Erreur interne lors du traitement de la réponse IA.";
    }

    // Extraction et Validation JSON
    if (rawContent) {
        console.log("[ai-advanced-search V-GoogleAI Modified+Fallback] Raw content received from AI:", rawContent);
        const parsedArray = extractJsonArray(rawContent);

        if (parsedArray !== null) {
             searchResults = parsedArray.filter( /* ... (filtrage inchangé) ... */
                 item => typeof item === 'object' && item !== null && typeof item.ref === 'string'
             ).slice(0, MAX_RESULTS);
             console.log(`[ai-advanced-search V-GoogleAI Modified+Fallback] Parsed and filtered results: ${searchResults.length} items.`);
             if (searchResults.length === 1 && searchResults[0].type === 'error') {
                 console.warn("[ai-advanced-search V-GoogleAI Modified+Fallback] AI returned the standard error message JSON.");
                 errorFromAI = searchResults[0].ref; // Utiliser l'erreur de l'IA
                 searchResults = []; // Vider les résultats
             } else {
                 if (errorFromAI?.includes("MAX_TOKENS")) errorFromAI = null; // Réussite malgré troncature
             }
        } else {
             // <<< MODIFICATION : Fallback si extractJsonArray échoue >>>
             console.error("[ai-advanced-search V-GoogleAI Modified+Fallback] CRITICAL: Failed to extract valid JSON array from AI response. Forcing standard error.");
             // S'il n'y a pas déjà une erreur plus grave (sécurité, etc.)
             if (!errorFromAI) {
                 errorFromAI = "Désolé, je ne peux pas traiter cette demande précisément ou fournir de comparaison directe."; // L'erreur standard définie dans le prompt
             }
             // Dans tous les cas où le JSON n'est pas valide, on vide les résultats
             searchResults = [];
             // <<< FIN MODIFICATION >>>
        }
    } else if (errorFromAI) {
        // S'il y a une erreur (sécurité, etc.) et pas de contenu brut, assurer que searchResults est vide
        searchResults = [];
    }

    // --- Construction de la réponse finale (INCHANGÉ) ---
    const finalResponse = {
        results: searchResults, // Sera [] si erreur ou extraction échouée
        error: errorFromAI // Message d'erreur ou null
    };
    const requestEndTime = Date.now();
    console.log(`[ai-advanced-search V-GoogleAI Modified+Fallback] Returning response. Found ${searchResults.length} results. Error flag: ${errorFromAI !== null}. Duration: ${requestEndTime - requestStartTime} ms.`);

    // --- Retour de la réponse au frontend (INCHANGÉ) ---
    return new Response(JSON.stringify(finalResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    // --- Gestion des erreurs Top-Level (INCHANGÉ) ---
    const requestEndTime = Date.now();
    console.error(`[ai-advanced-search V-GoogleAI Modified+Fallback] !!! TOP LEVEL CATCH ERROR:`, error);
    return new Response(JSON.stringify({
        results: [],
        error: `Erreur interne fonction Edge (ai-advanced-search V-GoogleAI Modified+Fallback): ${error instanceof Error ? error.message : "Erreur interne inconnue."}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

console.log("[ai-advanced-search V-GoogleAI Modified+Fallback] Edge Function listener started.");
// --- END OF FILE supabase/functions/ai-advanced-search/index.ts (V-GoogleAI - MODIFIED MODEL + JSON Fallback) ---
