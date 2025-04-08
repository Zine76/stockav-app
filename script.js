// ----- DÉBUT DU FICHIER script.js -----
// Assure que le code s'exécute après le chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
    "use strict"; // Active le mode strict pour détecter plus d'erreurs

    // --- Configuration et Variables Globales ---
    let currentUser = null;
    let currentUserCode = null;
    const ITEMS_PER_PAGE = 15;
    let isInitialAuthCheckComplete = false;
    let activeSession = null;
    let lastDisplayedDrawer = null; // Mémorise le dernier tiroir affiché
    let categoriesCache = [];

    // --- Configuration Supabase ---
    const SUPABASE_URL = 'https://tjdergojgghzmopuuley.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZGVyZ29qZ2doem1vcHV1bGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4MTU0OTUsImV4cCI6MjA1OTM5MTQ5NX0.XejQYEPYoCrgYOwW4T9g2VcmohCdLLndDdwpSYXAwPA';
    const FAKE_EMAIL_DOMAIN = '@stockav.local';
    // --- URL de la fonction Edge ---
    const AI_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/ai-component-info`;

    let supabase = null;

    // --- Initialisation des Clients et Vérifications ---
    try {
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !FAKE_EMAIL_DOMAIN) {
            throw new Error("Configuration Supabase (URL, Clé Anon, Domaine Factice) manquante ou incomplète dans script.js !");
        }
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log("Client Supabase initialisé."); // Log 31
        } else {
            throw new Error("La librairie Supabase (supabase-js@2) n'est pas chargée correctement avant ce script.");
        }
        if (typeof Papa === 'undefined') {
            console.warn("Librairie PapaParse non chargée. L'import CSV ne fonctionnera pas.");
        }
    } catch (error) {
        console.error("Erreur critique lors de l'initialisation:", error);
        const body = document.querySelector('body');
        if (body) {
             body.innerHTML = `<div style="padding: 20px; background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; border-radius: .25rem; font-family: sans-serif;"><h2>Erreur Critique</h2><p>L'application n'a pas pu démarrer correctement.</p><p><strong>Détails :</strong> ${error.message}</p><p>Veuillez vérifier la console du navigateur (F12) pour plus d'informations et vous assurer que les librairies externes sont correctement chargées.</p></div>`;
        }
        return;
    }

    // --- Récupération des Éléments DOM ---
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
    const searchView = document.getElementById('search-view');
    const inventoryView = document.getElementById('inventory-view');
    const logView = document.getElementById('log-view');
    const adminView = document.getElementById('admin-view');
    const settingsView = document.getElementById('settings-view');
    const viewSections = document.querySelectorAll('.view-section');
    const protectedButtons = document.querySelectorAll('.nav-button.protected');
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
    let currentInventoryFilters = { category: 'all', search: '' };
    const inventoryTableBody = document.getElementById('inventory-table-body');
    const inventoryCategoryFilter = document.getElementById('inventory-category-filter');
    const inventorySearchFilter = document.getElementById('inventory-search-filter');
    const applyInventoryFilterButton = document.getElementById('apply-inventory-filter-button');
    const inventoryPrevPageButton = document.getElementById('inventory-prev-page');
    const inventoryNextPageButton = document.getElementById('inventory-next-page');
    const inventoryPageInfo = document.getElementById('inventory-page-info');
    const inventoryNoResults = document.getElementById('inventory-no-results');
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
    const componentInfoDiv = document.getElementById('component-info');
    const currentQuantitySpan = document.getElementById('current-quantity');
    const updateQuantityButton = document.getElementById('update-quantity-button');
    const quantityChangeInput = document.getElementById('quantity-change');
    const componentCategorySelectAdmin = document.getElementById('component-category-select');
    const specificAttributesDiv = document.getElementById('category-specific-attributes');
    const componentDescInput = document.getElementById('component-desc');
    const componentMfgInput = document.getElementById('component-mfg');
    const componentDatasheetInput = document.getElementById('component-datasheet');
    const componentInitialQuantityInput = document.getElementById('component-initial-quantity');
    const componentDrawerAdminInput = document.getElementById('component-drawer-admin');
    const componentThresholdInput = document.getElementById('component-threshold');
    const saveComponentButton = document.getElementById('save-component-button');
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

    let chatHistory = [];
    let conversationState = { awaitingEquivalentChoice: false, awaitingQuantityConfirmation: false, originalRefChecked: null, potentialEquivalents: [], chosenRefForStockCheck: null, availableQuantity: 0, criticalThreshold: null };
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    // --- Helper: Statut du Stock ---
    function getStockStatus(quantity, threshold) {
        if (quantity === undefined || quantity === null || isNaN(quantity)) return 'unknown';
        quantity = Number(quantity);
        threshold = (threshold === undefined || threshold === null || isNaN(threshold)) ? -1 : Number(threshold);
        if (quantity <= 0) return 'critical';
        if (threshold >= 0 && quantity <= threshold) return 'warning';
        return 'ok';
    }

    // --- Authentification ---
    async function handleLogin() {
        if (!supabase) { loginError.textContent = "Erreur: Client Supabase non initialisé."; loginError.style.display = 'block'; return; }
        const code = loginCodeInput.value.trim().toLowerCase();
        const password = loginPasswordInput.value.trim();
        loginError.style.display = 'none';
        if (!code || !password) { loginError.textContent = "Code et mot de passe requis."; loginError.style.display = 'block'; return; }
        const email = code + FAKE_EMAIL_DOMAIN;
        loginButton.disabled = true; loginError.textContent = "Connexion..."; loginError.style.display = 'block'; loginError.style.color = 'var(--text-muted)';
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email: email, password: password });
            if (error) {
                console.error("Erreur connexion Supabase:", error.message);
                loginError.textContent = (error.message.includes("Invalid login credentials")) ? "Code ou mot de passe incorrect." : "Erreur connexion.";
                loginError.style.color = 'var(--error-color)'; loginError.style.display = 'block'; loginCodeInput.focus();
            } else {
                console.log("Demande de connexion réussie pour:", data.user?.email); // Log 183
                loginError.style.display = 'none'; loginCodeInput.value = ''; loginPasswordInput.value = '';
            }
        } catch (err) {
             console.error("Erreur JS connexion:", err);
             loginError.textContent = "Erreur inattendue lors de la connexion.";
             loginError.style.color = 'var(--error-color)'; loginError.style.display = 'block';
        } finally {
             loginButton.disabled = false;
        }
    }

    async function handleLogout() {
        if (!supabase) { console.error("Client Supabase non initialisé lors du logout."); alert("Erreur: Client non initialisé."); return; }
        console.log("Tentative de déconnexion..."); // Log 198
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Erreur déconnexion Supabase:", error.message, error);
            alert(`Erreur déconnexion: ${error.message}. Vérifiez la console.`);
        } else {
            console.log("Déconnexion Supabase réussie."); // Log 204
             if (chatHistory.length > 0 && searchView?.classList.contains('active-view')) {
                 displayWelcomeMessage();
             }
             lastDisplayedDrawer = null;
             updateSevenSegmentDisplay(null);
        }
    }

    // --- Gestionnaire d'état d'authentification ---
    async function setupAuthListener() {
        if (!supabase) { console.error("Listener Auth impossible: Supabase non initialisé."); return; }
        try {
            console.log("Vérification session initiale (getSession)..."); // Log 223
            const { data: { session } } = await supabase.auth.getSession();
            activeSession = session;
            isInitialAuthCheckComplete = true;
            if (session) {
                console.log("Session initiale trouvée (getSession)."); // Log 229
                handleUserConnected(session.user, true);
            } else {
                console.log("Pas de session initiale trouvée (getSession).");
                handleUserDisconnected(true);
            }
        } catch (error) {
            console.error("Erreur critique getSession initiale:", error);
            isInitialAuthCheckComplete = true;
            handleUserDisconnected(true);
        }
        supabase.auth.onAuthStateChange((event, session) => {
            console.log(`Auth Event: ${event}`, session ? `Session pour ${session.user.email}` : "Pas de session"); // Log 243
            activeSession = session;
            if (!isInitialAuthCheckComplete) { console.log("Auth event reçu avant fin vérif initiale, attente..."); return; }
            switch (event) {
                case 'SIGNED_IN': handleUserConnected(session.user, false); break;
                case 'SIGNED_OUT': handleUserDisconnected(false); break;
                case 'TOKEN_REFRESHED': console.log("Token rafraîchi."); if (session && currentUser && session.user.id !== currentUser.id) { handleUserConnected(session.user, false); } else if (!session && currentUser) { handleUserDisconnected(false); } break;
                case 'USER_UPDATED': console.log("Utilisateur mis à jour:", session?.user); if (session) handleUserConnected(session.user, false); break;
                case 'PASSWORD_RECOVERY': console.log("Événement de récupération de mot de passe."); break;
                default: console.log("Événement Auth non géré ou redondant:", event); // Log 280
            }
        });
    }

    // --- Mise à jour UI/État pour Authentification ---
    function handleUserConnected(user, isInitialLoad) {
        const previousUserId = currentUser?.id;
        currentUser = user;
        currentUserCode = currentUser.email.split('@')[0];
        console.log(`Utilisateur connecté: ${currentUserCode} (ID: ${currentUser.id})`); // Log 290

        document.body.classList.add('user-logged-in');
        if(loginArea) loginArea.style.display = 'none';
        if(userInfoArea) userInfoArea.style.display = 'flex';
        if(userDisplay) userDisplay.textContent = currentUserCode.toUpperCase();
        if(loginError) loginError.style.display = 'none';
        protectedButtons.forEach(btn => { btn.style.display = 'inline-block'; btn.disabled = false; btn.title = ''; });

        if (categoriesCache.length === 0) {
             getCategories();
        }

        if (!isInitialLoad && user.id !== previousUserId) {
            console.log("Nouvelle connexion détectée, redirection vers inventaire."); // Log 306
            invalidateCategoriesCache();
            setActiveView(inventoryView, inventoryTabButton);
        } else if (isInitialLoad) {
            const activeView = document.querySelector('.view-section.active-view');
             if (activeView?.id === 'inventory-view') { populateInventoryFilters(); displayInventory(); }
             else if (activeView?.id === 'log-view') { displayLog(); }
             else if (activeView?.id === 'admin-view') { loadAdminData(); }
             else if (activeView?.id === 'settings-view') { loadSettingsData(); }
             else if (!activeView) { setActiveView(inventoryView, inventoryTabButton); }
        }
        updateSevenSegmentDisplay();
    }

    function handleUserDisconnected(isInitialLoad) {
        console.log("Utilisateur déconnecté ou session absente."); // Log 326
        currentUser = null;
        currentUserCode = null;
        document.body.classList.remove('user-logged-in');
        if(userInfoArea) userInfoArea.style.display = 'none';
        if(loginArea) loginArea.style.display = 'block';
        protectedButtons.forEach(btn => { btn.style.display = 'none'; btn.disabled = true; btn.title = 'Connexion requise'; });
        hideQuantityModal();
        lastDisplayedDrawer = null;
        updateSevenSegmentDisplay(null);
        if (!isInitialLoad) {
            invalidateCategoriesCache();
            clearProtectedViewData();
        }
        const activeView = document.querySelector('.view-section.active-view');
        if (activeView && (activeView.id === 'log-view' || activeView.id === 'admin-view' || activeView.id === 'settings-view')) {
            console.log("Redirection vers vue recherche car déconnecté d'une vue protégée.");
            setActiveView(searchView, searchTabButton);
        } else if (isInitialLoad && !activeView) {
             setActiveView(searchView, searchTabButton);
        }
    }

    function clearProtectedViewData() {
        if(inventoryTableBody) inventoryTableBody.innerHTML = '';
        if(logTableBody) logTableBody.innerHTML = '';
        if(inventoryPageInfo) inventoryPageInfo.textContent = 'Page - / -';
        if(inventoryPrevPageButton) inventoryPrevPageButton.disabled = true;
        if(inventoryNextPageButton) inventoryNextPageButton.disabled = true;
        if(logPageInfo) logPageInfo.textContent = 'Page - / -';
        if(logPrevPageButton) logPrevPageButton.disabled = true;
        if(logNextPageButton) logNextPageButton.disabled = true;
        if (categoryList) categoryList.innerHTML = '';
        resetCategoryForm();
        resetStockForm(); // Log 940
        if (componentInfoDiv) componentInfoDiv.style.display = 'none';
        if (adminFeedbackDiv) { adminFeedbackDiv.style.display = 'none'; adminFeedbackDiv.textContent = '';}
        if(exportFeedbackDiv) { exportFeedbackDiv.style.display = 'none'; exportFeedbackDiv.textContent = '';}
        if(importFeedbackDiv) { importFeedbackDiv.style.display = 'none'; importFeedbackDiv.textContent = '';}
        if(importCsvFileInput) importCsvFileInput.value = '';
        console.log("Données des vues protégées effacées."); // Log 373
    }

    // --- Navigation ---
    function setActiveView(viewToShow, buttonToActivate){
        if (!viewToShow) { viewToShow = searchView; buttonToActivate = searchTabButton; console.warn("setActiveView: Vue invalide, retour à la recherche.");}
        if (viewToShow.classList.contains('active-view')) { console.log(`Vue ${viewToShow.id} déjà active.`); return; }
        const isProtected = viewToShow.id === 'log-view' || viewToShow.id === 'admin-view' || viewToShow.id === 'settings-view';
        if (isProtected && !currentUser) { console.warn(`Accès refusé: ${viewToShow.id} nécessite connexion.`); if (loginError) { loginError.textContent="Connexion requise."; loginError.style.color = 'var(--error-color)'; loginError.style.display='block'; } loginCodeInput?.focus(); return; }
        viewSections.forEach(section => { section.style.display = 'none'; section.classList.remove('active-view'); });
        document.querySelectorAll('.nav-button').forEach(button => { button.classList.remove('active'); });
        viewToShow.style.display = 'block'; viewToShow.classList.add('active-view');
        if (buttonToActivate) { buttonToActivate.classList.add('active'); } else { const realButtonId = `show-${viewToShow.id}`; const matchingButton = document.getElementById(realButtonId); if (matchingButton) matchingButton.classList.add('active'); }
        console.log(`Activation vue: ${viewToShow.id}`); // Log 417

        if (viewToShow === searchView && chatHistory.length === 0) { displayWelcomeMessage(); }
        else if (viewToShow === inventoryView) { populateInventoryFilters(); displayInventory(); }
        else if (viewToShow === logView) { displayLog(); }
        else if (viewToShow === adminView) { loadAdminData(); }
        else if (viewToShow === settingsView) { loadSettingsData(); }
    }

    // --- LOGIQUE INVENTAIRE ---
    async function populateInventoryFilters() {
        if (!inventoryCategoryFilter) return;
        const currentVal = inventoryCategoryFilter.value;
        inventoryCategoryFilter.innerHTML = '<option value="all">Toutes</option>';
        try {
            const categories = await getCategories();
            if (categories && categories.length > 0) {
                categories.forEach(cat => { const option = document.createElement('option'); option.value = cat.id; option.textContent = cat.name; inventoryCategoryFilter.appendChild(option); });
                if (inventoryCategoryFilter.querySelector(`option[value="${currentVal}"]`)) { inventoryCategoryFilter.value = currentVal; } else { inventoryCategoryFilter.value = 'all'; }
            } else { console.warn("Aucune catégorie trouvée pour filtres."); }
        } catch (error) { console.error("Erreur remplissage filtres catégorie:", error); }
    }

    async function displayInventory(page = currentInventoryPage) {
        currentInventoryPage = page;
        if (!inventoryTableBody || !supabase) { console.warn("displayInventory: Prérequis manquants"); return; }
        inventoryTableBody.innerHTML = '<tr class="loading-row"><td colspan="7" style="text-align:center; padding: 20px; color: var(--text-muted);"><i>Chargement...</i></td></tr>';
        if(inventoryNoResults) inventoryNoResults.style.display = 'none';
        if(inventoryPrevPageButton) inventoryPrevPageButton.disabled = true;
        if(inventoryNextPageButton) inventoryNextPageButton.disabled = true;
        if(inventoryPageInfo) inventoryPageInfo.textContent = 'Chargement...';
        const itemsPerPage = ITEMS_PER_PAGE;
        const startIndex = (currentInventoryPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage - 1;
        try {
             // *** MODIFICATION TEST B : Requête SANS la jointure categories(name) ***
            let query = supabase.from('inventory').select('*, critical_threshold', { count: 'exact' }); // Enlevé categories(name)
            const searchValue = inventorySearchFilter?.value.trim() || '';
            const categoryValue = inventoryCategoryFilter?.value || 'all';
            if (searchValue) { const searchColumns = ['ref', 'description', 'manufacturer']; if (currentUser) { searchColumns.push('drawer'); } query = query.or(searchColumns.map(col => `${col}.ilike.%${searchValue}%`).join(',')); }
            if (categoryValue !== 'all') { query = query.eq('category_id', categoryValue); }
            query = query.order('ref', { ascending: true }).range(startIndex, endIndex);
            const { data, error, count } = await query;
            inventoryTableBody.innerHTML = '';
            if (error) {
                 if (error.code === 'PGRST116' || error.message.includes('406')) {
                     throw new Error(`Erreur accès base (RLS?): ${error.message}`);
                 }
                 throw new Error(`Erreur Supabase: ${error.message}`);
             }
            const totalItems = count || 0;
            const totalPages = Math.ceil(totalItems / itemsPerPage);
            if (totalItems === 0) { if(inventoryNoResults) { inventoryNoResults.textContent = `Aucun composant trouvé${searchValue || categoryValue !== 'all' ? ' pour ces filtres' : ''}.`; inventoryNoResults.style.display = 'block'; } if(inventoryPageInfo) inventoryPageInfo.textContent = 'Page 0 / 0'; }
            else {
                if(inventoryNoResults) inventoryNoResults.style.display = 'none';
                data.forEach(item => {
                    const row = inventoryTableBody.insertRow();
                    row.dataset.ref = item.ref;
                    row.classList.add('inventory-item-row');
                    const refCell = row.insertCell();
                    const status = getStockStatus(item.quantity, item.critical_threshold);
                    const indicatorSpan = document.createElement('span'); indicatorSpan.classList.add('stock-indicator', `level-${status}`); indicatorSpan.title = `Stock: ${status.toUpperCase()} (Qté: ${item.quantity}, Seuil: ${item.critical_threshold ?? 'N/A'})`; refCell.appendChild(indicatorSpan); refCell.appendChild(document.createTextNode(item.ref));
                    row.insertCell().textContent = item.description || '-';
                    // *** MODIFICATION TEST B : Affiche l'ID de catégorie au lieu du nom ***
                    row.insertCell().textContent = item.category_id ?? 'N/A';
                    row.insertCell().textContent = item.drawer || '-';
                    row.insertCell().textContent = item.manufacturer || '-';
                    row.insertCell().textContent = item.quantity;
                    const dsCell = row.insertCell();
                    if (item.datasheet) { try { new URL(item.datasheet); const link = document.createElement('a'); link.href = item.datasheet; link.textContent = 'Voir'; link.target = '_blank'; link.rel = 'noopener noreferrer'; dsCell.appendChild(link); } catch (_) { dsCell.textContent = '-'; } } else { dsCell.textContent = '-'; }
                });
                currentInventoryPage = Math.max(1, Math.min(currentInventoryPage, totalPages || 1));
                if(inventoryPageInfo) inventoryPageInfo.textContent = `Page ${currentInventoryPage} / ${totalPages || 1}`;
                if(inventoryPrevPageButton) inventoryPrevPageButton.disabled = currentInventoryPage === 1;
                if(inventoryNextPageButton) inventoryNextPageButton.disabled = currentInventoryPage >= totalPages;
            }
        } catch (err) {
            console.error("Erreur affichage inventaire:", err);
            inventoryTableBody.innerHTML = `<tr><td colspan="7" class="error-message">Erreur chargement: ${err.message}</td></tr>`;
            if(inventoryPageInfo) inventoryPageInfo.textContent = 'Erreur';
        }
    }

    // --- LOGIQUE HISTORIQUE ---
    // (Aucun changement dans cette section pour ce test)
    async function displayLog(page = currentLogPage) {
        if (!currentUser) return;
        currentLogPage = page;
        if (!logTableBody || !supabase) { console.warn("displayLog: Prérequis manquants"); return; }
        logTableBody.innerHTML = '<tr class="loading-row"><td colspan="6" style="text-align:center; color: var(--text-muted);"><i>Chargement...</i></td></tr>';
        if(logNoResults) logNoResults.style.display = 'none';
        if(logPrevPageButton) logPrevPageButton.disabled = true;
        if(logNextPageButton) logNextPageButton.disabled = true;
        if(logPageInfo) logPageInfo.textContent = 'Chargement...';
        const itemsPerPage = ITEMS_PER_PAGE;
        const startIndex = (currentLogPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage - 1;
        try {
            const { data, error, count } = await supabase.from('logs').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(startIndex, endIndex);
            logTableBody.innerHTML = '';
            if (error) { throw new Error(`Erreur Supabase (logs): ${error.message}`); }
            const totalItems = count || 0;
            const totalPages = Math.ceil(totalItems / itemsPerPage);
            if (totalItems === 0) { if(logNoResults) { logNoResults.textContent = "Historique vide."; logNoResults.style.display = 'block'; } if(logPageInfo) logPageInfo.textContent = 'Page 0 / 0'; }
            else {
                if(logNoResults) logNoResults.style.display = 'none';
                data.forEach(entry => {
                    const row = logTableBody.insertRow();
                    row.insertCell().textContent = formatLogTimestamp(new Date(entry.created_at));
                    row.insertCell().textContent = entry.user_code || 'N/A';
                    const actionCell = row.insertCell(); actionCell.textContent = entry.quantity_change > 0 ? 'Ajout' : 'Retrait'; actionCell.classList.add(entry.quantity_change > 0 ? 'positive' : 'negative');
                    row.insertCell().textContent = entry.component_ref;
                    const changeCell = row.insertCell(); changeCell.textContent = entry.quantity_change > 0 ? `+${entry.quantity_change}` : `${entry.quantity_change}`; changeCell.classList.add(entry.quantity_change > 0 ? 'positive' : 'negative');
                    row.insertCell().textContent = entry.quantity_after;
                });
                 currentLogPage = Math.max(1, Math.min(currentLogPage, totalPages || 1));
                 if(logPageInfo) logPageInfo.textContent = `Page ${currentLogPage} / ${totalPages || 1}`;
                 if(logPrevPageButton) logPrevPageButton.disabled = currentLogPage === 1;
                 if(logNextPageButton) logNextPageButton.disabled = currentLogPage >= totalPages;
            }
        } catch (err) {
            console.error("Erreur affichage logs:", err);
            logTableBody.innerHTML = `<tr><td colspan="6" class="error-message">Erreur chargement logs: ${err.message}</td></tr>`;
            if(logPageInfo) logPageInfo.textContent = 'Erreur';
        }
    }
    function formatLogTimestamp(date) { try { return date.toLocaleString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }); } catch(e) { return date.toISOString();} }
    async function addLogEntry(itemRef, change, newQuantity) {
        if (!currentUser || !currentUserCode || !supabase) { console.warn("Log annulé: non connecté ou Supabase indispo."); return; }
        const logData = { user_id: currentUser.id, user_code: currentUserCode.toUpperCase(), component_ref: itemRef, quantity_change: change, quantity_after: newQuantity };
        console.log("Écriture log Supabase:", logData);
        try {
            const { error: logError } = await supabase.from('logs').insert(logData);
            if (logError) { console.error("Erreur écriture log Supabase:", logError); }
            else { console.log("Log écrit."); if (logView?.classList.contains('active-view')) { displayLog(1); } }
        } catch (err) { console.error("Erreur JS écriture log:", err); }
    }

    // --- VUE ADMIN ---
    // (Aucun changement dans cette section pour ce test)
    async function getCategories() {
        if (categoriesCache.length > 0) return categoriesCache;
        if (!supabase) { console.warn("getCategories: Supabase non dispo."); return []; }
        console.log("Fetching categories...");
        try {
            const { data, error } = await supabase.from('categories').select('id, name, attributes').order('name', { ascending: true });
            if (error) throw new Error(error.message);
            categoriesCache = data || [];
            console.log("Categories fetched/cached:", categoriesCache.length);
            return categoriesCache;
        } catch (err) {
            console.error("Erreur lecture catégories:", err);
            if (adminView?.classList.contains('active-view')) showAdminFeedback(`Erreur chargement catégories: ${err.message}`, 'error');
            return [];
        }
    }
    function invalidateCategoriesCache() { categoriesCache = []; console.log("Cache catégories invalidé."); }
    async function loadAdminData() { /* ... */ }
    async function loadCategoriesAdmin() { /* ... */ }
    function addCategoryEventListeners() { /* ... */ }
    function resetCategoryForm(){ /* ... */ }
    function addComponentCategorySelectListener() { /* ... */ }
    function showAdminFeedback(message, type = 'info'){ /* ... */ }
    function resetStockForm() { /* ... */ }
    function addStockEventListeners() { /* ... */ }


    // --- LOGIQUE VUE RECHERCHE (Chat) ---

    async function fetchEquivalentsFromAI(reference) {
        console.log(`Appel Edge Function pour équivalents de: ${reference}`);
        try {
            const response = await fetch(AI_FUNCTION_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reference1: reference })
            });
            console.log(`Réponse brute reçue (Status: ${response.status})`);
            if (!response.ok) {
                let errorMsg = `Erreur ${response.status}`;
                try {
                    const errorBody = await response.json();
                    errorMsg += `: ${errorBody?.content || errorBody?.message || 'Détail non disponible'}`;
                } catch (e) { errorMsg += `: ${await response.text()}`; }
                throw new Error(`Erreur appel AI: ${errorMsg}`);
            }
            const data = await response.json();
            console.log("Données JSON reçues de l'Edge Function:", data);
            if (data && data.response_type === 'equivalents' && Array.isArray(data.content)) {
                console.log(`Edge Function a retourné ${data.content.length} équivalent(s).`);
                return data.content;
            } else if (data && data.response_type === 'error') {
                throw new Error(`Erreur Edge Function: ${data.content}`);
            } else {
                console.warn("Réponse inattendue de l'Edge Function:", data);
                throw new Error("Réponse inattendue de la recherche d'équivalents.");
            }
        } catch (error) {
            console.error("Erreur lors de l'appel à fetchEquivalentsFromAI:", error);
            throw error;
        }
    }

    async function addMessageToChat(sender, messageContent, isHTML = false) { /* ... inchangé ... */ if(responseOutputChat) { const messageElement = document.createElement('div'); messageElement.classList.add('message', sender.toLowerCase()); if (sender === 'AI') { messageElement.innerHTML = '...'; responseOutputChat.prepend(messageElement); loadingIndicatorChat.style.display = 'block'; loadingIndicatorChat.querySelector('i').textContent = 'StockAV réfléchit...'; await delay(150); if (isHTML) { messageElement.innerHTML = messageContent; } else { messageElement.textContent = ''; for (let i = 0; i < messageContent.length; i++) { messageElement.textContent += messageContent[i]; await delay(8); } } loadingIndicatorChat.style.display = 'none'; } else { messageElement.textContent = messageContent; responseOutputChat.prepend(messageElement); } chatHistory.push({ sender, message: messageContent, isHTML }); } }
    function displayWelcomeMessage() { if(responseOutputChat) responseOutputChat.innerHTML = ''; chatHistory = []; resetConversationState(); addMessageToChat('AI', "Bonjour ! Je suis StockAV. Quelle référence cherchez-vous ?"); }
    async function handleUserInput() { /* ... inchangé ... */ const userInput = componentInputChat?.value.trim(); if (!userInput) return; addMessageToChat('User', userInput); if(componentInputChat) componentInputChat.value = ''; try { if (conversationState.awaitingQuantityConfirmation) { if (!currentUser) { await promptLoginBeforeAction("prendre qté"); return; } await handleQuantityResponse(userInput); } else if (conversationState.awaitingEquivalentChoice) { await addMessageToChat('AI', "Cliquez sur une option ou entrez une nouvelle réf."); } else { resetConversationState(); const potentialRef = extractReference(userInput); if (potentialRef) { conversationState.originalRefChecked = potentialRef; await checkOriginalAndFindEquivalents(potentialRef); } else { await addMessageToChat('AI', "Réf non identifiée. Ex: 'stock BC547'?"); } } } catch (error) { console.error("Erreur handleUserInput:", error); await addMessageToChat('AI', "Erreur interne."); resetConversationState(); } }
    function extractReference(text) { /* ... inchangé ... */ const patterns = [ /\b([A-Z]{2,}\d{2,}[A-Z\d\-/]*)\b/i, /\b(\d+[A-Z]{1,}[A-Z\d\-/]*)\b/i, /\b(NE\d{3}[A-Z]*)\b/i, /\b(\d{1,3}(?:K|M|G|R|Ω|OHM|NF|UF|PF|µF)[A-Z\d\-/]*)\b/i, /\b(BC\d{3}[A-Z]*)\b/i, /\b(TIP\d{2,}[A-Z]*)\b/i, /\b(BD\d{3}[A-Z]*)\b/i, /\b(2N\d{4}[A-Z]*)\b/i, /\b(1N\d{4}[A-Z]*)\b/i, /\b(IRF[A-Z\d]*)\b/i, /\b(PIC[A-Z\d\-F/L]*)\b/i, /\b(AT[A-Z\d\-]*)\b/i ]; text = text.toUpperCase(); for (const pattern of patterns) { const match = text.match(pattern); if (match && match[1].length >= 3 && !/^(POUR|AVEC|COMBIEN|STOCK|CHERCHE|DISPO|EQUIV|REMPLACE|TROUVE|QUEL|EST|QUE)$/.test(match[1])) { return match[1].replace(/\s+/g, ''); } } const words = text.split(/[\s,;:!?()]+/); const suspect = words.find(w => /^[A-Z\d\-.\/]{3,}$/.test(w) && /\d/.test(w) && /[A-Z]/.test(w) && !/^(POUR|AVEC|COMBIEN|STOCK|CHERCHE|DISPO|EQUIV|REMPLACE|QUE|EST)$/.test(w)); return suspect || null; }

    // *** VERSION AVEC VÉRIFICATION IMMÉDIATE DU STOCK DES ÉQUIVALENTS (et modifiée pour le Test B) ***
    async function checkOriginalAndFindEquivalents(originalRef) {
        loadingIndicatorChat.style.display = 'block';
        loadingIndicatorChat.querySelector('i').textContent = `Analyse ${originalRef}...`;

        let originalStockInfo = null;
        let dbError = null;
        try {
             // Appel getStockInfoFromSupabase (version Test B - sans jointure)
             originalStockInfo = await getStockInfoFromSupabase(originalRef);
        } catch(error) {
             console.error(`Erreur DB (local) pour ${originalRef}:`, error);
             dbError = error.message || "Erreur accès base de données.";
        }

        await delay(100);

        let originalStatusMsg = "";
        let statusIndicatorHTML = "";
        const showDrawer = currentUser && originalStockInfo?.drawer;

        if (currentUser && originalStockInfo?.drawer) {
            updateSevenSegmentDisplay(originalStockInfo.drawer);
        }

        if (dbError) {
             statusIndicatorHTML = `<span class="stock-indicator-chat level-unknown" title="Erreur DB"></span>`;
             originalStatusMsg = `${statusIndicatorHTML}Erreur vérification stock local: ${dbError}`;
        } else if (originalStockInfo) {
            const status = getStockStatus(originalStockInfo.quantity, originalStockInfo.critical_threshold);
            statusIndicatorHTML = `<span class="stock-indicator-chat level-${status}" title="Stock: ${status.toUpperCase()} (Qté: ${originalStockInfo.quantity}, Seuil: ${originalStockInfo.critical_threshold ?? 'N/A'})"></span>`;
            if (originalStockInfo.quantity > 0) {
                originalStatusMsg = `${statusIndicatorHTML}Original <strong>${originalRef}</strong>: Dispo (Qté: ${originalStockInfo.quantity}${showDrawer ? `, Tiroir: ${originalStockInfo.drawer}` : ''}).`;
                conversationState.criticalThreshold = originalStockInfo.critical_threshold;
            } else {
                originalStatusMsg = `${statusIndicatorHTML}Original <strong>${originalRef}</strong>: Rupture.`;
            }
        } else {
            statusIndicatorHTML = `<span class="stock-indicator-chat level-unknown" title="Stock: Inconnu"></span>`;
            originalStatusMsg = `${statusIndicatorHTML}Original <strong>${originalRef}</strong>: Inconnu localement.`;
        }

        loadingIndicatorChat.querySelector('i').textContent = `Recherche équiv. via IA pour ${originalRef}...`;

        let equivalents = [];
        let aiError = null;
        try {
            equivalents = await fetchEquivalentsFromAI(originalRef);
            conversationState.potentialEquivalents = equivalents;
            console.log(`Équivalents reçus de l'IA pour ${originalRef}:`, equivalents);
        } catch (error) {
            console.error(`Erreur lors de la récupération des équivalents AI pour ${originalRef}:`, error);
            aiError = error.message || "Erreur recherche équivalents AI.";
            equivalents = [];
            conversationState.potentialEquivalents = [];
        }

        let responseHTML = `${originalStatusMsg}<br><br>`;

        if (aiError) {
            responseHTML += `<small><i>Erreur IA: ${aiError}</i></small><br>`;
        }

        if (equivalents.length > 0) {
            responseHTML += "Équivalents suggérés par l'IA :<br>";
            loadingIndicatorChat.querySelector('i').textContent = `Vérification stock équivalents...`;

            for (const eq of equivalents) {
                const eqRef = typeof eq.ref === 'string' ? eq.ref.trim().toUpperCase() : 'REF_INCONNUE';
                const eqReason = typeof eq.reason === 'string' ? eq.reason.trim() : 'Raison inconnue';

                if (eqRef === 'REF_INCONNUE' || eqRef === '') {
                    responseHTML += `- Ref Invalide <small>(${eqReason})</small> - Vérification impossible<br>`;
                    continue;
                }

                let eqStockInfo = null;
                let eqDbError = null;
                try {
                     // Appel getStockInfoFromSupabase (version Test B - sans jointure)
                    if (eqRef === originalRef && originalStockInfo && !dbError) {
                        eqStockInfo = originalStockInfo;
                    } else {
                        eqStockInfo = await getStockInfoFromSupabase(eqRef);
                    }
                } catch (error) {
                     console.error(`Erreur DB (local) pour équivalent ${eqRef}:`, error);
                     eqDbError = error.message || "Erreur accès base.";
                }

                let eqStatusHTML = "";
                let eqButtonHTML = "";
                const showEqDrawer = currentUser && eqStockInfo?.drawer;

                if (eqDbError) {
                    eqStatusHTML = `<span class="stock-indicator-chat level-unknown" title="Erreur DB"></span> Erreur vérif stock.`;
                } else if (eqStockInfo) {
                    const eqStatus = getStockStatus(eqStockInfo.quantity, eqStockInfo.critical_threshold);
                    eqStatusHTML = `<span class="stock-indicator-chat level-${eqStatus}" title="Stock: ${eqStatus.toUpperCase()}"></span>`;
                    if (eqStockInfo.quantity > 0) {
                        eqStatusHTML += ` Dispo (Qté: ${eqStockInfo.quantity}${showEqDrawer ? `, Tiroir: ${eqStockInfo.drawer}` : ''})`;
                        eqButtonHTML = `<button class="choice-button" data-ref="${eqRef}">Prendre ${eqRef}</button>`;
                    } else {
                        eqStatusHTML += ` Rupture.`;
                    }
                } else {
                     eqStatusHTML = `<span class="stock-indicator-chat level-unknown" title="Stock: Inconnu"></span> Inconnu localement.`;
                }

                responseHTML += `- <strong>${eqRef}</strong> <small>(${eqReason})</small>: ${eqStatusHTML} ${eqButtonHTML}<br>`;
                await delay(50);
            }
             loadingIndicatorChat.querySelector('i').textContent = `Analyse ${originalRef}...`;

        } else if (!aiError) {
             if (dbError) { responseHTML += "Impossible de vérifier le stock local ou de trouver des équivalents IA.<br>"; }
             else if (originalStockInfo && originalStockInfo.quantity > 0) { responseHTML += "Aucun équivalent trouvé par l'IA.<br>"; }
             else { responseHTML += "Aucun équivalent trouvé par l'IA.<br>"; }
        }

        const hasTakeButton = responseHTML.includes('class="choice-button"');
        if (hasTakeButton) {
            conversationState.awaitingEquivalentChoice = true;
             if (originalStockInfo && originalStockInfo.quantity > 0 && !responseHTML.includes(`data-ref="${originalRef}"`)) {
                 responseHTML += `<br><button class="choice-button" data-ref="${originalRef}">Prendre original (${originalRef})</button>`;
             }
        } else {
             if (!dbError && originalStockInfo && originalStockInfo.quantity === 0 && equivalents.length === 0 && !aiError) { responseHTML += "<br>Original en rupture et aucun équivalent IA trouvé."; }
             else if (!dbError && !originalStockInfo && equivalents.length === 0 && !aiError) { responseHTML += "<br>Référence inconnue et aucun équivalent IA trouvé."; }
             else if (!hasTakeButton) { responseHTML += "<br>Aucun composant disponible ou erreur lors de la vérification."; }

             if ((!originalStockInfo || originalStockInfo.quantity === 0) && equivalents.length === 0) { responseHTML += provideExternalLinksHTML(originalRef); }
             else { responseHTML += "<br>Que faire ensuite ?"; }
             resetConversationState();
        }

        await addMessageToChat('AI', responseHTML, true);
        loadingIndicatorChat.style.display = 'none';
    }

    responseOutputChat?.addEventListener('click', async (event) => { /* ... inchangé ... */ });
    async function checkLocalStockForChosenPart(chosenRef) { /* ... inchangé ... */ }
    async function promptLoginBeforeAction(actionDescription) { /* ... inchangé ... */ }
    function provideExternalLinksHTML(ref) { /* ... inchangé ... */ }
    async function provideExternalLinks(ref) { /* ... inchangé ... */ }
    async function handleQuantityResponse(userInput) { /* ... inchangé ... */ }
    function resetConversationState() { /* ... inchangé ... */ }


    // --- Fonctions d'interaction Supabase ---

    // *** MODIFIÉ POUR TEST B : Requête SANS la jointure categories(name) ***
    async function getStockInfoFromSupabase(ref) {
        if (!supabase || !ref) return null;
        const upperRef = ref.toUpperCase();
        console.log(`Supabase: GET ref: ${upperRef}`);
        try {
            // Ligne de test SANS la jointure categories(name)
            const { data, error } = await supabase.from('inventory').select('*, critical_threshold').ilike('ref', upperRef).single();
            console.log("Test SANS jointure categories(name) pour:", upperRef); // Log pour confirmer

            if (error) {
                if (error.code === 'PGRST116') {
                    console.log(`Ref ${upperRef} non trouvé ou accès refusé (jointure?).`);
                    return null;
                }
                console.error(`Erreur GET (${upperRef}):`, error);
                 // JETER l'erreur pour la capturer dans la fonction appelante
                throw new Error(error.message || `Erreur Supabase (${error.code || error.status || 'inconnu'})`);
            }
            return data;
        } catch (err) {
            console.error("Erreur JS getStockInfo:", err);
             // JETER l'erreur pour la capturer dans la fonction appelante
             throw err;
        }
    }

    async function updateStockInSupabase(ref, change) { /* ... inchangé ... */ }

    // --- Gestion Modale Quantité (+/-) ---
    async function handleInventoryRowClick(event) { /* ... inchangé ... */ }
    function showQuantityModal(ref, quantity) { /* ... inchangé ... */ }
    function hideQuantityModal() { /* ... inchangé ... */ }
    function updateModalButtonStates() { /* ... inchangé ... */ }
    // Listeners boutons modale, listener confirm (inchangés)
    modalDecreaseButton?.addEventListener('click', () => { /* ... */ });
    modalIncreaseButton?.addEventListener('click', () => { /* ... */ });
    modalCancelButton?.addEventListener('click', hideQuantityModal);
    modalOverlay?.addEventListener('click', (event) => { /* ... */ });
    modalConfirmButton?.addEventListener('click', async () => { /* ... */ });

    // --- Gestion Afficheur 7 Segments (Logique Persistante) ---
    const segmentMap = { /* ... inchangé ... */ };
    function updateSevenSegmentDisplay(newDrawerValue = undefined) { /* ... inchangé ... */ }

    // --- Logique pour la vue Paramètres (Export/Import) ---
    function loadSettingsData() { /* ... inchangé ... */ }
    function showSettingsFeedback(type, message, level = 'info') { /* ... inchangé ... */ }
    function downloadFile(filename, content, mimeType) { /* ... inchangé ... */ }
    async function handleExportInventoryCSV() { /* ... inchangé ... */ }
    async function handleExportLogTXT() { /* ... inchangé ... */ }
    async function handleImportInventoryCSV() { /* ... inchangé ... */ }
    function resetImportState() { /* ... inchangé ... */ }
    function addSettingsEventListeners() { /* ... inchangé ... */ }


    // --- Initialisation Générale de l'Application ---
    function initializeApp() {
        console.log("Initialisation de StockAV..."); // Log 1356

        if (!loginArea || !searchView || !inventoryView || !logView || !adminView || !settingsView || !sevenSegmentDisplay || !inventoryTableBody) {
            console.error("Erreur FATALE: Un élément DOM essentiel est manquant!");
            return;
        }

        // Listeners Navigation Tabs
        searchTabButton?.addEventListener('click', () => setActiveView(searchView, searchTabButton));
        inventoryTabButton?.addEventListener('click', () => setActiveView(inventoryView, inventoryTabButton));
        logTabButton?.addEventListener('click', () => setActiveView(logView, logTabButton));
        adminTabButton?.addEventListener('click', () => setActiveView(adminView, adminTabButton));
        settingsTabButton?.addEventListener('click', () => setActiveView(settingsView, settingsTabButton));

        // Listeners Authentification
        loginButton?.addEventListener('click', handleLogin);
        loginPasswordInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleLogin(); });
        loginCodeInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleLogin(); });
        logoutButton?.addEventListener('click', handleLogout);

        // Listeners Chat
        searchButtonChat?.addEventListener('click', handleUserInput);
        componentInputChat?.addEventListener('keypress', (event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); handleUserInput(); } });

        // Listeners Filtres/Pagination Inventaire
        applyInventoryFilterButton?.addEventListener('click', () => { currentInventoryFilters.category = inventoryCategoryFilter.value; currentInventoryFilters.search = inventorySearchFilter.value; displayInventory(1); });
        inventorySearchFilter?.addEventListener('keypress', (e) => { if (e.key === 'Enter') applyInventoryFilterButton?.click(); });
        inventoryPrevPageButton?.addEventListener('click', () => { if (currentInventoryPage > 1) { displayInventory(currentInventoryPage - 1); } });
        inventoryNextPageButton?.addEventListener('click', () => { if (!inventoryNextPageButton?.disabled) { displayInventory(currentInventoryPage + 1); } });

        // Listeners Pagination Log
        logPrevPageButton?.addEventListener('click', () => { if (currentLogPage > 1) { displayLog(currentLogPage - 1); } });
        logNextPageButton?.addEventListener('click', () => { if (!logNextPageButton?.disabled) { displayLog(currentLogPage + 1); } });

        // Listener pour le clic sur les lignes d'inventaire (inchangé)
        inventoryTableBody?.addEventListener('click', handleInventoryRowClick);

        // Attacher les listeners pour Admin et Settings (fonctions vides pour le moment si non modifiées)
        addCategoryEventListeners();
        addComponentCategorySelectListener();
        addStockEventListeners();
        addSettingsEventListeners();

        // Démarrer l'écoute de l'état d'authentification
        setupAuthListener();

        // État initial 7 segments
        updateSevenSegmentDisplay(null);

        console.log("StockAV prêt."); // Log 1402
    }

    // Lancer l'application
    initializeApp();

}); // ----- FIN DU FICHIER script.js -----
