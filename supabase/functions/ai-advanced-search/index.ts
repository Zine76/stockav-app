// --- START OF FILE supabase/functions/ai-advanced-search/index.ts (V7 - Clean Revert) ---

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// IMPORTANT: Ensure cors.ts is ALSO reverted or uses the corrected version from previous steps
import { corsHeaders } from '../_shared/cors.ts';

// --- Configuration ---
const AI_MODEL = "meta-llama/llama-4-scout:free5";
const MAX_RESULTS = 6;
const MAX_TOKENS_SEARCH = 1600;

console.log(`[ai-advanced-search V7 Revert] Initializing function... Model: ${AI_MODEL}, Max Results: ${MAX_RESULTS}`);

// --- Helper: extractJsonArray V2 (As provided in V7 context) ---
function extractJsonArray(text: string): any[] | null {
    console.log("[extractJsonArray V2] Attempting extraction from text:", text.substring(0, 300) + (text.length > 300 ? '...' : ''));
    const codeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
        try {
            let potentialJson = codeBlockMatch[1];
             potentialJson = potentialJson.replace(/,\s*([}\]])/g, '$1');
            const parsed = JSON.parse(potentialJson);
            if (Array.isArray(parsed)) {
                console.log("[extractJsonArray V2] Extracted JSON array from code block.");
                return parsed;
            }
        } catch (e) {
            console.warn("[extractJsonArray V2] Failed to parse JSON from code block (even after cleanup):", e.message);
        }
    }
    const startIndex = text.indexOf('[');
    const endIndex = text.lastIndexOf(']');
    if (startIndex !== -1 && endIndex > startIndex) {
         const potentialJson = text.substring(startIndex, endIndex + 1).replace(/,\s*([}\]])/g, '$1');
         try {
             const parsed = JSON.parse(potentialJson);
             if (Array.isArray(parsed)) {
                 console.log("[extractJsonArray V2] Extracted JSON array using fallback indexOf/lastIndexOf.");
                 return parsed;
             }
         } catch (e) {
             console.warn("[extractJsonArray V2] Fallback extraction failed:", e.message, "Snippet:", potentialJson.substring(0, 100));
         }
    }
    console.error("[extractJsonArray V2] No valid JSON array found in text.");
    return null;
}


