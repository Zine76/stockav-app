// supabase/functions/ai-component-info/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// Ajustement du chemin relatif pour l'import CORS
import { corsHeaders } from '../_shared/cors.ts';

// --- Configuration ---
const AI_MODEL = "meta-llama/llama-3.1-70b-instruct:free"; // ou autre modèle compatible
const MAX_EQUIVALENTS = 5;
const MAX_TOKENS_DEFAULT = 350; // Augmenté un peu
const MAX_TOKENS_EQUIVALENTS = 200;
const MAX_TOKENS_COMPARE = 400;

console.log("Edge Function 'ai-component-info' initializing...");

// Helper to safely parse JSON from potentially messy AI output
function safeJsonParse(text: string): any | null {
  // Try finding JSON object {} or array []
  const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (jsonMatch && jsonMatch[0]) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.warn("safeJsonParse: Failed to parse extracted JSON:", e.message);
      return null;
    }
  }
  return null;
}

serve(async (req: Request) => {
  const requestStart = Date.now();
  console.log(`Request received: ${req.method} ${req.url}`);

  // --- Gestion CORS Pré-vol (OPTIONS) ---
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request (CORS preflight)");
    return new Response('ok', { headers: corsHeaders });
  }

  // --- Récupération des Secrets ---
  const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
  const appUrlReferer = Deno.env.get("APP_URL_REFERER"); // Requis par OpenRouter

  // --- Initialiser la réponse en cas d'erreur précoce ---
  let errorResponsePayload = { response_type: "error", content: "Erreur inconnue." };
  let status = 500; // Défaut à 500, mais on essaiera de retourner 200 avec l'erreur structurée

  try {
    if (!openRouterApiKey || !appUrlReferer) {
      const missingKey = !openRouterApiKey ? "OPENROUTER_API_KEY" : "APP_URL_REFERER";
      console.error(`CRITICAL: ${missingKey} secret is not set!`);
      errorResponsePayload.content = `Configuration serveur: Secret '${missingKey}' manquant.`;
      status = 500;
      // Ne retourne pas encore, lance l'erreur pour être attrapée par le catch final
      throw new Error(errorResponsePayload.content);
    }

    // --- Traitement de la Requête POST ---
    let requestType: string = 'unknown';
    let ref1: string | null = null;
    let ref2: string | null = null;
    // let history: any[] = []; // Historique désactivé pour l'instant

    const body = await req.json();
    requestType = body.request_type?.toLowerCase().trim() || 'unknown';
    ref1 = body.reference1?.trim().toUpperCase() || null;
    ref2 = body.reference2?.trim().toUpperCase() || null;
    // history = Array.isArray(body.history) ? body.history : []; // Si réactivé

    console.log(`Processing request: Type='${requestType}', Ref1='${ref1}', Ref2='${ref2}'`);

    // --- Validation des entrées ---
    // Types de requêtes valides attendus par cette fonction
     const validRequestTypes = ['equivalents', 'describe', 'pinout', 'compare', 'quantity']; // Ajouté 'quantity' pour gérer les demandes de stock directes si besoin

    if (!validRequestTypes.includes(requestType)) {
        errorResponsePayload.content = `Type de requête invalide ou non supporté par l'IA: '${requestType}'. Utilisez: ${validRequestTypes.join(', ')}.`;
        status = 400; // Bad Request
        throw new Error(errorResponsePayload.content);
    }
    // Référence 1 requise pour tous les types gérés ici
    if (!ref1) {
      errorResponsePayload.content = `Référence principale (reference1) manquante pour la requête '${requestType}'.`;
      status = 400;
      throw new Error(errorResponsePayload.content);
    }
    // Référence 2 requise seulement pour 'compare'
    if (requestType === 'compare' && !ref2) {
      errorResponsePayload.content = "Deux références sont nécessaires pour la comparaison.";
      status = 400;
      throw new Error(errorResponsePayload.content);
    }

    // --- Construction du Prompt Spécifique ---
    let systemPrompt = "Tu es un assistant spécialisé en composants électroniques. Réponds de manière concise et technique, en français. Si un format JSON est demandé, fournis UNIQUEMENT le JSON valide et rien d'autre (pas d'introduction, pas d'explication).";
    let userPrompt = "";
    let maxTokens = MAX_TOKENS_DEFAULT;

    switch (requestType) {
        case 'quantity':
             // Note: La quantité est normalement gérée par script.js directement via DB.
             // Si on voulait que l'IA commente, on pourrait faire :
             userPrompt = `Donne une phrase très courte indiquant que l'utilisateur demande la quantité pour ${ref1}. NE CHERCHE PAS la quantité toi-même.`;
             // Mais il vaut mieux que le front gère ça. On renvoie une erreur ou un message indiquant que c'est géré autrement.
             console.warn("Requête 'quantity' reçue par la fonction IA, normalement gérée par le frontend.");
             errorResponsePayload.content = `La vérification de quantité pour ${ref1} est gérée directement.`;
             errorResponsePayload.response_type = 'info'; // Peut-être un type info ? Ou error ?
             status = 200; // Pas une erreur serveur, juste une info
             // Pas besoin d'appeler l'IA, on retourne directement
             return new Response(JSON.stringify(errorResponsePayload), {
                 headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status,
             });
             // break; // N'atteindra pas ici

        case 'equivalents':
            maxTokens = MAX_TOKENS_EQUIVALENTS;
            userPrompt = `Liste jusqu'à ${MAX_EQUIVALENTS} équivalents techniques directs pour "${ref1}". Pour chaque équivalent, fournis sa référence et une justification ultra-courte (max 5 mots, ex: 'Pin-compatible', 'Specs proches', 'NPN générique').\nFormat de réponse OBLIGATOIRE: Un tableau JSON d'objets [{ "ref": "REF_1", "reason": "Raison 1" }, ...].\nNE PAS inclure d'autre texte ou explication. Si aucun équivalent trouvé, retourne [].`;
            break;
        case 'describe':
            userPrompt = `Décris la fonction principale et le type du composant "${ref1}" en 1 ou 2 phrases maximum. Sois technique et concis. Réponds uniquement avec la description textuelle.`;
            break;
        case 'pinout':
            userPrompt = `Donne le brochage (pinout) standard pour "${ref1}". Liste chaque broche: "Numéro: Nom/Fonction". Privilégie le boîtier DIP ou SOIC si plusieurs existent. Si complexe ou variable, indique-le brièvement. Réponds uniquement avec la liste du brochage.`;
            break;
        case 'compare':
            maxTokens = MAX_TOKENS_COMPARE;
            userPrompt = `Compare "${ref1}" et "${ref2}". Liste 2-3 similitudes et 2-3 différences clés (tension, courant, package, etc.).\nFormat de réponse OBLIGATOIRE: Un objet JSON {"similarities": ["sim1", ...], "differences": ["diff1", ...], "notes": "Optionnel: note brève si comparaison difficile."}.\nNE PAS inclure d'autre texte ou explication. Si non comparable, mets les raisons dans "notes".`;
            break;
    }

    console.log(`Prompt pour '${requestType}' (${ref1}${ref2 ? ' vs ' + ref2 : ''}):\n${userPrompt}`);

    // --- Appel à l'API OpenRouter ---
    console.log(`Appel API OpenRouter (Modèle: ${AI_MODEL}, MaxTokens: ${maxTokens})`);
    const apiStartTime = Date.now();
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": appUrlReferer,
        "X-Title": "StockAV"
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ],
        max_tokens: maxTokens,
        temperature: 0.2, // Plus déterministe pour les formats structurés
        // response_format: (requestType === 'equivalents' || requestType === 'compare') ? { "type": "json_object" } : undefined, // Essayer si modèle supporte bien
      }),
    });
    const apiEndTime = Date.now();
    console.log(`Appel OpenRouter terminé en ${apiEndTime - apiStartTime} ms. Statut: ${response.status}`);

    // --- Gestion de la Réponse OpenRouter ---
    if (!response.ok) {
      const errorBodyText = await response.text();
      console.error(`Erreur API OpenRouter (${response.status}): ${errorBodyText}`);
      errorResponsePayload.content = `Erreur communication API IA (${response.status} ${response.statusText}). Vérifiez la console de la fonction Edge pour détails.`;
      status = 502; // Bad Gateway (erreur de l'API externe)
      throw new Error(errorResponsePayload.content);
    }

    const data = await response.json();
    console.log("Réponse brute reçue d'OpenRouter:", JSON.stringify(data));

    // --- Extraction et Formatage de la Réponse ---
    let responseContent: any = null; // Peut être string, array ou object

    if (data.choices && data.choices.length > 0 && data.choices[0].message?.content) {
        const rawContent = data.choices[0].message.content.trim();
        console.log(`Contenu brut reçu de l'IA pour '${requestType}':\n${rawContent}`);

        // Tentative de parsing ou utilisation directe
        if (requestType === 'equivalents') {
            const parsed = safeJsonParse(rawContent);
            if (Array.isArray(parsed)) {
                 responseContent = parsed
                    .filter(item => item && typeof item.ref === 'string' && item.ref.trim() !== '')
                    .map(item => ({
                        ref: item.ref.trim().toUpperCase(),
                        reason: typeof item.reason === 'string' ? item.reason.trim() : 'Suggestion AI'
                    }))
                    .slice(0, MAX_EQUIVALENTS);
                 console.log(`${responseContent.length} équivalents parsés.`);
            } else {
                 console.warn("Échec parsing JSON pour équivalents, retour tableau vide.");
                 responseContent = []; // Retourne tableau vide si parsing échoue
                 // On pourrait ajouter une note d'erreur ici si besoin
            }
        } else if (requestType === 'compare') {
             const parsed = safeJsonParse(rawContent);
             if (typeof parsed === 'object' && parsed !== null && (Array.isArray(parsed.similarities) || Array.isArray(parsed.differences))) {
                 responseContent = {
                     similarities: Array.isArray(parsed.similarities) ? parsed.similarities.map(String) : [],
                     differences: Array.isArray(parsed.differences) ? parsed.differences.map(String) : [],
                     notes: typeof parsed.notes === 'string' ? parsed.notes : null
                 };
                 console.log("Objet de comparaison parsé.");
             } else {
                 console.warn("Échec parsing JSON pour comparaison, retourne texte brut en fallback.");
                 responseContent = rawContent || "L'IA n'a pas fourni de comparaison structurée."; // Fallback
             }
        } else {
            // Pour 'describe' et 'pinout', prendre le texte brut
            responseContent = rawContent;
            console.log(`Contenu textuel extrait pour '${requestType}'.`);
        }

    } else {
        // Si l'IA ne renvoie rien ou une structure inattendue
        console.log("Aucun contenu ou choix valide reçu de l'IA.");
        responseContent = "L'IA n'a pas fourni de réponse.";
        if (requestType === 'equivalents') responseContent = []; // Attendu pour équivalents
        // Pour les autres, on pourrait renvoyer une erreur plus spécifique
    }


    // --- Retourner la Réponse Structurée au Frontend (Succès) ---
    const finalResponse = {
        response_type: requestType, // Utilise le type demandé initialement
        content: responseContent
    };

    console.log(`Retourne réponse structurée (Succès) pour '${requestType}'. Durée totale: ${Date.now() - requestStart} ms.`);
    return new Response(JSON.stringify(finalResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    });

  } catch (error) {
    // --- Gestion Générale des Erreurs Capturées ---
    console.error(`Erreur finale traitement requête Edge Function:`, error);
    // Assure que le payload d'erreur contient le message de l'erreur capturée
    if (error instanceof Error && error.message) {
        errorResponsePayload.content = error.message;
    }
    console.log(`Retourne réponse structurée (Erreur ${status}) : ${errorResponsePayload.content}. Durée totale: ${Date.now() - requestStart} ms.`);
    // Retourne une réponse JSON structurée même en cas d'erreur, avec le statut HTTP approprié (ou 200 si géré plus tôt)
    return new Response(JSON.stringify(errorResponsePayload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status, // Utilise le statut défini (400, 500, 502, etc.)
    });
  }
});

console.log("Edge Function 'ai-component-info' listener démarré.");
