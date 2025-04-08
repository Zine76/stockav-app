// supabase/functions/ai-component-info/index.ts
// VERSION SIMPLIFIÉE - Recherche d'équivalents uniquement

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// Assure-toi que ce chemin est correct par rapport à ta structure de fonctions
import { corsHeaders } from '../_shared/cors.ts';

// --- Configuration ---
const AI_MODEL = "meta-llama/llama-3.1-70b-instruct:free"; // Ou autre modèle OpenRouter
const MAX_EQUIVALENTS = 5;
const MAX_TOKENS_EQUIVALENTS = 150; // Tokens pour la liste d'équivalents

console.log("Edge Function 'ai-component-info' (SIMPLIFIED - Equivalents Only) initializing...");

// --- Helper: Fonction pour extraire et parser le premier bloc JSON array ---
function extractJsonArray(text: string): any[] | null {
  console.log("Attempting to extract JSON array from:", text);
  const firstSquare = text.indexOf('[');
  if (firstSquare === -1) {
      console.log("No '[' found in text.");
      return null; // Aucun tableau trouvé
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
     // Sécurité: Limiter la recherche pour éviter boucle infinie sur texte très long/malformé
     if (i > firstSquare + 2000) { // Limite arbitraire (ajuster si nécessaire)
        console.warn("JSON array search exceeded length limit.");
        return null;
     }
  }

  if (end === -1) {
      console.log("Matching ']' not found or structure incomplete.");
      return null; // Structure incomplète
  }

  const jsonString = text.substring(firstSquare, end + 1);
  console.log("Extracted potential JSON array string:", jsonString);

  try {
    const parsed = JSON.parse(jsonString);
    // Vérifie si c'est bien un tableau
    if (Array.isArray(parsed)) {
        console.log("JSON Array parsing successful.");
        return parsed;
    } else {
        console.warn("Parsed JSON is not an array:", parsed);
        return null;
    }
  } catch (e) {
    console.error("JSON Array Parsing failed:", e.message);
    // Essayer une approche plus tolérante si le format JSON strict échoue ? Non, restons stricts pour l'instant.
    return null; // Échec du parsing
  }
}

