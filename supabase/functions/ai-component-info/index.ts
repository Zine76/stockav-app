// supabase/functions/ai-component-info/index.ts
// VERSION SIMPLIFIÉE - Recherche d'équivalents uniquement

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// Assure-toi que ce chemin est correct
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
  if (firstSquare === -1) return null; // Aucun tableau trouvé

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

  if (end === -1) return null; // Structure incomplète

  const jsonString = text.substring(firstSquare, end + 1);
  console.log("Extracted potential JSON array string:", jsonString);

  try {
    const parsed = JSON.parse(jsonString);
    // Vérifie si c'est bien un tableau
    return Array.isArray(parsed) ? parsed : null;
  } catch (e) {
    console.error("JSON Array Parsing failed:", e.message);
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

  // --- Récupération des Secrets ---
  const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
  const appUrlReferer = Deno.env.get("APP_URL_REFERER");

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
  let reference1: string | null = null;

  try {
    const body = await req.json();
    // On prend param1 (ou reference1), car c'est la seule info utile ici
    reference1 = body.param1?.trim().toUpperCase() || body.reference1?.trim().toUpperCase() || null;

    console.log(`Processing request for equivalents: Ref='${reference1}'`);

    // --- Validation de l'entrée ---
    if (!reference1) {
      throw new Error("Référence principale (param1/reference1) manquante.");
    }

    // --- Construction du Prompt Spécifique pour Équivalents ---
    const userPrompt = `Trouve jusqu'à ${MAX_EQUIVALENTS} équivalents techniques directs pour le composant électronique "${reference1}". Concentre-toi sur les remplacements courants et fonctionnels. Pour chaque équivalent, fournis uniquement sa référence et une très courte justification (ex: 'Pin-compatible', 'Specs similaires', 'Version CMOS', 'NPN générique'). Formate la réponse **UNIQUEMENT** comme un tableau JSON d'objets, comme ceci : [{"ref": "REF_1", "reason": "Raison 1"}, {"ref": "REF_2", "reason": "Raison 2"}]. Si aucun équivalent fiable n'est trouvé, retourne un tableau JSON vide : []`;

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
        "HTTP-Referer": appUrlReferer,
        "X-Title": "StockAV - Equivalents" // Titre spécifique
      },
      body: JSON.stringify(requestPayload),
    });

    // --- Gestion de la Réponse OpenRouter ---
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`ERROR - OpenRouter API Error (${response.status}): ${errorBody}`);
      let detail = errorBody;
      try { detail = JSON.parse(errorBody).error?.message || errorBody; } catch (_) {}
      throw new Error(`Erreur communication API IA (${response.status}): ${detail}`);
    }

    const data = await response.json();
    console.log("Raw response from OpenRouter:", JSON.stringify(data));

    // --- Extraction et Formatage de la Réponse ---
    let equivalentList: any[] = []; // Initialise à un tableau vide

    if (data.choices && data.choices.length > 0 && data.choices[0].message?.content) {
        const rawContent = data.choices[0].message.content.trim();
        console.log(`Raw content received from AI for equivalents:\n${rawContent}`);

        const parsedArray = extractJsonArray(rawContent); // Utilise l'helper pour extraire le tableau

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
             console.warn("Failed to extract/parse JSON array from AI response. Returning empty list.");
             // Si le parsing échoue OU si aucun tableau n'est trouvé, on renvoie une liste vide
             // comme demandé dans le prompt.
             equivalentList = [];
        }
    } else {
        console.warn("No valid content found in AI response choices. Returning empty list.");
        equivalentList = []; // Retourne aussi une liste vide si l'IA ne répond rien
    }

    // --- Retourner la Réponse Structurée au Frontend ---
    // Le frontend s'attend à { response_type, content }
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
    console.error(`!!! TOP LEVEL ERROR in Edge Function (Equivalents for Ref: ${reference1}):`, error.message, error.stack);
    return new Response(JSON.stringify({
        response_type: "error", // Type spécifique pour l'erreur
        content: error.message || "Erreur interne du serveur Edge Function."
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
    });
  }
});

console.log("Edge Function 'ai-component-info' (SIMPLIFIED - Equivalents Only) listener started.");
