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

    let supabase = null;

    // --- Initialisation des Clients et Vérifications ---
    try {
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !FAKE_EMAIL_DOMAIN) {
            throw new Error("Configuration Supabase (URL, Clé Anon, Domaine Factice) manquante ou incomplète dans script.js !");
        }
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log("Client Supabase initialisé.");
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

    // --- État et Historique du Chat ---
    let chatHistory = [];
    let conversationState = {
        awaitingEquivalentChoice: false,
        awaitingQuantityConfirmation: false,
        originalRefChecked: null,
        potentialEquivalents: [],
        chosenRefForStockCheck: null,
        availableQuantity: 0,
        criticalThreshold: null
    };
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

    // --- Helper: Créer le HTML pour l'indicateur de stock (chat) ---
    function createStockIndicatorHTML(quantity, threshold) {
        const status = getStockStatus(quantity, threshold);
        const statusText = status.toUpperCase();
        const thresholdText = (threshold === undefined || threshold === null || threshold < 0) ? 'N/A' : threshold;
        const qtyText = (quantity === undefined || quantity === null) ? 'N/A' : quantity;
        const title = `Stock: ${statusText} (Qté: ${qtyText}, Seuil: ${thresholdText})`;
        return `<span class="stock-indicator-chat level-${status}" title="${title}"></span>`;
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
                console.log("Demande de connexion réussie pour:", data.user?.email);
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
        console.log("Tentative de déconnexion...");
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Erreur déconnexion Supabase:", error.message, error);
            alert(`Erreur déconnexion: ${error.message}. Vérifiez la console.`);
        } else {
            console.log("Déconnexion Supabase réussie.");
             if (searchView?.classList.contains('active-view') && chatHistory.length > 0) {
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
            console.log("Vérification session initiale (getSession)...");
            const { data: { session } } = await supabase.auth.getSession();
            activeSession = session;
            isInitialAuthCheckComplete = true;
            if (session) {
                console.log("Session initiale trouvée (getSession).");
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
            console.log(`Auth Event: ${event}`, session ? `Session pour ${session.user.email}` : "Pas de session");
            activeSession = session;
            if (!isInitialAuthCheckComplete) {
                console.log("Auth event reçu avant fin vérif initiale, attente...");
                return;
            }
            switch (event) {
                case 'SIGNED_IN':
                    handleUserConnected(session.user, false);
                    break;
                case 'SIGNED_OUT':
                    handleUserDisconnected(false);
                    break;
                case 'TOKEN_REFRESHED':
                    console.log("Token rafraîchi.");
                    if (session && currentUser && session.user.id !== currentUser.id) {
                        handleUserConnected(session.user, false);
                    } else if (!session && currentUser) {
                        handleUserDisconnected(false);
                    }
                    break;
                case 'USER_UPDATED':
                    console.log("Utilisateur mis à jour:", session?.user);
                    if (session) handleUserConnected(session.user, false);
                    break;
                case 'PASSWORD_RECOVERY':
                    console.log("Événement de récupération de mot de passe.");
                    break;
                default:
                    console.log("Événement Auth non géré ou redondant:", event);
            }
        });
    }

    // --- Mise à jour UI/État pour Authentification ---
    function handleUserConnected(user, isInitialLoad) {
        const previousUserId = currentUser?.id;
        currentUser = user;
        currentUserCode = currentUser.email.split('@')[0];
        console.log(`Utilisateur connecté: ${currentUserCode} (ID: ${currentUser.id})`);

        document.body.classList.add('user-logged-in');
        if(loginArea) loginArea.style.display = 'none';
        if(userInfoArea) userInfoArea.style.display = 'flex';
        if(userDisplay) userDisplay.textContent = currentUserCode.toUpperCase();
        if(loginError) loginError.style.display = 'none';
        protectedButtons.forEach(btn => {
            if (btn.id === 'show-settings-view') {
                if (currentUserCode === 'zine') {
                    btn.style.display = 'inline-block'; btn.disabled = false; btn.title = '';
                } else {
                    btn.style.display = 'none'; btn.disabled = true; btn.title = 'Accès restreint';
                }
            } else {
                btn.style.display = 'inline-block'; btn.disabled = false; btn.title = '';
            }
        });

        if (categoriesCache.length === 0) { getCategories(); }

        if (!isInitialLoad && user.id !== previousUserId) {
            console.log("Nouvelle connexion détectée (utilisateur différent).");
            invalidateCategoriesCache();
            if (searchView?.classList.contains('active-view')) { displayWelcomeMessage(); }
        } else if (isInitialLoad) {
            const activeView = document.querySelector('.view-section.active-view');
             if (activeView?.id === 'inventory-view') { populateInventoryFilters(); displayInventory(); }
             else if (activeView?.id === 'log-view') { displayLog(); }
             else if (activeView?.id === 'admin-view') { loadAdminData(); }
             else if (activeView?.id === 'settings-view') {
                 if (currentUserCode === 'zine') { loadSettingsData(); }
                 else { console.warn("Accès initial à Settings refusé pour", currentUserCode); setActiveView(searchView, searchTabButton); }
             }
             else if (searchView?.classList.contains('active-view') && chatHistory.length === 0) { displayWelcomeMessage(); }
             else if (!activeView) { setActiveView(searchView, searchTabButton); }
        }
        updateSevenSegmentDisplay();
    }
    function handleUserDisconnected(isInitialLoad) {
        console.log("Utilisateur déconnecté ou session absente.");
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
            if (searchView?.classList.contains('active-view') && chatHistory.length > 0) { displayWelcomeMessage(); }
        }

        const activeView = document.querySelector('.view-section.active-view');
        if (activeView && (activeView.id === 'log-view' || activeView.id === 'admin-view' || activeView.id === 'settings-view')) {
            console.log("Redirection vers vue recherche car déconnecté d'une vue protégée.");
            setActiveView(searchView, searchTabButton);
        } else if (isInitialLoad && !activeView) { setActiveView(searchView, searchTabButton); }
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
        resetStockForm();
        if (componentInfoDiv) componentInfoDiv.style.display = 'none';
        if (adminFeedbackDiv) { adminFeedbackDiv.style.display = 'none'; adminFeedbackDiv.textContent = '';}
        if(exportFeedbackDiv) { exportFeedbackDiv.style.display = 'none'; exportFeedbackDiv.textContent = '';}
        if(importFeedbackDiv) { importFeedbackDiv.style.display = 'none'; importFeedbackDiv.textContent = '';}
        if(importCsvFileInput) importCsvFileInput.value = '';
        const logActionsHeader = document.querySelector('#log-table th.log-actions-header'); if (logActionsHeader) logActionsHeader.remove();
        const purgeButtonContainer = document.getElementById('purge-log-container'); if (purgeButtonContainer) purgeButtonContainer.style.display = 'none';
        console.log("Données des vues protégées effacées de l'UI.");
    }

    // --- Navigation ---
    function setActiveView(viewToShow, buttonToActivate){
        if (!viewToShow) { viewToShow = searchView; buttonToActivate = searchTabButton; console.warn("setActiveView: Vue invalide, retour à la recherche.");}
        if (viewToShow.classList.contains('active-view')) { console.log(`Vue ${viewToShow.id} déjà active.`); return; }

        const isProtected = viewToShow.id === 'log-view' || viewToShow.id === 'admin-view' || viewToShow.id === 'settings-view';
        let canAccess = true;
        if (isProtected && !currentUser) {
            canAccess = false; console.warn(`Accès refusé (non connecté): ${viewToShow.id}`); if (loginError) { loginError.textContent="Connexion requise."; loginError.style.color = 'var(--error-color)'; loginError.style.display='block'; } loginCodeInput?.focus();
        } else if (viewToShow.id === 'settings-view' && currentUserCode !== 'zine') {
            canAccess = false; console.warn(`Accès refusé (pas 'zine'): ${viewToShow.id}`);
        }
        if (!canAccess) { return; }

        viewSections.forEach(section => { section.style.display = 'none'; section.classList.remove('active-view'); });
        document.querySelectorAll('.nav-button').forEach(button => { button.classList.remove('active'); });

        viewToShow.style.display = 'block';
        viewToShow.classList.add('active-view');
        if (buttonToActivate) { buttonToActivate.classList.add('active'); }
        else { const realButtonId = `show-${viewToShow.id}`; const matchingButton = document.getElementById(realButtonId); if (matchingButton) matchingButton.classList.add('active'); }
        console.log(`Activation vue: ${viewToShow.id}`);

        if (viewToShow === searchView && chatHistory.length === 0) { displayWelcomeMessage(); }
        else if (viewToShow === inventoryView) { populateInventoryFilters(); displayInventory(); }
        else if (viewToShow === logView && currentUser) { displayLog(); }
        else if (viewToShow === adminView && currentUser) { loadAdminData(); }
        else if (viewToShow === settingsView && currentUser && currentUserCode === 'zine') { loadSettingsData(); }
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
                if (inventoryCategoryFilter.querySelector(`option[value="${currentVal}"]`)) { inventoryCategoryFilter.value = currentVal; }
                else { inventoryCategoryFilter.value = 'all'; }
            } else { console.warn("Aucune catégorie trouvée pour filtres."); }
        } catch (error) { console.error("Erreur remplissage filtres catégorie:", error); }
    }
    async function displayInventory(page = currentInventoryPage) {
        currentInventoryPage = page;
        if (!inventoryTableBody || !supabase) { console.warn("displayInventory: Prérequis manquants."); return; }
        inventoryTableBody.innerHTML = '<tr class="loading-row"><td colspan="7"><i>Chargement...</i></td></tr>';
        if(inventoryNoResults) inventoryNoResults.style.display = 'none';
        if(inventoryPrevPageButton) inventoryPrevPageButton.disabled = true;
        if(inventoryNextPageButton) inventoryNextPageButton.disabled = true;
        if(inventoryPageInfo) inventoryPageInfo.textContent = 'Chargement...';
        const itemsPerPage = ITEMS_PER_PAGE;
        const startIndex = (currentInventoryPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage - 1;
        try {
            let query = supabase.from('inventory').select('*, categories ( name ), critical_threshold', { count: 'exact' });
            const searchValue = inventorySearchFilter?.value.trim() || '';
            const categoryValue = inventoryCategoryFilter?.value || 'all';
            if (searchValue) { const searchColumns = ['ref', 'description', 'manufacturer']; if (currentUser) { searchColumns.push('drawer'); } query = query.or(searchColumns.map(col => `${col}.ilike.%${searchValue}%`).join(',')); }
            if (categoryValue !== 'all') { query = query.eq('category_id', categoryValue); }
            query = query.order('ref', { ascending: true }).range(startIndex, endIndex);
            const { data, error, count } = await query;
            inventoryTableBody.innerHTML = '';
            if (error) { throw new Error(`Erreur DB inventaire: ${error.message}`); }
            const totalItems = count || 0; const totalPages = Math.ceil(totalItems / itemsPerPage);
            if (totalItems === 0) { if(inventoryNoResults) { inventoryNoResults.textContent = `Aucun composant trouvé${searchValue || categoryValue !== 'all' ? ' pour filtres' : ''}.`; inventoryNoResults.style.display = 'block'; } if(inventoryPageInfo) inventoryPageInfo.textContent = 'Page 0 / 0'; }
            else { if(inventoryNoResults) inventoryNoResults.style.display = 'none';
                data.forEach(item => {
                    const row = inventoryTableBody.insertRow(); row.dataset.ref = item.ref; row.classList.add('inventory-item-row');
                    const refCell = row.insertCell(); const status = getStockStatus(item.quantity, item.critical_threshold); const indicatorSpan = document.createElement('span'); indicatorSpan.classList.add('stock-indicator', `level-${status}`); indicatorSpan.title = `Stock: ${status.toUpperCase()} (Qté: ${item.quantity}, Seuil: ${item.critical_threshold ?? 'N/A'})`; refCell.appendChild(indicatorSpan); refCell.appendChild(document.createTextNode(item.ref));
                    row.insertCell().textContent = item.description || '-'; row.insertCell().textContent = item.categories?.name ?? 'N/A'; row.insertCell().textContent = item.drawer || '-'; row.insertCell().textContent = item.manufacturer || '-';
                    const qtyCell = row.insertCell(); qtyCell.textContent = item.quantity; qtyCell.style.textAlign = 'center';
                    const dsCell = row.insertCell(); if (item.datasheet) { try { new URL(item.datasheet); const link = document.createElement('a'); link.href = item.datasheet; link.textContent = 'Voir'; link.target = '_blank'; link.rel = 'noopener noreferrer'; dsCell.appendChild(link); } catch (_) { dsCell.textContent = '-'; } } else { dsCell.textContent = '-'; } dsCell.style.textAlign = 'center';
                });
                 currentInventoryPage = Math.max(1, Math.min(currentInventoryPage, totalPages || 1));
                 if(inventoryPageInfo) inventoryPageInfo.textContent = `Page ${currentInventoryPage} / ${totalPages || 1}`;
                 if(inventoryPrevPageButton) inventoryPrevPageButton.disabled = currentInventoryPage === 1;
                 if(inventoryNextPageButton) inventoryNextPageButton.disabled = currentInventoryPage >= totalPages;
            }
        } catch (err) { console.error("Erreur affichage inventaire:", err); inventoryTableBody.innerHTML = `<tr><td colspan="7" class="error-message">Erreur chargement: ${err.message}</td></tr>`; if(inventoryPageInfo) inventoryPageInfo.textContent = 'Erreur'; }
    }

    // --- LOGIQUE HISTORIQUE ---
    async function displayLog(page = currentLogPage) {
        const logTable = document.getElementById('log-table');
        const purgeButtonContainerId = 'purge-log-container';
        let purgeButtonContainer = document.getElementById(purgeButtonContainerId);
        const isZine = currentUserCode === 'zine';
        if (isZine) {
            if (!logTable.querySelector('th.log-actions-header')) { const actionTh = document.createElement('th'); actionTh.textContent = 'Actions'; actionTh.classList.add('log-actions-header'); logTable.querySelector('thead tr').appendChild(actionTh); }
            if (!purgeButtonContainer && logTable.parentElement) { purgeButtonContainer = document.createElement('div'); purgeButtonContainer.id = purgeButtonContainerId; purgeButtonContainer.style.cssText = 'text-align: right; margin-top: 15px;'; purgeButtonContainer.innerHTML = `<button id="purge-all-logs-button" class="action-button danger">Purger Tout</button>`; logTable.parentElement.insertAdjacentElement('afterend', purgeButtonContainer); document.getElementById('purge-all-logs-button')?.addEventListener('click', handleDeleteAllLogs); }
             if (purgeButtonContainer) purgeButtonContainer.style.display = 'block';
        } else { logTable.querySelectorAll('th.log-actions-header').forEach(th => th.remove()); logTable.querySelectorAll('td.log-actions-cell').forEach(td => td.remove()); if (purgeButtonContainer) purgeButtonContainer.style.display = 'none'; }

        if (!currentUser) { return; } currentLogPage = page; if (!logTableBody || !supabase) { return; }
        const colspanValue = isZine ? 7 : 6;
        logTableBody.innerHTML = `<tr class="loading-row"><td colspan="${colspanValue}"><i>Chargement...</i></td></tr>`;
        if(logNoResults) logNoResults.style.display = 'none'; if(logPrevPageButton) logPrevPageButton.disabled = true; if(logNextPageButton) logNextPageButton.disabled = true; if(logPageInfo) logPageInfo.textContent = 'Chargement...';
        const itemsPerPage = ITEMS_PER_PAGE; const startIndex = (currentLogPage - 1) * itemsPerPage; const endIndex = startIndex + itemsPerPage - 1;
        try {
            const { data, error, count } = await supabase.from('logs').select('id, created_at, user_code, component_ref, quantity_change, quantity_after', { count: 'exact' }).order('created_at', { ascending: false }).range(startIndex, endIndex);
            logTableBody.innerHTML = ''; if (error) { throw new Error(`Erreur DB logs: ${error.message}`); }
            const totalItems = count || 0; const totalPages = Math.ceil(totalItems / itemsPerPage);
            if (totalItems === 0) { if(logNoResults) { logNoResults.textContent = "Historique vide."; logNoResults.style.display = 'block'; } if (purgeButtonContainer) purgeButtonContainer.style.display = 'none'; if(logPageInfo) logPageInfo.textContent = 'Page 0 / 0'; }
            else { if(logNoResults) logNoResults.style.display = 'none'; if (isZine && purgeButtonContainer) purgeButtonContainer.style.display = 'block';
                data.forEach(entry => {
                    const row = logTableBody.insertRow(); row.insertCell().textContent = formatLogTimestamp(new Date(entry.created_at)); row.insertCell().textContent = entry.user_code || 'N/A';
                    const actionCell = row.insertCell(); actionCell.textContent = entry.quantity_change > 0 ? 'Ajout' : 'Retrait'; actionCell.classList.add(entry.quantity_change > 0 ? 'positive' : 'negative');
                    row.insertCell().textContent = entry.component_ref;
                    const changeCell = row.insertCell(); changeCell.textContent = entry.quantity_change > 0 ? `+${entry.quantity_change}` : `${entry.quantity_change}`; changeCell.classList.add(entry.quantity_change > 0 ? 'positive' : 'negative');
                    row.insertCell().textContent = entry.quantity_after;
                    if (isZine) { const actionTd = row.insertCell(); actionTd.classList.add('log-actions-cell'); actionTd.style.textAlign = 'center'; const deleteButton = document.createElement('button'); deleteButton.textContent = 'Suppr.'; deleteButton.classList.add('delete-log-button', 'danger-small'); deleteButton.title = `Supprimer ID: ${entry.id}`; deleteButton.dataset.logId = entry.id; actionTd.appendChild(deleteButton); }
                });
                 currentLogPage = Math.max(1, Math.min(currentLogPage, totalPages || 1));
                 if(logPageInfo) logPageInfo.textContent = `Page ${currentLogPage} / ${totalPages || 1}`;
                 if(logPrevPageButton) logPrevPageButton.disabled = currentLogPage === 1;
                 if(logNextPageButton) logNextPageButton.disabled = currentLogPage >= totalPages;
            }
        } catch (err) { console.error("Erreur affichage historique:", err); logTableBody.innerHTML = `<tr><td colspan="${colspanValue}" class="error-message">Erreur: ${err.message}</td></tr>`; if(logPageInfo) logPageInfo.textContent = 'Erreur'; if (purgeButtonContainer) purgeButtonContainer.style.display = 'none'; }
    }
    function formatLogTimestamp(date) { try { return date.toLocaleString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }); } catch(e) { return date.toISOString(); } }
    async function addLogEntry(itemRef, change, newQuantity) { if (!currentUser || !currentUserCode || !supabase) { return; } const logData = { user_id: currentUser.id, user_code: currentUserCode.toUpperCase(), component_ref: itemRef, quantity_change: change, quantity_after: newQuantity }; console.log("Tentative log:", logData); try { const { error: logError } = await supabase.from('logs').insert(logData); if (logError) { console.error("Erreur écriture log:", logError); } else { console.log("Log enregistré."); if (logView?.classList.contains('active-view') && currentLogPage === 1) { displayLog(1); } } } catch (err) { console.error("Erreur JS log:", err); } }
    async function handleDeleteSingleLog(event) { const targetButton = event.target.closest('button.delete-log-button'); if (!targetButton) return; const logId = targetButton.dataset.logId; if (!logId) { alert("Erreur: ID log manquant."); return; } if (currentUserCode !== 'zine') { alert("Action non autorisée."); return; } if (!confirm(`Supprimer log ID: ${logId} ?`)) { return; } targetButton.disabled = true; targetButton.textContent = '...'; try { const { error } = await supabase.from('logs').delete().eq('id', logId); if (error) { throw new Error(`Erreur DB suppression log: ${error.message}`); } console.log(`Log ID ${logId} supprimé.`); displayLog(currentLogPage); } catch (err) { console.error("Erreur suppression log:", err); alert(`Erreur: ${err.message}`); targetButton.disabled = false; targetButton.textContent = 'Suppr.'; } }
    async function handleDeleteAllLogs() { if (currentUserCode !== 'zine') { alert("Action non autorisée."); return; } if (!confirm("ATTENTION !\nSupprimer TOUT l'historique ?\nIRRÉVERSIBLE !")) { return; } if (!confirm("Seconde confirmation : Vraiment tout effacer ?")) { return; } const purgeButton = document.getElementById('purge-all-logs-button'); if (purgeButton) { purgeButton.disabled = true; purgeButton.textContent = 'Suppression...'; } const feedbackDiv = logView.querySelector('.feedback-area') || adminFeedbackDiv || document.createElement('div'); const showFeedback = (msg, type) => { if(!feedbackDiv.parentElement && logView) { feedbackDiv.id="log-feedback"; feedbackDiv.className=`feedback-area ${type}`; logView.insertBefore(feedbackDiv, logView.firstChild); } feedbackDiv.textContent=msg; feedbackDiv.className=`feedback-area ${type}`; feedbackDiv.style.display='block';}; showFeedback("Suppression de tout l'historique...", 'warning'); try { const { error } = await supabase.from('logs').delete().neq('id', '00000000-0000-0000-0000-000000000000'); if (error) { throw new Error(`Erreur DB purge logs: ${error.message}`); } console.log("Logs purgés."); showFeedback("Historique purgé.", 'success'); displayLog(1); } catch (err) { console.error("Erreur purge logs:", err); showFeedback(`Erreur purge: ${err.message}`, 'error'); if (purgeButton) { purgeButton.disabled = false; purgeButton.textContent = "Purger Tout"; } } }

    // --- VUE ADMIN ---
    async function getCategories() { if (categoriesCache.length > 0) { return categoriesCache; } if (!supabase) { return []; } console.log("Fetching categories..."); try { const { data, error } = await supabase.from('categories').select('id, name, attributes').order('name', { ascending: true }); if (error) { throw new Error(`Erreur DB cat: ${error.message}`); } categoriesCache = data || []; console.log(`Categories cached: ${categoriesCache.length}.`); return categoriesCache; } catch (err) { console.error("Erreur lecture cat:", err); if (adminView?.classList.contains('active-view')) { showAdminFeedback(`Erreur chargement cat: ${err.message}`, 'error'); } return []; } }
    function invalidateCategoriesCache() { categoriesCache = []; console.log("Cache cat invalidé."); }
    async function loadAdminData() { if (!currentUser) return; const catManager = document.getElementById('category-manager'); const stockManager = document.getElementById('stock-manager'); if (catManager) catManager.style.display = 'block'; if (stockManager) stockManager.style.display = 'block'; if (adminFeedbackDiv) { adminFeedbackDiv.style.display = 'none'; adminFeedbackDiv.textContent = ''; } resetStockForm(); try { await loadCategoriesAdmin(); } catch (error) { console.error("Erreur loadAdminData:", error); showAdminFeedback(`Erreur load admin: ${error.message}`, 'error'); } }
    async function loadCategoriesAdmin() { if (categoryList) categoryList.innerHTML = '<li><i>Chargement...</i></li>'; if (componentCategorySelectAdmin) componentCategorySelectAdmin.innerHTML = '<option value="">Chargement...</option>'; try { const categories = await getCategories(); if (categoryList) categoryList.innerHTML = ''; if (componentCategorySelectAdmin) componentCategorySelectAdmin.innerHTML = '<option value="">-- Sélectionner --</option>'; if (categories && categories.length > 0) { categories.forEach(cat => { if (categoryList) { const li = document.createElement('li'); li.dataset.categoryId = cat.id; li.innerHTML = `<span>${cat.name}</span><span class="category-actions"><button class="edit-cat">Modif</button> <button class="delete-cat danger-small">Suppr.</button></span>`; categoryList.appendChild(li); } if (componentCategorySelectAdmin) { const option = document.createElement('option'); option.value = cat.id; option.textContent = cat.name; option.dataset.attributes = cat.attributes || ''; componentCategorySelectAdmin.appendChild(option); } }); } else { if (categoryList) categoryList.innerHTML = '<li>Aucune catégorie.</li>'; if (componentCategorySelectAdmin) componentCategorySelectAdmin.innerHTML = '<option value="">Aucune</option>'; } } catch (error) { console.error("Erreur loadCategoriesAdmin:", error); if (categoryList) categoryList.innerHTML = '<li>Erreur chargement.</li>'; if (componentCategorySelectAdmin) componentCategorySelectAdmin.innerHTML = '<option value="">Erreur</option>'; } }
    function addCategoryEventListeners() { categoryList?.addEventListener('click', async (event) => { const targetButton = event.target.closest('button'); if (!targetButton) return; const listItem = targetButton.closest('li[data-category-id]'); if (!listItem) return; const categoryId = listItem.dataset.categoryId; if (!categoryId || !supabase) return; const category = categoriesCache.find(c => c.id === categoryId); if (!category) { console.error(`Cat ID ${categoryId} non trouvée cache.`); showAdminFeedback('Erreur interne: Cat non trouvée.', 'error'); return; } if (targetButton.classList.contains('edit-cat')) { if(categoryIdEditInput) categoryIdEditInput.value = category.id; if(categoryNameInput) categoryNameInput.value = category.name; if(categoryAttributesInput) categoryAttributesInput.value = category.attributes || ''; if(categoryFormTitle) categoryFormTitle.textContent = `Modif: ${category.name}`; if(cancelEditButton) cancelEditButton.style.display = 'inline-block'; categoryNameInput?.focus(); showAdminFeedback(`Modif "${category.name}"...`, 'info'); } else if (targetButton.classList.contains('delete-cat')) { if (!confirm(`Supprimer cat "${category.name}" ?`)) return; showAdminFeedback(`Suppression "${category.name}"...`, "info"); targetButton.disabled = true; targetButton.closest('.category-actions')?.querySelectorAll('button').forEach(b => b.disabled = true); try { const { error } = await supabase.from('categories').delete().eq('id', categoryId); if (error && error.code === '23503') { throw new Error(`Impossible supprimer: Cat "${category.name}" utilisée.`); } else if (error) { throw new Error(`DB Error: ${error.message}`); } showAdminFeedback(`Cat "${category.name}" supprimée.`, 'success'); invalidateCategoriesCache(); await loadCategoriesAdmin(); if (categoryIdEditInput?.value === categoryId) { resetCategoryForm(); } await populateInventoryFilters(); } catch (err) { console.error("Erreur suppression cat:", err); showAdminFeedback(`Erreur suppression: ${err.message}`, 'error'); const stillExistingLi = categoryList.querySelector(`li[data-category-id="${categoryId}"]`); if (stillExistingLi) { stillExistingLi.querySelectorAll('button').forEach(b => b.disabled = false); } } } }); cancelEditButton?.addEventListener('click', resetCategoryForm); categoryForm?.addEventListener('submit', async (event) => { event.preventDefault(); if (!supabase) return; const catName = categoryNameInput?.value.trim(); const catAttributes = categoryAttributesInput?.value.trim(); const editingId = categoryIdEditInput?.value; if (!catName) { showAdminFeedback("Nom catégorie obligatoire.", 'error'); categoryNameInput?.focus(); return; } const categoryData = { name: catName, attributes: catAttributes === '' ? null : catAttributes }; showAdminFeedback("Enregistrement...", "info"); const saveBtn = document.getElementById('save-category-button'); if(saveBtn) saveBtn.disabled = true; if(cancelEditButton) cancelEditButton.disabled = true; try { let response; if (editingId) { response = await supabase.from('categories').update(categoryData).eq('id', editingId).select().single(); } else { response = await supabase.from('categories').insert(categoryData).select().single(); } const { data, error } = response; if (error) { if (error.code === '23505') { showAdminFeedback(`Erreur: Nom cat "${catName}" existe déjà.`, 'error'); categoryNameInput?.focus(); } else { throw new Error(`DB Error: ${error.message}`); } } else { showAdminFeedback(`Cat "${data.name}" ${editingId ? 'modifiée' : 'ajoutée'}.`, 'success'); invalidateCategoriesCache(); await loadCategoriesAdmin(); resetCategoryForm(); await populateInventoryFilters(); } } catch (err) { console.error("Erreur enregistrement cat:", err); showAdminFeedback(`Erreur: ${err.message}`, 'error'); } finally { if(saveBtn) saveBtn.disabled = false; if(cancelEditButton) { cancelEditButton.disabled = false; if(!categoryIdEditInput?.value) cancelEditButton.style.display = 'none'; } } }); }
    function resetCategoryForm(){ if(categoryForm) categoryForm.reset(); if(categoryIdEditInput) categoryIdEditInput.value = ''; if(categoryFormTitle) categoryFormTitle.textContent = "Ajouter une Catégorie"; if(cancelEditButton) cancelEditButton.style.display = 'none'; if (adminFeedbackDiv) adminFeedbackDiv.style.display = 'none'; }
    function addComponentCategorySelectListener() { componentCategorySelectAdmin?.addEventListener('change', () => { if (!specificAttributesDiv) return; specificAttributesDiv.innerHTML = ''; specificAttributesDiv.style.display = 'none'; const selectedOption = componentCategorySelectAdmin.options[componentCategorySelectAdmin.selectedIndex]; if (!selectedOption || !selectedOption.value) return; const attributesString = selectedOption.dataset.attributes; const categoryName = selectedOption.textContent; if (attributesString && attributesString.trim() !== "") { specificAttributesDiv.style.display = 'block'; const attributes = attributesString.split(',').map(attr => attr.trim()).filter(attr => attr); if (attributes.length > 0) { const titleElement = document.createElement('h4'); titleElement.textContent = `Attributs Spécifiques (${categoryName})`; specificAttributesDiv.appendChild(titleElement); attributes.forEach(attr => { const formGroup = document.createElement('div'); formGroup.classList.add('form-group'); const inputId = `attr-${attr.toLowerCase().replace(/[^a-z0-9]/g, '-')}`; const label = document.createElement('label'); label.setAttribute('for', inputId); label.textContent = `${attr}:`; const input = document.createElement('input'); input.setAttribute('type', 'text'); input.setAttribute('id', inputId); input.setAttribute('name', `attributes[${attr}]`); input.setAttribute('placeholder', `Valeur pour ${attr}`); input.dataset.attributeName = attr; formGroup.appendChild(label); formGroup.appendChild(input); specificAttributesDiv.appendChild(formGroup); }); } } }); }
    function showAdminFeedback(message, type = 'info'){ if (adminFeedbackDiv) { adminFeedbackDiv.textContent = message; adminFeedbackDiv.className = `feedback-area ${type}`; adminFeedbackDiv.style.display = 'block'; } }
    function resetStockForm() { if (stockForm) stockForm.reset(); if (componentInfoDiv) componentInfoDiv.style.display = 'none'; if (specificAttributesDiv) { specificAttributesDiv.innerHTML = ''; specificAttributesDiv.style.display = 'none'; } if (componentRefAdminInput) componentRefAdminInput.disabled = false; if (componentInitialQuantityInput) componentInitialQuantityInput.value = 0; if (componentThresholdInput) componentThresholdInput.value = ''; if (adminFeedbackDiv) adminFeedbackDiv.style.display = 'none'; if (componentCategorySelectAdmin) componentCategorySelectAdmin.value = ""; console.log("Formulaire stock réinitialisé."); }
    function addStockEventListeners() {
        checkStockButton?.addEventListener('click', async () => { const ref = componentRefAdminInput?.value.trim().toUpperCase(); if (!ref) { showAdminFeedback("Entrez réf.", 'warning'); return; } if(adminFeedbackDiv) adminFeedbackDiv.style.display = 'none'; if(checkStockButton) checkStockButton.disabled = true; checkStockButton.textContent = "Vérif..."; if(componentRefAdminInput) componentRefAdminInput.disabled = true; try { const stockInfo = await getStockInfoFromSupabase(ref); if (stockInfo) { console.log("Stock info admin:", stockInfo); if(componentInfoDiv) componentInfoDiv.style.display = 'block'; if(currentQuantitySpan) currentQuantitySpan.textContent = stockInfo.quantity; if(quantityChangeInput) quantityChangeInput.value = 0; if(componentDescInput) componentDescInput.value = stockInfo.description || ""; if(componentMfgInput) componentMfgInput.value = stockInfo.manufacturer || ""; if(componentDatasheetInput) componentDatasheetInput.value = stockInfo.datasheet || ""; if(componentDrawerAdminInput) componentDrawerAdminInput.value = stockInfo.drawer || ""; if(componentInitialQuantityInput) componentInitialQuantityInput.value = stockInfo.quantity; if(componentThresholdInput) componentThresholdInput.value = stockInfo.critical_threshold ?? ''; if(componentCategorySelectAdmin) { componentCategorySelectAdmin.value = stockInfo.category_id || ""; componentCategorySelectAdmin.dispatchEvent(new Event('change')); } setTimeout(() => { if (stockInfo.attributes && typeof stockInfo.attributes === 'object' && specificAttributesDiv) { Object.entries(stockInfo.attributes).forEach(([key, value]) => { const inputField = specificAttributesDiv.querySelector(`input[data-attribute-name="${key}"]`); if (inputField) { inputField.value = value || ''; } else { console.warn(`Input attr '${key}' non trouvé.`); } }); } }, 50); showAdminFeedback(`Composant "${ref}" trouvé.`, 'success'); if (currentUser && stockInfo.drawer) { updateSevenSegmentDisplay(stockInfo.drawer); } } else { if(componentInfoDiv) componentInfoDiv.style.display = 'none'; resetStockForm(); if(componentRefAdminInput) componentRefAdminInput.value = ref; showAdminFeedback(`Composant "${ref}" inconnu. Remplissez pour ajouter.`, 'info'); componentDescInput?.focus(); updateSevenSegmentDisplay(null); } } catch (error) { console.error("Erreur checkStock:", error); showAdminFeedback(`Erreur vérif: ${error.message}`, 'error'); resetStockForm(); if(componentRefAdminInput) componentRefAdminInput.value = ref; } finally { if(checkStockButton) checkStockButton.disabled = false; checkStockButton.textContent = "Vérifier"; if(componentRefAdminInput) componentRefAdminInput.disabled = false; } });
        updateQuantityButton?.addEventListener('click', async () => { const ref = componentRefAdminInput?.value.trim().toUpperCase(); const changeStr = quantityChangeInput?.value; const change = parseInt(changeStr, 10); if (!ref) { showAdminFeedback("Réf manquante.", 'warning'); return; } if (changeStr === '' || isNaN(change)) { showAdminFeedback("Qté invalide.", 'warning'); quantityChangeInput?.focus(); return; } if (change === 0) { showAdminFeedback("Aucun changement.", 'info'); return; } const currentDisplayedQuantity = parseInt(currentQuantitySpan?.textContent, 10); if (!isNaN(currentDisplayedQuantity) && currentDisplayedQuantity + change < 0) { showAdminFeedback(`Stock négatif (${currentDisplayedQuantity + change}).`, 'error'); return; } if(updateQuantityButton) updateQuantityButton.disabled = true; updateQuantityButton.textContent = "MàJ..."; try { const newQuantity = await updateStockInSupabase(ref, change); if (newQuantity !== null) { if(currentQuantitySpan) currentQuantitySpan.textContent = newQuantity; if(componentInitialQuantityInput) componentInitialQuantityInput.value = newQuantity; if(quantityChangeInput) quantityChangeInput.value = 0; showAdminFeedback(`Stock "${ref}" MàJ: ${newQuantity}.`, 'success'); if (inventoryView.classList.contains('active-view')) { displayInventory(); } } } catch (error) { console.error("Erreur JS updateQty:", error); showAdminFeedback(error.message.includes("Stock insuffisant") ? "Stock insuffisant." : `Erreur MàJ: ${error.message}`, 'error'); } finally { if(updateQuantityButton) updateQuantityButton.disabled = false; updateQuantityButton.textContent = "Mettre à jour"; } });
        stockForm?.addEventListener('submit', async (event) => {
            event.preventDefault(); if (!supabase) return;
            const ref = componentRefAdminInput?.value.trim().toUpperCase();
            const categoryId = componentCategorySelectAdmin?.value || null; // camelCase
            const description = componentDescInput?.value.trim() || null;
            const manufacturer = componentMfgInput?.value.trim() || null;
            const datasheet = componentDatasheetInput?.value.trim() || null;
            const drawer = componentDrawerAdminInput?.value.trim().toUpperCase() || null;
            const quantityStr = componentInitialQuantityInput?.value;
            const thresholdStr = componentThresholdInput?.value.trim();
            if (!ref) { showAdminFeedback("Réf obligatoire.", 'error'); componentRefAdminInput?.focus(); return; }
            // *** Validation Catégorie (Utilise bien categoryId) ***
            if (!categoryId) { showAdminFeedback("Veuillez sélectionner une catégorie.", 'error'); componentCategorySelectAdmin?.focus(); return; }
            const quantity = parseInt(quantityStr, 10);
            if (quantityStr === '' || isNaN(quantity) || quantity < 0) { showAdminFeedback("Qté invalide (>= 0).", 'error'); componentInitialQuantityInput?.focus(); return; }
            let critical_threshold = null;
            if (thresholdStr !== '') { critical_threshold = parseInt(thresholdStr, 10); if (isNaN(critical_threshold) || critical_threshold < 0) { showAdminFeedback("Seuil invalide (>= 0).", 'error'); componentThresholdInput?.focus(); return; } }
            if (datasheet) { try { new URL(datasheet); } catch (_) { showAdminFeedback("URL Datasheet invalide.", 'error'); componentDatasheetInput?.focus(); return; } }
            const attributes = {}; specificAttributesDiv?.querySelectorAll('input[data-attribute-name]').forEach(input => { const attrName = input.dataset.attributeName; const attrValue = input.value.trim(); if (attrName && attrValue) { attributes[attrName] = attrValue; } });
            // *** Préparation Données (Assigne categoryId à category_id) ***
            const componentData = { ref, description, manufacturer, quantity, datasheet, drawer, category_id: categoryId, attributes: Object.keys(attributes).length > 0 ? attributes : null, critical_threshold };
            console.log("Prépa Upsert:", componentData); showAdminFeedback("Enregistrement...", "info"); if(saveComponentButton) saveComponentButton.disabled = true;
            try {
                const { data, error } = await supabase.from('inventory').upsert(componentData, { onConflict: 'ref' }).select().single();
                if (error) { throw new Error(`Erreur DB: ${error.message}`); }
                console.log("Upsert succès:", data); showAdminFeedback(`Composant "${ref}" enregistré/MàJ.`, 'success');
                if (componentInfoDiv?.style.display === 'block') { if(currentQuantitySpan) currentQuantitySpan.textContent = data.quantity; if(quantityChangeInput) quantityChangeInput.value = 0; }
                if (inventoryView.classList.contains('active-view')) { displayInventory(); }
                if (currentUser && data.drawer) { updateSevenSegmentDisplay(data.drawer); }
            } catch(err) { console.error("Erreur upsert composant:", err); showAdminFeedback(`Erreur enregistrement: ${err.message}`, 'error'); }
            finally { if(saveComponentButton) saveComponentButton.disabled = false; }
        });
    }

    // --- LOGIQUE VUE RECHERCHE (Chat) ---
    async function addMessageToChat(sender, messageContent, isHTML = false) { if (!responseOutputChat) return; const messageElement = document.createElement('div'); messageElement.classList.add('message', sender.toLowerCase()); responseOutputChat.prepend(messageElement); if (sender === 'AI') { loadingIndicatorChat.style.display = 'block'; loadingIndicatorChat.querySelector('i').textContent = 'StockAV réfléchit...'; messageElement.innerHTML = '...'; await delay(150); if (isHTML) { messageElement.innerHTML = messageContent; } else { messageElement.textContent = ''; for (let i = 0; i < messageContent.length; i++) { messageElement.textContent += messageContent[i]; await delay(5); } } loadingIndicatorChat.style.display = 'none'; } else { messageElement.textContent = messageContent; } const role = sender === 'User' ? 'user' : 'assistant'; chatHistory.push({ role: role, content: messageContent }); if (chatHistory.length > 10) { chatHistory.splice(0, chatHistory.length - 10); } responseOutputChat.scrollTop = 0; }
    function displayWelcomeMessage() { if (responseOutputChat) responseOutputChat.innerHTML = ''; chatHistory = []; resetConversationState(); addMessageToChat('AI', "Bonjour ! Je suis StockAV. Quelle référence cherchez-vous ?"); if(componentInputChat) { componentInputChat.value = ''; componentInputChat.focus(); } }
    async function handleUserInput() { const userInput = componentInputChat?.value.trim(); if (!userInput) return; addMessageToChat('User', userInput); if (componentInputChat) componentInputChat.value = ''; try { if (conversationState.awaitingQuantityConfirmation) { if (!currentUser) { await promptLoginBeforeAction("confirmer quantité"); return; } await handleQuantityResponse(userInput); } else { const potentialRef = extractReference(userInput); if (potentialRef) { console.log(`Nouvelle réf: ${potentialRef}. Appel checkComponentWithAI.`); resetConversationState(); conversationState.originalRefChecked = potentialRef; await checkComponentWithAI(potentialRef); } else { if (conversationState.awaitingEquivalentChoice) { await addMessageToChat('AI', "Entrée non reconnue. Cliquez 'Prendre' ou entrez nouvelle réf."); } else { await addMessageToChat('AI', "Non compris. Entrez réf composant ?"); resetConversationState(); } } } } catch (error) { console.error("Erreur majeure handleUserInput:", error); await addMessageToChat('AI', "Oups ! Erreur inattendue. Réessayez."); resetConversationState(); } finally { if(componentInputChat) componentInputChat.focus(); } }
    function extractReference(text) { const upperText = text.toUpperCase(); let bestMatch = null; const patterns = [ /\b(PIC\s?[A-Z\d\-F/L]+)\b/, /\b(AT[TINY|MEGA|XMEGA]+\s?\d+[A-Z\d\-]*)\b/, /\b(STM32[A-Z]\d{2,}[A-Z\d]*)\b/, /\b(ESP[ -]?\d{2,}[A-Z\d\-]*)\b/, /\b(IRF[A-Z\d]+)\b/, /\b(LM\s?\d{2,}[A-Z\d\-/]*)\b/, /\b(NE\s?\d{3}[A-Z]*)\b/, /\b(UA\s?\d{3,}[A-Z]*)\b/, /\b(MAX\s?\d{3,}[A-Z\d\-/]*)\b/, /\b(SN\s?74[A-Z\d]+)\b/, /\b(CD\s?4\d{3,}[A-Z]*)\b/, /\b([1-9]N\s?\d{4}[A-Z]*)\b/, /\b([2-9](?:N|P)\s?\d{4}[A-Z]*)\b/, /\b(BC\s?\d{3}[A-Z]*)\b/, /\b(BD\s?\d{3}[A-Z]*)\b/, /\b(TIP\s?\d{2,}[A-Z]*)\b/, /\b(MOC\s?\d{4}[A-Z]*)\b/, /\b(\d+(?:\.\d+)?\s?(PF|NF|UF|µF))\b/i, /\b(\d+(?:\.\d+)?[RK]?)\s?(R|K|M)?\s?O?H?M?S?\b/i, /\b([A-Z]{2,}\d{2,}[A-Z\d\-/]*)\b/, /\b(\d{2,}[A-Z]{1,}[A-Z\d\-/]*)\b/, /\b([A-Z]{1,}\d{3,}[A-Z\d\-/]*)\b/ ]; const ignoreWords = new Set([ 'POUR','AVEC','COMBIEN','STOCK','CHERCHE','DISPO','EQUIV','REMPLACE','TROUVE','QUEL','EST','QUE','SONT','LES','DU','UN','UNE','OU','ET','LE','LA','DE','À','PLUS','MOINS','PEUT','IL','ELLE','ON','JE','TU','COMME','DANS','SUR','VOLTS','AMPERES','WATTS','OHMS','FARADS','HENRYS','TYPE','VALEUR' ]); for (const pattern of patterns) { const match = upperText.match(pattern); if (match && match[1]) { const cleanedRef = match[1].replace(/\s+/g, '').replace(/OHMS?|FARADS?/, ''); if (cleanedRef.length >= 3 && !/^\d+$/.test(cleanedRef) && !ignoreWords.has(cleanedRef)) { if (!bestMatch || cleanedRef.length > bestMatch.length) { bestMatch = cleanedRef; } } } } if (!bestMatch) { const words = upperText.split(/[\s,;:!?()]+/); const potentialRefs = words.filter(w => w.length >= 3 && /\d/.test(w) && /[A-Z]/.test(w) && !/^\d+$/.test(w) && !ignoreWords.has(w) ); if (potentialRefs.length > 0) { potentialRefs.sort((a, b) => b.length - a.length); bestMatch = potentialRefs[0]; } } console.log(`Ref extracted: ${bestMatch}`); return bestMatch; }
    async function checkComponentWithAI(originalRef) { loadingIndicatorChat.style.display = 'block'; loadingIndicatorChat.querySelector('i').textContent = `Analyse locale ${originalRef}...`; let originalStockInfo = null; let equivalents = []; let aiError = null; let responseHTML = ""; try { originalStockInfo = await getStockInfoFromSupabase(originalRef); await delay(150); if (currentUser && originalStockInfo?.drawer) { updateSevenSegmentDisplay(originalStockInfo.drawer); } const showDrawer = currentUser && originalStockInfo?.drawer; let originalStatusHTML = ""; if (originalStockInfo) { const indicatorHTML = createStockIndicatorHTML(originalStockInfo.quantity, originalStockInfo.critical_threshold); originalStatusHTML = (originalStockInfo.quantity > 0) ? `${indicatorHTML}Original <strong>${originalRef}</strong> : Dispo (Qté: ${originalStockInfo.quantity}${showDrawer ? `, Tiroir: ${originalStockInfo.drawer}` : ''}).` : `${indicatorHTML}Original <strong>${originalRef}</strong> : Rupture local.`; if (originalStockInfo.quantity > 0) conversationState.criticalThreshold = originalStockInfo.critical_threshold; } else { originalStatusHTML = `${createStockIndicatorHTML(undefined, undefined)}Original <strong>${originalRef}</strong> : Non trouvé local.`; } responseHTML += originalStatusHTML; loadingIndicatorChat.querySelector('i').textContent = `Recherche équivalents IA ${originalRef}...`; const aiResult = await getAIEquivalents(originalRef); if (aiResult.error) { aiError = aiResult.error; console.error("Erreur getAIEquivalents:", aiError); } else { equivalents = aiResult.equivalents || []; } let equivalentsStockInfo = {}; if (equivalents.length > 0) { loadingIndicatorChat.querySelector('i').textContent = `Vérif stock local équivalents...`; const equivalentRefs = equivalents.map(eq => eq.ref); const stockCheckPromises = equivalentRefs.map(ref => getStockInfoFromSupabase(ref)); const results = await Promise.all(stockCheckPromises); results.forEach((stockInfo, index) => { if (stockInfo) { equivalentsStockInfo[equivalentRefs[index]] = stockInfo; } }); console.log("Stock info équivalents:", equivalentsStockInfo); } if (equivalents.length > 0) { responseHTML += "<br><br><strong>Équivalents suggérés IA :</strong>"; let foundAvailableEquivalent = false; equivalents.forEach(eq => { const eqStock = equivalentsStockInfo[eq.ref]; const eqIndicatorHTML = createStockIndicatorHTML(eqStock?.quantity, eqStock?.critical_threshold); const eqShowDrawer = currentUser && eqStock?.drawer; responseHTML += `<div class="equivalent-item">`; responseHTML += `${eqIndicatorHTML}<strong>${eq.ref}</strong> <small>(${eq.reason || 'Suggestion AI'})</small>`; if (eqStock) { if (eqStock.quantity > 0) { foundAvailableEquivalent = true; responseHTML += ` : Dispo (Qté: ${eqStock.quantity}${eqShowDrawer ? `, Tiroir: ${eqStock.drawer}` : ''})`; if (currentUser) { responseHTML += ` <button class="choice-button take-button" data-ref="${eq.ref}" data-qty="${eqStock.quantity}" data-threshold="${eqStock.critical_threshold ?? ''}">Prendre</button>`; } } else { responseHTML += ` : Rupture local.`; responseHTML += provideExternalLinksHTML(eq.ref, true); } } else { responseHTML += ` : Non trouvé local.`; responseHTML += provideExternalLinksHTML(eq.ref, true); } responseHTML += `</div>`; }); if (foundAvailableEquivalent || (originalStockInfo && originalStockInfo.quantity > 0)) { conversationState.awaitingEquivalentChoice = true; } } else if (!aiError) { responseHTML += "<br><br>IA n'a pas trouvé d'équivalents."; } if (originalStockInfo && originalStockInfo.quantity > 0 && currentUser) { responseHTML += `<br><button class="choice-button take-button" data-ref="${originalRef}" data-qty="${originalStockInfo.quantity}" data-threshold="${originalStockInfo.critical_threshold ?? ''}">Prendre original (${originalRef})</button>`; conversationState.awaitingEquivalentChoice = true; } else if (originalStockInfo && originalStockInfo.quantity > 0 && !currentUser) { responseHTML += `<br><br><i>Original dispo. Connectez-vous pour prendre.</i>`; } if (!originalStockInfo || originalStockInfo.quantity <= 0) { responseHTML += provideExternalLinksHTML(originalRef, false); } if (aiError) { responseHTML += `<br><br><i style="color: var(--error-color);">Erreur IA équivalents: ${aiError}.</i>`; if (!responseHTML.includes('external-links-block') && (!originalStockInfo || originalStockInfo.quantity <= 0)) { responseHTML += provideExternalLinksHTML(originalRef, false); } } if (!conversationState.awaitingEquivalentChoice && !conversationState.awaitingQuantityConfirmation) { responseHTML += "<br><br>Autre chose ?"; resetConversationState(); } else if (!currentUser && conversationState.awaitingEquivalentChoice) { responseHTML += `<br><br><i>Connectez-vous pour choisir/prendre.</i>`; } } catch (error) { console.error(`Erreur majeure checkComponentWithAI pour ${originalRef}:`, error); responseHTML = `Erreur recherche <strong>${originalRef}</strong>.<br>Détails: ${error.message}`; resetConversationState(); } finally { loadingIndicatorChat.style.display = 'none'; await addMessageToChat('AI', responseHTML, true); } }
    async function getAIEquivalents(reference) { if (!supabase) { return { equivalents: null, error: "Client Supabase non init." }; } console.log(`Appel func Edge 'openai-equivalents' pour: ${reference}`); try { const { data, error: invokeError } = await supabase.functions.invoke('openai-equivalents', { body: { reference: reference } }); if (invokeError) { let message = invokeError.message || "Erreur inconnue func Edge"; if (invokeError.context?.status === 404 || message.includes("Function not found")) { message = "Service IA non trouvé."; } else if (invokeError.context?.status === 500) { message = "Erreur interne service IA."; } else if (message.includes("fetch failed")) { message = "Impossible contacter service IA."; } throw new Error(message); } if (data && data.error) { console.error("Erreur retournée par func Edge:", data.error); return { equivalents: null, error: data.error }; } if (data && Array.isArray(data.equivalents)) { console.log("Équivalents reçus:", data.equivalents); return { equivalents: data.equivalents, error: null }; } else { console.warn("Structure data inattendue func Edge:", data); return { equivalents: [], error: "Réponse inattendue service IA." }; } } catch (error) { console.error("Erreur générale getAIEquivalents:", error); return { equivalents: null, error: error.message || "Échec comm service IA." }; } }
    responseOutputChat?.addEventListener('click', async (event) => { const targetButton = event.target.closest('button.choice-button.take-button'); if (targetButton && conversationState.awaitingEquivalentChoice) { const chosenRef = targetButton.dataset.ref; const availableQtyStr = targetButton.dataset.qty; const criticalThresholdStr = targetButton.dataset.threshold; if (!chosenRef || availableQtyStr === undefined) { return; } const availableQty = parseInt(availableQtyStr, 10); if (isNaN(availableQty) || availableQty <= 0) { return; } if (!currentUser) { await promptLoginBeforeAction(`prendre ${chosenRef}`); return; } console.log(`Choix: ${chosenRef}, Qté: ${availableQty}`); conversationState.awaitingEquivalentChoice = false; addMessageToChat('User', `Je prends ${chosenRef}`); await delay(50); conversationState.chosenRefForStockCheck = chosenRef; conversationState.availableQuantity = availableQty; conversationState.criticalThreshold = (criticalThresholdStr && !isNaN(parseInt(criticalThresholdStr, 10))) ? parseInt(criticalThresholdStr, 10) : null; conversationState.awaitingQuantityConfirmation = true; const stockInfo = await getStockInfoFromSupabase(chosenRef); if (currentUser && stockInfo?.drawer) { updateSevenSegmentDisplay(stockInfo.drawer); } await addMessageToChat('AI', `Combien de <strong>${chosenRef}</strong> ? (Stock : ${availableQty}) Entrez nombre ou '0'.`); } else if (event.target.tagName === 'A' && (event.target.classList.contains('external-link') || event.target.classList.contains('external-link-inline'))) { console.log(`Lien externe: ${event.target.href}`); } });
    async function promptLoginBeforeAction(actionDescription) { await addMessageToChat('AI', `Pour ${actionDescription}, veuillez vous connecter (zone en haut).`); loginCodeInput?.focus(); }
    function provideExternalLinksHTML(ref, inline = false) { if (!ref) return ''; const encodedRef = encodeURIComponent(ref); const mLink = `https://www.mouser.ca/Search/Refine?Keyword=${encodedRef}`; const dLink = `https://www.digikey.ca/en/products/result?keywords=${encodedRef}`; const aLink = `https://www.aliexpress.com/wholesale?SearchText=${encodedRef}`; if (inline) { return ` <span class="external-links-inline">(Voir : <a href="${mLink}" target="_blank" rel="noopener noreferrer" class="external-link-inline">Mouser</a>, <a href="${dLink}" target="_blank" rel="noopener noreferrer" class="external-link-inline">Digi-Key</a>, <a href="${aLink}" target="_blank" rel="noopener noreferrer" class="external-link-inline aliexpress">Ali</a>)</span>`; } else { return `<div class="external-links-block">Liens recherche externe <strong>${ref}</strong> : <a href="${mLink}" class="external-link">Mouser</a> <a href="${dLink}" class="external-link">Digi-Key</a> <a href="${aLink}" class="external-link aliexpress">AliExpress</a></div>`; } }
    async function handleQuantityResponse(userInput) { const ref = conversationState.chosenRefForStockCheck; if (!ref || !conversationState.awaitingQuantityConfirmation) { const potentialRef = extractReference(userInput); if (potentialRef) { resetConversationState(); conversationState.originalRefChecked = potentialRef; await checkComponentWithAI(potentialRef); } else { await addMessageToChat("AI", "Non compris. Entrez réf ou cliquez 'Prendre'."); conversationState.awaitingQuantityConfirmation = false; } return; } const requestedQty = parseInt(userInput, 10); if (isNaN(requestedQty) || requestedQty < 0) { await addMessageToChat('AI', `Qté invalide. Entrez nombre >= 0.`); return; } if (requestedQty === 0) { await addMessageToChat('AI', "Prise stock annulée."); resetConversationState(); await delay(300); await addMessageToChat('AI', "Besoin d'autre chose ?"); return; } if (requestedQty > conversationState.availableQuantity) { await addMessageToChat('AI', `Qté (${requestedQty}) > stock (${conversationState.availableQuantity}). Entrez qté valide ou '0'.`); return; } loadingIndicatorChat.style.display = 'block'; loadingIndicatorChat.querySelector('i').textContent = `MàJ stock ${ref}...`; const change = -requestedQty; try { const newQty = await updateStockInSupabase(ref, change); loadingIndicatorChat.style.display = 'none'; if (newQty !== null) { const statusIndicatorHTML = createStockIndicatorHTML(newQty, conversationState.criticalThreshold); await addMessageToChat('AI', `${statusIndicatorHTML}Ok ! ${requestedQty} x <strong>${ref}</strong> retiré(s). Stock : ${newQty}.`); if (inventoryView.classList.contains('active-view')) { displayInventory(currentInventoryPage); } conversationState.awaitingQuantityConfirmation = false; } } catch (error) { console.error("Erreur màj stock via chat:", error); loadingIndicatorChat.style.display = 'none'; let errorMessage = `Erreur màj stock <strong>${ref}</strong>.`; if (error.message.includes("Stock insuffisant")) { errorMessage = `Erreur critique : Stock <strong>${ref}</strong> insuffisant (${error.message}).`; const currentStock = await getStockInfoFromSupabase(ref); if(currentStock) { errorMessage += ` Stock actuel réel: ${currentStock.quantity}. Réessayez qté valide ou '0'.`; conversationState.availableQuantity = currentStock.quantity; conversationState.awaitingQuantityConfirmation = true; await addMessageToChat('AI', errorMessage); return; } } else if (error.message) { errorMessage += ` Détails: ${error.message}`; } conversationState.awaitingQuantityConfirmation = false; await addMessageToChat('AI', errorMessage); resetConversationState(); } finally { if (!conversationState.awaitingQuantityConfirmation) { resetConversationState(); await delay(300); await addMessageToChat('AI', "Besoin d'autre chose ?"); } } }
    function resetConversationState() { conversationState = { awaitingEquivalentChoice: false, awaitingQuantityConfirmation: false, originalRefChecked: null, potentialEquivalents: [], chosenRefForStockCheck: null, availableQuantity: 0, criticalThreshold: null }; console.log("État conv chat réinitialisé."); }

    // --- Fonctions d'interaction Supabase ---
    async function getStockInfoFromSupabase(ref) { if (!supabase || !ref) return null; const upperRef = ref.toUpperCase(); try { const { data, error } = await supabase.from('inventory').select('*, categories(name), critical_threshold').ilike('ref', upperRef).single(); if (error) { if (error.code !== 'PGRST116') { console.error(`Supabase GET Error for ${upperRef}:`, error); } return null; } return data; } catch (err) { console.error("JS Error in getStockInfoFromSupabase:", err); return null; } }
    async function updateStockInSupabase(ref, change) { if (!supabase || !ref || change === 0 || !currentUser) { throw new Error("Màj annulée: infos manquantes ou non connecté."); } const upperRef = ref.toUpperCase(); console.log(`Supabase UPDATE: Ref: ${upperRef}, Change: ${change}`); try { const { data: currentItem, error: readError } = await supabase.from('inventory').select('quantity, drawer, critical_threshold').ilike('ref', upperRef).single(); if (readError || !currentItem) { throw new Error(`Composant "${upperRef}" non trouvé.`); } const newQuantity = currentItem.quantity + change; if (newQuantity < 0) { throw new Error(`Stock insuffisant pour ${upperRef}.`); } const { data: updateData, error: updateError } = await supabase.from('inventory').update({ quantity: newQuantity }).ilike('ref', upperRef).select('quantity, drawer').single(); if (updateError) { throw new Error("Erreur enregistrement màj stock."); } console.log(`Supabase UPDATE Success: ${upperRef}. New Qty: ${updateData.quantity}`); await addLogEntry(upperRef, change, newQuantity); if (currentUser && updateData.drawer) { updateSevenSegmentDisplay(updateData.drawer); } return newQuantity; } catch (err) { console.error(`Error in updateStockInSupabase for ${upperRef}:`, err.message); throw err; } }

    // --- Gestion Modale Quantité (+/-) ---
    async function handleInventoryRowClick(event) { const row = event.target.closest('tr.inventory-item-row'); if (!row) return; if (!currentUser) { if(loginError) { loginError.textContent = "Connexion requise."; loginError.style.color = 'var(--error-color)'; loginError.style.display = 'block'; } loginCodeInput?.focus(); return; } const ref = row.dataset.ref; if (!ref) { console.error("Ref manquante sur ligne:", row); return; } console.log(`Clic inventaire réf: ${ref}`); row.style.opacity = '0.7'; try { const item = await getStockInfoFromSupabase(ref); row.style.opacity = '1'; if (item) { if (currentUser && item.drawer) { updateSevenSegmentDisplay(item.drawer); } showQuantityModal(item.ref, item.quantity); } else { console.error(`Détails ${ref} non trouvés.`); alert(`Erreur: Détails ${ref} non trouvés.`); displayInventory(currentInventoryPage); } } catch (error) { row.style.opacity = '1'; console.error("Erreur JS handleInventoryRowClick:", error); alert("Erreur récup détails."); } }
    function showQuantityModal(ref, quantity) { if (!quantityChangeModal || !modalOverlay) return; modalCurrentRef = ref; modalInitialQuantity = quantity; currentModalChange = 0; if(modalRefSpan) modalRefSpan.textContent = ref; if(modalQtySpan) modalQtySpan.textContent = quantity; if(modalChangeAmountDisplay) modalChangeAmountDisplay.textContent = currentModalChange; if(modalFeedback) {modalFeedback.textContent = ''; modalFeedback.style.display = 'none'; modalFeedback.className = 'modal-feedback';} updateModalButtonStates(); quantityChangeModal.classList.add('active'); modalOverlay.classList.add('active'); }
    function hideQuantityModal() { if (!quantityChangeModal || !modalOverlay) return; quantityChangeModal.classList.remove('active'); modalOverlay.classList.remove('active'); modalCurrentRef = null; modalInitialQuantity = 0; currentModalChange = 0; }
    function updateModalButtonStates() { if (!modalDecreaseButton || !modalIncreaseButton || !modalConfirmButton || !modalChangeAmountDisplay) return; const resultingQuantity = modalInitialQuantity + currentModalChange; if(modalChangeAmountDisplay) modalChangeAmountDisplay.textContent = currentModalChange > 0 ? `+${currentModalChange}` : currentModalChange; if(modalDecreaseButton) modalDecreaseButton.disabled = (resultingQuantity <= 0); if(modalIncreaseButton) modalIncreaseButton.disabled = false; if(modalConfirmButton) modalConfirmButton.disabled = (currentModalChange === 0); }
    modalDecreaseButton?.addEventListener('click', () => { if (modalInitialQuantity + currentModalChange > 0) { currentModalChange--; updateModalButtonStates(); } });
    modalIncreaseButton?.addEventListener('click', () => { currentModalChange++; updateModalButtonStates(); });
    modalCancelButton?.addEventListener('click', hideQuantityModal);
    modalOverlay?.addEventListener('click', (event) => { if (event.target === modalOverlay) hideQuantityModal(); });
    modalConfirmButton?.addEventListener('click', async () => { if(modalFeedback) modalFeedback.style.display = 'none'; if (currentModalChange === 0 || !modalCurrentRef) return; if (modalInitialQuantity + currentModalChange < 0) { if(modalFeedback) { modalFeedback.textContent = "Stock négatif."; modalFeedback.className = 'modal-feedback error'; modalFeedback.style.display = 'block'; } return; } if(modalConfirmButton) modalConfirmButton.disabled = true; if(modalCancelButton) modalCancelButton.disabled = true; if(modalDecreaseButton) modalDecreaseButton.disabled = true; if(modalIncreaseButton) modalIncreaseButton.disabled = true; if(modalFeedback) { modalFeedback.textContent = "MàJ..."; modalFeedback.className = 'modal-feedback info'; modalFeedback.style.display = 'block'; } try { const newQuantity = await updateStockInSupabase(modalCurrentRef, currentModalChange); if (newQuantity !== null) { hideQuantityModal(); displayInventory(currentInventoryPage); } } catch (error) { console.error("Erreur confirm modal:", error); if(modalFeedback) { modalFeedback.textContent = error.message.includes("Stock insuffisant") ? "Stock insuffisant." : `Erreur: ${error.message}`; modalFeedback.className = 'modal-feedback error'; modalFeedback.style.display = 'block';} if (quantityChangeModal?.classList.contains('active')) { if(modalCancelButton) modalCancelButton.disabled = false; updateModalButtonStates(); if(modalConfirmButton) modalConfirmButton.disabled = (currentModalChange === 0); /* Correction: Réactiver boutons correctement */ if(modalDecreaseButton) modalDecreaseButton.disabled = (modalInitialQuantity + currentModalChange <= 0); if(modalIncreaseButton) modalIncreaseButton.disabled = false; } } });

    // --- Gestion Afficheur 7 Segments ---
    const segmentMap = { '0':['a','b','c','d','e','f'],'1':['b','c'],'2':['a','b','g','e','d'],'3':['a','b','g','c','d'],'4':['f','g','b','c'],'5':['a','f','g','c','d'],'6':['a','f','e','d','c','g'],'7':['a','b','c'],'8':['a','b','c','d','e','f','g'],'9':['a','b','c','d','f','g'],'A':['a','b','c','e','f','g'],'B':['c','d','e','f','g'],'b':['f','e','d','c','g'],'C':['a','f','e','d'],'c':['g','e','d'],'D':['b','c','d','e','g'],'d':['b','c','d','e','g'],'E':['a','f','e','d','g'],'F':['a','f','e','g'],'G':['a','f','e','d','c'],'H':['f','e','b','c','g'],'h':['f','e','c','g'],'I':['f','e'],'J':['b','c','d','e'],'L':['f','e','d'],'O':['a','b','c','d','e','f'],'o':['c','d','e','g'],'P':['a','b','f','e','g'],'r':['e','g'],'S':['a','f','g','c','d'],'U':['b','c','d','e','f'],'u':['c','d','e'],'-':['g'],' ':[],'_':['d'] };
    function updateSevenSegmentDisplay(newDrawerValue = undefined) { if (newDrawerValue === null) { lastDisplayedDrawer = null; } else if (newDrawerValue !== undefined) { const trimmedVal = String(newDrawerValue).trim().toUpperCase(); if (trimmedVal !== "") { lastDisplayedDrawer = trimmedVal; } } const drawerToDisplay = lastDisplayedDrawer; if (!sevenSegmentDisplay || !segmentDigits.every(d => d)) return; if (!currentUser || !drawerToDisplay) { sevenSegmentDisplay.classList.add('display-off'); segmentDigits.forEach(digitElement => { digitElement?.querySelectorAll('.segment').forEach(seg => seg.classList.remove('on')); digitElement?.classList.add('off'); }); return; } sevenSegmentDisplay.classList.remove('display-off'); const displayChars = drawerToDisplay.slice(-4).padStart(4, ' '); segmentDigits.forEach((digitElement, index) => { if (!digitElement) return; const charToDisplay = displayChars[index] || ' '; const segmentsOn = segmentMap[charToDisplay] || segmentMap['-']; digitElement.querySelectorAll('.segment').forEach(seg => seg.classList.remove('on')); segmentsOn.forEach(segId => { const segment = digitElement.querySelector(`.segment-${segId}`); segment?.classList.add('on'); }); digitElement.classList.remove('off'); }); }

    // --- Logique pour la vue Paramètres ---
    function loadSettingsData() { if (!currentUser || currentUserCode !== 'zine') return; showSettingsFeedback('export', '', 'none'); showSettingsFeedback('import', '', 'none'); if (importCsvFileInput) importCsvFileInput.value = ''; console.log("Vue Paramètres chargée pour zine."); if (categoriesCache.length === 0) { getCategories(); } }
    function showSettingsFeedback(type, message, level = 'info') { const feedbackDiv = (type === 'export') ? exportFeedbackDiv : importFeedbackDiv; if (feedbackDiv) { feedbackDiv.textContent = message; feedbackDiv.className = `feedback-area ${level}`; feedbackDiv.style.whiteSpace = (level === 'error' && type === 'import') ? 'pre-wrap' : 'normal'; feedbackDiv.style.textAlign = (level === 'error' && type === 'import') ? 'left' : 'center'; feedbackDiv.style.display = (level === 'none' || !message) ? 'none' : 'block'; } }
    function downloadFile(filename, content, mimeType) { const blob = new Blob([content], { type: mimeType }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); }
    async function handleExportInventoryCSV() { if (!supabase) return; showSettingsFeedback('export', "Récup inventaire...", 'info'); if(exportInventoryCsvButton) exportInventoryCsvButton.disabled = true; try { const { data, error } = await supabase.from('inventory').select('*, categories(name)').order('ref', { ascending: true }); if (error) throw new Error(`DB: ${error.message}`); if (!data || data.length === 0) { showSettingsFeedback('export', "Inventaire vide.", 'warning'); return; } const csvData = data.map(item => ({ ref: item.ref, description: item.description || '', manufacturer: item.manufacturer || '', quantity: item.quantity, datasheet: item.datasheet || '', drawer: item.drawer || '', category_name: item.categories?.name || '', critical_threshold: item.critical_threshold ?? '', attributes: item.attributes ? JSON.stringify(item.attributes) : '' })); const csvString = Papa.unparse(csvData, { header: true, quotes: true, delimiter: "," }); const timestamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-'); downloadFile(`stockav_inventory_${timestamp}.csv`, csvString, 'text/csv;charset=utf-8;'); showSettingsFeedback('export', `Export CSV OK (${data.length} lignes).`, 'success'); } catch (err) { console.error("Erreur export CSV:", err); showSettingsFeedback('export', `Erreur: ${err.message}`, 'error'); } finally { if(exportInventoryCsvButton) exportInventoryCsvButton.disabled = false; } }
    async function handleExportLogTXT() { if (!supabase) return; showSettingsFeedback('export', "Récup historique...", 'info'); if(exportLogTxtButton) exportLogTxtButton.disabled = true; try { const { data, error } = await supabase.from('logs').select('*').order('created_at', { ascending: true }); if (error) throw new Error(`DB: ${error.message}`); if (!data || data.length === 0) { showSettingsFeedback('export', "Historique vide.", 'warning'); return; } let txtContent = "Historique StockAV\n===================\n\n"; txtContent += "Date & Heure          | Technicien | Action  | Référence        | +/-   | Stock Final\n"; txtContent += "----------------------+------------+---------+------------------+-------+------------\n"; data.forEach(log => { const timestamp = formatLogTimestamp(new Date(log.created_at)).padEnd(21); const user = (log.user_code || 'N/A').padEnd(10); const action = (log.quantity_change > 0 ? 'Ajout' : 'Retrait').padEnd(7); const ref = log.component_ref.padEnd(16); const change = (log.quantity_change > 0 ? `+${log.quantity_change}` : `${log.quantity_change}`).padStart(5); const after = String(log.quantity_after).padStart(11); txtContent += `${timestamp} | ${user} | ${action} | ${ref} | ${change} | ${after}\n`; }); const timestampFile = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-'); downloadFile(`stockav_logs_${timestampFile}.txt`, txtContent, 'text/plain;charset=utf-8;'); showSettingsFeedback('export', `Export TXT OK (${data.length} lignes).`, 'success'); } catch (err) { console.error("Erreur export TXT:", err); showSettingsFeedback('export', `Erreur: ${err.message}`, 'error'); } finally { if(exportLogTxtButton) exportLogTxtButton.disabled = false; } }
    async function handleImportInventoryCSV() { if (!supabase || typeof Papa === 'undefined') { showSettingsFeedback('import', "Erreur: Init.", 'error'); return; } if (!importCsvFileInput?.files?.length) { showSettingsFeedback('import', "Choisir fichier CSV.", 'warning'); return; } const file = importCsvFileInput.files[0]; showSettingsFeedback('import', `Lecture ${file.name}...`, 'info'); if(importInventoryCsvButton) importInventoryCsvButton.disabled = true; if(importCsvFileInput) importCsvFileInput.disabled = true; Papa.parse(file, { header: true, skipEmptyLines: true, dynamicTyping: false, complete: async (results) => { console.log("CSV Parsed:", results); const rows = results.data; const errors = results.errors; const requiredHeaders = ['ref', 'quantity']; if (errors.length > 0) { showSettingsFeedback('import', `Erreur lecture CSV L${errors[0].row + 1}: ${errors[0].message}.`, 'error'); resetImportState(); return; } if (rows.length === 0) { showSettingsFeedback('import', "CSV vide.", 'warning'); resetImportState(); return; } const headers = results.meta.fields; if (!headers || !requiredHeaders.every(h => headers.includes(h))) { showSettingsFeedback('import', `Erreur: En-têtes manquants (${requiredHeaders.join(", ")}).`, 'error'); resetImportState(); return; } showSettingsFeedback('import', `Validation (${rows.length} lignes)...`, 'info'); await delay(100); const itemsToUpsert = []; const validationErrors = []; const categoryMap = new Map(categoriesCache.map(cat => [cat.name.toUpperCase(), cat.id])); for (let i = 0; i < rows.length; i++) { const row = rows[i]; const lineNumber = i + 2; const ref = row.ref?.trim().toUpperCase(); if (!ref) { validationErrors.push(`L${lineNumber}: Réf manquante.`); continue; } const quantityStr = row.quantity?.trim(); const quantity = parseInt(quantityStr, 10); if (quantityStr === '' || isNaN(quantity) || quantity < 0) { validationErrors.push(`L${lineNumber}(Réf: ${ref}): Qté invalide ('${row.quantity || ''}').`); continue; } const description = row.description?.trim() || null; const manufacturer = row.manufacturer?.trim() || null; const datasheet = row.datasheet?.trim() || null; if (datasheet) { try { new URL(datasheet); } catch (_) { validationErrors.push(`L${lineNumber}(Réf: ${ref}): URL Datasheet invalide.`); continue;} } const drawer = row.drawer?.trim().toUpperCase() || null; const thresholdStr = row.critical_threshold?.trim(); let critical_threshold = null; if (thresholdStr && thresholdStr !== '') { critical_threshold = parseInt(thresholdStr, 10); if (isNaN(critical_threshold) || critical_threshold < 0) { validationErrors.push(`L${lineNumber}(Réf: ${ref}): Seuil invalide ('${row.critical_threshold}').`); continue; } } let category_id = null; const categoryName = row.category_name?.trim(); if (categoryName) { const foundId = categoryMap.get(categoryName.toUpperCase()); if (foundId) { category_id = foundId; } else { validationErrors.push(`L${lineNumber}(Réf: ${ref}): Catégorie '${categoryName}' non trouvée.`); continue; } } let attributes = null; const attributesStr = row.attributes?.trim(); if (attributesStr && attributesStr !== '{}') { try { attributes = JSON.parse(attributesStr); if (typeof attributes !== 'object' || attributes === null || Array.isArray(attributes)) { throw new Error("Objet JSON invalide."); } } catch (e) { validationErrors.push(`L${lineNumber}(Réf: ${ref}): Attributs JSON invalides. ${e.message}`); continue; } } itemsToUpsert.push({ ref, description, manufacturer, quantity, datasheet, drawer, category_id, critical_threshold, attributes }); } if (validationErrors.length > 0) { const errorMsg = `Erreurs validation:\n- ${validationErrors.slice(0, 15).join('\n- ')}${validationErrors.length > 15 ? '\n- ...' : ''}`; showSettingsFeedback('import', errorMsg, 'error'); resetImportState(); return; } if (itemsToUpsert.length > 0) { showSettingsFeedback('import', `Validation OK. Upsert ${itemsToUpsert.length} composants...`, 'info'); try { const { data: upsertData, error: upsertError } = await supabase.from('inventory').upsert(itemsToUpsert, { onConflict: 'ref' }).select('ref'); if (upsertError) { throw new Error(`DB Upsert: ${upsertError.message}`); } showSettingsFeedback('import', `Import OK (${upsertData?.length || 0} ajoutés/MàJ).`, 'success'); if (inventoryView?.classList.contains('active-view')) { displayInventory(1); } } catch (err) { console.error("Erreur upsert CSV:", err); showSettingsFeedback('import', `Erreur écriture DB: ${err.message}`, 'error'); } finally { resetImportState(); } } else { showSettingsFeedback('import', "Aucune ligne valide à importer.", 'warning'); resetImportState(); } }, error: (error) => { console.error("Erreur parsing PapaParse:", error); showSettingsFeedback('import', `Erreur lecture fichier: ${error.message}`, 'error'); resetImportState(); } }); }
    function resetImportState() { if(importInventoryCsvButton) importInventoryCsvButton.disabled = false; if (importCsvFileInput) { importCsvFileInput.disabled = false; importCsvFileInput.value = ''; } }
    function addSettingsEventListeners() { exportInventoryCsvButton?.addEventListener('click', handleExportInventoryCSV); exportLogTxtButton?.addEventListener('click', handleExportLogTXT); importInventoryCsvButton?.addEventListener('click', handleImportInventoryCSV); }

    // --- Initialisation Générale de l'Application ---
    function initializeApp() {
        console.log("Initialisation de StockAV...");
        const requiredIds = ['login-area','search-view','inventory-view','log-view','admin-view','settings-view','seven-segment-display','inventory-table-body','response-output','component-input','show-search-view','show-inventory-view','show-log-view','show-admin-view','show-settings-view','login-button','logout-button','search-button','category-list','stock-form','component-category-select','save-component-button','export-inventory-csv-button','import-inventory-csv-button','log-table-body'];
        if (requiredIds.some(id => !document.getElementById(id))) { console.error("FATAL: Elément DOM essentiel manquant! Vérifiez index.html."); document.body.innerHTML = "<p style='color:red; padding:20px;'><b>Erreur init.</b> Vérifiez console (F12) & index.html.</p>"; return; }

        // Listeners Navigation & Auth
        searchTabButton.addEventListener('click', () => setActiveView(searchView, searchTabButton));
        inventoryTabButton.addEventListener('click', () => setActiveView(inventoryView, inventoryTabButton));
        logTabButton.addEventListener('click', () => setActiveView(logView, logTabButton));
        adminTabButton.addEventListener('click', () => setActiveView(adminView, adminTabButton));
        settingsTabButton.addEventListener('click', () => setActiveView(settingsView, settingsTabButton));
        loginButton.addEventListener('click', handleLogin);
        loginPasswordInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleLogin(); });
        loginCodeInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleLogin(); });
        logoutButton.addEventListener('click', handleLogout);
        // Listeners Chat
        searchButtonChat.addEventListener('click', handleUserInput);
        componentInputChat.addEventListener('keypress', (event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); handleUserInput(); } });
        // Listeners Inventaire
        applyInventoryFilterButton?.addEventListener('click', () => { currentInventoryFilters.category = inventoryCategoryFilter.value; currentInventoryFilters.search = inventorySearchFilter.value; displayInventory(1); });
        inventorySearchFilter?.addEventListener('keypress', (e) => { if (e.key === 'Enter') { applyInventoryFilterButton?.click(); } });
        inventoryPrevPageButton?.addEventListener('click', () => { if (currentInventoryPage > 1) { displayInventory(currentInventoryPage - 1); } });
        inventoryNextPageButton?.addEventListener('click', () => { if (!inventoryNextPageButton?.disabled) { displayInventory(currentInventoryPage + 1); } });
        inventoryTableBody.addEventListener('click', handleInventoryRowClick);
        // Listeners Log
        logPrevPageButton?.addEventListener('click', () => { if (currentLogPage > 1) { displayLog(currentLogPage - 1); } });
        logNextPageButton?.addEventListener('click', () => { if (!logNextPageButton?.disabled) { displayLog(currentLogPage + 1); } });
        logTableBody?.addEventListener('click', handleDeleteSingleLog);
        // Listeners Admin & Settings
        addCategoryEventListeners();
        addComponentCategorySelectListener();
        addStockEventListeners();
        addSettingsEventListeners();

        // Initialisation finale
        setupAuthListener();
        updateSevenSegmentDisplay(null);
        console.log("StockAV initialisé et prêt.");
    } // Fin initializeApp

    // --- Lancer l'application ---
    initializeApp();

}); // ----- FIN DU FICHIER script.js -----