serve(async (req: Request) => {
  console.log(`Request received: ${req.method} ${req.url}`);

  // --- Gestion CORS Pré-vol (OPTIONS) ---
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request (CORS preflight)");
    return new Response('ok', { headers: corsHeaders });
  }

  // --- Vérifier la méthode HTTP ---
  if (req.method !== 'POST') {
    console.warn(`Unsupported method: ${req.method}`);
    return new Response(JSON.stringify({ response_type: "error", content: "Méthode non supportée, utilisez POST." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405, // Method Not Allowed
    });
  }

  // --- Récupération des Secrets ---
  const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
  const appUrlReferer = Deno.env.get("APP_URL_REFERER"); // Gardé pour l'en-tête HTTP-Referer

  if (!openRouterApiKey) {
    console.error("CRITICAL: OPENROUTER_API_KEY secret is not set!");
    return new Response(JSON.stringify({
        response_type: "error",
        content: "Configuration serveur: Secret API manquant."
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
    });
  }
   // APP_URL_REFERER n'est plus critique pour la logique, juste pour l'en-tête d'appel
   if (!appUrlReferer) {
       console.warn("WARN: APP_URL_REFERER secret is not set! HTTP-Referer header will be missing.");
   }


  // --- Traitement de la Requête POST ---
  let reference1: string | null = null;

  try {
    const body = await req.json();
    // On prend UNIQUEMENT reference1 car c'est la seule info utile ici
    reference1 = body.reference1?.trim().toUpperCase() || null;

    console.log(`Processing request for equivalents: Ref='${reference1}'`);

    // --- Validation de l'entrée ---
    if (!reference1) {
      console.log("Validation Error: reference1 is missing or empty.");
      // Retourner une erreur 400 Bad Request si la référence manque
      return new Response(JSON.stringify({
          response_type: "error",
          content: "Référence principale (reference1) manquante dans la requête."
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400,
      });
    }

    // --- Construction du Prompt Spécifique pour Équivalents ---
    const userPrompt = `Trouve jusqu'à ${MAX_EQUIVALENTS} équivalents techniques directs pour le composant électronique "${reference1}". Concentre-toi sur les remplacements courants et fonctionnels. Pour chaque équivalent, fournis uniquement sa référence et une très courte justification (ex: 'Pin-compatible', 'Specs similaires', 'Version CMOS', 'NPN générique'). Formate la réponse **UNIQUEMENT** comme un tableau JSON valide contenant des objets, comme ceci : [{"ref": "REF_1", "reason": "Raison 1"}, {"ref": "REF_2", "reason": "Raison 2"}]. Si aucun équivalent fiable n'est trouvé, retourne un tableau JSON vide : []. Ne retourne AUCUN autre texte avant ou après le tableau JSON.`;

    console.log(`Prompt for equivalents (${reference1}):\n${userPrompt}`);

    // --- Préparation de l'appel API OpenRouter ---
    const requestPayload: any = {
        model: AI_MODEL,
        messages: [{ role: "user", content: userPrompt }],
        max_tokens: MAX_TOKENS_EQUIVALENTS,
        temperature: 0.2, // Très factuel pour les équivalents
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
        // Inclure le Referer si défini, sinon omis
        ...(appUrlReferer && { "HTTP-Referer": appUrlReferer }),
        "X-Title": "StockAV - Equivalents" // Titre spécifique
      },
      body: JSON.stringify(requestPayload),
    });

    // --- Gestion de la Réponse OpenRouter ---
    const responseBodyText = await response.text(); // Lire le corps une seule fois
    console.log(`Raw response text from OpenRouter (Status: ${response.status}): ${responseBodyText}`);

    if (!response.ok) {
      console.error(`ERROR - OpenRouter API Error (${response.status}): ${responseBodyText}`);
      let detail = responseBodyText;
      try { detail = JSON.parse(responseBodyText).error?.message || responseBodyText; } catch (_) {}
      // Renvoyer une erreur 502 Bad Gateway si l'API externe échoue
      return new Response(JSON.stringify({
          response_type: "error",
          content: `Erreur communication API IA (${response.status}): ${detail}`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502,
      });
    }

    // --- Extraction et Formatage de la Réponse ---
    let equivalentList: any[] = []; // Initialise à un tableau vide
    let parsedData: any = null;

    try {
        parsedData = JSON.parse(responseBodyText);
        console.log("Parsed OpenRouter response data:", parsedData);
    } catch(e) {
         console.error("Failed to parse OpenRouter JSON response:", e.message);
         // Si la réponse globale n'est pas du JSON, on ne peut pas continuer
         return new Response(JSON.stringify({
             response_type: "error",
             content: "Réponse invalide reçue de l'API IA (non-JSON)."
         }), {
           headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502,
         });
    }


    if (parsedData.choices && parsedData.choices.length > 0 && parsedData.choices[0].message?.content) {
        const rawContent = parsedData.choices[0].message.content.trim();
        console.log(`Raw content received from AI for equivalents:\n${rawContent}`);

        // Tenter d'extraire le tableau JSON du contenu
        const parsedArray = extractJsonArray(rawContent);

        if (parsedArray !== null) {
            console.log("Successfully parsed JSON array content from AI message.");
            equivalentList = parsedArray
                .filter(item => item && typeof item.ref === 'string' && item.ref.trim() !== '')
                .map(item => ({
                    ref: item.ref.trim().toUpperCase(),
                    reason: typeof item.reason === 'string' ? item.reason.trim() : 'Suggestion AI'
                }))
                .slice(0, MAX_EQUIVALENTS); // Limiter au cas où l'IA en donne plus
            console.log(`${equivalentList.length} valid equivalents processed.`);
        } else {
             console.warn("Failed to extract/parse JSON array from AI response content. Returning empty list.");
             // Conformément au prompt, si on ne peut pas extraire un tableau valide, on renvoie vide.
             equivalentList = [];
        }
    } else {
        console.warn("No valid content found in AI response choices. Returning empty list.");
        equivalentList = []; // Retourne aussi une liste vide si l'IA ne répond rien dans 'choices'
    }

    // --- Retourner la Réponse Structurée au Frontend ---
    const finalResponse = {
        response_type: "equivalents", // Toujours ce type dans cette version simplifiée
        content: equivalentList
    };

    console.log("Returning structured response:", JSON.stringify(finalResponse));
    return new Response(JSON.stringify(finalResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    });

  } catch (error) {
    // --- Gestion Générale des Erreurs ---
    // Distinguer erreur de parsing de la requête vs autre erreur serveur
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
         console.error(`!!! Request Body Parsing ERROR (Ref: ${reference1}):`, error.message);
         return new Response(JSON.stringify({
             response_type: "error",
             content: "Corps de la requête invalide (JSON attendu)."
         }), {
           headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400,
         });
    } else {
        console.error(`!!! TOP LEVEL ERROR in Edge Function (Equivalents for Ref: ${reference1}):`, error.message, error.stack);
        return new Response(JSON.stringify({
            response_type: "error", // Type spécifique pour l'erreur
            content: error.message || "Erreur interne du serveur Edge Function."
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500, // Erreur serveur générique
        });
    }
  }
});

console.log("Edge Function 'ai-component-info' (SIMPLIFIED - Equivalents Only) listener started.");
