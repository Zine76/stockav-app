// --- START OF FILE script.js (avec corrections ciblées v4 - Attributs Debug + Import CSV Batching/Map) ---

document.addEventListener('DOMContentLoaded', () => {
    "use strict";

    // --- Configuration et Variables Globales ---
    // ... (inchangé)
    let currentUser = null;
    let currentUserCode = null;
    let ITEMS_PER_PAGE = 15; // Default, sera écrasé par localStorage si dispo
    let isInitialAuthCheckComplete = false;
    let activeSession = null;
    let lastDisplayedDrawerRef = null;
    let lastDisplayedDrawerThreshold = null;
    let categoriesCache = [];
    let currentKitSelection = [];
    let collectedDrawersSet = new Set();
    let userKitRealtimeSubscription = null;

    // --- Configuration Supabase ---
    // ... (inchangé)
    const SUPABASE_URL = 'https://tjdergojgghzmopuuley.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZGVyZ29qZ2doem1vcHV1bGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4MTU0OTUsImV4cCI6MjA1OTM5MTQ5NX0.XejQYEPYoCrgYOwW4T9g2VcmohCdLLndDdwpSYXAwPA';
    const FAKE_EMAIL_DOMAIN = '@stockav.local';
    let supabase = null;

    // --- Initialisation des Clients et Vérifications ---
    // ... (inchangé)
    try {
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !FAKE_EMAIL_DOMAIN) {
            throw new Error("Configuration Supabase manquante ! Vérifiez les constantes SUPABASE_URL, SUPABASE_ANON_KEY, FAKE_EMAIL_DOMAIN.");
        }
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            // console.log("Client Supabase initialisé."); // Log commenté
        } else {
            throw new Error("Librairie Supabase (supabase-js v2) non chargée. Vérifiez l'inclusion dans index.html.");
        }
        if (typeof Papa === 'undefined') {
            console.warn("Librairie PapaParse non chargée. L'import/export CSV pourrait ne pas fonctionner.");
        }
        // Vérification FileSaver optionnelle car utilisée via CDN dans index.html
        if (typeof saveAs === 'undefined') {
            console.warn("Librairie FileSaver.js non chargée (saveAs). Le téléchargement direct pourrait ne pas fonctionner sur tous les navigateurs.");
        }
    } catch (error) {
        console.error("Erreur critique lors de l'initialisation:", error);
         document.body.innerHTML = `<div style="padding:20px; background-color:#f8d7da; color:#721c24; border: 1px solid #f5c6cb; border-radius: 5px;">
                                    <h2>Erreur Critique d'Initialisation</h2>
                                    <p>L'application n'a pas pu démarrer correctement.</p>
                                    <p><strong>Détail :</strong> ${error.message}</p>
                                    <p>Veuillez vérifier la console du navigateur (F12) pour plus d'informations et contacter l'administrateur si le problème persiste.</p>
                                   </div>`;
        return;
    }

    // --- Récupération des Éléments DOM ---
    // ... (inchangé)
    const loginArea = document.getElementById('login-area');
    const loginCodeInput = document.getElementById('login-code');
    const loginPasswordInput = document.getElementById('login-password');
    const loginButton = document.getElementById('login-button');
    const loginError = document.getElementById('login-error');
    const userInfoArea = document.getElementById('user-info-area');
    const userDisplay = document.getElementById('user-display');
    const logoutButton = document.getElementById('logout-button');
    const mainNavigation = document.getElementById('main-navigation');
    const searchTabButton = document.getElementById('show-search-view');
    const inventoryTabButton = document.getElementById('show-inventory-view');
    const logTabButton = document.getElementById('show-log-view');
    const adminTabButton = document.getElementById('show-admin-view');
    const settingsTabButton = document.getElementById('show-settings-view');
    const auditTabButton = document.getElementById('show-audit-view');
    const kitTabButton = document.getElementById('show-bom-view');
    const searchView = document.getElementById('search-view');
    const inventoryView = document.getElementById('inventory-view');
    const logView = document.getElementById('log-view');
    const adminView = document.getElementById('admin-view');
    const settingsView = document.getElementById('settings-view');
    const auditView = document.getElementById('audit-view');
    const kitView = document.getElementById('bom-view');
    const viewSections = document.querySelectorAll('main.view-section');
    const protectedButtons = document.querySelectorAll('#show-log-view, #show-admin-view, #show-settings-view, #show-audit-view, #show-bom-view');
    const quantityChangeModal = document.getElementById('quantity-change-modal');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalRefSpan = document.getElementById('modal-component-ref');
    const modalQtySpan = document.getElementById('modal-current-quantity');
    const modalDecreaseButton = document.getElementById('modal-decrease-button');
    const modalIncreaseButton = document.getElementById('modal-increase-button');
    const modalChangeAmountDisplay = document.getElementById('modal-change-amount');
    const modalConfirmButton = document.getElementById('modal-confirm-button');
    const modalCancelButton = document.getElementById('modal-cancel-button');
    const modalFeedback = document.getElementById('modal-feedback');
    const modalAttributesContainer = document.getElementById('modal-current-attributes');
    const modalAttributesList = document.getElementById('modal-attributes-list');
    const sevenSegmentDisplay = document.getElementById('seven-segment-display');
    const segmentDigits = [
        sevenSegmentDisplay?.querySelector('.digit-1'), sevenSegmentDisplay?.querySelector('.digit-2'),
        sevenSegmentDisplay?.querySelector('.digit-3'), sevenSegmentDisplay?.querySelector('.digit-4')
    ];
    let modalCurrentRef = null;
    let modalInitialQuantity = 0;
    let currentModalChange = 0;
    let currentInventoryPage = 1;
    let currentLogPage = 1;
    const inventoryTableBody = document.getElementById('inventory-table-body');
    const inventoryCategoryFilter = document.getElementById('inventory-category-filter');
    const inventorySearchFilter = document.getElementById('inventory-search-filter');
    const applyInventoryFilterButton = document.getElementById('apply-inventory-filter-button');
    const inventoryPrevPageButton = document.getElementById('inventory-prev-page');
    const inventoryNextPageButton = document.getElementById('inventory-next-page');
    const inventoryPageInfo = document.getElementById('inventory-page-info');
    const inventoryNoResults = document.getElementById('inventory-no-results');
    const attributeFiltersContainer = document.getElementById('inventory-attribute-filters');
    const logTableBody = document.getElementById('log-table-body');
    const logPrevPageButton = document.getElementById('log-prev-page');
    const logNextPageButton = document.getElementById('log-next-page');
    const logPageInfo = document.getElementById('log-page-info');
    const logNoResults = document.getElementById('log-no-results');
    const categoryList = document.getElementById('category-list');
    const categoryForm = document.getElementById('category-form');
    const categoryNameInput = document.getElementById('category-name');
    const categoryAttributesInput = document.getElementById('category-attributes');
    const categoryIdEditInput = document.getElementById('category-id-edit');
    const cancelEditButton = document.getElementById('cancel-edit-button');
    const categoryFormTitle = document.getElementById('category-form-title');
    const adminFeedbackDiv = document.getElementById('admin-feedback');
    const stockForm = document.getElementById('stock-form');
    const componentRefAdminInput = document.getElementById('component-ref-admin');
    const checkStockButton = document.getElementById('check-stock-button');
    const componentActionsWrapper = document.getElementById('component-actions');
    const currentQuantitySpan = document.getElementById('current-quantity');
    const updateQuantityButton = document.getElementById('update-quantity-button');
    const quantityChangeInput = document.getElementById('quantity-change');
    const deleteComponentButton = document.getElementById('delete-component-button');
    const componentCategorySelectAdmin = document.getElementById('component-category-select');
    const specificAttributesDiv = document.getElementById('category-specific-attributes'); // Cible correcte
    const componentDescInput = document.getElementById('component-desc');
    const componentMfgInput = document.getElementById('component-mfg');
    const componentDatasheetInput = document.getElementById('component-datasheet');
    const componentInitialQuantityInput = document.getElementById('component-initial-quantity');
    const componentDrawerAdminInput = document.getElementById('component-drawer-admin');
    const componentThresholdInput = document.getElementById('component-threshold');
    const saveComponentButton = document.getElementById('save-component-button');
    const exportCriticalButton = document.getElementById('export-critical-txt-button');
    const exportCriticalFeedbackDiv = document.getElementById('export-critical-feedback');
    const componentDetails = document.getElementById('component-details');
    const searchButtonChat = document.getElementById('search-button');
    const componentInputChat = document.getElementById('component-input');
    const responseOutputChat = document.getElementById('response-output');
    const loadingIndicatorChat = document.getElementById('loading-indicator');
    const exportInventoryCsvButton = document.getElementById('export-inventory-csv-button');
    const exportLogTxtButton = document.getElementById('export-log-txt-button');
    const exportFeedbackDiv = document.getElementById('export-feedback');
    const importCsvFileInput = document.getElementById('import-csv-file');
    const importInventoryCsvButton = document.getElementById('import-inventory-csv-button');
    const importFeedbackDiv = document.getElementById('import-feedback');
    const auditCategoryFilter = document.getElementById('audit-category-filter');
    const auditDrawerFilter = document.getElementById('audit-drawer-filter');
    const applyAuditFilterButton = document.getElementById('apply-audit-filter-button');
    const auditTableBody = document.getElementById('audit-table-body');
    const auditNoResults = document.getElementById('audit-no-results');
    const auditFeedbackDiv = document.getElementById('audit-feedback');
    const kitFeedbackDiv = document.getElementById('bom-feedback');
    const currentKitDrawersDiv = document.getElementById('current-kit-drawers');
    const clearKitButton = document.getElementById('clear-kit-button');
    const genericFeedbackDiv = document.getElementById('generic-feedback');
    const itemsPerPageSelect = document.getElementById('items-per-page-select');
    const exportQrButton = document.getElementById('export-qr-button');


    // --- État et Historique du Chat ---
    // ... (inchangé)
    let chatHistory = [];
    let conversationState = { awaitingQuantityConfirmation: false, chosenRefForStockCheck: null, availableQuantity: 0, criticalThreshold: null };
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    // --- Fonctions Kit (inchangées) ---
    // ... (saveKitToSupabase, loadKitFromSupabase, clearKitInSupabase) ...
    async function saveKitToSupabase() { if (!currentUser || !supabase) { console.warn("Impossible de sauvegarder le kit : Utilisateur non connecté ou Supabase non prêt."); return; } if (currentKitSelection.length === 0) { console.log("Kit local vide, tentative de suppression de l'enregistrement du kit en DB."); await clearKitInSupabase(); return; } console.log(`Sauvegarde du kit (${currentKitSelection.length} éléments) dans Supabase pour user ${currentUser.id}...`); try { const { error } = await supabase.from('user_kits').upsert({ user_id: currentUser.id, kit_data: currentKitSelection, }, { onConflict: 'user_id' }); if (error) { if (error.message.includes('violates row-level security policy')) { console.error("Erreur RLS : L'utilisateur n'a pas la permission de modifier ce kit.", error); } else { console.error("Erreur lors de la sauvegarde du kit dans Supabase:", error); } showKitFeedback("Erreur sauvegarde du kit.", 'error'); } else { console.log("Kit sauvegardé avec succès dans Supabase (kit_data uniquement)."); } } catch (err) { console.error("Erreur JS inattendue lors de la sauvegarde du kit:", err); showKitFeedback("Erreur technique sauvegarde kit.", 'error'); } }
    async function loadKitFromSupabase() { let loadedKit = []; let loadedCollectedDrawers = new Set(); if (!currentUser || !supabase) { console.log("Chargement du kit/état collecté annulé : Utilisateur non connecté ou Supabase non prêt."); } else { console.log(`Chargement du kit ET de l'état collecté depuis Supabase pour user ${currentUser.id}...`); try { const { data, error } = await supabase.from('user_kits').select('kit_data, collected_drawers').eq('user_id', currentUser.id).maybeSingle(); if (error) { if (error.message.includes('relation "public.user_kits" does not exist')) { console.error("Erreur critique : La table 'user_kits' n'existe pas !"); showKitFeedback("Erreur: Table 'user_kits' manquante.", 'error'); } else if (error.message.includes('violates row-level security policy')) { console.error("Erreur RLS : Permission refusée (lecture kit).", error); showKitFeedback("Erreur de permission (lecture kit).", 'error'); } else { console.error("Erreur lors du chargement du kit/état collecté depuis Supabase:", error); showKitFeedback("Erreur chargement du kit.", 'error'); } } else if (data) { if (data.kit_data && Array.isArray(data.kit_data)) { loadedKit = data.kit_data; console.log(`Kit chargé depuis Supabase (${loadedKit.length} éléments).`); } else { console.log("Enregistrement kit trouvé mais kit_data est null/vide/invalide."); } if (data.collected_drawers && Array.isArray(data.collected_drawers)) { loadedCollectedDrawers = new Set(data.collected_drawers); console.log(`État collecté chargé depuis Supabase (${loadedCollectedDrawers.size} tiroirs).`); } else { console.log("Aucun état collecté trouvé ou format invalide."); } } else { console.log("Aucun enregistrement kit/état collecté trouvé dans Supabase pour cet utilisateur."); } } catch (err) { console.error("Erreur JS inattendue lors du chargement du kit/état collecté:", err); showKitFeedback("Erreur technique chargement kit.", 'error'); } } currentKitSelection = loadedKit; collectedDrawersSet = loadedCollectedDrawers; if (kitView.classList.contains('active-view') || inventoryView.classList.contains('active-view')) { await refreshKitRelatedUI(); } }
    async function clearKitInSupabase() { if (!currentUser || !supabase) { console.warn("Impossible de vider le kit en DB: Utilisateur non connecté ou Supabase non prêt."); return false; } console.log(`Suppression du kit dans Supabase pour user ${currentUser.id}...`); try { const { error } = await supabase.from('user_kits').delete().eq('user_id', currentUser.id); if (error) { if (error.message.includes('violates row-level security policy')) { console.error("Erreur RLS : L'utilisateur n'a pas la permission de supprimer ce kit.", error); } else { console.error("Erreur lors de la suppression du kit dans Supabase:", error); } return false; } else { console.log("Kit supprimé/vidé avec succès dans Supabase."); return true; } } catch (err) { console.error("Erreur JS inattendue lors de la suppression du kit en DB:", err); return false; } }

    // --- Helpers UI Kit/Feedback (inchangés) ---
    // ... (showKitFeedback, refreshKitRelatedUI, updateInventoryRowStyles) ...
    function showKitFeedback(message, type = 'info', duration = 3000) { if (!kitFeedbackDiv) return; kitFeedbackDiv.textContent = message; kitFeedbackDiv.className = `feedback-area ${type}`; kitFeedbackDiv.style.display = 'block'; if (duration > 0) { setTimeout(() => { if (kitFeedbackDiv.textContent === message) { kitFeedbackDiv.style.display = 'none'; } }, duration); } }
    async function refreshKitRelatedUI() { console.log("Rafraîchissement UI liée au kit..."); if (kitView.classList.contains('active-view') && currentUser) { displayCurrentKitDrawers(); } if (inventoryView.classList.contains('active-view')) { await updateInventoryRowStyles(); } console.log("Fin rafraîchissement UI Kit."); }
    async function updateInventoryRowStyles() { if (!inventoryTableBody || !inventoryView.classList.contains('active-view')) { return; } console.log("Mise à jour des styles des lignes d'inventaire..."); const rows = inventoryTableBody.querySelectorAll('tr.inventory-item-row'); let changedCount = 0; rows.forEach(row => { const itemDataStr = row.dataset.itemData; if (itemDataStr) { try { const itemData = JSON.parse(itemDataStr); const drawerKey = itemData.drawer; const isCollected = drawerKey && collectedDrawersSet.has(drawerKey); const hasClass = row.classList.contains('drawer-collected-in-bom'); if (isCollected && !hasClass) { row.classList.add('drawer-collected-in-bom'); const checkbox = row.querySelector('.kit-select-checkbox'); if (checkbox) checkbox.disabled = true; changedCount++; } else if (!isCollected && hasClass) { row.classList.remove('drawer-collected-in-bom'); const checkbox = row.querySelector('.kit-select-checkbox'); if (checkbox && itemData.quantity > 0) checkbox.disabled = false; changedCount++; } const isSelected = currentUser && currentKitSelection.some(kitItem => kitItem.ref === itemData.ref); const kitCheckbox = row.querySelector('.kit-select-checkbox'); if (kitCheckbox) { const wasChecked = kitCheckbox.checked; if (isSelected !== wasChecked) { kitCheckbox.checked = isSelected; changedCount++; } if (isSelected !== row.classList.contains('kit-selected')) { row.classList.toggle('kit-selected', isSelected); } kitCheckbox.disabled = isCollected || itemData.quantity <= 0; } } catch (e) { console.warn(`Erreur parsing itemData pour la ligne ${row.dataset.ref} lors de la mise à jour des styles`, e); } } }); console.log(`Styles mis à jour pour ${changedCount} lignes d'inventaire.`); }

    // --- Helpers Généraux (Stock Status, Indicator, HTML Escape) ---
    // ... (inchangé)
    function getStockStatus(quantity, threshold) { if (quantity === undefined || quantity === null || isNaN(quantity)) return 'unknown'; quantity = Number(quantity); threshold = (threshold === undefined || threshold === null || isNaN(threshold) || threshold < 0) ? -1 : Number(threshold); if (quantity <= 0) return 'critical'; if (threshold !== -1 && quantity <= threshold) return 'warning'; return 'ok'; }
    function createStockIndicatorHTML(quantity, threshold) { const status = getStockStatus(quantity, threshold); const qtyText = (quantity === undefined || quantity === null) ? 'N/A' : quantity; const thresholdText = (threshold === undefined || threshold === null || threshold < 0) ? 'N/A' : threshold; return `<span class="stock-indicator-chat level-${status}" title="Stock: ${status.toUpperCase()} (Qté: ${qtyText}, Seuil: ${thresholdText ?? 'N/A'})"></span>`; }
    function escapeHtml(unsafe) { if (typeof unsafe !== 'string') return unsafe; return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); }

    // --- Authentification (inchangée) ---
    // ... (handleLogin, handleLogout, setupAuthListener, handleUserConnected, handleUserDisconnected) ...
    async function handleLogin() { if (!supabase) { loginError.textContent = "Erreur: Client Supabase non initialisé."; loginError.style.display = 'block'; return; } const code = loginCodeInput.value.trim().toLowerCase(); const password = loginPasswordInput.value.trim(); loginError.style.display = 'none'; if (!code || !password) { loginError.textContent = "Code et mot de passe requis."; loginError.style.display = 'block'; return; } const email = code + FAKE_EMAIL_DOMAIN; loginButton.disabled = true; loginError.textContent = "Connexion..."; loginError.style.display = 'block'; loginError.style.color = 'var(--text-muted)'; console.log("<<< STEP handleLogin - START >>>"); console.log("   Code:", code, "Email:", email); try { console.log("   Attempting supabase.auth.signInWithPassword..."); const { data, error } = await supabase.auth.signInWithPassword({ email: email, password: password }); console.log("   supabase.auth.signInWithPassword returned."); if (error) { console.error("   Erreur connexion Supabase:", error.message, error); loginError.textContent = (error.message.includes("Invalid login credentials")) ? "Code ou mot de passe incorrect." : "Erreur de connexion."; loginError.style.color = 'var(--error-color)'; loginError.style.display = 'block'; loginCodeInput.focus(); } else { console.log("   Connexion Supabase réussie (signInWithPassword success):", data.user?.email); loginError.style.display = 'none'; loginCodeInput.value = ''; loginPasswordInput.value = ''; } } catch (err) { console.error("   Erreur JS inattendue lors de la connexion:", err); loginError.textContent = "Erreur inattendue lors de la connexion."; loginError.style.color = 'var(--error-color)'; loginError.style.display = 'block'; } finally { loginButton.disabled = false; console.log("<<< STEP handleLogin - END >>>"); } }
    async function handleLogout() { if (!supabase) { console.error("Client Supabase non initialisé lors du logout."); showGenericError("Erreur: Client non initialisé."); return; } console.log("Tentative de déconnexion..."); const { error } = await supabase.auth.signOut(); if (error) { console.error("Erreur déconnexion Supabase:", error.message, error); showGenericError(`Erreur lors de la déconnexion: ${error.message}. Vérifiez la console.`); } else { console.log("Déconnexion Supabase réussie."); updateSevenSegmentForComponent(null); invalidateCategoriesCache(); currentKitSelection = []; collectedDrawersSet = new Set(); if (kitView?.classList.contains('active-view')) { setActiveView(searchView, searchTabButton); } } }
    async function setupAuthListener() { if (!supabase) { console.error("Listener Auth impossible: Supabase non initialisé."); return; } try { console.log(">>> setupAuthListener: Getting initial session..."); const { data: { session }, error: sessionError } = await supabase.auth.getSession(); console.log(">>> setupAuthListener: getSession completed.", session ? `Initial session found for ${session.user?.email}` : "No initial session."); if (sessionError) { console.error("Erreur critique getSession initiale:", sessionError); } activeSession = session; isInitialAuthCheckComplete = true; console.log(">>> setupAuthListener: isInitialAuthCheckComplete set to true."); if (session) { await handleUserConnected(session.user, true); } else { handleUserDisconnected(true); } } catch (error) { console.error("Erreur critique lors du setupAuthListener (getSession):", error); isInitialAuthCheckComplete = true; handleUserDisconnected(true); } console.log(">>> setupAuthListener: Attaching onAuthStateChange listener..."); supabase.auth.onAuthStateChange(async (event, session) => { console.log(`!!! [onAuthStateChange RECEIVED] Event: ${event}, Session User: ${session?.user?.email ?? 'null'}, isInitialAuthCheckComplete: ${isInitialAuthCheckComplete}`); activeSession = session; switch (event) { case 'SIGNED_IN': if (session) await handleUserConnected(session.user, false); else console.warn("   [onAuthStateChange] SIGNED_IN event but no session ?!"); break; case 'SIGNED_OUT': handleUserDisconnected(false); break; case 'INITIAL_SESSION': console.log("   [onAuthStateChange] Initial session event received."); if (session && (!currentUser || currentUser.id !== session.user.id)) { console.log("   [onAuthStateChange] Correcting state based on INITIAL_SESSION: Connecting user."); await handleUserConnected(session.user, true); } else if (!session && currentUser) { console.log("   [onAuthStateChange] Correcting state based on INITIAL_SESSION: Disconnecting user."); handleUserDisconnected(true); } else { console.log("   [onAuthStateChange] INITIAL_SESSION state matches current state."); } break; case 'TOKEN_REFRESHED': console.log("   [onAuthStateChange] Token rafraîchi."); if (session && currentUser && session.user.id !== currentUser.id) { console.warn("   [onAuthStateChange] TOKEN_REFRESHED with user ID mismatch! Re-handling connection..."); await handleUserConnected(session.user, false); } else if (!session && currentUser) { console.warn("   [onAuthStateChange] TOKEN_REFRESHED but session is now null! Disconnecting..."); handleUserDisconnected(false); } else if (session && !currentUser) { console.warn("   [onAuthStateChange] TOKEN_REFRESHED and session exists, but no currentUser! Handling connection..."); await handleUserConnected(session.user, false); } break; case 'USER_UPDATED': if (session) { await handleUserConnected(session.user, false); } break; case 'PASSWORD_RECOVERY': console.log("   [onAuthStateChange] Password recovery event."); break; default: console.log("   [onAuthStateChange] Événement Auth non géré:", event); } console.log(`!!! [onAuthStateChange FINISHED] Event: ${event}`); }); console.log(">>> setupAuthListener: onAuthStateChange listener attached."); }
    async function handleUserConnected(user, isInitialLoad) { const userChanged = !currentUser || user.id !== currentUser.id; const previousUserCode = currentUserCode; if (userChanged) { await removeUserKitRealtimeListener(); } currentUser = user; currentUserCode = currentUser.email.split('@')[0].toLowerCase(); console.log(`Utilisateur connecté: ${currentUserCode} (ID: ${currentUser.id})${isInitialLoad ? ' [Initial]' : ''}${userChanged ? ' [Changed]' : ''}`); document.body.classList.add('user-logged-in'); if(loginArea) loginArea.style.display = 'none'; if(userInfoArea) userInfoArea.style.display = 'flex'; if(userDisplay) userDisplay.textContent = currentUserCode.toUpperCase(); if(loginError) loginError.style.display = 'none'; protectedButtons.forEach(btn => { if (btn) { const isSettingsButton = btn.id === 'show-settings-view'; const canAccessSettings = currentUserCode === 'zine'; if (isSettingsButton) { btn.style.display = canAccessSettings ? 'inline-block' : 'none'; btn.disabled = !canAccessSettings; btn.title = canAccessSettings ? '' : 'Accès réservé à l\'administrateur'; } else { btn.style.display = 'inline-block'; btn.disabled = false; btn.title = ''; } } }); const canAccessSettings = currentUserCode === 'zine'; const activeView = document.querySelector('main.view-section.active-view'); if (!canAccessSettings && activeView === settingsView) { console.log("Redirection depuis Paramètres car utilisateur non autorisé."); await setActiveView(searchView, searchTabButton); return; } if (userChanged || isInitialLoad) { console.log("Chargement données/caches suite à connexion/changement user..."); await loadKitFromSupabase(); if (userChanged || categoriesCache.length === 0) { invalidateCategoriesCache(); if(categoriesCache.length === 0) { try { await getCategories(); } catch (e) { console.error("Erreur chargement catégories:", e); } } } if (userChanged && !isInitialLoad && searchView?.classList.contains('active-view')) { displayWelcomeMessage(); } const currentActiveView = activeView || document.querySelector('main.view-section.active-view'); if (currentActiveView) { await reloadActiveViewData(currentActiveView); } else { await setActiveView(searchView, searchTabButton); } } else { console.log("Utilisateur déjà connecté et état stable, pas de rechargement de données complet."); await refreshKitRelatedUI(); } await setupUserKitRealtimeListener(); }
    async function handleUserDisconnected(isInitialLoad) { const wasConnected = !!currentUser; console.log(`Utilisateur déconnecté.${isInitialLoad ? ' [Initial]' : ''}`); await removeUserKitRealtimeListener(); currentUser = null; currentUserCode = null; activeSession = null; document.body.classList.remove('user-logged-in'); if(userInfoArea) userInfoArea.style.display = 'none'; if(loginArea) loginArea.style.display = 'flex'; protectedButtons.forEach(btn => { if (btn) { btn.style.display = 'none'; btn.disabled = true; btn.title = 'Connexion requise'; }}); hideQuantityModal(); updateSevenSegmentForComponent(null); currentKitSelection = []; collectedDrawersSet = new Set(); if (wasConnected || isInitialLoad) { console.log("Nettoyage données protégées et état..."); invalidateCategoriesCache(); clearProtectedViewData(); if (searchView?.classList.contains('active-view') && chatHistory.length > 0) { displayWelcomeMessage(); } } const activeView = document.querySelector('main.view-section.active-view'); const isProtectedViewActive = activeView && ['log-view', 'admin-view', 'settings-view', 'audit-view', 'bom-view'].includes(activeView.id); if (isProtectedViewActive) { setActiveView(searchView, searchTabButton); } else if (!activeView && isInitialLoad) { setActiveView(searchView, searchTabButton); } else if (activeView?.id === 'inventory-view') { setActiveView(inventoryView, inventoryTabButton); } else if (!activeView && !isInitialLoad) { setActiveView(searchView, searchTabButton); } }

    // --- Mise à jour UI/État pour Authentification (inchangée) ---
    // ... (reloadActiveViewData, showGenericError, clearProtectedViewData, setActiveView) ...
    async function reloadActiveViewData(viewElement) { if (!viewElement) return; const viewId = viewElement.id; const canAccessSettings = currentUser && currentUserCode === 'zine'; console.log(`Reloading data for active view: ${viewId}`); try { switch(viewId) { case 'inventory-view': if (categoriesCache.length === 0 && currentUser) await getCategories(); await populateInventoryFilters(); await displayInventory(currentInventoryPage); break; case 'log-view': if (currentUser) await displayLog(currentLogPage); break; case 'admin-view': if (currentUser) await loadAdminData(); break; case 'settings-view': if (canAccessSettings) loadSettingsData(); break; case 'audit-view': if (currentUser) { await populateAuditFilters(); await displayAudit(); } break; case 'bom-view': if (currentUser) displayCurrentKitDrawers(); else currentKitDrawersDiv.innerHTML = '<p><i>Connectez-vous pour voir le kit.</i></p>'; break; case 'search-view': /* if (chatHistory.length === 0) displayWelcomeMessage(); */ break; } } catch (error) { console.error(`Erreur rechargement ${viewId}:`, error); showGenericError(`Erreur chargement ${viewId}. Détails: ${error.message}`); } }
    function showGenericError(message) { if (genericFeedbackDiv) { genericFeedbackDiv.textContent = `Erreur: ${message}`; genericFeedbackDiv.className = 'feedback-area error'; genericFeedbackDiv.style.display = 'block'; } else { console.error("Erreur (genericFeedbackDiv manquant):", message); const activeFeedback = document.querySelector('.feedback-area:not(#login-error)'); if (activeFeedback) { activeFeedback.textContent = `Erreur: ${message}`; activeFeedback.className = 'feedback-area error'; activeFeedback.style.display = 'block'; } else { alert(`Erreur: ${message}`); } } }
    function clearProtectedViewData() { if(logTableBody) logTableBody.innerHTML = ''; if(logNoResults) logNoResults.style.display = 'none'; if(logPrevPageButton) logPrevPageButton.disabled = true; if(logNextPageButton) logNextPageButton.disabled = true; if(logPageInfo) logPageInfo.textContent = 'Page 1 / 1'; currentLogPage = 1; if(categoryList) categoryList.innerHTML = ''; if(categoryForm) categoryForm.reset(); resetCategoryForm(); if(stockForm) stockForm.reset(); resetStockForm(); if(adminFeedbackDiv) { adminFeedbackDiv.style.display = 'none'; adminFeedbackDiv.textContent = ''; } if(exportFeedbackDiv) { exportFeedbackDiv.style.display = 'none'; exportFeedbackDiv.textContent = ''; } if(importFeedbackDiv) { importFeedbackDiv.style.display = 'none'; importFeedbackDiv.textContent = ''; } resetImportState(); if (auditCategoryFilter) { auditCategoryFilter.innerHTML = '<option value="all">Toutes</option>'; auditCategoryFilter.value = 'all'; } if (auditDrawerFilter) auditDrawerFilter.value = ''; if (auditTableBody) auditTableBody.innerHTML = ''; if (auditNoResults) auditNoResults.style.display = 'none'; if (auditFeedbackDiv) { auditFeedbackDiv.style.display = 'none'; auditFeedbackDiv.textContent = ''; auditFeedbackDiv.className = 'feedback-area';} if(currentKitDrawersDiv) currentKitDrawersDiv.innerHTML = '<p><i>Kit vidé ou non disponible.</i></p>'; if (kitFeedbackDiv) { kitFeedbackDiv.style.display = 'none'; kitFeedbackDiv.textContent = ''; kitFeedbackDiv.className = 'feedback-area'; } console.log("Données des vues protégées effacées."); }
    async function setActiveView(viewToShow, buttonToActivate){ if (!viewToShow || !viewSections.length || ![...viewSections].includes(viewToShow)) { console.warn("setActiveView: Vue invalide demandée, retour à la recherche."); viewToShow = searchView; buttonToActivate = searchTabButton; } if (viewToShow.classList.contains('active-view')) { console.log(`Vue ${viewToShow.id} déjà active.`); return; } const canAccessSettings = currentUser && currentUserCode === 'zine'; const isSettingsView = viewToShow === settingsView; const isProtectedViewId = ['log-view', 'admin-view', 'audit-view', 'bom-view', 'settings-view'].includes(viewToShow.id); if (isProtectedViewId && !currentUser) { console.warn(`Accès refusé: La vue "${viewToShow.id}" nécessite une connexion.`); if (loginError) { loginError.textContent = "Connexion requise pour accéder à cette section."; loginError.style.color = 'var(--error-color)'; loginError.style.display = 'block'; } loginCodeInput?.focus(); return; } if (isSettingsView && !canAccessSettings) { console.warn(`Accès refusé: La vue Paramètres est réservée à 'zine'. User: ${currentUserCode}`); showGenericError("Accès à la vue Paramètres réservé à l'administrateur."); return; } viewSections.forEach(section => { section.style.display = 'none'; section.classList.remove('active-view'); }); document.querySelectorAll('.nav-button').forEach(button => { button.classList.remove('active'); }); viewToShow.style.display = 'block'; viewToShow.classList.add('active-view'); if (buttonToActivate) { buttonToActivate.classList.add('active'); } else { const matchingButton = document.getElementById(`show-${viewToShow.id}`); if (matchingButton) matchingButton.classList.add('active'); } console.log(`Activation vue: ${viewToShow.id}`); await reloadActiveViewData(viewToShow); }

    // --- LOGIQUE INVENTAIRE (inchangée) ---
    // ... (updateAttributeFiltersUI, getUniqueAttributeValues, populateInventoryFilters, displayInventory) ...
    async function updateAttributeFiltersUI() { if (!attributeFiltersContainer || !inventoryCategoryFilter) return; const selectedCategoryId = inventoryCategoryFilter.value; attributeFiltersContainer.innerHTML = ''; console.log("--- updateAttributeFiltersUI ---"); console.log("Selected Category ID:", selectedCategoryId); if (selectedCategoryId === 'all' || categoriesCache.length === 0) { attributeFiltersContainer.innerHTML = '<i>Sélectionnez une catégorie pour voir les filtres spécifiques.</i>'; return; } const category = categoriesCache.find(cat => String(cat.id) == String(selectedCategoryId)); console.log("Found Category Object:", category); if (!category || !category.attributes || !Array.isArray(category.attributes) || category.attributes.length === 0) { attributeFiltersContainer.innerHTML = '<i>Aucun attribut spécifique défini pour cette catégorie.</i>'; return; } console.log("Category Attributes to process:", category.attributes); try { const attributes = category.attributes; attributeFiltersContainer.innerHTML = '<i>Chargement des filtres...</i>'; let filtersAdded = 0; for (const attr of attributes) { if (!attr || typeof attr !== 'string' || attr.trim() === '') continue; console.log(`Processing Attribute: "${attr}"`); try { console.log(`Calling getUniqueAttributeValues for category ${selectedCategoryId} and attribute "${attr}"...`); const uniqueValues = await getUniqueAttributeValues(String(selectedCategoryId), attr); console.log(`Result for "${attr}":`, uniqueValues); if (uniqueValues && uniqueValues.length > 0) { const lowerCaseValues = uniqueValues.map(val => String(val).toLowerCase()); const uniqueLowerCaseValues = [...new Set(lowerCaseValues)]; if (uniqueLowerCaseValues.length > 0) { if (filtersAdded === 0) { attributeFiltersContainer.innerHTML = ''; } filtersAdded++; const formGroup = document.createElement('div'); formGroup.className = 'form-group'; const label = document.createElement('label'); label.htmlFor = `attr-filter-${attr}`; label.textContent = `${attr}:`; label.title = attr; const select = document.createElement('select'); select.id = `attr-filter-${attr}`; select.dataset.attributeName = attr; const allOption = document.createElement('option'); allOption.value = 'all'; allOption.textContent = 'Tous'; select.appendChild(allOption); uniqueLowerCaseValues.sort().forEach(value => { const option = document.createElement('option'); option.value = value; option.textContent = value; select.appendChild(option); }); formGroup.appendChild(label); formGroup.appendChild(select); attributeFiltersContainer.appendChild(formGroup); console.log(`   -> Filter dropdown for "${attr}" added to DOM (options: ${uniqueLowerCaseValues.length}).`); } else { console.log(`   -> No unique values after case-insensitive deduplication for "${attr}".`); } } else { console.log(`   -> No unique values found or returned for "${attr}".`); } } catch (rpcError) { console.error(`   -> Error calling RPC for attribute "${attr}":`, rpcError); } } if (filtersAdded === 0) { if(attributeFiltersContainer.innerHTML === '<i>Chargement des filtres...</i>' || attributeFiltersContainer.innerHTML === ''){ attributeFiltersContainer.innerHTML = '<i>Aucun filtre applicable basé sur les données actuelles.</i>'; } console.log("Finished loop, no filters were added."); } else { console.log(`Finished loop, ${filtersAdded} filters were added.`); } } catch (error) { console.error(`Error during attribute filter creation for ${category?.name}:`, error); attributeFiltersContainer.innerHTML = `<i style="color: var(--error-color);">Erreur chargement filtres.</i>`; } console.log("--- updateAttributeFiltersUI END ---"); }
    async function getUniqueAttributeValues(categoryId, attributeName) { if (!supabase || !categoryId || !attributeName) return []; try { console.log(`RPC call: get_unique_attribute_values for category (string UUID) ${categoryId}, attribute '${attributeName}'`); const { data, error } = await supabase.rpc('get_unique_attribute_values', { category_id_param: categoryId, attribute_key_param: attributeName }); if (error) { console.error(`Erreur RPC get_unique_attribute_values pour '${attributeName}': ${error.message || error.details || JSON.stringify(error)}`); return []; } console.log(`RPC result for '${attributeName}':`, data); const resultData = data && Array.isArray(data) ? data : []; return resultData.filter(val => val !== null && val !== undefined); } catch (err) { console.error(`Erreur JS récupération valeurs uniques pour ${attributeName}:`, err); return []; } }
    async function populateInventoryFilters() { if (!inventoryCategoryFilter) return; try { const currentCategoryValue = inventoryCategoryFilter.value; inventoryCategoryFilter.innerHTML = '<option value="all">Toutes</option>'; if (categoriesCache.length === 0 && currentUser) await getCategories(); categoriesCache.sort((a, b) => a.name.localeCompare(b.name)).forEach(cat => { const option = document.createElement('option'); option.value = cat.id; option.textContent = escapeHtml(cat.name); inventoryCategoryFilter.appendChild(option); }); if (categoriesCache.some(cat => String(cat.id) === String(currentCategoryValue))) { inventoryCategoryFilter.value = currentCategoryValue; } else { inventoryCategoryFilter.value = 'all'; } await updateAttributeFiltersUI(); } catch (err) { console.error("Erreur population filtres inventaire:", err); if (inventoryCategoryFilter) inventoryCategoryFilter.innerHTML = '<option value="all" disabled>Erreur chargement</option>'; if (attributeFiltersContainer) attributeFiltersContainer.innerHTML = '<i style="color: var(--error-color);">Erreur chargement catégories.</i>'; } }
    async function displayInventory(page = 1) { currentInventoryPage = page; if (!inventoryTableBody || !supabase || !attributeFiltersContainer) { console.warn("displayInventory: Prérequis manquants (DOM, Supabase)."); if(inventoryTableBody) inventoryTableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">Erreur interne ou DOM manquant.</td></tr>`; return; } inventoryTableBody.innerHTML = `<tr class="loading-row"><td colspan="8" style="text-align:center;"><i>Chargement...</i></td></tr>`; if(inventoryNoResults) inventoryNoResults.style.display = 'none'; if(inventoryPrevPageButton) inventoryPrevPageButton.disabled = true; if(inventoryNextPageButton) inventoryNextPageButton.disabled = true; if(inventoryPageInfo) inventoryPageInfo.textContent = 'Chargement...'; try { const categoryValue = inventoryCategoryFilter?.value || 'all'; const categoryIdToSend = categoryValue === 'all' ? null : categoryValue; const searchValue = inventorySearchFilter?.value.trim() || ''; const searchTermToSend = searchValue || null; const attributeFiltersToSend = {}; attributeFiltersContainer.querySelectorAll('select').forEach(selectElement => { const attributeName = selectElement.dataset.attributeName; const selectedValue = selectElement.value; if (attributeName && selectedValue !== 'all') { attributeFiltersToSend[attributeName] = selectedValue; } }); const finalAttributeFilters = Object.keys(attributeFiltersToSend).length > 0 ? attributeFiltersToSend : null; console.log("Calling RPC search_inventory with params:", { p_category_id: categoryIdToSend, p_search_term: searchTermToSend, p_attribute_filters: finalAttributeFilters, p_page: currentInventoryPage, p_items_per_page: ITEMS_PER_PAGE }); const { data, error } = await supabase.rpc('search_inventory', { p_category_id: categoryIdToSend, p_search_term: searchTermToSend, p_attribute_filters: finalAttributeFilters, p_page: currentInventoryPage, p_items_per_page: ITEMS_PER_PAGE }); inventoryTableBody.innerHTML = ''; if (error) { throw new Error(`Erreur RPC search_inventory: ${error.message} (Code: ${error.code}, Details: ${error.details})`); } const totalItems = (data && data.length > 0) ? data[0].total_count : 0; const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE); console.log(`RPC returned ${data?.length || 0} items for page ${currentInventoryPage}. Total items matching filters: ${totalItems}`); if (totalItems === 0) { if(inventoryNoResults) { inventoryNoResults.textContent = `Aucun composant trouvé pour les filtres sélectionnés.`; inventoryTableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 20px;">${inventoryNoResults.textContent}</td></tr>`; inventoryNoResults.style.display = 'none'; } if(inventoryPageInfo) inventoryPageInfo.textContent = 'Page 0 / 0'; if(inventoryPrevPageButton) inventoryPrevPageButton.disabled = true; if(inventoryNextPageButton) inventoryNextPageButton.disabled = true; } else { if(inventoryNoResults) inventoryNoResults.style.display = 'none'; data.forEach(item => { const row = inventoryTableBody.insertRow(); row.dataset.ref = item.ref; row.dataset.itemData = JSON.stringify(item); row.classList.add('inventory-item-row'); const isSelected = currentUser && currentKitSelection.some(kitItem => kitItem.ref === item.ref); if (isSelected) { row.classList.add('kit-selected'); } const drawerKey = item.drawer; const isCollected = drawerKey && collectedDrawersSet.has(drawerKey); if (isCollected) { row.classList.add('drawer-collected-in-bom'); } const selectCell = row.insertCell(); selectCell.classList.add('col-select'); if (currentUser && item.quantity > 0) { const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.classList.add('kit-select-checkbox'); checkbox.dataset.ref = item.ref; checkbox.title = `Ajouter/Retirer ${item.ref} au kit`; checkbox.checked = isSelected; checkbox.disabled = isCollected; selectCell.appendChild(checkbox); } else if (currentUser && item.quantity <= 0) { selectCell.innerHTML = '<span title="Stock épuisé" style="cursor:default; color: var(--text-muted); font-size:0.8em;">N/A</span>'; } else { selectCell.innerHTML = '&nbsp;'; } const refCell = row.insertCell(); const status = getStockStatus(item.quantity, item.critical_threshold); const indicatorSpan = document.createElement('span'); indicatorSpan.classList.add('stock-indicator', `level-${status}`); indicatorSpan.title = `Stock: ${status.toUpperCase()} (Qté: ${item.quantity}, Seuil: ${item.critical_threshold ?? 'N/A'})`; refCell.appendChild(indicatorSpan); refCell.appendChild(document.createTextNode(" " + (item.ref || 'N/A'))); row.insertCell().textContent = item.description || '-'; row.insertCell().textContent = item.category_name || 'N/A'; const typeAttribute = item.attributes?.Type || '-'; row.insertCell().textContent = typeAttribute; const drawerCell = row.insertCell(); drawerCell.textContent = item.drawer || '-'; drawerCell.style.textAlign = 'center'; const qtyCell = row.insertCell(); qtyCell.textContent = item.quantity ?? 0; qtyCell.style.textAlign = 'center'; const dsCell = row.insertCell(); dsCell.style.textAlign = 'center'; if (item.datasheet) { try { new URL(item.datasheet); const link = document.createElement('a'); link.href = item.datasheet; link.textContent = 'Voir'; link.target = '_blank'; link.rel = 'noopener noreferrer'; dsCell.appendChild(link); } catch (_) { dsCell.textContent = '-'; } } else { dsCell.textContent = '-'; } }); currentInventoryPage = Math.max(1, Math.min(currentInventoryPage, totalPages || 1)); if(inventoryPageInfo) inventoryPageInfo.textContent = `Page ${currentInventoryPage} / ${totalPages || 1}`; if(inventoryPrevPageButton) inventoryPrevPageButton.disabled = currentInventoryPage === 1; if(inventoryNextPageButton) inventoryNextPageButton.disabled = currentInventoryPage >= totalPages; } } catch (err) { console.error("Erreur affichage inventaire:", err); inventoryTableBody.innerHTML = `<tr><td colspan="8" class="error-message" style="text-align:center; color: var(--error-color);">Erreur chargement: ${err.message}</td></tr>`; if(inventoryPageInfo) inventoryPageInfo.textContent = 'Erreur'; if(inventoryNoResults) { inventoryNoResults.textContent = `Erreur chargement inventaire: ${err.message}`; inventoryNoResults.style.display = 'block'; } if(inventoryPrevPageButton) inventoryPrevPageButton.disabled = true; if(inventoryNextPageButton) inventoryNextPageButton.disabled = true; } }

    // --- LOGIQUE HISTORIQUE (inchangée) ---
    // ... (displayLog, formatLogTimestamp) ...
    async function displayLog(page = 1) { currentLogPage = page; if (!logTableBody || !supabase || !currentUser) { if(logTableBody) logTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">${currentUser ? 'Erreur interne ou DOM.' : 'Connexion requise.'}</td></tr>`; console.warn("displayLog: Prérequis manquants (DOM, Supabase ou User)."); return; } logTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;"><i>Chargement...</i></td></tr>`; if(logNoResults) logNoResults.style.display = 'none'; if(logPrevPageButton) logPrevPageButton.disabled = true; if(logNextPageButton) logNextPageButton.disabled = true; if(logPageInfo) logPageInfo.textContent = 'Chargement...'; const itemsPerPage = ITEMS_PER_PAGE; const startIndex = (currentLogPage - 1) * itemsPerPage; const endIndex = startIndex + itemsPerPage - 1; try { console.log(`Fetching log data for page ${currentLogPage} (Range: ${startIndex}-${endIndex})`); let query = supabase.from('log').select('created_at, user_code, action, item_ref, quantity_change, final_quantity', { count: 'exact' }).order('created_at', { ascending: false }).range(startIndex, endIndex); const { data, error, count } = await query; console.log(`Log query returned. Error: ${error ? error.message : 'null'}, Count: ${count}`); logTableBody.innerHTML = ''; if (error) { throw new Error(`Erreur DB log: ${error.message}`); } const totalItems = count || 0; const totalPages = Math.ceil(totalItems / itemsPerPage); if (totalItems === 0) { if(logNoResults) { logNoResults.textContent = "L'historique est vide."; logTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px;">${logNoResults.textContent}</td></tr>`; logNoResults.style.display = 'none'; } if(logPageInfo) logPageInfo.textContent = 'Page 0 / 0'; if(logPrevPageButton) logPrevPageButton.disabled = true; if(logNextPageButton) logNextPageButton.disabled = true; console.log("Log is empty."); } else { if(logNoResults) logNoResults.style.display = 'none'; console.log(`Displaying ${data.length} log entries.`); data.forEach(entry => { const row = logTableBody.insertRow(); row.insertCell().textContent = formatLogTimestamp(entry.created_at); row.insertCell().textContent = entry.user_code ? entry.user_code.toUpperCase() : 'Système'; row.insertCell().textContent = entry.action || 'Inconnue'; row.insertCell().textContent = entry.item_ref || 'N/A'; const changeCell = row.insertCell(); const change = entry.quantity_change ?? 0; changeCell.textContent = change > 0 ? `+${change}` : (change < 0 ? `${change}` : '0'); changeCell.classList.add(change > 0 ? 'positive' : (change < 0 ? 'negative' : '')); changeCell.style.textAlign = 'center'; const finalQtyCell = row.insertCell(); finalQtyCell.textContent = entry.final_quantity ?? 'N/A'; finalQtyCell.style.textAlign = 'center'; }); currentLogPage = Math.max(1, Math.min(currentLogPage, totalPages || 1)); if(logPageInfo) logPageInfo.textContent = `Page ${currentLogPage} / ${totalPages || 1}`; if(logPrevPageButton) logPrevPageButton.disabled = currentLogPage === 1; if(logNextPageButton) logNextPageButton.disabled = currentLogPage >= totalPages; } } catch (err) { console.error("Erreur displayLog:", err); const errorMsg = `Erreur chargement historique: ${err.message}`; logTableBody.innerHTML = `<tr><td colspan="6" class="error-message" style="text-align:center; color: var(--error-color);">${errorMsg}</td></tr>`; if(logPageInfo) logPageInfo.textContent = 'Erreur'; if(logNoResults) { logNoResults.textContent = errorMsg; logNoResults.style.display = 'block'; } if(logPrevPageButton) logPrevPageButton.disabled = true; if(logNextPageButton) logNextPageButton.disabled = true; } }
    function formatLogTimestamp(dateString) { if (!dateString) return 'Date inconnue'; try { const date = new Date(dateString); if (isNaN(date.getTime())) return 'Date invalide'; const year = date.getFullYear(); const month = (date.getMonth() + 1).toString().padStart(2, '0'); const day = date.getDate().toString().padStart(2, '0'); const hours = date.getHours().toString().padStart(2, '0'); const minutes = date.getMinutes().toString().padStart(2, '0'); const seconds = date.getSeconds().toString().padStart(2, '0'); return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`; } catch (e) { console.warn("Erreur formatage date:", e); return dateString; } }

    // --- VUE ADMIN ---
    // ... (fonctions getCategories, invalidateCategoriesCache, loadAdminData, loadCategoriesAdmin, addCategoryEventListeners, resetCategoryForm, populateComponentCategorySelectAdmin, renderSpecificAttributes, addComponentCategorySelectListener, showAdminFeedback, resetStockForm INCHANGÉES) ...

    // getCategories: Vérification que la logique de parsing des attributs est correcte (aucune modif fonctionnelle)
    async function getCategories() {
        if (!supabase) { console.error("getCategories: Supabase non initialisé."); return []; }
        console.log("Récupération catégories...");
        try {
            const { data, error } = await supabase.from('categories').select('id, name, attributes').order('name', { ascending: true });
            if (error) throw new Error(`Erreur DB catégories: ${error.message}`);

            categoriesCache = (data || []).map(cat => {
                let finalAttributes = []; // Initialiser comme tableau vide
                if (cat.attributes) {
                    if (Array.isArray(cat.attributes)) {
                        finalAttributes = cat.attributes;
                    } else if (typeof cat.attributes === 'string') {
                        const trimmedAttrs = cat.attributes.trim();
                        if (trimmedAttrs.startsWith('[') && trimmedAttrs.endsWith(']')) {
                            try {
                                const parsed = JSON.parse(trimmedAttrs);
                                if (Array.isArray(parsed)) {
                                    finalAttributes = parsed;
                                } else {
                                    console.warn(`Attributs catégorie ${cat.name} (ID: ${cat.id}): String JSON parsé mais n'est pas un tableau:`, cat.attributes);
                                    finalAttributes = []; // Échec -> tableau vide
                                }
                            } catch (e) {
                                console.warn(`Attributs catégorie ${cat.name} (ID: ${cat.id}): Échec parsing JSON (fallback vers split):`, cat.attributes, e.message);
                                finalAttributes = trimmedAttrs.split(',').map(s => s.trim()).filter(Boolean);
                            }
                        } else {
                            finalAttributes = trimmedAttrs.split(',').map(s => s.trim()).filter(Boolean);
                        }
                    } else {
                        console.warn(`Attributs catégorie ${cat.name} (ID: ${cat.id}): Format inattendu:`, cat.attributes);
                        finalAttributes = [];
                    }
                } else {
                    finalAttributes = [];
                }
                cat.attributes = finalAttributes.map(attr => String(attr).trim()).filter(Boolean);
                cat.id = String(cat.id); // Assurer ID comme string
                return cat;
            });

            // console.log("Catégories récupérées et formatées:", categoriesCache.length); // Log commenté
            return categoriesCache;
        } catch (err) {
            console.error("Erreur récupération catégories:", err);
            categoriesCache = []; // Vider le cache en cas d'erreur majeure
            showAdminFeedback("Erreur chargement catégories.", 'error');
            return []; // Retourner tableau vide
        }
    }
    function invalidateCategoriesCache() { console.log("Cache catégories invalidé."); categoriesCache = []; [inventoryCategoryFilter, componentCategorySelectAdmin, auditCategoryFilter].forEach(select => { if (select) { const currentValue = select.value; select.innerHTML = '<option value="">Chargement...</option>'; if (select === inventoryCategoryFilter || select === auditCategoryFilter) { select.innerHTML = '<option value="all">Toutes</option>' + select.innerHTML; select.value = (currentValue === 'all') ? 'all' : ''; } } }); if(attributeFiltersContainer) attributeFiltersContainer.innerHTML = ''; if(specificAttributesDiv) specificAttributesDiv.style.display = 'none'; }
    async function loadAdminData() { if (!adminView.classList.contains('active-view') || !currentUser) return; console.log("Chargement données Admin..."); showAdminFeedback("Chargement...", 'info'); resetStockForm(); resetCategoryForm(); try { if (categoriesCache.length === 0) await getCategories(); await loadCategoriesAdmin(); await populateComponentCategorySelectAdmin(); showAdminFeedback("", 'info', true); } catch (err) { console.error("Erreur chargement admin:", err); showAdminFeedback(`Erreur chargement admin: ${err.message}`, 'error'); } }
    async function loadCategoriesAdmin() { if (!categoryList) return; categoryList.innerHTML = '<li><i>Chargement...</i></li>'; try { if (categoriesCache.length === 0 && currentUser) { await getCategories(); } categoryList.innerHTML = ''; if (categoriesCache.length === 0) { categoryList.innerHTML = '<li>Aucune catégorie définie.</li>'; return; } categoriesCache.forEach(cat => { const li = document.createElement('li'); li.dataset.categoryId = cat.id; const nameSpan = document.createElement('span'); nameSpan.textContent = cat.name; li.appendChild(nameSpan); const actionsSpan = document.createElement('span'); actionsSpan.classList.add('category-actions'); const editButton = document.createElement('button'); editButton.textContent = 'Modifier'; editButton.classList.add('edit-cat', 'action-button', 'secondary'); editButton.dataset.categoryId = cat.id; editButton.addEventListener('click', () => { if (!categoryFormTitle || !categoryIdEditInput || !categoryNameInput || !categoryAttributesInput || !cancelEditButton) return; categoryFormTitle.textContent = `Modifier la catégorie: ${cat.name}`; categoryIdEditInput.value = cat.id; categoryNameInput.value = cat.name; const attributesString = Array.isArray(cat.attributes) ? cat.attributes.join(', ') : ''; categoryAttributesInput.value = attributesString; cancelEditButton.style.display = 'inline-block'; categoryForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); categoryNameInput.focus(); }); actionsSpan.appendChild(editButton); const deleteButton = document.createElement('button'); deleteButton.textContent = 'Suppr.'; deleteButton.classList.add('delete-cat', 'action-button', 'danger'); deleteButton.dataset.categoryId = cat.id; deleteButton.addEventListener('click', async () => { if (!confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${cat.name}" ?\nCeci mettra la catégorie à 'NULL' pour tous les composants associés.`)) return; showAdminFeedback(`Suppression de "${cat.name}"...`, 'info'); deleteButton.disabled = true; editButton.disabled = true; try { console.log(`Mise à jour des composants associés à la catégorie ${cat.id} avant suppression...`); const { error: updateError } = await supabase.from('inventory').update({ category_id: null }).eq('category_id', cat.id); if (updateError && updateError.code !== 'PGRST116') { console.warn(`Erreur (non bloquante) lors de la mise à jour des composants associés: ${updateError.message}`); } else if (updateError?.code === 'PGRST116') { console.log(`Aucun composant trouvé pour la catégorie ${cat.id}, mise à jour non nécessaire.`); } else { console.log(`Composants associés à ${cat.id} mis à jour (category_id = NULL).`); } console.log(`Suppression de la catégorie ${cat.id} (${cat.name})...`); const { error: deleteError } = await supabase.from('categories').delete().eq('id', cat.id); if (deleteError) { if (deleteError.message.includes('foreign key constraint')) { throw new Error(`Impossible de supprimer : des composants sont toujours associés (échec de la mise à jour précédente?). Détails DB: ${deleteError.message}`); } throw new Error(`Erreur lors de la suppression dans la base de données: ${deleteError.message}`); } showAdminFeedback(`Catégorie "${cat.name}" supprimée avec succès.`, 'success'); invalidateCategoriesCache(); await loadAdminData(); if (inventoryView.classList.contains('active-view')) await populateInventoryFilters(); if (auditView.classList.contains('active-view')) await populateAuditFilters(); } catch (err) { console.error("Erreur lors de la suppression de la catégorie:", err); showAdminFeedback(`Erreur lors de la suppression de ${cat.name}: ${err.message}`, 'error'); deleteButton.disabled = false; editButton.disabled = false; } }); actionsSpan.appendChild(deleteButton); li.appendChild(actionsSpan); categoryList.appendChild(li); }); } catch (err) { console.error("Erreur chargement catégories admin:", err); categoryList.innerHTML = `<li style="color: var(--error-color);">Erreur lors du chargement des catégories.</li>`; showAdminFeedback(`Erreur chargement catégories: ${err.message}`, 'error'); } }
    function addCategoryEventListeners() { categoryForm?.addEventListener('submit', async (event) => { event.preventDefault(); if (!categoryNameInput || !categoryAttributesInput || !categoryIdEditInput || !currentUser) { showAdminFeedback("Erreur interne ou connexion requise.", 'error'); return; } const name = categoryNameInput.value.trim(); const attributesRaw = categoryAttributesInput.value.trim(); const attributesSet = new Set(attributesRaw ? attributesRaw.split(',').map(attr => attr.trim()).filter(Boolean) : []); const attributes = [...attributesSet]; const id = categoryIdEditInput.value; const isEditing = !!id; if (!name) { showAdminFeedback("Le nom de la catégorie est requis.", 'error'); categoryNameInput.focus(); return; } showAdminFeedback(`Enregistrement de "${name}"...`, 'info'); const saveButton = categoryForm.querySelector('button[type="submit"]'); if(saveButton) saveButton.disabled = true; if(cancelEditButton) cancelEditButton.disabled = true; try { let result; const categoryData = { name, attributes }; if (isEditing) { result = await supabase.from('categories').update(categoryData).eq('id', id).select().single(); } else { result = await supabase.from('categories').insert(categoryData).select().single(); } const { data: savedData, error } = result; if (error) { if (error.code === '23505') { throw new Error(`Le nom de catégorie "${name}" existe déjà.`); } else { throw new Error(`Erreur base de données: ${error.message} (Code: ${error.code})`); } } showAdminFeedback(`Catégorie "${savedData.name}" ${isEditing ? 'mise à jour' : 'ajoutée'} avec succès.`, 'success'); invalidateCategoriesCache(); resetCategoryForm(); await loadAdminData(); if(inventoryView.classList.contains('active-view')) await populateInventoryFilters(); if(auditView.classList.contains('active-view')) await populateAuditFilters(); } catch (err) { console.error("Erreur lors de l'enregistrement de la catégorie:", err); showAdminFeedback(`Erreur: ${err.message}`, 'error'); } finally { if(saveButton) saveButton.disabled = false; if(cancelEditButton) { cancelEditButton.disabled = !isEditing; if (!isEditing) cancelEditButton.style.display = 'none'; } } }); cancelEditButton?.addEventListener('click', resetCategoryForm); }
    function resetCategoryForm(){ if (!categoryForm) return; categoryForm.reset(); if(categoryIdEditInput) categoryIdEditInput.value = ''; if(categoryFormTitle) categoryFormTitle.textContent = 'Ajouter une Catégorie'; if(cancelEditButton) cancelEditButton.style.display = 'none'; if (adminFeedbackDiv && !adminFeedbackDiv.classList.contains('error')) { showAdminFeedback('', 'info', true); } }
    async function populateComponentCategorySelectAdmin() { if (!componentCategorySelectAdmin) return; const currentVal = componentCategorySelectAdmin.value; componentCategorySelectAdmin.innerHTML = '<option value="">-- Sélectionner une catégorie --</option>'; try { if (categoriesCache.length === 0 && currentUser) await getCategories(); categoriesCache.forEach(cat => { const option = document.createElement('option'); option.value = cat.id; option.textContent = escapeHtml(cat.name); componentCategorySelectAdmin.appendChild(option); }); if (categoriesCache.some(c => String(c.id) === String(currentVal))) { componentCategorySelectAdmin.value = currentVal; } else { componentCategorySelectAdmin.value = ""; if (specificAttributesDiv) specificAttributesDiv.style.display = 'none'; } } catch (err) { console.error("Erreur lors du remplissage du select catégorie admin:", err); componentCategorySelectAdmin.innerHTML = '<option value="" disabled>Erreur chargement</option>'; } }
    function renderSpecificAttributes(attributesArray, categoryName, existingValues = {}) {
        if (!specificAttributesDiv || !Array.isArray(attributesArray)) {
            if (specificAttributesDiv) {
                specificAttributesDiv.innerHTML = '';
                specificAttributesDiv.style.display = 'none';
            }
            console.log("Pas d'attributs à afficher pour", categoryName);
            return;
        }
        // console.log(`Rendu des attributs spécifiques pour ${categoryName}:`, attributesArray, "Valeurs existantes:", existingValues); // Log commenté (utile pour débogage)
        specificAttributesDiv.innerHTML = `<h4>Attributs Spécifiques (${escapeHtml(categoryName)})</h4>`;
        if (attributesArray.length === 0) {
            specificAttributesDiv.innerHTML += '<p><i>Aucun attribut spécifique défini pour cette catégorie.</i></p>';
        } else {
            attributesArray.forEach(attrName => {
                if (!attrName || typeof attrName !== 'string' || attrName.trim() === '') return;
                const cleanAttrName = attrName.trim();
                const formGroup = document.createElement('div');
                formGroup.classList.add('form-group');
                const label = document.createElement('label');
                const inputId = `attr-${cleanAttrName.replace(/[^a-zA-Z0-9-_]/g, '-')}`;
                label.htmlFor = inputId;
                label.textContent = `${cleanAttrName}:`;
                const input = document.createElement('input');
                input.type = 'text';
                input.id = inputId;
                input.name = `attribute_${cleanAttrName}`;
                input.dataset.attributeName = cleanAttrName;
                input.placeholder = `Valeur pour ${cleanAttrName}`;

                // Cette partie peuple la valeur si elle existe dans existingValues
                if (existingValues && existingValues.hasOwnProperty(cleanAttrName)) {
                    const value = existingValues[cleanAttrName];
                    input.value = (value !== null && value !== undefined) ? String(value) : '';
                    // console.log(`   -> Attribut '${cleanAttrName}': Trouvé dans existingValues, valeur mise à '${input.value}'`); // Log commenté
                } else {
                    // console.log(`   -> Attribut '${cleanAttrName}': Non trouvé dans existingValues.`); // Log commenté
                }

                formGroup.appendChild(label);
                formGroup.appendChild(input);
                specificAttributesDiv.appendChild(formGroup);
            });
        }
        specificAttributesDiv.style.display = 'block';
    }
    function addComponentCategorySelectListener() { componentCategorySelectAdmin?.addEventListener('change', () => { const categoryId = componentCategorySelectAdmin.value; const existingAttributes = {}; if (!categoryId) { if (specificAttributesDiv) specificAttributesDiv.style.display = 'none'; return; } const category = categoriesCache.find(cat => String(cat.id) === String(categoryId)); if (category && Array.isArray(category.attributes)) { renderSpecificAttributes(category.attributes, category.name, existingAttributes); } else { if (specificAttributesDiv) specificAttributesDiv.style.display = 'none'; if (category && !Array.isArray(category.attributes)) { console.warn("Format des attributs invalide pour la catégorie:", categoryId, category.attributes); } else if (!category) { console.warn("Catégorie sélectionnée non trouvée dans le cache:", categoryId); } } }); }
    function showAdminFeedback(message, type = 'info', instantHide = false){ if(!adminFeedbackDiv) { console.log(`Admin Feedback (${type}): ${message}`); return; } adminFeedbackDiv.textContent = message; adminFeedbackDiv.className = `feedback-area ${type}`; adminFeedbackDiv.style.display = message ? 'block' : 'none'; if (type !== 'error') { const delay = instantHide ? 0 : (type === 'info' ? 2500 : 4000); setTimeout(() => { if (adminFeedbackDiv.textContent === message) { adminFeedbackDiv.style.display = 'none'; } }, delay); } }
    function resetStockForm() { if (!stockForm) return; stockForm.reset(); if(componentRefAdminInput) { componentRefAdminInput.disabled = false; componentRefAdminInput.value = ''; } if(checkStockButton) checkStockButton.disabled = false; if(componentActionsWrapper) componentActionsWrapper.style.display = 'none'; if(componentDetails) componentDetails.style.display = 'block'; const refDisplay = document.getElementById('component-ref-display'); if (refDisplay) refDisplay.textContent = 'N/A'; if(currentQuantitySpan) currentQuantitySpan.textContent = 'N/A'; if(quantityChangeInput) quantityChangeInput.value = '0'; if(updateQuantityButton) updateQuantityButton.disabled = true; if(deleteComponentButton) { deleteComponentButton.style.display = 'none'; deleteComponentButton.disabled = true; } if(specificAttributesDiv) { specificAttributesDiv.innerHTML = ''; specificAttributesDiv.style.display = 'none'; } if(saveComponentButton) { saveComponentButton.disabled = false; saveComponentButton.textContent = 'Enregistrer Nouveau Composant'; } if (exportQrButton) { exportQrButton.style.display = 'none'; exportQrButton.disabled = true; }
        if (adminFeedbackDiv && !adminFeedbackDiv.classList.contains('error')) { showAdminFeedback('', 'info', true); } componentRefAdminInput?.focus(); }

    // addStockEventListeners: Ajout de logs (commentés) pour vérifier item.attributes
    function addStockEventListeners() {
        checkStockButton?.addEventListener('click', async () => {
            const ref = componentRefAdminInput?.value.trim().toUpperCase();
            if (!ref) { showAdminFeedback("Veuillez entrer une référence composant.", 'error'); componentRefAdminInput.focus(); return; }
            showAdminFeedback(`Vérification de la référence "${ref}"...`, 'info');
            componentRefAdminInput.disabled = true; checkStockButton.disabled = true;
            componentActionsWrapper.style.display = 'none'; componentDetails.style.display = 'block';
            saveComponentButton.disabled = true;
            if (exportQrButton) { exportQrButton.style.display = 'none'; exportQrButton.disabled = true; }
            try {
                const item = await getStockInfoFromSupabase(ref);
                if (item) {
                    showAdminFeedback(`Composant "${ref}" trouvé. Mode édition.`, 'info', true);
                    componentActionsWrapper.style.display = 'block';
                    const refDisplay = document.getElementById('component-ref-display');
                    if (refDisplay) refDisplay.textContent = ref;
                    currentQuantitySpan.textContent = item.quantity;
                    quantityChangeInput.value = 0; updateQuantityButton.disabled = false;
                    deleteComponentButton.style.display = 'inline-block'; deleteComponentButton.disabled = false;
                    componentCategorySelectAdmin.value = item.category_id || "";
                    componentDescInput.value = item.description || ""; componentMfgInput.value = item.manufacturer || "";
                    componentDatasheetInput.value = item.datasheet || ""; componentDrawerAdminInput.value = item.drawer || "";
                    componentInitialQuantityInput.value = item.quantity; componentThresholdInput.value = item.critical_threshold ?? "";

                    // --- Vérification des attributs récupérés (Logs commentés pour débogage) ---
                    // console.log("----- Vérification Attributs Chargement -----");
                    // console.log("Item complet reçu de Supabase:", JSON.stringify(item, null, 2));
                    // console.log("Type de item.attributes:", typeof item.attributes);
                    // console.log("Valeur de item.attributes:", item.attributes);
                    // -----------------------------------------------

                    const category = categoriesCache.find(c => String(c.id) === String(item.category_id));
                    if (category && Array.isArray(category.attributes)) {
                        // console.log(`Appel de renderSpecificAttributes pour Catégorie: ${category.name}, Attributs définis: ${category.attributes.join(', ')}`);
                        // console.log("Valeurs existantes passées:", item.attributes || {});
                        renderSpecificAttributes(category.attributes, category.name, item.attributes || {}); // Le item.attributes || {} est la partie clé
                    } else {
                        if(specificAttributesDiv) specificAttributesDiv.style.display = 'none';
                        // console.log("Pas de catégorie valide ou pas d'attributs définis pour cette catégorie trouvée.");
                    }
                    saveComponentButton.textContent = `Enregistrer Modifications (${ref})`;
                    saveComponentButton.disabled = false;
                    if (exportQrButton) {
                        const hasDrawer = componentDrawerAdminInput.value.trim() !== '';
                        exportQrButton.style.display = 'inline-block';
                        exportQrButton.disabled = !hasDrawer;
                        exportQrButton.title = hasDrawer ? `Exporter l'étiquette QR pour le tiroir ${componentDrawerAdminInput.value}` : "Exporter l'étiquette QR (un tiroir doit être défini)";
                    }
                } else {
                    showAdminFeedback(`Référence "${ref}" non trouvée. Passage en mode ajout.`, 'warning');
                    componentActionsWrapper.style.display = 'none';
                    componentCategorySelectAdmin.value = ""; componentDescInput.value = ""; componentMfgInput.value = "";
                    componentDatasheetInput.value = ""; componentDrawerAdminInput.value = "";
                    componentInitialQuantityInput.value = 0; componentThresholdInput.value = "";
                    if (specificAttributesDiv) specificAttributesDiv.style.display = 'none';
                    saveComponentButton.textContent = `Enregistrer Nouveau Composant`;
                    saveComponentButton.disabled = false;
                    if (exportQrButton) { exportQrButton.style.display = 'none'; exportQrButton.disabled = true; }
                }
            } catch (err) {
                console.error("Erreur lors de la vérification du stock:", err);
                showAdminFeedback(`Erreur lors de la vérification de "${ref}": ${err.message}`, 'error');
                resetStockForm();
            } finally {
                if (componentRefAdminInput && !componentRefAdminInput.disabled) componentRefAdminInput.disabled = false;
                if (checkStockButton && !checkStockButton.disabled) checkStockButton.disabled = false;
            }
        });
        updateQuantityButton?.addEventListener('click', async () => { /* ... (inchangé) ... */
            const refElement = document.getElementById('component-ref-display');
            const ref = refElement?.textContent; const changeStr = quantityChangeInput?.value;
            const change = parseInt(changeStr || '0', 10);
            if (!ref || ref === 'N/A') { showAdminFeedback("Référence composant inconnue pour la mise à jour.", 'error'); return; }
            if (isNaN(change)) { showAdminFeedback("Quantité de changement invalide.", 'error'); quantityChangeInput.focus(); return; }
            if (change === 0) { showAdminFeedback("Aucun changement de quantité spécifié.", 'info', true); return; }
            if (!currentUser) { showAdminFeedback("Connexion requise pour modifier le stock.", 'error'); return; }
            showAdminFeedback(`Mise à jour quantité pour "${ref}" (${change > 0 ? '+' : ''}${change})...`, 'info');
            updateQuantityButton.disabled = true; deleteComponentButton.disabled = true;
            try {
                console.log(`Calling RPC update_stock_and_log for ${ref}, change: ${change}`);
                const { data: newQuantity, error: rpcError } = await supabase.rpc('update_stock_and_log', { p_ref: ref, p_quantity_change: change, p_user_id: currentUser.id, p_user_code: currentUserCode, p_action_type: 'Admin Adjust Qty' });
                if (rpcError) {
                    if (rpcError.message.includes('new_quantity_below_zero')) throw new Error("Stock insuffisant pour ce retrait.");
                    if (rpcError.message.includes('component_not_found')) throw new Error("Composant non trouvé (peut-être supprimé ?).");
                    throw new Error(`Erreur RPC: ${rpcError.message} (Code: ${rpcError.code})`);
                }
                showAdminFeedback(`Quantité pour "${ref}" mise à jour. Nouvelle quantité: ${newQuantity}.`, 'success');
                currentQuantitySpan.textContent = newQuantity;
                quantityChangeInput.value = 0;
                if (componentInitialQuantityInput) componentInitialQuantityInput.value = newQuantity;
                if (inventoryView.classList.contains('active-view')) await displayInventory(currentInventoryPage);
                if (auditView.classList.contains('active-view')) await displayAudit();
                if (logView.classList.contains('active-view')) await displayLog(1);
                if(lastDisplayedDrawerRef === ref) await updateSevenSegmentForComponent(ref);
                const kitIndex = currentKitSelection.findIndex(k => k.ref === ref);
                if (kitIndex > -1) {
                    currentKitSelection[kitIndex].quantity = newQuantity; await saveKitToSupabase();
                    if (kitView.classList.contains('active-view')) displayCurrentKitDrawers();
                }
            } catch (err) {
                console.error("Erreur lors de la mise à jour rapide de quantité:", err);
                showAdminFeedback(`Erreur MàJ "${ref}": ${err.message}`, 'error');
            } finally {
                updateQuantityButton.disabled = false;
                if (componentActionsWrapper.style.display !== 'none') { deleteComponentButton.disabled = false; }
            }
        });
        stockForm?.addEventListener('submit', async (event) => { /* ... (inchangé) ... */
            event.preventDefault();
            if (!currentUser) { showAdminFeedback("Connexion requise.", 'error'); return; }
            const ref = componentRefAdminInput?.value.trim().toUpperCase();
            const categoryId = componentCategorySelectAdmin?.value || null; const description = componentDescInput?.value.trim() || null;
            const manufacturer = componentMfgInput?.value.trim() || null; const datasheet = componentDatasheetInput?.value.trim() || null;
            const drawer = componentDrawerAdminInput?.value.trim().toUpperCase() || null; const quantityRaw = componentInitialQuantityInput?.value;
            const thresholdRaw = componentThresholdInput?.value.trim();

            if (!ref) { showAdminFeedback("La référence composant est requise.", 'error'); componentRefAdminInput.focus(); return; }
            if (ref.length > 50) { showAdminFeedback("La référence est trop longue (max 50).", "error"); componentRefAdminInput.focus(); return; }
            const quantity = parseInt(quantityRaw, 10);
            if (quantityRaw === '' || quantityRaw === null || isNaN(quantity) || quantity < 0) { showAdminFeedback("La quantité doit être un nombre positif ou zéro.", 'error'); componentInitialQuantityInput.focus(); return; }
            if (datasheet) { try { new URL(datasheet); } catch (_) { showAdminFeedback("L'URL de la datasheet n'est pas valide.", 'error'); componentDatasheetInput.focus(); return; } }
            if (drawer && !/^[A-Z0-9\-]{1,10}$/.test(drawer)) { showAdminFeedback("Format du tiroir invalide (max 10, A-Z, 0-9, -).", "error"); componentDrawerAdminInput.focus(); return; }
            const critical_threshold = (thresholdRaw && !isNaN(parseInt(thresholdRaw)) && parseInt(thresholdRaw) >= 0) ? parseInt(thresholdRaw) : null;
            const attributes = {}; let attributesValid = true;
            specificAttributesDiv?.querySelectorAll('input[data-attribute-name]').forEach(input => { const name = input.dataset.attributeName; let value = input.value.trim(); if (value !== '') { attributes[name] = value; } else { attributes[name] = null; } });
            if (!attributesValid) { return; }
            const attributesToSave = Object.keys(attributes).length > 0 ? attributes : null;
            const isEditing = componentActionsWrapper?.style.display === 'block';
            const componentData = { ref, category_id: categoryId || null, description, manufacturer, datasheet, drawer, critical_threshold, attributes: attributesToSave };
            if (!isEditing) { componentData.quantity = quantity; }

            if (!isEditing) { console.log("Préparation ajout nouveau composant:", componentData); showAdminFeedback(`Ajout du nouveau composant "${ref}"...`, 'info'); }
            else { console.log(`Préparation modification composant "${ref}":`, componentData); showAdminFeedback(`Enregistrement des modifications pour "${ref}"...`, 'info'); }
            saveComponentButton.disabled = true; checkStockButton.disabled = true; componentRefAdminInput.disabled = true;
            if(updateQuantityButton) updateQuantityButton.disabled = true; if(deleteComponentButton) deleteComponentButton.disabled = true;
            if (exportQrButton) exportQrButton.disabled = true;

            try {
                const { data: upsertedData, error: upsertError } = await supabase.from('inventory').upsert(componentData, { onConflict: 'ref' }).select().single();
                if (upsertError) {
                    if (upsertError.message.includes('violates foreign key constraint') && upsertError.message.includes('category_id')) {
                        const failedCategoryOption = [...componentCategorySelectAdmin.options].find(opt => opt.value === categoryId);
                        const failedCategoryName = failedCategoryOption ? failedCategoryOption.textContent : categoryId;
                        throw new Error(`La catégorie sélectionnée "${failedCategoryName}" n'existe pas ou plus.`);
                    }
                    throw new Error(`Erreur base de données lors de l'enregistrement: ${upsertError.message} (Code: ${upsertError.code})`);
                }

                let finalQuantity = quantity;
                let currentDbQuantity = NaN;
                if (isEditing) {
                    currentDbQuantity = parseInt(currentQuantitySpan.textContent, 10);
                    const quantityInForm = parseInt(quantityRaw, 10);
                    if (!isNaN(currentDbQuantity) && !isNaN(quantityInForm) && quantityInForm !== currentDbQuantity) {
                        const change = quantityInForm - currentDbQuantity;
                        console.log(`Modification détectée dans le formulaire de quantité (${currentDbQuantity} -> ${quantityInForm}). Appel RPC pour ajuster de ${change}.`);
                        showAdminFeedback(`Mise à jour quantité pour "${ref}" (${change > 0 ? '+' : ''}${change})...`, 'info');
                        const { data: updatedQtyRpc, error: rpcError } = await supabase.rpc('update_stock_and_log', { p_ref: ref, p_quantity_change: change, p_user_id: currentUser.id, p_user_code: currentUserCode, p_action_type: 'Admin Form Adjust' });
                        if (rpcError) {
                            if (rpcError.message.includes('new_quantity_below_zero')) throw new Error("Stock insuffisant (ajustement formulaire).");
                            if (rpcError.message.includes('component_not_found')) throw new Error("Composant non trouvé (ajustement formulaire).");
                            throw new Error(`Erreur RPC (ajustement formulaire): ${rpcError.message}`);
                        }
                        finalQuantity = updatedQtyRpc;
                        console.log(`Quantité ajustée via RPC (formulaire): ${finalQuantity}`);
                    } else {
                        finalQuantity = currentDbQuantity;
                    }
                } else {
                    if (finalQuantity > 0) {
                        console.log(`Log manuel de l'ajout initial de ${finalQuantity} pour ${ref} via RPC...`);
                        const { error: logError } = await supabase.rpc('update_stock_and_log', { p_ref: ref, p_quantity_change: 0, p_user_id: currentUser.id, p_user_code: currentUserCode, p_action_type: 'Admin Initial Add', p_force_log: true, p_initial_quantity: finalQuantity });
                        if (logError) console.warn("Erreur lors du log de l'ajout initial:", logError);
                    }
                }

                const operationType = isEditing ? 'Modifié' : 'Ajouté';
                showAdminFeedback(`Composant "${ref}" ${operationType} avec succès.`, 'success');

                componentRefAdminInput.disabled = false;
                checkStockButton.disabled = false;
                saveComponentButton.disabled = false;
                componentActionsWrapper.style.display = 'block';
                const refDisplay = document.getElementById('component-ref-display');
                 if (refDisplay) refDisplay.textContent = ref;

                if (!isNaN(finalQuantity)) {
                    currentQuantitySpan.textContent = finalQuantity;
                    if (componentInitialQuantityInput) componentInitialQuantityInput.value = finalQuantity;
                }
                 if(updateQuantityButton) updateQuantityButton.disabled = false;
                 if(deleteComponentButton) {
                    deleteComponentButton.style.display = 'inline-block';
                    deleteComponentButton.disabled = false;
                 }
                 saveComponentButton.textContent = `Enregistrer Modifications (${ref})`;

                if (exportQrButton) {
                    const hasDrawer = componentDrawerAdminInput.value.trim() !== '';
                    exportQrButton.style.display = 'inline-block';
                    exportQrButton.disabled = !hasDrawer;
                    exportQrButton.title = hasDrawer ? `Exporter l'étiquette QR pour le tiroir ${componentDrawerAdminInput.value}` : "Exporter l'étiquette QR (un tiroir doit être défini)";
                }

                if (inventoryView.classList.contains('active-view')) await displayInventory(1);
                if (auditView.classList.contains('active-view')) await displayAudit();
                if (logView.classList.contains('active-view')) await displayLog(1);
                await updateSevenSegmentForComponent(ref);

                const kitIndex = currentKitSelection.findIndex(k => k.ref === ref);
                if (kitIndex > -1) {
                    const updatedItemForKit = await getStockInfoFromSupabase(ref);
                    if (updatedItemForKit) { currentKitSelection[kitIndex] = updatedItemForKit; console.log(`Item ${ref} mis à jour dans le kit local.`); }
                    else { currentKitSelection.splice(kitIndex, 1); console.log(`Item ${ref} retiré du kit local car introuvable après modification.`); }
                    await saveKitToSupabase();
                    if (kitView.classList.contains('active-view')) displayCurrentKitDrawers();
                }

            } catch (err) {
                console.error("Erreur lors de l'enregistrement du composant:", err);
                showAdminFeedback(`Erreur enregistrement "${ref}": ${err.message}`, 'error');
                saveComponentButton.disabled = false;
                checkStockButton.disabled = false;
                componentRefAdminInput.disabled = false;
                 if (isEditing || componentActionsWrapper?.style.display === 'block') {
                     if(updateQuantityButton) updateQuantityButton.disabled = false;
                     if(deleteComponentButton) deleteComponentButton.disabled = false;
                     if (exportQrButton) exportQrButton.disabled = !(componentDrawerAdminInput.value.trim() !== '');
                 } else {
                     if (exportQrButton) { exportQrButton.style.display = 'none'; exportQrButton.disabled = true; }
                 }
            }
        });
        deleteComponentButton?.addEventListener('click', async () => { /* ... (inchangé) ... */
            const refElement = document.getElementById('component-ref-display');
            const ref = refElement?.textContent;
            if (!ref || ref === 'N/A') { showAdminFeedback("Référence composant inconnue pour la suppression.", 'error'); return; }
            if (!currentUser) { showAdminFeedback("Connexion requise pour supprimer.", 'error'); return; }
            if (!confirm(`ATTENTION !\nÊtes-vous sûr de vouloir supprimer définitivement le composant "${ref}" et tout son historique associé ?\n\nCette action est IRRÉVERSIBLE.`)) { return; }
            showAdminFeedback(`Suppression de "${ref}" et de son historique en cours...`, 'info');
            deleteComponentButton.disabled = true; updateQuantityButton.disabled = true; saveComponentButton.disabled = true;
            checkStockButton.disabled = true; componentRefAdminInput.disabled = true;
            if (exportQrButton) exportQrButton.style.display = 'none';

            let kitWasModified = false;
            const indexInKit = currentKitSelection.findIndex(k => k.ref === ref);
            if (indexInKit > -1) { currentKitSelection.splice(indexInKit, 1); kitWasModified = true; console.log(`Item ${ref} retiré du kit local avant suppression.`); }

            try {
                console.log(`Suppression de l'historique (log) pour ${ref}...`);
                const { error: deleteLogError } = await supabase.from('log').delete().eq('item_ref', ref);
                if (deleteLogError) { console.warn(`Erreur (non bloquante) lors de la suppression de l'historique pour ${ref}: ${deleteLogError.message}`); }
                else { console.log(`Historique pour ${ref} supprimé.`); }

                console.log(`Suppression du composant ${ref} de l'inventaire...`);
                const { error: deleteInvError } = await supabase.from('inventory').delete().eq('ref', ref);
                if (deleteInvError && deleteInvError.code === 'PGRST116') { showAdminFeedback(`Composant "${ref}" non trouvé (peut-être déjà supprimé).`, 'warning'); }
                else if (deleteInvError) { throw new Error(`Erreur lors de la suppression du composant dans la base de données: ${deleteInvError.message}`); }
                else { showAdminFeedback(`Composant "${ref}" et son historique supprimés avec succès.`, 'success'); }

                if (kitWasModified) { await saveKitToSupabase(); }
                resetStockForm();
                if(lastDisplayedDrawerRef === ref) updateSevenSegmentForComponent(null);
                if (inventoryView.classList.contains('active-view')) await displayInventory(1);
                if (auditView.classList.contains('active-view')) await displayAudit();
                if (logView.classList.contains('active-view')) await displayLog(1);
                if (kitView.classList.contains('active-view')) displayCurrentKitDrawers();
            } catch (err) {
                console.error("Erreur lors de la suppression du composant:", err);
                showAdminFeedback(`Erreur lors de la suppression de "${ref}": ${err.message}`, 'error');
                checkStockButton.disabled = false; componentRefAdminInput.disabled = false;
            }
        });
        componentDrawerAdminInput?.addEventListener('input', () => { /* ... (inchangé) ... */
            if (exportQrButton && exportQrButton.style.display === 'inline-block') {
                const hasDrawer = componentDrawerAdminInput.value.trim() !== '';
                exportQrButton.disabled = !hasDrawer;
                exportQrButton.title = hasDrawer ? `Exporter l'étiquette QR pour le tiroir ${componentDrawerAdminInput.value}` : "Exporter l'étiquette QR (un tiroir doit être défini)";
            }
        });
        exportCriticalButton?.addEventListener('click', handleExportCriticalStockTXT);
        exportQrButton?.addEventListener('click', handleExportQrCode);
    }

    async function handleExportQrCode() { /* ... (inchangé) ... */
        console.log("Export QR Code demandé (version Tiroir Uniquement).");
        if (!exportQrButton || exportQrButton.disabled) return;
        const ref = componentRefAdminInput?.value.trim().toUpperCase();
        const drawer = componentDrawerAdminInput?.value.trim().toUpperCase();
        if (!ref) {
            showAdminFeedback("Impossible de générer le QR Code : Référence manquante.", 'error');
            return;
        }
        if (!drawer) {
            showAdminFeedback("Impossible de générer le QR Code : Tiroir manquant.", 'error');
            return;
        }
        const qrData = drawer;
        console.log("Données QR (brutes):", qrData);
        const encodedQrData = encodeURIComponent(qrData);
        console.log("Données QR (URL encodées):", encodedQrData);
        const qrImageSize = 80;
        const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrImageSize}x${qrImageSize}&data=${encodedQrData}&margin=2`;
        console.log("URL image QR:", qrImageUrl);
        const qrPageHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Étiquette Tiroir ${escapeHtml(drawer)} (pour ${escapeHtml(ref)})</title>
    <style>
        @page { size: 45mm 20mm; margin: 1mm; }
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; width: 43mm; height: 18mm; overflow: hidden; display: flex; justify-content: center; align-items: center; }
        .label-item { width: 100%; height: 100%; border: 1px solid #ccc; display: flex; align-items: center; justify-content: flex-start; padding: 1mm; box-sizing: border-box; overflow: hidden; background-color: #fff; }
        .qr-code { flex-shrink: 0; width: 16mm; height: 16mm; display: flex; justify-content: center; align-items: center; margin-right: 2mm; }
        .qr-code img { display: block; max-width: 100%; max-height: 100%; object-fit: contain; }
        .text-info { flex-grow: 1; height: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden; text-align: center; }
        .text-info .drawer-id { font-weight: bold; font-size: 16pt; color: black; white-space: nowrap; line-height: 1; }
        .buttons { position: fixed; bottom: 10px; left: 50%; transform: translateX(-50%); z-index: 10; background: rgba(240, 240, 240, 0.8); padding: 5px; border-radius: 5px; display: flex; gap: 10px; }
        .buttons button { padding: 5px 10px; font-size: 10pt;}
        @media print { body { width: 45mm; height: 20mm; display: block; } .label-item { border: none; padding: 0; width: 45mm; height: 20mm; } .qr-code { width: 18mm; height: 18mm; margin-right: 1mm;} .buttons { display: none; } }
    </style>
</head>
<body>
    <div class="label-item">
        <div class="qr-code"><img src="${qrImageUrl}" alt="QR Code pour tiroir ${escapeHtml(drawer)}" width="${qrImageSize}" height="${qrImageSize}"></div>
        <div class="text-info"><div class="drawer-id">${escapeHtml(drawer)}</div></div>
    </div>
    <div class="buttons"><button onclick="window.print();">Imprimer</button><button onclick="window.close();">Fermer</button></div>
</body>
</html>`;
        try {
            const qrWindow = window.open("", `Label_Tiroir_${drawer}`, "width=250,height=200,scrollbars=yes,resizable=yes");
            if (qrWindow) {
                qrWindow.document.open(); qrWindow.document.write(qrPageHtml); qrWindow.document.close(); qrWindow.focus();
                showAdminFeedback(`Fenêtre avec l'étiquette pour tiroir ${drawer} ouverte.`, 'success');
            } else { throw new Error("Impossible d'ouvrir la nouvelle fenêtre. Vérifiez si votre navigateur bloque les pop-ups."); }
        } catch (e) { console.error("Erreur lors de l'ouverture de la fenêtre QR:", e); showAdminFeedback(`Erreur génération QR : ${e.message}`, 'error'); }
    }
    async function handleExportCriticalStockTXT() { /* ... (inchangé) ... */ if (!exportCriticalFeedbackDiv) return; exportCriticalFeedbackDiv.textContent = 'Export du stock critique en cours...'; exportCriticalFeedbackDiv.className = 'feedback-area info'; exportCriticalFeedbackDiv.style.display = 'block'; try { const { data, error } = await supabase.from('inventory').select('ref, description, quantity, critical_threshold, drawer').order('ref'); if (error) throw new Error(`Erreur fetch inventaire: ${error.message}`); if (!data || data.length === 0) { exportCriticalFeedbackDiv.textContent = 'L\'inventaire est vide.'; exportCriticalFeedbackDiv.className = 'feedback-area warning'; return; } const criticalItems = data.filter(item => { const qty = item.quantity; const threshold = item.critical_threshold; if (qty <= 0) return true; if (threshold !== null && threshold >= 0 && qty <= threshold) return true; return false; }); if (criticalItems.length === 0) { exportCriticalFeedbackDiv.textContent = 'Aucun composant en état critique trouvé.'; exportCriticalFeedbackDiv.className = 'feedback-area info'; return; } let fileContent = `Rapport StockAV - Composants Critiques (${new Date().toLocaleString('fr-FR')})\n`; fileContent += `======================================================================\n\n`; criticalItems.forEach(item => { const status = item.quantity <= 0 ? "!! RUPTURE DE STOCK !!" : "** STOCK FAIBLE **"; fileContent += `Référence:    ${item.ref}\n`; fileContent += `Description:  ${item.description || '-'}\n`; fileContent += `Tiroir:       ${item.drawer || 'N/A'}\n`; fileContent += `Quantité:     ${item.quantity}\n`; fileContent += `Seuil critique: ${item.critical_threshold ?? 'Non défini'}\n`; fileContent += `STATUT:       ${status}\n`; fileContent += `----------------------------------------------------------------------\n`; }); const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-'); const filename = `stockav_critique_${timestamp}.txt`; downloadFile(filename, fileContent, 'text/plain;charset=utf-8'); exportCriticalFeedbackDiv.textContent = `Export TXT (${criticalItems.length} composants critiques) réussi.`; exportCriticalFeedbackDiv.className = 'feedback-area success'; } catch (err) { console.error("Erreur lors de l'export du stock critique:", err); exportCriticalFeedbackDiv.textContent = `Erreur lors de l'export: ${err.message}`; exportCriticalFeedbackDiv.className = 'feedback-area error'; } }

    // --- VUE RECHERCHE (CHAT IA) (inchangée) ---
    // ... (fonctions addMessageToChat, attachModalTriggerListeners, displayWelcomeMessage, buildLocalStockContext, displayStructuredResults, promptLoginBeforeAction, handleQuantityResponse, resetConversationState, getStockInfoFromSupabase, handleUserInput) ...
    async function addMessageToChat(sender, messageContent, isHTML = false) { if (!responseOutputChat) return; const messageDiv = document.createElement('div'); messageDiv.classList.add('message', sender.toLowerCase()); if (isHTML) { try { const range = document.createRange(); const fragment = range.createContextualFragment(messageContent); messageDiv.appendChild(fragment); attachModalTriggerListeners(messageDiv); } catch (e) { console.error("Error parsing chat HTML:", e); messageDiv.textContent = messageContent; } } else { messageDiv.textContent = messageContent; } responseOutputChat.insertBefore(messageDiv, responseOutputChat.firstChild); const role = sender === 'user' ? 'user' : 'assistant'; const textContentForHistory = messageDiv.textContent || messageContent; chatHistory.push({ role: role, content: textContentForHistory.trim() }); if(chatHistory.length > 20) { chatHistory = chatHistory.slice(-20); } const maxMessagesInDOM = 50; while (responseOutputChat.children.length > maxMessagesInDOM) { responseOutputChat.removeChild(responseOutputChat.lastChild); } responseOutputChat.scrollTop = 0; }
    function attachModalTriggerListeners(containerElement) { containerElement.querySelectorAll('button.choice-button.take-button').forEach(button => { if (button.dataset.listenerAttached) return; button.dataset.listenerAttached = "true"; button.addEventListener('click', async (event) => { const targetButton = event.target; const itemDataStr = targetButton.dataset.itemData; if (!itemDataStr) { console.error("Erreur: Attribut data-item-data manquant sur le bouton 'Prendre'.", targetButton); await addMessageToChat('ai', "Oups, problème interne pour sélectionner ce composant."); return; } if (!currentUser) { await promptLoginBeforeAction("prendre un composant"); return; } try { const itemData = JSON.parse(itemDataStr); const chosenRef = itemData.ref; const availableQty = itemData.local_qty; const attributes = itemData.specs || {}; if (!chosenRef || typeof availableQty !== 'number' || availableQty <= 0) { console.warn(`Données invalides ou stock nul pour ${chosenRef} dans data-item-data`, itemData); await addMessageToChat('ai', `Le stock pour ${escapeHtml(chosenRef)} semble être épuisé.`); return; } console.log(`Clic sur "Prendre" pour ${chosenRef}, Qté dispo: ${availableQty}. Ouverture de la modale.`); const parentMessage = targetButton.closest('.message.ai'); if (parentMessage) { parentMessage.querySelectorAll('button.choice-button.take-button').forEach(btn => btn.disabled = true); } updateSevenSegmentForComponent(chosenRef); showQuantityModal(chosenRef, availableQty, attributes); } catch (e) { console.error("Erreur lors du parsing de data-item-data ou de l'ouverture de la modale:", e, itemDataStr); await addMessageToChat('ai', "Une erreur s'est produite lors de la sélection du composant."); } }); }); }
    function displayWelcomeMessage() { if (!responseOutputChat) return; responseOutputChat.innerHTML = ''; chatHistory = []; resetConversationState(); addMessageToChat('ai', "Bonjour ! Je suis StockAV. Demandez-moi:\n• Si un composant est en stock (ex: 'LM393 dispo ?', 'stock pour 1N4007')\n• Des équivalents (ex: 'équivalent BC547')\n• Une recherche par specs (ex: 'condo 100nF 50V céramique', 'MOSFET 60V 20A TO-220')\n• Ou posez une question générale sur l'électronique !"); if(componentInputChat) { componentInputChat.value = ''; componentInputChat.focus(); } updateSevenSegmentForComponent(null); }
    async function buildLocalStockContext(limit = 20) { if (!supabase || !currentUser) return null; try { const { data, error } = await supabase .from('inventory') .select('ref, quantity, drawer') .order('updated_at', { ascending: false }) .limit(limit); if (error) { console.warn("Erreur récupération contexte stock local:", error.message); return null; } if (!data || data.length === 0) return {}; const context = data.reduce((acc, item) => { if (item.ref) { acc[item.ref.toUpperCase()] = { qty: item.quantity ?? 0, drawer: item.drawer || null }; } return acc; }, {}); console.log(`[buildLocalStockContext] Contexte généré pour ${Object.keys(context).length} composants.`); return context; } catch (err) { console.error("Erreur JS dans buildLocalStockContext:", err); return null; } }
    async function displayStructuredResults(results) { if (!results || results.length === 0) { await addMessageToChat('ai', "Je n'ai trouvé aucune information pertinente.", false); return; } let responseHTML = `<div class="ai-results-container">`; let foundActionableItem = false; results.forEach((item, index) => { if (item.type === 'error') { console.warn("Affichage de l'erreur standard retournée par l'IA:", item.ref); responseHTML += `<div class="equivalent-item error-message"><strong>Info:</strong> ${escapeHtml(item.ref || "Erreur inconnue.")}</div>`; return; } const isLocal = item.is_local === true; const localQty = item.local_qty; const localDrawer = item.local_drawer; const ref = item.ref || "N/A"; const type = item.type || "Type inconnu"; const reason = item.reason || null; const specs = item.specs || {}; const availability = item.availability || {}; const indicatorHTML = createStockIndicatorHTML(isLocal ? localQty : undefined, isLocal ? item.critical_threshold : undefined); if (index === 0 && ref !== "N/A") { updateSevenSegmentForComponent(ref); } else if (index === 0) { updateSevenSegmentForComponent(null); } responseHTML += `<div class="equivalent-item">`; responseHTML += `<div class="item-header"> ${indicatorHTML} <strong>${escapeHtml(ref)}</strong> ${type !== "Type inconnu" ? `<span class="component-type">${escapeHtml(type)}</span>` : ''} </div>`; if (isLocal) { responseHTML += `<div class="local-info">📍 Stock local: <strong>${localQty}</strong>${localDrawer ? ` (Tiroir: ${escapeHtml(localDrawer)})` : ''}</div>`; } else if (reason) { responseHTML += `<div class="equivalent-reason">${escapeHtml(reason)}</div>`; } else { responseHTML += `<div class="stock-status-info">Non trouvé localement.</div>`; } let specsTableHTML = ''; const specKeys = Object.keys(specs); const hasValidSpecs = specKeys.some(key => specs[key] !== null && specs[key] !== undefined && String(specs[key]).trim() !== ''); if (hasValidSpecs) { specsTableHTML += `<div class="specs-container"> <table class="specs-table"><tbody>`; const specMapping = { 'value': 'Valeur', 'voltage': 'Tension', 'current': 'Courant', 'power': 'Puissance', 'tolerance': 'Tolérance', 'package': 'Boîtier', 'gain': 'Gain (hFE)', 'rds_on': 'Rds(on)', 'vgs_th': 'Vgs(th)', 'capacity': 'Capacité', 'frequency': 'Fréquence', 'noise': 'Bruit', 'speed': 'Vitesse', 'temperature': 'Température', 'dielectric': 'Diélectrique' }; for (const key of specKeys) { const value = specs[key]; if (value !== null && value !== undefined && String(value).trim() !== '') { const displayName = specMapping[key] || key.charAt(0).toUpperCase() + key.slice(1); specsTableHTML += `<tr> <td class="spec-key">${escapeHtml(displayName)}:</td> <td class="spec-value">${escapeHtml(value)}</td> </tr>`; } } specsTableHTML += `</tbody></table></div>`; responseHTML += specsTableHTML; } let linksHTML = ''; if (availability.digikey) linksHTML += `<a href="${escapeHtml(availability.digikey)}" target="_blank" rel="noopener noreferrer" class="external-link digikey" title="Chercher ${escapeHtml(ref)} sur Digi-Key.ca">Digi-Key</a>`; if (availability.mouser) linksHTML += `<a href="${escapeHtml(availability.mouser)}" target="_blank" rel="noopener noreferrer" class="external-link mouser" title="Chercher ${escapeHtml(ref)} sur Mouser.ca">Mouser</a>`; if (availability.aliexpress) linksHTML += `<a href="${escapeHtml(availability.aliexpress)}" target="_blank" rel="noopener noreferrer" class="external-link aliexpress" title="Chercher ${escapeHtml(ref)} sur AliExpress">AliExpress</a>`; if (linksHTML) { responseHTML += `<div class="external-links-block">${linksHTML}</div>`; } if (isLocal && localQty > 0 && currentUser) { const itemDataForModal = { ref: ref, local_qty: localQty, specs: specs }; const itemDataStr = JSON.stringify(itemDataForModal); responseHTML += `<div class="action-container">`; responseHTML += `<button class="choice-button take-button" data-item-data='${escapeHtml(itemDataStr)}' title="Prendre ${escapeHtml(ref)}">Prendre</button>`; responseHTML += `</div>`; foundActionableItem = true; } else if (isLocal && localQty <= 0) { responseHTML += `<div class="stock-status-info"><i>(Stock épuisé)</i></div>`; } else if (isLocal && !currentUser) { responseHTML += `<div class="stock-status-info"><i>(Connectez-vous pour prendre)</i></div>`; } responseHTML += `</div>`; }); responseHTML += `</div>`; if (!foundActionableItem && results.some(item => item.is_local && item.local_qty > 0) && !currentUser) { responseHTML += "<br/><i>Connectez-vous pour pouvoir prendre les composants disponibles localement.</i>"; } await addMessageToChat('ai', responseHTML, true); }
    async function promptLoginBeforeAction(actionDesc) { await addMessageToChat('ai', `Vous devez être connecté pour ${actionDesc}.`); loginCodeInput?.focus(); }
    async function handleQuantityResponse(userInput) { const ref = conversationState.chosenRefForStockCheck; const maxQty = conversationState.availableQuantity; const threshold = conversationState.criticalThreshold; if (!conversationState.awaitingQuantityConfirmation || !ref || !currentUser) { console.warn("handleQuantityResponse appelé hors contexte (peut-être normal si la modale est utilisée maintenant)."); resetConversationState(); return; } console.log(`[handleQuantityResponse] Réponse reçue pour ${ref}: "${userInput}"`); const lowerInput = userInput.toLowerCase(); if (lowerInput === 'non' || lowerInput === 'annuler' || lowerInput === '0' || lowerInput === 'cancel' || lowerInput === 'no') { await addMessageToChat('ai', "Ok, opération annulée."); resetConversationState(); updateSevenSegmentForComponent(null); await delay(300); await addMessageToChat('ai', "Autre chose ?"); return; } const match = userInput.match(/\d+/); const quantityToTake = match ? parseInt(match[0], 10) : NaN; if (isNaN(quantityToTake) || quantityToTake <= 0) { await addMessageToChat('ai', "Quantité non comprise. Veuillez entrer un nombre positif, ou 'non' pour annuler."); return; } if (quantityToTake > maxQty) { await addMessageToChat('ai', `Stock insuffisant. Il ne reste que ${maxQty} ${escapeHtml(ref)}. Combien voulez-vous en prendre (max ${maxQty}) ? Ou entrez 'non' pour annuler.`); return; } await addMessageToChat('ai', `Ok, enregistrement de la sortie de ${quantityToTake} x ${escapeHtml(ref)}...`); loadingIndicatorChat.style.display = 'block'; loadingIndicatorChat.querySelector('i').textContent = `Mise à jour stock ${escapeHtml(ref)}...`; const change = -quantityToTake; try { console.log(`Calling RPC update_stock_and_log from Chat (handleQuantityResponse) for ${ref}, change: ${change}`); const { data: newQuantity, error: rpcError } = await supabase.rpc('update_stock_and_log', { p_ref: ref, p_quantity_change: change, p_user_id: currentUser.id, p_user_code: currentUserCode, p_action_type: 'Chat Take Qty' }); if (rpcError) { if (rpcError.message.includes('new_quantity_below_zero')) throw new Error("Stock devenu insuffisant (vérification RPC)."); if (rpcError.message.includes('component_not_found')) throw new Error("Composant non trouvé lors de la mise à jour."); throw new Error(`Erreur RPC: ${rpcError.message}`); } const statusIndicatorHTML = createStockIndicatorHTML(newQuantity, threshold); await addMessageToChat('ai', `${statusIndicatorHTML} Sortie enregistrée ! Stock restant pour <strong>${escapeHtml(ref)}</strong> : ${newQuantity}.`); if (inventoryView.classList.contains('active-view')) await displayInventory(currentInventoryPage); if (auditView.classList.contains('active-view')) await displayAudit(); if (logView.classList.contains('active-view')) await displayLog(1); await updateSevenSegmentForComponent(ref); const kitIndex = currentKitSelection.findIndex(k => k.ref === ref); if (kitIndex > -1) { currentKitSelection[kitIndex].quantity = newQuantity; await saveKitToSupabase(); if (kitView.classList.contains('active-view')) displayCurrentKitDrawers(); } } catch (err) { console.error("Erreur lors de la mise à jour du stock via handleQuantityResponse:", err); await addMessageToChat('ai', `Désolé, une erreur s'est produite : ${err.message}. L'opération a échoué.`); } finally { loadingIndicatorChat.style.display = 'none'; resetConversationState(); await delay(300); await addMessageToChat('ai', "Besoin d'autre chose ?"); } }
    function resetConversationState() { conversationState = { awaitingQuantityConfirmation: false, chosenRefForStockCheck: null, availableQuantity: 0, criticalThreshold: null }; console.log("Conversation state reset."); }
    async function getStockInfoFromSupabase(ref) { if (!supabase) { console.error("getStockInfoFromSupabase: Supabase non initialisé."); return null; } if (!ref) { console.warn("getStockInfoFromSupabase: Référence manquante."); return null; } const upperRef = ref.toUpperCase(); try { console.log(`getStockInfoFromSupabase: Fetching details for ${upperRef}...`); const { data, error } = await supabase .from('inventory') .select(`*, categories ( name )`) .eq('ref', upperRef) .maybeSingle(); if (error && error.code !== 'PGRST116') { throw new Error(`Erreur base de données getStockInfo: ${error.message}`); } if (data) { data.category_name = data.categories?.name || null; if (data.category_id) data.category_id = String(data.category_id); delete data.categories; console.log(`getStockInfoFromSupabase: Data found for ${upperRef}:`, data); } return data; } catch (err) { console.error(`Erreur JS dans getStockInfoFromSupabase pour ${upperRef}:`, err); return null; } }
    async function handleUserInput() {
        if (!componentInputChat || !searchButtonChat || !loadingIndicatorChat || !responseOutputChat || !supabase) {
            console.error("handleUserInput: Un ou plusieurs éléments DOM ou Supabase sont manquants.");
            if(responseOutputChat) addMessageToChat('ai', "Erreur: Impossible d'initialiser le composant de chat.", false);
            return;
        }

        const userMessageContent = componentInputChat.value.trim();
        if (!userMessageContent) return;

        addMessageToChat('user', userMessageContent);
        componentInputChat.value = '';
        componentInputChat.disabled = true;
        searchButtonChat.disabled = true;
        loadingIndicatorChat.style.display = 'block';
        loadingIndicatorChat.querySelector('i').textContent = 'Analyse en cours...';
        responseOutputChat.scrollTop = 0;

        try {
            // --- 1. Vérification rapide stock local ---
             const simpleStockQueryRegex = /^(?:stock|inventaire|dispo(?:nible)?|combien\s*(?:de)?|quantit[ée]\s*(?:de)?|cherch(?:e|er)|trouv(?:e|er))\s+(?:pour\s+|de\s+)?([\w\-\+]{3,})\s*(?:en\s*stock|dans\s*le\s*stock)?\??$/i;
            const simpleMatch = userMessageContent.match(simpleStockQueryRegex);

            if (simpleMatch && simpleMatch[1]) {
                const refToCheck = simpleMatch[1].toUpperCase();
                console.log(`[handleUserInput Routing V2] Simple Stock Check: ${refToCheck}`);
                loadingIndicatorChat.querySelector('i').textContent = `Vérification stock local pour ${escapeHtml(refToCheck)}...`;
                await delay(100);
                const itemInfo = await getStockInfoFromSupabase(refToCheck);

                if (itemInfo) {
                    // ... (logique affichage stock local inchangée) ...
                    const qty = itemInfo.quantity;
                    const drawer = itemInfo.drawer || 'N/A';
                    const indicatorHTML = createStockIndicatorHTML(qty, itemInfo.critical_threshold);
                    let responseText = `${indicatorHTML} Oui, <strong>${escapeHtml(refToCheck)}</strong> est dans le stock.`;
                    responseText += `\nQuantité: ${qty}`;
                    responseText += `\nTiroir: ${escapeHtml(drawer)}`;
                    if (qty > 0 && currentUser) {
                        const modalItemData = { ref: itemInfo.ref, local_qty: itemInfo.quantity, specs: itemInfo.attributes || {} };
                        const itemDataStr = JSON.stringify(modalItemData);
                        responseText += `\n<button class="choice-button take-button direct-take-button" data-item-data='${escapeHtml(itemDataStr)}' title="Prendre ${escapeHtml(refToCheck)}">Prendre</button>`;
                        await addMessageToChat('ai', responseText, true);
                    } else if (qty <= 0) {
                        responseText += "\n(Stock épuisé)";
                        await addMessageToChat('ai', responseText, false);
                    } else {
                        responseText += "\n<i>(Connectez-vous pour pouvoir prendre)</i>";
                        await addMessageToChat('ai', responseText, true);
                    }
                    updateSevenSegmentForComponent(refToCheck);
                } else {
                    await addMessageToChat('ai', `Non, <strong>${escapeHtml(refToCheck)}</strong> n'a pas été trouvé dans le stock local.`);
                    updateSevenSegmentForComponent(null);
                }
                // --- Nettoyage final DANS le bloc if (important) ---
                componentInputChat.disabled = false;
                searchButtonChat.disabled = false;
                loadingIndicatorChat.style.display = 'none';
                componentInputChat.focus();
                return; // Sortir de la fonction
            } // Fin simple stock check

            // --- 2. Vérification attente quantité (inchangé) ---
            if (conversationState.awaitingQuantityConfirmation) {
                console.log("[handleUserInput Routing V2] Awaiting Quantity Confirmation: Calling handleQuantityResponse.");
                await handleQuantityResponse(userMessageContent);
                // --- Nettoyage final DANS le bloc if (important) ---
                // handleQuantityResponse gère déjà son propre nettoyage final normalement
                // mais par sécurité on le met ici aussi au cas où il sortirait prématurément
                componentInputChat.disabled = false;
                searchButtonChat.disabled = false;
                loadingIndicatorChat.style.display = 'none';
                componentInputChat.focus();
                return;
            }

            // --- 3. Gestion messages triviaux (inchangé) ---
            const isTrivial = /^\s*(ok|merci|oui|non|d'accord|super|parfait|compris|bye|salut|bonjour|coucou|au revoir|a plus|ça va)[.,!?;:]*\s*$/i.test(userMessageContent);
            if (isTrivial && userMessageContent.length < 20) {
                console.log("[handleUserInput Routing V2] Trivial Message: Responding locally.");
                loadingIndicatorChat.querySelector('i').textContent = 'Réponse rapide...';
                await delay(200);
                const randomReplies = ["D'accord.", "Ok.", "Bien noté.", "Parfait.", "Compris.", "Avec plaisir !", "Pas de problème."];
                await addMessageToChat('ai', randomReplies[Math.floor(Math.random() * randomReplies.length)], false);
                // --- Nettoyage final DANS le bloc if (important) ---
                componentInputChat.disabled = false;
                searchButtonChat.disabled = false;
                loadingIndicatorChat.style.display = 'none';
                componentInputChat.focus();
                return;
            }

            // --- 4. Logique de Routage Principale (V2 - Affinée) ---
            resetConversationState();
            let functionToCall = 'ai-general-chat'; // Default
            const lowerQuery = userMessageContent.toLowerCase();

            // Définitions (inchangées)
            const advancedSearchKeywords = ['équivalent', 'equivalent', 'cherch', 'trouve', 'composant pour', 'spec:', 'spécification:', 'specs:', 'recherche composant', 'alternative'];
            const valuePattern = /\b\d+(\.\d+)?\s?(k|m|g|µ|u|n|p)?(ohm|f|h|v|a|w)\b/i;
            const generalInfoKeywords = [
                'brochage', 'pinout', 'comment utiliser', 'fonctionnement', 'datasheet', 'explique', 'aide',
                'schéma', 'circuit', 'application', 'tension max', 'courant max', 'puissance max',
                'c\'est quoi', 'qu\'est-ce que', 'définition', 'différence entre', 'role de', 'avantage', 'inconvénient',
                'utilisation', 'utilisé', 'utile', 'pourquoi', 'comment' // Ajout de mots généraux demandant info
            ];
            const strongReferencePattern = /\b(([a-zA-Z]{2,}[0-9]+[\w\-\+]*)|([0-9]+[a-zA-Z]{2,}[\w\-\+]*)|([A-Z0-9]{6,}))\b/i;

            // Analyse de l'intention (inchangée)
            const requiresAdvancedSearchIntent = advancedSearchKeywords.some(kw => lowerQuery.includes(kw)) || valuePattern.test(lowerQuery);
            const requiresGeneralInfoIntent = generalInfoKeywords.some(kw => lowerQuery.includes(kw));
            const containsStrongReference = strongReferencePattern.test(userMessageContent);

            // --- Arbre de décision pour le routage (V2 - Affiné) ---
            if (requiresGeneralInfoIntent) {
                // Priorité 1: Si des mots-clés demandant une info générale sont présents, c'est pour ai-general-chat
                // Peu importe si une référence est présente ou non (ex: "quelle utilisation pour NE555?")
                functionToCall = 'ai-general-chat';
                loadingIndicatorChat.querySelector('i').textContent = `Recherche d'informations via IA...`;
                console.log(`[handleUserInput Routing V2] General Info Request (Keywords detected): Calling ${functionToCall}`);

            } else if (requiresAdvancedSearchIntent) {
                // Priorité 2: Si des mots-clés de recherche avancée ou des specs sont présents (et pas de mots clés d'info générale prioritaires)
                functionToCall = 'ai-advanced-search';
                loadingIndicatorChat.querySelector('i').textContent = `Recherche composant via IA...`;
                console.log(`[handleUserInput Routing V2] Advanced Search Request (Keywords/Specs detected): Calling ${functionToCall}`);

            } else if (containsStrongReference) {
                // Priorité 3: Si une référence est présente, mais SANS mots-clés clairs d'info générale ou de recherche avancée
                // Ex: l'utilisateur tape juste "NE555"
                // On suppose une recherche implicite d'équivalents/infos de base -> advanced-search
                functionToCall = 'ai-advanced-search';
                loadingIndicatorChat.querySelector('i').textContent = `Recherche composant via IA...`;
                console.log(`[handleUserInput Routing V2] Strong Reference Only (No other keywords): Calling ${functionToCall}`);

            } else {
                // Cas par défaut: Pas de mots-clés spécifiques, pas de référence forte. Conversation générale.
                // Ex: "bonjour", "recette omelette"
                functionToCall = 'ai-general-chat';
                loadingIndicatorChat.querySelector('i').textContent = `Réponse IA en cours...`;
                console.log(`[handleUserInput Routing V2] Default / General Conversation: Calling ${functionToCall}`);
            }
            // --- Fin de la logique de routage (V2) ---


            // --- 5. Préparation et Appel de la Fonction Edge choisie (inchangé) ---
            const localStock = await buildLocalStockContext();
            const HISTORY_LENGTH = 4;
            const recentHistory = chatHistory.slice(-HISTORY_LENGTH);

            console.log(`   -> Calling Edge Function: ${functionToCall}`);
            const { data, error: invokeError } = await supabase.functions.invoke(functionToCall, {
                body: {
                    query: userMessageContent,
                    history: recentHistory,
                    localStockContext: (functionToCall === 'ai-advanced-search') ? localStock : null
                }
            });

            // --- 6. Traitement de la Réponse de la Fonction Edge (inchangé) ---
            if (invokeError) {
                let detail = invokeError.message || "Erreur inconnue";
                 // ... (gestion détaillée des erreurs d'appel inchangée) ...
                 if (invokeError instanceof Error && invokeError.message) {
                    if (invokeError.message.includes("Failed to send") || invokeError.message.includes("network error") || invokeError.message.includes("fetch failed")) { detail = "Impossible de contacter le service IA (réseau)."; }
                    else if (invokeError.message.includes("500") || invokeError.message.includes("non-2xx") || invokeError.message.includes("non-OK") || invokeError.message.includes("Bad Gateway") || invokeError.message.includes("invocation error")) { detail = "Le service IA a retourné une erreur serveur."; }
                    else if (invokeError.message.includes("timeout")) { detail = "Le service IA a mis trop de temps à répondre."; }
                    else if (invokeError.message.includes("429")) { detail = "Limite d'appels atteinte pour le service IA. Réessayez plus tard."; }
                 }
                console.error("Erreur brute appel fonction Edge:", invokeError);
                throw new Error(`Erreur appel fonction Edge (${functionToCall}): ${detail}`);
            }

            // Traiter la réponse spécifique à la fonction appelée
            if (functionToCall === 'ai-advanced-search') {
                 if (data.error) {
                     console.warn(`Erreur retournée par la fonction Edge '${functionToCall}':`, data.error);
                     await addMessageToChat('ai', escapeHtml(data.error));
                 } else if (data.results && Array.isArray(data.results)) {
                     console.log(`[handleUserInput] Received ${data.results.length} results from ai-advanced-search.`);
                     if (data.results.length > 0 && data.results[0].type !== 'error') {
                         if (lowerQuery.includes('équivalent')) { await addMessageToChat('ai', `Voici des équivalents possibles :`, false); }
                         else { await addMessageToChat('ai', `Voici les résultats pour votre recherche :`, false); }
                         await delay(50);
                     }
                     await displayStructuredResults(data.results);
                 } else {
                     console.warn(`Réponse valide de ${functionToCall} mais format incorrect:`, data);
                     await addMessageToChat('ai', "Désolé, je n'ai pas pu obtenir de résultats structurés.", false);
                 }
            }
            else if (functionToCall === 'ai-general-chat') {
                 if (data.error) {
                     console.warn(`Erreur retournée par la fonction Edge '${functionToCall}':`, data.error);
                     await addMessageToChat('ai', escapeHtml(data.error));
                 } else if (typeof data.reply === 'string') {
                     console.log(`[handleUserInput] Received reply from ai-general-chat.`);
                     await addMessageToChat('ai', data.reply, false);
                 } else {
                     console.warn(`Réponse valide de ${functionToCall} mais format incorrect:`, data);
                     await addMessageToChat('ai', "Désolé, je n'ai pas pu obtenir de réponse textuelle valide.", false);
                 }
            }
             else {
                 console.error("Erreur de logique: functionToCall non reconnue:", functionToCall);
                 await addMessageToChat('ai', "Oups, erreur interne dans le traitement de la réponse IA.");
            }

        } catch (error) { // Gérer les erreurs lancées
            console.error("Erreur majeure handleUserInput:", error);
            await addMessageToChat('ai', `Oups ! Erreur technique: ${error.message}.`);
            resetConversationState();
        } finally {
            // --- 7. Nettoyage et réactivation UI ---
            // Ce bloc finally s'exécute toujours, même après un return anticipé
            // (sauf si une exception non catchée survient avant)
            componentInputChat.disabled = false;
            searchButtonChat.disabled = false;
            loadingIndicatorChat.style.display = 'none';
            componentInputChat.focus();
        }
    }

    // --- Gestion Modale Quantité (+/-) (inchangée) ---
    // ... (handleInventoryRowClick, getBadgeClassForKey, showQuantityModal, hideQuantityModal, updateModalButtonStates, listeners boutons modale) ...
    async function handleInventoryRowClick(event) { const row = event.target.closest('tr.inventory-item-row'); if (!row) return; if (row.classList.contains('drawer-collected-in-bom')) { console.log("Clic sur ligne collectée, modale non ouverte."); return; } if (event.target.classList.contains('kit-select-checkbox')) return; if (event.target.closest('a')) return; if (!currentUser) { showGenericError("Connectez-vous pour modifier les quantités."); loginCodeInput?.focus(); return; } const ref = row.dataset.ref; if (!ref) { console.error("Référence manquante sur la ligne d'inventaire:", row); showGenericError("Erreur: Référence interne manquante."); return; } console.log(`Clic sur ligne inventaire pour ouvrir modale: ${ref}`); row.style.cursor = 'wait'; try { let itemData = null; if (row.dataset.itemData) { try { itemData = JSON.parse(row.dataset.itemData); if (!itemData || typeof itemData.quantity === 'undefined') { console.warn("Données partielles dans data-item-data, refetching...", itemData); itemData = null; } } catch(e) { console.warn("Erreur parsing itemData depuis l'attribut data-item-data:", e); itemData = null; } } if (!itemData) { console.log(`Données non trouvées ou incomplètes dans data-item-data pour ${ref}, refetching from Supabase...`); itemData = await getStockInfoFromSupabase(ref); } if (itemData) { updateSevenSegmentForComponent(itemData.ref); showQuantityModal(itemData.ref, itemData.quantity, itemData.attributes || {}); } else { console.error(`Impossible de récupérer les détails pour le composant ${ref}.`); showGenericError(`Erreur: Impossible de charger les détails pour ${ref}. L'inventaire va être rafraîchi.`); await displayInventory(currentInventoryPage); updateSevenSegmentForComponent(null); } } catch (error) { console.error(`Erreur lors du traitement du clic sur la ligne ${ref}:`, error); showGenericError(`Erreur lors de l'ouverture des détails de ${ref}: ${error.message}`); updateSevenSegmentForComponent(null); } finally { row.style.cursor = ''; } }
    function getBadgeClassForKey(key) { if (!key) return 'badge-color-default'; const lowerKey = key.toLowerCase(); if (lowerKey.includes('volt') || lowerKey.includes('tension')) return 'badge-color-red'; if (lowerKey.includes('package') || lowerKey.includes('boitier') || lowerKey.includes('format')) return 'badge-color-gray'; if (lowerKey.includes('type')) return 'badge-color-blue'; if (lowerKey.includes('capacit') || lowerKey.includes('valeur') || lowerKey.includes('r_sistance') || lowerKey.includes('inductance')) return 'badge-color-green'; if (lowerKey.includes('tol_rance')) return 'badge-color-yellow'; if (lowerKey.includes('puissance')) return 'badge-color-orange'; return 'badge-color-default'; }
    function showQuantityModal(ref, quantity, attributes) { if (!quantityChangeModal || !modalOverlay || !modalRefSpan || !modalQtySpan) return; modalCurrentRef = ref; modalInitialQuantity = quantity; currentModalChange = 0; modalRefSpan.textContent = ref; modalQtySpan.textContent = quantity; if(modalFeedback) { modalFeedback.style.display = 'none'; modalFeedback.textContent = ''; } if (modalAttributesContainer && modalAttributesList && attributes && typeof attributes === 'object' && Object.keys(attributes).length > 0) { modalAttributesList.innerHTML = ''; Object.entries(attributes).forEach(([key, value]) => { if (value !== null && value !== undefined && String(value).trim() !== '') { const badge = document.createElement('span'); badge.classList.add('attribute-badge', getBadgeClassForKey(key)); badge.textContent = `${key}: ${value}`; badge.title = `${key}: ${value}`; modalAttributesList.appendChild(badge); } }); modalAttributesContainer.style.display = 'block'; } else { if (modalAttributesContainer) { modalAttributesContainer.style.display = 'none'; } if (attributes && typeof attributes !== 'object') { console.warn("Format d'attributs invalide pour la modale:", attributes); } } updateModalButtonStates(); modalOverlay.classList.add('active'); quantityChangeModal.classList.add('active'); modalIncreaseButton?.focus(); }
    function hideQuantityModal() { if (!quantityChangeModal || !modalOverlay) return; modalOverlay.classList.remove('active'); quantityChangeModal.classList.remove('active'); modalCurrentRef = null; modalInitialQuantity = 0; currentModalChange = 0; }
    function updateModalButtonStates() { if (!modalDecreaseButton || !modalIncreaseButton || !modalConfirmButton) return; const potentialNewQuantity = modalInitialQuantity + currentModalChange; modalDecreaseButton.disabled = potentialNewQuantity <= 0; modalIncreaseButton.disabled = false; modalConfirmButton.disabled = currentModalChange === 0; }
    modalDecreaseButton?.addEventListener('click', () => { if (modalInitialQuantity + currentModalChange > 0) { currentModalChange--; modalChangeAmountDisplay.textContent = currentModalChange; updateModalButtonStates(); } });
    modalIncreaseButton?.addEventListener('click', () => { currentModalChange++; modalChangeAmountDisplay.textContent = currentModalChange; updateModalButtonStates(); });
    modalCancelButton?.addEventListener('click', hideQuantityModal);
    modalOverlay?.addEventListener('click', (event) => { if(event.target === modalOverlay) { hideQuantityModal(); } });
    modalConfirmButton?.addEventListener('click', async () => { if (!modalCurrentRef || currentModalChange === 0 || !currentUser) { console.warn("Conditions non remplies pour confirmer la modale."); return; } const ref = modalCurrentRef; const change = currentModalChange; const initialQtyBeforeUpdate = modalInitialQuantity; if (modalFeedback) { modalFeedback.textContent = `Mise à jour du stock pour ${ref} (${change > 0 ? '+' : ''}${change})...`; modalFeedback.className = 'modal-feedback info'; modalFeedback.style.display = 'block'; } modalConfirmButton.disabled = true; modalCancelButton.disabled = true; modalDecreaseButton.disabled = true; modalIncreaseButton.disabled = true; try { console.log(`Calling RPC update_stock_and_log from modal for ${ref}, change: ${change}`); const { data: newQuantity, error: rpcError } = await supabase.rpc('update_stock_and_log', { p_ref: ref, p_quantity_change: change, p_user_id: currentUser.id, p_user_code: currentUserCode, p_action_type: 'Modal Adjust' }); if (rpcError) { if (rpcError.message.includes('new_quantity_below_zero')) throw new Error("Stock insuffisant (vérification RPC)."); if (rpcError.message.includes('component_not_found')) throw new Error("Composant non trouvé (peut-être supprimé ?)."); throw new Error(`Erreur RPC: ${rpcError.message}`); } if (modalFeedback) { modalFeedback.textContent = `Stock mis à jour: ${initialQtyBeforeUpdate} -> ${newQuantity}. Fermeture...`; modalFeedback.className = 'modal-feedback success'; } modalQtySpan.textContent = newQuantity; setTimeout(() => { hideQuantityModal(); }, 1200); if (inventoryView.classList.contains('active-view')) await displayInventory(currentInventoryPage); if (auditView.classList.contains('active-view')) await displayAudit(); if (logView.classList.contains('active-view')) await displayLog(1); if (lastDisplayedDrawerRef === ref) await updateSevenSegmentForComponent(ref); const kitIndex = currentKitSelection.findIndex(k => k.ref === ref); if (kitIndex > -1) { currentKitSelection[kitIndex].quantity = newQuantity; await saveKitToSupabase(); if (kitView.classList.contains('active-view')) displayCurrentKitDrawers(); } } catch (err) { console.error("Erreur lors de la confirmation de la modale:", err); if (modalFeedback) { modalFeedback.textContent = `Erreur: ${err.message}`; modalFeedback.className = 'modal-feedback error'; } else { showGenericError(`Erreur modale (${ref}): ${err.message}`); } modalConfirmButton.disabled = (currentModalChange === 0); modalCancelButton.disabled = false; const potentialQtyBeforeError = modalInitialQuantity + currentModalChange; modalDecreaseButton.disabled = potentialQtyBeforeError <= 0; modalIncreaseButton.disabled = false; } });

    // --- Gestion Afficheur 7 Segments (inchangée) ---
    // ... (segmentMap, updateSevenSegmentForComponent, updateSevenSegmentDisplayVisuals) ...
    const segmentMap = { '0':'abcdef', '1':'bc', '2':'abged', '3':'abcdg', '4':'fgbc', '5':'afgcd', '6':'afgcde', '7':'abc', '8':'abcdefg', '9':'abcdfg', 'A':'abcefg', 'B':'fcdeg', 'C':'afed', 'D':'bcdeg', 'E':'afged', 'F':'afge', 'G':'afcde', 'H':'fbceg', 'I':'bc', 'J':'bcde', 'K':'afceg', 'L':'fed', 'M':'aceg', 'N':'abcef', 'O':'abcdef', 'P':'abfeg', 'Q':'abcdfg', 'R':'afge', 'S':'afgcd', 'T':'fged', 'U':'bcdef', 'V':'bcef', 'W':'bdfg', 'X':'fageb', 'Y':'fgbcd', 'Z':'abdeg', '-': 'g', '_': 'd', '.': 'g', '?': 'abgedg', ' ':'', };
    async function updateSevenSegmentForComponent(ref) { if (!sevenSegmentDisplay || !currentUser) { lastDisplayedDrawerRef = null; lastDisplayedDrawerThreshold = null; if (sevenSegmentDisplay) updateSevenSegmentDisplayVisuals('    ', 'off'); return; } lastDisplayedDrawerRef = ref; if (!ref) { updateSevenSegmentDisplayVisuals('----', 'off'); lastDisplayedDrawerThreshold = null; return; } try { const { data: item, error } = await supabase.from('inventory').select('drawer, quantity, critical_threshold').eq('ref', ref).maybeSingle(); if (error && error.code !== 'PGRST116') { throw new Error(`Erreur DB récupération 7seg: ${error.message}`); } if (item && item.drawer) { const drawer = item.drawer.toUpperCase().replace(/\s/g, '_').slice(0, 4).padEnd(4, ' '); const status = getStockStatus(item.quantity, item.critical_threshold); lastDisplayedDrawerThreshold = item.critical_threshold; updateSevenSegmentDisplayVisuals(drawer, status); } else if (item && !item.drawer) { updateSevenSegmentDisplayVisuals('----', 'unknown'); lastDisplayedDrawerThreshold = item.critical_threshold; } else { console.log(`7seg: Composant ${ref} non trouvé.`); updateSevenSegmentDisplayVisuals('NFND', 'critical'); lastDisplayedDrawerThreshold = null; } } catch (err) { console.error(`Erreur mise à jour 7 segments pour ${ref}:`, err); updateSevenSegmentDisplayVisuals('ERR ', 'critical'); lastDisplayedDrawerThreshold = null; } }
    function updateSevenSegmentDisplayVisuals(drawerValue, status = 'unknown') { if (!sevenSegmentDisplay || !segmentDigits || segmentDigits.length < 4) return; if (status === 'off' || !drawerValue || String(drawerValue).trim() === '') { sevenSegmentDisplay.className = 'seven-segment-display display-off'; status = 'off'; } else { sevenSegmentDisplay.className = 'seven-segment-display'; sevenSegmentDisplay.classList.add(`status-${status}`); } for (let i = 0; i < 4; i++) { const digitElement = segmentDigits[i]; if (!digitElement) continue; const char = (drawerValue[i] || ' ').toUpperCase(); const segmentsOn = segmentMap[char] ?? segmentMap['?']; ['a', 'b', 'c', 'd', 'e', 'f', 'g'].forEach(seg => { const segmentElement = digitElement.querySelector(`.segment-${seg}`); if (segmentElement) { if (status !== 'off' && segmentsOn.includes(seg)) { segmentElement.classList.add('on'); } else { segmentElement.classList.remove('on'); } } }); } }

    // --- Logique Vue Paramètres (MODIFIED: handleImportInventoryCSV - Utilise Map et Batching) ---
    // ... (fonctions loadSettingsData, showSettingsFeedback, downloadFile, handleExportInventoryCSV, handleExportLogTXT, resetImportState INCHANGÉES) ...
    function loadSettingsData() { console.log("Vue Paramètres chargée."); if(exportFeedbackDiv) { exportFeedbackDiv.style.display = 'none'; exportFeedbackDiv.textContent = '';} if(importFeedbackDiv) { importFeedbackDiv.style.display = 'none'; importFeedbackDiv.textContent = '';} resetImportState(); }
    function showSettingsFeedback(type, message, level = 'info') { let feedbackDiv; if (type === 'export') feedbackDiv = exportFeedbackDiv; else if (type === 'import') feedbackDiv = importFeedbackDiv; else feedbackDiv = genericFeedbackDiv; if (!feedbackDiv) { console.log(`Settings Feedback (${type}, ${level}): ${message}`); return; } feedbackDiv.textContent = message; feedbackDiv.className = `feedback-area ${level}`; feedbackDiv.style.display = message ? 'block' : 'none'; if (level !== 'error') { setTimeout(() => { if (feedbackDiv.textContent === message) { feedbackDiv.style.display = 'none'; } }, level === 'info' ? 3000 : 5000); } }
    function downloadFile(filename, content, mimeType) { try { const blob = new Blob([content], { type: mimeType }); if (typeof saveAs !== 'undefined') { saveAs(blob, filename); } else { console.warn("FileSaver.js non détecté, utilisation de la méthode de téléchargement standard."); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); } console.log(`Fichier "${filename}" préparé pour le téléchargement.`); } catch (e) { console.error("Erreur lors de la création/téléchargement du fichier:", e); showSettingsFeedback('export', `Erreur lors de la création du fichier: ${e.message}`, 'error'); } }
    async function handleExportInventoryCSV() { showSettingsFeedback('export', 'Préparation de l\'export CSV de l\'inventaire...', 'info'); if (!supabase) { showSettingsFeedback('export', 'Erreur: Client Supabase non initialisé.', 'error'); return; } if (typeof Papa === 'undefined') { showSettingsFeedback('export', 'Erreur: Librairie PapaParse (pour CSV) non chargée.', 'error'); return; } try { console.log("Export CSV: Récupération de tout l'inventaire..."); const { data: allItems, error: fetchError } = await supabase.from('inventory').select(`ref, description, quantity, manufacturer, datasheet, drawer, critical_threshold, attributes, categories ( name )`).order('ref'); if (fetchError) throw new Error(`Erreur lors de la récupération des données: ${fetchError.message}`); console.log(`Export CSV: ${allItems?.length || 0} éléments récupérés.`); if (!allItems || allItems.length === 0) { showSettingsFeedback('export', 'L\'inventaire est vide, rien à exporter.', 'warning'); return; } const csvData = allItems.map(item => ({ ref: item.ref, quantity: item.quantity, description: item.description || '', manufacturer: item.manufacturer || '', datasheet: item.datasheet || '', drawer: item.drawer || '', category_name: item.categories?.name || '', critical_threshold: item.critical_threshold ?? '', attributes: (item.attributes && typeof item.attributes === 'object') ? JSON.stringify(item.attributes) : '' })); const csvString = Papa.unparse(csvData, { header: true, quotes: true, delimiter: ",", newline: "\r\n" }); const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-'); const filename = `stockav_inventory_${timestamp}.csv`; downloadFile(filename, "\uFEFF" + csvString, 'text/csv;charset=utf-8'); showSettingsFeedback('export', `Export CSV (${allItems.length} éléments) réussi.`, 'success'); } catch (err) { console.error("Erreur lors de l'export CSV:", err); showSettingsFeedback('export', `Erreur lors de l'export CSV: ${err.message}`, 'error'); } }
    async function handleExportLogTXT() { showSettingsFeedback('export', 'Préparation de l\'export TXT de l\'historique...', 'info'); if (!supabase) { showSettingsFeedback('export', 'Erreur: Client Supabase non initialisé.', 'error'); return; } try { console.log("Export Log TXT: Récupération de tout l'historique..."); const { data: allLogs, error: fetchError } = await supabase.from('log').select('created_at, user_code, action, item_ref, quantity_change, final_quantity').order('created_at', { ascending: true }); if (fetchError) throw new Error(`Erreur lors de la récupération de l'historique: ${fetchError.message}`); console.log(`Export Log TXT: ${allLogs?.length || 0} entrées récupérées.`); if (!allLogs || allLogs.length === 0) { showSettingsFeedback('export', 'L\'historique est vide, rien à exporter.', 'warning'); return; } let fileContent = `Historique StockAV - Export du ${new Date().toLocaleString('fr-FR')}\n`; fileContent += `=========================================================================================\n`; const dateWidth = 20; const userWidth = 8; const actionWidth = 18; const refWidth = 18; const changeWidth = 10; const finalQtyWidth = 12; fileContent += 'Date & Heure'.padEnd(dateWidth) + ' | ' + 'Tech.'.padEnd(userWidth) + ' | ' + 'Action'.padEnd(actionWidth) + ' | ' + 'Référence'.padEnd(refWidth) + ' | ' + '+/-'.padEnd(changeWidth) + ' | ' + 'Stock Final'.padEnd(finalQtyWidth) + '\n'; fileContent += ''.padEnd(dateWidth, '-') + '-+-' + ''.padEnd(userWidth, '-') + '-+-' + ''.padEnd(actionWidth, '-') + '-+-' + ''.padEnd(refWidth, '-') + '-+-' + ''.padEnd(changeWidth, '-') + '-+-' + ''.padEnd(finalQtyWidth, '-') + '\n'; allLogs.forEach(log => { const date = formatLogTimestamp(log.created_at).padEnd(dateWidth); const user = (log.user_code || 'N/A').toUpperCase().padEnd(userWidth); const action = (log.action || 'Inconnue').padEnd(actionWidth); const ref = (log.item_ref || 'N/A').padEnd(refWidth); const changeNum = log.quantity_change; let changeStr = 'N/A'; if (changeNum !== null && changeNum !== undefined) { changeStr = changeNum > 0 ? `+${changeNum}` : String(changeNum); } const change = changeStr.padEnd(changeWidth); const finalQty = (log.final_quantity === null || log.final_quantity === undefined ? 'N/A' : log.final_quantity).toString().padEnd(finalQtyWidth); fileContent += `${date} | ${user} | ${action} | ${ref} | ${change} | ${finalQty}\n`; }); const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-'); const filename = `stockav_log_${timestamp}.txt`; downloadFile(filename, fileContent, 'text/plain;charset=utf-8'); showSettingsFeedback('export', `Export TXT (${allLogs.length} entrées) réussi.`, 'success'); } catch (err) { console.error("Erreur lors de l'export TXT de l'historique:", err); showSettingsFeedback('export', `Erreur lors de l'export TXT: ${err.message}`, 'error'); } }
    function resetImportState() { if(importCsvFileInput) { importCsvFileInput.value = ''; importCsvFileInput.disabled = false; } if(importInventoryCsvButton) importInventoryCsvButton.disabled = false; document.querySelectorAll('input[name="import-mode"]').forEach(radio => radio.disabled = false); const enrichRadio = document.getElementById('import-mode-enrich'); if (enrichRadio) enrichRadio.checked = true; if (importFeedbackDiv && !importFeedbackDiv.classList.contains('error')) { importFeedbackDiv.style.display = 'none'; importFeedbackDiv.textContent = ''; } }

    // --- MODIFIED: handleImportInventoryCSV - Utilise Map pour garder dernière occurrence ET Batching pour l'upsert ---
    async function handleImportInventoryCSV() {
        if (!importCsvFileInput?.files || importCsvFileInput.files.length === 0) {
            showSettingsFeedback('import', 'Veuillez d\'abord sélectionner un fichier CSV.', 'warning');
            return;
        }
        if (!supabase) {
            showSettingsFeedback('import', 'Erreur: Client Supabase non initialisé.', 'error');
            return;
        }
        if (typeof Papa === 'undefined') {
            showSettingsFeedback('import', 'Erreur: Librairie PapaParse (pour CSV) non chargée.', 'error');
            return;
        }

        const file = importCsvFileInput.files[0];
        const modeRadio = document.querySelector('input[name="import-mode"]:checked');
        const importMode = modeRadio ? modeRadio.value : 'enrich';

        if (importMode === 'overwrite') {
            if (!confirm("ATTENTION !\n\nLe mode 'Écraser et Remplacer' va SUPPRIMER TOUT l'inventaire et TOUT l'historique actuels avant d'importer le nouveau fichier.\n\nCette action est IRRÉVERSIBLE.\n\nÊtes-vous absolument sûr de vouloir continuer ?")) {
                showSettingsFeedback('import', 'Importation annulée par l\'utilisateur.', 'info');
                resetImportState();
                return;
            }
        }

        showSettingsFeedback('import', `Importation CSV en mode '${importMode}'... Lecture du fichier "${file.name}"...`, 'info');
        importInventoryCsvButton.disabled = true;
        importCsvFileInput.disabled = true;
        document.querySelectorAll('input[name="import-mode"]').forEach(radio => radio.disabled = true);

        try {
            await getCategories(); // Assurer que le cache des catégories est à jour
            const categoryNameToIdMap = new Map(categoriesCache.map(cat => [cat.name.toLowerCase(), cat.id]));
            // console.log("Import CSV: Map Nom Catégorie -> ID créée:", categoryNameToIdMap); // Log commenté

            const standardColumns = new Set([
                'ref', 'quantity', 'description', 'manufacturer', 'mfg',
                'datasheet', 'drawer', 'category_name', 'critical_threshold', 'threshold',
                'attributes'
            ]);

            Papa.parse(file, {
                header: true,
                skipEmptyLines: 'greedy',
                encoding: "UTF-8", // Assurer l'encodage UTF-8
                transformHeader: header => header.trim().toLowerCase().replace(/\s+/g, '_'),
                complete: async (results) => {
                    const data = results.data;
                    const errors = results.errors;
                    const headers = results.meta.fields;
                    // console.log("Import CSV: Parsing terminé.", results.meta); // Log commenté
                    // console.log("Import CSV: Headers détectés (après transformation):", headers); // Log commenté

                    if (errors.length > 0) {
                        console.error("Import CSV: Erreurs lors du parsing PapaParse:", errors);
                        const firstError = errors[0];
                        throw new Error(`Erreur de parsing CSV à la ligne ${firstError.row + 2}: ${firstError.message}. Vérifiez le format du fichier.`);
                    }

                    const requiredHeaders = ['ref', 'quantity'];
                    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
                    if (missingHeaders.length > 0) {
                        throw new Error(`Erreur CSV: Les colonnes requises suivantes sont manquantes: ${missingHeaders.join(', ')}.`);
                    }

                    if (data.length === 0) {
                        showSettingsFeedback('import', 'Le fichier CSV est vide ou ne contient aucune donnée valide.', 'warning');
                        resetImportState();
                        return;
                    }

                    showSettingsFeedback('import', `Lecture CSV réussie (${data.length} lignes trouvées). Validation et préparation des données finales...`, 'info');
                    let itemsDataMap = new Map(); // <<< CORRECTION: Utilisation d'une Map pour stocker la dernière version de chaque ref >>>
                    const processingErrors = [];

                    if (importMode === 'overwrite') {
                        showSettingsFeedback('import', `Mode Écraser: Suppression de l'historique existant...`, 'info');
                        // console.log("Import CSV (Overwrite): Deleting log entries..."); // Log commenté
                        const { error: deleteLogError } = await supabase.from('log').delete().neq('id', 0); // Adaptez si id n'est pas la clé primaire ou si vous ne voulez pas supprimer absolument tout
                        if (deleteLogError) throw new Error(`Échec de la suppression de l'historique: ${deleteLogError.message}`);

                        showSettingsFeedback('import', `Mode Écraser: Suppression de l'inventaire existant...`, 'info');
                        // console.log("Import CSV (Overwrite): Deleting inventory items..."); // Log commenté
                        const { error: deleteInvError } = await supabase.from('inventory').delete().neq('ref', 'dummy_ref_to_ensure_deletion'); // Utiliser une ref qui n'existe pas
                        if (deleteInvError) throw new Error(`Échec de la suppression de l'inventaire: ${deleteInvError.message}`);
                        // console.log("Import CSV (Overwrite): Ancien stock et historique supprimés."); // Log commenté
                        showSettingsFeedback('import', `Ancien stock/log supprimé. Validation et préparation de ${data.length} lignes...`, 'info');
                    }

                    // --- Boucle de validation et de mise en Map ---
                    for (let i = 0; i < data.length; i++) {
                        const row = data[i];
                        const lineNumber = i + 2; // +1 pour l'index 0, +1 pour le header
                        let currentItemData = {}; // Données pour cette ligne spécifique
                        let dynamicAttributes = {};
                        let explicitAttributes = null;

                        // --- Traitement de chaque colonne de la ligne ---
                        for (const [rawHeader, rawValue] of Object.entries(row)) {
                            const header = rawHeader.trim(); // Header déjà transformé par PapaParse
                            const value = (rawValue !== null && rawValue !== undefined) ? String(rawValue).trim() : null;

                            // Ignorer les cellules vides sauf pour la quantité qui peut être 0
                            if (!header || (value === null || value === '') && header !== 'quantity') {
                                continue;
                            }

                            // --- Traitement des colonnes standard connues ---
                            if (standardColumns.has(header)) {
                                switch (header) {
                                    case 'ref': currentItemData.ref = value?.toUpperCase(); break;
                                    case 'quantity':
                                        const qty = parseInt(value, 10);
                                        if (value === null || value === '' || isNaN(qty) || qty < 0) {
                                            processingErrors.push(`L${lineNumber} (${currentItemData.ref || 'REF_MANQUANTE'}): Quantité invalide: "${value}". Sera mis à 0.`);
                                            currentItemData.quantity = 0;
                                        } else {
                                            currentItemData.quantity = qty;
                                        }
                                        break;
                                    case 'description': currentItemData.description = value; break;
                                    case 'manufacturer': case 'mfg': currentItemData.manufacturer = value; break;
                                    case 'datasheet': currentItemData.datasheet = value; break;
                                    case 'drawer': currentItemData.drawer = value?.toUpperCase(); break;
                                    case 'category_name':
                                        const categoryName = value?.toLowerCase();
                                        if (categoryName) {
                                            currentItemData.category_id = categoryNameToIdMap.get(categoryName);
                                            if (!currentItemData.category_id) {
                                                processingErrors.push(`L${lineNumber} (${currentItemData.ref}): Catégorie "${value}" non trouvée.`);
                                                currentItemData.category_id = null; // Mettre à null si non trouvée
                                            }
                                        } else { currentItemData.category_id = null; }
                                        break;
                                    case 'critical_threshold': case 'threshold':
                                        const threshold = parseInt(value, 10);
                                        if (value && !isNaN(threshold) && threshold >= 0) { currentItemData.critical_threshold = threshold; }
                                        else if (value) { // Si une valeur est fournie mais invalide
                                            processingErrors.push(`L${lineNumber} (${currentItemData.ref}): Seuil critique invalide: "${value}".`);
                                            currentItemData.critical_threshold = null;
                                        } else { currentItemData.critical_threshold = null; } // Pas de valeur fournie
                                        break;
                                    case 'attributes':
                                        if (value) {
                                            try {
                                                explicitAttributes = JSON.parse(value);
                                                if (typeof explicitAttributes !== 'object' || explicitAttributes === null || Array.isArray(explicitAttributes)) {
                                                    processingErrors.push(`L${lineNumber} (${currentItemData.ref}): Colonne 'attributes' doit être un objet JSON valide. Ignoré.`);
                                                    explicitAttributes = null;
                                                }
                                            } catch (e) {
                                                processingErrors.push(`L${lineNumber} (${currentItemData.ref}): Erreur parsing JSON colonne 'attributes': ${e.message}. Ignoré.`);
                                                explicitAttributes = null;
                                            }
                                        }
                                        break;
                                }
                            }
                            // --- Traitement des colonnes non standard (attributs dynamiques) ---
                            else {
                                // Ne stocker que si la valeur n'est pas vide
                                if (value !== null && value !== '') {
                                    dynamicAttributes[header] = value; // Le header est déjà nettoyé
                                }
                            }
                        } // Fin boucle sur les colonnes de la ligne

                        // --- Validation finale de la ligne courante ---
                        if (!currentItemData.ref) { processingErrors.push(`L${lineNumber}: Référence manquante.`); continue; /* Passer à la ligne suivante */ }
                        if (currentItemData.ref.length > 50) { processingErrors.push(`L${lineNumber} (${currentItemData.ref}): Référence trop longue.`); continue; }
                         if (currentItemData.quantity === undefined) { // Vérifier si la quantité a été définie (même à 0)
                             processingErrors.push(`L${lineNumber} (${currentItemData.ref}): Quantité manquante. Mis à 0.`);
                             currentItemData.quantity = 0;
                         }
                         // Autres validations possibles ici (format tiroir, URL datasheet...)

                        // --- Fusion des attributs explicites et dynamiques ---
                        let finalAttributes = {};
                        if (explicitAttributes) { finalAttributes = { ...explicitAttributes }; }
                        // Les attributs dynamiques écrasent les attributs explicites s'ils ont le même nom (comportement choisi)
                        if (Object.keys(dynamicAttributes).length > 0) { finalAttributes = { ...finalAttributes, ...dynamicAttributes }; }
                        currentItemData.attributes = Object.keys(finalAttributes).length > 0 ? finalAttributes : null; // Mettre null si vide

                        // --- Formatage final de l'objet pour Supabase ---
                        const finalItemData = {
                            ref: currentItemData.ref,
                            quantity: currentItemData.quantity,
                            description: currentItemData.description || null,
                            manufacturer: currentItemData.manufacturer || null,
                            datasheet: currentItemData.datasheet || null,
                            drawer: currentItemData.drawer || null,
                            category_id: currentItemData.category_id || null,
                            critical_threshold: currentItemData.critical_threshold !== undefined ? currentItemData.critical_threshold : null,
                            attributes: currentItemData.attributes // Est déjà null si vide
                        };

                        // <<< CORRECTION: Utilisation de la Map pour écraser les entrées précédentes avec la même ref >>>
                        itemsDataMap.set(finalItemData.ref, finalItemData);

                    } // Fin boucle FOR sur les lignes data

                    // Convertir la Map en tableau pour l'upsert
                    const itemsToUpsert = Array.from(itemsDataMap.values());
                    // console.log(`Import CSV: ${itemsToUpsert.length} lignes uniques (basées sur 'ref') préparées pour l'upsert.`); // Log commenté

                    // --- Gestion des erreurs de validation ---
                    if (processingErrors.length > 0) {
                        const errorMsg = `Validation terminée avec ${processingErrors.length} erreurs/warnings (voir console). ${itemsToUpsert.length} lignes uniques seront traitées pour import/mise à jour.`;
                        showSettingsFeedback('import', errorMsg, 'warning');
                        console.warn("Import CSV: Erreurs/Warnings de validation (n'inclut pas les écrasements de lignes pour même ref):", processingErrors);
                        // Ne pas arrêter si des lignes valides restent, sauf si aucune ligne n'est valide
                        if (itemsToUpsert.length === 0) {
                             throw new Error("Aucune ligne valide à importer après validation.");
                         }
                    } else {
                         showSettingsFeedback('import', `Validation OK. ${itemsToUpsert.length} lignes uniques prêtes pour import/mise à jour...`, 'info');
                     }

                    // --- <<< CORRECTION: Upsert par lots >>> ---
                    const batchSize = 500; // Taille de lot raisonnable, ajustable si nécessaire
                    let processedCount = 0;
                    // console.log(`Import CSV: Début de l'upsert par lots de ${batchSize}...`); // Log commenté

                    for (let i = 0; i < itemsToUpsert.length; i += batchSize) {
                        const batch = itemsToUpsert.slice(i, i + batchSize);
                        const batchNum = Math.floor(i / batchSize) + 1;
                        const totalBatches = Math.ceil(itemsToUpsert.length / batchSize);
                        showSettingsFeedback('import', `Traitement du lot ${batchNum}/${totalBatches} (${batch.length} lignes)...`, 'info');
                        // console.log(`Import CSV: Upserting batch ${batchNum} (${batch.length} items)...`); // Log commenté

                        // L'erreur "cannot affect row a second time" ne devrait plus se produire ici grâce à la Map
                        const { error: upsertError } = await supabase
                            .from('inventory')
                            .upsert(batch, { onConflict: 'ref' }); // Important: garder onConflict pour le mode 'enrich'

                        if (upsertError) {
                            let detailMsg = upsertError.message;
                            if (upsertError.details) detailMsg += ` | Détails: ${upsertError.details}`;
                            if (upsertError.hint) detailMsg += ` | Indice: ${upsertError.hint}`;
                            console.error("Import CSV: Erreur lors de l'Upsert du lot:", detailMsg, upsertError);
                            throw new Error(`Erreur lors de l'importation du lot ${batchNum}: ${detailMsg}`);
                        }
                        processedCount += batch.length;
                        // console.log(`Import CSV: Lot ${batchNum} traité avec succès.`); // Log commenté
                    }
                    // --- Fin de l'Upsert par lots ---

                    // --- Message Final de Succès ---
                    let successMsg = `Importation en mode '${importMode}' terminée. ${processedCount} références uniques traitées (basé sur la dernière occurrence dans le CSV).`;
                    if (processingErrors.length > 0) {
                         successMsg += ` (${processingErrors.length} erreurs/warnings durant la validation - voir console).`;
                    }
                    showSettingsFeedback('import', successMsg, 'success');
                    // console.log("Import CSV: Importation terminée."); // Log commenté

                    // --- Mise à jour de l'UI ---
                    invalidateCategoriesCache(); // Regénérer cache catégories au cas où de nouvelles sont apparues via import
                    if (inventoryView.classList.contains('active-view')) await displayInventory(1);
                    if (auditView.classList.contains('active-view')) await displayAudit();
                    if (importMode === 'overwrite' && logView.classList.contains('active-view')) await displayLog(1); // Rafraichir log si écrasement
                    if(adminView.classList.contains('active-view')) await loadAdminData(); // Mettre à jour listes admin

                }, // Fin 'complete'
                error: (err, file) => {
                    console.error("Import CSV: Erreur majeure PapaParse:", err, file);
                    showSettingsFeedback('import', `Erreur critique lors de la lecture du fichier CSV: ${err.message}`, 'error');
                }
            }); // Fin Papa.parse

        } catch (err) {
            console.error("Erreur globale lors du processus d'importation CSV:", err);
            showSettingsFeedback('import', `Erreur d'importation: ${err.message}`, 'error');
        } finally {
             // Ne réinitialiser l'état que si l'opération n'a pas terminé sur une erreur
             if (!importFeedbackDiv?.classList.contains('error')) {
                 resetImportState();
             } else {
                 // Garder les boutons désactivés en cas d'erreur pour éviter ré-essai accidentel
                 importInventoryCsvButton.disabled = true;
                 importCsvFileInput.disabled = true;
                 document.querySelectorAll('input[name="import-mode"]').forEach(radio => radio.disabled = true);
             }
        }
    }
    // --- FIN MODIFIED: handleImportInventoryCSV ---

    function addSettingsEventListeners() { exportInventoryCsvButton?.addEventListener('click', handleExportInventoryCSV); exportLogTxtButton?.addEventListener('click', handleExportLogTXT); importInventoryCsvButton?.addEventListener('click', handleImportInventoryCSV); importCsvFileInput?.addEventListener('change', () => { if (importCsvFileInput.files && importCsvFileInput.files.length > 0) { showSettingsFeedback('import', `Fichier sélectionné: ${importCsvFileInput.files[0].name}`, 'info'); } else { showSettingsFeedback('import', '', 'info'); } }); }

    // --- FONCTIONS POUR L'AUDIT (inchangées) ---
    // ... (populateAuditFilters, displayAudit, updateDifferenceAndButtonState, handleAdjustStock, showAuditFeedback) ...
    async function populateAuditFilters() { if (!auditCategoryFilter) return; try { const currentCategoryValue = auditCategoryFilter.value; auditCategoryFilter.innerHTML = '<option value="all">Toutes les catégories</option>'; if (categoriesCache.length === 0 && currentUser) await getCategories(); categoriesCache.sort((a, b) => a.name.localeCompare(b.name)).forEach(cat => { const option = document.createElement('option'); option.value = cat.id; option.textContent = escapeHtml(cat.name); auditCategoryFilter.appendChild(option); }); if (categoriesCache.some(cat => String(cat.id) === String(currentCategoryValue))) { auditCategoryFilter.value = currentCategoryValue; } else { auditCategoryFilter.value = 'all'; } } catch (err) { console.error("Erreur lors de la population des filtres d'audit:", err); auditCategoryFilter.innerHTML = '<option value="all" disabled>Erreur chargement</option>'; } }
    async function displayAudit() { if (!auditTableBody || !supabase || !currentUser) { if (auditTableBody) auditTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">${currentUser ? 'Erreur interne ou DOM manquant.' : 'Connexion requise pour l\'audit.'}</td></tr>`; return; } auditTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;"><i>Chargement de la liste d'audit...</i></td></tr>`; if(auditNoResults) auditNoResults.style.display = 'none'; showAuditFeedback('', 'info', true); const categoryId = auditCategoryFilter?.value || 'all'; const drawerFilter = auditDrawerFilter?.value.trim().toUpperCase() || ''; try { let query = supabase.from('inventory').select('ref, description, drawer, quantity').order('drawer', { ascending: true, nullsFirst: false }).order('ref', { ascending: true }); if (categoryId !== 'all') { query = query.eq('category_id', categoryId); } if (drawerFilter) { const drawerPattern = drawerFilter.replace(/\*/g, '%'); query = query.ilike('drawer', drawerPattern); } console.log("Executing audit query..."); const { data, error } = await query; auditTableBody.innerHTML = ''; if (error) { throw new Error(`Erreur base de données lors de la récupération pour l'audit: ${error.message}`); } if (!data || data.length === 0) { if (auditNoResults) { auditNoResults.textContent = "Aucun composant trouvé correspondant aux filtres sélectionnés."; auditTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 20px;">${auditNoResults.textContent}</td></tr>`; auditNoResults.style.display = 'none'; } } else { if (auditNoResults) auditNoResults.style.display = 'none'; data.forEach(item => { const row = auditTableBody.insertRow(); row.dataset.ref = item.ref; row.insertCell().textContent = item.ref; row.insertCell().textContent = item.description || '-'; row.insertCell().textContent = item.drawer || 'N/A'; const systemQtyCell = row.insertCell(); systemQtyCell.textContent = item.quantity; systemQtyCell.dataset.systemQuantity = item.quantity; systemQtyCell.classList.add('system-qty'); const physicalQtyCell = row.insertCell(); const input = document.createElement('input'); input.type = 'number'; input.min = '0'; input.classList.add('physical-qty-input'); input.dataset.ref = item.ref; input.value = item.quantity; input.addEventListener('input', () => updateDifferenceAndButtonState(row)); input.addEventListener('change', () => updateDifferenceAndButtonState(row)); input.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); const adjustButton = row.querySelector('button.adjust-button'); if (adjustButton && !adjustButton.disabled) { adjustButton.click(); } } }); physicalQtyCell.appendChild(input); const diffCell = row.insertCell(); diffCell.classList.add('difference'); diffCell.textContent = '0'; const actionCell = row.insertCell(); const button = document.createElement('button'); button.textContent = 'Ajuster'; button.classList.add('adjust-button', 'action-button', 'primary'); button.disabled = true; button.addEventListener('click', () => handleAdjustStock(row, button, input)); actionCell.appendChild(button); updateDifferenceAndButtonState(row); }); } } catch (err) { console.error("Erreur lors de l'affichage de l'audit:", err); auditTableBody.innerHTML = `<tr><td colspan="7" class="error-message" style="text-align:center; color: var(--error-color);">Erreur chargement audit: ${err.message}</td></tr>`; if (auditNoResults) { auditNoResults.textContent = 'Erreur lors du chargement des données d\'audit.'; auditNoResults.style.display = 'block'; } } }
    function updateDifferenceAndButtonState(row) { const systemQtyCell = row.cells[3]; const physicalInput = row.querySelector('input.physical-qty-input'); const diffCell = row.cells[5]; const adjustButton = row.querySelector('button.adjust-button'); if (!systemQtyCell || !physicalInput || !diffCell || !adjustButton) { console.error("Éléments manquants dans la ligne d'audit pour màj différence."); return; } const systemQty = parseInt(systemQtyCell.dataset.systemQuantity, 10); const physicalQtyRaw = physicalInput.value; let physicalQty = NaN; if (physicalQtyRaw !== '' && !isNaN(parseInt(physicalQtyRaw, 10)) && parseInt(physicalQtyRaw, 10) >= 0) { physicalQty = parseInt(physicalQtyRaw, 10); physicalInput.classList.remove('input-error'); } else { physicalInput.classList.add('input-error'); } if (!isNaN(physicalQty)) { const difference = physicalQty - systemQty; diffCell.textContent = difference; diffCell.classList.toggle('positive', difference > 0); diffCell.classList.toggle('negative', difference < 0); diffCell.classList.remove('error-state'); adjustButton.disabled = (difference === 0 || adjustButton.classList.contains('adjusted')); if (adjustButton.classList.contains('adjusted') && difference === 0) { adjustButton.textContent = 'Ajusté ✔'; } else { adjustButton.textContent = 'Ajuster'; } } else { diffCell.textContent = 'ERR'; diffCell.className = 'difference error-state'; adjustButton.disabled = true; adjustButton.textContent = 'Ajuster'; } }
    async function handleAdjustStock(row, button, input) { if (!row || !button || !input || !currentUser) return; const ref = row.dataset.ref; const systemQtyCell = row.cells[3]; const systemQty = parseInt(systemQtyCell.dataset.systemQuantity, 10); const physicalQtyRaw = input.value; const physicalQty = parseInt(physicalQtyRaw, 10); if (!ref) { showAuditFeedback(`Erreur: Référence manquante pour l'ajustement.`, 'error'); return; } if (isNaN(physicalQty) || physicalQty < 0) { showAuditFeedback(`Valeur physique entrée pour ${ref} est invalide (${physicalQtyRaw}). Ajustement annulé.`, 'error'); input.classList.add('input-error'); input.focus(); return; } const difference = physicalQty - systemQty; if (difference === 0) { showAuditFeedback(`Aucun ajustement nécessaire pour ${ref} (quantités identiques).`, 'info', true); button.disabled = true; return; } button.disabled = true; button.textContent = 'Ajustement...'; input.disabled = true; try { console.log(`Calling RPC update_stock_and_log from Audit for ${ref}, change: ${difference}`); const { data: newQuantity, error: rpcError } = await supabase.rpc('update_stock_and_log', { p_ref: ref, p_quantity_change: difference, p_user_id: currentUser.id, p_user_code: currentUserCode, p_action_type: 'Audit Adjust' }); if (rpcError) { if (rpcError.message.includes('new_quantity_below_zero')) throw new Error("Stock système incohérent (résultat négatif après RPC)."); if (rpcError.message.includes('component_not_found')) throw new Error("Composant non trouvé lors de l'ajustement (peut-être supprimé ?)."); throw new Error(`Erreur RPC: ${rpcError.message}`); } systemQtyCell.textContent = newQuantity; systemQtyCell.dataset.systemQuantity = newQuantity; input.value = newQuantity; input.classList.remove('input-error'); input.disabled = false; updateDifferenceAndButtonState(row); button.textContent = 'Ajusté ✔'; button.classList.add('adjusted'); button.disabled = true; row.classList.add('row-highlighted-success'); setTimeout(() => row.classList.remove('row-highlighted-success'), 2500); showAuditFeedback(`Stock pour ${ref} ajusté avec succès: ${systemQty} -> ${newQuantity}.`, 'success'); if (inventoryView.classList.contains('active-view')) await displayInventory(currentInventoryPage); if (logView.classList.contains('active-view')) await displayLog(1); if (lastDisplayedDrawerRef === ref) await updateSevenSegmentForComponent(ref); const kitIndex = currentKitSelection.findIndex(k => k.ref === ref); if (kitIndex > -1) { currentKitSelection[kitIndex].quantity = newQuantity; await saveKitToSupabase(); if (kitView.classList.contains('active-view')) displayCurrentKitDrawers(); } } catch (err) { console.error(`Erreur lors de l'ajustement du stock pour ${ref}:`, err); showAuditFeedback(`Erreur ajustement ${ref}: ${err.message}`, 'error'); button.textContent = 'Erreur!'; button.disabled = false; input.disabled = false; input.focus(); row.classList.add('row-highlighted-error'); setTimeout(() => row.classList.remove('row-highlighted-error'), 3500); } }
    function showAuditFeedback(message, type = 'info', instantHide = false) { if (!auditFeedbackDiv) { console.log(`Audit Feedback (${type}): ${message}`); return; } auditFeedbackDiv.textContent = message; auditFeedbackDiv.className = `feedback-area ${type}`; auditFeedbackDiv.style.display = message ? 'block' : 'none'; if (type !== 'error') { const delay = instantHide ? 0 : 4000; setTimeout(() => { if (auditFeedbackDiv.textContent === message) { auditFeedbackDiv.style.display = 'none'; } }, delay); } }

    // --- KIT ACTUEL / PRÉLÈVEMENT (Vue index.html) (inchangé) ---
    // ... (handleKitCheckboxChange, displayCurrentKitDrawers, handleDrawerButtonClick, handleClearKit) ...
    function handleKitCheckboxChange(event) { const checkbox = event.target; if (!checkbox || checkbox.type !== 'checkbox' || !checkbox.classList.contains('kit-select-checkbox') || !inventoryTableBody?.contains(checkbox)) { return; } if (!currentUser) { checkbox.checked = !checkbox.checked; showGenericError("Vous devez être connecté pour gérer le kit."); return; } const ref = checkbox.dataset.ref; const row = checkbox.closest('tr'); if (!ref || !row || !row.dataset.itemData) { console.error("Données manquantes (ref ou itemData) sur la ligne pour la checkbox du kit.", checkbox, row); checkbox.checked = !checkbox.checked; showGenericError("Erreur lors de la sélection du composant pour le kit."); return; } if (row.classList.contains('drawer-collected-in-bom')) { checkbox.checked = !checkbox.checked; showKitFeedback("Impossible de modifier la sélection : le tiroir est déjà marqué comme collecté.", 'warning', 4000); return; } try { const itemData = JSON.parse(row.dataset.itemData); let kitWasModified = false; if (checkbox.checked) { if (!currentKitSelection.some(item => item.ref === ref)) { currentKitSelection.push({ ...itemData }); console.log(`Ajout au kit local: ${ref}`, itemData); row.classList.add('kit-selected'); kitWasModified = true; } else { console.warn(`Tentative d'ajout de ${ref} au kit local alors qu'il y est déjà.`); } } else { const indexToRemove = currentKitSelection.findIndex(item => item.ref === ref); if (indexToRemove > -1) { currentKitSelection.splice(indexToRemove, 1); console.log(`Retiré du kit local: ${ref}`); row.classList.remove('kit-selected'); kitWasModified = true; } else { console.warn(`Tentative de retrait de ${ref} du kit local alors qu'il n'y est pas.`); } } if (kitWasModified) { saveKitToSupabase(); } if (kitView?.classList.contains('active-view')) { displayCurrentKitDrawers(); } } catch (error) { console.error(`Erreur lors de la gestion de la sélection kit pour ${ref}:`, error); checkbox.checked = !checkbox.checked; showGenericError(`Erreur lors de la sélection de ${ref} pour le kit: ${error.message}`); } }
    function displayCurrentKitDrawers() { if (!currentKitDrawersDiv || !kitFeedbackDiv) { console.error("Éléments DOM manquants pour la vue Kit (#current-kit-drawers / #bom-feedback)."); return; } currentKitDrawersDiv.innerHTML = ''; if (!currentUser) { currentKitDrawersDiv.innerHTML = '<p><i>Connectez-vous pour utiliser le kit.</i></p>'; if (kitFeedbackDiv) kitFeedbackDiv.style.display = 'none'; return; } if (currentKitSelection.length === 0) { currentKitDrawersDiv.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px 0;"><i>Le kit est vide. Sélectionnez des composants dans l\'onglet Inventaire.</i></p>'; if (kitFeedbackDiv) kitFeedbackDiv.style.display = 'none'; return; } const drawersMap = new Map(); currentKitSelection.forEach(item => { const drawerKey = item.drawer?.trim().toUpperCase() || 'TIROIR_INCONNU'; if (!drawersMap.has(drawerKey)) { drawersMap.set(drawerKey, { items: [] }); } drawersMap.get(drawerKey).items.push(item); }); const sortedDrawers = Array.from(drawersMap.keys()).sort((a, b) => { if (a === 'TIROIR_INCONNU') return 1; if (b === 'TIROIR_INCONNU') return -1; return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }); }); sortedDrawers.forEach(drawerKey => { const drawerData = drawersMap.get(drawerKey); const itemsInDrawer = drawerData.items; let worstStatus = 'ok'; let statusPriority = { ok: 1, warning: 2, critical: 3, unknown: 0 }; itemsInDrawer.forEach(item => { const itemStatus = getStockStatus(item.quantity, item.critical_threshold); if (statusPriority[itemStatus] > statusPriority[worstStatus]) { worstStatus = itemStatus; } }); const button = document.createElement('button'); button.classList.add('drawer-button'); button.classList.add(`status-${worstStatus}`); button.dataset.drawer = drawerKey; button.textContent = drawerKey === 'TIROIR_INCONNU' ? '?' : drawerKey; let tooltipContent = `Tiroir: ${drawerKey === 'TIROIR_INCONNU' ? 'Non défini' : drawerKey}\n`; tooltipContent += `Statut (pire): ${worstStatus.toUpperCase()}\n`; tooltipContent += `------------------------------\nComposants dans ce tiroir:\n`; itemsInDrawer.forEach(item => { const itemStatus = getStockStatus(item.quantity, item.critical_threshold); tooltipContent += `- ${item.ref} (Stock: ${item.quantity ?? 'N/A'}, Statut: ${itemStatus.toUpperCase()})\n`; }); button.title = tooltipContent.trim(); if (collectedDrawersSet.has(drawerKey)) { button.classList.add('collected'); } currentKitDrawersDiv.appendChild(button); }); if (kitFeedbackDiv && kitFeedbackDiv.textContent === '' && currentKitSelection.length > 0) { kitFeedbackDiv.style.display = 'none'; } }
    function handleDrawerButtonClick(event) { const button = event.target.closest('.drawer-button'); if (!button || !currentKitDrawersDiv?.contains(button)) return; button.classList.toggle('collected'); const drawer = button.dataset.drawer; const isCollected = button.classList.contains('collected'); console.log(`Tiroir ${drawer} marqué visuellement comme ${isCollected ? 'collecté' : 'non collecté'} (index.html - Affichage seulement).`); }
    async function handleClearKit() { if (!currentUser) { showKitFeedback("Vous devez être connecté pour vider le kit.", 'error'); return; } console.log("Vidage du kit actuel..."); const itemsClearedCount = currentKitSelection.length; currentKitSelection = []; collectedDrawersSet = new Set(); const clearedInDb = await clearKitInSupabase(); await refreshKitRelatedUI(); if (clearedInDb && itemsClearedCount > 0) { showKitFeedback("Le kit actuel a été vidé (y compris l'état collecté).", 'success'); } else if (!clearedInDb && itemsClearedCount > 0) { showKitFeedback("Erreur lors du vidage du kit en base de données.", 'error'); } else if (itemsClearedCount === 0) { showKitFeedback("Le kit était déjà vide.", 'info'); } }

    // --- ÉCOUTEUR REALTIME POUR USER_KITS (inchangé) ---
    // ... (compareCollectedDrawers, setupUserKitRealtimeListener, removeUserKitRealtimeListener) ...
    function compareCollectedDrawers(arr1, arr2) { const set1 = new Set(arr1 || []); const set2 = new Set(arr2 || []); if (set1.size !== set2.size) { return false; } for (const item of set1) { if (!set2.has(item)) { return false; } } return true; }
    async function setupUserKitRealtimeListener() { if (!supabase) { console.warn("Realtime Listener: Supabase non prêt."); return; } if (!currentUser) { console.log("Realtime Listener: Pas d'utilisateur connecté."); return; } if (userKitRealtimeSubscription) { console.log("Realtime Listener: Déjà abonné."); return; } const channelName = `user_kit_updates_main_app_${currentUser.id}`; console.log(`>>> Realtime: Tentative de connexion au canal: ${channelName}`); userKitRealtimeSubscription = supabase.channel(channelName) .on( 'postgres_changes', { event: '*', schema: 'public', table: 'user_kits', filter: `user_id=eq.${currentUser.id}` }, async (payload) => { console.log('>>> Realtime Change Received (Main App):', payload); if (payload.eventType === 'DELETE') { console.log("   Realtime: DELETE event detected. Kit utilisateur supprimé."); currentKitSelection = []; collectedDrawersSet = new Set(); await refreshKitRelatedUI(); showKitFeedback("Votre kit a été vidé depuis une autre source.", "warning", 5000); } else if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') { const newRecord = payload.new; const oldRecord = payload.old; if (!newRecord) { console.warn("   Realtime: Received INSERT/UPDATE without 'new' data. Ignoré.", payload); return; } const oldCollected = oldRecord?.collected_drawers || []; const newCollected = newRecord.collected_drawers || []; const collectedChanged = !compareCollectedDrawers(oldCollected, newCollected); if (collectedChanged) { console.log("   Realtime: collected_drawers a changé !"); collectedDrawersSet = new Set(newCollected); console.log(`   Realtime: collectedDrawersSet local mis à jour (${collectedDrawersSet.size} tiroirs).`); await refreshKitRelatedUI(); } else { console.log("   Realtime: collected_drawers n'a pas changé. Vérification kit_data..."); const kitDataChanged = JSON.stringify(oldRecord?.kit_data) !== JSON.stringify(newRecord.kit_data); if (kitDataChanged) { console.log("   Realtime: kit_data a changé. Rechargement complet du kit local..."); await loadKitFromSupabase(); showKitFeedback("Le contenu du kit a été mis à jour depuis une autre source.", "info", 3000); } else { console.log("   Realtime: Aucun changement pertinent détecté (ni collected_drawers, ni kit_data)."); } } } else { console.warn("   Realtime: Unhandled eventType:", payload.eventType); await loadKitFromSupabase(); } } ) .subscribe((status, err) => { console.log(`>>> Realtime Status (${channelName}): ${status}`); if (status === 'SUBSCRIBED') { console.log(`   Realtime: Connecté avec succès au canal ${channelName}`); } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') { console.error(`   Realtime: Erreur ou Timeout (${status})`, err || ''); removeUserKitRealtimeListener(); } else if (status === 'CLOSED') { console.log(`   Realtime: Canal ${channelName} fermé.`); if (currentUser && userKitRealtimeSubscription) { console.warn("   Realtime: Fermeture inattendue, tentative de relance..."); userKitRealtimeSubscription = null; } else { userKitRealtimeSubscription = null; } } }); console.log(`>>> Realtime: Souscription au canal ${channelName} initiée.`); }
    async function removeUserKitRealtimeListener() { if (!userKitRealtimeSubscription) { return; } console.log(`>>> Realtime: Tentative de suppression du canal ${userKitRealtimeSubscription.channelName}...`); try { const removeStatus = await supabase.removeChannel(userKitRealtimeSubscription); console.log(`   Realtime: Statut suppression canal: ${removeStatus}`); } catch (error) { console.error("   Realtime: Erreur lors de la suppression du canal:", error); } finally { userKitRealtimeSubscription = null; console.log("   Realtime: Abonnement local nettoyé."); } }

    // --- Initialisation Générale (inchangée) ---
    // ... (initializeApp et appel) ...
    function initializeApp() {
        console.log("Initialisation StockAV...");
        try { const userItemsPerPage = parseInt(localStorage.getItem('stockav_itemsPerPage') || '15', 10); ITEMS_PER_PAGE = (userItemsPerPage > 0 && userItemsPerPage <= 100) ? userItemsPerPage : 15; console.log(`Items par page chargés: ${ITEMS_PER_PAGE}`); if (itemsPerPageSelect) { itemsPerPageSelect.value = ITEMS_PER_PAGE; itemsPerPageSelect.addEventListener('change', (e) => { const newIPP = parseInt(e.target.value, 10); if (newIPP > 0 && newIPP <= 100) { ITEMS_PER_PAGE = newIPP; localStorage.setItem('stockav_itemsPerPage', ITEMS_PER_PAGE); console.log(`Items par page mis à jour: ${ITEMS_PER_PAGE}`); const activeView = document.querySelector('main.view-section.active-view'); if (activeView && (activeView.id === 'inventory-view' || activeView.id === 'log-view')) { if (activeView.id === 'inventory-view') currentInventoryPage = 1; if (activeView.id === 'log-view') currentLogPage = 1; reloadActiveViewData(activeView); } } }); } } catch (e) { console.warn("Erreur lecture/configuration items par page:", e); ITEMS_PER_PAGE = 15; }
        const requiredIds = [ 'login-area', 'login-code', 'login-password', 'login-button', 'login-error', 'user-info-area', 'user-display', 'logout-button', 'main-navigation', 'show-search-view', 'show-inventory-view', 'show-log-view', 'show-admin-view', 'show-settings-view', 'show-audit-view', 'show-bom-view', 'search-view', 'inventory-view', 'log-view', 'admin-view', 'settings-view', 'audit-view', 'bom-view', 'quantity-change-modal', 'modal-overlay', 'modal-component-ref', 'modal-current-quantity', 'modal-decrease-button', 'modal-increase-button', 'modal-change-amount', 'modal-confirm-button', 'modal-cancel-button', 'modal-feedback', 'modal-current-attributes', 'modal-attributes-list', 'seven-segment-display', 'inventory-table-body', 'inventory-category-filter', 'inventory-search-filter', 'apply-inventory-filter-button', 'inventory-prev-page', 'inventory-next-page', 'inventory-page-info', 'inventory-no-results', 'inventory-attribute-filters', 'log-table-body', 'log-prev-page', 'log-next-page', 'log-page-info', 'log-no-results', 'category-list', 'category-form', 'category-name', 'category-attributes', 'category-id-edit', 'cancel-edit-button', 'category-form-title', 'admin-feedback', 'stock-form', 'component-ref-admin', 'check-stock-button', 'component-actions', 'current-quantity', 'update-quantity-button', 'quantity-change', 'delete-component-button', 'component-category-select', 'category-specific-attributes', 'component-desc', 'component-mfg', 'component-datasheet', 'component-initial-quantity', 'component-drawer-admin', 'component-threshold', 'save-component-button', 'export-critical-txt-button', 'export-critical-feedback', 'component-details', 'search-button', 'component-input', 'response-output', 'loading-indicator', 'export-inventory-csv-button', 'export-log-txt-button', 'export-feedback', 'import-csv-file', 'import-inventory-csv-button', 'import-feedback', 'audit-category-filter', 'audit-drawer-filter', 'apply-audit-filter-button', 'audit-table-body', 'audit-no-results', 'audit-feedback', 'bom-feedback', 'current-kit-drawers', 'clear-kit-button', 'generic-feedback', 'items-per-page-select', 'export-qr-button' ];
        const missingIds = requiredIds.filter(id => !document.getElementById(id));
        if (missingIds.length > 0) { const errorMsg = `Erreur critique d'initialisation: Éléments HTML manquants: ${missingIds.join(', ')}.`; console.error(errorMsg); document.body.innerHTML = `<div style="padding:20px; background-color:#f8d7da; color:#721c24; border: 1px solid #f5c6cb; border-radius: 5px;"><h2>Erreur Critique</h2><p>${errorMsg}</p></div>`; return; }
        searchTabButton?.addEventListener('click', () => setActiveView(searchView, searchTabButton));
        inventoryTabButton?.addEventListener('click', () => setActiveView(inventoryView, inventoryTabButton));
        logTabButton?.addEventListener('click', () => setActiveView(logView, logTabButton));
        adminTabButton?.addEventListener('click', () => setActiveView(adminView, adminTabButton));
        settingsTabButton?.addEventListener('click', () => setActiveView(settingsView, settingsTabButton));
        auditTabButton?.addEventListener('click', () => setActiveView(auditView, auditTabButton));
        kitTabButton?.addEventListener('click', () => setActiveView(kitView, kitTabButton));
        loginButton?.addEventListener('click', handleLogin);
        loginPasswordInput?.addEventListener('keypress', (e) => { if(e.key === 'Enter') handleLogin(); });
        loginCodeInput?.addEventListener('keypress', (e) => { if(e.key === 'Enter') handleLogin(); });
        logoutButton?.addEventListener('click', handleLogout);
        searchButtonChat?.addEventListener('click', handleUserInput);
        componentInputChat?.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleUserInput(); } });
        applyInventoryFilterButton?.addEventListener('click', () => { displayInventory(1); });
        inventorySearchFilter?.addEventListener('keypress', (e) => { if (e.key === 'Enter') applyInventoryFilterButton?.click(); });
        inventoryCategoryFilter?.addEventListener('change', async () => { await updateAttributeFiltersUI(); displayInventory(1); });
        attributeFiltersContainer?.addEventListener('change', (event) => { if (event.target.tagName === 'SELECT') { displayInventory(1); } });
        inventoryPrevPageButton?.addEventListener('click', () => { if (currentInventoryPage > 1) displayInventory(currentInventoryPage - 1); });
        inventoryNextPageButton?.addEventListener('click', () => { if (!inventoryNextPageButton?.disabled) displayInventory(currentInventoryPage + 1); });
        inventoryTableBody?.addEventListener('change', handleKitCheckboxChange);
        inventoryTableBody?.addEventListener('click', handleInventoryRowClick);
        logPrevPageButton?.addEventListener('click', () => { if (currentLogPage > 1) displayLog(currentLogPage - 1); });
        logNextPageButton?.addEventListener('click', () => { if (!logNextPageButton?.disabled) displayLog(currentLogPage + 1); });
        applyAuditFilterButton?.addEventListener('click', displayAudit);
        auditDrawerFilter?.addEventListener('keypress', (e) => { if (e.key === 'Enter') displayAudit(); });
        auditCategoryFilter?.addEventListener('change', displayAudit);
        addCategoryEventListeners(); addComponentCategorySelectListener(); addStockEventListeners(); addSettingsEventListeners();
        currentKitDrawersDiv?.addEventListener('click', handleDrawerButtonClick);
        clearKitButton?.addEventListener('click', handleClearKit);
        responseOutputChat?.addEventListener('click', (event) => {
             if (event.target.tagName === 'A' && (event.target.classList.contains('external-link') || event.target.classList.contains('external-link-inline'))) { event.preventDefault(); window.open(event.target.href, '_blank', 'noopener,noreferrer'); }
             else if (event.target.classList.contains('direct-take-button')) {
                 const targetButton = event.target; const itemDataStr = targetButton.dataset.itemData;
                 if (!itemDataStr) { console.error("Erreur: data-item-data manquant sur le bouton direct-take-button", targetButton); addMessageToChat('ai', "Erreur interne lors de la tentative de prise directe."); return; }
                 if (!currentUser) { promptLoginBeforeAction("prendre ce composant"); return; }
                 try { const itemData = JSON.parse(itemDataStr); console.log(`Clic sur bouton direct "Prendre" pour ${itemData.ref}. Ouverture modale.`); targetButton.disabled = true; updateSevenSegmentForComponent(itemData.ref); showQuantityModal(itemData.ref, itemData.local_qty, itemData.specs || {}); }
                 catch (e) { console.error("Erreur parsing/traitement bouton direct-take-button:", e, itemDataStr); addMessageToChat('ai', "Erreur lors du traitement de la prise directe."); }
             }
        });
        setupAuthListener();
        updateSevenSegmentDisplayVisuals('----', 'off');
        // displayWelcomeMessage(); // Est maintenant appelé conditionnellement par le listener d'auth
        console.log("StockAV initialisé et prêt.");
    }

    // --- Lancer l'app ---
    initializeApp();

}); // Fin DOMContentLoaded
// --- END OF FILE script.js ---
