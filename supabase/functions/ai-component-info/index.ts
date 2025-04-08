// supabase/functions/ai-component-info/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// Ajustement du chemin relatif pour l'import CORS
import { corsHeaders } from '../_shared/cors.ts';

// --- Configuration ---
const AI_MODEL = "meta-llama/llama-3.1-70b-instruct:free"; // ou "mistralai/mistral-7b-instruct:free"
const MAX_EQUIVALENTS = 5;
const MAX_TOKENS_DEFAULT = 300; // Augmenté pour descriptions/comparaisons
const MAX_TOKENS_EQUIVALENTS = 150; // Peut être plus court pour juste les équivalents
// Ajout d'une constante pour les types de requêtes valides
const VALID_REQUEST_TYPES = ['equivalents', 'describe', 'pinout', 'compare', 'generic_query'];

console.log("Edge Function 'ai-component-info' initializing...");

serve(async (req: Request) => {
  console.log(`Request received: ${req.method} ${req.url}`);

  // --- Gestion CORS Pré-vol (OPTIONS) ---
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request (CORS preflight)");
    return new Response('ok', { headers: corsHeaders });
  }

  // --- Récupération des Secrets ---
  const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
  const appUrlReferer = Deno.env.get("APP_URL_REFERER"); // Requis par OpenRouter

  if (!openRouterApiKey || !appUrlReferer) {
    const missingKey = !openRouterApiKey ? "OPENROUTER_API_KEY" : "APP_URL_REFERER";
    console.error(`CRITICAL: ${missingKey} secret is not set!`);
    return new Response(JSON.stringify({
        response_type: "error",
        content: `Configuration serveur: Secret '${missingKey}' manquant.`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
    });
  }

  // --- Traitement de la Requête POST ---
  let requestType: string = 'unknown';
  let ref1: string | null = null;
  let ref2: string | null = null;
  let originalUserInput: string | null = null; // Ajout pour generic_query

  try {
    const body = await req.json();
    requestType = body.request_type?.toLowerCase() || 'unknown';
    // Paramètre principal (référence ou texte brut)
    ref1 = body.reference1?.trim() || null;
    // Garde la casse originale pour generic_query si ref1 était le texte brut
    originalUserInput = body.reference1 || null;
    // Paramètre secondaire (pour comparaison)
    ref2 = body.reference2?.trim().toUpperCase() || null;

    console.log(`Processing request: Type='${requestType}', Param1='${ref1}', Param2='${ref2}'`);

    // --- Validation des entrées ---
    if (!ref1 && requestType !== 'unknown') { // Permet requestType='unknown' sans ref1 initialement ? Non, on part du principe que script.js envoie tjrs qqchose
         throw new Error("Paramètre principal (reference1 / texte) manquant.");
     }
     if (requestType === 'compare' && !ref2) {
      throw new Error("Deux références sont nécessaires pour la comparaison.");
    }
    // **** CORRECTION: Validation des types de requêtes ****
    if (!VALID_REQUEST_TYPES.includes(requestType) && requestType !== 'unknown') { // 'unknown' est géré implicitement si on ne trouve pas de type valide
        console.warn(`Type de requête reçu non géré explicitement: '${requestType}'. Tentative de traitement comme 'generic_query'.`);
        // On pourrait forcer le type à generic_query ici si on veut absolument le traiter
        // requestType = 'generic_query';
        // Ou simplement laisser passer et voir si un prompt est défini (ce qu'on fait ici)
        // Mais la validation initiale est plus propre:
         if (!VALID_REQUEST_TYPES.includes(requestType)) {
            throw new Error(`Type de requête invalide ou non supporté: '${requestType}'. Types valides: ${VALID_REQUEST_TYPES.join(', ')}`);
         }
    }

    // Met ref1 en majuscules SEULEMENT si ce n'est pas une requête générique
    if (ref1 && requestType !== 'generic_query') {
        ref1 = ref1.toUpperCase();
    }

    // --- Construction du Prompt Spécifique ---
    let userPrompt = "";
    let maxTokens = MAX_TOKENS_DEFAULT;

    switch (requestType) {
        case 'equivalents':
            if (!ref1) throw new Error("Référence manquante pour trouver les équivalents.");
            maxTokens = MAX_TOKENS_EQUIVALENTS;
            userPrompt = `Trouve jusqu'à ${MAX_EQUIVALENTS} équivalents techniques directs pour le composant électronique "${ref1}". Concentre-toi sur les remplacements courants et fonctionnels. Pour chaque équivalent, fournis uniquement sa référence et une très courte justification (ex: 'Pin-compatible', 'Specs similaires', 'Version CMOS', 'NPN générique'). Formate la réponse STRICTEMENT comme un tableau JSON d'objets, comme ceci : [{"ref": "REF_1", "reason": "Raison 1"}, {"ref": "REF_2", "reason": "Raison 2"}]. Si aucun équivalent fiable n'est trouvé, retourne un tableau JSON vide : []`;
            break;
        case 'describe':
             if (!ref1) throw new Error("Référence manquante pour la description.");
            userPrompt = `Décris brièvement (2-3 phrases maximum) la fonction principale et le type du composant électronique "${ref1}". Sois concis et technique. Ne fournis que la description textuelle.`;
            break;
        case 'pinout':
             if (!ref1) throw new Error("Référence manquante pour le brochage.");
            userPrompt = `Fournis le brochage (pinout) standard pour le composant "${ref1}". Liste chaque numéro de broche suivi de son nom ou de sa fonction principale (ex: "1: VCC, 2: GND, 3: Output"). Si plusieurs boîtiers existent, privilégie le plus courant (ex: DIP ou SOIC). Si le brochage est complexe ou varie grandement, indique-le. Réponds uniquement avec la liste du brochage.`;
            break;
        case 'compare':
             if (!ref1 || !ref2) throw new Error("Deux références sont nécessaires pour la comparaison.");
            userPrompt = `Compare brièvement les composants électroniques "${ref1}" et "${ref2}". Liste les principales similitudes fonctionnelles et les différences clés (ex: tension, courant, vitesse, type de package, fonctionnalités spéciales). Vise 2-3 points pour chaque section (similitudes, différences). Formate la réponse STRICTEMENT comme un objet JSON avec deux clés: "similarities" (tableau de strings) et "differences" (tableau de strings). Si la comparaison est non pertinente (composants trop différents), explique brièvement pourquoi dans une clé "notes" (string). Exemple JSON attendu : {"similarities": ["Point commun 1", "Point commun 2"], "differences": ["Différence 1", "Différence 2"], "notes": "Comparaison pertinente..."}`;
            break;
        // **** CORRECTION: Ajout du cas generic_query ****
        case 'generic_query':
             if (!originalUserInput) throw new Error("Texte de la requête générique manquant.");
             // Utilise le texte brut original pour la requête générique
             userPrompt = `Réponds à la question ou requête suivante concernant des composants électroniques ou un stock, de manière concise et directe : "${originalUserInput}"`;
             // Garde maxTokens par défaut pour réponse potentiellement plus longue
            break;
        default:
            // Ce cas ne devrait pas être atteint si la validation est correcte
            throw new Error(`Logique interne: type de requête non géré dans le switch: '${requestType}'.`);
    }

    console.log(`Prompt pour '${requestType}' (Param1: ${ref1 || originalUserInput}${ref2 ? ' vs ' + ref2 : ''}):\n${userPrompt}`);

    // --- Appel à l'API OpenRouter ---
    console.log(`Appel API OpenRouter (Modèle: ${AI_MODEL}) pour requête type '${requestType}'`);
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": appUrlReferer,
        "X-Title": "StockAV" // Nom de l'application pour OpenRouter
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [ { role: "user", content: userPrompt } ],
        max_tokens: maxTokens,
        temperature: 0.3, // Un peu plus créatif pour description/comparaison
        // Pourrait ajouter 'response_format: { "type": "json_object" }' pour les types json, mais dépend du modèle
      }),
    });

    // --- Gestion de la Réponse OpenRouter ---
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Erreur API OpenRouter (${response.status}): ${errorBody}`);
      throw new Error(`Erreur communication API IA: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Réponse brute reçue d'OpenRouter:", JSON.stringify(data));

    // --- Extraction et Formatage de la Réponse ---
    let responseContent: any = null; // Peut être string, array ou object

    if (data.choices && data.choices.length > 0 && data.choices[0].message?.content) {
        const rawContent = data.choices[0].message.content.trim();
        console.log(`Contenu brut reçu de l'IA pour '${requestType}':\n${rawContent}`);

        try {
            if (requestType === 'equivalents') {
                // Essayer d'extraire un tableau JSON
                const jsonMatch = rawContent.match(/(\[[\s\S]*?\])/);
                if (jsonMatch && jsonMatch[1]) {
                    const parsedArray = JSON.parse(jsonMatch[1]);
                    if (Array.isArray(parsedArray)) {
                        responseContent = parsedArray
                            .filter(item => item && typeof item.ref === 'string' && item.ref.trim() !== '')
                            .map(item => ({
                                ref: item.ref.trim().toUpperCase(),
                                reason: typeof item.reason === 'string' ? item.reason.trim() : 'Suggestion AI'
                            }))
                            .slice(0, MAX_EQUIVALENTS);
                        console.log(`${responseContent.length} équivalents parsés.`);
                    } else { throw new Error("Contenu IA n'est pas un tableau JSON."); }
                } else {
                    // Si aucun JSON n'est trouvé, on retourne un tableau vide (réponse valide pour "pas d'équivalents")
                    console.warn("Aucun tableau JSON trouvé pour équivalents, retourne [].");
                    responseContent = [];
                }

            } else if (requestType === 'compare') {
                // Essayer d'extraire un objet JSON pour la comparaison
                 const jsonMatch = rawContent.match(/(\{[\s\S]*?\})/);
                 if (jsonMatch && jsonMatch[1]) {
                    const parsedObject = JSON.parse(jsonMatch[1]);
                    // Valider la structure minimale attendue
                    if (typeof parsedObject === 'object' && parsedObject !== null && (Array.isArray(parsedObject.similarities) || Array.isArray(parsedObject.differences) || parsedObject.notes)) {
                         responseContent = {
                             similarities: Array.isArray(parsedObject.similarities) ? parsedObject.similarities.map(String) : [],
                             differences: Array.isArray(parsedObject.differences) ? parsedObject.differences.map(String) : [],
                             notes: typeof parsedObject.notes === 'string' ? parsedObject.notes : null
                         };
                         console.log("Objet de comparaison parsé.");
                    } else { throw new Error("Objet JSON de comparaison invalide."); }
                 } else {
                    console.warn("Aucun objet JSON trouvé pour comparaison, retourne texte brut.");
                    // Correction: Levons une erreur ici aussi pour être cohérent. Le frontend s'attend à un objet.
                    throw new Error("L'IA n'a pas fourni de JSON valide pour la comparaison.");
                    // responseContent = rawContent; // Ancien fallback
                 }
            } else {
                // Pour 'describe', 'pinout', 'generic_query', prendre le texte brut
                responseContent = rawContent;
                console.log(`Contenu textuel extrait pour '${requestType}'.`);
            }
        } catch (parseError) {
            console.error(`Échec parsing/formatage réponse IA pour '${requestType}'. Erreur:`, parseError, "Contenu brut:", rawContent);
            // Si le parsing échoue pour équivalents/comparaison, on retourne une erreur spécifique
            if (requestType === 'equivalents' || requestType === 'compare') {
                // On retourne le type d'erreur spécifique plutôt qu'une string générique
                 throw new Error(`L'IA a fourni une réponse mal formatée pour ${requestType}.`);
            } else {
                // Pour describe/pinout/generic, on peut quand même retourner le texte brut même si erreur de parsing (peu probable ici)
                responseContent = rawContent || "Impossible d'extraire la réponse de l'IA.";
            }
        }
    } else {
        console.log("Aucun contenu ou choix valide reçu de l'IA.");
        responseContent = "L'IA n'a pas fourni de réponse.";
        // Pour équivalents, un tableau vide est une réponse valide
        if (requestType === 'equivalents') responseContent = [];
        // Pour les autres, on garde le message texte
    }


    // --- Retourner la Réponse Structurée au Frontend ---
    // **** CORRECTION: S'assurer que response_type correspond à ce que le frontend attend ****
    // Si on a traité une requête comme 'generic_query', on renvoie ce type.
    const finalResponseType = VALID_REQUEST_TYPES.includes(requestType) ? requestType : 'generic_query'; // Fallback prudent

    const finalResponse = {
        response_type: finalResponseType,
        content: responseContent
    };

    console.log(`Retourne réponse structurée pour '${finalResponseType}':`, JSON.stringify(finalResponse));
    return new Response(JSON.stringify(finalResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    });

  } catch (error) {
    // --- Gestion Générale des Erreurs ---
    console.error(`Erreur traitement requête Edge Function (Type reçu: ${requestType}, Param1: ${ref1}):`, error);
    return new Response(JSON.stringify({
        response_type: "error", // Type spécifique pour l'erreur
        content: error.message || "Erreur interne du serveur."
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
    });
  }
});

console.log("Edge Function 'ai-component-info' listener démarré.");
