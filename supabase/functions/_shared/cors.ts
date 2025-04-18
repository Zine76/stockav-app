// supabase/functions/_shared/cors.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Ou spécifie ton domaine hébergé : 'https://ton-site.com'
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