// --- Serve Function ---
serve(async (req: Request) => {
  const requestStartTime = Date.now();
  console.log(`[ai-advanced-search V7 Revert] Request received: ${req.method} ${req.url}`);

  // --- CORS Handling ---
  if (req.method === 'OPTIONS') {
    console.log("[ai-advanced-search V7 Revert] Handling OPTIONS request");
    // Use the imported corsHeaders, ensure cors.ts is correct!
    return new Response('ok', { headers: corsHeaders });
  }

  const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
  const appUrlReferer = Deno.env.get("APP_URL_REFERER");

  if (!openRouterApiKey || !appUrlReferer) {
    const missing = !openRouterApiKey ? "OPENROUTER_API_KEY" : "APP_URL_REFERER";
    console.error(`[ai-advanced-search V7 Revert] CRITICAL: ${missing} secret is not set!`);
    return new Response(JSON.stringify({ results: [], error: `Config serveur: Secret '${missing}' manquant.` }),
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
        history = body.history.filter(
            (msg): msg is { role: string, content: string } =>
                typeof msg === 'object' && msg !== null &&
                typeof msg.role === 'string' && typeof msg.content === 'string'
        ).slice(-4); // V7 history limit
    }

    if (!userQuery) throw new Error("Texte utilisateur (clé 'query') manquante.");

    console.log(`[ai-advanced-search V7 Revert] Processing query: "${userQuery}"`);
    console.log(`[ai-advanced-search V7 Revert] History length: ${history.length}`);
    console.log(`[ai-advanced-search V7 Revert] Local stock context received: ${localStockContext ? 'Yes' : 'No'}`);

    // --- SYSTEM PROMPT (Exact V7 Prompt) ---
    const systemPrompt = `Tu es StockAV, un assistant IA expert en composants électroniques. Analyse la requête et fournis des suggestions VÉRIFIABLES.

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
    `; // --- END OF SYSTEM PROMPT (V7) ---

    const messages = [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: userQuery }
    ];

    const requestPayload = {
        model: AI_MODEL,
        messages: messages,
        max_tokens: MAX_TOKENS_SEARCH,
        temperature: 0.1,
    };

    console.log("[ai-advanced-search V7 Revert] Calling OpenRouter API...");
    const apiStartTime = Date.now();
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${openRouterApiKey}`,
            "Content-Type": "application/json",
            "Accept": "application/json", // Keep headers from v9.x JS calls
            "HTTP-Referer": appUrlReferer, // Keep headers from v9.x JS calls
        },
        body: JSON.stringify(requestPayload),
    });
    const apiEndTime = Date.now();
    console.log(`[ai-advanced-search V7 Revert] API call duration: ${apiEndTime - apiStartTime} ms. Status: ${response.status}`);

    // --- Gestion Réponse (Identique à V7 originale) ---
    if (!response.ok) {
        const errorBodyText = await response.text();
        console.error(`[ai-advanced-search V7 Revert] OpenRouter API Error: Status ${response.status}, Body: ${errorBodyText}`);
        let detail = `Erreur API OpenRouter (${response.status})`;
         try {
             const errJson = JSON.parse(errorBodyText);
             detail = errJson.error?.message || errJson.error || detail;
             if (detail.toLowerCase().includes("rate limit exceeded")) {
                 detail = "Limite d'appels OpenRouter atteinte.";
             }
         } catch (_) { /* keep generated detail */ }
        return new Response(JSON.stringify({ results: [], error: detail }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status === 429 ? 429 : 502 });
    }

    const data = await response.json();
    let searchResults: any[] = [];
    let errorFromAI: string | null = null;

    if (data?.choices?.[0]?.message?.content) {
        const rawContent = data.choices[0].message.content.trim();
        console.log("[ai-advanced-search V7 Revert] Raw content received from AI:", rawContent);
        const parsedArray = extractJsonArray(rawContent);

        if (parsedArray !== null) {
             searchResults = parsedArray.filter(item =>
                 typeof item === 'object' && item !== null && typeof item.ref === 'string'
             ).slice(0, MAX_RESULTS);

             console.log(`[ai-advanced-search V7 Revert] Parsed and filtered results: ${searchResults.length} items.`);

             if (searchResults.length === 1 && searchResults[0].type === 'error') {
                 console.warn("[ai-advanced-search V7 Revert] AI returned the standard error message JSON.");
                 errorFromAI = searchResults[0].ref;
                 searchResults = [];
             }
             // NOTE: This version does NOT add links deterministically. It relies on the AI generating them.
        } else {
             console.error("[ai-advanced-search V7 Revert] CRITICAL: Failed to extract valid JSON array from AI response. Raw content was:", rawContent);
             throw new Error("Format de réponse IA invalide (JSON non trouvé/parsable).");
        }
    } else {
        console.warn("[ai-advanced-search V7 Revert] Invalid or empty response structure received from OpenRouter:", data);
        throw new Error("Structure de réponse IA invalide.");
    }

    const finalResponse = {
        results: searchResults,
        error: errorFromAI
    };
    const requestEndTime = Date.now();
    console.log(`[ai-advanced-search V7 Revert] Returning response. Found ${searchResults.length} results. AI Error flag: ${errorFromAI !== null}. Duration: ${requestEndTime - requestStartTime} ms.`);

    // IMPORTANT: Ensure correct headers are sent back, including CORS
    return new Response(JSON.stringify(finalResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const requestEndTime = Date.now();
    console.error(`[ai-advanced-search V7 Revert] !!! TOP LEVEL CATCH ERROR (Query: ${userQuery || 'N/A'}, Duration: ${requestEndTime - requestStartTime} ms):`, error instanceof Error ? error.message : String(error));
    // Ensure CORS headers are sent even on internal errors
    return new Response(JSON.stringify({
        results: [],
        error: `Erreur interne fonction Edge (ai-advanced-search): ${error instanceof Error ? error.message : "Erreur interne inconnue."}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

console.log("[ai-advanced-search V7 Revert] Edge Function listener started.");
// --- END OF FILE supabase/functions/ai-advanced-search/index.ts (V7 - Clean Revert) ---