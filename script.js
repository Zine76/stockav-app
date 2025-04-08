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
                    // Vérifier si l'utilisateur a changé pendant le refresh (peu probable mais possible)
                    if (session && currentUser && session.user.id !== currentUser.id) {
                        handleUserConnected(session.user, false);
                    } else if (!session && currentUser) { // Si la session a expiré et n'a pas pu être rafraîchie
                        handleUserDisconnected(false);
                    }
                    break;
                case 'USER_UPDATED':
                    console.log("Utilisateur mis à jour:", session?.user);
                    if (session) handleUserConnected(session.user, false); // Met à jour si l'utilisateur est le même mais a des infos différentes
                    break;
                case 'PASSWORD_RECOVERY':
                    console.log("Événement de récupération de mot de passe."); // Pas d'action UI spécifique ici
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

        // Active tous les boutons protégés par défaut pour un utilisateur connecté
        protectedButtons.forEach(btn => {
            // *** MODIFICATION POUR ACCÈS SPÉCIFIQUE ZINE ***
            if (btn.id === 'show-settings-view') {
                // Cas spécial pour l'onglet Paramètres
                if (currentUserCode === 'zine') {
                    btn.style.display = 'inline-block';
                    btn.disabled = false;
                    btn.title = '';
                } else {
                    btn.style.display = 'none'; // Cacher complètement si pas zine
                    btn.disabled = true;
                    btn.title = 'Accès restreint';
                }
            } else {
                // Comportement normal pour les autres onglets protégés (Log, Admin)
                btn.style.display = 'inline-block';
                btn.disabled = false;
                btn.title = '';
            }
        });

        // Charger les catégories si le cache est vide
        if (categoriesCache.length === 0) {
             getCategories();
        }

        // Actions spécifiques si c'est une nouvelle connexion (pas un refresh ou chargement initial)
        if (!isInitialLoad && user.id !== previousUserId) {
            console.log("Nouvelle connexion détectée (utilisateur différent).");
            invalidateCategoriesCache(); // Vide le cache des catégories
            if (searchView?.classList.contains('active-view')) {
                 displayWelcomeMessage(); // Réinitialise le chat si la vue recherche est active
            }
            // Optionnel: forcer le rechargement des données de la vue active si elle n'est pas la recherche
        } else if (isInitialLoad) {
            // Actions au chargement initial de la page avec une session existante
            const activeView = document.querySelector('.view-section.active-view');
             if (activeView?.id === 'inventory-view') { populateInventoryFilters(); displayInventory(); }
             else if (activeView?.id === 'log-view') { displayLog(); }
             else if (activeView?.id === 'admin-view') { loadAdminData(); }
             else if (activeView?.id === 'settings-view') {
                 // *** MODIFICATION POUR ACCÈS SPÉCIFIQUE ZINE ***
                 if (currentUserCode === 'zine') {
                     loadSettingsData();
                 } else {
                    // Si l'URL pointait vers settings mais l'user n'est pas zine, rediriger
                    console.warn("Accès initial à Settings refusé pour", currentUserCode);
                    setActiveView(searchView, searchTabButton);
                 }
             }
             else if (searchView?.classList.contains('active-view') && chatHistory.length === 0) {
                 displayWelcomeMessage();
             }
             else if (!activeView) { // Si aucune vue n'est active par défaut (ne devrait pas arriver)
                 setActiveView(searchView, searchTabButton);
             }
        }
        updateSevenSegmentDisplay(); // Mettre à jour 7-segments avec la valeur mémorisée (si elle existe)
    }
    function handleUserDisconnected(isInitialLoad) {
        console.log("Utilisateur déconnecté ou session absente.");
        currentUser = null;
        currentUserCode = null;
        document.body.classList.remove('user-logged-in');
        if(userInfoArea) userInfoArea.style.display = 'none';
        if(loginArea) loginArea.style.display = 'block';

        // Cache/désactive tous les boutons protégés lors de la déconnexion
        protectedButtons.forEach(btn => {
            btn.style.display = 'none';
            btn.disabled = true;
            btn.title = 'Connexion requise';
        });

        hideQuantityModal(); // Ferme la modale si elle était ouverte
        lastDisplayedDrawer = null; // Oublie le dernier tiroir
        updateSevenSegmentDisplay(null); // Éteint l'afficheur

        if (!isInitialLoad) { // Si ce n'est pas le chargement initial (vraie déconnexion)
            invalidateCategoriesCache(); // Vide cache catégories
            clearProtectedViewData(); // Vide les données des vues protégées
            if (searchView?.classList.contains('active-view') && chatHistory.length > 0) {
                displayWelcomeMessage(); // Réinitialise chat si besoin
            }
        }

        // Vérifie si une vue protégée était active et redirige vers la recherche si oui
        const activeView = document.querySelector('.view-section.active-view');
        if (activeView && (activeView.id === 'log-view' || activeView.id === 'admin-view' || activeView.id === 'settings-view')) {
            console.log("Redirection vers vue recherche car déconnecté d'une vue protégée.");
            setActiveView(searchView, searchTabButton);
        } else if (isInitialLoad && !activeView) { // Au chargement initial sans session, active la vue recherche
             setActiveView(searchView, searchTabButton);
        }
    }
    function clearProtectedViewData() {
        // Vide les tableaux
        if(inventoryTableBody) inventoryTableBody.innerHTML = '';
        if(logTableBody) logTableBody.innerHTML = '';
        // Réinitialise pagination inventaire
        if(inventoryPageInfo) inventoryPageInfo.textContent = 'Page - / -';
        if(inventoryPrevPageButton) inventoryPrevPageButton.disabled = true;
        if(inventoryNextPageButton) inventoryNextPageButton.disabled = true;
        // Réinitialise pagination log
        if(logPageInfo) logPageInfo.textContent = 'Page - / -';
        if(logPrevPageButton) logPrevPageButton.disabled = true;
        if(logNextPageButton) logNextPageButton.disabled = true;
        // Vide liste catégories et formulaires admin/settings
        if (categoryList) categoryList.innerHTML = '';
        resetCategoryForm();
        resetStockForm();
        if (componentInfoDiv) componentInfoDiv.style.display = 'none';
        if (adminFeedbackDiv) { adminFeedbackDiv.style.display = 'none'; adminFeedbackDiv.textContent = '';}
        if(exportFeedbackDiv) { exportFeedbackDiv.style.display = 'none'; exportFeedbackDiv.textContent = '';}
        if(importFeedbackDiv) { importFeedbackDiv.style.display = 'none'; importFeedbackDiv.textContent = '';}
        if(importCsvFileInput) importCsvFileInput.value = '';
        console.log("Données des vues protégées effacées de l'UI.");
    }

    // --- Navigation ---
    function setActiveView(viewToShow, buttonToActivate){
        if (!viewToShow) { // Sécurité si vue invalide
            viewToShow = searchView;
            buttonToActivate = searchTabButton;
            console.warn("setActiveView: Vue invalide fournie, retour à la vue Recherche.");
        }
        // Ne rien faire si la vue est déjà active
        if (viewToShow.classList.contains('active-view')) {
            console.log(`Vue ${viewToShow.id} déjà active.`);
            return;
        }

        // Vérifier les permissions d'accès
        const isProtected = viewToShow.id === 'log-view' || viewToShow.id === 'admin-view' || viewToShow.id === 'settings-view';
        let canAccess = true;

        if (isProtected && !currentUser) {
            canAccess = false;
            console.warn(`Accès refusé (non connecté): ${viewToShow.id}`);
            if (loginError) {
                loginError.textContent="Connexion requise pour accéder à cette section.";
                loginError.style.color = 'var(--error-color)';
                loginError.style.display='block';
            }
            loginCodeInput?.focus();
        } else if (viewToShow.id === 'settings-view' && currentUserCode !== 'zine') {
            // *** MODIFICATION POUR ACCÈS SPÉCIFIQUE ZINE ***
            canAccess = false;
            console.warn(`Accès refusé (pas 'zine'): ${viewToShow.id}`);
            // Optionnel: afficher un message d'erreur plus spécifique si nécessaire
            // showAdminFeedback("Accès à cette section restreint.", "warning"); // Ou autre méthode
            // Ne pas afficher d'erreur de login ici, juste bloquer la navigation
        }

        if (!canAccess) {
            return; // Bloque la navigation si pas autorisé
        }

        // Masquer toutes les sections et désactiver tous les boutons de nav
        viewSections.forEach(section => { section.style.display = 'none'; section.classList.remove('active-view'); });
        document.querySelectorAll('.nav-button').forEach(button => { button.classList.remove('active'); });

        // Afficher la section choisie et activer le bouton correspondant
        viewToShow.style.display = 'block';
        viewToShow.classList.add('active-view');
        if (buttonToActivate) {
            buttonToActivate.classList.add('active');
        } else {
            // Retrouver le bouton par l'ID de la vue si non fourni (sécurité)
            const realButtonId = `show-${viewToShow.id}`;
            const matchingButton = document.getElementById(realButtonId);
            if (matchingButton) matchingButton.classList.add('active');
        }
        console.log(`Activation vue: ${viewToShow.id}`);

        // Charger les données spécifiques à la vue si nécessaire
        if (viewToShow === searchView && chatHistory.length === 0) { displayWelcomeMessage(); }
        else if (viewToShow === inventoryView) { populateInventoryFilters(); displayInventory(); }
        else if (viewToShow === logView && currentUser) { displayLog(); } // Vérifie currentUser par sécurité
        else if (viewToShow === adminView && currentUser) { loadAdminData(); }
        else if (viewToShow === settingsView && currentUser && currentUserCode === 'zine') { loadSettingsData(); } // Re-vérifie zine
    }

    // --- LOGIQUE INVENTAIRE ---
    async function populateInventoryFilters() {
        if (!inventoryCategoryFilter) return;
        const currentVal = inventoryCategoryFilter.value; // Mémorise la valeur actuelle
        inventoryCategoryFilter.innerHTML = '<option value="all">Toutes</option>'; // Option par défaut
        try {
            const categories = await getCategories(); // Récupère via cache ou DB
            if (categories && categories.length > 0) {
                categories.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat.id;
                    option.textContent = cat.name;
                    inventoryCategoryFilter.appendChild(option);
                });
                // Réappliquer la valeur sélectionnée si elle existe toujours
                if (inventoryCategoryFilter.querySelector(`option[value="${currentVal}"]`)) {
                    inventoryCategoryFilter.value = currentVal;
                } else {
                    inventoryCategoryFilter.value = 'all'; // Sinon retour à "Toutes"
                }
            } else {
                console.warn("Aucune catégorie trouvée pour remplir les filtres.");
            }
        } catch (error) {
            console.error("Erreur lors du remplissage des filtres de catégorie:", error);
        }
    }
    async function displayInventory(page = currentInventoryPage) {
        currentInventoryPage = page;
        if (!inventoryTableBody || !supabase) { console.warn("displayInventory: Prérequis manquants (table body ou supabase)"); return; }

        // Affichage indicateur chargement
        inventoryTableBody.innerHTML = '<tr class="loading-row"><td colspan="7" style="text-align:center; padding: 20px; color: var(--text-muted);"><i>Chargement de l\'inventaire...</i></td></tr>';
        if(inventoryNoResults) inventoryNoResults.style.display = 'none';
        if(inventoryPrevPageButton) inventoryPrevPageButton.disabled = true;
        if(inventoryNextPageButton) inventoryNextPageButton.disabled = true;
        if(inventoryPageInfo) inventoryPageInfo.textContent = 'Chargement...';

        const itemsPerPage = ITEMS_PER_PAGE;
        const startIndex = (currentInventoryPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage - 1;

        try {
            let query = supabase
                .from('inventory')
                .select('*, categories ( name ), critical_threshold', { count: 'exact' }); // Récupère count

            // Appliquer les filtres
            const searchValue = inventorySearchFilter?.value.trim() || '';
            const categoryValue = inventoryCategoryFilter?.value || 'all';

            if (searchValue) {
                const searchColumns = ['ref', 'description', 'manufacturer'];
                if (currentUser) { // Inclure tiroir dans recherche si connecté
                    searchColumns.push('drawer');
                }
                // Recherche ILIKE sur plusieurs colonnes
                query = query.or(searchColumns.map(col => `${col}.ilike.%${searchValue}%`).join(','));
            }
            if (categoryValue !== 'all') {
                query = query.eq('category_id', categoryValue);
            }

            // Appliquer tri et pagination
            query = query.order('ref', { ascending: true }).range(startIndex, endIndex);

            const { data, error, count } = await query;

            inventoryTableBody.innerHTML = ''; // Vide le tableau avant de remplir
            if (error) {
                throw new Error(`Erreur Supabase lors de la lecture de l'inventaire: ${error.message}`);
            }

            const totalItems = count || 0;
            const totalPages = Math.ceil(totalItems / itemsPerPage);

            if (totalItems === 0) { // Aucun résultat
                if(inventoryNoResults) {
                    inventoryNoResults.textContent = `Aucun composant trouvé${searchValue || categoryValue !== 'all' ? ' pour ces filtres' : ''}.`;
                    inventoryNoResults.style.display = 'block';
                }
                if(inventoryPageInfo) inventoryPageInfo.textContent = 'Page 0 / 0';
            } else { // Afficher les résultats
                if(inventoryNoResults) inventoryNoResults.style.display = 'none';
                data.forEach(item => {
                    const row = inventoryTableBody.insertRow();
                    row.dataset.ref = item.ref; // Stocke la réf pour le clic
                    row.classList.add('inventory-item-row'); // Pour le listener de clic

                    // Cellule Référence avec indicateur
                    const refCell = row.insertCell();
                    const status = getStockStatus(item.quantity, item.critical_threshold);
                    const indicatorSpan = document.createElement('span');
                    indicatorSpan.classList.add('stock-indicator', `level-${status}`);
                    indicatorSpan.title = `Stock: ${status.toUpperCase()} (Qté: ${item.quantity}, Seuil: ${item.critical_threshold ?? 'N/A'})`;
                    refCell.appendChild(indicatorSpan);
                    refCell.appendChild(document.createTextNode(item.ref));

                    // Autres cellules
                    row.insertCell().textContent = item.description || '-';
                    row.insertCell().textContent = item.categories?.name ?? 'N/A'; // Nom catégorie
                    row.insertCell().textContent = item.drawer || '-';
                    row.insertCell().textContent = item.manufacturer || '-';

                    // Cellule Quantité
                    const qtyCell = row.insertCell();
                    qtyCell.textContent = item.quantity;
                    qtyCell.style.textAlign = 'center';

                    // Cellule Datasheet (lien cliquable si URL valide)
                    const dsCell = row.insertCell();
                    if (item.datasheet) {
                        try {
                            new URL(item.datasheet); // Vérifie si c'est une URL valide
                            const link = document.createElement('a');
                            link.href = item.datasheet;
                            link.textContent = 'Voir';
                            link.target = '_blank'; // Ouvre dans un nouvel onglet
                            link.rel = 'noopener noreferrer'; // Sécurité
                            dsCell.appendChild(link);
                        } catch (_) { // Si l'URL n'est pas valide
                            dsCell.textContent = '-';
                        }
                    } else {
                        dsCell.textContent = '-';
                    }
                    dsCell.style.textAlign = 'center';
                });

                // Mettre à jour la pagination
                 currentInventoryPage = Math.max(1, Math.min(currentInventoryPage, totalPages || 1));
                 if(inventoryPageInfo) inventoryPageInfo.textContent = `Page ${currentInventoryPage} / ${totalPages || 1}`;
                 if(inventoryPrevPageButton) inventoryPrevPageButton.disabled = currentInventoryPage === 1;
                 if(inventoryNextPageButton) inventoryNextPageButton.disabled = currentInventoryPage >= totalPages;
            }
        } catch (err) {
            console.error("Erreur lors de l'affichage de l'inventaire:", err);
            inventoryTableBody.innerHTML = `<tr><td colspan="7" class="error-message" style="color: var(--error-color); text-align: center;">Erreur lors du chargement: ${err.message}</td></tr>`;
            if(inventoryPageInfo) inventoryPageInfo.textContent = 'Erreur';
        }
    }

    // --- LOGIQUE HISTORIQUE ---
    async function displayLog(page = currentLogPage) {
        // *** MODIFICATION POUR PURGE LOG ***
        // Ajout d'une colonne Action et d'un bouton Purge (si zine)
        const logActionsHeader = document.querySelector('#log-table thead th:last-child'); // Sélectionne le dernier header actuel
        const logTable = document.getElementById('log-table');
        const purgeButtonContainerId = 'purge-log-container';
        let purgeButtonContainer = document.getElementById(purgeButtonContainerId);

        if (currentUserCode === 'zine') {
            // Ajoute l'en-tête "Actions" s'il n'existe pas
            if (!logTable.querySelector('th.log-actions-header')) {
                const actionTh = document.createElement('th');
                actionTh.textContent = 'Actions';
                actionTh.classList.add('log-actions-header');
                logTable.querySelector('thead tr').appendChild(actionTh);
            }
            // Ajoute le bouton "Purger Tout" s'il n'existe pas
            if (!purgeButtonContainer && logTable.parentElement) {
                purgeButtonContainer = document.createElement('div');
                purgeButtonContainer.id = purgeButtonContainerId;
                purgeButtonContainer.style.textAlign = 'right';
                purgeButtonContainer.style.marginTop = '15px';
                purgeButtonContainer.innerHTML = `<button id="purge-all-logs-button" class="action-button danger" title="Supprimer définitivement TOUT l'historique">Purger Tout l'Historique</button>`;
                // Insère le bouton après le tableau des logs
                logTable.parentElement.insertAdjacentElement('afterend', purgeButtonContainer);
                // Ajoute l'écouteur pour le nouveau bouton
                document.getElementById('purge-all-logs-button')?.addEventListener('click', handleDeleteAllLogs);
            }
             if (purgeButtonContainer) purgeButtonContainer.style.display = 'block'; // Assure visibilité
        } else {
            // Cache la colonne Actions et le bouton Purge si l'utilisateur n'est pas zine
            logTable.querySelectorAll('.log-actions-header').forEach(th => th.remove());
            if (purgeButtonContainer) purgeButtonContainer.style.display = 'none';
        }
        // *** FIN MODIFICATION PURGE LOG (structure UI) ***

        if (!currentUser) { console.warn("displayLog: Utilisateur non connecté."); return; }
        currentLogPage = page;
        if (!logTableBody || !supabase) { console.warn("displayLog: Prérequis manquants (logTableBody ou supabase)"); return; }

        logTableBody.innerHTML = `<tr class="loading-row"><td colspan="${currentUserCode === 'zine' ? 7 : 6}" style="text-align:center; color: var(--text-muted);"><i>Chargement de l\'historique...</i></td></tr>`; // Ajuste colspan
        if(logNoResults) logNoResults.style.display = 'none';
        if(logPrevPageButton) logPrevPageButton.disabled = true;
        if(logNextPageButton) logNextPageButton.disabled = true;
        if(logPageInfo) logPageInfo.textContent = 'Chargement...';

        const itemsPerPage = ITEMS_PER_PAGE;
        const startIndex = (currentLogPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage - 1;

        try {
            // *** MODIFICATION : Ajoute ID dans la sélection pour suppression ***
            const { data, error, count } = await supabase
                .from('logs')
                .select('id, created_at, user_code, component_ref, quantity_change, quantity_after', { count: 'exact' }) // Ajout de 'id'
                .order('created_at', { ascending: false })
                .range(startIndex, endIndex);

            logTableBody.innerHTML = '';
            if (error) {
                throw new Error(`Erreur Supabase lors de la lecture des logs: ${error.message}`);
            }

            const totalItems = count || 0;
            const totalPages = Math.ceil(totalItems / itemsPerPage);

            if (totalItems === 0) {
                if(logNoResults) {
                    logNoResults.textContent = "L'historique des mouvements est vide.";
                    logNoResults.style.display = 'block';
                }
                 if (purgeButtonContainer) purgeButtonContainer.style.display = 'none'; // Cache purge si vide
                if(logPageInfo) logPageInfo.textContent = 'Page 0 / 0';
            } else {
                if(logNoResults) logNoResults.style.display = 'none';
                if (currentUserCode === 'zine' && purgeButtonContainer) purgeButtonContainer.style.display = 'block'; // Affiche purge si logs et zine

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

                    // *** MODIFICATION POUR PURGE LOG (bouton suppression ligne) ***
                    if (currentUserCode === 'zine') {
                        const actionTd = row.insertCell();
                        actionTd.style.textAlign = 'center';
                        const deleteButton = document.createElement('button');
                        deleteButton.textContent = 'Suppr.';
                        deleteButton.classList.add('delete-log-button', 'danger-small'); // Classe pour style/listener
                        deleteButton.title = `Supprimer cette entrée (ID: ${entry.id})`;
                        deleteButton.dataset.logId = entry.id; // Stocke l'ID pour le retrouver
                        actionTd.appendChild(deleteButton);
                    }
                    // *** FIN MODIFICATION PURGE LOG (bouton) ***
                });

                 currentLogPage = Math.max(1, Math.min(currentLogPage, totalPages || 1));
                 if(logPageInfo) logPageInfo.textContent = `Page ${currentLogPage} / ${totalPages || 1}`;
                 if(logPrevPageButton) logPrevPageButton.disabled = currentLogPage === 1;
                 if(logNextPageButton) logNextPageButton.disabled = currentLogPage >= totalPages;
            }
        } catch (err) {
            console.error("Erreur lors de l'affichage de l'historique:", err);
            logTableBody.innerHTML = `<tr><td colspan="${currentUserCode === 'zine' ? 7 : 6}" class="error-message" style="color: var(--error-color); text-align: center;">Erreur lors du chargement: ${err.message}</td></tr>`; // Ajuste colspan
            if(logPageInfo) logPageInfo.textContent = 'Erreur';
             if (purgeButtonContainer) purgeButtonContainer.style.display = 'none'; // Cache purge en cas d'erreur
        }
    }
    function formatLogTimestamp(date) {
        try {
            // Format FR plus standard
            return date.toLocaleString('fr-FR', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
        } catch(e) { // Fallback si toLocaleString échoue
            return date.toISOString();
        }
    }
    async function addLogEntry(itemRef, change, newQuantity) {
        if (!currentUser || !currentUserCode || !supabase) { console.warn("Enregistrement log annulé: non connecté ou Supabase indispo."); return; }
        const logData = {
            user_id: currentUser.id,
            user_code: currentUserCode.toUpperCase(), // Stocke le code user pour affichage facile
            component_ref: itemRef,
            quantity_change: change,
            quantity_after: newQuantity
        };
        console.log("Tentative écriture log Supabase:", logData);
        try {
            const { error: logError } = await supabase.from('logs').insert(logData);
            if (logError) {
                console.error("Erreur écriture log Supabase:", logError);
                // Optionnel: informer l'utilisateur d'une erreur de log ?
            } else {
                console.log("Log enregistré avec succès.");
                // Rafraîchir la vue log si elle est active et qu'on est sur la première page
                if (logView?.classList.contains('active-view') && currentLogPage === 1) {
                    displayLog(1);
                }
            }
        } catch (err) {
            // Erreur JS lors de la tentative d'insertion
            console.error("Erreur JS lors de l'enregistrement du log:", err);
        }
    }
    // *** NOUVELLES FONCTIONS POUR PURGE LOG ***
    async function handleDeleteSingleLog(event) {
        const targetButton = event.target.closest('button.delete-log-button');
        if (!targetButton) return; // Pas un clic sur le bouton delete

        const logId = targetButton.dataset.logId;
        if (!logId) {
            console.error("ID du log manquant sur le bouton de suppression.");
            alert("Erreur: Impossible d'identifier l'entrée à supprimer.");
            return;
        }

        // Double vérification de sécurité (même si le bouton n'est visible que pour zine)
        if (currentUserCode !== 'zine') {
            alert("Action non autorisée.");
            return;
        }

        // Confirmation
        if (!confirm(`Êtes-vous sûr de vouloir supprimer définitivement l'entrée de log ID: ${logId} ?`)) {
            return;
        }

        targetButton.disabled = true; // Désactive le bouton pendant la suppression
        targetButton.textContent = '...';

        try {
            const { error } = await supabase
                .from('logs')
                .delete()
                .eq('id', logId);

            if (error) {
                throw new Error(`Erreur Supabase lors de la suppression du log ${logId}: ${error.message}`);
            }

            console.log(`Log ID ${logId} supprimé avec succès.`);
            // Rafraîchir la vue des logs pour refléter la suppression
            displayLog(currentLogPage); // Reste sur la même page si possible

        } catch (err) {
            console.error("Erreur lors de la suppression du log:", err);
            alert(`Erreur lors de la suppression: ${err.message}`);
            targetButton.disabled = false; // Réactive le bouton en cas d'erreur
            targetButton.textContent = 'Suppr.';
        }
    }
    async function handleDeleteAllLogs() {
         // Double vérification de sécurité
        if (currentUserCode !== 'zine') {
            alert("Action non autorisée.");
            return;
        }

        // Confirmation TRÈS explicite
        if (!confirm("ATTENTION !\n\nÊtes-vous absolument sûr de vouloir supprimer DÉFINITIVEMENT TOUT l'historique des mouvements ?\n\nCette action est IRRÉVERSIBLE.")) {
            return;
        }
         // Deuxième confirmation pour être sûr
         if (!confirm("Seconde confirmation : Vraiment tout effacer ?")) {
             return;
         }

        const purgeButton = document.getElementById('purge-all-logs-button');
        if (purgeButton) {
            purgeButton.disabled = true;
            purgeButton.textContent = 'Suppression...';
        }
        showAdminFeedback("Suppression de tout l'historique en cours...", 'warning'); // Utilise le feedback admin existant

        try {
            // Pour supprimer toutes les lignes, on utilise une condition qui est toujours vraie
            // ou une méthode spécifique si l'API le permet. Ici, on filtre sur non-null id (toujours vrai)
            const { error } = await supabase
                .from('logs')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Condition pour tout supprimer

            if (error) {
                throw new Error(`Erreur Supabase lors de la purge des logs: ${error.message}`);
            }

            console.log("Tous les logs ont été purgés avec succès.");
            showAdminFeedback("Tout l'historique a été supprimé avec succès.", 'success');
            // Rafraîchir la vue des logs (qui devrait être vide maintenant)
            displayLog(1);

        } catch (err) {
            console.error("Erreur lors de la purge des logs:", err);
            showAdminFeedback(`Erreur lors de la purge: ${err.message}`, 'error');
            if (purgeButton) {
                purgeButton.disabled = false;
                purgeButton.textContent = "Purger Tout l'Historique";
            }
        }
    }
    // *** FIN NOUVELLES FONCTIONS POUR PURGE LOG ***

    // --- VUE ADMIN ---
    async function getCategories() {
        if (categoriesCache.length > 0) {
            //console.log("Using cached categories.");
            return categoriesCache;
        }
        if (!supabase) { console.warn("getCategories: Supabase non disponible."); return []; }
        console.log("Fetching categories from Supabase...");
        try {
            const { data, error } = await supabase.from('categories').select('id, name, attributes').order('name', { ascending: true });
            if (error) { throw new Error(`Erreur DB lecture catégories: ${error.message}`); }
            categoriesCache = data || [];
            console.log(`Categories fetched/cached: ${categoriesCache.length} items.`);
            return categoriesCache;
        } catch (err) {
            console.error("Erreur lecture catégories:", err);
            if (adminView?.classList.contains('active-view')) { showAdminFeedback(`Erreur chargement catégories: ${err.message}`, 'error'); }
            return []; // Retourne tableau vide en cas d'erreur
        }
    }
    function invalidateCategoriesCache() { categoriesCache = []; console.log("Cache catégories invalidé."); }
    async function loadAdminData() {
        if (!currentUser) return;
        const catManager = document.getElementById('category-manager');
        const stockManager = document.getElementById('stock-manager');
        if (catManager) catManager.style.display = 'block'; // Assure visibilité sections
        if (stockManager) stockManager.style.display = 'block';
        if (adminFeedbackDiv) { adminFeedbackDiv.style.display = 'none'; adminFeedbackDiv.textContent = ''; } // Cache feedback
        resetStockForm(); // Réinitialise formulaire stock
        try {
            await loadCategoriesAdmin(); // Charge/affiche les catégories
        }
        catch (error) {
            console.error("Erreur chargement données admin:", error);
            showAdminFeedback(`Erreur chargement initial Admin: ${error.message}`, 'error');
        }
    }
    async function loadCategoriesAdmin() {
        if (categoryList) categoryList.innerHTML = '<li><i>Chargement catégories...</i></li>';
        if (componentCategorySelectAdmin) componentCategorySelectAdmin.innerHTML = '<option value="">Chargement...</option>';

        try {
            const categories = await getCategories(); // Utilise le cache si possible

            if (categoryList) categoryList.innerHTML = ''; // Vide la liste
            if (componentCategorySelectAdmin) componentCategorySelectAdmin.innerHTML = '<option value="">-- Sélectionner catégorie --</option>'; // Vide le select

            if (categories && categories.length > 0) {
                categories.forEach(cat => {
                    // Ajoute à la liste pour gestion
                    if (categoryList) {
                        const li = document.createElement('li');
                        li.dataset.categoryId = cat.id; // Stocke l'ID
                        li.innerHTML = `<span>${cat.name}</span>
                                        <span class="category-actions">
                                            <button class="edit-cat" title="Modifier ${cat.name}">Modifier</button>
                                            <button class="delete-cat danger-small" title="Supprimer ${cat.name}">Suppr.</button>
                                        </span>`;
                        categoryList.appendChild(li);
                    }
                    // Ajoute au sélecteur du formulaire stock
                    if (componentCategorySelectAdmin) {
                        const option = document.createElement('option');
                        option.value = cat.id;
                        option.textContent = cat.name;
                        option.dataset.attributes = cat.attributes || ''; // Stocke les attributs pour le listener 'change'
                        componentCategorySelectAdmin.appendChild(option);
                    }
                });
            } else {
                if (categoryList) categoryList.innerHTML = '<li>Aucune catégorie définie.</li>';
                if (componentCategorySelectAdmin) componentCategorySelectAdmin.innerHTML = '<option value="">Aucune catégorie</option>';
            }
        } catch (error) {
             console.error("Erreur dans loadCategoriesAdmin:", error);
             if (categoryList) categoryList.innerHTML = '<li>Erreur chargement catégories.</li>';
             if (componentCategorySelectAdmin) componentCategorySelectAdmin.innerHTML = '<option value="">Erreur</option>';
        }
    }
    function addCategoryEventListeners() {
        // Écouteur délégué sur la liste pour les boutons Edit/Delete
        categoryList?.addEventListener('click', async (event) => {
            const targetButton = event.target.closest('button'); // Trouve le bouton cliqué
            if (!targetButton) return; // Clic hors d'un bouton

            const listItem = targetButton.closest('li[data-category-id]'); // Trouve l'item de liste parent
            if (!listItem) return;

            const categoryId = listItem.dataset.categoryId;
            if (!categoryId || !supabase) return;

            // Retrouve la catégorie dans le cache (plus rapide que refaire un appel DB)
            const category = categoriesCache.find(c => c.id === categoryId);
            if (!category) {
                console.error(`Catégorie ID ${categoryId} non trouvée dans le cache.`);
                showAdminFeedback('Erreur interne: Catégorie non trouvée.', 'error');
                return;
            }

            // Action: Modifier
            if (targetButton.classList.contains('edit-cat')) {
                if(categoryIdEditInput) categoryIdEditInput.value = category.id;
                if(categoryNameInput) categoryNameInput.value = category.name;
                if(categoryAttributesInput) categoryAttributesInput.value = category.attributes || '';
                if(categoryFormTitle) categoryFormTitle.textContent = `Modifier catégorie: ${category.name}`;
                if(cancelEditButton) cancelEditButton.style.display = 'inline-block'; // Affiche Annuler
                categoryNameInput?.focus(); // Met le focus sur le nom
                showAdminFeedback(`Modification de la catégorie "${category.name}" en cours...`, 'info');
            }
            // Action: Supprimer
            else if (targetButton.classList.contains('delete-cat')) {
                if (!confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${category.name}" ?\nCeci ne supprimera pas les composants associés mais leur catégorie sera retirée.`)) {
                    return;
                }

                showAdminFeedback(`Suppression de la catégorie "${category.name}"...`, "info");
                targetButton.disabled = true; // Désactive bouton pendant suppression
                targetButton.closest('.category-actions')?.querySelectorAll('button').forEach(b => b.disabled = true);

                try {
                    const { error } = await supabase.from('categories').delete().eq('id', categoryId);

                    // Gérer l'erreur de clé étrangère (si Supabase est configuré pour empêcher la suppression)
                    // Le code '23503' correspond à 'foreign_key_violation' en PostgreSQL
                    if (error && error.code === '23503') {
                         throw new Error(`Impossible de supprimer: La catégorie "${category.name}" est encore utilisée par des composants.`);
                    } else if (error) {
                        throw new Error(`Erreur Base de Données: ${error.message}`);
                    }

                    showAdminFeedback(`Catégorie "${category.name}" supprimée avec succès.`, 'success');
                    invalidateCategoriesCache(); // Force rechargement au prochain appel
                    await loadCategoriesAdmin(); // Recharge la liste et le select
                    if (categoryIdEditInput?.value === categoryId) { // Si on éditait cette catégorie, reset le form
                        resetCategoryForm();
                    }
                    await populateInventoryFilters(); // Met à jour aussi le filtre inventaire

                } catch (err) {
                    console.error("Erreur suppression catégorie:", err);
                    showAdminFeedback(`Erreur de suppression: ${err.message}`, 'error');
                    // Réactiver les boutons si l'élément existe toujours
                    const stillExistingLi = categoryList.querySelector(`li[data-category-id="${categoryId}"]`);
                    if (stillExistingLi) {
                        stillExistingLi.querySelectorAll('button').forEach(b => b.disabled = false);
                    }
                }
            }
        });

        // Bouton Annuler du formulaire catégorie
        cancelEditButton?.addEventListener('click', resetCategoryForm);

        // Soumission du formulaire catégorie (Ajout ou Modification)
        categoryForm?.addEventListener('submit', async (event) => {
            event.preventDefault(); // Empêche soumission HTML standard
            if (!supabase) return;

            const catName = categoryNameInput?.value.trim();
            const catAttributes = categoryAttributesInput?.value.trim();
            const editingId = categoryIdEditInput?.value; // ID si on est en mode édition

            if (!catName) { // Validation simple du nom
                showAdminFeedback("Le nom de la catégorie est obligatoire.", 'error');
                categoryNameInput?.focus();
                return;
            }

            // Préparation des données pour Supabase
            const categoryData = {
                name: catName,
                attributes: catAttributes === '' ? null : catAttributes // Attributs null si vide
            };

            showAdminFeedback("Enregistrement de la catégorie...", "info");
            const saveBtn = document.getElementById('save-category-button');
            if(saveBtn) saveBtn.disabled = true; // Désactive boutons pendant opération
            if(cancelEditButton) cancelEditButton.disabled = true;

            try {
                let response;
                if (editingId) { // --- Mode Modification ---
                    response = await supabase
                        .from('categories')
                        .update(categoryData)
                        .eq('id', editingId)
                        .select() // Retourne la ligne modifiée
                        .single(); // S'attend à une seule ligne modifiée
                } else { // --- Mode Ajout ---
                    response = await supabase
                        .from('categories')
                        .insert(categoryData)
                        .select() // Retourne la nouvelle ligne
                        .single(); // S'attend à une seule ligne insérée
                }

                const { data, error } = response;

                if (error) {
                    // Gérer l'erreur de nom dupliqué (contrainte unique)
                    // Le code '23505' correspond à 'unique_violation'
                    if (error.code === '23505') {
                        showAdminFeedback(`Erreur: Le nom de catégorie "${catName}" existe déjà.`, 'error');
                        categoryNameInput?.focus();
                    } else { // Autre erreur DB
                        throw new Error(`Erreur Base de Données: ${error.message}`);
                    }
                } else { // Succès
                    showAdminFeedback(`Catégorie "${data.name}" ${editingId ? 'modifiée' : 'ajoutée'} avec succès.`, 'success');
                    invalidateCategoriesCache(); // Invalide cache
                    await loadCategoriesAdmin(); // Recharge liste et select
                    resetCategoryForm(); // Réinitialise le formulaire
                    await populateInventoryFilters(); // Met à jour filtre inventaire
                }
            } catch (err) {
                console.error("Erreur enregistrement catégorie:", err);
                showAdminFeedback(`Erreur: ${err.message}`, 'error');
            } finally {
                // Réactive les boutons dans tous les cas
                if(saveBtn) saveBtn.disabled = false;
                if(cancelEditButton && categoryIdEditInput?.value) { // Réactive Annuler seulement si on était en édition
                   cancelEditButton.disabled = false;
                } else if (cancelEditButton) {
                    cancelEditButton.style.display = 'none'; // Le cache si on était en ajout
                }
            }
        });
    }
    function resetCategoryForm(){
        if(categoryForm) categoryForm.reset(); // Vide les champs
        if(categoryIdEditInput) categoryIdEditInput.value = ''; // Vide l'ID caché (passage en mode Ajout)
        if(categoryFormTitle) categoryFormTitle.textContent = "Ajouter une Catégorie"; // Rétablit le titre
        if(cancelEditButton) cancelEditButton.style.display = 'none'; // Cache Annuler
        if (adminFeedbackDiv) adminFeedbackDiv.style.display = 'none'; // Cache feedback
    }
    function addComponentCategorySelectListener() {
        componentCategorySelectAdmin?.addEventListener('change', () => {
            if (!specificAttributesDiv) return;
            specificAttributesDiv.innerHTML = ''; // Vide les anciens champs
            specificAttributesDiv.style.display = 'none'; // Cache par défaut

            const selectedOption = componentCategorySelectAdmin.options[componentCategorySelectAdmin.selectedIndex];
            if (!selectedOption || !selectedOption.value) return; // Si "-- Sélectionner --" est choisi

            const attributesString = selectedOption.dataset.attributes; // Récupère la chaîne d'attributs
            const categoryName = selectedOption.textContent;

            if (attributesString && attributesString.trim() !== "") {
                specificAttributesDiv.style.display = 'block'; // Affiche la zone
                // Sépare les attributs, nettoie et filtre les vides
                const attributes = attributesString.split(',')
                                      .map(attr => attr.trim())
                                      .filter(attr => attr);

                if (attributes.length > 0) {
                    // Ajoute un titre à la section
                    const titleElement = document.createElement('h4');
                    titleElement.textContent = `Attributs Spécifiques (${categoryName})`;
                    specificAttributesDiv.appendChild(titleElement);

                    // Crée un input pour chaque attribut
                    attributes.forEach(attr => {
                        const formGroup = document.createElement('div');
                        formGroup.classList.add('form-group');
                        // Crée un ID unique simple pour le label/input
                        const inputId = `attr-${attr.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
                        const label = document.createElement('label');
                        label.setAttribute('for', inputId);
                        label.textContent = `${attr}:`; // Nom de l'attribut comme label
                        const input = document.createElement('input');
                        input.setAttribute('type', 'text');
                        input.setAttribute('id', inputId);
                        // Utilise un nommage qui peut être parsé côté serveur si besoin, mais ici on le gère en JS
                        input.setAttribute('name', `attributes[${attr}]`);
                        input.setAttribute('placeholder', `Valeur pour ${attr}`);
                        // Stocke le nom de l'attribut pour le retrouver facilement à la sauvegarde
                        input.dataset.attributeName = attr;
                        formGroup.appendChild(label);
                        formGroup.appendChild(input);
                        specificAttributesDiv.appendChild(formGroup);
                    });
                }
            }
        });
    }
    function showAdminFeedback(message, type = 'info'){
        if (adminFeedbackDiv) {
            adminFeedbackDiv.textContent = message;
            // Applique la classe CSS correspondante (success, error, warning, info)
            adminFeedbackDiv.className = `feedback-area ${type}`;
            // Assure la visibilité
            adminFeedbackDiv.style.display = 'block';
            // Fait remonter la vue vers le message (utile pour longs formulaires)
            // adminFeedbackDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    function resetStockForm() {
        if (stockForm) stockForm.reset(); // Réinitialise tous les champs du formulaire
        if (componentInfoDiv) componentInfoDiv.style.display = 'none'; // Cache la section "Stock Actuel / Modifier"
        if (specificAttributesDiv) { // Vide et cache la section des attributs spécifiques
            specificAttributesDiv.innerHTML = '';
            specificAttributesDiv.style.display = 'none';
        }
        if (componentRefAdminInput) componentRefAdminInput.disabled = false; // Réactive le champ référence
        if (componentInitialQuantityInput) componentInitialQuantityInput.value = 0; // Remet quantité à 0
        if (componentThresholdInput) componentThresholdInput.value = ''; // Vide le seuil
        if (adminFeedbackDiv) adminFeedbackDiv.style.display = 'none'; // Cache le feedback
        if (componentCategorySelectAdmin) componentCategorySelectAdmin.value = ""; // Réinitialise la catégorie
        console.log("Formulaire de gestion du stock réinitialisé.");
    }
    function addStockEventListeners() {
        // Bouton "Vérifier Stock"
        checkStockButton?.addEventListener('click', async () => {
            const ref = componentRefAdminInput?.value.trim().toUpperCase();
            if (!ref) { showAdminFeedback("Entrez une référence composant à vérifier.", 'warning'); return; }

            if(adminFeedbackDiv) adminFeedbackDiv.style.display = 'none'; // Cache ancien feedback
            if(checkStockButton) checkStockButton.disabled = true; checkStockButton.textContent = "Vérif...";
            if(componentRefAdminInput) componentRefAdminInput.disabled = true; // Bloque modif ref pendant vérif

            try {
                const stockInfo = await getStockInfoFromSupabase(ref); // Récupère infos

                if (stockInfo) { // --- Composant Trouvé ---
                    console.log("Stock info trouvé (Admin Check):", stockInfo);
                    if(componentInfoDiv) componentInfoDiv.style.display = 'block'; // Affiche zone modif rapide
                    if(currentQuantitySpan) currentQuantitySpan.textContent = stockInfo.quantity;
                    if(quantityChangeInput) quantityChangeInput.value = 0; // Remet modif rapide à 0

                    // Pré-remplir le formulaire principal avec les détails trouvés
                    if(componentDescInput) componentDescInput.value = stockInfo.description || "";
                    if(componentMfgInput) componentMfgInput.value = stockInfo.manufacturer || "";
                    if(componentDatasheetInput) componentDatasheetInput.value = stockInfo.datasheet || "";
                    if(componentDrawerAdminInput) componentDrawerAdminInput.value = stockInfo.drawer || "";
                    if(componentInitialQuantityInput) componentInitialQuantityInput.value = stockInfo.quantity;
                    if(componentThresholdInput) componentThresholdInput.value = stockInfo.critical_threshold ?? '';
                    if(componentCategorySelectAdmin) {
                        componentCategorySelectAdmin.value = stockInfo.category_id || "";
                        // Déclenche l'événement 'change' pour afficher les bons attributs spécifiques
                        componentCategorySelectAdmin.dispatchEvent(new Event('change'));
                    }

                    // Pré-remplir les attributs spécifiques (après un petit délai pour que les champs soient créés)
                    setTimeout(() => {
                        if (stockInfo.attributes && typeof stockInfo.attributes === 'object' && specificAttributesDiv) {
                            Object.entries(stockInfo.attributes).forEach(([key, value]) => {
                                const inputField = specificAttributesDiv.querySelector(`input[data-attribute-name="${key}"]`);
                                if (inputField) { inputField.value = value || ''; }
                                else { console.warn(`Input pour attribut spécifique '${key}' non trouvé lors du pré-remplissage.`); }
                            });
                        }
                    }, 50); // 50ms devrait suffire pour que le DOM soit mis à jour par l'event 'change'

                    showAdminFeedback(`Composant "${ref}" trouvé. Modifiez les détails ou la quantité ci-dessous.`, 'success');
                    if (currentUser && stockInfo.drawer) { // Met à jour 7-seg si tiroir
                        updateSevenSegmentDisplay(stockInfo.drawer);
                    }

                } else { // --- Composant Non Trouvé ---
                    if(componentInfoDiv) componentInfoDiv.style.display = 'none'; // Cache modif rapide
                    // Ne pas reset tout le formulaire, juste les champs spécifiques au composant trouvé
                    // Garde la référence entrée par l'utilisateur
                    if (componentDescInput) componentDescInput.value = '';
                    if (componentMfgInput) componentMfgInput.value = '';
                    if (componentDatasheetInput) componentDatasheetInput.value = '';
                    if (componentDrawerAdminInput) componentDrawerAdminInput.value = '';
                    if (componentInitialQuantityInput) componentInitialQuantityInput.value = 0;
                    if (componentThresholdInput) componentThresholdInput.value = '';
                    if (componentCategorySelectAdmin) componentCategorySelectAdmin.value = "";
                    if (specificAttributesDiv) { specificAttributesDiv.innerHTML = ''; specificAttributesDiv.style.display = 'none'; }

                    showAdminFeedback(`Composant "${ref}" inconnu. Remplissez les champs pour l'ajouter.`, 'info');
                    componentDescInput?.focus(); // Met focus sur description pour ajout
                    updateSevenSegmentDisplay(null); // Assure que l'afficheur est éteint
                }
            } catch (error) {
                console.error("Erreur lors de la vérification du stock:", error);
                showAdminFeedback(`Erreur lors de la vérification: ${error.message}`, 'error');
                resetStockForm(); // Reset complet en cas d'erreur
                if(componentRefAdminInput) componentRefAdminInput.value = ref; // Remet la ref cherchée
            } finally {
                // Réactiver les boutons dans tous les cas
                if(checkStockButton) checkStockButton.disabled = false; checkStockButton.textContent = "Vérifier Stock";
                if(componentRefAdminInput) componentRefAdminInput.disabled = false;
            }
        });

        // Bouton "Mettre à jour" (modif rapide quantité)
        updateQuantityButton?.addEventListener('click', async () => {
            const ref = componentRefAdminInput?.value.trim().toUpperCase();
            const changeStr = quantityChangeInput?.value;
            const change = parseInt(changeStr, 10);

            // Validations
            if (!ref) { showAdminFeedback("Référence manquante pour la mise à jour rapide.", 'warning'); return; }
            if (changeStr === '' || isNaN(change)) { showAdminFeedback("Entrez une valeur numérique pour la modification (+/-).", 'warning'); quantityChangeInput?.focus(); return; }
            if (change === 0) { showAdminFeedback("Aucun changement de quantité spécifié (valeur 0).", 'info'); return; }

            // Vérification stock négatif (basée sur la quantité affichée, peut être légèrement décalée)
            const currentDisplayedQuantity = parseInt(currentQuantitySpan?.textContent, 10);
            if (!isNaN(currentDisplayedQuantity) && currentDisplayedQuantity + change < 0) {
                showAdminFeedback(`Action impossible: le stock deviendrait négatif (${currentDisplayedQuantity + change}).`, 'error');
                return;
            }

            // Désactiver bouton pendant màj
            if(updateQuantityButton) updateQuantityButton.disabled = true; updateQuantityButton.textContent = "MàJ...";

            try {
                const newQuantity = await updateStockInSupabase(ref, change); // Appel fonction principale

                if (newQuantity !== null) { // Si succès
                    if(currentQuantitySpan) currentQuantitySpan.textContent = newQuantity; // Met à jour qté affichée
                    if(componentInitialQuantityInput) componentInitialQuantityInput.value = newQuantity; // Met aussi à jour qté dans form principal
                    if(quantityChangeInput) quantityChangeInput.value = 0; // Réinitialise champ modif rapide
                    showAdminFeedback(`Stock pour "${ref}" mis à jour avec succès. Nouvelle quantité: ${newQuantity}.`, 'success');
                    if (inventoryView.classList.contains('active-view')) { // Rafraîchir vue inventaire si active
                        displayInventory();
                    }
                    // Le 7-segments est déjà mis à jour dans updateStockInSupabase si nécessaire
                }
                 // Si updateStockInSupabase lève une erreur, elle est attrapée ci-dessous

            } catch (error) {
                console.error("Erreur lors de la mise à jour rapide de quantité:", error);
                // Affiche message d'erreur spécifique ou générique
                showAdminFeedback(error.message.includes("Stock insuffisant") ? "Erreur: Stock insuffisant." : `Erreur mise à jour: ${error.message}`, 'error');
            } finally {
                // Réactiver bouton
                if(updateQuantityButton) updateQuantityButton.disabled = false; updateQuantityButton.textContent = "Mettre à jour";
            }
        });

            // --- Correction du Listener pour le formulaire d'ajout/modif de stock ---
    stockForm?.addEventListener('submit', async (event) => {
        event.preventDefault(); // Empêche le rechargement de la page
        if (!supabase) return;

        // Récupération des valeurs des champs
        const ref = componentRefAdminInput?.value.trim().toUpperCase();
        // *** La variable est bien définie ici en camelCase ***
        const categoryId = componentCategorySelectAdmin?.value || null;
        const description = componentDescInput?.value.trim() || null;
        const manufacturer = componentMfgInput?.value.trim() || null;
        const datasheet = componentDatasheetInput?.value.trim() || null;
        const drawer = componentDrawerAdminInput?.value.trim().toUpperCase() || null;
        const quantityStr = componentInitialQuantityInput?.value;
        const thresholdStr = componentThresholdInput?.value.trim();

        // --- Début des Validations ---
        if (!ref) {
            showAdminFeedback("La référence du composant est obligatoire.", 'error');
            componentRefAdminInput?.focus();
            return;
        }

        // *** CORRECTION : Utiliser 'categoryId' (camelCase) ici aussi ***
        if (!categoryId) { // On vérifie la variable définie plus haut
            showAdminFeedback("Veuillez sélectionner une catégorie pour le composant.", 'error');
            componentCategorySelectAdmin?.focus();
            return; // Arrête si la catégorie n'est pas sélectionnée
        }
        // *** FIN CORRECTION ***

        const quantity = parseInt(quantityStr, 10);
        if (quantityStr === '' || isNaN(quantity) || quantity < 0) {
            showAdminFeedback("La quantité totale est invalide (doit être un nombre >= 0).", 'error');
            componentInitialQuantityInput?.focus();
            return;
        }

        let critical_threshold = null;
        if (thresholdStr !== '') {
            critical_threshold = parseInt(thresholdStr, 10);
            if (isNaN(critical_threshold) || critical_threshold < 0) {
                showAdminFeedback("Le seuil critique est invalide (doit être un nombre >= 0).", 'error');
                componentThresholdInput?.focus();
                return;
            }
        }

        if (datasheet) {
            try { new URL(datasheet); } catch (_) {
                showAdminFeedback("L'URL de la datasheet est invalide.", 'error');
                componentDatasheetInput?.focus();
                return;
            }
        }
        // --- Fin des Validations ---

        // Récupération des attributs spécifiques
        const attributes = {};
        specificAttributesDiv?.querySelectorAll('input[data-attribute-name]').forEach(input => {
            const attrName = input.dataset.attributeName;
            const attrValue = input.value.trim();
            if (attrName && attrValue) { attributes[attrName] = attrValue; }
        });

        // Préparation de l'objet pour Supabase (ici, on utilise bien 'category_id' pour le nom de colonne DB)
        const componentData = {
            ref,
            description,
            manufacturer,
            quantity,
            datasheet,
            drawer,
            category_id: categoryId, // Assignation de la variable camelCase à la clé snake_case
            attributes: Object.keys(attributes).length > 0 ? attributes : null,
            critical_threshold
        };

        console.log("Préparation Upsert composant:", componentData);
        showAdminFeedback("Enregistrement du composant...", "info");
        if(saveComponentButton) saveComponentButton.disabled = true;

        try {
            const { data, error } = await supabase
                .from('inventory')
                .upsert(componentData, { onConflict: 'ref' })
                .select()
                .single();

            if (error) {
                throw new Error(`Erreur Base de Données: ${error.message}`);
            }

            console.log("Upsert composant réussi:", data);
            showAdminFeedback(`Composant "${ref}" enregistré/mis à jour avec succès.`, 'success');

            // Mises à jour UI post-succès
            if (componentInfoDiv?.style.display === 'block') {
                if(currentQuantitySpan) currentQuantitySpan.textContent = data.quantity;
                if(quantityChangeInput) quantityChangeInput.value = 0;
            }
            if (inventoryView.classList.contains('active-view')) { displayInventory(); }
            if (currentUser && data.drawer) { updateSevenSegmentDisplay(data.drawer); }
            // Optionnel: resetStockForm(); // Pour vider après succès

        } catch(err) {
            console.error("Erreur lors de l'upsert du composant:", err);
            showAdminFeedback(`Erreur lors de l'enregistrement: ${err.message}`, 'error');
        } finally {
            if(saveComponentButton) saveComponentButton.disabled = false;
        }
    });
    // --- Fin du Listener ---

    // --- LOGIQUE VUE RECHERCHE (Chat) ---

    /** Ajoute un message à la boîte de chat et à l'historique. */
    async function addMessageToChat(sender, messageContent, isHTML = false) {
        if (!responseOutputChat) return;
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender.toLowerCase());
        // Ajoute le nouveau message en haut (grâce à flex-direction: column-reverse)
        responseOutputChat.prepend(messageElement);

        if (sender === 'AI') {
            loadingIndicatorChat.style.display = 'block';
            loadingIndicatorChat.querySelector('i').textContent = 'StockAV réfléchit...';
            messageElement.innerHTML = '...'; // Placeholder pendant la réflexion/attente
            await delay(150); // Petit délai visuel

            if (isHTML) { // Si le contenu est déjà du HTML formaté
                messageElement.innerHTML = messageContent;
            } else { // Sinon, simuler l'effet machine à écrire
                messageElement.textContent = '';
                for (let i = 0; i < messageContent.length; i++) {
                    messageElement.textContent += messageContent[i];
                    await delay(5); // Ajuster la vitesse ici (en ms)
                }
            }
            loadingIndicatorChat.style.display = 'none'; // Cacher l'indicateur quand fini
        } else { // Message utilisateur simple
            messageElement.textContent = messageContent;
        }

        // Gérer l'historique du chat (limité aux 10 derniers échanges)
        const role = sender === 'User' ? 'user' : 'assistant';
        chatHistory.push({ role: role, content: messageContent });
        if (chatHistory.length > 10) { // Limite la taille de l'historique
            chatHistory.splice(0, chatHistory.length - 10);
        }

        // S'assurer que le haut du chat (le message le plus récent) est visible
        responseOutputChat.scrollTop = 0;
    }

    /** Affiche le message d'accueil initial et réinitialise l'état. */
    function displayWelcomeMessage() {
        if (responseOutputChat) responseOutputChat.innerHTML = ''; // Vide l'affichage
        chatHistory = []; // Vide l'historique mémoire
        resetConversationState(); // Réinitialise l'état de la logique conversationnelle
        // Message d'accueil
        addMessageToChat('AI', "Bonjour ! Je suis StockAV. Quelle référence de composant cherchez-vous ? (ex: 'cherche LM358N', 'stock 1N4148')");
        if(componentInputChat) {
            componentInputChat.value = ''; // Vide le champ de saisie
            componentInputChat.focus(); // Met le curseur dans le champ
        }
    }

    /** Gère l'entrée utilisateur dans le chat. */
    async function handleUserInput() {
        const userInput = componentInputChat?.value.trim();
        if (!userInput) return; // Ignore les entrées vides

        addMessageToChat('User', userInput); // Affiche l'entrée user dans le chat
        if (componentInputChat) componentInputChat.value = ''; // Vide le champ après envoi

        try {
            // --- Gestion des différents états de la conversation ---

            // Priorité 1: Attend-on une réponse pour la quantité à prendre ?
            if (conversationState.awaitingQuantityConfirmation) {
                if (!currentUser) { // Sécurité: si déconnecté entre temps
                    await promptLoginBeforeAction("confirmer la quantité à prendre");
                    return;
                }
                await handleQuantityResponse(userInput); // Traite la réponse de quantité
            }
            // Priorité 2: Sinon, est-ce une nouvelle recherche ou une réponse non valide ?
            else {
                const potentialRef = extractReference(userInput); // Tente d'extraire une référence

                if (potentialRef) {
                    // Si une référence est trouvée, on lance une nouvelle recherche complète
                    console.log(`Nouvelle référence détectée: ${potentialRef}. Lancement de checkComponentWithAI.`);
                    resetConversationState(); // Oublie l'état précédent (choix équivalent, etc.)
                    conversationState.originalRefChecked = potentialRef; // Mémorise la réf cherchée
                    await checkComponentWithAI(potentialRef); // Lance la vérification stock + IA
                } else {
                    // Si aucune référence n'est trouvée
                    if (conversationState.awaitingEquivalentChoice) {
                        // Si on attendait un clic sur "Prendre" mais l'utilisateur a tapé autre chose
                         await addMessageToChat('AI', "Entrée non reconnue. Veuillez cliquer sur un bouton 'Prendre', ou entrez une nouvelle référence de composant valide.");
                         // On reste dans l'état awaitingEquivalentChoice
                    } else {
                        // Si on n'attendait rien de spécial et l'input n'est pas une référence
                        await addMessageToChat('AI', "Je n'ai pas bien compris. Pouvez-vous entrer une référence de composant ? (Par exemple: 'stock BC547', 'cherche NE555')");
                        resetConversationState(); // Reset au cas où
                    }
                }
            }

        } catch (error) {
            // Gestion d'erreur globale pour le traitement de l'input
            console.error("Erreur majeure dans handleUserInput:", error);
            await addMessageToChat('AI', "Oups ! Une erreur inattendue s'est produite pendant le traitement de votre demande. Veuillez réessayer.");
            resetConversationState(); // Réinitialise l'état en cas d'erreur imprévue
        } finally {
             if(componentInputChat) componentInputChat.focus(); // Remet le focus sur l'input à la fin
        }
    }

    /** Extrait une référence de composant potentielle du texte utilisateur. */
    function extractReference(text) {
        const upperText = text.toUpperCase();
        let bestMatch = null;
        // Patterns Regex (gardés tels quels pour l'instant)
        const patterns = [ /\b(PIC\s?[A-Z\d\-F/L]+)\b/, /\b(AT[TINY|MEGA|XMEGA]+\s?\d+[A-Z\d\-]*)\b/, /\b(STM32[A-Z]\d{2,}[A-Z\d]*)\b/, /\b(ESP[ -]?\d{2,}[A-Z\d\-]*)\b/, /\b(IRF[A-Z\d]+)\b/, /\b(LM\s?\d{2,}[A-Z\d\-/]*)\b/, /\b(NE\s?\d{3}[A-Z]*)\b/, /\b(UA\s?\d{3,}[A-Z]*)\b/, /\b(MAX\s?\d{3,}[A-Z\d\-/]*)\b/, /\b(SN\s?74[A-Z\d]+)\b/, /\b(CD\s?4\d{3,}[A-Z]*)\b/, /\b([1-9]N\s?\d{4}[A-Z]*)\b/, /\b([2-9](?:N|P)\s?\d{4}[A-Z]*)\b/, /\b(BC\s?\d{3}[A-Z]*)\b/, /\b(BD\s?\d{3}[A-Z]*)\b/, /\b(TIP\s?\d{2,}[A-Z]*)\b/, /\b(MOC\s?\d{4}[A-Z]*)\b/, /\b(\d+(?:\.\d+)?\s?(PF|NF|UF|µF))\b/i, /\b(\d+(?:\.\d+)?[RK]?)\s?(R|K|M)?\s?O?H?M?S?\b/i, /\b([A-Z]{2,}\d{2,}[A-Z\d\-/]*)\b/, /\b(\d{2,}[A-Z]{1,}[A-Z\d\-/]*)\b/, /\b([A-Z]{1,}\d{3,}[A-Z\d\-/]*)\b/ ];
        const ignoreWords = new Set([ 'POUR', 'AVEC', 'COMBIEN', 'STOCK', 'CHERCHE', 'DISPO', 'EQUIV', 'REMPLACE', 'TROUVE', 'QUEL', 'EST', 'QUE', 'SONT', 'LES', 'DU', 'UN', 'UNE', 'OU', 'ET', 'LE', 'LA', 'DE', 'À', 'PLUS', 'MOINS', 'PEUT', 'IL', 'ELLE', 'ON', 'JE', 'TU', 'COMME', 'DANS', 'SUR', 'VOLTS', 'AMPERES', 'WATTS', 'OHMS', 'FARADS', 'HENRYS', 'TYPE', 'VALEUR' ]);

        for (const pattern of patterns) {
            const match = upperText.match(pattern);
            if (match && match[1]) {
                const cleanedRef = match[1].replace(/\s+/g, '').replace(/OHMS?|FARADS?/, '');
                if (cleanedRef.length >= 3 && !/^\d+$/.test(cleanedRef) && !ignoreWords.has(cleanedRef)) {
                    if (!bestMatch || cleanedRef.length > bestMatch.length) {
                        bestMatch = cleanedRef;
                    }
                }
            }
        }

        if (!bestMatch) {
            const words = upperText.split(/[\s,;:!?()]+/);
            const potentialRefs = words.filter(w => w.length >= 3 && /\d/.test(w) && /[A-Z]/.test(w) && !/^\d+$/.test(w) && !ignoreWords.has(w) );
            if (potentialRefs.length > 0) {
                potentialRefs.sort((a, b) => b.length - a.length);
                bestMatch = potentialRefs[0];
            }
        }

        console.log(`Reference extracted from "${text}": ${bestMatch}`);
        return bestMatch;
    }

    /** Fonction principale recherche: Vérifie stock local, appelle IA éq., vérifie stock éq., affiche tout. */
    async function checkComponentWithAI(originalRef) {
        loadingIndicatorChat.style.display = 'block'; // Affiche indicateur chargement
        loadingIndicatorChat.querySelector('i').textContent = `Analyse locale de ${originalRef}...`;
        let originalStockInfo = null;
        let equivalents = [];
        let aiError = null;
        let responseHTML = ""; // Construit la réponse HTML étape par étape

        try {
            // 1. Vérifier stock local original
            originalStockInfo = await getStockInfoFromSupabase(originalRef);
            await delay(150); // Petit délai pour UX
            if (currentUser && originalStockInfo?.drawer) {
                updateSevenSegmentDisplay(originalStockInfo.drawer); // Met à jour 7-seg
            }

            const showDrawer = currentUser && originalStockInfo?.drawer;
            let originalStatusHTML = "";
            if (originalStockInfo) { // Trouvé localement
                const indicatorHTML = createStockIndicatorHTML(originalStockInfo.quantity, originalStockInfo.critical_threshold);
                originalStatusHTML = (originalStockInfo.quantity > 0)
                    ? `${indicatorHTML}Original <strong>${originalRef}</strong> : Disponible (Qté: ${originalStockInfo.quantity}${showDrawer ? `, Tiroir: ${originalStockInfo.drawer}` : ''}).`
                    : `${indicatorHTML}Original <strong>${originalRef}</strong> : En rupture de stock localement.`;
                if (originalStockInfo.quantity > 0) conversationState.criticalThreshold = originalStockInfo.critical_threshold; // Mémorise seuil si dispo
            } else { // Non trouvé localement
                originalStatusHTML = `${createStockIndicatorHTML(undefined, undefined)}Original <strong>${originalRef}</strong> : Non trouvé dans notre stock local.`;
            }
            responseHTML += originalStatusHTML; // Ajoute statut original au HTML

            // 2. Chercher équivalents via IA
            loadingIndicatorChat.querySelector('i').textContent = `Recherche d'équivalents pour ${originalRef}...`;
            const aiResult = await getAIEquivalents(originalRef); // Appel fonction Edge
            if (aiResult.error) {
                aiError = aiResult.error; // Stocke erreur IA
                console.error("Erreur getAIEquivalents:", aiError);
            } else {
                equivalents = aiResult.equivalents || []; // Stocke équivalents trouvés (ou tableau vide)
            }

            // 3. Vérifier stock local des équivalents trouvés
            let equivalentsStockInfo = {};
            if (equivalents.length > 0) {
                loadingIndicatorChat.querySelector('i').textContent = `Vérification stock local des équivalents...`;
                const equivalentRefs = equivalents.map(eq => eq.ref);
                const stockCheckPromises = equivalentRefs.map(ref => getStockInfoFromSupabase(ref));
                const results = await Promise.all(stockCheckPromises); // Appels DB en parallèle
                results.forEach((stockInfo, index) => {
                    if (stockInfo) { equivalentsStockInfo[equivalentRefs[index]] = stockInfo; }
                });
                console.log("Stock info des équivalents:", equivalentsStockInfo);
            }

            // 4. Afficher les équivalents et leur statut local
            if (equivalents.length > 0) {
                responseHTML += "<br><br><strong>Équivalents suggérés par l'IA :</strong>";
                let foundAvailableEquivalent = false;
                equivalents.forEach(eq => {
                    const eqStock = equivalentsStockInfo[eq.ref];
                    const eqIndicatorHTML = createStockIndicatorHTML(eqStock?.quantity, eqStock?.critical_threshold);
                    const eqShowDrawer = currentUser && eqStock?.drawer;

                    responseHTML += `<div class="equivalent-item">`; // Div pour chaque équivalent
                    responseHTML += `${eqIndicatorHTML}<strong>${eq.ref}</strong> <small>(${eq.reason || 'Suggestion AI'})</small>`; // Réf + raison

                    if (eqStock) { // Si équivalent existe dans DB locale
                        if (eqStock.quantity > 0) { // Et en stock
                            foundAvailableEquivalent = true;
                            responseHTML += ` : Dispo (Qté: ${eqStock.quantity}${eqShowDrawer ? `, Tiroir: ${eqStock.drawer}` : ''})`;
                            if (currentUser) { // Bouton "Prendre" si connecté
                                responseHTML += ` <button class="choice-button take-button" data-ref="${eq.ref}" data-qty="${eqStock.quantity}" data-threshold="${eqStock.critical_threshold ?? ''}" title="Prendre celui-ci">Prendre</button>`;
                            }
                        } else { // En rupture localement
                            responseHTML += ` : Rupture local.`;
                            responseHTML += provideExternalLinksHTML(eq.ref, true); // Liens inline
                        }
                    } else { // Pas trouvé localement
                        responseHTML += ` : Non trouvé local.`;
                        responseHTML += provideExternalLinksHTML(eq.ref, true); // Liens inline
                    }
                    responseHTML += `</div>`; // Fin div equivalent-item
                });
                // Met l'état en attente de choix si un équivalent OU l'original est dispo
                if (foundAvailableEquivalent || (originalStockInfo && originalStockInfo.quantity > 0)) {
                    conversationState.awaitingEquivalentChoice = true;
                }
            } else if (!aiError) { // Si IA n'a rien trouvé et pas d'erreur
                responseHTML += "<br><br>L'IA n'a pas trouvé d'équivalents pertinents.";
            }

            // 5. Ajouter bouton "Prendre original" si dispo et connecté
            if (originalStockInfo && originalStockInfo.quantity > 0 && currentUser) {
                responseHTML += `<br><button class="choice-button take-button" data-ref="${originalRef}" data-qty="${originalStockInfo.quantity}" data-threshold="${originalStockInfo.critical_threshold ?? ''}" title="Prendre l'original">Prendre original (${originalRef})</button>`;
                conversationState.awaitingEquivalentChoice = true; // Attend aussi un choix ici
            } else if (originalStockInfo && originalStockInfo.quantity > 0 && !currentUser) {
                // Message si original dispo mais pas connecté
                responseHTML += `<br><br><i>L'original est disponible. Connectez-vous pour pouvoir le prendre.</i>`;
            }

            // 6. Ajouter liens externes pour l'original s'il n'est pas en stock ou pas trouvé
            if (!originalStockInfo || originalStockInfo.quantity <= 0) {
                responseHTML += provideExternalLinksHTML(originalRef, false); // Liens en bloc
            }

            // 7. Afficher erreur IA si elle a eu lieu
            if (aiError) {
                responseHTML += `<br><br><i style="color: var(--error-color);">Erreur lors de la recherche d'équivalents: ${aiError}.</i>`;
                // Ajoute liens externes pour l'original si pas déjà fait (au cas où l'original était dispo mais IA a échoué)
                if (!responseHTML.includes('external-links-block') && (!originalStockInfo || originalStockInfo.quantity <= 0)) {
                     responseHTML += provideExternalLinksHTML(originalRef, false);
                }
            }

             // 8. Message final / gestion état
            if (!conversationState.awaitingEquivalentChoice && !conversationState.awaitingQuantityConfirmation) {
                // Si on n'attend ni choix, ni quantité (ex: original non dispo, pas d'équivalents dispos)
                responseHTML += "<br><br>Que puis-je faire d'autre ?";
                resetConversationState(); // Reset pour la prochaine requête
            } else if (!currentUser && conversationState.awaitingEquivalentChoice) {
                // Si on attend un choix mais user pas connecté
                responseHTML += `<br><br><i>Connectez-vous pour choisir et prendre un composant.</i>`;
            }

        } catch (error) {
            // Erreur générale pendant le processus
            console.error("Erreur majeure dans checkComponentWithAI pour " + originalRef + ":", error);
            responseHTML = `Une erreur s'est produite lors de la recherche de <strong>${originalRef}</strong>.<br>Détails: ${error.message}`;
            resetConversationState(); // Reset en cas d'erreur grave
        } finally {
            loadingIndicatorChat.style.display = 'none'; // Cache l'indicateur
            await addMessageToChat('AI', responseHTML, true); // Affiche le message AI construit
        }
    }

    /** Appelle l'Edge Function Supabase pour obtenir les équivalents IA. */
    async function getAIEquivalents(reference) {
        if (!supabase) { return { equivalents: null, error: "Client Supabase non initialisé." }; }
        console.log(`Appel func Edge 'openai-equivalents' pour: ${reference}`);
        try {
            const { data, error: invokeError } = await supabase.functions.invoke(
                'openai-equivalents',
                { body: { reference: reference } }
            );

            if (invokeError) { // Erreur technique d'invocation
                console.error("Erreur invocation func Edge:", invokeError);
                let message = invokeError.message || "Erreur inconnue";
                if (invokeError.context?.status === 404 || invokeError.message.includes("Function not found")) {
                    message = "Service IA (Fonction Edge) non trouvé ou non déployé.";
                } else if (invokeError.context?.status === 500) {
                    message = "Erreur interne du service IA.";
                } else if (invokeError.message.includes("fetch failed")) {
                     message = "Impossible de contacter le service IA (problème réseau ou service arrêté).";
                }
                throw new Error(message);
            }

            // Erreur métier retournée par la fonction (ex: clé API invalide côté fonction)
            if (data && data.error) {
                console.error("Erreur retournée par func Edge:", data.error);
                return { equivalents: null, error: data.error };
            }

            // Succès, vérification de la structure
            if (data && Array.isArray(data.equivalents)) {
                console.log("Équivalents reçus func Edge:", data.equivalents);
                return { equivalents: data.equivalents, error: null };
            } else {
                console.warn("Structure data inattendue reçue de func Edge:", data);
                return { equivalents: [], error: "Réponse inattendue du service IA." }; // Retourne vide et erreur
            }
        } catch (error) { // Attrape erreurs JS ou erreurs levées ci-dessus
            console.error("Erreur générale appel getAIEquivalents:", error);
            return { equivalents: null, error: error.message || "Échec communication avec le service IA." };
        }
    }

    /** Listener pour les clics DANS la zone de chat (boutons "Prendre"). */
    responseOutputChat?.addEventListener('click', async (event) => {
        const targetButton = event.target.closest('button.choice-button.take-button');

        // Si on a cliqué sur un bouton "Prendre" et qu'on attendait bien un choix
        if (targetButton && conversationState.awaitingEquivalentChoice) {
            const chosenRef = targetButton.dataset.ref;
            const availableQtyStr = targetButton.dataset.qty;
            const criticalThresholdStr = targetButton.dataset.threshold;

            if (!chosenRef || availableQtyStr === undefined) { /* ... gestion erreur interne ... */ return; }
            const availableQty = parseInt(availableQtyStr, 10);
            if (isNaN(availableQty) || availableQty <= 0) { /* ... gestion erreur qté invalide ... */ return; }
            if (!currentUser) { await promptLoginBeforeAction(`prendre ${chosenRef}`); return; }

            // Confirmer le choix et passer à l'étape suivante (demande de quantité)
            console.log(`Choix confirmé: ${chosenRef}, Qté dispo: ${availableQty}`);
            conversationState.awaitingEquivalentChoice = false; // N'attend plus de choix
            addMessageToChat('User', `Je prends ${chosenRef}`); // Message utilisateur simulé
            await delay(50);

            // Mémoriser infos pour demande qté
            conversationState.chosenRefForStockCheck = chosenRef;
            conversationState.availableQuantity = availableQty;
            conversationState.criticalThreshold = (criticalThresholdStr && !isNaN(parseInt(criticalThresholdStr, 10))) ? parseInt(criticalThresholdStr, 10) : null;
            conversationState.awaitingQuantityConfirmation = true; // Attend maintenant la qté

            // Màj 7-segments si possible
            const stockInfo = await getStockInfoFromSupabase(chosenRef);
            if (currentUser && stockInfo?.drawer) { updateSevenSegmentDisplay(stockInfo.drawer); }

            // Demander la quantité
            await addMessageToChat('AI', `Combien de <strong>${chosenRef}</strong> souhaitez-vous prendre ? (Stock : ${availableQty}) Entrez un nombre (ou '0' pour annuler).`);

        } else if (event.target.tagName === 'A' && (event.target.classList.contains('external-link') || event.target.classList.contains('external-link-inline'))) {
            // Simple log si clic sur lien externe
            console.log(`Lien externe cliqué: ${event.target.href}`);
        }
    });

    /** Affiche un message invitant l'utilisateur à se connecter. */
    async function promptLoginBeforeAction(actionDescription) {
        await addMessageToChat('AI', `Pour ${actionDescription}, veuillez d'abord vous connecter en utilisant la zone en haut de la page.`);
        loginCodeInput?.focus();
    }

    /** Génère le HTML pour les liens de recherche externe. */
    function provideExternalLinksHTML(ref, inline = false) {
        if (!ref) return '';
        const encodedRef = encodeURIComponent(ref);
        const mLink = `https://www.mouser.ca/Search/Refine?Keyword=${encodedRef}`;
        const dLink = `https://www.digikey.ca/en/products/result?keywords=${encodedRef}`;
        const aLink = `https://www.aliexpress.com/wholesale?SearchText=${encodedRef}`;
        // Version inline
        if (inline) {
            return ` <span class="external-links-inline">(Voir sur : <a href="${mLink}" target="_blank" rel="noopener noreferrer" class="external-link-inline" title="Rechercher ${ref} sur Mouser">Mouser</a>, <a href="${dLink}" target="_blank" rel="noopener noreferrer" class="external-link-inline" title="Rechercher ${ref} sur Digi-Key">Digi-Key</a>, <a href="${aLink}" target="_blank" rel="noopener noreferrer" class="external-link-inline aliexpress" title="Rechercher ${ref} sur AliExpress">AliExpress</a>)</span>`;
        }
        // Version bloc
        else {
            return `<div class="external-links-block">Liens de recherche externe pour <strong>${ref}</strong> : <a href="${mLink}" target="_blank" rel="noopener noreferrer" class="external-link">Mouser</a> <a href="${dLink}" target="_blank" rel="noopener noreferrer" class="external-link">Digi-Key</a> <a href="${aLink}" target="_blank" rel="noopener noreferrer" class="external-link aliexpress">AliExpress</a></div>`;
        }
    }

    /** Gère la réponse de l'utilisateur à la demande de quantité. */
    async function handleQuantityResponse(userInput) {
        const ref = conversationState.chosenRefForStockCheck;
        if (!ref || !conversationState.awaitingQuantityConfirmation) { /* ... gestion hors contexte ... */ return; }

        const requestedQty = parseInt(userInput, 10);

        // Validations quantité
        if (isNaN(requestedQty) || requestedQty < 0) { await addMessageToChat('AI', `Quantité invalide. Entrez un nombre >= 0.`); return; }
        if (requestedQty === 0) { await addMessageToChat('AI', "Prise de stock annulée."); resetConversationState(); await delay(300); await addMessageToChat('AI', "Besoin d'autre chose ?"); return; }
        if (requestedQty > conversationState.availableQuantity) { await addMessageToChat('AI', `Quantité (${requestedQty}) > stock (${conversationState.availableQuantity}). Entrez qté valide ou '0'.`); return; }

        // Màj stock
        loadingIndicatorChat.style.display = 'block';
        loadingIndicatorChat.querySelector('i').textContent = `Mise à jour stock ${ref}...`;
        const change = -requestedQty;

        try {
            const newQty = await updateStockInSupabase(ref, change); // Tente la màj DB + log
            loadingIndicatorChat.style.display = 'none';

            if (newQty !== null) { // Succès
                const statusIndicatorHTML = createStockIndicatorHTML(newQty, conversationState.criticalThreshold);
                await addMessageToChat('AI', `${statusIndicatorHTML}Ok ! ${requestedQty} x <strong>${ref}</strong> retiré(s). Stock restant : ${newQty}.`);
                if (inventoryView.classList.contains('active-view')) { displayInventory(currentInventoryPage); }
                // Succès -> sortir de l'état d'attente de quantité
                conversationState.awaitingQuantityConfirmation = false;
            }
            // Si updateStockInSupabase échoue, l'erreur est gérée dans le catch

        } catch (error) {
            console.error("Erreur màj stock via chat:", error);
            loadingIndicatorChat.style.display = 'none';
            let errorMessage = `Erreur màj stock <strong>${ref}</strong>.`;
            // Cas spécifique stock insuffisant (race condition possible)
            if (error.message.includes("Stock insuffisant")) {
                errorMessage = `Erreur critique : Stock <strong>${ref}</strong> est devenu insuffisant (${error.message}).`;
                const currentStock = await getStockInfoFromSupabase(ref);
                if(currentStock) {
                    errorMessage += ` Stock actuel réel: ${currentStock.quantity}. Réessayez avec une quantité valide ou '0'.`;
                    conversationState.availableQuantity = currentStock.quantity; // Màj état
                    conversationState.awaitingQuantityConfirmation = true; // Reste en attente
                    await addMessageToChat('AI', errorMessage);
                    return; // Ne pas reset l'état complet, attendre nouvelle qté
                }
            } else if (error.message) { errorMessage += ` Détails: ${error.message}`; }
            // Erreur -> sortir de l'état d'attente
            conversationState.awaitingQuantityConfirmation = false;
            await addMessageToChat('AI', errorMessage);
            // Reset complet après erreur non gérée
            resetConversationState();
        } finally {
            // Si on n'est plus en attente de quantité (succès ou erreur gérée)
             if (!conversationState.awaitingQuantityConfirmation) {
                 resetConversationState(); // Reset final état conversation
                 await delay(300);
                 await addMessageToChat('AI', "Besoin d'autre chose ?"); // Message de fin de cycle
             }
        }
    }

    /** Réinitialise complètement l'état de la conversation du chat. */
    function resetConversationState() {
        conversationState = {
            awaitingEquivalentChoice: false,
            awaitingQuantityConfirmation: false,
            originalRefChecked: null,
            potentialEquivalents: [],
            chosenRefForStockCheck: null,
            availableQuantity: 0,
            criticalThreshold: null
        };
        console.log("État de la conversation chat réinitialisé.");
    }


    // --- Fonctions d'interaction Supabase ---
    /** Récupère les informations d'un composant depuis la DB. */
    async function getStockInfoFromSupabase(ref) {
        if (!supabase || !ref) return null;
        const upperRef = ref.toUpperCase();
        // console.log(`Supabase GET: Tentative récup pour ref: ${upperRef}`); // Peut être verbeux
        try {
            const { data, error } = await supabase
                .from('inventory')
                .select('*, categories(name), critical_threshold')
                .ilike('ref', upperRef)
                .single();
            if (error) { if (error.code !== 'PGRST116') { console.error(`Supabase GET Error for ${upperRef}:`, error); } return null; }
            return data;
        } catch (err) { console.error("JS Error in getStockInfoFromSupabase:", err); return null; }
    }
    /** Met à jour la quantité d'un composant et enregistre un log. */
    async function updateStockInSupabase(ref, change) {
        if (!supabase || !ref || change === 0 || !currentUser) { /* ... gestion prérequis ... */ throw new Error("Màj annulée: infos manquantes ou non connecté."); }
        const upperRef = ref.toUpperCase();
        console.log(`Supabase UPDATE: Ref: ${upperRef}, Change: ${change}`);
        try {
            // Lire stock actuel
            const { data: currentItem, error: readError } = await supabase.from('inventory').select('quantity, drawer, critical_threshold').ilike('ref', upperRef).single();
            if (readError || !currentItem) { throw new Error(`Composant "${upperRef}" non trouvé.`); }
            // Vérifier stock négatif
            const newQuantity = currentItem.quantity + change;
            if (newQuantity < 0) { throw new Error(`Stock insuffisant pour ${upperRef}.`); }
            // Mettre à jour stock
            const { data: updateData, error: updateError } = await supabase.from('inventory').update({ quantity: newQuantity }).ilike('ref', upperRef).select('quantity, drawer').single();
            if (updateError) { throw new Error("Erreur enregistrement màj stock."); }
            // Enregistrer log et màj 7-seg
            console.log(`Supabase UPDATE Success: ${upperRef}. New Qty: ${updateData.quantity}`);
            await addLogEntry(upperRef, change, newQuantity);
            if (currentUser && updateData.drawer) { updateSevenSegmentDisplay(updateData.drawer); }
            return newQuantity; // Retourne la nouvelle quantité
        } catch (err) { console.error(`Error in updateStockInSupabase for ${upperRef}:`, err.message); throw err; }
    }

    // --- Gestion Modale Quantité (+/-) ---
    async function handleInventoryRowClick(event) { /* ... Code existant ... */ }
    function showQuantityModal(ref, quantity) { /* ... Code existant ... */ }
    function hideQuantityModal() { /* ... Code existant ... */ }
    function updateModalButtonStates() { /* ... Code existant ... */ }
    // Event listeners pour la modale (decrease, increase, cancel, confirm, overlay)
    modalDecreaseButton?.addEventListener('click', () => { if (modalInitialQuantity + currentModalChange > 0) { currentModalChange--; updateModalButtonStates(); } });
    modalIncreaseButton?.addEventListener('click', () => { currentModalChange++; updateModalButtonStates(); });
    modalCancelButton?.addEventListener('click', hideQuantityModal);
    modalOverlay?.addEventListener('click', (event) => { if (event.target === modalOverlay) hideQuantityModal(); });
    modalConfirmButton?.addEventListener('click', async () => { /* ... Code existant pour confirmation modale ... */ });


    // --- Gestion Afficheur 7 Segments ---
    const segmentMap = { /* ... Code existant ... */ };
    function updateSevenSegmentDisplay(newDrawerValue = undefined) { /* ... Code existant ... */ }

    // --- Logique pour la vue Paramètres ---
    function loadSettingsData() { /* ... Code existant (vérifie déjà currentUser) ... */ }
    function showSettingsFeedback(type, message, level = 'info') { /* ... Code existant ... */ }
    function downloadFile(filename, content, mimeType) { /* ... Code existant ... */ }
    async function handleExportInventoryCSV() { /* ... Code existant ... */ }
    async function handleExportLogTXT() { /* ... Code existant ... */ }
    async function handleImportInventoryCSV() { /* ... Code existant ... */ }
    function resetImportState() { /* ... Code existant ... */ }
    function addSettingsEventListeners() { /* ... Code existant ... */ }

    // --- Initialisation Générale de l'Application ---
    function initializeApp() {
        console.log("Initialisation de StockAV...");
        // Vérification éléments DOM essentiels (simplifiée)
        const requiredIds = ['login-area', 'search-view', 'inventory-view', 'log-view', 'admin-view', 'settings-view', 'seven-segment-display', 'inventory-table-body', 'response-output', 'component-input', 'show-search-view', 'show-inventory-view', 'show-log-view', 'show-admin-view', 'show-settings-view', 'login-button', 'logout-button', 'search-button', 'category-list', 'stock-form', 'component-category-select', 'save-component-button', 'export-inventory-csv-button', 'import-inventory-csv-button', 'log-table-body']; // Ajout log-table-body
        if (requiredIds.some(id => !document.getElementById(id))) {
            console.error("FATAL: Un ou plusieurs éléments DOM essentiels (IDs) sont manquants ! Vérifiez index.html.");
            document.body.innerHTML = "<p style='color:red; font-family: sans-serif; padding: 20px;'><b>Erreur critique d'initialisation.</b><br>Impossible de trouver des éléments HTML nécessaires.<br>Vérifiez la console du navigateur (F12) et le fichier index.html.</p>";
            return;
        }

        // --- Ajout des écouteurs d'événements ---
        searchTabButton.addEventListener('click', () => setActiveView(searchView, searchTabButton));
        inventoryTabButton.addEventListener('click', () => setActiveView(inventoryView, inventoryTabButton));
        logTabButton.addEventListener('click', () => setActiveView(logView, logTabButton));
        adminTabButton.addEventListener('click', () => setActiveView(adminView, adminTabButton));
        settingsTabButton.addEventListener('click', () => setActiveView(settingsView, settingsTabButton));

        loginButton.addEventListener('click', handleLogin);
        loginPasswordInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleLogin(); });
        loginCodeInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleLogin(); });
        logoutButton.addEventListener('click', handleLogout);

        searchButtonChat.addEventListener('click', handleUserInput);
        componentInputChat.addEventListener('keypress', (event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); handleUserInput(); } });

        applyInventoryFilterButton?.addEventListener('click', () => { currentInventoryFilters.category = inventoryCategoryFilter.value; currentInventoryFilters.search = inventorySearchFilter.value; displayInventory(1); });
        inventorySearchFilter?.addEventListener('keypress', (e) => { if (e.key === 'Enter') { applyInventoryFilterButton?.click(); } });

        inventoryPrevPageButton?.addEventListener('click', () => { if (currentInventoryPage > 1) { displayInventory(currentInventoryPage - 1); } });
        inventoryNextPageButton?.addEventListener('click', () => { if (!inventoryNextPageButton?.disabled) { displayInventory(currentInventoryPage + 1); } });

        logPrevPageButton?.addEventListener('click', () => { if (currentLogPage > 1) { displayLog(currentLogPage - 1); } });
        logNextPageButton?.addEventListener('click', () => { if (!logNextPageButton?.disabled) { displayLog(currentLogPage + 1); } });

        inventoryTableBody.addEventListener('click', handleInventoryRowClick);

        // *** MODIFICATION POUR PURGE LOG (Listener délégué) ***
        logTableBody?.addEventListener('click', handleDeleteSingleLog);
        // Le listener pour #purge-all-logs-button est ajouté dynamiquement dans displayLog si nécessaire

        addCategoryEventListeners();
        addComponentCategorySelectListener();
        addStockEventListeners(); // Contient la logique de sauvegarde corrigée
        addSettingsEventListeners();

        // Initialisation Auth et état initial
        setupAuthListener();
        updateSevenSegmentDisplay(null);

        console.log("StockAV initialisé et prêt.");
    }

    // --- Lancer l'application ---
    initializeApp();

}); // ----- FIN DU FICHIER script.js -----