// supabase/functions/issue-kits/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts' // Use a specific version or update as needed
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
// Ensure the path to cors.ts is correct relative to this function
import { corsHeaders } from '../_shared/cors.ts'

// --- Helper function to get user from JWT ---
async function getUser(supabaseClient: SupabaseClient, req: Request) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error("Authorization header missing or malformed.");
        throw new Error("Missing or Malformed Authorization Header");
    }
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabaseClient.auth.getUser(jwt);

    if (error) {
        console.error("getUser error:", error.message);
        throw new Error("Invalid Token: " + error.message);
    }
    if (!user) {
        throw new Error("User not found for token");
    }
    // Add user code if needed for logging (extract from email)
    const userCode = user.email?.split('@')[0]?.toUpperCase() || 'UNKNOWN_USER';
    console.log(`User identified: ${user.id} (${userCode})`);
    return { ...user, user_code: userCode }; // Return user object with user_code added
}

// --- Main Request Handler ---
serve(async (req: Request) => {
  // Handle CORS preflight requests (OPTIONS method)
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request");
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Initialize Supabase Admin Client
    //    Use environment variables for secure credential management.
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error("Missing Supabase environment variables!");
        throw new Error("Supabase URL or Service Role Key not found in environment variables.");
    }

    // Create client with SERVICE_ROLE_KEY for backend operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            // Required for service role key usage
            autoRefreshToken: false,
            persistSession: false
        }
    });
    console.log("Supabase Admin client initialized for issue-kits function.");

    // 2. Authenticate the User making the request
    let user;
    try {
        user = await getUser(supabaseAdmin, req);
        // User object now contains user.id and user.user_code
    } catch (authError) {
         console.error("Authentication failed:", authError.message);
         // Return a 401 Unauthorized response
         return new Response(JSON.stringify({ success: false, error: `Authentication failed: ${authError.message}` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401,
         });
    }

    // 3. Parse Request Body for bom_id and quantity
    let bom_id: number | null = null;
    let numKitsToIssue: number | null = null;
    try {
        const body = await req.json();
        bom_id = body.bom_id;
        numKitsToIssue = body.quantity;

        if (typeof bom_id !== 'number' || bom_id <= 0) {
          throw new Error('Invalid bom_id provided.');
        }
        if (typeof numKitsToIssue !== 'number' || numKitsToIssue <= 0 || !Number.isInteger(numKitsToIssue)) {
          throw new Error('Invalid quantity provided. Must be a positive integer.');
        }
    } catch (parseError) {
        console.error("Failed to parse request body:", parseError);
        return new Response(JSON.stringify({ success: false, error: `Invalid request body: ${parseError.message}` }), {
             headers: { ...corsHeaders, 'Content-Type': 'application/json' },
             status: 400, // Bad Request
        });
    }

    console.log(`Request validated: Issue ${numKitsToIssue} kit(s) for BOM ID ${bom_id} by User ${user.user_code} (ID: ${user.id})`);

    // 4. Call the Database Function for Atomicity
    //    This delegates the core logic (check stock, update, log) to PostgreSQL.
    console.log("Invoking database function 'process_kit_issuance'...");
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('process_kit_issuance', {
        p_bom_id: bom_id,
        p_num_kits: numKitsToIssue,
        p_user_id: user.id,
        p_user_code: user.user_code // Pass user code for logging within the function
    });

    // 5. Handle Response from Database Function
    if (rpcError) {
        console.error("Error calling RPC function 'process_kit_issuance':", rpcError);

        // Provide more specific feedback to the client based on the error message
        // These messages must match the EXCEPTION messages raised in the SQL function
        if (rpcError.message.includes('INSUFFICIENT_STOCK')) {
             const match = rpcError.message.match(/pour le composant (.*?)\./); // Attempt to extract component ref
             const componentRef = match ? match[1] : 'un composant';
             return new Response(JSON.stringify({ success: false, error: `Stock insuffisant pour ${componentRef}.` }), {
                 headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                 status: 400, // Bad Request (client error due to stock)
             });
        } else if (rpcError.message.includes('BOM_NOT_FOUND') || rpcError.message.includes('NO_COMPONENTS')) {
             return new Response(JSON.stringify({ success: false, error: `Nomenclature (ID: ${bom_id}) non trouvée ou vide.` }), {
                 headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                 status: 404, // Not Found
             });
         } else if (rpcError.message.includes('COMPONENT_NOT_FOUND')) {
             const match = rpcError.message.match(/Composant (.*?) non trouvé/);
             const componentRef = match ? match[1] : 'un composant requis';
              return new Response(JSON.stringify({ success: false, error: `Composant requis (${componentRef}) non trouvé dans l'inventaire.` }), {
                 headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                 status: 400, // Bad Request (data inconsistency)
             });
         }
        // For other database errors, return a generic server error
        throw new Error(`Database function error: ${rpcError.message}`);
    }

    // Assuming the RPC function returns 'true' on success or doesn't raise an error
    console.log("RPC function 'process_kit_issuance' executed successfully. Result:", rpcResult);

    // 6. Return Success Response to Client
    return new Response(JSON.stringify({ success: true, message: `${numKitsToIssue} kit(s) sorti(s) du stock avec succès.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // OK
    });

  } catch (err) {
    // Catch-all for unexpected errors (authentication, parsing, unhandled DB errors)
    console.error("Unhandled error in issue-kits function:", err);
    return new Response(JSON.stringify({ success: false, error: err.message || "Erreur interne du serveur." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500, // Internal Server Error
    });
  }
});

// --- Reminder: SQL for the database function (Run this in Supabase SQL Editor) ---
/*
-- Drop function if it exists to allow recreation
DROP FUNCTION IF EXISTS process_kit_issuance(p_bom_id bigint, p_num_kits integer, p_user_id uuid, p_user_code text);

-- Create the database function for atomic kit issuance
CREATE OR REPLACE FUNCTION process_kit_issuance(
    p_bom_id bigint,         -- BOM ID to issue
    p_num_kits integer,      -- Number of kits to issue
    p_user_id uuid,          -- User ID performing the action
    p_user_code text         -- User Code for logging
)
RETURNS boolean -- Returns true on success, raises exception on failure
LANGUAGE plpgsql
SECURITY DEFINER -- IMPORTANT: Allows the function to run with elevated privileges
AS $$
DECLARE
    bom_item_record RECORD;
    inventory_quantity integer;
    required_total_quantity integer;
    bom_name_text text;
BEGIN
    -- Validate input
    IF p_num_kits <= 0 THEN
        RAISE EXCEPTION 'INVALID_ARGUMENT: Number of kits must be positive.';
    END IF;

    -- Get BOM name for logging and existence check
    SELECT name INTO bom_name_text FROM public.boms WHERE id = p_bom_id;
    IF bom_name_text IS NULL THEN
        RAISE EXCEPTION 'BOM_NOT_FOUND: BOM with ID % not found.', p_bom_id;
    END IF;

    -- Check if BOM has components
    IF NOT EXISTS (SELECT 1 FROM public.bom_items WHERE bom_id = p_bom_id) THEN
      RAISE EXCEPTION 'NO_COMPONENTS: BOM % has no components defined.', bom_name_text;
    END IF;

    -- ======= Stock Verification Loop =======
    RAISE LOG '[Kit Issue %] Checking stock for % kit(s) of BOM % (%)', txid_current(), p_num_kits, bom_name_text, p_bom_id;
    FOR bom_item_record IN
        SELECT ref_composant, quantite_par_kit
        FROM public.bom_items
        WHERE bom_id = p_bom_id
    LOOP
        required_total_quantity := bom_item_record.quantite_par_kit * p_num_kits;

        -- Lock the inventory row for this component and check quantity
        SELECT quantity INTO inventory_quantity
        FROM public.inventory
        WHERE ref = bom_item_record.ref_composant
        FOR UPDATE; -- Lock the row

        -- Check if component exists in inventory
        IF inventory_quantity IS NULL THEN
            RAISE EXCEPTION 'COMPONENT_NOT_FOUND: Composant % non trouvé dans l''inventaire.', bom_item_record.ref_composant;
        END IF;

        -- Check if stock is sufficient
        IF inventory_quantity < required_total_quantity THEN
            RAISE EXCEPTION 'INSUFFICIENT_STOCK: Stock insuffisant pour le composant %. Requis: %, Disponible: %',
                            bom_item_record.ref_composant, required_total_quantity, inventory_quantity;
        END IF;
        RAISE LOG '[Kit Issue %] Stock OK for %: Available=%, Required=%', txid_current(), bom_item_record.ref_composant, inventory_quantity, required_total_quantity;

    END LOOP;
    RAISE LOG '[Kit Issue %] All stock checks passed.', txid_current();

    -- ======= Stock Decrement Loop =======
    RAISE LOG '[Kit Issue %] Decrementing quantities...', txid_current();
    FOR bom_item_record IN
        SELECT ref_composant, quantite_par_kit
        FROM public.bom_items
        WHERE bom_id = p_bom_id
    LOOP
        required_total_quantity := bom_item_record.quantite_par_kit * p_num_kits;

        -- Perform the update
        UPDATE public.inventory
        SET quantity = quantity - required_total_quantity
        WHERE ref = bom_item_record.ref_composant;

        -- Log the specific component decrement (optional but potentially useful)
        -- You could add another log entry here if needed, or rely on the single kit issue log

        RAISE LOG '[Kit Issue %] Decremented % by %', txid_current(), bom_item_record.ref_composant, required_total_quantity;
    END LOOP;
    RAISE LOG '[Kit Issue %] All quantities decremented.', txid_current();

    -- ======= Logging the Overall Action =======
    RAISE LOG '[Kit Issue %] Logging kit issuance action...', txid_current();
    INSERT INTO public.logs (user_id, user_code, component_ref, quantity_change, quantity_after, type_action)
    VALUES (
        p_user_id,
        p_user_code,
        bom_name_text || ' (ID:' || p_bom_id || ')', -- Log BOM Name/ID for clarity
        -p_num_kits,          -- Log the number of KITS issued (negative change)
        NULL,                 -- quantity_after is N/A for the kit log entry itself
        'Kit Issue'           -- Specific action type
    );
    RAISE LOG '[Kit Issue %] Log entry created.', txid_current();

    -- If execution reaches here, the transaction was successful
    RETURN true;

EXCEPTION
    WHEN OTHERS THEN
        -- Log the error details and re-raise the exception
        -- This ensures the transaction rolls back and the Edge Function gets the error
        RAISE LOG '[Kit Issue %] Error in process_kit_issuance: %', txid_current(), SQLERRM;
        RAISE INFO 'SQLSTATE: %', SQLSTATE; -- Optionally log SQLSTATE for debugging
        RAISE EXCEPTION '%', SQLERRM USING ERRCODE = SQLSTATE; -- Re-raise the original error
END;
$$;

-- Grant necessary permission to the role your authenticated users have
GRANT EXECUTE ON FUNCTION public.process_kit_issuance(bigint, integer, uuid, text) TO authenticated;

*/