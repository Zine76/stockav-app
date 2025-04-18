// Assure que le code s'exécute après le chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
    "use strict"; // Active le mode strict

    // --- Configuration et Variables Globales ---
    let currentUser = null;
    let currentUserCode = null; // Stockera 'zine', 'tech1', etc.
    const ITEMS_PER_PAGE = 15;
    let isInitialAuthCheckComplete = false;
    let activeSession = null;
    // Pour la couleur du 7-segment (garder trace du dernier composant affiché)
    let lastDisplayedDrawerRef = null;
    let lastDisplayedDrawerThreshold = null; // Garder seuil aussi
    let categoriesCache = []; // Cache pour les catégories {id, name, attributes}

    // --- Configuration Supabase ---
    const SUPABASE_URL = 'https://tjdergojgghzmopuuley.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZGVyZ29qZ2doem1vcHV1bGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4MTU0OTUsImV4cCI6MjA1OTM5MTQ5NX0.XejQYEPYoCrgYOwW4T9g2VcmohCdLLndDdwpSYXAwPA';
    const FAKE_EMAIL_DOMAIN = '@stockav.local';
    let supabase = null;

    // --- Initialisation des Clients et Vérifications ---
    try {
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !FAKE_EMAIL_DOMAIN) {
            throw new Error("Configuration Supabase manquante ! Vérifiez les constantes SUPABASE_URL, SUPABASE_ANON_KEY, FAKE_EMAIL_DOMAIN.");
        }
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log("Client Supabase initialisé.");
        } else {
            throw new Error("Librairie Supabase (supabase-js v2) non chargée. Vérifiez l'inclusion dans index.html.");
        }
        if (typeof Papa === 'undefined') {
            console.warn("Librairie PapaParse non chargée. L'import/export CSV pourrait ne pas fonctionner.");
        }
    } catch (error) {
        console.error("Erreur critique lors de l'initialisation:", error);
        document.body.innerHTML = `<div style="padding:20px; background-color:#f8d7da; color:#721c24; border: 1px solid #f5c6cb; border-radius: 5px;">
                                    <h2>Erreur Critique d'Initialisation</h2>
                                    <p>L'application n'a pas pu démarrer correctement.</p>
                                    <p><strong>Détail :</strong> ${error.message}</p>
                                    <p>Veuillez vérifier la console du navigateur (F12) pour plus d'informations et contacter l'administrateur si le problème persiste.</p>
                                   </div>`;
        return; // Arrête l'exécution du reste du script
    }

    // --- Récupération des Éléments DOM (après vérification Supabase) ---
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
    // Variables pour les filtres inventaire
    const inventoryTableBody = document.getElementById('inventory-table-body');
    const inventoryCategoryFilter = document.getElementById('inventory-category-filter');
    const inventorySearchFilter = document.getElementById('inventory-search-filter');
    const applyInventoryFilterButton = document.getElementById('apply-inventory-filter-button');
    const inventoryPrevPageButton = document.getElementById('inventory-prev-page');
    const inventoryNextPageButton = document.getElementById('inventory-next-page');
    const inventoryPageInfo = document.getElementById('inventory-page-info');
    const inventoryNoResults = document.getElementById('inventory-no-results');
    const attributeFiltersContainer = document.getElementById('inventory-attribute-filters'); // Conteneur filtres dynamiques
    // Variables pour la vue Log
    const logTableBody = document.getElementById('log-table-body');
    const logPrevPageButton = document.getElementById('log-prev-page');
    const logNextPageButton = document.getElementById('log-next-page');
    const logPageInfo = document.getElementById('log-page-info');
    const logNoResults = document.getElementById('log-no-results');
    // Variables pour la vue Admin (Catégories)
    const categoryList = document.getElementById('category-list');
    const categoryForm = document.getElementById('category-form');
    const categoryNameInput = document.getElementById('category-name');
    const categoryAttributesInput = document.getElementById('category-attributes');
    const categoryIdEditInput = document.getElementById('category-id-edit');
    const cancelEditButton = document.getElementById('cancel-edit-button');
    const categoryFormTitle = document.getElementById('category-form-title');
    const adminFeedbackDiv = document.getElementById('admin-feedback');
    // Variables pour la vue Admin (Stock)
    const stockForm = document.getElementById('stock-form');
    const componentRefAdminInput = document.getElementById('component-ref-admin');
    const checkStockButton = document.getElementById('check-stock-button');
    const componentActionsWrapper = document.getElementById('component-actions');
    const componentInfoDiv = document.getElementById('component-info');
    const currentQuantitySpan = document.getElementById('current-quantity');
    const updateQuantityButton = document.getElementById('update-quantity-button');
    const quantityChangeInput = document.getElementById('quantity-change');
    const deleteComponentButton = document.getElementById('delete-component-button');
    const componentCategorySelectAdmin = document.getElementById('component-category-select');
    const specificAttributesDiv = document.getElementById('category-specific-attributes'); // Zone attributs dans form admin
    const componentDescInput = document.getElementById('component-desc');
    const componentMfgInput = document.getElementById('component-mfg');
    const componentDatasheetInput = document.getElementById('component-datasheet');
    const componentInitialQuantityInput = document.getElementById('component-initial-quantity');
    const componentDrawerAdminInput = document.getElementById('component-drawer-admin');
    const componentThresholdInput = document.getElementById('component-threshold');
    const saveComponentButton = document.getElementById('save-component-button');
    const exportCriticalButton = document.getElementById('export-critical-txt-button'); // *** NOUVEAU ***
    const exportCriticalFeedbackDiv = document.getElementById('export-critical-feedback'); // *** NOUVEAU ***
    // Variables pour la vue Recherche (Chat)
    const searchButtonChat = document.getElementById('search-button');
    const componentInputChat = document.getElementById('component-input');
    const responseOutputChat = document.getElementById('response-output');
    const loadingIndicatorChat = document.getElementById('loading-indicator');
    // Variables pour la vue Paramètres (Export/Import)
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
        // Considérer null, undefined ou < 0 comme seuil non défini
        threshold = (threshold === undefined || threshold === null || isNaN(threshold) || threshold < 0) ? -1 : Number(threshold);
        if (quantity <= 0) return 'critical';
        if (threshold !== -1 && quantity <= threshold) return 'warning';
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
                loginError.textContent = (error.message.includes("Invalid login credentials")) ? "Code ou mot de passe incorrect." : "Erreur de connexion.";
                loginError.style.color = 'var(--error-color)'; loginError.style.display = 'block'; loginCodeInput.focus();
            } else {
                console.log("Demande de connexion réussie pour:", data.user?.email);
                loginError.style.display = 'none'; loginCodeInput.value = ''; loginPasswordInput.value = '';
                // Le listener onAuthStateChange s'occupera de la suite (handleUserConnected)
                if (categoriesCache.length === 0) { // Pré-charger si cache vide
                    await getCategories();
                }
            }
        } catch (err) {
             console.error("Erreur JS inattendue lors de la connexion:", err);
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
            alert(`Erreur lors de la déconnexion: ${error.message}. Vérifiez la console.`);
        } else {
            console.log("Déconnexion Supabase réussie.");
             // Le listener onAuthStateChange gérera la màj de l'UI (handleUserDisconnected)
             // Actions spécifiques au logout manuel ici si nécessaire
             updateSevenSegmentForComponent(null); // Reset 7-segment
             invalidateCategoriesCache(); // Vider cache au logout
        }
    }

    // --- Gestionnaire d'état d'authentification ---
    async function setupAuthListener() {
        if (!supabase) { console.error("Listener Auth impossible: Supabase non initialisé."); return; }
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
             if (sessionError) {
                 console.error("Erreur critique getSession initiale:", sessionError);
                 // Afficher une erreur à l'utilisateur ?
             }
            activeSession = session;
            isInitialAuthCheckComplete = true; // Marquer comme complet APRES getSession

            if (session) {
                console.log("Session initiale trouvée. Traitement connexion...");
                await handleUserConnected(session.user, true); // Attendre la fin de la gestion
            } else {
                console.log("Pas de session initiale trouvée. Traitement déconnexion...");
                handleUserDisconnected(true); // Gérer l'état déconnecté
            }
        } catch (error) {
            console.error("Erreur critique lors du setupAuthListener (getSession):", error);
            isInitialAuthCheckComplete = true; // Assurer que c'est marqué complet même en cas d'erreur
            handleUserDisconnected(true); // Fallback vers état déconnecté
        }

        supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`Auth Event: ${event}`, session ? `Session pour ${session.user?.email}` : "Pas de session");
            activeSession = session; // Mettre à jour la session active

            // Ignorer les events avant la fin de la vérif initiale, SAUF SIGNED_OUT
            if (!isInitialAuthCheckComplete && event !== 'SIGNED_OUT') {
                console.log("Auth event reçu avant fin vérif initiale, ignoré pour l'instant...");
                return;
            }

            switch (event) {
                case 'SIGNED_IN':
                    await handleUserConnected(session.user, false); // Attendre la fin
                    break;
                case 'SIGNED_OUT':
                    handleUserDisconnected(false);
                    break;
                case 'TOKEN_REFRESHED':
                    console.log("Token rafraîchi.");
                    // Vérifier si l'utilisateur local correspond à la session (rare mais possible)
                    if (session && (!currentUser || session.user.id !== currentUser.id)) {
                        console.log("Token rafraîchi, mais l'utilisateur semble avoir changé. Mise à jour...");
                        await handleUserConnected(session.user, false);
                    } else if (!session && currentUser) {
                         console.log("Token rafraîchi mais session absente maintenant. Déconnexion locale...");
                         handleUserDisconnected(false);
                    }
                    break;
                case 'USER_UPDATED':
                    console.log("Infos utilisateur mises à jour par Supabase:", session?.user);
                    if (session) await handleUserConnected(session.user, false); // Re-traiter comme connexion
                    break;
                case 'PASSWORD_RECOVERY':
                    console.log("Événement de récupération de mot de passe reçu.");
                    // Peut-être afficher un message à l'utilisateur
                    break;
                case 'INITIAL_SESSION':
                     console.log("Événement INITIAL_SESSION ignoré (géré par getSession au démarrage).");
                     break;
                default:
                    console.log("Événement Auth non géré explicitement:", event);
            }
        });
    }

    // --- Mise à jour UI/État pour Authentification ---
    async function handleUserConnected(user, isInitialLoad) {
        const userChanged = !currentUser || user.id !== currentUser.id;
        currentUser = user;
        currentUserCode = currentUser.email.split('@')[0].toLowerCase();
        console.log(`Utilisateur connecté: ${currentUserCode} (ID: ${currentUser.id})${isInitialLoad ? ' [Chargement Initial]' : ''}${userChanged ? ' [Utilisateur Changé]' : ''}`);

        document.body.classList.add('user-logged-in');
        if(loginArea) loginArea.style.display = 'none';
        if(userInfoArea) userInfoArea.style.display = 'flex';
        if(userDisplay) userDisplay.textContent = currentUserCode.toUpperCase();
        if(loginError) loginError.style.display = 'none';

        // Activation des boutons protégés (Log, Admin)
        [logTabButton, adminTabButton].forEach(btn => {
            if (btn) { btn.style.display = 'inline-block'; btn.disabled = false; btn.title = ''; }
        });

        // Gestion spécifique bouton Paramètres (réservé à 'zine')
        const canAccessSettings = currentUserCode === 'zine';
        if (settingsTabButton) {
            settingsTabButton.style.display = canAccessSettings ? 'inline-block' : 'none';
            settingsTabButton.disabled = !canAccessSettings;
            settingsTabButton.title = canAccessSettings ? '' : 'Accès réservé à l\'administrateur';
            console.log(`Accès Paramètres ${canAccessSettings ? 'autorisé' : 'refusé'} pour '${currentUserCode}'.`);
        }

        // Si l'utilisateur non autorisé est sur la vue Paramètres, rediriger
        const activeView = document.querySelector('main.view-section.active-view');
        if (!canAccessSettings && activeView === settingsView) {
            console.log("Redirection depuis Paramètres car utilisateur non autorisé.");
            setActiveView(searchView, searchTabButton); // Redirection vers vue par défaut (Recherche)
        }

        // Rechargement des données et caches si nécessaire
        if (userChanged || !isInitialLoad) {
            console.log("Rechargement données/caches suite à connexion/changement utilisateur...");
             if (userChanged) {
                invalidateCategoriesCache(); // Vider si l'utilisateur change
                if (searchView?.classList.contains('active-view')) {
                    displayWelcomeMessage(); // Réinitialiser chat si utilisateur change
                }
             }
             // Toujours recharger les catégories si cache vide ou après changement user
             if(categoriesCache.length === 0 || userChanged) {
                 await getCategories();
             }
             // Recharger les données de la vue active (sauf si settings et pas autorisé)
             const currentActiveView = activeView || document.querySelector('main.view-section.active-view');
             if (currentActiveView && !(currentActiveView === settingsView && !canAccessSettings)) {
                 await reloadActiveViewData(currentActiveView);
             }
        } else if (isInitialLoad) { // Chargement initial avec session existante
            console.log("Chargement initial avec session, chargement données vue active...");
             if(categoriesCache.length === 0) { await getCategories(); }
             const currentActiveView = activeView || document.querySelector('main.view-section.active-view');
             if (!currentActiveView) {
                 setActiveView(searchView, searchTabButton); // Vue par défaut si rien n'est actif
             } else if (!(currentActiveView === settingsView && !canAccessSettings)) {
                 await reloadActiveViewData(currentActiveView);
             }
        }
        // Pas besoin de màj 7-segment ici, fait par les actions spécifiques
    }

    function handleUserDisconnected(isInitialLoad) {
        const wasConnected = !!currentUser;
        console.log(`Utilisateur déconnecté.${isInitialLoad ? ' [Chargement Initial]' : ''}`);
        currentUser = null;
        currentUserCode = null;
        document.body.classList.remove('user-logged-in');
        if(userInfoArea) userInfoArea.style.display = 'none';
        if(loginArea) loginArea.style.display = 'flex';
        protectedButtons.forEach(btn => {
            btn.style.display = 'none'; btn.disabled = true; btn.title = 'Connexion requise';
        });

        hideQuantityModal(); // Fermer modale si ouverte
        updateSevenSegmentForComponent(null); // Éteindre 7-segment

        // Invalider cache et vider données si c'était une déconnexion active
        if (wasConnected && !isInitialLoad) {
            console.log("Déconnexion active, nettoyage des données protégées et caches...");
            invalidateCategoriesCache();
            clearProtectedViewData(); // Vider tables, forms, filtres, etc.
             if (searchView?.classList.contains('active-view') && chatHistory.length > 0) {
                 displayWelcomeMessage(); // Afficher message accueil chat après déco
             }
        }

        // Rediriger si sur une vue protégée ou si aucune vue active au chargement initial
        const activeView = document.querySelector('main.view-section.active-view');
        const isProtectedViewActive = activeView && ['log-view', 'admin-view', 'settings-view'].includes(activeView.id);

        if (isProtectedViewActive) {
            console.log("Redirection vers vue recherche car déconnecté d'une vue protégée.");
            setActiveView(searchView, searchTabButton);
        } else if (isInitialLoad && !activeView) { // Au chargement initial sans session et sans vue active -> vue recherche
             console.log("Chargement initial sans session, activation vue recherche.");
             setActiveView(searchView, searchTabButton);
        } else if (!activeView) { // Fallback si aucune vue n'est active
             console.warn("Aucune vue active détectée après déconnexion, activation vue recherche.");
             setActiveView(searchView, searchTabButton);
        }
    }

    // Helper pour recharger les données de la vue active
    async function reloadActiveViewData(viewElement) {
         if (!viewElement) return;
         const viewId = viewElement.id;
         const canAccessSettings = currentUserCode === 'zine';
         console.log(`Reloading data for active view: ${viewId}`);
         try {
             if (viewId === 'inventory-view') { await populateInventoryFilters(); await displayInventory(); }
             else if (viewId === 'log-view' && currentUser) { await displayLog(); }
             else if (viewId === 'admin-view' && currentUser) { await loadAdminData(); }
             else if (viewId === 'settings-view' && canAccessSettings) { loadSettingsData(); }
             else if (viewId === 'search-view' && chatHistory.length === 0) { displayWelcomeMessage(); }
         } catch (error) {
             console.error(`Erreur lors du rechargement des données pour la vue ${viewId}:`, error);
             // Afficher une erreur générique ou spécifique à la vue
             showGenericError(`Erreur chargement données pour ${viewId}.`);
         }
    }

    function showGenericError(message) {
        // Peut-être afficher dans une zone de feedback générale ou utiliser alert() en dernier recours
        console.error("Erreur Générique UI:", message);
        // alert(message); // Éviter alert si possible
    }


    function clearProtectedViewData() {
        // Vue Inventaire
        if(inventoryTableBody) inventoryTableBody.innerHTML = '';
        if(attributeFiltersContainer) attributeFiltersContainer.innerHTML = ''; // Vider filtres attributs
        if(inventoryCategoryFilter) inventoryCategoryFilter.value = 'all';
        if(inventorySearchFilter) inventorySearchFilter.value = '';
        if(inventoryPageInfo) inventoryPageInfo.textContent = 'Page - / -';
        if(inventoryPrevPageButton) inventoryPrevPageButton.disabled = true;
        if(inventoryNextPageButton) inventoryNextPageButton.disabled = true;
        if(inventoryNoResults) inventoryNoResults.style.display = 'none';

        // Vue Log
        if(logTableBody) logTableBody.innerHTML = '';
        if(logPageInfo) logPageInfo.textContent = 'Page - / -';
        if(logPrevPageButton) logPrevPageButton.disabled = true;
        if(logNextPageButton) logNextPageButton.disabled = true;
        if(logNoResults) logNoResults.style.display = 'none';

        // Vue Admin
        if (categoryList) categoryList.innerHTML = '';
        resetCategoryForm();
        resetStockForm();
        if (componentActionsWrapper) componentActionsWrapper.style.display = 'none';
        if (adminFeedbackDiv) { adminFeedbackDiv.style.display = 'none'; adminFeedbackDiv.textContent = ''; adminFeedbackDiv.className = 'feedback-area'; }
        if (exportCriticalFeedbackDiv) { exportCriticalFeedbackDiv.style.display = 'none'; exportCriticalFeedbackDiv.textContent = ''; exportCriticalFeedbackDiv.className = 'feedback-area'; } // *** NOUVEAU ***

        // Vue Settings
        if (exportFeedbackDiv) { exportFeedbackDiv.style.display = 'none'; exportFeedbackDiv.textContent = ''; exportFeedbackDiv.className = 'feedback-area'; }
        if (importFeedbackDiv) { importFeedbackDiv.style.display = 'none'; importFeedbackDiv.textContent = ''; importFeedbackDiv.className = 'feedback-area'; }
        if(importCsvFileInput) importCsvFileInput.value = '';
        const enrichRadio = document.getElementById('import-mode-enrich');
        if (enrichRadio) enrichRadio.checked = true; // Reset import mode

        console.log("Données des vues protégées et filtres inventaire effacés.");
    }

    // --- Navigation ---
    async function setActiveView(viewToShow, buttonToActivate){
        if (!viewToShow) { viewToShow = searchView; buttonToActivate = searchTabButton; console.warn("setActiveView: Vue invalide, retour à la recherche.");}
        if (viewToShow.classList.contains('active-view')) { console.log(`Vue ${viewToShow.id} déjà active.`); return; }

        const canAccessSettings = currentUserCode === 'zine';
        const isSettingsView = viewToShow === settingsView;
        const isProtectedView = ['log-view', 'admin-view'].includes(viewToShow.id) || isSettingsView; // Settings est aussi protégé

        // Vérification Accès
        if (isProtectedView && !currentUser) {
             console.warn(`Accès refusé: ${viewToShow.id} nécessite connexion.`);
             if (loginError) { loginError.textContent="Connexion requise pour accéder à cette section."; loginError.style.color = 'var(--error-color)'; loginError.style.display='block';}
             loginCodeInput?.focus();
             return; // Bloquer
        }
        if (isSettingsView && !canAccessSettings) {
            console.warn(`Accès refusé: La vue Paramètres (${settingsView.id}) est réservée à 'zine'. Utilisateur: ${currentUserCode}`);
            alert("Accès à la section Paramètres réservé à l'administrateur.");
            return; // Bloquer
        }

        // Changer la vue active
        viewSections.forEach(section => { section.style.display = 'none'; section.classList.remove('active-view'); });
        document.querySelectorAll('.nav-button').forEach(button => { button.classList.remove('active'); });

        viewToShow.style.display = 'block';
        viewToShow.classList.add('active-view');
        if (buttonToActivate) { buttonToActivate.classList.add('active'); }
        else { const matchingButton = document.getElementById(`show-${viewToShow.id}`); if (matchingButton) matchingButton.classList.add('active'); }
        console.log(`Activation vue: ${viewToShow.id}`);

        // Charger les données spécifiques à la vue
        await reloadActiveViewData(viewToShow);
    }

    // --- LOGIQUE INVENTAIRE ---

    // Met à jour l'UI des filtres d'attributs basés sur la catégorie sélectionnée
    async function updateAttributeFiltersUI() {
        if (!attributeFiltersContainer || !inventoryCategoryFilter || !supabase) {
            console.warn("updateAttributeFiltersUI: Prérequis manquants.");
            if(attributeFiltersContainer) attributeFiltersContainer.innerHTML = ''; // Nettoyer
            return;
        }
        const categoryId = inventoryCategoryFilter.value;
        attributeFiltersContainer.innerHTML = ''; // Toujours vider

        if (!categoryId || categoryId === 'all') {
            console.log("Aucune catégorie sélectionnée, pas de filtres d'attributs.");
            return;
        }

        const category = categoriesCache.find(cat => cat.id.toString() === categoryId);
        const attributeNames = category?.attributes;

        if (!attributeNames || attributeNames.length === 0) {
            console.log(`Catégorie ID ${categoryId} n'a pas d'attributs définis.`);
            return;
        }

        console.log(`Génération filtres pour attributs: ${attributeNames.join(', ')} (Cat ID: ${categoryId})`);
        attributeFiltersContainer.innerHTML = '<i><small>Chargement valeurs attributs...</small></i>';

        try {
            // Récupérer les attributs de TOUS les composants de cette catégorie
            // Note: Potentiellement lourd si beaucoup de composants. Une vue matérialisée ou une table dédiée aux valeurs d'attributs serait mieux.
            const { data: components, error: componentsError } = await supabase
                .from('inventory')
                .select('attributes')
                .eq('category_id', categoryId)
                .not('attributes', 'is', null); // Uniquement ceux qui ont des attributs

            if (componentsError) throw new Error(`Erreur DB récupération attributs: ${componentsError.message}`);
            if (!components || components.length === 0) { attributeFiltersContainer.innerHTML = '<i><small>Aucun composant avec attributs dans cette catégorie.</small></i>'; return; }

            const uniqueValuesPerAttribute = {};
            attributeNames.forEach(attrName => { uniqueValuesPerAttribute[attrName] = new Set(); });

            components.forEach(component => {
                if (component.attributes && typeof component.attributes === 'object') {
                    attributeNames.forEach(attrName => {
                        const value = component.attributes[attrName];
                        if (value !== undefined && value !== null && value !== '') {
                            uniqueValuesPerAttribute[attrName].add(value.toString());
                        }
                    });
                }
            });

            attributeFiltersContainer.innerHTML = ''; // Vider chargement
            let hasFiltersToShow = false;

            attributeNames.forEach(attrName => {
                const uniqueValues = Array.from(uniqueValuesPerAttribute[attrName]).sort((a,b) => a.localeCompare(b, undefined, {numeric: true, sensitivity: 'base'}));

                if (uniqueValues.length > 0) {
                    hasFiltersToShow = true;
                    const formGroup = document.createElement('div');
                    formGroup.className = 'form-group';

                    const label = document.createElement('label');
                    const inputId = `filter-attr-${attrName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
                    label.htmlFor = inputId;
                    label.textContent = `${attrName}:`;

                    const select = document.createElement('select');
                    select.id = inputId;
                    select.dataset.attributeName = attrName;

                    select.innerHTML = `<option value="all">Tous</option>` +
                                       uniqueValues.map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('');

                    formGroup.appendChild(label);
                    formGroup.appendChild(select);
                    attributeFiltersContainer.appendChild(formGroup);
                }
            });

             if (!hasFiltersToShow) attributeFiltersContainer.innerHTML = '<i><small>Aucune valeur d\'attribut à filtrer trouvée.</small></i>';

        } catch (error) {
            console.error("Erreur maj filtres attributs:", error);
            attributeFiltersContainer.innerHTML = `<i style="color:var(--error-color)"><small>Erreur chargement filtres.</small></i>`;
        }
    }

    // Helper simple pour échapper HTML dans les options des selects
    function escapeHtml(unsafe) {
      if (!unsafe) return "";
      return unsafe
           .toString()
           .replace(/&/g, "&amp;")
           .replace(/</g, "&lt;")
           .replace(/>/g, "&gt;")
           .replace(/"/g, "&quot;")
           .replace(/'/g, "&#039;");
     }


    // Peuple le select des catégories et déclenche la maj des filtres attributs
    async function populateInventoryFilters() {
        if (!inventoryCategoryFilter) return;
        const currentVal = inventoryCategoryFilter.value;
        inventoryCategoryFilter.innerHTML = '<option value="all">Toutes</option>';
        try {
            const categories = await getCategories(); // Assure cache à jour
            if (categories && categories.length > 0) {
                categories.forEach(cat => { // Tri déjà fait dans getCategories
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
            }
        } catch (error) {
            console.error("Erreur remplissage filtre catégorie:", error);
        } finally {
             // Mettre à jour les filtres attributs après avoir peuplé les catégories
             await updateAttributeFiltersUI();
        }
    }

    // Affiche l'inventaire en appliquant tous les filtres actifs
    async function displayInventory(page = 1) {
        currentInventoryPage = page;
        if (!inventoryTableBody || !supabase || !attributeFiltersContainer) {
             console.warn("displayInventory: Prérequis manquants."); return;
        }
        inventoryTableBody.innerHTML = '<tr class="loading-row"><td colspan="7" style="text-align:center;"><i>Chargement...</i></td></tr>';
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
                .select('ref, description, quantity, datasheet, drawer, critical_threshold, category_id, attributes', { count: 'exact' });

            // 1. Filtre Catégorie
            const categoryValue = inventoryCategoryFilter?.value || 'all';
            if (categoryValue !== 'all') {
                 query = query.eq('category_id', categoryValue);
            }

            // 2. Filtre Recherche Texte
            const searchValue = inventorySearchFilter?.value.trim() || '';
            if (searchValue) {
                 // Recherche simple (insensible casse) dans ref, desc, et la valeur de l'attribut 'Type'
                 const searchPattern = `%${searchValue}%`;
                 query = query.or(
                     `ref.ilike.${searchPattern},` +
                     `description.ilike.${searchPattern},` +
                     `attributes->>Type.ilike.${searchPattern}` // ->> pour cast en text
                 );
            }

            // 3. Filtres d'Attributs Dynamiques
            const attributeFilterSelects = attributeFiltersContainer.querySelectorAll('select');
            attributeFilterSelects.forEach(selectElement => {
                const attributeName = selectElement.dataset.attributeName;
                const selectedValue = selectElement.value;
                if (attributeName && selectedValue !== 'all') {
                     console.log(`Filtering by attribute: ${attributeName} = ${selectedValue}`);
                     // Utiliser .contains() pour JSONB. La valeur doit correspondre exactement.
                     // Assurer que la valeur est du bon type si possible (ex: nombre vs string)
                     // Pour l'instant, on traite comme string (valeur du select)
                     query = query.contains('attributes', { [attributeName]: selectedValue });
                }
            });

            // Appliquer l'ordre et la pagination
            query = query.order('ref', { ascending: true }).range(startIndex, endIndex);

            // Exécuter la requête
            console.log("Executing inventory query..."); // Éviter de logguer l'objet query entier (peut être gros)
            const { data, error, count } = await query;

            inventoryTableBody.innerHTML = '';
            if (error) { throw new Error(`Erreur DB inventaire: ${error.message}`); }

            const totalItems = count || 0;
            const totalPages = Math.ceil(totalItems / itemsPerPage);

            if (totalItems === 0) {
                if(inventoryNoResults) {
                     inventoryNoResults.textContent = `Aucun composant trouvé pour les filtres sélectionnés.`;
                     inventoryNoResults.style.display = 'block';
                }
                if(inventoryPageInfo) inventoryPageInfo.textContent = 'Page 0 / 0';
            } else {
                if(inventoryNoResults) inventoryNoResults.style.display = 'none';
                if (categoriesCache.length === 0 && data.some(item => item.category_id)) { await getCategories(); }
                const categoryNameMap = new Map(categoriesCache.map(cat => [cat.id, cat.name]));

                data.forEach(item => {
                    const row = inventoryTableBody.insertRow();
                    row.dataset.ref = item.ref;
                    row.dataset.attributes = item.attributes ? JSON.stringify(item.attributes) : '{}';
                    row.classList.add('inventory-item-row');

                    const refCell = row.insertCell();
                    const status = getStockStatus(item.quantity, item.critical_threshold);
                    const indicatorSpan = document.createElement('span');
                    indicatorSpan.classList.add('stock-indicator', `level-${status}`);
                    indicatorSpan.title = `Stock: ${status.toUpperCase()} (Qté: ${item.quantity}, Seuil: ${item.critical_threshold ?? 'N/A'})`;
                    refCell.appendChild(indicatorSpan);
                    refCell.appendChild(document.createTextNode(" " + item.ref));

                    row.insertCell().textContent = item.description || '-';
                    row.insertCell().textContent = categoryNameMap.get(item.category_id) || 'N/A';
                    const typeAttribute = item.attributes?.Type || '-'; // Utiliser l'attribut 'Type'
                    row.insertCell().textContent = typeAttribute;
                    row.insertCell().textContent = item.drawer || '-'; // CSS gère affichage
                    row.insertCell().textContent = item.quantity;
                    const dsCell = row.insertCell();
                    if (item.datasheet) {
                        try {
                            new URL(item.datasheet);
                            const link = document.createElement('a'); link.href = item.datasheet; link.textContent = 'Voir'; link.target = '_blank'; link.rel = 'noopener noreferrer'; dsCell.appendChild(link);
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
            if(inventoryNoResults) { inventoryNoResults.textContent = 'Erreur lors du chargement.'; inventoryNoResults.style.display = 'block'; }
        }
    }


    // --- LOGIQUE HISTORIQUE ---
    async function displayLog(page = 1) {
        if (!currentUser) { console.warn("displayLog: Non connecté."); clearProtectedViewData(); return; }
        currentLogPage = page;
        if (!logTableBody || !supabase) { console.warn("displayLog: Prérequis manquants."); return; }
        logTableBody.innerHTML = '<tr class="loading-row"><td colspan="6" style="text-align:center;"><i>Chargement historique...</i></td></tr>';
        if(logNoResults) logNoResults.style.display = 'none';
        if(logPrevPageButton) logPrevPageButton.disabled = true;
        if(logNextPageButton) logNextPageButton.disabled = true;
        if(logPageInfo) logPageInfo.textContent = 'Chargement...';

        const itemsPerPage = ITEMS_PER_PAGE;
        const startIndex = (currentLogPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage - 1;

        try {
            const { data, error, count } = await supabase
                .from('logs')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(startIndex, endIndex);

            logTableBody.innerHTML = '';
            if (error) { throw new Error(`Erreur DB logs: ${error.message}`); }

            const totalItems = count || 0;
            const totalPages = Math.ceil(totalItems / itemsPerPage);

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
                    const isPositive = entry.quantity_change > 0;
                    actionCell.textContent = isPositive ? 'Ajout' : 'Retrait';
                    actionCell.classList.add(isPositive ? 'positive' : 'negative');
                    row.insertCell().textContent = entry.component_ref;
                    const changeCell = row.insertCell();
                    changeCell.textContent = isPositive ? `+${entry.quantity_change}` : `${entry.quantity_change}`;
                    changeCell.classList.add(isPositive ? 'positive' : 'negative');
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
            if(logNoResults) { logNoResults.textContent = 'Erreur lors du chargement.'; logNoResults.style.display = 'block'; }
        }
    }

    function formatLogTimestamp(date) { try { return date.toLocaleString('fr-CA', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(',', ''); } catch(e) { console.warn("formatLogTimestamp failed:", e); return date.toISOString(); } }

    async function addLogEntry(itemRef, change, newQuantity) {
        if (!currentUser || !currentUserCode || !supabase) {
            console.warn("[addLogEntry] Log annulé: infos utilisateur/supabase manquantes."); return;
        }
        const logData = { user_id: currentUser.id, user_code: currentUserCode.toUpperCase(), component_ref: itemRef, quantity_change: change, quantity_after: newQuantity };
        console.log("[addLogEntry] Insertion log:", logData);
        try {
            const { error: logError } = await supabase.from('logs').insert(logData);
            if (logError) {
                console.error("[addLogEntry] Erreur écriture log Supabase:", logError);
                 if (logError.message.includes("violates row-level security policy")) console.error("[addLogEntry] Problème RLS détecté sur la table 'logs'.");
            } else {
                console.log("[addLogEntry] Log enregistré.");
                if (logView?.classList.contains('active-view') && currentLogPage === 1) { displayLog(1); }
            }
        } catch (err) { console.error("[addLogEntry] Erreur JS inattendue:", err); }
    }

    // --- VUE ADMIN ---
    async function getCategories() {
        if (categoriesCache.length > 0) return categoriesCache;
        if (!supabase) { console.error("getCategories: Supabase non initialisé."); return []; }
        console.log("Fetching categories from Supabase...");
        try {
            const { data, error } = await supabase.from('categories').select('id, name, attributes').order('name', { ascending: true });
            if (error) throw new Error(`Erreur DB chargement catégories: ${error.message}`);
            categoriesCache = data || [];
            categoriesCache.forEach(cat => {
                 if (typeof cat.attributes === 'string' && cat.attributes.trim()) { cat.attributes = cat.attributes.split(',').map(a => a.trim()).filter(a => a); }
                 else if (Array.isArray(cat.attributes)) { cat.attributes = cat.attributes.map(a => String(a || '').trim()).filter(a => a); }
                 else { cat.attributes = []; }
             });
            console.log(`Categories fetched and cached: ${categoriesCache.length}.`);
            return categoriesCache;
        } catch (err) {
            console.error("Erreur lecture/traitement catégories:", err);
            if (adminView?.classList.contains('active-view')) showAdminFeedback(`Erreur chargement catégories: ${err.message}`, 'error');
            return [];
        }
    }
    function invalidateCategoriesCache() { categoriesCache=[];console.log("Cache catégories invalidé.");}
    async function loadAdminData() { if(!currentUser){console.warn("loadAdminData: Non connecté.");return;}const catManager=document.getElementById('category-manager');const stockManager=document.getElementById('stock-manager');if(catManager)catManager.style.display='block';if(stockManager)stockManager.style.display='block';if(adminFeedbackDiv){adminFeedbackDiv.style.display='none';adminFeedbackDiv.textContent='';}resetStockForm();try{await loadCategoriesAdmin();}catch(error){console.error("Erreur loadAdminData:",error);showAdminFeedback(`Erreur chargement données admin: ${error.message}`,'error');}}
    async function loadCategoriesAdmin() { if(!categoryList || !componentCategorySelectAdmin){console.warn("loadCategoriesAdmin: DOM manquant."); return;}categoryList.innerHTML='<li><i>Chargement...</i></li>';componentCategorySelectAdmin.innerHTML='<option value="">Chargement...</option>';try{const categories=await getCategories();categoryList.innerHTML='';componentCategorySelectAdmin.innerHTML='<option value="">-- Sélectionner --</option>';if(categories&&categories.length>0){categories.forEach(cat=>{const li=document.createElement('li');li.dataset.categoryId=cat.id;li.innerHTML=`<span>${escapeHtml(cat.name)}</span><span class="category-actions"><button class="edit-cat" title="Modifier ${escapeHtml(cat.name)}">Modif</button> <button class="delete-cat" title="Supprimer ${escapeHtml(cat.name)}">Suppr.</button></span>`;categoryList.appendChild(li);const option=document.createElement('option');option.value=cat.id;option.textContent=escapeHtml(cat.name);option.dataset.attributes=JSON.stringify(cat.attributes || []); componentCategorySelectAdmin.appendChild(option);});}else{categoryList.innerHTML='<li>Aucune catégorie définie.</li>';componentCategorySelectAdmin.innerHTML='<option value="">Aucune catégorie</option>';}}catch(error){console.error("Erreur loadCategoriesAdmin:",error);categoryList.innerHTML='<li>Erreur chargement.</li>';componentCategorySelectAdmin.innerHTML='<option value="">Erreur</option>';showAdminFeedback(`Erreur chargement catégories admin: ${error.message}`, 'error');}}
    function addCategoryEventListeners() { if (!categoryList) return; categoryList.addEventListener('click',async(event)=>{const targetButton=event.target.closest('button');if(!targetButton)return;const listItem=targetButton.closest('li[data-category-id]');if(!listItem)return;const categoryId=listItem.dataset.categoryId;if(!categoryId||!supabase)return;const category=categoriesCache.find(c=>c.id.toString()===categoryId);if(!category){console.error(`Cat ID ${categoryId} non trouvée cache.`);showAdminFeedback('Erreur interne: Cat non trouvée.','error');return;}if(targetButton.classList.contains('edit-cat')){if(categoryIdEditInput)categoryIdEditInput.value=category.id;if(categoryNameInput)categoryNameInput.value=category.name;if(categoryAttributesInput)categoryAttributesInput.value=(category.attributes || []).join(', ');if(categoryFormTitle)categoryFormTitle.textContent=`Modifier: ${category.name}`;if(cancelEditButton)cancelEditButton.style.display='inline-block';categoryNameInput?.focus();showAdminFeedback(`Modification de "${category.name}"...`,'info');}else if(targetButton.classList.contains('delete-cat')){if(!confirm(`Vraiment supprimer la catégorie "${category.name}" ?`))return;showAdminFeedback(`Suppression de "${category.name}"...`,"info");listItem.querySelectorAll('button').forEach(b=>b.disabled=true);try{const{count:componentCount,error:countError}=await supabase.from('inventory').select('*',{count:'exact',head:true}).eq('category_id',categoryId);if(countError)throw new Error(`Erreur vérif composants: ${countError.message}`);if(componentCount>0){if(!confirm(`ATTENTION: ${componentCount} composant(s) utilise(nt) "${category.name}".\nContinuer dissociera ces composants.\nVoulez-vous continuer ?`)){throw new Error("Suppression annulée.");}const{error:updateError}=await supabase.from('inventory').update({category_id:null}).eq('category_id',categoryId);if(updateError)throw new Error(`Erreur dissociation: ${updateError.message}`);console.log(`${componentCount} composant(s) dissocié(s).`);}const{error:deleteError}=await supabase.from('categories').delete().eq('id',categoryId);if(deleteError)throw new Error(`Erreur DB suppression: ${deleteError.message}`);showAdminFeedback(`Catégorie "${category.name}" supprimée.`,'success');invalidateCategoriesCache();await loadCategoriesAdmin();if(categoryIdEditInput?.value===categoryId)resetCategoryForm();await populateInventoryFilters();}catch(err){console.error("Erreur suppression cat:",err);showAdminFeedback(`Erreur suppression: ${err.message}`,'error');listItem.querySelectorAll('button').forEach(b=>b.disabled=false);}}});cancelEditButton?.addEventListener('click',resetCategoryForm);categoryForm?.addEventListener('submit',async(event)=>{event.preventDefault();if(!supabase)return;const catName=categoryNameInput?.value.trim();const catAttributesStr=categoryAttributesInput?.value.trim();const editingId=categoryIdEditInput?.value;if(!catName){showAdminFeedback("Le nom est obligatoire.",'error');categoryNameInput?.focus();return;}const attributesArray=catAttributesStr?catAttributesStr.split(',').map(attr=>attr.trim()).filter(attr=>attr):[];const categoryData={name:catName,attributes:attributesArray.length > 0 ? attributesArray : null};showAdminFeedback("Enregistrement...","info");const saveBtn=document.getElementById('save-category-button');if(saveBtn)saveBtn.disabled=true;if(cancelEditButton)cancelEditButton.disabled=true;try{let response;if(editingId){response=await supabase.from('categories').update(categoryData).eq('id',editingId).select().single();}else{response=await supabase.from('categories').insert(categoryData).select().single();}const{data,error}=response;if(error){if(error.code==='23505')showAdminFeedback(`Erreur: Nom "${catName}" existe déjà.`,'error');else throw new Error(`Erreur DB: ${error.message}`);}else{showAdminFeedback(`Catégorie "${data.name}" ${editingId?'modifiée':'ajoutée'}.`,'success');invalidateCategoriesCache();await loadCategoriesAdmin();resetCategoryForm();await populateInventoryFilters();}}catch(err){console.error("Erreur enregistrement cat:",err);showAdminFeedback(`Erreur: ${err.message}`,'error');}finally{if(saveBtn)saveBtn.disabled=false;if(cancelEditButton&&categoryIdEditInput?.value)cancelEditButton.disabled=false;}});}
    function resetCategoryForm(){ if(categoryForm)categoryForm.reset();if(categoryIdEditInput)categoryIdEditInput.value='';if(categoryFormTitle)categoryFormTitle.textContent="Ajouter une Catégorie";if(cancelEditButton)cancelEditButton.style.display='none';if(adminFeedbackDiv && adminFeedbackDiv.classList.contains('info')) adminFeedbackDiv.style.display='none';}

    // Affiche les champs d'attributs dans le formulaire Admin
    function renderSpecificAttributes(attributes, categoryName, existingValues = {}) {
        if (!specificAttributesDiv) { console.error("Conteneur #category-specific-attributes non trouvé."); return;}
        specificAttributesDiv.innerHTML = ''; specificAttributesDiv.style.display = 'none';
        if (Array.isArray(attributes) && attributes.length > 0) {
            console.log(`Rendu admin pour ${attributes.length} attributs de ${categoryName}. Valeurs:`, existingValues);
            specificAttributesDiv.style.display = 'block';
            const titleElement = document.createElement('h4');
            titleElement.textContent = `Attributs Spécifiques (${escapeHtml(categoryName)})`;
            specificAttributesDiv.appendChild(titleElement);
            attributes.forEach(attr => {
                if (typeof attr !== 'string' || !attr.trim()) { console.warn("Attribut invalide ignoré (admin):", attr); return; }
                const cleanAttrName = attr.trim();
                const formGroup = document.createElement('div');formGroup.classList.add('form-group');
                const inputId = `attr-${cleanAttrName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
                const label = document.createElement('label');label.setAttribute('for', inputId);label.textContent = `${escapeHtml(cleanAttrName)}:`;
                const input = document.createElement('input');input.setAttribute('type', 'text');input.setAttribute('id', inputId);input.setAttribute('name', `attributes[${escapeHtml(cleanAttrName)}]`);input.setAttribute('placeholder', `Valeur pour ${escapeHtml(cleanAttrName)}`);input.dataset.attributeName = cleanAttrName;
                 if (existingValues && existingValues[cleanAttrName] !== undefined && existingValues[cleanAttrName] !== null) { input.value = existingValues[cleanAttrName]; }
                formGroup.appendChild(label);formGroup.appendChild(input);specificAttributesDiv.appendChild(formGroup);
            });
        }
    }

    // Listener pour le select de catégorie Admin
    function addComponentCategorySelectListener() {
        componentCategorySelectAdmin?.addEventListener('change', () => {
            const selectedOption = componentCategorySelectAdmin.options[componentCategorySelectAdmin.selectedIndex];
            if (!selectedOption || !selectedOption.value) { renderSpecificAttributes([], ''); return; }
            const attributesJson = selectedOption.dataset.attributes;
            const categoryName = selectedOption.textContent; let attributes = [];
            try { attributes = attributesJson ? JSON.parse(attributesJson) : []; if (!Array.isArray(attributes)) attributes = []; }
            catch (e) { console.error("Erreur parsing attributs JSON catégorie:", e, attributesJson); }
            // Afficher les nouveaux champs, mais vides. Ils seront remplis par checkStock si un composant est chargé.
            renderSpecificAttributes(attributes, categoryName, {});
        });
    }

    function showAdminFeedback(message, type = 'info'){ if(adminFeedbackDiv){adminFeedbackDiv.textContent=message;adminFeedbackDiv.className=`feedback-area ${type}`;adminFeedbackDiv.style.display='block';}}

    function resetStockForm() {
        if (stockForm) stockForm.reset();
        if (componentActionsWrapper) componentActionsWrapper.style.display = 'none';
        if (deleteComponentButton) deleteComponentButton.style.display = 'none';
        if (specificAttributesDiv) { specificAttributesDiv.innerHTML = ''; specificAttributesDiv.style.display = 'none'; }
        if (componentRefAdminInput) componentRefAdminInput.disabled = false; componentRefAdminInput.value = ''; // Aussi vider la ref
        if (componentInitialQuantityInput) componentInitialQuantityInput.value = 0;
        if (componentThresholdInput) componentThresholdInput.value = '';
        if (adminFeedbackDiv && !adminFeedbackDiv.classList.contains('error')) adminFeedbackDiv.style.display='none'; // Cacher feedback non-erreur
        // Vider aussi le feedback de l'export critique s'il existe
        if (exportCriticalFeedbackDiv) { exportCriticalFeedbackDiv.style.display = 'none'; exportCriticalFeedbackDiv.textContent = ''; exportCriticalFeedbackDiv.className = 'feedback-area'; }
        if (componentCategorySelectAdmin) componentCategorySelectAdmin.value = "";
        if (currentQuantitySpan) currentQuantitySpan.textContent = "N/A";
        if (quantityChangeInput) quantityChangeInput.value = 0;
        console.log("Formulaire admin stock réinitialisé.");
    }

    function addStockEventListeners() {
        checkStockButton?.addEventListener('click', async () => {
            const ref = componentRefAdminInput?.value.trim().toUpperCase();
            if (!ref) { showAdminFeedback("Entrez une référence à vérifier.", 'warning'); componentRefAdminInput?.focus(); return; }
            if (adminFeedbackDiv && !adminFeedbackDiv.classList.contains('error')) adminFeedbackDiv.style.display = 'none';
            checkStockButton.disabled = true; checkStockButton.textContent = "Vérif...";
            componentRefAdminInput.disabled = true;
            componentActionsWrapper.style.display = 'none';
            deleteComponentButton.style.display = 'none';
            resetStockForm(); // Nettoyer avant de remplir (sauf ref)
            componentRefAdminInput.value = ref;

            try {
                const stockInfo = await getStockInfoFromSupabase(ref);
                if (stockInfo) {
                    console.log("Stock info admin:", stockInfo);
                    componentActionsWrapper.style.display = 'block';
                    currentQuantitySpan.textContent = stockInfo.quantity;
                    quantityChangeInput.value = 0;
                    componentDescInput.value = stockInfo.description || "";
                    componentMfgInput.value = stockInfo.manufacturer || "";
                    componentDatasheetInput.value = stockInfo.datasheet || "";
                    componentDrawerAdminInput.value = stockInfo.drawer || "";
                    componentInitialQuantityInput.value = stockInfo.quantity;
                    componentThresholdInput.value = stockInfo.critical_threshold ?? '';

                    let attributesDefinition = []; let categoryNameToRender = 'N/A';
                    if (componentCategorySelectAdmin) {
                        componentCategorySelectAdmin.value = stockInfo.category_id || "";
                        const selectedOption = componentCategorySelectAdmin.options[componentCategorySelectAdmin.selectedIndex];
                        if (selectedOption && selectedOption.value) {
                             const attributesJson = selectedOption.dataset.attributes;
                             categoryNameToRender = selectedOption.textContent;
                             try { attributesDefinition = attributesJson ? JSON.parse(attributesJson) : []; if(!Array.isArray(attributesDefinition)) attributesDefinition = []; }
                             catch(e) { console.error("Erreur parsing attributs (checkStock):", e); }
                        } else if (stockInfo.category_id) { categoryNameToRender = 'Cat. Inconnue'; }
                    }
                    renderSpecificAttributes(attributesDefinition, categoryNameToRender, stockInfo.attributes || {});
                    showAdminFeedback(`Composant "${ref}" trouvé. Modifiez ou mettez à jour la quantité.`, 'success');
                    deleteComponentButton.style.display = 'inline-block';
                    updateSevenSegmentForComponent(stockInfo.ref); // MàJ 7-seg
                } else {
                    componentRefAdminInput.value = ref; // Garder la ref saisie
                    componentActionsWrapper.style.display = 'none';
                    renderSpecificAttributes([], ''); // Vider attributs
                    showAdminFeedback(`Composant "${ref}" inconnu. Remplissez les champs pour l'ajouter.`, 'info');
                    componentCategorySelectAdmin?.focus();
                    updateSevenSegmentForComponent(null); // Reset 7-seg
                }
            } catch (error) {
                console.error("Erreur checkStock:", error);
                showAdminFeedback(`Erreur vérification: ${error.message}`, 'error');
                resetStockForm(); componentRefAdminInput.value = ref; // Garder ref
                updateSevenSegmentForComponent(null);
            } finally {
                checkStockButton.disabled = false; checkStockButton.textContent = "Vérifier / Charger";
                // Laisser ref désactivé si trouvé, sinon réactiver pour ajout
                componentRefAdminInput.disabled = (componentActionsWrapper?.style.display === 'block');
            }
        });

        updateQuantityButton?.addEventListener('click', async () => {
            const ref = componentRefAdminInput?.value.trim().toUpperCase();
            const changeStr = quantityChangeInput?.value;
            const change = parseInt(changeStr, 10);
            if (!ref) { showAdminFeedback("Référence manquante.", 'warning'); return; }
            if (changeStr === '' || isNaN(change)) { showAdminFeedback("Modif quantité invalide.", 'warning'); quantityChangeInput?.focus(); return; }
            if (change === 0) { showAdminFeedback("Aucun changement spécifié (0).", 'info'); return; }
            const currentDisplayedQuantity = parseInt(currentQuantitySpan?.textContent, 10);
            if (!isNaN(currentDisplayedQuantity) && currentDisplayedQuantity + change < 0) { showAdminFeedback(`Stock deviendrait négatif (${currentDisplayedQuantity + change}).`, 'error'); return; }

            updateQuantityButton.disabled = true; updateQuantityButton.textContent = "MàJ...";
            try {
                const newQuantity = await updateStockInSupabase(ref, change); // Gère DB, log, 7-seg
                if (newQuantity !== null) {
                    currentQuantitySpan.textContent = newQuantity;
                    componentInitialQuantityInput.value = newQuantity;
                    quantityChangeInput.value = 0;
                    showAdminFeedback(`Stock "${ref}" mis à jour: ${newQuantity}.`, 'success');
                    if (inventoryView.classList.contains('active-view')) { displayInventory(currentInventoryPage); }
                }
            } catch (error) {
                console.error("Erreur bouton updateQuantity:", error);
                showAdminFeedback(error.message || `Erreur màj quantité.`, 'error');
            } finally {
                updateQuantityButton.disabled = false; updateQuantityButton.textContent = "Mettre à jour Quantité";
            }
        });

        stockForm?.addEventListener('submit', async (event) => {
            event.preventDefault(); if (!supabase || !currentUser) return;

            // --- Récupération & Validation ---
            const ref = componentRefAdminInput?.value.trim().toUpperCase();
            const categoryId = componentCategorySelectAdmin?.value || null;
            const description = componentDescInput?.value.trim() || null;
            const manufacturer = componentMfgInput?.value.trim() || null;
            const datasheet = componentDatasheetInput?.value.trim() || null;
            const drawer = componentDrawerAdminInput?.value.trim().toUpperCase() || null;
            const quantityStr = componentInitialQuantityInput?.value;
            const thresholdStr = componentThresholdInput?.value.trim();

            if (!ref) { showAdminFeedback("Référence obligatoire.", 'error'); componentRefAdminInput?.focus(); return; }
            if (!categoryId) { showAdminFeedback("Catégorie obligatoire.", 'error'); componentCategorySelectAdmin?.focus(); return; }
            const quantity = parseInt(quantityStr, 10);
            if (quantityStr === '' || isNaN(quantity) || quantity < 0) { showAdminFeedback("Quantité totale doit être nombre >= 0.", 'error'); componentInitialQuantityInput?.focus(); return; }
            let critical_threshold = null;
            if (thresholdStr) { critical_threshold = parseInt(thresholdStr, 10); if (isNaN(critical_threshold) || critical_threshold < 0) { showAdminFeedback("Seuil critique doit être nombre >= 0 ou vide.", 'error'); componentThresholdInput?.focus(); return; } }
            if (datasheet && !datasheet.toLowerCase().startsWith('http')) { showAdminFeedback("URL Datasheet invalide (doit commencer par http/https).", 'error'); componentDatasheetInput?.focus(); return; }

            const attributes = {};
            specificAttributesDiv?.querySelectorAll('input[data-attribute-name]').forEach(input => { const n = input.dataset.attributeName; const v = input.value.trim(); if (n && v) attributes[n] = v; });
            const componentData = { ref, description, manufacturer, quantity, datasheet, drawer, category_id: categoryId, attributes: Object.keys(attributes).length > 0 ? attributes : null, critical_threshold };
            console.log("Données pour Upsert:", componentData);

            // --- Vérification Occupation Tiroir ---
            let proceedWithSave = true;
            const drawerToCheck = drawer;
            saveComponentButton.disabled = true; // Désactiver pendant vérif & save

            if (drawerToCheck) {
                console.log(`Vérification tiroir: ${drawerToCheck} pour réf: ${ref}`);
                showAdminFeedback(`Vérification occupation tiroir ${drawerToCheck}...`, "info");
                try {
                    const { data: conflicting, error: checkError } = await supabase.from('inventory').select('ref, quantity').eq('drawer', drawerToCheck).gt('quantity', 0).neq('ref', ref).maybeSingle();
                    if (checkError) throw new Error(`Erreur vérif tiroir: ${checkError.message}`);
                    if (conflicting) {
                        console.warn(`Conflit tiroir: ${drawerToCheck} utilisé par ${conflicting.ref} (Qté: ${conflicting.quantity})`);
                        const confirmMsg = `⚠️ Attention : Tiroir ${drawerToCheck} déjà utilisé par ${conflicting.ref} (Qté: ${conflicting.quantity}).\n\nVoulez-vous quand même assigner ce tiroir à ${ref} ?`;
                        if (!confirm(confirmMsg)) {
                            proceedWithSave = false;
                            showAdminFeedback(`Assignation tiroir ${drawerToCheck} annulée.`, "warning");
                        } else {
                            showAdminFeedback(`Assignation tiroir ${drawerToCheck} confirmée malgré conflit.`, "info");
                        }
                    } else { console.log(`Tiroir ${drawerToCheck} disponible.`); }
                } catch (err) {
                    console.error("Erreur vérif tiroir:", err);
                    showAdminFeedback(`Erreur critique vérif tiroir: ${err.message}`, 'error');
                    proceedWithSave = false;
                }
            }

            // --- Exécution Upsert ---
            if (proceedWithSave) {
                showAdminFeedback("Enregistrement composant...", "info");
                try {
                    const { data, error } = await supabase.from('inventory').upsert(componentData, { onConflict: 'ref' }).select().single();
                    if (error) {
                        if (error.message.includes('inventory_category_id_fkey')) throw new Error("Erreur: Catégorie sélectionnée invalide.");
                        else throw new Error(`Erreur DB: ${error.message}`);
                    }
                    console.log("Upsert succès:", data);
                    showAdminFeedback(`Composant "${ref}" enregistré/mis à jour.`, 'success');
                    if (componentActionsWrapper?.style.display === 'block') { // Si on modifiait
                        currentQuantitySpan.textContent = data.quantity; quantityChangeInput.value = 0;
                        if (!deleteComponentButton?.style.display || deleteComponentButton.style.display === 'none') deleteComponentButton.style.display = 'inline-block';
                    }
                    if (inventoryView.classList.contains('active-view')) displayInventory();
                    updateSevenSegmentForComponent(data.ref); // MàJ afficheur
                } catch (err) {
                    console.error("Erreur upsert composant:", err);
                    showAdminFeedback(`Erreur enregistrement: ${err.message}`, 'error');
                    updateSevenSegmentForComponent(null); // Reset en cas d'erreur
                } finally {
                    saveComponentButton.disabled = false; // Réactiver dans tous les cas après tentative
                }
            } else { // Si proceed = false
                saveComponentButton.disabled = false; // Assurer réactivation
            }
        });

        deleteComponentButton?.addEventListener('click', async () => {
            const ref = componentRefAdminInput?.value.trim().toUpperCase();
            if (!ref) { showAdminFeedback("Réf à supprimer inconnue.", 'error'); return; }
            if (!confirm(`ATTENTION !\nSupprimer définitivement "${ref}" ?\nAction IRREVERSIBLE.`)) return;
            showAdminFeedback(`Suppression "${ref}"...`, 'info');
            deleteComponentButton.disabled = true; updateQuantityButton.disabled = true; saveComponentButton.disabled = true;
            try {
                const { error } = await supabase.from('inventory').delete().eq('ref', ref);
                if (error) throw new Error(`Erreur suppression DB: ${error.message}`);
                showAdminFeedback(`Composant "${ref}" supprimé.`, 'success');
                resetStockForm();
                updateSevenSegmentForComponent(null);
                if (inventoryView.classList.contains('active-view')) displayInventory(1);
            } catch (err) {
                console.error("Erreur suppression composant:", err);
                showAdminFeedback(`Erreur suppression: ${err.message}`, 'error');
                 deleteComponentButton.disabled = false; updateQuantityButton.disabled = false; saveComponentButton.disabled = false; // Réactiver si erreur
            }
        });

        // *** NOUVEAU LISTENER POUR EXPORT CRITIQUE ***
        exportCriticalButton?.addEventListener('click', handleExportCriticalStockTXT);
    }

    // --- *** NOUVELLE FONCTION POUR EXPORT CRITIQUE *** ---
    async function handleExportCriticalStockTXT() {
        if (!supabase || !currentUser) {
            console.warn("Export critique annulé: Supabase ou utilisateur manquant.");
            return;
        }

        // Utilise le div de feedback spécifique à cette section
        const showFeedback = (message, level = 'info') => {
            if (exportCriticalFeedbackDiv) {
                exportCriticalFeedbackDiv.textContent = message;
                exportCriticalFeedbackDiv.className = `feedback-area ${level}`;
                exportCriticalFeedbackDiv.style.display = (!message || level === 'none') ? 'none' : 'block';
            } else {
                console.log(`Feedback critique export (${level}): ${message}`); // Fallback console
            }
        };

        showFeedback("Récupération du stock...", 'info');
        if (exportCriticalButton) exportCriticalButton.disabled = true;

        try {
            const { data, error } = await supabase
                .from('inventory')
                .select('ref, quantity, critical_threshold, drawer')
                .order('ref'); // Trier par référence pour la lisibilité

            if (error) {
                throw new Error(`Erreur base de données: ${error.message}`);
            }

            const criticalItems = data.filter(item => {
                const qty = item.quantity ?? 0; // considérer null comme 0
                const threshold = item.critical_threshold; // peut être null

                // Est critique si:
                // 1. Quantité est <= 0
                // 2. OU si un seuil est défini (non null ET >= 0) ET la quantité est <= ce seuil
                return qty <= 0 || (threshold !== null && threshold >= 0 && qty <= threshold);
            });

            if (criticalItems.length === 0) {
                showFeedback("Aucun composant en stock faible ou en rupture trouvé.", 'warning');
                return;
            }

            // Formatage du fichier TXT
            let txtContent = "Liste Stock Faible / Rupture - StockAV\n";
            txtContent += `Date d'export: ${new Date().toLocaleString('fr-CA')}\n`;
            txtContent += "=========================================\n\n";
            txtContent += "Référence        | Quantité | Seuil   | Tiroir\n";
            txtContent += "-----------------+----------+---------+--------\n";

            criticalItems.forEach(item => {
                const ref = (item.ref || 'N/A').padEnd(16);
                const qty = String(item.quantity ?? 'N/A').padStart(8);
                const thr = String(item.critical_threshold ?? '-').padStart(7); // Affiche '-' si null
                const drw = (item.drawer || '-').padEnd(6);                // Affiche '-' si null
                txtContent += `${ref} | ${qty} | ${thr} | ${drw}\n`;
            });

            txtContent += "\n=========================================\n";
            txtContent += `Total: ${criticalItems.length} composant(s) listé(s).\n`;

            const timestamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
            downloadFile(`stockav_critique_${timestamp}.txt`, txtContent, 'text/plain;charset=utf-8;');
            showFeedback(`Export TXT réussi (${criticalItems.length} lignes).`, 'success');

        } catch (err) {
            console.error("Erreur lors de l'export du stock critique:", err);
            showFeedback(`Erreur lors de l'export: ${err.message}`, 'error');
        } finally {
            if (exportCriticalButton) exportCriticalButton.disabled = false;
        }
    }
    // --- FIN NOUVELLE FONCTION ---


    // --- VUE RECHERCHE (CHAT IA) ---
    async function addMessageToChat(sender, messageContent, isHTML = false) { if(!responseOutputChat)return;const messageElement=document.createElement('div');messageElement.classList.add('message',sender.toLowerCase());responseOutputChat.prepend(messageElement);if(sender==='AI'){loadingIndicatorChat.style.display='block';loadingIndicatorChat.querySelector('i').textContent='StockAV réfléchit...';messageElement.innerHTML='<span class="thinking-dots">...</span>';await delay(150);if(isHTML){messageElement.innerHTML=messageContent;}else{messageElement.textContent='';for(let i=0;i<messageContent.length;i++){messageElement.textContent+=messageContent[i];await delay(5);}}loadingIndicatorChat.style.display='none';}else{messageElement.textContent=messageContent;}const role=sender==='User'?'user':'assistant';chatHistory.push({role:role,content:messageContent});if(chatHistory.length>15){chatHistory.splice(0,chatHistory.length-15);}responseOutputChat.scrollTop = 0;}
    function displayWelcomeMessage() { if(responseOutputChat)responseOutputChat.innerHTML='';chatHistory=[];resetConversationState();addMessageToChat('AI',"Bonjour ! Je suis StockAV. Quelle référence cherchez-vous ?");if(componentInputChat){componentInputChat.value='';componentInputChat.focus();}}
    async function handleUserInput() { const userInput=componentInputChat?.value.trim();if(!userInput)return;addMessageToChat('User',userInput);if(componentInputChat)componentInputChat.value='';searchButtonChat.disabled = true; // Désactiver pendant traitement
        try{if(conversationState.awaitingQuantityConfirmation){if(!currentUser){await promptLoginBeforeAction("confirmer la quantité");return;}await handleQuantityResponse(userInput);}else{const potentialRef=extractReference(userInput);if(potentialRef){console.log(`Réf détectée: ${potentialRef}. Recherche...`);resetConversationState();conversationState.originalRefChecked=potentialRef;await checkComponentWithAI(potentialRef);}else{if(conversationState.awaitingEquivalentChoice){await addMessageToChat('AI',"Entrée non reconnue. Cliquez 'Prendre' ou entrez une nouvelle référence.");}else{await addMessageToChat('AI',"Référence non comprise. Essayez d'être plus spécifique (ex: 'LM358N', '10k ohm', 'Capacitor 100nF').");resetConversationState();}}}}catch(error){console.error("Erreur majeure handleUserInput:",error);await addMessageToChat('AI',`Oups ! Erreur technique: ${error.message}. Réessayez.`);resetConversationState();}finally{if(componentInputChat)componentInputChat.focus(); searchButtonChat.disabled = false;} // Réactiver bouton
    }
    function extractReference(text) {
        const upperText = text.toUpperCase(); let bestMatch = null;
        const patterns=[/\b(STM32[A-Z]\d{2,}[A-Z\d]{1,6})\b/,/\b(PIC\s?(?:[1-3]\d[A-Z\d]{2,7}|[1-3]\d[A-Z]?LF\d{3,6}))\b/,/\b(ESP(?:-)?(?:32|8266|32-S\d|32-C\d)(?:-[A-Z\d]{1,8})?)\b/,/\b(AT(?:MEGA|TINY|XMEGA)\s?\d+[A-Z\d\-]{0,5})\b/,/\b(SN\s?74[A-Z\d]{2,8})\b/,/\b(CD\s?4\d{3,4}[A-Z]{1,3})\b/,/\b((?:LM|NE|UA|TL|LF|TLC|OP|MCP)\s?\d{2,4}[A-Z\d\-/]{0,6})\b/,/\b(MAX\s?\d{3,5}[A-Z\d\-/]{0,6})\b/,/\b((?:[1-9]N|[2-9]SD|[2-9]SA|[2-9]SC|[2-9]SJ|[Bb][CDUFT])\s?\d{3,4}[A-Z\d\-]{0,4})\b/,/\b(IRF[A-Z\d]{3,7})\b/,/\b(MOC\s?\d{4}[A-Z\d]{0,3})\b/,/\b(\d+(?:\.\d+)?\s?(?:[GMK]?HZ))\b/i,/\b(\d+(?:\.\d+)?\s?(?:[KMR]?)\s?OHMS?)\b/i,/\b(\d+(?:\.\d+)?\s?(?:[PFNµU]|MF)\s?F?)\b/i,/\b(\d+(?:\.\d+)?\s?(?:[MUN]?H))\b/i,/\b(\d+(?:\.\d+)?\s?V)\b/i,/\b(\d+(?:\.\d+)?\s?W)\b/i,/\b(\d+(?:\.\d+)?\s?(?:M?A))\b/i,/\b([A-Z]{2,}\d{2,}[A-Z\d\-/]*)\b/,/\b(\d{2,}[A-Z]{1,}[A-Z\d\-/]*)\b/,/\b([A-Z]{1,}\d{3,}[A-Z\d\-/]*)\b/];
        const ignoreWords=new Set(['POUR','AVEC','COMBIEN','STOCK','CHERCHE','RECHERCHE','DISPO','EQUIV','REMPLACE','TROUVE','QUEL','EST','QUE','SONT','LES','DU','UN','UNE','OU','ET','LE','LA','DE','À','PLUS','MOINS','PEUT','IL','ELLE','ON','JE','TU','COMME','DANS','SUR','VOLTS','AMPERES','WATTS','OHMS','FARADS','HENRYS','TYPE','VALEUR','REFERENCE','COMPOSANT','PIECE','REF','DESCRIPTION','DONNE','MOI','TOUS','DES','MES','TES','SES','NOS','VOS','LEURS']);
        for(const pattern of patterns){ const match=upperText.match(pattern); if(match && match[1]){ let potentialRef = match[1].replace(/\s+/g, ''); if (potentialRef.length >= 3 && !/^\d+$/.test(potentialRef) && !ignoreWords.has(potentialRef)) { if (!bestMatch || potentialRef.length > bestMatch.length) { bestMatch = potentialRef; }}}}
        if (!bestMatch) { const words = upperText.split(/[\s,;:!?()]+/); const potentialRefs = words.filter(w => w.length>=3 && /\d/.test(w) && /[A-Z]/.test(w) && !/^\d+[.,]?\d*[A-Z]*$/.test(w) && !ignoreWords.has(w)); if (potentialRefs.length > 0) { potentialRefs.sort((a, b) => b.length - a.length); bestMatch = potentialRefs[0]; }}
        console.log(`Référence extraite: "${bestMatch || 'Aucune'}"`); return bestMatch;
    }
    async function checkComponentWithAI(originalRef) { loadingIndicatorChat.style.display='block';loadingIndicatorChat.querySelector('i').textContent=`Analyse stock local ${originalRef}...`;let originalStockInfo=null;let equivalents=[];let aiError=null;let responseHTML="";try{
        originalStockInfo = await getStockInfoFromSupabase(originalRef);
        await delay(150);
        if(originalStockInfo){ updateSevenSegmentForComponent(originalStockInfo.ref); } else { updateSevenSegmentForComponent(null); }
        const showDrawer = currentUser && originalStockInfo?.drawer; let originalStatusHTML = "";
        if (originalStockInfo) { const indicatorHTML=createStockIndicatorHTML(originalStockInfo.quantity,originalStockInfo.critical_threshold); originalStatusHTML = (originalStockInfo.quantity>0) ? `${indicatorHTML} Original <strong>${originalRef}</strong> : Dispo (Qté: ${originalStockInfo.quantity}${showDrawer?`, Tiroir: ${originalStockInfo.drawer}`:''}).` : `${indicatorHTML} Original <strong>${originalRef}</strong> : Rupture local.`; if(originalStockInfo.quantity>0) conversationState.criticalThreshold=originalStockInfo.critical_threshold; } else { originalStatusHTML = `${createStockIndicatorHTML(undefined,undefined)} Original <strong>${originalRef}</strong> : Non trouvé local.`; } responseHTML += originalStatusHTML;
        loadingIndicatorChat.querySelector('i').textContent=`Recherche équivalents IA ${originalRef}...`; try { const { data: aiResult, error: edgeError } = await supabase.functions.invoke('ai-component-info', { body: { reference: originalRef } }); if (edgeError) throw new Error(edgeError.message || "Erreur appel IA."); if (aiResult && aiResult.error) throw new Error(aiResult.error); equivalents = aiResult?.equivalents || []; console.log("Equivalents IA:", equivalents); } catch (error) { aiError = error.message; console.error("Erreur fonction Edge IA:", aiError); }
        let equivalentsStockInfo={}; if(equivalents.length>0){ loadingIndicatorChat.querySelector('i').textContent=`Vérif stock équivalents...`; const equivalentRefs=equivalents.map(eq=>eq.ref).filter(ref => ref && ref.toUpperCase() !== originalRef.toUpperCase()); if(equivalentRefs.length>0){ const stockCheckPromises=equivalentRefs.map(async ref=>{const stockInfo=await getStockInfoFromSupabase(ref);return {ref,stockInfo};}); const results=await Promise.all(stockCheckPromises); results.forEach(({ref,stockInfo})=>{if(stockInfo)equivalentsStockInfo[ref]=stockInfo;}); console.log("Stock équivalents locaux:",equivalentsStockInfo);}}
        if(equivalents.length>0){ responseHTML+="<br><br><strong>Équivalents suggérés IA :</strong>"; let foundAvailableEquivalent=false; equivalents.forEach(eq=>{ if (!eq.ref || eq.ref.toUpperCase() === originalRef.toUpperCase()) return; const eqStock=equivalentsStockInfo[eq.ref]; const eqIndicatorHTML=createStockIndicatorHTML(eqStock?.quantity,eqStock?.critical_threshold); const eqShowDrawer=currentUser&&eqStock?.drawer; responseHTML+=`<div class="equivalent-item">`; responseHTML+=`${eqIndicatorHTML}<strong>${eq.ref}</strong> <small>(${(eq.reason||'Suggestion AI').substring(0,50)}${eq.reason&&eq.reason.length>50?'...':''})</small>`; if(eqStock){ if(eqStock.quantity>0){ foundAvailableEquivalent=true; responseHTML+=` : Dispo (Qté: ${eqStock.quantity}${eqShowDrawer?`, Tiroir: ${eqStock.drawer}`:''})`; if(currentUser) responseHTML+=` <button class="choice-button take-button" data-ref="${eq.ref}" data-qty="${eqStock.quantity}" data-threshold="${eqStock.critical_threshold??''}" title="Sélectionner équivalent">Prendre</button>`; } else { responseHTML+=` : Rupture local.`; responseHTML+=provideExternalLinksHTML(eq.ref,true); } } else { responseHTML+=` : Non trouvé local.`; responseHTML+=provideExternalLinksHTML(eq.ref,true); } responseHTML+=`</div>`; }); if(foundAvailableEquivalent||(originalStockInfo&&originalStockInfo.quantity>0)) conversationState.awaitingEquivalentChoice=true; } else if(!aiError) responseHTML+="<br><br>IA n'a pas suggéré d'équivalents.";
        if (originalStockInfo && originalStockInfo.quantity > 0) { if(currentUser){ responseHTML += `<br><button class="choice-button take-button" data-ref="${originalRef}" data-qty="${originalStockInfo.quantity}" data-threshold="${originalStockInfo.critical_threshold ?? ''}" title="Sélectionner original">Prendre original (${originalRef})</button>`; conversationState.awaitingEquivalentChoice = true; } else { responseHTML += `<br><br><i>Original dispo. Connectez-vous pour prendre.</i>`; }}
        if(!originalStockInfo||originalStockInfo.quantity<=0) responseHTML+=provideExternalLinksHTML(originalRef,false);
        if(aiError) responseHTML+=`<br><br><i style="color: var(--error-color);">Erreur IA équivalents: ${aiError}.</i>`;
        if(!conversationState.awaitingEquivalentChoice&&!conversationState.awaitingQuantityConfirmation){ responseHTML+="<br><br>Autre recherche ?"; resetConversationState(); } else if(!currentUser&&conversationState.awaitingEquivalentChoice) responseHTML+=`<br><br><i>Connectez-vous pour choisir/prendre.</i>`;
    }catch(error){console.error(`Erreur checkComponentWithAI ${originalRef}:`,error);responseHTML=`Erreur recherche <strong>${originalRef}</strong>.<br>Détails: ${error.message}`;resetConversationState();updateSevenSegmentForComponent(null);}finally{loadingIndicatorChat.style.display='none';await addMessageToChat('AI',responseHTML,true);}}
    responseOutputChat?.addEventListener('click', async (event) => { const targetButton=event.target.closest('button.choice-button.take-button');if(targetButton&&conversationState.awaitingEquivalentChoice){const chosenRef=targetButton.dataset.ref;const availableQtyStr=targetButton.dataset.qty;const criticalThresholdStr=targetButton.dataset.threshold;if(!chosenRef||availableQtyStr===undefined)return;const availableQty=parseInt(availableQtyStr,10);if(isNaN(availableQty)||availableQty<=0)return;if(!currentUser){await promptLoginBeforeAction(`prendre ${chosenRef}`);return;}console.log(`Choix: ${chosenRef}, Qté: ${availableQty}`);conversationState.awaitingEquivalentChoice=false;addMessageToChat('User',`Je prends ${chosenRef}`);await delay(50);conversationState.chosenRefForStockCheck=chosenRef;conversationState.availableQuantity=availableQty;conversationState.criticalThreshold=(criticalThresholdStr&&!isNaN(parseInt(criticalThresholdStr,10)))?parseInt(criticalThresholdStr,10):null;conversationState.awaitingQuantityConfirmation=true; updateSevenSegmentForComponent(chosenRef);await addMessageToChat('AI',`Combien de <strong>${chosenRef}</strong> ? (Stock : ${availableQty}) Entrez nombre ou '0'.`);}else if(event.target.tagName==='A'&&(event.target.classList.contains('external-link')||event.target.classList.contains('external-link-inline'))){event.preventDefault();window.open(event.target.href,'_blank','noopener,noreferrer');}});
    async function promptLoginBeforeAction(actionDesc) { await addMessageToChat('AI',`Pour ${actionDesc}, connectez-vous (en haut).`);loginCodeInput?.focus();}
    function provideExternalLinksHTML(ref, inline = false) { if(!ref)return'';const encodedRef=encodeURIComponent(ref);const mLink=`https://www.mouser.ca/Search/Refine?Keyword=${encodedRef}`;const dLink=`https://www.digikey.ca/en/products/result?keywords=${encodedRef}`;const aLink=`https://www.aliexpress.com/wholesale?SearchText=${encodedRef}`;const cl=inline?"external-link-inline":"external-link";const tM=`Rech ${ref} Mouser`;const tD=`Rech ${ref} Digi-Key`;const tA=`Rech ${ref} AliExpress`;const hM=`<a href="${mLink}" target="_blank" rel="noopener noreferrer" class="${cl}" title="${tM}">Mouser</a>`;const hD=`<a href="${dLink}" target="_blank" rel="noopener noreferrer" class="${cl}" title="${tD}">Digi-Key</a>`;const hA=`<a href="${aLink}" target="_blank" rel="noopener noreferrer" class="${cl} aliexpress" title="${tA}">AliExpress</a>`;if(inline)return`&nbsp;<span class="external-links-inline">(Voir: ${hM}, ${hD}, ${hA})</span>`;else return`<div class="external-links-block">Liens externes <strong>${ref}</strong> : ${hM} ${hD} ${hA}</div>`;}
    async function handleQuantityResponse(userInput) { const ref=conversationState.chosenRefForStockCheck;if(!ref||!conversationState.awaitingQuantityConfirmation){const potentialRef=extractReference(userInput);if(potentialRef){resetConversationState();conversationState.originalRefChecked=potentialRef;await checkComponentWithAI(potentialRef);}else{await addMessageToChat("AI","Non compris. Entrez réf ou cliquez 'Prendre'.");conversationState.awaitingQuantityConfirmation=false;}return;}const requestedQty=parseInt(userInput,10);if(isNaN(requestedQty)||requestedQty<0){await addMessageToChat('AI',`Qté invalide. Entrez nombre >= 0.`);return;}if(requestedQty===0){await addMessageToChat('AI',"Prise stock annulée.");resetConversationState();await delay(300);await addMessageToChat('AI',"Besoin d'autre chose ?");updateSevenSegmentForComponent(null);return;}if(requestedQty>conversationState.availableQuantity){await addMessageToChat('AI',`Qté (${requestedQty}) > stock (${conversationState.availableQuantity}). Entrez qté valide ou '0'.`);return;}loadingIndicatorChat.style.display='block';loadingIndicatorChat.querySelector('i').textContent=`MàJ stock ${ref}...`;const change=-requestedQty;try{ const newQty=await updateStockInSupabase(ref,change); loadingIndicatorChat.style.display='none';if(newQty!==null){const statusIndicatorHTML=createStockIndicatorHTML(newQty,conversationState.criticalThreshold);await addMessageToChat('AI',`${statusIndicatorHTML}Ok ! ${requestedQty} x <strong>${ref}</strong> retiré(s). Stock : ${newQty}.`);if(inventoryView.classList.contains('active-view'))displayInventory(currentInventoryPage);}conversationState.awaitingQuantityConfirmation=false;}catch(error){console.error("Erreur màj stock via chat:",error);loadingIndicatorChat.style.display='none';let errMsg=`Erreur màj stock <strong>${ref}</strong>.`;if(error.message&&error.message.toLowerCase().includes("stock insuffisant")){errMsg=`Erreur: ${error.message}`; const currentStock = await getStockInfoFromSupabase(ref); if(currentStock){errMsg+=` Stock actuel: ${currentStock.quantity}. Réessayez qté valide ou '0'.`;conversationState.availableQuantity=currentStock.quantity;} conversationState.awaitingQuantityConfirmation=true; await addMessageToChat('AI',errMsg);return;} else if(error.message){errMsg+=` Détails: ${error.message}`;} conversationState.awaitingQuantityConfirmation=false; await addMessageToChat('AI',errMsg);}finally{if(!conversationState.awaitingQuantityConfirmation){resetConversationState();await delay(300);await addMessageToChat('AI',"Besoin d'autre chose ?");}}}
    function resetConversationState() { conversationState={awaitingEquivalentChoice:false,awaitingQuantityConfirmation:false,originalRefChecked:null,potentialEquivalents:[],chosenRefForStockCheck:null,availableQuantity:0,criticalThreshold:null};console.log("État conv chat réinitialisé.");}

    // --- Fonctions d'interaction Supabase ---
    async function getStockInfoFromSupabase(ref = null, categoryId = null) {
        if (!supabase) return null; if (!ref && !categoryId) return null;
        let query = supabase.from('inventory').select('ref, description, quantity, datasheet, drawer, critical_threshold, category_id, attributes');
        if (ref) { const upperRef = ref.toUpperCase(); console.log(`Supabase GET: ref=${upperRef}`); query = query.ilike('ref', upperRef).single(); }
        else if (categoryId) { console.log(`Supabase GET: categoryId=${categoryId}`); query = query.eq('category_id', categoryId); }
        try { const { data, error } = await query; if (error) { if (error.code === 'PGRST116' && ref) { console.log(`Supabase GET: Réf ${ref.toUpperCase()} non trouvée.`); return null; } console.error(`Supabase GET Error (${ref ? 'ref' : 'cat'}):`, error); return null; } console.log(`Supabase GET Success (${ref ? 'ref' : 'cat'}): Found ${Array.isArray(data) ? data.length : (data ? 1 : 0)} items.`); return data; } catch (err) { console.error("JS Error in getStockInfo:", err); return null; }
    }
    async function updateStockInSupabase(ref, change) {
        if (!supabase || !ref || change === 0 || !currentUser) { console.warn("[updateStock] Annulé: infos manquantes/user/change=0."); throw new Error("Màj annulée: infos manquantes ou non connecté."); }
        const upperRef = ref.toUpperCase(); console.log(`[updateStock] Début: Réf=${upperRef}, Change=${change}, User=${currentUserCode}`);
        try {
            console.log(`[updateStock] 1. Lecture stock actuel...`);
            const { data: currentItem, error: readError } = await supabase.from('inventory').select('quantity, drawer, critical_threshold').ilike('ref', upperRef).single();
            if (readError || !currentItem) { const msg = readError?.code === 'PGRST116' ? `Composant "${upperRef}" non trouvé.` : `Erreur lecture stock ${upperRef}: ${readError?.message || 'Inconnu'}`; console.error(`[updateStock] Echec lecture: ${msg}`); throw new Error(msg); }
            console.log(`[updateStock] 2. Stock actuel: ${currentItem.quantity}. Tiroir: ${currentItem.drawer}, Seuil: ${currentItem.critical_threshold}`);
            const newQuantity = currentItem.quantity + change;
            if (newQuantity < 0) { console.warn(`[updateStock] Stock insuffisant pour ${upperRef}.`); throw new Error(`Stock insuffisant pour ${upperRef}. Actuel: ${currentItem.quantity}, Retrait demandé: ${Math.abs(change)}.`); }
            console.log(`[updateStock] 3. MàJ stock vers ${newQuantity}...`);
            const { data: updateData, error: updateError } = await supabase.from('inventory').update({ quantity: newQuantity }).ilike('ref', upperRef).select('quantity').single();
            if (updateError) { console.error(`[updateStock] Echec MàJ:`, updateError); const msg = updateError.message.includes("violates row-level security policy") ? `Permission refusée pour modifier ${upperRef}.` : `Erreur enregistrement MàJ ${upperRef}. ${updateError.message}`; throw new Error(msg); }
            const confirmedNewQuantity = updateData.quantity; console.log(`[updateStock] 4. MàJ réussie. Qté confirmée: ${confirmedNewQuantity}.`);
            if (confirmedNewQuantity !== newQuantity) console.warn(`[updateStock] Discordance quantité après MàJ pour ${upperRef}. Attendu: ${newQuantity}, Reçu: ${confirmedNewQuantity}.`);
            await addLogEntry(upperRef, change, confirmedNewQuantity);
            const newStatus = getStockStatus(confirmedNewQuantity, currentItem.critical_threshold);
            updateSevenSegmentDisplayVisuals(currentItem.drawer, newStatus); // MàJ directe visuels 7-seg
            return confirmedNewQuantity;
        } catch (err) { console.error(`[updateStock] Erreur globale pour ${upperRef}:`, err.message); updateSevenSegmentForComponent(null); throw err; }
    }

    // --- Gestion Modale Quantité (+/-) ---
    async function handleInventoryRowClick(event) {
        const row = event.target.closest('tr.inventory-item-row'); if (!row) return;
        if (!currentUser) { if (loginError) { loginError.textContent = "Connectez-vous pour modifier."; loginError.style.display = 'block'; } loginCodeInput?.focus(); return; }
        const ref = row.dataset.ref; if (!ref) { console.error("Ref manquante sur ligne:", row); return; }
        console.log(`Clic inventaire: ${ref}`); row.style.opacity = '0.7';
        try { const item = await getStockInfoFromSupabase(ref); row.style.opacity = '1'; if (item) { updateSevenSegmentForComponent(item.ref); showQuantityModal(item.ref, item.quantity, item.attributes); } else { console.error(`Détails ${ref} non trouvés.`); alert(`Erreur: Détails ${ref} non trouvés. Recharge inventaire.`); displayInventory(currentInventoryPage); updateSevenSegmentForComponent(null); } } catch (error) { row.style.opacity = '1'; console.error("Erreur handleInventoryRowClick:", error); alert("Erreur récupération détails."); updateSevenSegmentForComponent(null); }
    }
    function getBadgeClassForKey(key) { const lk=key.toLowerCase();if(lk.includes('volt')||lk.includes('tension'))return'badge-color-red';if(lk.includes('package')||lk.includes('boitier')||lk.includes('case'))return'badge-color-gray';if(lk.includes('capa')||lk.includes('farad')||lk.includes('µf')||lk.includes('nf')||lk.includes('pf'))return'badge-color-blue';if(lk.includes('résis')||lk.includes('ohm')||lk.includes('ω')||lk.includes('kω')||lk.includes('mω')||lk.includes('r'))return'badge-color-yellow';if(lk.includes('induc')||lk.includes('henry')||lk.includes('µh')||lk.includes('mh'))return'badge-color-green';if(lk.includes('tol')||lk.includes('precis'))return'badge-color-yellow';if(lk.includes('courant')||lk.includes('ampere')||lk.includes('watt'))return'badge-color-red';if(lk.includes('type')||lk.includes('polarit')||lk.includes('techno'))return'badge-color-green';return'badge-color-default';}
    function showQuantityModal(ref, quantity, attributes) {
        if (!quantityChangeModal || !modalOverlay || !modalAttributesContainer || !modalAttributesList) { console.error("DOM modale qté manquant !"); return; }
        modalCurrentRef = ref; modalInitialQuantity = quantity; currentModalChange = 0;
        if (modalRefSpan) modalRefSpan.textContent = ref; if (modalQtySpan) modalQtySpan.textContent = quantity; if (modalChangeAmountDisplay) modalChangeAmountDisplay.textContent = currentModalChange;
        if (modalFeedback) { modalFeedback.textContent = ''; modalFeedback.style.display = 'none'; }
        modalAttributesList.innerHTML = '';
        const hasAttributes = attributes && typeof attributes === 'object' && Object.keys(attributes).length > 0;
        if (hasAttributes) { Object.entries(attributes).forEach(([key, value]) => { const el = document.createElement('span'); const badgeCls = getBadgeClassForKey(key); el.className = `attribute-badge ${badgeCls}`; const displayValue = (value === null || value === undefined || value === '') ? '-' : value; el.textContent = `${escapeHtml(key)}: ${escapeHtml(displayValue)}`; el.title = `${escapeHtml(key)}: ${escapeHtml(displayValue)}`; modalAttributesList.appendChild(el); }); modalAttributesContainer.style.display = 'block'; }
        else { modalAttributesContainer.style.display = 'none'; }
        updateModalButtonStates(); quantityChangeModal.classList.add('active'); modalOverlay.classList.add('active');
    }
    function hideQuantityModal() { if (!quantityChangeModal || !modalOverlay) return; quantityChangeModal.classList.remove('active'); modalOverlay.classList.remove('active'); modalCurrentRef = null; modalInitialQuantity = 0; currentModalChange = 0; if (modalAttributesContainer) modalAttributesContainer.style.display = 'none'; if(modalAttributesList) modalAttributesList.innerHTML = ''; }
    function updateModalButtonStates() { if(!modalDecreaseButton||!modalIncreaseButton||!modalConfirmButton||!modalChangeAmountDisplay)return;const resultQty=modalInitialQuantity+currentModalChange;if(modalChangeAmountDisplay)modalChangeAmountDisplay.textContent=currentModalChange>0?`+${currentModalChange}`:currentModalChange;if(modalDecreaseButton)modalDecreaseButton.disabled=(resultQty<=0);if(modalIncreaseButton)modalIncreaseButton.disabled=false;if(modalConfirmButton)modalConfirmButton.disabled=(currentModalChange===0);}
    modalDecreaseButton?.addEventListener('click',()=>{if(modalInitialQuantity+currentModalChange>0){currentModalChange--;updateModalButtonStates();}});
    modalIncreaseButton?.addEventListener('click',()=>{currentModalChange++;updateModalButtonStates();});
    modalCancelButton?.addEventListener('click',hideQuantityModal);
    modalOverlay?.addEventListener('click',(event)=>{if(event.target===modalOverlay)hideQuantityModal();});
    modalConfirmButton?.addEventListener('click',async()=>{
        if(modalFeedback)modalFeedback.style.display='none'; if(currentModalChange===0||!modalCurrentRef)return; if(modalInitialQuantity+currentModalChange<0){if(modalFeedback){modalFeedback.textContent="Stock négatif impossible.";modalFeedback.className='modal-feedback error';modalFeedback.style.display='block';} return;}
        modalConfirmButton.disabled=true;modalCancelButton.disabled=true;modalDecreaseButton.disabled=true;modalIncreaseButton.disabled=true; if(modalFeedback){modalFeedback.textContent="Mise à jour...";modalFeedback.className='modal-feedback info';modalFeedback.style.display='block';}
        try{ const newQuantity=await updateStockInSupabase(modalCurrentRef,currentModalChange); if(newQuantity!==null){ hideQuantityModal(); displayInventory(currentInventoryPage); } }
        catch(error){ console.error("Erreur confirm modal qté:",error); if(modalFeedback){ modalFeedback.textContent = error.message || "Erreur màj."; modalFeedback.className='modal-feedback error'; modalFeedback.style.display='block'; } if(quantityChangeModal?.classList.contains('active')){ modalCancelButton.disabled=false; updateModalButtonStates(); } }
    });

    // --- Gestion Afficheur 7 Segments ---
    const segmentMap={'0':['a','b','c','d','e','f'],'1':['b','c'],'2':['a','b','g','e','d'],'3':['a','b','g','c','d'],'4':['f','g','b','c'],'5':['a','f','g','c','d'],'6':['a','f','e','d','c','g'],'7':['a','b','c'],'8':['a','b','c','d','e','f','g'],'9':['a','b','c','d','f','g'],'A':['a','b','c','e','f','g'],'B':['c','d','e','f','g'],'b':['f','e','d','c','g'],'C':['a','f','e','d'],'c':['g','e','d'],'D':['b','c','d','e','g'],'d':['b','c','d','e','g'],'E':['a','f','e','d','g'],'F':['a','f','e','g'],'G':['a','f','e','d','c'],'H':['f','e','b','c','g'],'h':['f','e','c','g'],'I':['f','e'],'J':['b','c','d','e'],'L':['f','e','d'],'O':['a','b','c','d','e','f'],'o':['c','d','e','g'],'P':['a','b','f','e','g'],'r':['e','g'],'S':['a','f','g','c','d'],'T': ['f','e','d','g'], 't': ['f','e','d','g'], 'U':['b','c','d','e','f'],'u':['c','d','e'],'-':['g'],' ':[],'_':['d'], '.': ['dp']};

    // Met à jour le 7-segment pour un composant (fetch data + appel visuel)
    async function updateSevenSegmentForComponent(ref) {
        if (!currentUser) { updateSevenSegmentDisplayVisuals(null, null); return; }
        if (!ref) { updateSevenSegmentDisplayVisuals(null, null); return; }
        console.log(`update7Seg: Fetch info for ref ${ref}`);
        try {
            const item = await getStockInfoFromSupabase(ref);
            if (item) { const status = getStockStatus(item.quantity, item.critical_threshold); lastDisplayedDrawerRef = item.ref; lastDisplayedDrawerThreshold = item.critical_threshold; updateSevenSegmentDisplayVisuals(item.drawer, status); }
            else { console.warn(`update7Seg: Composant ${ref} non trouvé.`); updateSevenSegmentDisplayVisuals(null, null); }
        } catch (error) { console.error(`update7Seg: Erreur fetch ${ref}:`, error); updateSevenSegmentDisplayVisuals(null, null); }
    }

    // Met à jour l'affichage VISUEL (digits + couleur)
    function updateSevenSegmentDisplayVisuals(drawerValue, status = null) {
        if (!sevenSegmentDisplay || !segmentDigits.every(d => d)) { console.warn("update7SegVisuals: DOM manquant."); return; }
        const displayElement = sevenSegmentDisplay; const drawerToDisplay = drawerValue ? String(drawerValue).trim().toUpperCase() : null;
        if (!currentUser || !drawerToDisplay) {
            displayElement.classList.add('display-off'); displayElement.classList.remove('status-ok', 'status-warning', 'status-critical'); lastDisplayedDrawerRef = null; lastDisplayedDrawerThreshold = null;
            segmentDigits.forEach(digitEl => { digitEl?.querySelectorAll('.segment').forEach(seg => seg.classList.remove('on')); });
            return;
        }
        displayElement.classList.remove('display-off');
        const displayChars = drawerToDisplay.slice(-4).padStart(4, ' ');
        segmentDigits.forEach((digitEl, index) => { if (!digitEl) return; const char = displayChars[index] || ' '; const segmentsOn = segmentMap[char] || segmentMap['-']; digitEl.querySelectorAll('.segment').forEach(seg => seg.classList.remove('on')); segmentsOn.forEach(segId => { const segment = digitEl.querySelector(`.segment-${segId}`); segment?.classList.add('on'); }); });
        displayElement.classList.remove('status-ok', 'status-warning', 'status-critical');
        if (status && status !== 'unknown') { displayElement.classList.add(`status-${status}`); console.log(`7-Seg status: ${status} for ${drawerToDisplay}`); }
        else { console.log(`7-Seg status default for ${drawerToDisplay}`); }
    }

    // --- Logique pour la vue Paramètres ---
    function loadSettingsData() { if (!currentUser || currentUserCode !== 'zine') { console.warn("loadSettings refusé (pas zine)."); setActiveView(searchView, searchTabButton); return; } showSettingsFeedback('export', '', 'none'); showSettingsFeedback('import', '', 'none'); if (importCsvFileInput) importCsvFileInput.value = ''; if (categoriesCache.length === 0) getCategories(); console.log("Vue Paramètres chargée pour 'zine'."); }
    function showSettingsFeedback(type, message, level = 'info') { const fbDiv=(type==='export')?exportFeedbackDiv:importFeedbackDiv;if(fbDiv){fbDiv.textContent=message;fbDiv.className=`feedback-area ${level}`;fbDiv.style.display=(!message||level==='none')?'none':'block';}}
    function downloadFile(filename, content, mimeType) { try { const blob = new Blob([content], { type: mimeType }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); } catch (e) { console.error("Erreur downloadFile:", e); /* Modifié pour cibler le bon feedback div */ const activeView = document.querySelector('.view-section.active-view'); let feedbackTarget = 'export'; /* Défaut */ if (activeView && activeView.id === 'admin-view') { feedbackTarget = 'critical_export'; } else if (activeView && activeView.id !== 'settings-view') { console.warn("downloadFile appelé hors contexte admin/settings?"); } let feedbackFunc = (msg, lvl) => showSettingsFeedback(feedbackTarget, msg, lvl); if (feedbackTarget === 'critical_export' && exportCriticalFeedbackDiv) { feedbackFunc = (msg, lvl) => { exportCriticalFeedbackDiv.textContent = msg; exportCriticalFeedbackDiv.className = `feedback-area ${lvl}`; exportCriticalFeedbackDiv.style.display = 'block'; }; } feedbackFunc(`Erreur création fichier: ${e.message}`, 'error'); } }
    async function handleExportInventoryCSV() { if (!supabase) return; showSettingsFeedback('export', "Récup inventaire...", 'info'); if(exportInventoryCsvButton) exportInventoryCsvButton.disabled = true; try { const { data, error } = await supabase.from('inventory').select('ref, description, manufacturer, quantity, datasheet, drawer, category_id, critical_threshold, attributes').order('ref', { ascending: true }); if (error) throw new Error(`Erreur DB: ${error.message}`); if (!data || data.length === 0) { showSettingsFeedback('export', "Inventaire vide.", 'warning'); return; } if (categoriesCache.length === 0 && data.some(i => i.category_id)) await getCategories(); const catMap = new Map(categoriesCache.map(cat => [cat.id, cat.name])); const csvData = data.map(i => ({ ref: i.ref||'', description: i.description||'', manufacturer: i.manufacturer||'', quantity: i.quantity??0, datasheet: i.datasheet||'', drawer: i.drawer||'', category_name: catMap.get(i.category_id)||'', critical_threshold: i.critical_threshold??'', attributes: i.attributes?JSON.stringify(i.attributes):'' })); const csvString = Papa.unparse(csvData, { header: true, quotes: true, delimiter: ",", escapeChar: '"', quoteChar: '"' }); const timestamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-'); downloadFile(`stockav_inventory_${timestamp}.csv`, "\uFEFF" + csvString, 'text/csv;charset=utf-8;'); showSettingsFeedback('export', `Export CSV OK (${data.length} lignes).`, 'success'); } catch (err) { console.error("Erreur export CSV:", err); showSettingsFeedback('export', `Erreur export CSV: ${err.message}`, 'error'); } finally { if(exportInventoryCsvButton) exportInventoryCsvButton.disabled = false; } }
    async function handleExportLogTXT() { if(!supabase)return;showSettingsFeedback('export',"Récup historique...",'info');if(exportLogTxtButton)exportLogTxtButton.disabled=true;try{const{data,error}=await supabase.from('logs').select('*').order('created_at',{ascending:true});if(error)throw new Error(`Erreur DB: ${error.message}`);if(!data||data.length===0){showSettingsFeedback('export',"Historique vide.",'warning');return;}let txt="Historique Mouvements StockAV\n===============================\n\nDate & Heure          | Technicien | Action  | Référence        | +/-   | Stock Final\n----------------------+------------+---------+------------------+-------+------------\n";data.forEach(l=>{const ts=formatLogTimestamp(new Date(l.created_at)).padEnd(21);const u=(l.user_code||'N/A').padEnd(10);const a=(l.quantity_change>0?'Ajout':'Retrait').padEnd(7);const r=(l.component_ref||'N/A').padEnd(16);const c=(l.quantity_change>0?`+${l.quantity_change}`:`${l.quantity_change}`).padStart(5);const af=String(l.quantity_after??'N/A').padStart(11);txt+=`${ts} | ${u} | ${a} | ${r} | ${c} | ${af}\n`;});const tFile=new Date().toISOString().slice(0,16).replace(/[:T]/g,'-');downloadFile(`stockav_logs_${tFile}.txt`,txt,'text/plain;charset=utf-8;');showSettingsFeedback('export',`Export TXT OK (${data.length} lignes).`,'success');}catch(err){console.error("Erreur export TXT:",err);showSettingsFeedback('export',`Erreur export TXT: ${err.message}`,'error');}finally{if(exportLogTxtButton)exportLogTxtButton.disabled=false;}}
    async function handleImportInventoryCSV() { if (!supabase || typeof Papa === 'undefined') { showSettingsFeedback('import', "Erreur: Supabase/CSV non init.", 'error'); return; } if (!importCsvFileInput?.files?.length) { showSettingsFeedback('import', "Sélectionnez un fichier CSV.", 'warning'); return; } const mode = document.querySelector('input[name="import-mode"]:checked')?.value || 'enrich'; console.log("Mode import:", mode); if (mode === 'overwrite') { if (!confirm("⚠️ ATTENTION ! ⚠️\nÉCRASER l'inventaire ?\nToutes les données actuelles seront PERDUES.\nContinuer ?")) { showSettingsFeedback('import', "Import annulé.", 'warning'); resetImportState(); return; } showSettingsFeedback('import', "Confirmation écrasement reçue...", 'warning'); await delay(1000); } const file = importCsvFileInput.files[0]; showSettingsFeedback('import', `Analyse ${file.name}...`, 'info'); if (importInventoryCsvButton) importInventoryCsvButton.disabled = true; if (importCsvFileInput) importCsvFileInput.disabled = true; Papa.parse(file, { header: true, skipEmptyLines: 'greedy', dynamicTyping: false, complete: async (results) => { console.log("Parsing CSV:", results); const rows = results.data; const errors = results.errors; const reqH = ['ref', 'quantity']; if (errors.length > 0) { const sample = errors.slice(0,5).map(e => `L${e.row+1}: ${e.message}`).join('\n'); showSettingsFeedback('import', `Erreur lecture CSV:\n${sample}${errors.length>5?'\n...':''}\nVérifiez format (UTF-8, virgule, guillemets).`, 'error'); resetImportState(); return; } if (rows.length === 0) { showSettingsFeedback('import', "CSV vide ou invalide.", 'warning'); resetImportState(); return; } const headers = results.meta.fields?.map(h => h.trim().toLowerCase()); if (!headers || !reqH.every(h => headers.includes(h))) { showSettingsFeedback('import', `Erreur: Headers 'ref' et 'quantity' requis. Trouvés: ${headers?.join(', ')||'Aucun'}`, 'error'); resetImportState(); return; } showSettingsFeedback('import', `Validation ${rows.length} lignes...`, 'info'); await delay(100); const toUpsert = []; const valErrors = []; if (categoriesCache.length === 0 && rows.some(r => r.category_name?.trim())) await getCategories(); const catMap = new Map(categoriesCache.map(cat => [cat.name.toUpperCase(), cat.id])); for (let i = 0; i < rows.length; i++) { const row = rows[i]; const line = i + 2; const normRow = {}; for (const k in row) normRow[k.trim().toLowerCase()] = row[k]; const ref = normRow.ref?.trim().toUpperCase(); if (!ref) { valErrors.push(`L${line}: 'ref' manquant.`); continue; } const qtyStr = normRow.quantity?.trim(); const qty = parseInt(qtyStr, 10); if (qtyStr === '' || isNaN(qty) || qty < 0) { valErrors.push(`L${line}(${ref}): Qté invalide ('${normRow.quantity||''}'). Doit être nb >= 0.`); continue; } const desc = normRow.description?.trim()||null; const mfg = normRow.manufacturer?.trim()||null; const ds = normRow.datasheet?.trim()||null; if (ds && !ds.toLowerCase().startsWith('http')) { valErrors.push(`L${line}(${ref}): URL datasheet invalide.`); continue; } const drw = normRow.drawer?.trim().toUpperCase()||null; const thrStr = normRow.critical_threshold?.trim(); let thr = null; if (thrStr) { thr = parseInt(thrStr, 10); if (isNaN(thr) || thr < 0) { valErrors.push(`L${line}(${ref}): Seuil invalide ('${normRow.critical_threshold}'). Nb >= 0 ou vide.`); continue; } } let catId = null; const catName = normRow.category_name?.trim(); if (catName) { const foundId = catMap.get(catName.toUpperCase()); if (foundId) catId = foundId; else { valErrors.push(`L${line}(${ref}): Catégorie '${catName}' inconnue.`); continue; } } let attrs = null; const attrsStr = normRow.attributes?.trim(); if (attrsStr && attrsStr !== '{}' && attrsStr !== '') { try { attrs = JSON.parse(attrsStr); if (typeof attrs !== 'object' || attrs === null || Array.isArray(attrs)) throw new Error("Doit être objet JSON."); } catch (e) { valErrors.push(`L${line}(${ref}): JSON attributs invalide. ${e.message}. Reçu: ${attrsStr}`); continue; } } toUpsert.push({ ref, description:desc, manufacturer:mfg, quantity:qty, datasheet:ds, drawer:drw, category_id:catId, critical_threshold:thr, attributes:attrs }); } if (valErrors.length > 0) { const msg = `Erreurs validation CSV (${valErrors.length}):\n- ${valErrors.slice(0,15).join('\n- ')}${valErrors.length>15?'\n- ...':''}\nCorrigez et réessayez.`; showSettingsFeedback('import', msg, 'error'); resetImportState(); return; } if (toUpsert.length > 0) { try { if (mode === 'overwrite') { showSettingsFeedback('import', `Validation OK. Suppression inventaire (${mode})... NE PAS QUITTER !`, 'warning'); const { error: delErr } = await supabase.from('inventory').delete().neq('ref', 'dummy_'+Date.now()); if (delErr) throw new Error(`Échec suppression inventaire: ${delErr.message}.`); console.log("Inventaire supprimé (overwrite)."); showSettingsFeedback('import', `Inventaire supprimé. Import ${toUpsert.length} composants...`, 'info'); await delay(500); } else { showSettingsFeedback('import', `Validation OK. Import/MàJ ${toUpsert.length} composants (${mode})...`, 'info'); } const { data: upsertData, error: upsertErr } = await supabase.from('inventory').upsert(toUpsert, { onConflict: 'ref' }).select('ref'); if (upsertErr) throw new Error(`Erreur DB import: ${upsertErr.message}`); showSettingsFeedback('import', `Import OK. ${upsertData?.length||0} composants ajoutés/mis à jour.`, 'success'); if (inventoryView?.classList.contains('active-view')) displayInventory(1); if (adminView?.classList.contains('active-view')) resetStockForm(); } catch (err) { console.error("Erreur import/suppression:", err); showSettingsFeedback('import', `Erreur critique import: ${err.message}`, 'error'); } finally { resetImportState(); } } else { showSettingsFeedback('import', "Aucune ligne valide à importer trouvée.", 'warning'); resetImportState(); } }, error: (error) => { console.error("Erreur PapaParse:", error); showSettingsFeedback('import', `Erreur lecture CSV: ${error.message}`, 'error'); resetImportState(); } }); }
    function resetImportState() { if(importInventoryCsvButton)importInventoryCsvButton.disabled=false;if(importCsvFileInput){importCsvFileInput.disabled=false;importCsvFileInput.value='';} const enrichRadio = document.getElementById('import-mode-enrich'); if (enrichRadio instanceof HTMLInputElement) enrichRadio.checked = true; }
    function addSettingsEventListeners() { exportInventoryCsvButton?.addEventListener('click',handleExportInventoryCSV);exportLogTxtButton?.addEventListener('click',handleExportLogTXT);importInventoryCsvButton?.addEventListener('click',handleImportInventoryCSV);}

    // --- Initialisation Générale ---
    function initializeApp() {
        console.log("Initialisation StockAV...");
        const requiredIds = ['login-area', 'user-info-area', 'main-navigation', 'search-view', 'inventory-view', 'log-view', 'admin-view', 'settings-view', 'inventory-table-body', 'response-output', 'seven-segment-display', 'inventory-attribute-filters', 'export-critical-feedback']; // Ajout vérif ID feedback critique
        if (requiredIds.some(id => !document.getElementById(id))) { console.error("DOM essentiel manquant:", requiredIds.filter(id => !document.getElementById(id))); document.body.innerHTML = `<div style="color:red;padding:20px;">Erreur critique: Éléments HTML manquants. App non fonctionnelle.</div>`; return; }

        // --- Écouteurs Événements ---
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
        componentInputChat.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleUserInput(); }});
        // Filtres Inventaire
        applyInventoryFilterButton?.addEventListener('click', () => { displayInventory(1); });
        inventorySearchFilter?.addEventListener('keypress', (e) => { if (e.key === 'Enter') applyInventoryFilterButton?.click(); });
        inventoryCategoryFilter?.addEventListener('change', async () => { await updateAttributeFiltersUI(); /* Optionnel: displayInventory(1); */ });
        // Pagination Inventaire
        inventoryPrevPageButton?.addEventListener('click', () => { if (currentInventoryPage > 1) displayInventory(currentInventoryPage - 1); });
        inventoryNextPageButton?.addEventListener('click', () => { if (!inventoryNextPageButton?.disabled) displayInventory(currentInventoryPage + 1); });
        inventoryTableBody.addEventListener('click', handleInventoryRowClick);
        // Pagination Log
        logPrevPageButton?.addEventListener('click', () => { if (currentLogPage > 1) displayLog(currentLogPage - 1); });
        logNextPageButton?.addEventListener('click', () => { if (!logNextPageButton?.disabled) displayLog(currentLogPage + 1); });

        // Écouteurs Admin et Settings (inclut maintenant l'export critique)
        addCategoryEventListeners();
        addComponentCategorySelectListener();
        addStockEventListeners(); // Contient maintenant le listener pour export critique
        addSettingsEventListeners();

        // Démarrer Auth et état initial
        setupAuthListener(); // Lance la vérification de session initiale et met en place le listener
        updateSevenSegmentForComponent(null); // État initial propre du 7-seg
        console.log("StockAV initialisé.");
    }

    // --- Lancer l'app ---
    initializeApp();

}); // ----- FIN DU FICHIER script.js -----