// supabase/functions/_shared/cors.ts

export const corsHeaders = {
  // ATTENTION: '*' est permissif. Pour la production, remplacez par l'URL
  // exacte de votre application déployée (ex: 'https://votre-user.github.io')
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // Uniquement POST et OPTIONS nécessaires ici
};