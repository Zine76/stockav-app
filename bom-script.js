// --- START OF FILE bom-script.js (Restored Display + Optimized Realtime) ---

document.addEventListener('DOMContentLoaded', () => {
    "use strict";
    console.log(">>> BOM DEBUG v3: DOMContentLoaded event fired.");

    // --- Configuration et Variables Globales ---
    let currentUser = null;
    let currentUserCode = null;
    let currentKitData = []; // Stocke les données brutes du kit chargées depuis la DB
    let collectedDrawers = new Set(); // Stocke les clés des tiroirs collectés
    let kitSubscription = null;
    let isRealtimeSubscribed = false;

    // --- Configuration Supabase ---
    const SUPABASE_URL = 'https://tjdergojgghzmopuuley.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZGVyZ29qZ2doem1vcHV1bGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4MTU0OTUsImV4cCI6MjA1OTM5MTQ5NX0.XejQYEPYoCrgYOwW4T9g2VcmohCdLLndDdwpSYXAwPA';
    const FAKE_EMAIL_DOMAIN = '@stockav.local';
    let supabase = null;

    const COLLECTED_DRAWERS_KEY = 'stockav_collectedDrawers';

    // --- Initialisation Supabase ---
    try {
        console.log(">>> BOM DEBUG v3: Attempting Supabase client initialization...");
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log(">>> BOM DEBUG v3: Client Supabase initialized successfully.");
        } else { throw new Error("Supabase library not loaded."); }
    } catch (error) {
        console.error(">>> BOM DEBUG v3: CRITICAL ERROR during Supabase initialization:", error);
        const loginArea = document.getElementById('bom-login-area');
        if (loginArea) loginArea.innerHTML = `<p class="error-message" style="color:red; font-weight:bold;">Erreur Init Supabase: ${error.message}</p>`;
        const drawerList = document.getElementById('bom-drawer-list');
        if (drawerList) drawerList.innerHTML = `<p class="error-message" style="color:red; font-weight:bold;">Erreur critique au démarrage. Voir console.</p>`;
        return;
    }

    // --- Récupération des Éléments DOM ---
    console.log(">>> BOM DEBUG v3: Getting DOM elements...");
    // (Récupération DOM inchangée par rapport à la version Debug précédente)
    const authSection = document.getElementById('bom-auth-section');
    const loginArea = document.getElementById('bom-login-area');
    const loginCodeInput = document.getElementById('bom-login-code');
    const loginPasswordInput = document.getElementById('bom-login-password');
    const loginButton = document.getElementById('bom-login-button');
    const loginError = document.getElementById('bom-login-error');
    const userInfoArea = document.getElementById('bom-user-info-area');
    const userDisplay = document.getElementById('bom-user-display');
    const logoutButton = document.getElementById('bom-logout-button');
    const drawerListContainer = document.getElementById('bom-drawer-list');
    const feedbackDiv = document.getElementById('bom-feedback');
    const clearKitButton = document.getElementById('clear-kit-button');
    const drawerLoadingMessage = document.getElementById('drawer-loading-message');
     if (!loginCodeInput || !loginPasswordInput || !loginButton || !drawerListContainer || !drawerLoadingMessage) {
         console.error(">>> BOM DEBUG v3: CRITICAL ERROR - Essential DOM elements missing!");
         if(drawerListContainer) drawerListContainer.innerHTML = `<p class="error-message" style="color:red; font-weight:bold;">Erreur: Éléments de page manquants. Vérifiez index.html.</p>`;
         return;
     }
    console.log(">>> BOM DEBUG v3: DOM elements retrieved.");


    // --- Fonctions Utilitaires ---
    // (showFeedback, hideFeedback, getStockStatus inchangées)
    function showFeedback(message, type = 'info', duration = 3000) {
        if (!feedbackDiv) return;
        console.log(`>>> BOM FEEDBACK (${type}): ${message}`);
        feedbackDiv.textContent = message;
        feedbackDiv.className = `feedback-area ${type}`;
        feedbackDiv.style.display = 'block';
        if (duration > 0) {
            setTimeout(() => {
                if (feedbackDiv.textContent === message) { hideFeedback(); }
            }, duration);
        }
    }
    function hideFeedback() { if (feedbackDiv) feedbackDiv.style.display = 'none'; }
    function getStockStatus(quantity, threshold) {
        if (quantity === undefined || quantity === null || isNaN(quantity)) return 'unknown';
        quantity = Number(quantity);
        threshold = (threshold === undefined || threshold === null || isNaN(threshold) || threshold < 0) ? -1 : Number(threshold);
        if (quantity <= 0) return 'critical';
        if (threshold !== -1 && quantity <= threshold) return 'warning';
        return 'ok';
    }


    // --- Charger/Vider le kit depuis Supabase ---
    // (loadKitFromSupabase, saveCollectedStateToSupabase, clearKitInSupabase inchangées)
    async function loadKitFromSupabase() {
        console.log(">>> BOM DEBUG v3: Entered loadKitFromSupabase()...");
        const previousKitLength = currentKitData.length;
        const previousCollectedSize = collectedDrawers.size;
        // Ne pas vider ici immédiatement, vider seulement si succès ou erreur critique

        if (!currentUser || !supabase) {
            console.warn(">>> BOM DEBUG v3: loadKitFromSupabase cancelled: No currentUser or Supabase not ready.");
            currentKitData = []; // Vider l'état local si annulé
            collectedDrawers = new Set();
            displayKitDrawers(); // Afficher état vide/login requis
            return;
        }

        console.log(`>>> BOM DEBUG v3: Loading kit AND collected state from Supabase for user ${currentUser.id}...`);
        if (drawerLoadingMessage) { drawerLoadingMessage.textContent = 'Chargement du kit...'; drawerLoadingMessage.style.display = 'block'; }
        // Ne pas vider drawerListContainer ici, displayKitDrawers s'en chargera

        let newKitData = [];
        let newCollectedDrawers = new Set();
        let success = false;

        try {
            const { data, error } = await supabase
                .from('user_kits')
                .select('kit_data, collected_drawers')
                .eq('user_id', currentUser.id)
                .maybeSingle();

            if (error) { throw error; } // Gérer l'erreur dans le catch

            if (data) {
                if (data.kit_data && Array.isArray(data.kit_data)) {
                    newKitData = data.kit_data;
                }
                if (data.collected_drawers && Array.isArray(data.collected_drawers)) {
                    newCollectedDrawers = new Set(data.collected_drawers);
                }
                success = true;
                console.log(`>>> BOM DEBUG v3: Kit data loaded: ${newKitData.length} items. Collected state loaded: ${newCollectedDrawers.size} drawers.`);
            } else {
                console.log(">>> BOM DEBUG v3: No record found in user_kits for this user.");
                success = true; // C'est un succès, juste un kit vide
            }
        } catch (error) {
            console.error(">>> BOM DEBUG v3: ERROR loading kit/collected state from Supabase:", error);
            showFeedback(`Erreur chargement BDD: ${error.message}`, 'error', 0);
            // Garder l'ancien état en cas d'erreur de chargement? Ou vider? Pour l'instant, on vide.
             newKitData = [];
             newCollectedDrawers = new Set();
        } finally {
            // Appliquer le nouvel état (chargé ou vide si erreur)
            currentKitData = newKitData;
            collectedDrawers = newCollectedDrawers;
            saveCollectedState(); // Mettre à jour localStorage avec l'état chargé (ou vidé)
            console.log(">>> BOM DEBUG v3: loadKitFromSupabase() finished. Calling displayKitDrawers().");
            displayKitDrawers(); // Afficher le nouvel état
        }
    }
    async function saveCollectedStateToSupabase() {
        // (Inchangée par rapport à la version Debug précédente)
        if (!currentUser || !supabase) { console.warn(">>> BOM DEBUG v3 (saveCollected): Cannot save state: Not logged in or Supabase not ready."); return; }
        if (!currentKitData || currentKitData.length === 0) { console.warn(">>> BOM DEBUG v3 (saveCollected): Kit is empty, not saving collected state."); return; }
        const collectedArray = Array.from(collectedDrawers);
        console.log(`>>> BOM DEBUG v3 (saveCollected): Saving collected state (${collectedArray.length} drawers) to Supabase for user ${currentUser.id}...`);
        try {
            const { error } = await supabase.from('user_kits').update({ collected_drawers: collectedArray }).eq('user_id', currentUser.id);
            if (error) { console.error(">>> BOM DEBUG v3 (saveCollected): ERROR saving collected state:", error); showFeedback(`Erreur sauvegarde état: ${error.message}`, 'error'); }
            else { console.log(">>> BOM DEBUG v3 (saveCollected): Collected state saved successfully to Supabase."); }
        } catch (err) { console.error(">>> BOM DEBUG v3 (saveCollected): JAVASCRIPT ERROR saving collected state:", err); showFeedback("Erreur technique sauvegarde état (JS).", 'error'); }
    }
    async function clearKitInSupabase() {
        // (Inchangée par rapport à la version Debug précédente)
         if (!currentUser || !supabase) { console.warn(">>> BOM DEBUG v3 (clearKit): Cannot clear kit in DB: Not logged in or Supabase not ready."); return false; }
         const userId = currentUser.id; console.log(`>>> BOM DEBUG v3 (clearKit): Attempting to delete kit from Supabase for user ${userId}...`);
         try { const { error } = await supabase.from('user_kits').delete().eq('user_id', userId); if (error) { console.error(">>> BOM DEBUG v3 (clearKit): ERROR returned by Supabase during delete:", error); showFeedback(`Erreur vidage DB: ${error.message}`, 'error'); return false; } else { console.log(">>> BOM DEBUG v3 (clearKit): Kit deleted/cleared successfully in Supabase (or did not exist)."); return true; } }
         catch (err) { console.error(`>>> BOM DEBUG v3 (clearKit): JAVASCRIPT/Network ERROR during DB kit deletion (User: ${userId}):`, err); showFeedback("Erreur technique vidage kit DB (JS).", 'error'); return false; }
    }
    // (saveCollectedState, loadCollectedStateFromLocalStorage inchangées)
    function saveCollectedState() { try { localStorage.setItem(COLLECTED_DRAWERS_KEY, JSON.stringify(Array.from(collectedDrawers))); console.log(">>> BOM DEBUG v3 (localStorage): Saved collected state for", collectedDrawers.size, "drawers."); } catch (e) { console.error(">>> BOM DEBUG v3 (localStorage): ERROR saving collected state:", e); } }
    function loadCollectedStateFromLocalStorage() { try { const storedState = localStorage.getItem(COLLECTED_DRAWERS_KEY); if (storedState) { const parsedState = JSON.parse(storedState); if (Array.isArray(parsedState)) { console.log(">>> BOM DEBUG v3 (localStorage): Event 'storage' loaded state:", parsedState.length, "drawers."); } else { console.warn(">>> BOM DEBUG v3 (localStorage): Invalid state found."); } } } catch (e) { console.error(">>> BOM DEBUG v3 (localStorage): ERROR loading collected state:", e); } }


    // --- ***** AFFICHAGE DES TIROIRS (VERSION RESTAURÉE AVEC LOGS) ***** ---
    function displayKitDrawers() {
        console.log(">>> BOM DEBUG v3: Entered displayKitDrawers() [RESTORED VERSION]...");
        if (!drawerListContainer) { console.error(">>> BOM DEBUG v3: CRITICAL ERROR - drawerListContainer is null!"); return; }

        // 1. Clear previous content
        drawerListContainer.innerHTML = '';
        console.log("   Container cleared.");

        // 2. Check user and kit data state
        if (!currentUser) {
             console.log("   No user logged in. Displaying login message.");
             if (drawerLoadingMessage) { drawerLoadingMessage.textContent = 'Veuillez vous connecter pour voir le kit.'; drawerLoadingMessage.style.display = 'block'; }
             if(clearKitButton) clearKitButton.style.display = 'none';
             return;
        }
        if (!currentKitData || currentKitData.length === 0) {
            console.log("   Kit data is empty. Displaying empty message.");
             if (drawerLoadingMessage) { drawerLoadingMessage.textContent = 'Le kit est vide.'; drawerLoadingMessage.style.display = 'block'; }
             if(clearKitButton) clearKitButton.style.display = 'none';
            return;
        }

        // 3. Prepare for display (kit is not empty)
        console.log(`   User logged in, kit has ${currentKitData.length} items. Preparing display...`);
        if (drawerLoadingMessage) drawerLoadingMessage.style.display = 'none';
        if(clearKitButton) clearKitButton.style.display = 'block';

        // 4. --- Group items by drawer (Original Logic with Logs) ---
        const drawersMap = new Map();
        console.log("   Starting grouping items by drawer...");
        try {
            currentKitData.forEach((item, index) => {
                const drawerKey = item.drawer?.trim().toUpperCase() || 'TIROIR_INCONNU';
                // console.log(`      Item ${index}: Ref=${item.ref}, Raw Drawer='${item.drawer}', Key='${drawerKey}'`);
                if (!drawersMap.has(drawerKey)) {
                    drawersMap.set(drawerKey, { items: [], worstStatus: 'ok' });
                    // console.log(`         -> New drawer added to map: '${drawerKey}'`);
                }
                const drawerInfo = drawersMap.get(drawerKey);
                drawerInfo.items.push(item);
                const itemStatus = getStockStatus(item.quantity, item.critical_threshold);
                const statusPriority = { ok: 1, warning: 2, critical: 3, unknown: 0 };
                if (statusPriority[itemStatus] > statusPriority[drawerInfo.worstStatus]) {
                    // console.log(`         -> Updating worst status for '${drawerKey}' from ${drawerInfo.worstStatus} to ${itemStatus}`);
                    drawerInfo.worstStatus = itemStatus;
                }
            });
            console.log("   Grouping finished. Drawers Map size:", drawersMap.size);
            // Optionnel: Logguer le contenu de la map si peu d'éléments pour déboguer
            // if (drawersMap.size < 10) console.log("   Drawers Map content:", drawersMap);

        } catch (groupingError) {
            console.error(">>> BOM DEBUG v3: ERROR during item grouping:", groupingError);
            drawerListContainer.innerHTML = `<p class="error-message" style="color:red;">Erreur lors du groupement des tiroirs.</p>`;
            return;
        }

        // 5. --- Sort drawer keys (Original Logic with Logs) ---
        let sortedDrawers = [];
        console.log("   Starting sorting drawer keys...");
        try {
            sortedDrawers = Array.from(drawersMap.keys()).sort((a, b) => {
                if (a === 'TIROIR_INCONNU') return 1;
                if (b === 'TIROIR_INCONNU') return -1;
                // Tentative de tri numérique robuste
                const numA = a.match(/\d+/g)?.map(Number) || [];
                const numB = b.match(/\d+/g)?.map(Number) || [];
                const strA = a.match(/[a-zA-Z]+/g)?.join('') || '';
                const strB = b.match(/[a-zA-Z]+/g)?.join('') || '';

                if (strA !== strB) return strA.localeCompare(strB);

                for (let i = 0; i < Math.max(numA.length, numB.length); i++) {
                    const valA = numA[i] ?? -Infinity;
                    const valB = numB[i] ?? -Infinity;
                    if (valA !== valB) return valA - valB;
                }
                // Fallback au cas où (devrait être rare)
                return a.localeCompare(b);
            });
            console.log(`   Sorting finished. ${sortedDrawers.length} sorted keys.`, sortedDrawers);
        } catch (sortingError) {
            console.error(">>> BOM DEBUG v3: ERROR during drawer sorting:", sortingError);
            drawerListContainer.innerHTML = `<p class="error-message" style="color:red;">Erreur lors du tri des tiroirs.</p>`;
            // Essayer d'afficher sans tri si le tri échoue ? Ou arrêter ? Pour l'instant on arrête.
            return;
        }


        // 6. --- Create and append buttons (Original Logic with Logs) ---
        console.log(`   Starting button creation loop for ${sortedDrawers.length} drawers...`);
        sortedDrawers.forEach((drawerKey, index) => {
             // console.log(`      Creating button for drawer ${index + 1}: '${drawerKey}'`);
             try {
                 const drawerData = drawersMap.get(drawerKey);
                 const button = document.createElement('button');
                 button.classList.add('bom-drawer-button', `status-${drawerData.worstStatus}`);
                 button.dataset.drawer = drawerKey; // Crucial pour le clic et l'update

                 const drawerNameSpan = document.createElement('span');
                 drawerNameSpan.textContent = drawerKey === 'TIROIR_INCONNU' ? '?' : drawerKey;
                 button.appendChild(drawerNameSpan);

                 const checkmarkSpan = document.createElement('span');
                 checkmarkSpan.classList.add('checkmark');
                 button.appendChild(checkmarkSpan);

                 // Appliquer la classe 'collected' basée sur l'état actuel
                 if (collectedDrawers.has(drawerKey)) {
                     button.classList.add('collected');
                     // console.log(`         -> Drawer '${drawerKey}' marked as collected.`);
                 }

                 // Créer le tooltip (inchangé)
                 let tooltipContent = `Tiroir: ${drawerKey === 'TIROIR_INCONNU' ? 'Non défini' : drawerKey}\n`;
                 tooltipContent += `Statut (pire): ${drawerData.worstStatus.toUpperCase()}\n`;
                 tooltipContent += `------------------------------\nComposants:\n`;
                 drawerData.items.forEach(item => {
                     const itemStatus = getStockStatus(item.quantity, item.critical_threshold);
                     tooltipContent += `- ${item.ref} (Stock: ${item.quantity ?? 'N/A'}, Seuil: ${item.critical_threshold ?? 'N/A'}, Statut: ${itemStatus.toUpperCase()})\n`;
                 });
                 button.title = tooltipContent.trim();

                 // Ajouter l'écouteur d'événement
                 button.addEventListener('click', handleDrawerButtonClick); // Utiliser le handler original maintenant

                 // Ajouter au conteneur
                 drawerListContainer.appendChild(button);
                 // console.log(`      Button for '${drawerKey}' added successfully.`);

             } catch (buttonError) {
                 console.error(`>>> BOM DEBUG v3: ERROR creating button for drawer '${drawerKey}':`, buttonError);
                 const errDiv = document.createElement('div');
                 errDiv.textContent = `Erreur affichage tiroir ${drawerKey}`;
                 errDiv.style.color = 'red'; errDiv.style.padding = '5px';
                 drawerListContainer.appendChild(errDiv);
             }
        });
        console.log("   Button creation loop finished.");
        console.log(">>> BOM DEBUG v3: Exiting displayKitDrawers() [RESTORED VERSION].");
    }

    // --- ***** NOUVELLE FONCTION: Mettre à jour Styles Tiroirs (pour Realtime optimisé) ***** ---
    function updateDrawerStyles() {
        console.log(">>> BOM DEBUG v3: Entered updateDrawerStyles()...");
        if (!drawerListContainer) {
            console.warn("   Cannot update styles: drawerListContainer is null.");
            return;
        }
        const buttons = drawerListContainer.querySelectorAll('button.bom-drawer-button');
        console.log(`   Found ${buttons.length} drawer buttons to update.`);
        let updatedCount = 0;
        buttons.forEach(button => {
            const drawerKey = button.dataset.drawer;
            if (drawerKey) {
                const isCollected = collectedDrawers.has(drawerKey);
                const hasClass = button.classList.contains('collected');
                if (isCollected && !hasClass) {
                    button.classList.add('collected');
                    console.log(`      -> Added 'collected' to ${drawerKey}`);
                    updatedCount++;
                } else if (!isCollected && hasClass) {
                    button.classList.remove('collected');
                     console.log(`      -> Removed 'collected' from ${drawerKey}`);
                     updatedCount++;
                }
            }
        });
        console.log(`   Finished updating styles. ${updatedCount} buttons changed state.`);
        console.log(">>> BOM DEBUG v3: Exiting updateDrawerStyles().");
    }


    // --- Gestion des Événements UI ---
    // Utilise maintenant le handler original qui met à jour l'UI et sauvegarde
    async function handleDrawerButtonClick(event) {
        const button = event.target.closest('.bom-drawer-button');
        if (!button) return;
        const drawerKey = button.dataset.drawer;
        console.log(`>>> BOM DEBUG v3: Drawer button clicked: '${drawerKey}'`);

        // 1. Update local state (Set) and UI Class
        if (button.classList.contains('collected')) {
            // On va le décocher
            button.classList.remove('collected');
            collectedDrawers.delete(drawerKey);
            console.log(`   -> Unmarked '${drawerKey}' as collected (local Set and UI).`);
        } else {
            // On va le cocher
            button.classList.add('collected');
            collectedDrawers.add(drawerKey);
            console.log(`   -> Marked '${drawerKey}' as collected (local Set and UI).`);
        }

        // 2. Save local state (localStorage for tab sync)
        saveCollectedState();

        // 3. Save collected state to Supabase (async)
        await saveCollectedStateToSupabase(); // Pas besoin d'attendre ici
    }

    // handleClearKitClick (inchangée, appelle displayKitDrawers version restaurée)
    async function handleClearKitClick() {
        if (!currentUser) { showFeedback("Vous devez être connecté pour vider le kit.", 'error'); return; }
        console.log(">>> BOM DEBUG v3: Clear Kit button clicked.");
        currentKitData = []; collectedDrawers = new Set(); saveCollectedState();
        showFeedback("Vidage du kit en cours...", 'info', 0);
        const clearedInDb = await clearKitInSupabase();
        if (clearedInDb) { showFeedback("Kit vidé avec succès.", 'success'); console.log(">>> BOM DEBUG v3: Kit cleared locally and in Supabase."); }
        else { showFeedback("Erreur lors du vidage du kit en base de données. Voir console.", 'error', 0); console.error(">>> BOM DEBUG v3: Kit cleared locally, but error clearing Supabase."); }
        displayKitDrawers(); // Update UI
    }


    // --- Authentification ---
    // (handleLogin, handleLogout, setupAuthListener, handleAuthStateChange inchangées par rapport à la version Debug précédente - gardent les logs détaillés)
    async function handleLogin() { console.log(">>> BOM DEBUG v3: Entered handleLogin()..."); if (!supabase) { loginError.textContent = "Erreur: Client Supabase non initialisé."; loginError.style.display = 'block'; return; } const code = loginCodeInput.value.trim().toLowerCase(); const password = loginPasswordInput.value.trim(); loginError.style.display = 'none'; if (!code || !password) { loginError.textContent = "Code et mot de passe requis."; loginError.style.display = 'block'; console.log("   Login aborted: Missing code or password."); return; } const email = code + FAKE_EMAIL_DOMAIN; loginButton.disabled = true; loginError.textContent = "Connexion..."; loginError.style.color = 'var(--text-muted)'; loginError.style.display = 'block'; console.log(`   Attempting login for code: ${code}, email: ${email}`); try { console.log("   Calling supabase.auth.signInWithPassword..."); const { data, error } = await supabase.auth.signInWithPassword({ email: email, password: password }); console.log("   supabase.auth.signInWithPassword call finished."); if (error) { console.error(">>> BOM DEBUG v3: Login ERROR from Supabase:", error.message); loginError.textContent = (error.message.includes("Invalid login credentials")) ? "Code ou mot de passe incorrect." : "Erreur de connexion."; loginError.style.color = 'var(--error-color)'; loginError.style.display = 'block'; loginCodeInput.focus(); } else { console.log(">>> BOM DEBUG v3: Login SUCCESSFUL (signInWithPassword). User:", data.user?.email); loginError.style.display = 'none'; } } catch (err) { console.error(">>> BOM DEBUG v3: JAVASCRIPT ERROR during handleLogin:", err); loginError.textContent = "Erreur inattendue."; loginError.style.color = 'var(--error-color)'; loginError.style.display = 'block'; } finally { loginButton.disabled = false; console.log(">>> BOM DEBUG v3: Exiting handleLogin()."); } }
    async function handleLogout() { console.log(">>> BOM DEBUG v3: Entered handleLogout()..."); if (!supabase) { showFeedback("Erreur interne (Supabase).", 'error'); return; } logoutButton.disabled = true; console.log("   Calling supabase.auth.signOut()..."); const { error } = await supabase.auth.signOut(); console.log("   supabase.auth.signOut() finished."); logoutButton.disabled = false; if (error) { console.error(">>> BOM DEBUG v3: Logout ERROR from Supabase:", error.message); showFeedback(`Erreur déconnexion: ${error.message}.`, 'error'); } else { console.log(">>> BOM DEBUG v3: Logout SUCCESSFUL (signOut). Auth listener should take over."); } console.log(">>> BOM DEBUG v3: Exiting handleLogout()."); }
    async function setupAuthListener() { console.log(">>> BOM DEBUG v3: Entered setupAuthListener()..."); if (!supabase) { console.error(">>> BOM DEBUG v3: Cannot setup auth listener: Supabase not ready."); return; } try { console.log("   Calling supabase.auth.getSession()..."); const { data: { session }, error: sessionError } = await supabase.auth.getSession(); console.log("   supabase.auth.getSession() finished."); if (sessionError) { console.error(">>> BOM DEBUG v3: Error getting initial session:", sessionError); } console.log(`   Initial session found: ${session ? session.user?.email : 'No session'}`); await handleAuthStateChange(session ? 'INITIAL_SESSION' : 'SIGNED_OUT', session); console.log("   Attaching onAuthStateChange listener..."); supabase.auth.onAuthStateChange(async (event, session) => { console.log(`>>> BOM DEBUG v3: Received onAuthStateChange event: ${event}`, session ? `Session for: ${session.user?.email}` : 'No session'); await handleAuthStateChange(event, session); }); console.log("   onAuthStateChange listener attached."); } catch(e) { console.error(">>> BOM DEBUG v3: JAVASCRIPT ERROR during setupAuthListener:", e); await handleAuthStateChange('SIGNED_OUT', null); } console.log(">>> BOM DEBUG v3: Exiting setupAuthListener()."); }
    async function handleAuthStateChange(event, session) { console.log(`>>> BOM DEBUG v3: Entered handleAuthStateChange() - Event: ${event}`); const wasConnected = !!currentUser; const previousUserId = currentUser?.id; let needsKitLoad = false; let needsRealtimeSetup = false; let needsRealtimeCleanup = false; if (session && session.user) { const userJustLoggedIn = !wasConnected; const userChanged = wasConnected && currentUser.id !== session.user.id; console.log(`   User is connected. ID: ${session.user.id}, Email: ${session.user.email}`); console.log(`   Was connected: ${wasConnected}, User just logged in: ${userJustLoggedIn}, User changed: ${userChanged}`); currentUser = session.user; currentUserCode = currentUser.email.split('@')[0].toLowerCase(); console.log(`   Set currentUser to: ${currentUserCode} (ID: ${currentUser.id})`); if (loginArea) loginArea.style.display = 'none'; if (userInfoArea) userInfoArea.style.display = 'flex'; if (userDisplay) userDisplay.textContent = currentUserCode.toUpperCase(); if (loginError) loginError.style.display = 'none'; document.body.classList.add('user-logged-in'); if (userJustLoggedIn || userChanged) { console.log(`   Event indicates user change or first login. Flagging for kit load and Realtime setup.`); needsKitLoad = true; needsRealtimeSetup = true; if (userChanged) { console.log("   User changed, clearing local collected state before DB load."); collectedDrawers = new Set(); localStorage.removeItem(COLLECTED_DRAWERS_KEY); } } else { console.log(`   Event (${event}) for already connected user. No automatic kit reload or Realtime reset needed.`); } } else { console.log(`   User is disconnected (session is null or no user). Event: ${event}`); if (wasConnected) { console.log("   User was previously connected. Cleaning up."); showFeedback("Vous avez été déconnecté.", "info"); needsRealtimeCleanup = true; } currentUser = null; currentUserCode = null; currentKitData = []; collectedDrawers = new Set(); localStorage.removeItem(COLLECTED_DRAWERS_KEY); console.log("   Cleared currentUser, kit data, collected state."); if (userInfoArea) userInfoArea.style.display = 'none'; if (loginArea) loginArea.style.display = 'flex'; if (loginCodeInput) loginCodeInput.focus(); document.body.classList.remove('user-logged-in'); needsKitLoad = true; needsRealtimeSetup = false; } console.log("   Performing actions based on flags..."); if (needsRealtimeCleanup && kitSubscription) { console.log("   Attempting Realtime cleanup..."); isRealtimeSubscribed = false; try { await supabase.removeChannel(kitSubscription); console.log("   Old Realtime subscription removed successfully."); } catch(e) { console.error(">>> BOM DEBUG v3: ERROR removing Realtime channel:", e); } kitSubscription = null; } else { console.log("   No Realtime cleanup needed or no active subscription."); } if (needsKitLoad) { console.log("   Flag needsKitLoad is TRUE. Calling loadKitFromSupabase()..."); if (currentUser) { console.log(`      Calling loadKitFromSupabase for user ${currentUser.id}...`); await loadKitFromSupabase(); } else { console.log(`      Calling loadKitFromSupabase when currentUser is NULL (expected after logout)...`); await loadKitFromSupabase(); } } else { console.log("   Flag needsKitLoad is FALSE. Calling displayKitDrawers() to ensure UI consistency."); displayKitDrawers(); } if (needsRealtimeSetup && currentUser) { console.log("   Flag needsRealtimeSetup is TRUE. Calling setupRealtimeListener()..."); await setupRealtimeListener(); } else if (needsRealtimeSetup && !currentUser) { console.warn("   Flag needsRealtimeSetup is TRUE, but currentUser is NULL. Skipping Realtime setup."); } else { console.log("   No Realtime setup needed."); } console.log(`>>> BOM DEBUG v3: Exiting handleAuthStateChange() - Event: ${event}`); }


    // --- ***** ÉCOUTEUR REALTIME (VERSION OPTIMISÉE) ***** ---
    async function setupRealtimeListener() {
        if (!supabase) { console.warn(">>> BOM DEBUG v3: Setup Realtime impossible: Supabase non prêt."); return; }
        if (!currentUser) { console.log(">>> BOM DEBUG v3: Pas d'utilisateur connecté, pas d'abonnement Realtime."); return; }

        if (kitSubscription && isRealtimeSubscribed && kitSubscription.state === 'joined') {
             console.log(">>> BOM DEBUG v3: Realtime subscription already active. Skipping setup.");
             return;
        }
        if (kitSubscription) { // Cleanup previous if exists but not joined/ok
            console.log(`>>> BOM DEBUG v3: Cleaning up existing Realtime subscription (state: ${kitSubscription.state})...`);
            isRealtimeSubscribed = false;
             try { await supabase.removeChannel(kitSubscription); } catch(e) { console.error(">>> BOM DEBUG v3: JS ERROR during removeChannel:", e); }
            kitSubscription = null;
        }

        console.log(`>>> BOM DEBUG v3: Setting up NEW Realtime subscription for user_kits (user_id = ${currentUser.id})...`);
        const newChannel = supabase.channel(`user_kit_updates_for_${currentUser.id}`);

        newChannel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'user_kits', filter: `user_id=eq.${currentUser.id}` },
            async (payload) => {
                console.log('>>> BOM DEBUG v3: REALTIME CHANGE received!', payload);

                // Analyser le payload pour déterminer quoi faire
                if (payload.eventType === 'DELETE') {
                    console.log("   Realtime: DELETE event detected. Full reload needed.");
                    await loadKitFromSupabase(); // Recharger car le kit a été vidé
                } else if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                    const newRecord = payload.new;
                    const oldRecord = payload.old; // Peut être vide pour INSERT

                    // Comparer kit_data (simpliste: juste la longueur pour l'instant)
                    const kitDataChanged = JSON.stringify(oldRecord?.kit_data) !== JSON.stringify(newRecord?.kit_data);
                    // Comparer collected_drawers
                    const oldCollected = oldRecord?.collected_drawers || [];
                    const newCollected = newRecord?.collected_drawers || [];
                    const collectedChanged = JSON.stringify(oldCollected.sort()) !== JSON.stringify(newCollected.sort());

                    console.log(`   Realtime Analysis: kitDataChanged=${kitDataChanged}, collectedChanged=${collectedChanged}`);

                    if (kitDataChanged) {
                        // Si le kit lui-même a changé, recharger tout est plus sûr
                        console.log("   Realtime: kit_data changed. Full reload needed.");
                        await loadKitFromSupabase();
                    } else if (collectedChanged) {
                        // Si SEULEMENT l'état collecté a changé, mettre à jour uniquement les styles
                        console.log("   Realtime: Only collected_drawers changed. Updating styles only.");
                        // Mettre à jour notre Set local
                        collectedDrawers = new Set(newCollected);
                        saveCollectedState(); // Mettre à jour localStorage aussi
                        updateDrawerStyles(); // Mettre à jour l'UI sans tout redessiner
                    } else {
                        console.log("   Realtime: No significant change detected in payload. Doing nothing.");
                    }
                } else {
                    console.warn("   Realtime: Unhandled eventType:", payload.eventType, ". Triggering full reload as fallback.");
                    await loadKitFromSupabase(); // Fallback
                }
            }
        ).subscribe((status, err) => {
            // (Gestion des statuts SUBSCRIBED, ERROR, TIMEOUT, CLOSED inchangée)
            console.log(`>>> BOM DEBUG v3: Realtime subscription status changed: ${status}`);
            switch (status) {
                case 'SUBSCRIBED': console.log('>>> BOM DEBUG v3: NEW Realtime subscription SUCCESSFUL!'); kitSubscription = newChannel; isRealtimeSubscribed = true; break;
                case 'CHANNEL_ERROR': console.error('>>> BOM DEBUG v3: Realtime channel error.', err); showFeedback("Erreur connexion temps réel.", 'error', 0); kitSubscription = null; isRealtimeSubscribed = false; break;
                case 'TIMED_OUT': console.warn('>>> BOM DEBUG v3: Realtime subscription TIMEOUT.'); showFeedback("Timeout connexion temps réel.", 'error'); kitSubscription = null; isRealtimeSubscribed = false; break;
                case 'CLOSED': console.log('>>> BOM DEBUG v3: Realtime channel CLOSED.'); if (isRealtimeSubscribed) { console.warn(">>> BOM DEBUG v3: Realtime channel closed unexpectedly?"); isRealtimeSubscribed = false; kitSubscription = null; if (currentUser) { setTimeout(setupRealtimeListener, 5000); } } else { console.log("   Channel closure expected or handled."); kitSubscription = null; } break;
                default: console.log(`   Unhandled Realtime status: ${status}`);
            }
        });
        console.log(">>> BOM DEBUG v3: Attempt to subscribe to new Realtime channel initiated.");
    }


    // --- Écouteur pour l'événement storage ---
    // (Inchangé, appelle maintenant updateDrawerStyles après load pour MAJ visuelle)
    window.addEventListener('storage', (event) => {
        if (event.key === COLLECTED_DRAWERS_KEY) {
             console.log(">>> BOM DEBUG v3: Event 'storage' received for COLLECTED_DRAWERS_KEY.");
             loadCollectedStateFromLocalStorage(); // Charge juste pour log
             // Mettre à jour l'état du Set principal basé sur ce qui a été lu
             try {
                 const storedState = localStorage.getItem(COLLECTED_DRAWERS_KEY);
                 if (storedState) {
                     const parsedState = JSON.parse(storedState);
                     if (Array.isArray(parsedState)) {
                         collectedDrawers = new Set(parsedState);
                         console.log("   Applied localStorage state to collectedDrawers Set.");
                     }
                 }
             } catch(e) { console.error("   Error applying localStorage state:", e); }
             // Mettre à jour l'UI
             updateDrawerStyles();
        }
    });


    // --- Initialisation de la Page ---
    console.log(">>> BOM DEBUG v3: Adding final UI event listeners...");
    loginButton?.addEventListener('click', handleLogin);
    loginPasswordInput?.addEventListener('keypress', (e) => { if(e.key === 'Enter') handleLogin(); });
    loginCodeInput?.addEventListener('keypress', (e) => { if(e.key === 'Enter') handleLogin(); });
    logoutButton?.addEventListener('click', handleLogout);
    clearKitButton?.addEventListener('click', handleClearKitClick);
    // Note: L'écouteur pour les boutons tiroirs est ajouté dans displayKitDrawers

    console.log(">>> BOM DEBUG v3: Initial call to setupAuthListener()...");
    setupAuthListener();

    console.log(">>> BOM DEBUG v3: End of initial script execution.");

}); // Fin DOMContentLoaded
// --- END OF FILE bom-script.js (Restored Display + Optimized Realtime) ---