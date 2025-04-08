// ----- DÉBUT DU FICHIER script.js -----
// Assure que le code s'exécute après le chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
    "use strict"; // Active le mode strict

    // --- Configuration et Variables Globales ---
    let currentUser = null;
    let currentUserCode = null; // Stockera 'zine', 'tech1', etc.
    const ITEMS_PER_PAGE = 15;
    let isInitialAuthCheckComplete = false;
    let activeSession = null;
    let lastDisplayedDrawer = null;
    let categoriesCache = []; // Cache pour les catégories {id, name, attributes}

    // --- Configuration Supabase ---
    const SUPABASE_URL = 'https://tjdergojgghzmopuuley.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZGVyZ29qZ2doem1vcHV1bGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4MTU0OTUsImV4cCI6MjA1OTM5MTQ5NX0.XejQYEPYoCrgYOwW4T9g2VcmohCdLLndDdwpSYXAwPA';
    const FAKE_EMAIL_DOMAIN = '@stockav.local';
    let supabase = null;

    // --- Initialisation des Clients et Vérifications ---
    try {
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !FAKE_EMAIL_DOMAIN) {
            throw new Error("Configuration Supabase manquante !");
        }
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log("Client Supabase initialisé.");
        } else {
            throw new Error("Librairie Supabase non chargée.");
        }
        if (typeof Papa === 'undefined') {
            console.warn("PapaParse non chargé. L'import/export CSV pourrait ne pas fonctionner.");
        }
    } catch (error) {
        console.error("Erreur critique init:", error);
        document.body.innerHTML = `<div style="padding:20px; background-color:#f8d7da; color:#721c24;"><h2>Erreur Critique</h2><p>${error.message}</p></div>`;
        return; // Arrête l'exécution si l'initialisation échoue
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
    const viewSections = document.querySelectorAll('main.view-section');
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
    const componentActionsWrapper = document.getElementById('component-actions');
    const componentInfoDiv = document.getElementById('component-info'); // Reste pour la partie info/quantité
    const currentQuantitySpan = document.getElementById('current-quantity');
    const updateQuantityButton = document.getElementById('update-quantity-button');
    const quantityChangeInput = document.getElementById('quantity-change');
    const deleteComponentButton = document.getElementById('delete-component-button');
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
                if (categoriesCache.length === 0) {
                    await getCategories();
                }
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
             invalidateCategoriesCache();
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
                if (categoriesCache.length === 0) {
                    await getCategories();
                }
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

        supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`Auth Event: ${event}`, session ? `Session pour ${session.user.email}` : "Pas de session");
            activeSession = session;

            // MODIF: Ignorer aussi 'INITIAL_SESSION' si vérification non complète
            if (!isInitialAuthCheckComplete && event !== 'SIGNED_OUT') {
                console.log("Auth event reçu avant fin vérif initiale ou event initial, attente...");
                return;
            }

            switch (event) {
                case 'SIGNED_IN':
                    if (categoriesCache.length === 0) {
                       await getCategories();
                    }
                    handleUserConnected(session.user, false);
                    break;
                case 'SIGNED_OUT':
                    handleUserDisconnected(false);
                    break;
                case 'TOKEN_REFRESHED':
                    console.log("Token rafraîchi.");
                    // MODIF: Simplification - Mise à jour si utilisateur différent ou inexistant localement
                    if (session && (!currentUser || session.user.id !== currentUser.id)) {
                        console.log("Token rafraîchi, mise à jour utilisateur local...");
                        if (categoriesCache.length === 0) { await getCategories(); }
                        handleUserConnected(session.user, false);
                    } else if (!session && currentUser) {
                        console.log("Token rafraîchi mais session absente, déconnexion locale...");
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
                // AJOUT: Ignorer explicitement INITIAL_SESSION après la première vérification
                case 'INITIAL_SESSION':
                     if (!isInitialAuthCheckComplete) {
                         console.log("Événement INITIAL_SESSION reçu avant fin vérif initiale, ignoré ici.");
                     } else {
                         console.log("Événement INITIAL_SESSION reçu après vérif initiale, traité comme redondant.");
                     }
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
        currentUserCode = currentUser.email.split('@')[0].toLowerCase();
        console.log(`Utilisateur connecté: ${currentUserCode} (ID: ${currentUser.id})`);

        document.body.classList.add('user-logged-in');
        if(loginArea) loginArea.style.display = 'none';
        if(userInfoArea) userInfoArea.style.display = 'flex';
        if(userDisplay) userDisplay.textContent = currentUserCode.toUpperCase();
        if(loginError) loginError.style.display = 'none';

        [logTabButton, adminTabButton].forEach(btn => {
            if (btn) {
                btn.style.display = 'inline-block';
                btn.disabled = false;
                btn.title = '';
            }
        });

        if (settingsTabButton) {
            if (currentUserCode === 'zine') {
                settingsTabButton.style.display = 'inline-block';
                settingsTabButton.disabled = false;
                settingsTabButton.title = '';
                console.log("Accès Paramètres autorisé pour 'zine'.");
            } else {
                settingsTabButton.style.display = 'none';
                settingsTabButton.disabled = true;
                settingsTabButton.title = 'Accès réservé';
                console.log(`Accès Paramètres refusé pour '${currentUserCode}'.`);
                 const activeView = document.querySelector('main.view-section.active-view');
                 if (activeView === settingsView) {
                     console.log("Redirection depuis Paramètres car utilisateur non autorisé.");
                     setActiveView(searchView, searchTabButton);
                 }
            }
        }

        // MODIF: Simplification - Toujours rafraîchir certaines données si pas chargement initial ou si utilisateur change
        if (!isInitialLoad || user.id !== previousUserId) {
            console.log("Nouvelle connexion ou utilisateur différent détecté. Réinitialisation/Rechargement...");
            // Vider cache catégories seulement si l'utilisateur change
            if (user.id !== previousUserId) {
                 if (categoriesCache.length > 0) invalidateCategoriesCache();
                 getCategories(); // Recharger pour le nouvel utilisateur
            }
            // Réinitialiser le chat si l'utilisateur change
            if (user.id !== previousUserId && searchView?.classList.contains('active-view')) {
                 displayWelcomeMessage();
            }
            // Recharger les données de la vue active (sauf si c'est paramètres et pas zine)
            const currentActiveView = document.querySelector('main.view-section.active-view');
            if (currentActiveView && (currentActiveView !== settingsView || currentUserCode === 'zine')) {
                if (currentActiveView.id === 'inventory-view') { populateInventoryFilters(); displayInventory(); }
                else if (currentActiveView.id === 'log-view') { displayLog(); }
                else if (currentActiveView.id === 'admin-view') { loadAdminData(); }
                else if (currentActiveView.id === 'settings-view' && currentUserCode === 'zine') { loadSettingsData(); } // Recharger settings si zine
            }
        } else if (isInitialLoad) { // Chargement initial avec session
             // S'assurer que les données de la vue active sont chargées
             const activeView = document.querySelector('main.view-section.active-view');
             if (!activeView) { setActiveView(searchView, searchTabButton); } // Vue par défaut si rien n'est actif
             else if (activeView.id === 'inventory-view') { populateInventoryFilters(); displayInventory(); }
             else if (activeView.id === 'log-view') { displayLog(); }
             else if (activeView.id === 'admin-view') { loadAdminData(); }
             else if (activeView.id === 'settings-view' && currentUserCode === 'zine') { loadSettingsData(); }
             else if (activeView.id === 'search-view' && chatHistory.length === 0) { displayWelcomeMessage(); }
        }
        updateSevenSegmentDisplay();
    }

    function handleUserDisconnected(isInitialLoad) {
        console.log("Utilisateur déconnecté ou session absente.");
        currentUser = null;
        currentUserCode = null;
        document.body.classList.remove('user-logged-in');
        if(userInfoArea) userInfoArea.style.display = 'none';
        if(loginArea) loginArea.style.display = 'flex';
        protectedButtons.forEach(btn => {
            btn.style.display = 'none';
            btn.disabled = true;
            btn.title = 'Connexion requise';
        });

        hideQuantityModal();
        lastDisplayedDrawer = null;
        updateSevenSegmentDisplay(null);

        // Invalider cache et données seulement si c'était une déconnexion active
        if (!isInitialLoad) {
            invalidateCategoriesCache();
            clearProtectedViewData();
             if (searchView?.classList.contains('active-view') && chatHistory.length > 0) {
                 displayWelcomeMessage(); // Afficher message accueil chat
             }
        }

        // Rediriger si sur une vue protégée
        const activeView = document.querySelector('main.view-section.active-view');
        if (activeView && ['log-view', 'admin-view', 'settings-view'].includes(activeView.id)) {
            console.log("Redirection vers vue recherche car déconnecté d'une vue protégée.");
            setActiveView(searchView, searchTabButton);
        } else if (isInitialLoad && !activeView) { // Au chargement initial, assurer la vue recherche
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
        resetStockForm();
        if (componentActionsWrapper) componentActionsWrapper.style.display = 'none'; // MODIF: Utiliser le wrapper
        if (adminFeedbackDiv) { adminFeedbackDiv.style.display = 'none'; adminFeedbackDiv.textContent = ''; adminFeedbackDiv.className = 'feedback-area'; }
        if (exportFeedbackDiv) { exportFeedbackDiv.style.display = 'none'; exportFeedbackDiv.textContent = ''; exportFeedbackDiv.className = 'feedback-area'; }
        if (importFeedbackDiv) { importFeedbackDiv.style.display = 'none'; importFeedbackDiv.textContent = ''; importFeedbackDiv.className = 'feedback-area'; }
        if(importCsvFileInput) importCsvFileInput.value = '';
        console.log("Données des vues protégées effacées.");
    }

    // --- Navigation ---
    function setActiveView(viewToShow, buttonToActivate){
        if (!viewToShow) { viewToShow = searchView; buttonToActivate = searchTabButton; console.warn("setActiveView: Vue invalide, retour à la recherche.");}
        if (viewToShow.classList.contains('active-view')) { console.log(`Vue ${viewToShow.id} déjà active.`); return; }

        if (viewToShow === settingsView && (!currentUser || currentUserCode !== 'zine')) {
            console.warn(`Accès refusé: La vue Paramètres (${settingsView.id}) est réservée à 'zine'. Utilisateur: ${currentUserCode}`);
            if (loginError && !currentUser) {
                 loginError.textContent="Connexion requise pour accéder à cette section.";
                 loginError.style.color = 'var(--error-color)';
                 loginError.style.display='block';
                 loginCodeInput?.focus();
            } else if (adminFeedbackDiv && adminView.classList.contains('active-view')) {
                showAdminFeedback("Accès à cette section réservé.", 'error');
            } else if(exportFeedbackDiv && settingsView.classList.contains('active-view')) {
                showSettingsFeedback('export', "Accès réservé.", 'error');
            } else {
                 if(loginError) {
                    loginError.textContent = "Accès à la section Paramètres réservé.";
                    loginError.style.color = 'var(--error-color)';
                    loginError.style.display = 'block';
                 } else {
                     alert("Accès réservé."); // Fallback alert
                 }
            }
            return;
        }

        const isProtected = ['log-view', 'admin-view', 'settings-view'].includes(viewToShow.id);
        if (isProtected && !currentUser) {
             console.warn(`Accès refusé: ${viewToShow.id} nécessite connexion.`);
             if (loginError) {
                 loginError.textContent="Connexion requise pour accéder à cette section.";
                 loginError.style.color = 'var(--error-color)';
                 loginError.style.display='block';
             }
             loginCodeInput?.focus();
             return;
        }

        viewSections.forEach(section => {
            section.style.display = 'none';
            section.classList.remove('active-view');
        });
        document.querySelectorAll('.nav-button').forEach(button => {
            button.classList.remove('active');
        });

        viewToShow.style.display = 'block';
        viewToShow.classList.add('active-view');
        if (buttonToActivate) {
            buttonToActivate.classList.add('active');
        } else {
            const realButtonId = `show-${viewToShow.id}`;
            const matchingButton = document.getElementById(realButtonId);
            if (matchingButton) matchingButton.classList.add('active');
        }
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
                categories.sort((a, b) => a.name.localeCompare(b.name)).forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat.id;
                    option.textContent = cat.name;
                    inventoryCategoryFilter.appendChild(option);
                });
                if (inventoryCategoryFilter.querySelector(`option[value="${currentVal}"]`)) {
                     inventoryCategoryFilter.value = currentVal;
                } else {
                     inventoryCategoryFilter.value = 'all';
                }
            } else {
                console.warn("Aucune catégorie trouvée pour remplir les filtres.");
            }
        } catch (error) {
            console.error("Erreur remplissage filtres catégorie:", error);
        }
    }
    async function displayInventory(page = currentInventoryPage) {
        currentInventoryPage = page;
        if (!inventoryTableBody || !supabase) { console.warn("displayInventory: Prérequis manquants."); return; }
        inventoryTableBody.innerHTML = '<tr class="loading-row"><td colspan="7" style="text-align:center;"><i>Chargement...</i></td></tr>';
        if(inventoryNoResults) inventoryNoResults.style.display = 'none';
        if(inventoryPrevPageButton) inventoryPrevPageButton.disabled = true;
        if(inventoryNextPageButton) inventoryNextPageButton.disabled = true;
        if(inventoryPageInfo) inventoryPageInfo.textContent = 'Chargement...';
        const itemsPerPage = ITEMS_PER_PAGE;
        const startIndex = (currentInventoryPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage - 1;
        try {
            // MODIF: Sélectionner aussi les attributs pour la modale
            let query = supabase.from('inventory').select('*, critical_threshold, attributes', { count: 'exact' });
            const searchValue = inventorySearchFilter?.value.trim() || '';
            const categoryValue = inventoryCategoryFilter?.value || 'all';
            if (searchValue) {
                 const searchColumns = ['ref', 'description', 'manufacturer'];
                 if (currentUser) { searchColumns.push('drawer'); }
                 query = query.or(searchColumns.map(col => `${col}.ilike.%${searchValue}%`).join(','));
            }
            if (categoryValue !== 'all') {
                 query = query.eq('category_id', categoryValue);
            }
            query = query.order('ref', { ascending: true }).range(startIndex, endIndex);
            const { data, error, count } = await query;
            inventoryTableBody.innerHTML = '';
            if (error) { throw new Error(`Erreur DB inventaire: ${error.message}`); }
            const totalItems = count || 0; const totalPages = Math.ceil(totalItems / itemsPerPage);
            if (totalItems === 0) {
                if(inventoryNoResults) {
                     inventoryNoResults.textContent = `Aucun composant trouvé${searchValue || categoryValue !== 'all' ? ' pour ces filtres' : ''}.`;
                     inventoryNoResults.style.display = 'block';
                }
                if(inventoryPageInfo) inventoryPageInfo.textContent = 'Page 0 / 0';
            } else {
                if(inventoryNoResults) inventoryNoResults.style.display = 'none';
                if (categoriesCache.length === 0 && data.some(item => item.category_id)) {
                    await getCategories();
                }
                const categoryNameMap = new Map(categoriesCache.map(cat => [cat.id, cat.name]));
                data.forEach(item => {
                    const row = inventoryTableBody.insertRow();
                    row.dataset.ref = item.ref;
                    // AJOUT: Stocker les attributs JSON dans data-attributes
                    row.dataset.attributes = item.attributes ? JSON.stringify(item.attributes) : '{}';
                    row.classList.add('inventory-item-row');
                    const refCell = row.insertCell();
                    const status = getStockStatus(item.quantity, item.critical_threshold);
                    const indicatorSpan = document.createElement('span');
                    indicatorSpan.classList.add('stock-indicator', `level-${status}`);
                    indicatorSpan.title = `Stock: ${status.toUpperCase()} (Qté: ${item.quantity}, Seuil: ${item.critical_threshold ?? 'N/A'})`;
                    refCell.appendChild(indicatorSpan);
                    refCell.appendChild(document.createTextNode(" " + item.ref)); // Espace
                    row.insertCell().textContent = item.description || '-';
                    row.insertCell().textContent = categoryNameMap.get(item.category_id) || 'N/A';
                    row.insertCell().textContent = item.drawer || '-';
                    row.insertCell().textContent = item.manufacturer || '-';
                    row.insertCell().textContent = item.quantity;
                    const dsCell = row.insertCell();
                    if (item.datasheet) {
                        try {
                            new URL(item.datasheet);
                            const link = document.createElement('a');
                            link.href = item.datasheet;
                            link.textContent = 'Voir';
                            link.target = '_blank';
                            link.rel = 'noopener noreferrer';
                            dsCell.appendChild(link);
                        } catch (_) { dsCell.textContent = '-'; }
                    } else { dsCell.textContent = '-'; }
                });
                currentInventoryPage = Math.max(1, Math.min(currentInventoryPage, totalPages || 1));
                if(inventoryPageInfo) inventoryPageInfo.textContent = `Page ${currentInventoryPage} / ${totalPages || 1}`;
                if(inventoryPrevPageButton) inventoryPrevPageButton.disabled = currentInventoryPage === 1;
                if(inventoryNextPageButton) inventoryNextPageButton.disabled = currentInventoryPage >= totalPages;
            }
        } catch (err) {
            console.error("Erreur affichage inventaire:", err);
            inventoryTableBody.innerHTML = `<tr><td colspan="7" class="error-message" style="text-align:center; color: var(--error-color);">Erreur chargement: ${err.message}</td></tr>`;
            if(inventoryPageInfo) inventoryPageInfo.textContent = 'Erreur';
        }
    }

    // --- LOGIQUE HISTORIQUE ---
    async function displayLog(page = currentLogPage) {
        if (!currentUser) { console.warn("displayLog: Non connecté."); return; }
        currentLogPage = page;
        if (!logTableBody || !supabase) { console.warn("displayLog: Prérequis manquants."); return; }
        logTableBody.innerHTML = '<tr class="loading-row"><td colspan="6" style="text-align:center;"><i>Chargement historique...</i></td></tr>';
        if(logNoResults) logNoResults.style.display = 'none';
        if(logPrevPageButton) logPrevPageButton.disabled = true;
        if(logNextPageButton) logNextPageButton.disabled = true;
        if(logPageInfo) logPageInfo.textContent = 'Chargement...';
        const itemsPerPage = ITEMS_PER_PAGE; const startIndex = (currentLogPage - 1) * itemsPerPage; const endIndex = startIndex + itemsPerPage - 1;
        try {
            const { data, error, count } = await supabase.from('logs').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(startIndex, endIndex);
            logTableBody.innerHTML = ''; if (error) { throw new Error(`Erreur DB logs: ${error.message}`); }
            const totalItems = count || 0; const totalPages = Math.ceil(totalItems / itemsPerPage);
            if (totalItems === 0) {
                if(logNoResults) { logNoResults.textContent = "Historique vide."; logNoResults.style.display = 'block'; }
                if(logPageInfo) logPageInfo.textContent = 'Page 0 / 0';
            } else {
                if(logNoResults) logNoResults.style.display = 'none';
                data.forEach(entry => {
                    const row = logTableBody.insertRow();
                    row.insertCell().textContent = formatLogTimestamp(new Date(entry.created_at));
                    row.insertCell().textContent = entry.user_code || 'N/A';
                    const actionCell = row.insertCell();
                    actionCell.textContent = entry.quantity_change > 0 ? 'Ajout' : 'Retrait';
                    actionCell.classList.add(entry.quantity_change > 0 ? 'positive' : 'negative');
                    row.insertCell().textContent = entry.component_ref;
                    const changeCell = row.insertCell();
                    changeCell.textContent = entry.quantity_change > 0 ? `+${entry.quantity_change}` : `${entry.quantity_change}`;
                    changeCell.classList.add(entry.quantity_change > 0 ? 'positive' : 'negative');
                    row.insertCell().textContent = entry.quantity_after;
                });
                 currentLogPage = Math.max(1, Math.min(currentLogPage, totalPages || 1));
                 if(logPageInfo) logPageInfo.textContent = `Page ${currentLogPage} / ${totalPages || 1}`;
                 if(logPrevPageButton) logPrevPageButton.disabled = currentLogPage === 1;
                 if(logNextPageButton) logNextPageButton.disabled = currentLogPage >= totalPages;
            }
        } catch (err) {
            console.error("Erreur affichage historique:", err);
            logTableBody.innerHTML = `<tr><td colspan="6" class="error-message" style="text-align: center; color: var(--error-color);">Erreur chargement: ${err.message}</td></tr>`;
            if(logPageInfo) logPageInfo.textContent = 'Erreur';
        }
    }
    function formatLogTimestamp(date) { try { return date.toLocaleString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }); } catch(e) { return date.toISOString(); } }

    // MODIF: Ajout logs détaillés
    async function addLogEntry(itemRef, change, newQuantity) {
        if (!currentUser || !currentUserCode || !supabase) {
            console.warn("[addLogEntry] Log annulé: utilisateur ou supabase manquant."); // AJOUT: Log détaillé
            return; // Ne pas lever d'erreur ici, juste ne pas logger
        }
        const logData = {
            user_id: currentUser.id,
            user_code: currentUserCode.toUpperCase(),
            component_ref: itemRef,
            quantity_change: change,
            quantity_after: newQuantity
        };
        console.log("[addLogEntry] Tentative d'insertion log:", logData); // AJOUT: Log données
        try {
            const { error: logError } = await supabase
                .from('logs')
                .insert(logData);

            if (logError) {
                console.error("[addLogEntry] Erreur écriture log Supabase:", logError); // AJOUT: Log erreur
                // Essayer de donner une erreur plus utile pour RLS
                if (logError.message.includes("violates row-level security policy")) {
                     console.error("[addLogEntry] Problème RLS détecté sur la table 'logs'.");
                     // Ne pas bloquer l'opération principale pour une erreur de log, mais la signaler
                }
                // Ne pas lever d'erreur ici pour ne pas interrompre le flux principal si seul le log échoue
            } else {
                console.log("[addLogEntry] Log enregistré avec succès."); // AJOUT: Log succès
                // Rafraîchir la vue des logs si elle est active et sur la première page
                if (logView?.classList.contains('active-view') && currentLogPage === 1) {
                    displayLog(1);
                }
            }
        } catch (err) {
            // Gérer les erreurs JS inattendues lors de l'écriture du log
            console.error("[addLogEntry] Erreur JS inattendue lors de l'écriture du log:", err);
        }
    }

    // --- VUE ADMIN ---
    async function getCategories() {
        if (categoriesCache.length > 0) {
            // console.log("Utilisation cache catégories."); // Optionnel
            return categoriesCache;
        }
        if (!supabase) { console.error("getCategories: Supabase non initialisé."); return []; }
        console.log("Fetching categories from Supabase...");
        try {
            const { data, error } = await supabase.from('categories').select('id, name, attributes').order('name', { ascending: true });
            if (error) { throw new Error(`Erreur DB chargement catégories: ${error.message}`); }
            categoriesCache = data || [];
            // Assurer que 'attributes' est toujours un Array
             categoriesCache.forEach(cat => {
                 if (typeof cat.attributes === 'string' && cat.attributes.trim() && !cat.attributes.startsWith('[')) {
                     cat.attributes = cat.attributes.split(',').map(a => a.trim()).filter(a => a);
                 } else if (!Array.isArray(cat.attributes)) {
                     cat.attributes = [];
                 }
             });
            console.log(`Categories fetched and cached: ${categoriesCache.length}.`);
            return categoriesCache;
        } catch (err) {
            console.error("Erreur lecture/traitement catégories:", err);
            if (adminView?.classList.contains('active-view')) { showAdminFeedback(`Erreur chargement catégories: ${err.message}`, 'error'); }
            return [];
        }
    }
    function invalidateCategoriesCache() { categoriesCache=[];console.log("Cache catégories invalidé.");}
    async function loadAdminData() { if(!currentUser)return;const catManager=document.getElementById('category-manager');const stockManager=document.getElementById('stock-manager');if(catManager)catManager.style.display='block';if(stockManager)stockManager.style.display='block';if(adminFeedbackDiv){adminFeedbackDiv.style.display='none';adminFeedbackDiv.textContent='';}resetStockForm();try{await loadCategoriesAdmin();}catch(error){console.error("Erreur loadAdminData:",error);showAdminFeedback(`Erreur load admin: ${error.message}`,'error');}}
    async function loadCategoriesAdmin() { if(categoryList)categoryList.innerHTML='<li><i>Chargement...</i></li>';if(componentCategorySelectAdmin)componentCategorySelectAdmin.innerHTML='<option value="">Chargement...</option>';try{const categories=await getCategories();if(categoryList)categoryList.innerHTML='';if(componentCategorySelectAdmin)componentCategorySelectAdmin.innerHTML='<option value="">-- Sélectionner --</option>';if(categories&&categories.length>0){categories.forEach(cat=>{if(categoryList){const li=document.createElement('li');li.dataset.categoryId=cat.id;li.innerHTML=`<span>${cat.name}</span><span class="category-actions"><button class="edit-cat" title="Modifier ${cat.name}">Modif</button> <button class="delete-cat" title="Supprimer ${cat.name}">Suppr.</button></span>`;categoryList.appendChild(li);}if(componentCategorySelectAdmin){const option=document.createElement('option');option.value=cat.id;option.textContent=cat.name;option.dataset.attributes=JSON.stringify(cat.attributes || []); componentCategorySelectAdmin.appendChild(option);}});}else{if(categoryList)categoryList.innerHTML='<li>Aucune catégorie.</li>';if(componentCategorySelectAdmin)componentCategorySelectAdmin.innerHTML='<option value="">Aucune</option>';}}catch(error){console.error("Erreur loadCategoriesAdmin:",error);if(categoryList)categoryList.innerHTML='<li>Erreur chargement.</li>';if(componentCategorySelectAdmin)componentCategorySelectAdmin.innerHTML='<option value="">Erreur</option>';showAdminFeedback(`Erreur chargement catégories: ${error.message}`, 'error');}}
    function addCategoryEventListeners() { categoryList?.addEventListener('click',async(event)=>{const targetButton=event.target.closest('button');if(!targetButton)return;const listItem=targetButton.closest('li[data-category-id]');if(!listItem)return;const categoryId=listItem.dataset.categoryId;if(!categoryId||!supabase)return;const category=categoriesCache.find(c=>c.id.toString()===categoryId);if(!category){console.error(`Cat ID ${categoryId} non trouvée cache.`);showAdminFeedback('Erreur interne: Cat non trouvée.','error');return;}if(targetButton.classList.contains('edit-cat')){if(categoryIdEditInput)categoryIdEditInput.value=category.id;if(categoryNameInput)categoryNameInput.value=category.name;if(categoryAttributesInput)categoryAttributesInput.value=(category.attributes || []).join(', ');if(categoryFormTitle)categoryFormTitle.textContent=`Modifier: ${category.name}`;if(cancelEditButton)cancelEditButton.style.display='inline-block';categoryNameInput?.focus();showAdminFeedback(`Modification de "${category.name}"...`,'info');}else if(targetButton.classList.contains('delete-cat')){if(!confirm(`Voulez-vous vraiment supprimer la catégorie "${category.name}" ?`))return;showAdminFeedback(`Suppression de "${category.name}"...`,"info");targetButton.disabled=true;targetButton.closest('.category-actions')?.querySelectorAll('button').forEach(b=>b.disabled=true);try{const{count:componentCount,error:countError}=await supabase.from('inventory').select('*',{count:'exact',head:true}).eq('category_id',categoryId);if(countError){throw new Error(`Erreur vérification composants: ${countError.message}`);}if(componentCount>0){if(!confirm(`ATTENTION: ${componentCount} composant(s) utilise(nt) "${category.name}".\nContinuer dissociera ces composants.\nVoulez-vous continuer ?`)){throw new Error("Suppression annulée.");}const{error:updateError}=await supabase.from('inventory').update({category_id:null}).eq('category_id',categoryId);if(updateError){throw new Error(`Erreur dissociation: ${updateError.message}`);}console.log(`${componentCount} composant(s) dissocié(s).`);}const{error:deleteError}=await supabase.from('categories').delete().eq('id',categoryId);if(deleteError){throw new Error(`Erreur DB suppression: ${deleteError.message}`);}showAdminFeedback(`Catégorie "${category.name}" supprimée.`,'success');invalidateCategoriesCache();await loadCategoriesAdmin();if(categoryIdEditInput?.value===categoryId){resetCategoryForm();}await populateInventoryFilters();}catch(err){console.error("Erreur suppression cat:",err);showAdminFeedback(`Erreur suppression: ${err.message}`,'error');const stillExistingLi=categoryList.querySelector(`li[data-category-id="${categoryId}"]`);if(stillExistingLi){stillExistingLi.querySelectorAll('button').forEach(b=>b.disabled=false);}}}});cancelEditButton?.addEventListener('click',resetCategoryForm);categoryForm?.addEventListener('submit',async(event)=>{event.preventDefault();if(!supabase)return;const catName=categoryNameInput?.value.trim();const catAttributesStr=categoryAttributesInput?.value.trim();const editingId=categoryIdEditInput?.value;if(!catName){showAdminFeedback("Le nom de la catégorie est obligatoire.",'error');categoryNameInput?.focus();return;}const attributesArray=catAttributesStr?catAttributesStr.split(',').map(attr=>attr.trim()).filter(attr=>attr):[];const categoryData={name:catName,attributes:attributesArray.length > 0 ? attributesArray : null};showAdminFeedback("Enregistrement...","info");const saveBtn=document.getElementById('save-category-button');if(saveBtn)saveBtn.disabled=true;if(cancelEditButton)cancelEditButton.disabled=true;try{let response;if(editingId){response=await supabase.from('categories').update(categoryData).eq('id',editingId).select().single();}else{response=await supabase.from('categories').insert(categoryData).select().single();}const{data,error}=response;if(error){if(error.code==='23505'){showAdminFeedback(`Erreur: Le nom de catégorie "${catName}" existe déjà.`,'error');categoryNameInput?.focus();}else{throw new Error(`Erreur DB: ${error.message}`);}}else{showAdminFeedback(`Catégorie "${data.name}" ${editingId?'modifiée':'ajoutée'}.`,'success');invalidateCategoriesCache();await loadCategoriesAdmin();resetCategoryForm();await populateInventoryFilters();}}catch(err){console.error("Erreur enregistrement cat:",err);showAdminFeedback(`Erreur: ${err.message}`,'error');}finally{if(saveBtn)saveBtn.disabled=false;if(cancelEditButton&&categoryIdEditInput?.value)cancelEditButton.disabled=false;}});}
    function resetCategoryForm(){ if(categoryForm)categoryForm.reset();if(categoryIdEditInput)categoryIdEditInput.value='';if(categoryFormTitle)categoryFormTitle.textContent="Ajouter une Catégorie";if(cancelEditButton)cancelEditButton.style.display='none';if(adminFeedbackDiv)adminFeedbackDiv.style.display='none';}

    // Fonction dédiée pour afficher les champs d'attributs
    function renderSpecificAttributes(attributes, categoryName, existingValues = {}) { // MODIF: Ajout param existingValues
        if (!specificAttributesDiv) { console.error("Conteneur #category-specific-attributes non trouvé."); return;}
        specificAttributesDiv.innerHTML = ''; // Vider la zone
        specificAttributesDiv.style.display = 'none'; // Cacher par défaut

        if (Array.isArray(attributes) && attributes.length > 0) {
            console.log(`Rendu de ${attributes.length} attributs pour ${categoryName}. Valeurs existantes:`, existingValues);
            specificAttributesDiv.style.display = 'block'; // Afficher la zone
            const titleElement = document.createElement('h4');
            titleElement.textContent = `Attributs Spécifiques (${categoryName})`;
            specificAttributesDiv.appendChild(titleElement);

            attributes.forEach(attr => {
                if (typeof attr !== 'string' || !attr.trim()) { console.warn("Attribut invalide ignoré:", attr); return; }
                const cleanAttrName = attr.trim();
                const formGroup = document.createElement('div');
                formGroup.classList.add('form-group');
                const inputId = `attr-${cleanAttrName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
                const label = document.createElement('label');
                label.setAttribute('for', inputId);
                label.textContent = `${cleanAttrName}:`;
                const input = document.createElement('input');
                input.setAttribute('type', 'text');
                input.setAttribute('id', inputId);
                input.setAttribute('name', `attributes[${cleanAttrName}]`); // Sera parsé au submit
                input.setAttribute('placeholder', `Valeur pour ${cleanAttrName}`);
                input.dataset.attributeName = cleanAttrName; // Stocker nom propre

                // AJOUT: Pré-remplir si une valeur existante est fournie
                 if (existingValues && existingValues[cleanAttrName] !== undefined && existingValues[cleanAttrName] !== null) {
                     input.value = existingValues[cleanAttrName];
                 }

                formGroup.appendChild(label);
                formGroup.appendChild(input);
                specificAttributesDiv.appendChild(formGroup);
            });
        } else {
            console.log(`Aucun attribut spécifique valide à rendre pour ${categoryName || 'la catégorie sélectionnée'}`);
        }
    }

    // Listener pour le select de catégorie
    function addComponentCategorySelectListener() {
        componentCategorySelectAdmin?.addEventListener('change', () => {
            const selectedOption = componentCategorySelectAdmin.options[componentCategorySelectAdmin.selectedIndex];
            if (!selectedOption || !selectedOption.value) {
                renderSpecificAttributes([], ''); // Vider si "-- Sélectionner --"
                return;
            }
            const attributesJson = selectedOption.dataset.attributes;
            const categoryName = selectedOption.textContent;
            try {
                const attributes = attributesJson ? JSON.parse(attributesJson) : [];
                // MODIF: Ne pas passer de valeurs existantes ici, car on change de catégorie
                renderSpecificAttributes(attributes, categoryName, {});
            } catch (e) {
                console.error("Erreur parsing attributs catégorie JSON:", e, attributesJson);
                renderSpecificAttributes([], categoryName, {}); // Vider en cas d'erreur
            }
        });
    }

    function showAdminFeedback(message, type = 'info'){ if(adminFeedbackDiv){adminFeedbackDiv.textContent=message;adminFeedbackDiv.className=`feedback-area ${type}`;adminFeedbackDiv.style.display='block';}}

    function resetStockForm() {
        if (stockForm) stockForm.reset();
        if (componentActionsWrapper) componentActionsWrapper.style.display = 'none';
        if (deleteComponentButton) deleteComponentButton.style.display = 'none';
        if (specificAttributesDiv) { specificAttributesDiv.innerHTML = ''; specificAttributesDiv.style.display = 'none'; }
        if (componentRefAdminInput) componentRefAdminInput.disabled = false;
        if (componentInitialQuantityInput) componentInitialQuantityInput.value = 0;
        if (componentThresholdInput) componentThresholdInput.value = '';
        if (adminFeedbackDiv) adminFeedbackDiv.style.display = 'none';
        if (componentCategorySelectAdmin) componentCategorySelectAdmin.value = "";
        console.log("Formulaire stock réinitialisé.");
    }

    function addStockEventListeners() {
        checkStockButton?.addEventListener('click', async () => {
            const ref = componentRefAdminInput?.value.trim().toUpperCase();
            if (!ref) { showAdminFeedback("Entrez une référence à vérifier.", 'warning'); componentRefAdminInput?.focus(); return; }
            if (adminFeedbackDiv) adminFeedbackDiv.style.display = 'none';
            if (checkStockButton) checkStockButton.disabled = true; checkStockButton.textContent = "Vérif...";
            if (componentRefAdminInput) componentRefAdminInput.disabled = true;
            if (componentActionsWrapper) componentActionsWrapper.style.display = 'none';
            if (deleteComponentButton) deleteComponentButton.style.display = 'none';

            try {
                const stockInfo = await getStockInfoFromSupabase(ref);
                if (stockInfo) {
                    console.log("Stock info admin récupérée:", stockInfo);
                    if (componentActionsWrapper) componentActionsWrapper.style.display = 'block';
                    if (componentInfoDiv) componentInfoDiv.style.display = 'block';
                    if (currentQuantitySpan) currentQuantitySpan.textContent = stockInfo.quantity;
                    if (quantityChangeInput) quantityChangeInput.value = 0;
                    if (componentDescInput) componentDescInput.value = stockInfo.description || "";
                    if (componentMfgInput) componentMfgInput.value = stockInfo.manufacturer || "";
                    if (componentDatasheetInput) componentDatasheetInput.value = stockInfo.datasheet || "";
                    if (componentDrawerAdminInput) componentDrawerAdminInput.value = stockInfo.drawer || "";
                    if (componentInitialQuantityInput) componentInitialQuantityInput.value = stockInfo.quantity;
                    if (componentThresholdInput) componentThresholdInput.value = stockInfo.critical_threshold ?? '';

                    let attributesDefinition = [];
                    let categoryNameToRender = 'N/A';
                    if (componentCategorySelectAdmin) {
                        componentCategorySelectAdmin.value = stockInfo.category_id || "";
                        const selectedOption = componentCategorySelectAdmin.options[componentCategorySelectAdmin.selectedIndex];
                        if (selectedOption && selectedOption.value) {
                             const attributesJson = selectedOption.dataset.attributes;
                             categoryNameToRender = selectedOption.textContent;
                             try { attributesDefinition = attributesJson ? JSON.parse(attributesJson) : []; }
                             catch(e) { console.error("Erreur parsing attributs catégorie pour rendu:", e); }
                        }
                    }
                    // MODIF: Passer les valeurs existantes à renderSpecificAttributes
                    renderSpecificAttributes(attributesDefinition, categoryNameToRender, stockInfo.attributes || {});

                    showAdminFeedback(`Composant "${ref}" trouvé. Modifiez ses détails ou la quantité.`, 'success');
                    if (deleteComponentButton) deleteComponentButton.style.display = 'inline-block';
                    if (currentUser && stockInfo.drawer) { updateSevenSegmentDisplay(stockInfo.drawer); }

                } else {
                    resetStockForm();
                    if (componentRefAdminInput) componentRefAdminInput.value = ref;
                    if (componentActionsWrapper) componentActionsWrapper.style.display = 'none';
                    if (deleteComponentButton) deleteComponentButton.style.display = 'none';
                    renderSpecificAttributes([], ''); // Vider les attributs
                    showAdminFeedback(`Composant "${ref}" inconnu. Remplissez les champs pour l'ajouter.`, 'info');
                    componentCategorySelectAdmin?.focus();
                    updateSevenSegmentDisplay(null);
                }
            } catch (error) {
                console.error("Erreur checkStock:", error);
                showAdminFeedback(`Erreur vérification: ${error.message}`, 'error');
                resetStockForm();
                if (componentRefAdminInput) componentRefAdminInput.value = ref;
            } finally {
                if (checkStockButton) checkStockButton.disabled = false; checkStockButton.textContent = "Vérifier Stock";
                if (componentRefAdminInput) componentRefAdminInput.disabled = false;
            }
        });

        updateQuantityButton?.addEventListener('click', async () => {
            const ref = componentRefAdminInput?.value.trim().toUpperCase();
            const changeStr = quantityChangeInput?.value;
            const change = parseInt(changeStr, 10);
            if (!ref) { showAdminFeedback("Réf manquante.", 'warning'); return; }
            if (changeStr === '' || isNaN(change)) { showAdminFeedback("Quantité de modification invalide.", 'warning'); quantityChangeInput?.focus(); return; }
            if (change === 0) { showAdminFeedback("Aucun changement de quantité spécifié.", 'info'); return; }
            const currentDisplayedQuantity = parseInt(currentQuantitySpan?.textContent, 10);
            if (!isNaN(currentDisplayedQuantity) && currentDisplayedQuantity + change < 0) { showAdminFeedback(`Impossible, le stock deviendrait négatif (${currentDisplayedQuantity + change}).`, 'error'); return; }
            if (updateQuantityButton) updateQuantityButton.disabled = true; updateQuantityButton.textContent = "MàJ...";
            try {
                // Appel de la fonction qui contient maintenant les logs détaillés
                const newQuantity = await updateStockInSupabase(ref, change);
                if (newQuantity !== null) {
                    if (currentQuantitySpan) currentQuantitySpan.textContent = newQuantity;
                    if (componentInitialQuantityInput) componentInitialQuantityInput.value = newQuantity;
                    if (quantityChangeInput) quantityChangeInput.value = 0;
                    showAdminFeedback(`Stock "${ref}" mis à jour: ${newQuantity}.`, 'success');
                    if (inventoryView.classList.contains('active-view')) { displayInventory(); }
                }
                 // Pas besoin de else, updateStockInSupabase lève une erreur si échec
            } catch (error) {
                console.error("Erreur JS updateQty button:", error); // Erreur attrapée ici
                showAdminFeedback(error.message.includes("Stock insuffisant") ? error.message : `Erreur mise à jour: ${error.message}`, 'error');
            } finally {
                if (updateQuantityButton) updateQuantityButton.disabled = false; updateQuantityButton.textContent = "Mettre à jour Quantité";
            }
        });

        stockForm?.addEventListener('submit', async (event) => {
            event.preventDefault(); if (!supabase) return;
            const ref = componentRefAdminInput?.value.trim().toUpperCase();
            const categoryId = componentCategorySelectAdmin?.value || null;
            const description = componentDescInput?.value.trim() || null;
            const manufacturer = componentMfgInput?.value.trim() || null;
            const datasheet = componentDatasheetInput?.value.trim() || null;
            const drawer = componentDrawerAdminInput?.value.trim().toUpperCase() || null;
            const quantityStr = componentInitialQuantityInput?.value;
            const thresholdStr = componentThresholdInput?.value.trim();
            if (!ref) { showAdminFeedback("La référence est obligatoire.", 'error'); componentRefAdminInput?.focus(); return; }
            if (!categoryId) { showAdminFeedback("La catégorie est obligatoire.", 'error'); componentCategorySelectAdmin?.focus(); return; }
            const quantity = parseInt(quantityStr, 10);
            if (quantityStr === '' || isNaN(quantity) || quantity < 0) { showAdminFeedback("La quantité totale doit être un nombre positif ou zéro.", 'error'); componentInitialQuantityInput?.focus(); return; }
            let critical_threshold = null;
            if (thresholdStr !== '') { critical_threshold = parseInt(thresholdStr, 10); if (isNaN(critical_threshold) || critical_threshold < 0) { showAdminFeedback("Le seuil critique doit être un nombre positif ou zéro.", 'error'); componentThresholdInput?.focus(); return; } }
            if (datasheet) { try { new URL(datasheet); } catch (_) { showAdminFeedback("L'URL de la datasheet n'est pas valide.", 'error'); componentDatasheetInput?.focus(); return; } }

            // Récupération correcte des attributs
            const attributes = {};
             specificAttributesDiv?.querySelectorAll('input[data-attribute-name]').forEach(input => {
                 const attrName = input.dataset.attributeName;
                 const attrValue = input.value.trim();
                 if (attrName && attrValue !== '') { attributes[attrName] = attrValue; }
             });

            const componentData = { ref, description, manufacturer, quantity, datasheet, drawer, category_id: categoryId, attributes: Object.keys(attributes).length > 0 ? attributes : null, critical_threshold };
            console.log("Préparation Upsert:", componentData);
            showAdminFeedback("Enregistrement...", "info");
            if (saveComponentButton) saveComponentButton.disabled = true;
            try {
                const { data, error } = await supabase.from('inventory').upsert(componentData, { onConflict: 'ref' }).select().single();
                if (error) {
                    // Gérer erreur de clé étrangère catégorie plus spécifiquement
                     if (error.message.includes('inventory_category_id_fkey')) {
                         throw new Error("Erreur: La catégorie sélectionnée n'existe plus ou est invalide.");
                     }
                     throw new Error(`Erreur DB: ${error.message}`);
                 }
                console.log("Upsert succès:", data);
                showAdminFeedback(`Composant "${ref}" enregistré/mis à jour.`, 'success');
                if (componentActionsWrapper?.style.display === 'block') {
                    if (currentQuantitySpan) currentQuantitySpan.textContent = data.quantity;
                    if (quantityChangeInput) quantityChangeInput.value = 0;
                    if (!deleteComponentButton || deleteComponentButton.style.display === 'none') {
                         if(deleteComponentButton) deleteComponentButton.style.display = 'inline-block';
                    }
                }
                if (inventoryView.classList.contains('active-view')) { displayInventory(); }
                if (currentUser && data.drawer) { updateSevenSegmentDisplay(data.drawer); }
            } catch (err) {
                console.error("Erreur upsert composant:", err);
                showAdminFeedback(`Erreur enregistrement: ${err.message}`, 'error');
            } finally {
                if (saveComponentButton) saveComponentButton.disabled = false;
            }
        });

        deleteComponentButton?.addEventListener('click', async () => {
            const ref = componentRefAdminInput?.value.trim().toUpperCase();
            if (!ref) { showAdminFeedback("Impossible de déterminer la référence à supprimer.", 'error'); return; }
            if (!confirm(`ATTENTION !\n\nVoulez-vous vraiment supprimer définitivement le composant "${ref}" ?\nCette action est irréversible.`)) { return; }
            showAdminFeedback(`Suppression du composant "${ref}" en cours...`, 'info');
            if (deleteComponentButton) deleteComponentButton.disabled = true;
            try {
                const { error } = await supabase .from('inventory') .delete() .eq('ref', ref);
                if (error) { throw new Error(`Erreur lors de la suppression: ${error.message}`); }
                showAdminFeedback(`Composant "${ref}" supprimé avec succès.`, 'success');
                resetStockForm(); updateSevenSegmentDisplay(null);
                if (inventoryView.classList.contains('active-view')) { displayInventory(1); }
            } catch (err) {
                console.error("Erreur suppression composant:", err);
                showAdminFeedback(`Erreur lors de la suppression: ${err.message}`, 'error');
                if (deleteComponentButton) deleteComponentButton.disabled = false;
            }
        });
    }

    // --- VUE RECHERCHE (CHAT IA) ---
    async function addMessageToChat(sender, messageContent, isHTML = false) { if(!responseOutputChat)return;const messageElement=document.createElement('div');messageElement.classList.add('message',sender.toLowerCase());responseOutputChat.prepend(messageElement);if(sender==='AI'){loadingIndicatorChat.style.display='block';loadingIndicatorChat.querySelector('i').textContent='StockAV réfléchit...';messageElement.innerHTML='...';await delay(150);if(isHTML){messageElement.innerHTML=messageContent;}else{messageElement.textContent='';for(let i=0;i<messageContent.length;i++){messageElement.textContent+=messageContent[i];await delay(5);}}loadingIndicatorChat.style.display='none';}else{messageElement.textContent=messageContent;}const role=sender==='User'?'user':'assistant';chatHistory.push({role:role,content:messageContent});if(chatHistory.length>10){chatHistory.splice(0,chatHistory.length-10);}responseOutputChat.scrollTop = 0; /* Scroll vers le haut avec column-reverse */}
    function displayWelcomeMessage() { if(responseOutputChat)responseOutputChat.innerHTML='';chatHistory=[];resetConversationState();addMessageToChat('AI',"Bonjour ! Je suis StockAV. Quelle référence cherchez-vous ?");if(componentInputChat){componentInputChat.value='';componentInputChat.focus();}}
    async function handleUserInput() { const userInput=componentInputChat?.value.trim();if(!userInput)return;addMessageToChat('User',userInput);if(componentInputChat)componentInputChat.value='';try{if(conversationState.awaitingQuantityConfirmation){if(!currentUser){await promptLoginBeforeAction("confirmer quantité");return;}await handleQuantityResponse(userInput);}else{const potentialRef=extractReference(userInput);if(potentialRef){console.log(`Nouvelle réf: ${potentialRef}. Appel checkComponentWithAI.`);resetConversationState();conversationState.originalRefChecked=potentialRef;await checkComponentWithAI(potentialRef);}else{if(conversationState.awaitingEquivalentChoice){await addMessageToChat('AI',"Entrée non reconnue. Cliquez sur un bouton 'Prendre' ou entrez une nouvelle référence.");}else{await addMessageToChat('AI',"Je n'ai pas compris. Pouvez-vous entrer une référence de composant ?");resetConversationState();}}}}catch(error){console.error("Erreur majeure handleUserInput:",error);await addMessageToChat('AI',"Oups ! Une erreur inattendue est survenue. Veuillez réessayer.");resetConversationState();}finally{if(componentInputChat)componentInputChat.focus();}}
    function extractReference(text) {
        const upperText = text.toUpperCase();
        let bestMatch = null;
        const patterns=[/\b(PIC\s?[A-Z\d\-F/L]+)\b/,/\b(AT[TINY|MEGA|XMEGA]+\s?\d+[A-Z\d\-]*)\b/,/\b(STM32[A-Z]\d{2,}[A-Z\d]*)\b/,/\b(ESP[ -]?\d{2,}[A-Z\d\-]*)\b/,/\b(IRF[A-Z\d]+)\b/,/\b(LM\s?\d{2,}[A-Z\d\-/]*)\b/,/\b(NE\s?\d{3}[A-Z]*)\b/,/\b(UA\s?\d{3,}[A-Z]*)\b/,/\b(MAX\s?\d{3,}[A-Z\d\-/]*)\b/,/\b(SN\s?74[A-Z\d]+)\b/,/\b(CD\s?4\d{3,}[A-Z]*)\b/,/\b([1-9]N\s?\d{4}[A-Z]*)\b/,/\b([2-9](?:N|P)\s?\d{4}[A-Z]*)\b/,/\b(BC\s?\d{3}[A-Z]*)\b/,/\b(BD\s?\d{3}[A-Z]*)\b/,/\b(TIP\s?\d{2,}[A-Z]*)\b/,/\b(MOC\s?\d{4}[A-Z]*)\b/,/\b(\d+(?:\.\d+)?\s?(?:PF|NF|UF|ΜF))\b/i,/\b(\d+(?:\.\d+)?[RK]?)\s?(?:R|K|M)?\s?O?H?M?S?\b/i,/\b([A-Z]{2,}\d{2,}[A-Z\d\-/]*)\b/,/\b(\d{2,}[A-Z]{1,}[A-Z\d\-/]*)\b/,/\b([A-Z]{1,}\d{3,}[A-Z\d\-/]*)\b/];
        const ignoreWords=new Set(['POUR','AVEC','COMBIEN','STOCK','CHERCHE','DISPO','EQUIV','REMPLACE','TROUVE','QUEL','EST','QUE','SONT','LES','DU','UN','UNE','OU','ET','LE','LA','DE','À','PLUS','MOINS','PEUT','IL','ELLE','ON','JE','TU','COMME','DANS','SUR','VOLTS','AMPERES','WATTS','OHMS','FARADS','HENRYS','TYPE','VALEUR','REFERENCE']);
        for(const pattern of patterns){const match=upperText.match(pattern);if(match&&match[1]){let cleanedRef = match[1].replace(/\s+/g, '');if (cleanedRef.length >= 3 && !/^\d+$/.test(cleanedRef) && !ignoreWords.has(cleanedRef.replace(/(R|K|M|OHMS?|PF|NF|UF|ΜF)$/i, ''))) {if (!bestMatch || cleanedRef.length > bestMatch.length) {bestMatch = cleanedRef;}}}}
        if (!bestMatch) {const words=upperText.split(/[\s,;:!?()]+/);const potentialRefs=words.filter(w=>w.length>=3&&/\d/.test(w)&&/[A-Z]/.test(w)&&!/^\d+$/.test(w)&&!ignoreWords.has(w));if(potentialRefs.length>0){potentialRefs.sort((a,b)=>b.length-a.length);bestMatch=potentialRefs[0];}}
        console.log(`Référence extraite de "${text}" -> "${bestMatch}"`);return bestMatch;
    }
    async function checkComponentWithAI(originalRef) { loadingIndicatorChat.style.display='block';loadingIndicatorChat.querySelector('i').textContent=`Analyse locale ${originalRef}...`;let originalStockInfo=null;let equivalents=[];let aiError=null;let responseHTML="";try{
        originalStockInfo = await getStockInfoFromSupabase(originalRef);
        await delay(150);
        if(currentUser&&originalStockInfo?.drawer){updateSevenSegmentDisplay(originalStockInfo.drawer);}const showDrawer=currentUser&&originalStockInfo?.drawer;let originalStatusHTML="";if(originalStockInfo){const indicatorHTML=createStockIndicatorHTML(originalStockInfo.quantity,originalStockInfo.critical_threshold);originalStatusHTML=(originalStockInfo.quantity>0)?`${indicatorHTML}Original <strong>${originalRef}</strong> : Dispo (Qté: ${originalStockInfo.quantity}${showDrawer?`, Tiroir: ${originalStockInfo.drawer}`:''}).`:`${indicatorHTML}Original <strong>${originalRef}</strong> : Rupture local.`;if(originalStockInfo.quantity>0)conversationState.criticalThreshold=originalStockInfo.critical_threshold;}else{originalStatusHTML=`${createStockIndicatorHTML(undefined,undefined)}Original <strong>${originalRef}</strong> : Non trouvé local.`;}responseHTML+=originalStatusHTML;loadingIndicatorChat.querySelector('i').textContent=`Recherche équivalents IA ${originalRef}...`;
        const { data: aiResult, error: edgeError } = await supabase.functions.invoke('ai-component-info', { body: { reference: originalRef } });
        if (edgeError) {aiError = edgeError.message || "Erreur appel service IA.";console.error("Erreur invoke Supabase Function:", aiError);} else if (aiResult && aiResult.error) {aiError = aiResult.error;console.error("Erreur retournée par la fonction Edge:", aiError);} else {equivalents = aiResult?.equivalents || [];}
        let equivalentsStockInfo={};if(equivalents.length>0){loadingIndicatorChat.querySelector('i').textContent=`Vérif stock local équivalents...`;const equivalentRefs=equivalents.map(eq=>eq.ref);const stockCheckPromises=equivalentRefs.map(ref=>getStockInfoFromSupabase(ref));const results=await Promise.all(stockCheckPromises);results.forEach((stockInfo,index)=>{if(stockInfo){equivalentsStockInfo[equivalentRefs[index]]=stockInfo;}});console.log("Stock info équivalents:",equivalentsStockInfo);}if(equivalents.length>0){responseHTML+="<br><br><strong>Équivalents suggérés IA :</strong>";let foundAvailableEquivalent=false;equivalents.forEach(eq=>{const eqStock=equivalentsStockInfo[eq.ref];const eqIndicatorHTML=createStockIndicatorHTML(eqStock?.quantity,eqStock?.critical_threshold);const eqShowDrawer=currentUser&&eqStock?.drawer;responseHTML+=`<div class="equivalent-item">`;responseHTML+=`${eqIndicatorHTML}<strong>${eq.ref}</strong> <small>(${eq.reason||'Suggestion AI'})</small>`;if(eqStock){if(eqStock.quantity>0){foundAvailableEquivalent=true;responseHTML+=` : Dispo (Qté: ${eqStock.quantity}${eqShowDrawer?`, Tiroir: ${eqStock.drawer}`:''})`;if(currentUser){responseHTML+=` <button class="choice-button take-button" data-ref="${eq.ref}" data-qty="${eqStock.quantity}" data-threshold="${eqStock.critical_threshold??''}">Prendre</button>`;}}else{responseHTML+=` : Rupture local.`;responseHTML+=provideExternalLinksHTML(eq.ref,true);}}else{responseHTML+=` : Non trouvé local.`;responseHTML+=provideExternalLinksHTML(eq.ref,true);}responseHTML+=`</div>`;});if(foundAvailableEquivalent||(originalStockInfo&&originalStockInfo.quantity>0)){conversationState.awaitingEquivalentChoice=true;}}else if(!aiError){responseHTML+="<br><br>IA n'a pas trouvé d'équivalents.";}
    if (originalStockInfo && originalStockInfo.quantity > 0) {if(currentUser){responseHTML += `<br><button class="choice-button take-button" data-ref="${originalRef}" data-qty="${originalStockInfo.quantity}" data-threshold="${originalStockInfo.critical_threshold ?? ''}">Prendre original (${originalRef})</button>`;conversationState.awaitingEquivalentChoice = true;}else{responseHTML += `<br><br><i>Original dispo. Connectez-vous pour prendre.</i>`;}}
    if(!originalStockInfo||originalStockInfo.quantity<=0){responseHTML+=provideExternalLinksHTML(originalRef,false);}if(aiError){responseHTML+=`<br><br><i style="color: var(--error-color);">Erreur IA équivalents: ${aiError}.</i>`;if(!responseHTML.includes('external-links-block')&&(!originalStockInfo||originalStockInfo.quantity<=0)){responseHTML+=provideExternalLinksHTML(originalRef,false);}}if(!conversationState.awaitingEquivalentChoice&&!conversationState.awaitingQuantityConfirmation){responseHTML+="<br><br>Autre chose ?";resetConversationState();}else if(!currentUser&&conversationState.awaitingEquivalentChoice){responseHTML+=`<br><br><i>Connectez-vous pour choisir/prendre.</i>`;}}catch(error){console.error(`Erreur majeure checkComponentWithAI pour ${originalRef}:`,error);responseHTML=`Erreur recherche <strong>${originalRef}</strong>.<br>Détails: ${error.message}`;resetConversationState();}finally{loadingIndicatorChat.style.display='none';await addMessageToChat('AI',responseHTML,true);}}
    responseOutputChat?.addEventListener('click', async (event) => { const targetButton=event.target.closest('button.choice-button.take-button');if(targetButton&&conversationState.awaitingEquivalentChoice){const chosenRef=targetButton.dataset.ref;const availableQtyStr=targetButton.dataset.qty;const criticalThresholdStr=targetButton.dataset.threshold;if(!chosenRef||availableQtyStr===undefined){return;}const availableQty=parseInt(availableQtyStr,10);if(isNaN(availableQty)||availableQty<=0){return;}if(!currentUser){await promptLoginBeforeAction(`prendre ${chosenRef}`);return;}console.log(`Choix: ${chosenRef}, Qté: ${availableQty}`);conversationState.awaitingEquivalentChoice=false;addMessageToChat('User',`Je prends ${chosenRef}`);await delay(50);conversationState.chosenRefForStockCheck=chosenRef;conversationState.availableQuantity=availableQty;conversationState.criticalThreshold=(criticalThresholdStr&&!isNaN(parseInt(criticalThresholdStr,10)))?parseInt(criticalThresholdStr,10):null;conversationState.awaitingQuantityConfirmation=true;
        const stockInfo = await getStockInfoFromSupabase(chosenRef);
        if(currentUser&&stockInfo?.drawer){updateSevenSegmentDisplay(stockInfo.drawer);}await addMessageToChat('AI',`Combien de <strong>${chosenRef}</strong> ? (Stock : ${availableQty}) Entrez nombre ou '0'.`);}else if(event.target.tagName==='A'&&(event.target.classList.contains('external-link')||event.target.classList.contains('external-link-inline'))){console.log(`Lien externe: ${event.target.href}`);}});
    async function promptLoginBeforeAction(actionDescription) { await addMessageToChat('AI',`Pour ${actionDescription}, veuillez vous connecter (zone en haut).`);loginCodeInput?.focus();}
    function provideExternalLinksHTML(ref, inline = false) { if(!ref)return'';const encodedRef=encodeURIComponent(ref);const mLink=`https://www.mouser.ca/Search/Refine?Keyword=${encodedRef}`;const dLink=`https://www.digikey.ca/en/products/result?keywords=${encodedRef}`;const aLink=`https://www.aliexpress.com/wholesale?SearchText=${encodedRef}`;if(inline){return` <span class="external-links-inline">(Voir : <a href="${mLink}" target="_blank" rel="noopener noreferrer" class="external-link-inline" title="Rechercher ${ref} sur Mouser">Mouser</a>, <a href="${dLink}" target="_blank" rel="noopener noreferrer" class="external-link-inline" title="Rechercher ${ref} sur Digi-Key">Digi-Key</a>, <a href="${aLink}" target="_blank" rel="noopener noreferrer" class="external-link-inline aliexpress" title="Rechercher ${ref} sur AliExpress">AliExpress</a>)</span>`;}else{return`<div class="external-links-block">Liens recherche externe <strong>${ref}</strong> : <a href="${mLink}" target="_blank" rel="noopener noreferrer" class="external-link">Mouser</a> <a href="${dLink}" target="_blank" rel="noopener noreferrer" class="external-link">Digi-Key</a> <a href="${aLink}" target="_blank" rel="noopener noreferrer" class="external-link aliexpress">AliExpress</a></div>`;}}
    async function handleQuantityResponse(userInput) { const ref=conversationState.chosenRefForStockCheck;if(!ref||!conversationState.awaitingQuantityConfirmation){const potentialRef=extractReference(userInput);if(potentialRef){resetConversationState();conversationState.originalRefChecked=potentialRef;await checkComponentWithAI(potentialRef);}else{await addMessageToChat("AI","Non compris. Entrez réf ou cliquez 'Prendre'.");conversationState.awaitingQuantityConfirmation=false;}return;}const requestedQty=parseInt(userInput,10);if(isNaN(requestedQty)||requestedQty<0){await addMessageToChat('AI',`Qté invalide. Entrez nombre >= 0.`);return;}if(requestedQty===0){await addMessageToChat('AI',"Prise stock annulée.");resetConversationState();await delay(300);await addMessageToChat('AI',"Besoin d'autre chose ?");return;}if(requestedQty>conversationState.availableQuantity){await addMessageToChat('AI',`Qté (${requestedQty}) > stock (${conversationState.availableQuantity}). Entrez qté valide ou '0'.`);return;}loadingIndicatorChat.style.display='block';loadingIndicatorChat.querySelector('i').textContent=`MàJ stock ${ref}...`;const change=-requestedQty;try{
        // Appel de la fonction qui contient maintenant les logs détaillés
        const newQty=await updateStockInSupabase(ref,change);
        loadingIndicatorChat.style.display='none';if(newQty!==null){const statusIndicatorHTML=createStockIndicatorHTML(newQty,conversationState.criticalThreshold);await addMessageToChat('AI',`${statusIndicatorHTML}Ok ! ${requestedQty} x <strong>${ref}</strong> retiré(s). Stock : ${newQty}.`);if(inventoryView.classList.contains('active-view')){displayInventory(currentInventoryPage);}conversationState.awaitingQuantityConfirmation=false;}}catch(error){console.error("Erreur màj stock via chat:",error);loadingIndicatorChat.style.display='none';let errorMessage=`Erreur màj stock <strong>${ref}</strong>.`;if(error.message.includes("Stock insuffisant")){errorMessage=`Erreur critique : Stock <strong>${ref}</strong> insuffisant. ${error.message}`; // Inclure le message d'erreur exact
        const currentStock = await getStockInfoFromSupabase(ref);
        if(currentStock){errorMessage+=` Stock actuel réel: ${currentStock.quantity}. Réessayez qté valide ou '0'.`;conversationState.availableQuantity=currentStock.quantity;conversationState.awaitingQuantityConfirmation=true;await addMessageToChat('AI',errorMessage);return;}}else if(error.message){errorMessage+=` Détails: ${error.message}`;}conversationState.awaitingQuantityConfirmation=false;await addMessageToChat('AI',errorMessage);resetConversationState();}finally{if(!conversationState.awaitingQuantityConfirmation){resetConversationState();await delay(300);await addMessageToChat('AI',"Besoin d'autre chose ?");}}}
    function resetConversationState() { conversationState={awaitingEquivalentChoice:false,awaitingQuantityConfirmation:false,originalRefChecked:null,potentialEquivalents:[],chosenRefForStockCheck:null,availableQuantity:0,criticalThreshold:null};console.log("État conv chat réinitialisé.");}

    // --- Fonctions d'interaction Supabase ---
    async function getStockInfoFromSupabase(ref) { if (!supabase || !ref) return null; const upperRef = ref.toUpperCase(); console.log(`Supabase GET: Tentative récup pour ref: ${upperRef}`); try { const { data, error } = await supabase .from('inventory') .select('*, category_id, critical_threshold, attributes') // MODIF: Inclure les attributs ici aussi
        .ilike('ref', upperRef) .single(); if (error) { if (error.code === 'PGRST116') { console.log(`Supabase GET: Réf ${upperRef} non trouvée.`); return null; } console.error(`Supabase GET: Erreur pour ${upperRef}:`, error); return null; } console.log(`Supabase GET: Données reçues pour ${upperRef}:`, data); return data; } catch (err) { console.error("Erreur JS dans getStockInfoFromSupabase:", err); return null; } }

    // MODIF: Ajout logs détaillés
    async function updateStockInSupabase(ref, change) {
        if (!supabase || !ref || change === 0 || !currentUser) { // Vérifier currentUser
            console.warn("[updateStockInSupabase] Màj annulée: infos manquantes ou non connecté.", { ref, change, currentUser, supabase });
            throw new Error("Màj annulée: infos manquantes ou non connecté.");
        }
        const upperRef = ref.toUpperCase();
        console.log(`[updateStockInSupabase] Réf: ${upperRef}, Change: ${change}, User: ${currentUser.id}`); // AJOUT: Log User ID
        try {
            console.log(`[updateStockInSupabase] 1. Lecture stock actuel pour ${upperRef}...`); // AJOUT: Log étape
            const { data: currentItem, error: readError } = await supabase
                .from('inventory')
                .select('quantity, drawer') // Sélectionner seulement ce qui est nécessaire
                .ilike('ref', upperRef)      // Utiliser ilike pour être insensible à la casse si besoin
                .single();                  // S'attendre à un seul résultat

            if (readError || !currentItem) {
                if (readError && readError.code === 'PGRST116') { // Code spécifique Supabase pour "0 lignes retournées"
                    console.error(`[updateStockInSupabase] Echec lecture: Composant "${upperRef}" non trouvé.`);
                    throw new Error(`Composant "${upperRef}" non trouvé.`);
                }
                console.error(`[updateStockInSupabase] Echec lecture stock ${upperRef}:`, readError);
                throw new Error(`Erreur lecture stock ${upperRef}: ${readError?.message || 'Composant introuvable'}`);
            }
            console.log(`[updateStockInSupabase] 2. Stock actuel trouvé pour ${upperRef}: ${currentItem.quantity}`); // AJOUT: Log stock actuel

            const newQuantity = currentItem.quantity + change;
            if (newQuantity < 0) {
                console.warn(`[updateStockInSupabase] Stock insuffisant pour ${upperRef}. Actuel: ${currentItem.quantity}, Demandé: ${change}`);
                // MODIF: Message d'erreur plus précis
                throw new Error(`Stock insuffisant pour ${upperRef}. Quantité actuelle: ${currentItem.quantity}, Retrait demandé: ${Math.abs(change)}.`);
            }

            console.log(`[updateStockInSupabase] 3. Mise à jour stock pour ${upperRef} vers ${newQuantity}...`); // AJOUT: Log étape
            const { data: updateData, error: updateError } = await supabase
                .from('inventory')
                .update({ quantity: newQuantity })
                .ilike('ref', upperRef)         // Utiliser ilike ici aussi
                .select('quantity, drawer')     // Retourner les colonnes mises à jour
                .single();                      // S'attendre à un seul résultat

            if (updateError) {
                console.error(`[updateStockInSupabase] Echec mise à jour stock ${upperRef}:`, updateError);
                // Essayer de donner une erreur plus utile pour RLS
                if (updateError.message.includes("violates row-level security policy")) {
                     throw new Error(`Permission refusée pour modifier le stock de "${upperRef}". Vérifiez les RLS.`);
                }
                throw new Error(`Erreur enregistrement màj stock pour ${upperRef}.`);
            }
            console.log(`[updateStockInSupabase] 4. Mise à jour réussie pour ${upperRef}. Nouvelle Qté: ${updateData.quantity}.`); // AJOUT: Log succès

            // 5. Enregistrer le log séparément
            await addLogEntry(upperRef, change, newQuantity);

            // 6. Mettre à jour l'afficheur si nécessaire
            if (currentUser && updateData.drawer) {
                updateSevenSegmentDisplay(updateData.drawer);
            }
            return newQuantity; // Retourner la nouvelle quantité confirmée

        } catch (err) { // Attrape les erreurs levées dans le try ou les erreurs JS inattendues
            console.error(`[updateStockInSupabase] Erreur globale pour ${upperRef}:`, err.message);
            throw err; // Relancer l'erreur pour gestion par l'appelant
        }
    }

    // --- Gestion Modale Quantité (+/-) ---
    async function handleInventoryRowClick(event) {
        const row = event.target.closest('tr.inventory-item-row'); if (!row) return;
        if (!currentUser) { if (loginError) { loginError.textContent = "Connectez-vous pour modifier le stock."; loginError.style.color = 'var(--error-color)'; loginError.style.display = 'block'; } loginCodeInput?.focus(); return; }
        const ref = row.dataset.ref; if (!ref) { console.error("Ref manquante sur ligne:", row); return; }
        // MODIF: Récupérer les attributs depuis data-attributes
        let attributes = {};
        try { attributes = row.dataset.attributes ? JSON.parse(row.dataset.attributes) : {}; }
        catch (e) { console.error(`Erreur parsing data-attributes pour ${ref}:`, e); }
        console.log(`Clic inventaire réf: ${ref}`, "Attributs:", attributes);
        row.style.opacity = '0.7';
        try {
            // MODIF: Récupérer l'item complet pour avoir quantité ET attributs à jour
            const item = await getStockInfoFromSupabase(ref);
            row.style.opacity = '1';
            if (item) {
                if (currentUser && item.drawer) { updateSevenSegmentDisplay(item.drawer); }
                // MODIF: Passer les attributs récupérés à showQuantityModal
                showQuantityModal(item.ref, item.quantity, item.attributes);
            } else { console.error(`Détails ${ref} non trouvés.`); alert(`Erreur: Détails ${ref} non trouvés.`); displayInventory(currentInventoryPage); }
        } catch (error) { row.style.opacity = '1'; console.error("Erreur JS handleInventoryRowClick:", error); alert("Erreur récupération détails."); }
    }
    function getBadgeClassForKey(key) { const lowerKey = key.toLowerCase(); if (lowerKey.includes('volt') || lowerKey.includes('tension')) return 'badge-color-red'; if (lowerKey.includes('package') || lowerKey.includes('boitier') || lowerKey.includes('case')) return 'badge-color-gray'; if (lowerKey.includes('capacit') || lowerKey.includes('farad') || lowerKey.includes('µf') || lowerKey.includes('nf') || lowerKey.includes('pf')) return 'badge-color-blue'; if (lowerKey.includes('résistance') || lowerKey.includes('ohm') || lowerKey.includes('ω') || lowerKey.includes('kω') || lowerKey.includes('mω')) return 'badge-color-yellow'; if (lowerKey.includes('inductance') || lowerKey.includes('henry') || lowerKey.includes('µh') || lowerKey.includes('mh')) return 'badge-color-green'; if (lowerKey.includes('tolérance') || lowerKey.includes('precision')) return 'badge-color-yellow'; if (lowerKey.includes('courant') || lowerKey.includes('ampere') || lowerKey.includes('watt')) return 'badge-color-red'; if (lowerKey.includes('type') || lowerKey.includes('polarit') || lowerKey.includes('technologie')) return 'badge-color-green'; return 'badge-color-default'; }
    // MODIF: showQuantityModal accepte maintenant les attributs
    function showQuantityModal(ref, quantity, attributes) {
        if (!quantityChangeModal || !modalOverlay || !modalAttributesContainer || !modalAttributesList) { console.error("Éléments DOM de la modale manquants ! IDs: quantity-change-modal, modal-overlay, modal-current-attributes, modal-attributes-list"); return; }
        modalCurrentRef = ref; modalInitialQuantity = quantity; currentModalChange = 0;
        if (modalRefSpan) modalRefSpan.textContent = ref; if (modalQtySpan) modalQtySpan.textContent = quantity; if (modalChangeAmountDisplay) modalChangeAmountDisplay.textContent = currentModalChange;
        if (modalFeedback) { modalFeedback.textContent = ''; modalFeedback.style.display = 'none'; modalFeedback.className = 'modal-feedback'; }
        // MODIF: Afficher les attributs passés en paramètre
        modalAttributesList.innerHTML = '';
        const hasAttributes = attributes && typeof attributes === 'object' && Object.keys(attributes).length > 0;
        if (hasAttributes) {
            Object.entries(attributes).forEach(([key, value]) => {
                const attributeElement = document.createElement('span');
                const badgeColorClass = getBadgeClassForKey(key);
                attributeElement.className = `attribute-badge ${badgeColorClass}`;
                attributeElement.textContent = `${key}: ${value || '-'}`;
                modalAttributesList.appendChild(attributeElement);
            });
            modalAttributesContainer.style.display = 'block';
        } else {
            modalAttributesContainer.style.display = 'none';
        }
        updateModalButtonStates(); quantityChangeModal.classList.add('active'); modalOverlay.classList.add('active');
    }
    function hideQuantityModal() { if (!quantityChangeModal || !modalOverlay) return; quantityChangeModal.classList.remove('active'); modalOverlay.classList.remove('active'); modalCurrentRef = null; modalInitialQuantity = 0; currentModalChange = 0; if (modalAttributesContainer) { modalAttributesContainer.style.display = 'none'; } if(modalAttributesList){ modalAttributesList.innerHTML = ''; } }
    function updateModalButtonStates() { if(!modalDecreaseButton||!modalIncreaseButton||!modalConfirmButton||!modalChangeAmountDisplay)return;const resultingQuantity=modalInitialQuantity+currentModalChange;if(modalChangeAmountDisplay)modalChangeAmountDisplay.textContent=currentModalChange>0?`+${currentModalChange}`:currentModalChange;if(modalDecreaseButton)modalDecreaseButton.disabled=(resultingQuantity<=0);if(modalIncreaseButton)modalIncreaseButton.disabled=false;if(modalConfirmButton)modalConfirmButton.disabled=(currentModalChange===0);}
    modalDecreaseButton?.addEventListener('click',()=>{if(modalInitialQuantity+currentModalChange>0){currentModalChange--;updateModalButtonStates();}});
    modalIncreaseButton?.addEventListener('click',()=>{currentModalChange++;updateModalButtonStates();});
    modalCancelButton?.addEventListener('click',hideQuantityModal);
    modalOverlay?.addEventListener('click',(event)=>{if(event.target===modalOverlay)hideQuantityModal();});
    modalConfirmButton?.addEventListener('click',async()=>{
        if(modalFeedback)modalFeedback.style.display='none';
        if(currentModalChange===0||!modalCurrentRef)return;
        if(modalInitialQuantity+currentModalChange<0){if(modalFeedback){modalFeedback.textContent="Stock ne peut pas être négatif.";modalFeedback.className='modal-feedback error';modalFeedback.style.display='block';}return;}
        if(modalConfirmButton)modalConfirmButton.disabled=true;if(modalCancelButton)modalCancelButton.disabled=true;if(modalDecreaseButton)modalDecreaseButton.disabled=true;if(modalIncreaseButton)modalIncreaseButton.disabled=true;
        if(modalFeedback){modalFeedback.textContent="Mise à jour...";modalFeedback.className='modal-feedback info';modalFeedback.style.display='block';}
        try{
            // Appel de la fonction qui contient maintenant les logs détaillés
            const newQuantity=await updateStockInSupabase(modalCurrentRef,currentModalChange);
            if(newQuantity!==null){hideQuantityModal();displayInventory(currentInventoryPage);}
             // Pas besoin de else, updateStockInSupabase lève une erreur si échec
        }catch(error){
            console.error("Erreur confirm modal:",error); // Erreur attrapée ici
            if(modalFeedback){
                 modalFeedback.textContent=error.message.includes("Stock insuffisant") ? error.message : `Erreur: ${error.message}`; // Afficher message d'erreur exact
                 modalFeedback.className='modal-feedback error';
                 modalFeedback.style.display='block';
            }
            // Réactiver boutons si modale toujours visible
            if(quantityChangeModal?.classList.contains('active')){
                 if(modalCancelButton)modalCancelButton.disabled=false;
                 updateModalButtonStates();
                 // S'assurer que confirmer est réactivé (si modif != 0)
                 if(modalConfirmButton)modalConfirmButton.disabled=(currentModalChange===0);
                 if(modalDecreaseButton)modalDecreaseButton.disabled=(modalInitialQuantity+currentModalChange<=0);
                 if(modalIncreaseButton)modalIncreaseButton.disabled=false;
            }
        }
    });

    // --- Gestion Afficheur 7 Segments ---
    const segmentMap={'0':['a','b','c','d','e','f'],'1':['b','c'],'2':['a','b','g','e','d'],'3':['a','b','g','c','d'],'4':['f','g','b','c'],'5':['a','f','g','c','d'],'6':['a','f','e','d','c','g'],'7':['a','b','c'],'8':['a','b','c','d','e','f','g'],'9':['a','b','c','d','f','g'],'A':['a','b','c','e','f','g'],'B':['c','d','e','f','g'],'b':['f','e','d','c','g'],'C':['a','f','e','d'],'c':['g','e','d'],'D':['b','c','d','e','g'],'d':['b','c','d','e','g'],'E':['a','f','e','d','g'],'F':['a','f','e','g'],'G':['a','f','e','d','c'],'H':['f','e','b','c','g'],'h':['f','e','c','g'],'I':['f','e'],'J':['b','c','d','e'],'L':['f','e','d'],'O':['a','b','c','d','e','f'],'o':['c','d','e','g'],'P':['a','b','f','e','g'],'r':['e','g'],'S':['a','f','g','c','d'],'U':['b','c','d','e','f'],'u':['c','d','e'],'-':['g'],' ':[],'_':['d']};
    function updateSevenSegmentDisplay(newDrawerValue=undefined){if(newDrawerValue===null){lastDisplayedDrawer=null;}else if(newDrawerValue!==undefined){const trimmedVal=String(newDrawerValue).trim().toUpperCase();if(trimmedVal!=="") {lastDisplayedDrawer=trimmedVal;}}const drawerToDisplay=lastDisplayedDrawer;if(!sevenSegmentDisplay||!segmentDigits.every(d=>d))return;if(!currentUser||!drawerToDisplay){sevenSegmentDisplay.classList.add('display-off');segmentDigits.forEach(digitElement=>{digitElement?.querySelectorAll('.segment').forEach(seg=>seg.classList.remove('on'));digitElement?.classList.add('off');});return;}sevenSegmentDisplay.classList.remove('display-off');const displayChars=drawerToDisplay.slice(-4).padStart(4,' ');segmentDigits.forEach((digitElement,index)=>{if(!digitElement)return;const charToDisplay=displayChars[index]||' ';const segmentsOn=segmentMap[charToDisplay]||segmentMap['-'];digitElement.querySelectorAll('.segment').forEach(seg=>seg.classList.remove('on'));segmentsOn.forEach(segId=>{const segment=digitElement.querySelector(`.segment-${segId}`);segment?.classList.add('on');});digitElement.classList.remove('off');});}

    // --- Logique pour la vue Paramètres ---
    function loadSettingsData() { if (!currentUser || currentUserCode !== 'zine') { console.warn("Tentative de chargement des Paramètres sans être 'zine'."); setActiveView(searchView, searchTabButton); return; } showSettingsFeedback('export', '', 'none'); showSettingsFeedback('import', '', 'none'); if (importCsvFileInput) importCsvFileInput.value = ''; if (categoriesCache.length === 0) { getCategories(); } console.log("Vue Paramètres chargée pour 'zine'."); }
    function showSettingsFeedback(type, message, level = 'info') { const feedbackDiv=(type==='export')?exportFeedbackDiv:importFeedbackDiv;if(feedbackDiv){feedbackDiv.textContent=message;feedbackDiv.className=`feedback-area ${level}`;feedbackDiv.style.display=(!message||level==='none')?'none':'block';}}
    function downloadFile(filename, content, mimeType) { const blob=new Blob([content],{type:mimeType});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);}
    async function handleExportInventoryCSV() { if (!supabase) return; showSettingsFeedback('export', "Récupération de l'inventaire complet...", 'info'); if(exportInventoryCsvButton) exportInventoryCsvButton.disabled = true; try { const { data, error } = await supabase .from('inventory') .select('*, critical_threshold, attributes') // Inclure attributs
        .order('ref', { ascending: true }); if (error) throw new Error(`Erreur base de données: ${error.message}`); if (!data || data.length === 0) { showSettingsFeedback('export', "L'inventaire est actuellement vide. Rien à exporter.", 'warning'); return; } if (categoriesCache.length === 0 && data.some(item => item.category_id)) { await getCategories(); } const categoryNameMap = new Map(categoriesCache.map(cat => [cat.id, cat.name])); const csvData = data.map(item => ({ ref: item.ref, description: item.description || '', manufacturer: item.manufacturer || '', quantity: item.quantity, datasheet: item.datasheet || '', drawer: item.drawer || '', category_name: categoryNameMap.get(item.category_id) || '', critical_threshold: item.critical_threshold ?? '', attributes: item.attributes ? JSON.stringify(item.attributes) : '' // Exporter attributs en JSON
    })); const csvString = Papa.unparse(csvData, { header: true, quotes: true, delimiter: ",", }); const timestamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-'); downloadFile(`stockav_inventory_${timestamp}.csv`, csvString, 'text/csv;charset=utf-8;'); showSettingsFeedback('export', `Export CSV terminé (${data.length} lignes exportées).`, 'success'); } catch (err) { console.error("Erreur lors de l'export CSV:", err); showSettingsFeedback('export', `Erreur lors de l'export CSV: ${err.message}`, 'error'); } finally { if(exportInventoryCsvButton) exportInventoryCsvButton.disabled = false; } }
    async function handleExportLogTXT() { if(!supabase)return;showSettingsFeedback('export',"Récupération de l'historique complet...",'info');if(exportLogTxtButton)exportLogTxtButton.disabled=true;try{const{data,error}=await supabase.from('logs').select('*').order('created_at',{ascending:true});if(error)throw new Error(`Erreur DB: ${error.message}`);if(!data||data.length===0){showSettingsFeedback('export',"L'historique des mouvements est vide.",'warning');return;}let txtContent="Historique des Mouvements - StockAV\n====================================\n\n";txtContent+="Date & Heure          | Technicien | Action  | Référence        | +/-   | Stock Final\n";txtContent+="----------------------+------------+---------+------------------+-------+------------\n";data.forEach(log=>{const timestamp=formatLogTimestamp(new Date(log.created_at)).padEnd(21);const user=(log.user_code||'N/A').padEnd(10);const action=(log.quantity_change>0?'Ajout':'Retrait').padEnd(7);const ref=log.component_ref.padEnd(16);const change=(log.quantity_change>0?`+${log.quantity_change}`:`${log.quantity_change}`).padStart(5);const after=String(log.quantity_after).padStart(11);txtContent+=`${timestamp} | ${user} | ${action} | ${ref} | ${change} | ${after}\n`;});const timestampFile=new Date().toISOString().slice(0,16).replace(/[:T]/g,'-');downloadFile(`stockav_logs_${timestampFile}.txt`,txtContent,'text/plain;charset=utf-8;');showSettingsFeedback('export',`Export TXT de l'historique terminé (${data.length} lignes exportées).`,'success');}catch(err){console.error("Erreur export TXT:",err);showSettingsFeedback('export',`Erreur lors de l'export TXT: ${err.message}`,'error');}finally{if(exportLogTxtButton)exportLogTxtButton.disabled=false;}}
    async function handleImportInventoryCSV() { if (!supabase || typeof Papa === 'undefined') { showSettingsFeedback('import', "Erreur: Client Supabase ou Librairie CSV non initialisé.", 'error'); return; } if (!importCsvFileInput?.files?.length) { showSettingsFeedback('import', "Veuillez sélectionner un fichier CSV à importer.", 'warning'); return; } const importMode = document.querySelector('input[name="import-mode"]:checked')?.value || 'enrich'; console.log("Mode d'importation choisi:", importMode); if (importMode === 'overwrite') { if (!confirm("⚠️ ATTENTION ! ⚠️\n\nVous avez choisi d'ÉCRASER l'inventaire existant.\nToutes les données actuelles du stock seront DÉFINITIVEMENT supprimées avant l'importation.\n\nÊtes-vous absolument sûr de vouloir continuer ?")) { showSettingsFeedback('import', "Importation annulée par l'utilisateur.", 'warning'); resetImportState(); return; } showSettingsFeedback('import', "Confirmation reçue. Lancement du processus d'écrasement...", 'warning'); await delay(1000); } const file = importCsvFileInput.files[0]; showSettingsFeedback('import', `Lecture et analyse du fichier ${file.name}...`, 'info'); if (importInventoryCsvButton) importInventoryCsvButton.disabled = true; if (importCsvFileInput) importCsvFileInput.disabled = true; Papa.parse(file, { header: true, skipEmptyLines: true, dynamicTyping: false, complete: async (results) => { console.log("Résultat du parsing CSV:", results); const rows = results.data; const errors = results.errors; const requiredHeaders = ['ref', 'quantity']; if (errors.length > 0) { showSettingsFeedback('import', `Erreur de lecture du fichier CSV à la ligne ${errors[0].row + 1}: ${errors[0].message}. Vérifiez le format du fichier (encodage UTF-8, délimiteur virgule).`, 'error'); resetImportState(); return; } if (rows.length === 0) { showSettingsFeedback('import', "Le fichier CSV est vide ou ne contient aucune ligne de données valide.", 'warning'); resetImportState(); return; } const headers = results.meta.fields; if (!headers || !requiredHeaders.every(h => headers.map(hdr => hdr.trim().toLowerCase()).includes(h.trim().toLowerCase()))) { // Comparaison insensible casse/espaces
        showSettingsFeedback('import', `Erreur: En-têtes de colonne manquants ou incorrects. Le fichier doit contenir au moins les colonnes 'ref' et 'quantity'.`, 'error'); resetImportState(); return; } showSettingsFeedback('import', `Validation des données de ${rows.length} lignes...`, 'info'); await delay(100); const itemsToUpsert = []; const validationErrors = []; if (categoriesCache.length === 0 && rows.some(r => r.category_name?.trim())) { await getCategories(); } const categoryMap = new Map(categoriesCache.map(cat => [cat.name.toUpperCase(), cat.id])); for (let i = 0; i < rows.length; i++) { const row = rows[i]; const lineNumber = i + 2; const ref = row.ref?.trim().toUpperCase(); if (!ref) { validationErrors.push(`Ligne ${lineNumber}: La colonne 'ref' est manquante ou vide.`); continue; } const quantityStr = row.quantity?.trim(); const quantity = parseInt(quantityStr, 10); if (quantityStr === '' || isNaN(quantity) || quantity < 0) { validationErrors.push(`Ligne ${lineNumber} (Réf: ${ref}): Quantité invalide ('${row.quantity || ''}'). Doit être un nombre entier positif ou zéro.`); continue; } const description = row.description?.trim() || null; const manufacturer = row.manufacturer?.trim() || null; const datasheet = row.datasheet?.trim() || null; if (datasheet) { try { new URL(datasheet); } catch (_) { validationErrors.push(`Ligne ${lineNumber} (Réf: ${ref}): L'URL de la colonne 'datasheet' n'est pas valide.`); continue; } } const drawer = row.drawer?.trim().toUpperCase() || null; const thresholdStr = row.critical_threshold?.trim(); let critical_threshold = null; if (thresholdStr && thresholdStr !== '') { critical_threshold = parseInt(thresholdStr, 10); if (isNaN(critical_threshold) || critical_threshold < 0) { validationErrors.push(`Ligne ${lineNumber} (Réf: ${ref}): Seuil critique invalide ('${row.critical_threshold}'). Doit être un nombre entier positif ou zéro.`); continue; } } let category_id = null; const categoryName = row.category_name?.trim(); if (categoryName) { const foundId = categoryMap.get(categoryName.toUpperCase()); if (foundId) { category_id = foundId; } else { validationErrors.push(`Ligne ${lineNumber} (Réf: ${ref}): La catégorie '${categoryName}' spécifiée n'existe pas. Veuillez la créer dans l'onglet Administration.`); continue; } } let attributes = null; const attributesStr = row.attributes?.trim(); if (attributesStr && attributesStr !== '{}' && attributesStr !== '') { try { attributes = JSON.parse(attributesStr); if (typeof attributes !== 'object' || attributes === null || Array.isArray(attributes)) { throw new Error("La valeur doit être un objet JSON valide (ex: {\"Clé\":\"Valeur\"})."); } } catch (e) { validationErrors.push(`Ligne ${lineNumber} (Réf: ${ref}): La colonne 'attributes' contient du JSON invalide. ${e.message}`); continue; } } itemsToUpsert.push({ ref, description, manufacturer, quantity, datasheet, drawer, category_id, critical_threshold, attributes }); } if (validationErrors.length > 0) { const errorMsg = `Erreurs de validation trouvées dans le fichier CSV:\n- ${validationErrors.slice(0, 15).join('\n- ')}${validationErrors.length > 15 ? '\n- ... et d\'autres erreurs.' : ''}\n\nVeuillez corriger le fichier et réessayer. Aucun changement n'a été effectué.`; showSettingsFeedback('import', errorMsg, 'error'); resetImportState(); return; } if (itemsToUpsert.length > 0) { try { if (importMode === 'overwrite') { showSettingsFeedback('import', `Validation OK. Suppression de l'inventaire existant (${importMode})...`, 'warning'); const { error: deleteError } = await supabase .from('inventory') .delete() .neq('ref', 'dummy_value_that_should_never_exist_in_reality'); if (deleteError) { console.error("Erreur lors de la suppression de l'inventaire (mode overwrite):", deleteError); throw new Error(`Échec de la suppression de l'inventaire existant: ${deleteError.message}. Vérifiez les permissions RLS.`); } console.log("Inventaire existant supprimé (mode overwrite)."); showSettingsFeedback('import', `Inventaire existant supprimé. Importation de ${itemsToUpsert.length} composants...`, 'info'); await delay(500); } else { showSettingsFeedback('import', `Validation OK. Importation/Mise à jour de ${itemsToUpsert.length} composants (Mode ${importMode})...`, 'info'); } const { data: upsertData, error: upsertError } = await supabase .from('inventory') .upsert(itemsToUpsert, { onConflict: 'ref' }) .select('ref'); if (upsertError) { throw new Error(`Erreur base de données lors de l'importation: ${upsertError.message}`); } showSettingsFeedback('import', `Importation terminée avec succès. ${upsertData?.length || 0} composants ont été ajoutés ou mis à jour.`, 'success'); if (inventoryView?.classList.contains('active-view')) { displayInventory(1); } if (adminView?.classList.contains('active-view')) { resetStockForm(); } } catch (err) { console.error("Erreur lors de l'étape d'importation/suppression:", err); showSettingsFeedback('import', `Erreur critique lors de l'importation: ${err.message}`, 'error'); } finally { resetImportState(); } } else { showSettingsFeedback('import', "Aucune ligne valide à importer n'a été trouvée dans le fichier après validation.", 'warning'); resetImportState(); } }, error: (error) => { console.error("Erreur de parsing PapaParse:", error); showSettingsFeedback('import', `Erreur lors de la lecture du fichier CSV: ${error.message}`, 'error'); resetImportState(); } }); }
    function resetImportState() { if(importInventoryCsvButton)importInventoryCsvButton.disabled=false;if(importCsvFileInput){importCsvFileInput.disabled=false;importCsvFileInput.value='';} const enrichRadio = document.getElementById('import-mode-enrich'); if (enrichRadio && enrichRadio instanceof HTMLInputElement) { enrichRadio.checked = true; } }
    function addSettingsEventListeners() { exportInventoryCsvButton?.addEventListener('click',handleExportInventoryCSV);exportLogTxtButton?.addEventListener('click',handleExportLogTXT);importInventoryCsvButton?.addEventListener('click',handleImportInventoryCSV);}

    // --- Initialisation Générale de l'Application ---
    function initializeApp() {
        console.log("Initialisation de StockAV...");
        // Simplifié, vérifier juste quelques IDs clés
        const requiredIds = ['login-area', 'user-info-area', 'main-navigation', 'search-view', 'inventory-view', 'log-view', 'admin-view', 'settings-view', 'inventory-table-body', 'response-output'];
        if (requiredIds.some(id => !document.getElementById(id))) {
            console.error("Un ou plusieurs éléments DOM essentiels sont manquants. Vérifiez index.html.");
            document.body.innerHTML = `<div style="color:red;padding:20px;">Erreur critique: Éléments HTML manquants. L'application ne peut pas démarrer.</div>`;
            return;
        }

        // --- Ajout des Écouteurs d'Événements ---
        searchTabButton.addEventListener('click', () => setActiveView(searchView, searchTabButton));
        inventoryTabButton.addEventListener('click', () => setActiveView(inventoryView, inventoryTabButton));
        logTabButton.addEventListener('click', () => setActiveView(logView, logTabButton));
        adminTabButton.addEventListener('click', () => setActiveView(adminView, adminTabButton));
        settingsTabButton.addEventListener('click', () => setActiveView(settingsView, settingsTabButton));
        loginButton.addEventListener('click', handleLogin);
        loginPasswordInput?.addEventListener('keypress', (e) => { if(e.key === 'Enter') handleLogin(); });
        loginCodeInput?.addEventListener('keypress', (e) => { if(e.key === 'Enter') handleLogin(); });
        logoutButton.addEventListener('click', handleLogout);
        searchButtonChat.addEventListener('click', handleUserInput);
        componentInputChat.addEventListener('keypress', (event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); handleUserInput(); }});
        applyInventoryFilterButton?.addEventListener('click', () => { currentInventoryFilters.category = inventoryCategoryFilter.value; currentInventoryFilters.search = inventorySearchFilter.value; displayInventory(1); });
        inventorySearchFilter?.addEventListener('keypress', (e) => { if (e.key === 'Enter') { applyInventoryFilterButton?.click(); } });
        inventoryPrevPageButton?.addEventListener('click', () => { if (currentInventoryPage > 1) { displayInventory(currentInventoryPage - 1); }});
        inventoryNextPageButton?.addEventListener('click', () => { if (!inventoryNextPageButton?.disabled) { displayInventory(currentInventoryPage + 1); }});
        inventoryTableBody.addEventListener('click', handleInventoryRowClick);
        logPrevPageButton?.addEventListener('click', () => { if (currentLogPage > 1) { displayLog(currentLogPage - 1); }});
        logNextPageButton?.addEventListener('click', () => { if (!logNextPageButton?.disabled) { displayLog(currentLogPage + 1); }});

        addCategoryEventListeners();
        addComponentCategorySelectListener();
        addStockEventListeners();
        addSettingsEventListeners();

        setupAuthListener();
        updateSevenSegmentDisplay(null);
        console.log("StockAV initialisé et prêt.");
    }

    // --- Lancer l'application ---
    initializeApp();

}); // ----- FIN DU FICHIER script.js -----
