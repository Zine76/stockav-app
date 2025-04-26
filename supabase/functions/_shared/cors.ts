// supabase/functions/_shared/cors.ts (Recommended)
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // OK pour le développement
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept, http-referer',
  'Access-Control-Allow-Methods': 'POST, OPTIONS' // Important for POST requests
}
