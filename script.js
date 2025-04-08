// ----- DÉBUT DU FICHIER script.js -----
// Assure que le code s'exécute après le chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
    "use strict"; // Active le mode strict pour détecter plus d'erreurs

    // --- Configuration et Variables Globales ---
    let currentUser = null;
    let currentUserCode = null; // Stocke le code utilisateur (partie avant @)
    const ITEMS_PER_PAGE = 15; // Nombre d'éléments par page pour l'inventaire et le log
    let isInitialAuthCheckComplete = false; // Flag pour éviter les race conditions à l'init
    let activeSession = null; // Stocke la session Supabase active
    let lastDisplayedDrawer = null; // Garde en mémoire le dernier tiroir affiché sur le 7 segments
    let categoriesCache = []; // Cache pour les catégories

    // --- Configuration Supabase ---
    // IMPORTANT: Assurez-vous que ces valeurs sont correctes
    const SUPABASE_URL = 'https://tjdergojgghzmopuuley.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZGVyZ29qZ2doem1vcHV1bGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4MTU0OTUsImV4cCI6MjA1OTM5MTQ5NX0.XejQYEPYoCrgYOwW4T9g2VcmohCdLLndDdwpSYXAwPA';
    const FAKE_EMAIL_DOMAIN = '@stockav.local'; // Domaine utilisé pour construire les emails factices
    const AI_FUNCTION_NAME = 'ai-component-info'; // Nom de la fonction Edge Supabase pour l'IA

    let supabase = null; // Le client Supabase sera initialisé ici

    // --- Initialisation des Clients et Vérifications ---
    try {
        // Vérification de la configuration essentielle
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !FAKE_EMAIL_DOMAIN) {
            throw new Error("Configuration Supabase (URL, Clé Anon, Domaine Factice) manquante ou incomplète dans script.js !");
        }
        // Vérification de la présence de la librairie Supabase
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log("Client Supabase initialisé avec succès.");
        } else {
            // Erreur si la librairie Supabase n'est pas chargée avant ce script
            throw new Error("La librairie Supabase (supabase-js@2) n'est pas chargée correctement avant ce script. Vérifiez l'ordre dans index.html.");
        }
        // Vérification optionnelle de PapaParse pour l'import CSV
        if (typeof Papa === 'undefined') {
            console.warn("Librairie PapaParse non chargée. L'import/export CSV ne fonctionnera pas.");
        }
    } catch (error) {
        // Gère les erreurs critiques d'initialisation
        console.error("Erreur critique lors de l'initialisation:", error);
        const body = document.querySelector('body');
        if (body) {
            // Affiche un message d'erreur clair à l'utilisateur si l'init échoue
             body.innerHTML = `<div style="padding: 20px; background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; border-radius: .25rem; font-family: sans-serif;"><h2>Erreur Critique</h2><p>L'application n'a pas pu démarrer correctement.</p><p><strong>Détails :</strong> ${error.message}</p><p>Veuillez vérifier la console du navigateur (F12) pour plus d'informations techniques et vous assurer que les librairies externes (Supabase.js) sont correctement chargées dans votre fichier HTML.</p></div>`;
        }
        return; // Arrête l'exécution du script si l'initialisation échoue
    }

    // --- Récupération des Éléments DOM ---
    // Utilise des 'const' car ces éléments ne devraient pas être réassignés
    // Ajoute des vérifications initiales pour les éléments critiques (optionnel mais recommandé)
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
    const viewSections = document.querySelectorAll('.view-section'); // NodeList de toutes les sections de vue
    const protectedButtons = document.querySelectorAll('.nav-button.protected'); // Boutons nécessitant connexion
    // Éléments de la modale de quantité
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
    const modalAttributesSection = document.querySelector('.modal-attributes-section'); // Utilise querySelector pour la classe
    const modalAttributesList = document.getElementById('modal-component-attributes');
    // Afficheur 7 segments
    const sevenSegmentDisplay = document.getElementById('seven-segment-display');
    const segmentDigits = sevenSegmentDisplay ? [ // Vérifie si sevenSegmentDisplay existe avant querySelector
        sevenSegmentDisplay.querySelector('.digit-1'), sevenSegmentDisplay.querySelector('.digit-2'),
        sevenSegmentDisplay.querySelector('.digit-3'), sevenSegmentDisplay.querySelector('.digit-4')
    ] : [null, null, null, null]; // Fournit des valeurs null si l'afficheur n'est pas trouvé
    // État de la modale
    let modalCurrentRef = null; // Référence du composant dans la modale
    let modalInitialQuantity = 0; // Quantité initiale au moment de l'ouverture
    let currentModalChange = 0; // Changement (+/-) appliqué dans la modale
    // État de pagination et filtres Inventaire
    let currentInventoryPage = 1;
    let currentInventoryFilters = { category: 'all', search: '' };
    const inventoryTableBody = document.getElementById('inventory-table-body');
    const inventoryCategoryFilter = document.getElementById('inventory-category-filter');
    const inventorySearchFilter = document.getElementById('inventory-search-filter');
    const applyInventoryFilterButton = document.getElementById('apply-inventory-filter-button');
    const inventoryPrevPageButton = document.getElementById('inventory-prev-page');
    const inventoryNextPageButton = document.getElementById('inventory-next-page');
    const inventoryPageInfo = document.getElementById('inventory-page-info');
    const inventoryNoResults = document.getElementById('inventory-no-results'); // Pour afficher "aucun résultat"
    // État de pagination et éléments Log
    let currentLogPage = 1;
    const logTableBody = document.getElementById('log-table-body');
    const logPrevPageButton = document.getElementById('log-prev-page');
    const logNextPageButton = document.getElementById('log-next-page');
    const logPageInfo = document.getElementById('log-page-info');
    const logNoResults = document.getElementById('log-no-results'); // Pour afficher "aucun log"
    const logFeedbackDiv = document.getElementById('log-feedback'); // Feedback spécifique au log
    const purgeLogContainer = document.getElementById('purge-log-container'); // Conteneur bouton purge
    const purgeLogButton = document.getElementById('purge-log-button'); // Bouton purge
    // Éléments Admin - Gestion Catégories
    const categoryList = document.getElementById('category-list');
    const categoryForm = document.getElementById('category-form');
    const categoryNameInput = document.getElementById('category-name');
    const categoryAttributesInput = document.getElementById('category-attributes');
    const categoryIdEditInput = document.getElementById('category-id-edit'); // Input caché pour l'ID en édition
    const cancelEditButton = document.getElementById('cancel-edit-button');
    const categoryFormTitle = document.getElementById('category-form-title');
    const adminFeedbackDiv = document.getElementById('admin-feedback'); // Feedback général de l'admin
    // Éléments Admin - Gestion Stock
    const stockForm = document.getElementById('stock-form');
    const componentRefAdminInput = document.getElementById('component-ref-admin');
    const checkStockButton = document.getElementById('check-stock-button');
    const componentInfoDiv = document.getElementById('component-info'); // Section affichée après vérification
    const currentQuantitySpan = document.getElementById('current-quantity');
    const updateQuantityButton = document.getElementById('update-quantity-button');
    const quantityChangeInput = document.getElementById('quantity-change'); // Pour l'ajout/retrait manuel admin
    const componentCategorySelectAdmin = document.getElementById('component-category-select'); // Select catégorie
    const specificAttributesDiv = document.getElementById('category-specific-attributes'); // Div pour attributs
    const componentDescInput = document.getElementById('component-desc');
    const componentMfgInput = document.getElementById('component-mfg');
    const componentDatasheetInput = document.getElementById('component-datasheet');
    const componentInitialQuantityInput = document.getElementById('component-initial-quantity'); // Pour nouveau comp.
    const componentInitialQuantityGroup = document.querySelector('.initial-quantity-group'); // Le div parent
    const componentDrawerAdminInput = document.getElementById('component-drawer-admin');
    const componentThresholdInput = document.getElementById('component-threshold');
    const saveComponentButton = document.getElementById('save-component-button'); // Pour sauver nouveau/modif comp.
    // Éléments Vue Recherche (Chat AI)
    const searchButtonChat = document.getElementById('search-button');
    const componentInputChat = document.getElementById('component-input');
    const responseOutputChat = document.getElementById('response-output');
    const loadingIndicatorChat = document.getElementById('loading-indicator');
    // Éléments Vue Paramètres (Export/Import)
    const exportInventoryCsvButton = document.getElementById('export-inventory-csv-button');
    const exportLogTxtButton = document.getElementById('export-log-txt-button');
    const exportFeedbackDiv = document.getElementById('export-feedback');
    const importCsvFileInput = document.getElementById('import-csv-file');
    const importFileLabel = document.getElementById('import-file-label'); // Label pour nom fichier
    const importInventoryCsvButton = document.getElementById('import-inventory-csv-button');
    const importFeedbackDiv = document.getElementById('import-feedback');
    const importModeRadios = document.querySelectorAll('input[name="import-mode"]'); // Pour choisir mode d'import

    // --- État et Historique du Chat ---
    let chatHistory = []; // Garde l'historique pour l'envoyer à l'IA
    let conversationState = { // Gère l'état de la conversation pour les questions multi-tours
        awaitingEquivalentChoice: false, // Attend que l'user choisisse un équivalent proposé
        awaitingQuantityConfirmation: false, // Attend confirmation (oui/non/qté) après proposition de prise
        originalRefChecked: null, // La réf originale demandée par l'user
        potentialEquivalents: [], // Liste des équivalents trouvés (avec stock)
        chosenRefForStockCheck: null, // La réf (originale ou équivalent) choisie pour vérifier/prendre
        availableQuantity: 0, // Quantité dispo de chosenRefForStockCheck
        criticalThreshold: null, // Seuil critique de chosenRefForStockCheck
        suggestedQuantity: null // Quantité suggérée par l'IA pour la prise
    };

    // --- Fonctions Utilitaires ---
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms)); // Pour simuler la frappe de l'IA

    // Renvoie le statut du stock ('ok', 'warning', 'critical', 'unknown')
    function getStockStatus(quantity, threshold) {
        // Gère les cas où la quantité n'est pas définie ou invalide
        if (quantity === undefined || quantity === null || isNaN(quantity)) return 'unknown';
        quantity = Number(quantity);
        // Gère les cas où le seuil n'est pas défini ou invalide (on le traite comme s'il n'y avait pas de seuil)
        threshold = (threshold === undefined || threshold === null || isNaN(threshold)) ? -1 : Number(threshold);

        if (quantity <= 0) return 'critical'; // Quantité nulle ou négative
        if (threshold >= 0 && quantity <= threshold) return 'warning'; // Quantité inférieure ou égale au seuil
        return 'ok'; // Quantité suffisante
    }

    // Crée le HTML pour l'indicateur visuel de stock (utilisé dans le chat et l'inventaire)
    function createStockIndicatorHTML(quantity, threshold) {
        const status = getStockStatus(quantity, threshold);
        const statusText = status.toUpperCase();
        // Texte pour le tooltip (title)
        const thresholdText = (threshold === undefined || threshold === null || threshold < 0) ? 'N/A' : threshold;
        const qtyText = (quantity === undefined || quantity === null) ? 'N/A' : quantity;
        const title = `Stock: ${statusText} (Qté: ${qtyText}, Seuil: ${thresholdText})`;
        // Retourne un span avec la classe de statut pour la couleur CSS et le title
        return `<span class="stock-indicator level-${status}" title="${title}"></span>`;
    }

    // --- Authentification ---
    // Gère la tentative de connexion
    async function handleLogin() {
        if (!supabase) {
            if(loginError) { loginError.textContent = "Erreur: Client Supabase non initialisé."; loginError.style.display = 'block'; }
            return;
        }
        const code = loginCodeInput?.value.trim().toLowerCase();
        const password = loginPasswordInput?.value.trim();
        if(loginError) loginError.style.display = 'none'; // Cache l'erreur précédente

        if (!code || !password) {
            if(loginError) { loginError.textContent = "Code et mot de passe requis."; loginError.style.display = 'block'; }
            return;
        }

        const email = code + FAKE_EMAIL_DOMAIN; // Construit l'email factice
        if(loginButton) loginButton.disabled = true;
        if(loginError) { loginError.textContent = "Connexion en cours..."; loginError.style.color = 'var(--text-muted)'; loginError.style.display = 'block'; }

        try {
            // Tente de se connecter avec Supabase Auth
            const { data, error } = await supabase.auth.signInWithPassword({ email: email, password: password });

            if (error) {
                console.error("Erreur connexion Supabase:", error.message);
                // Affiche un message plus clair pour l'utilisateur
                if(loginError) {
                    loginError.textContent = (error.message.includes("Invalid login credentials"))
                        ? "Code ou mot de passe incorrect."
                        : "Erreur de connexion. Vérifiez la console.";
                    loginError.style.color = 'var(--error-color)';
                    loginError.style.display = 'block';
                }
                loginCodeInput?.focus(); // Remet le focus sur le code
            } else {
                // Connexion réussie (l'événement onAuthStateChange gérera la suite)
                console.log("Demande de connexion Supabase réussie pour:", data.user?.email);
                if(loginError) loginError.style.display = 'none'; // Cache le message "Connexion..."
                if(loginCodeInput) loginCodeInput.value = ''; // Vide les champs
                if(loginPasswordInput) loginPasswordInput.value = '';
            }
        } catch (err) {
             // Erreur JavaScript inattendue
             console.error("Erreur JavaScript pendant la connexion:", err);
             if(loginError) {
                 loginError.textContent = "Erreur inattendue lors de la connexion.";
                 loginError.style.color = 'var(--error-color)';
                 loginError.style.display = 'block';
             }
        } finally {
             // Réactive le bouton dans tous les cas
             if(loginButton) loginButton.disabled = false;
        }
    }

    // Gère la déconnexion
    async function handleLogout() {
        if (!supabase) {
            console.error("Client Supabase non initialisé lors de la tentative de déconnexion.");
            alert("Erreur: Client Supabase non initialisé.");
            return;
        }
        console.log("Tentative de déconnexion...");
        if(logoutButton) logoutButton.disabled = true; // Désactive pendant l'opération

        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error("Erreur lors de la déconnexion Supabase:", error.message, error);
            alert(`Erreur lors de la déconnexion: ${error.message}. Vérifiez la console.`);
            if(logoutButton) logoutButton.disabled = false; // Réactive en cas d'erreur
        } else {
            console.log("Déconnexion Supabase réussie.");
            // L'événement onAuthStateChange gérera la mise à jour de l'UI.
            // Nettoyage spécifique à la déconnexion (qui n'est pas géré par handleUserDisconnected) :
            if (searchView?.classList.contains('active-view') && chatHistory.length > 0) {
                 displayWelcomeMessage(); // Réinitialise le chat si c'était la vue active
            }
            lastDisplayedDrawer = null; // Réinitialise l'afficheur
            updateSevenSegmentDisplay(null);
            if (logFeedbackDiv) { showLogFeedback('', 'none'); } // Cache feedback log

            // Note: L'état du bouton logout sera géré par handleUserDisconnected via la classe CSS body.user-logged-in
        }
    }

    // Met en place l'écouteur d'événements d'authentification Supabase
    async function setupAuthListener() {
        if (!supabase) {
            console.error("Impossible de mettre en place le listener d'authentification : Client Supabase non initialisé.");
            // Peut-être afficher une erreur à l'utilisateur ici aussi ?
            return;
        }
        try {
            // 1. Vérification initiale de la session au chargement
            console.log("Vérification de la session initiale (getSession)...");
            const { data: { session } } = await supabase.auth.getSession();
            activeSession = session; // Met à jour la session active
            isInitialAuthCheckComplete = true; // Marque la vérif initiale comme terminée
            if (session) {
                console.log("Session initiale trouvée via getSession.");
                handleUserConnected(session.user, true); // Traite comme une connexion initiale
            } else {
                console.log("Pas de session initiale trouvée via getSession.");
                handleUserDisconnected(true); // Traite comme une déconnexion initiale
            }
        } catch (error) {
            console.error("Erreur critique lors de la récupération de la session initiale (getSession):", error);
            isInitialAuthCheckComplete = true; // Marque comme terminé même en cas d'erreur
            handleUserDisconnected(true); // Assume déconnecté en cas d'erreur grave
        }

        // 2. Écoute des changements d'état d'authentification suivants
        supabase.auth.onAuthStateChange((event, session) => {
            console.log(`Événement Auth Supabase reçu: ${event}`, session ? `Session pour ${session.user.email}` : "Pas de session");
            activeSession = session; // Met toujours à jour la session active

            // Ignore les événements reçus avant la fin de la vérification initiale
            if (!isInitialAuthCheckComplete) {
                console.log("Événement Auth reçu avant la fin de la vérification initiale, en attente...");
                return;
            }

            // Gère les différents types d'événements
            switch (event) {
                case 'SIGNED_IN':
                    handleUserConnected(session.user, false); // Nouvel utilisateur connecté
                    break;
                case 'SIGNED_OUT':
                    handleUserDisconnected(false); // Utilisateur déconnecté
                    break;
                case 'TOKEN_REFRESHED':
                    console.log("Token d'authentification rafraîchi.");
                    // Vérifie si l'utilisateur a changé pendant le rafraîchissement (peu probable mais possible)
                    if (session && currentUser && session.user.id !== currentUser.id) {
                        console.log("Changement d'utilisateur détecté après rafraîchissement du token.");
                        handleUserConnected(session.user, false);
                    } else if (!session && currentUser) {
                        // Si le rafraîchissement échoue et résulte en l'absence de session
                        console.log("Session perdue après tentative de rafraîchissement du token.");
                        handleUserDisconnected(false);
                    }
                    break;
                case 'USER_UPDATED':
                    console.log("Informations utilisateur mises à jour:", session?.user);
                    if (session) {
                        // Met à jour l'état local si l'utilisateur est toujours connecté
                        handleUserConnected(session.user, false);
                    }
                    break;
                case 'PASSWORD_RECOVERY':
                    // Peut être utilisé pour afficher un message spécifique
                    console.log("Événement de récupération de mot de passe reçu.");
                    break;
                default:
                    console.log("Événement d'authentification Supabase non géré explicitement:", event);
            }
        });
    }

    // Gère la mise à jour de l'UI et de l'état lorsqu'un utilisateur est connecté
    function handleUserConnected(user, isInitialLoad) {
        const previousUserId = currentUser?.id; // Garde l'ID précédent pour comparer
        currentUser = user; // Met à jour l'utilisateur global
        currentUserCode = currentUser.email.split('@')[0]; // Extrait le code utilisateur
        console.log(`Utilisateur connecté : ${currentUserCode} (ID: ${currentUser.id}) - Est-ce le chargement initial ? ${isInitialLoad}`);

        document.body.classList.add('user-logged-in'); // Ajoute classe au body pour CSS
        if(loginArea) loginArea.style.display = 'none'; // Cache zone de login
        if(userInfoArea) userInfoArea.style.display = 'flex'; // Affiche zone user info
        if(userDisplay) userDisplay.textContent = currentUserCode.toUpperCase(); // Affiche code user
        if(loginError) loginError.style.display = 'none'; // Cache erreur login éventuelle

        // Active les boutons protégés et gère le bouton settings spécifiquement
        protectedButtons.forEach(btn => {
            if (btn.id === 'show-settings-view') { // Cas spécial pour le bouton Paramètres
                if (currentUserCode === 'zine') { // Seul 'zine' peut voir les paramètres
                    btn.style.display = 'inline-block';
                    btn.disabled = false;
                    btn.title = ''; // Pas de tooltip restrictif
                } else {
                    btn.style.display = 'none'; // Cache le bouton pour les autres
                    btn.disabled = true;
                    btn.title = 'Accès réservé';
                }
            } else { // Autres boutons protégés (Inventaire, Log, Admin)
                btn.style.display = 'inline-block';
                btn.disabled = false;
                btn.title = ''; // Pas de tooltip restrictif
            }
        });

        // Recharge le cache des catégories si vide (peut arriver après déconnexion/reconnexion)
        if (categoriesCache.length === 0) {
            getCategories(); // Lance la récupération des catégories en arrière-plan
        }

        // Si ce n'est pas le chargement initial ET que l'utilisateur a changé
        if (!isInitialLoad && user.id !== previousUserId) {
            console.log("Nouvelle connexion détectée (utilisateur différent du précédent). Réinitialisation des vues protégées.");
            invalidateCategoriesCache(); // Vide le cache des catégories car les droits peuvent changer
            clearProtectedViewData(); // Vide les données affichées dans les vues protégées
            // Réinitialise les vues spécifiques si elles étaient actives
            if (searchView?.classList.contains('active-view')) { displayWelcomeMessage(); } // Reset chat
            if (logView?.classList.contains('active-view')) { displayLog(); } // Recharge log
            if (inventoryView?.classList.contains('active-view')) { populateInventoryFilters(); displayInventory(); } // Recharge inventaire
            if (adminView?.classList.contains('active-view')) { loadAdminData(); } // Recharge admin
            // Note: Pas besoin de recharger settings ici car l'accès est géré par setActiveView/bouton
        }
        // Si c'est le chargement initial et un utilisateur est connecté
        else if (isInitialLoad) {
            // Charge les données de la vue actuellement affichée (si elle existe et nécessite des données)
            const activeView = document.querySelector('.view-section.active-view');
             if (activeView) {
                 console.log(`Chargement initial avec utilisateur connecté, vue active: ${activeView.id}`);
                 if (activeView.id === 'inventory-view') { populateInventoryFilters(); displayInventory(); }
                 else if (activeView.id === 'log-view') { displayLog(); }
                 else if (activeView.id === 'admin-view') { loadAdminData(); }
                 else if (activeView.id === 'settings-view') {
                     // Vérifie à nouveau si l'utilisateur a le droit d'être ici
                     if (currentUserCode === 'zine') { loadSettingsData(); }
                     else {
                         console.warn("Tentative d'accès initial à la vue Settings refusée pour", currentUserCode, "Redirection vers Recherche.");
                         setActiveView(searchView, searchTabButton); // Redirige si pas 'zine'
                     }
                 }
                 else if (activeView.id === 'search-view' && chatHistory.length === 0) {
                     displayWelcomeMessage(); // Affiche message accueil chat si vide
                 }
             } else {
                 // Si aucune vue n'est active au chargement (devrait être géré par HTML/CSS initial?), active la recherche par défaut
                 console.log("Chargement initial avec utilisateur, aucune vue active, activation de la vue Recherche.");
                 setActiveView(searchView, searchTabButton);
             }
        }
        // Met à jour l'afficheur 7 segments (pourrait afficher 'USER' ou rien)
        updateSevenSegmentDisplay(); // Mettre à jour sans valeur spécifique utilise lastDisplayedDrawer ou efface
    }

    // Gère la mise à jour de l'UI et de l'état lorsqu'un utilisateur est déconnecté
    function handleUserDisconnected(isInitialLoad) {
        console.log(`Utilisateur déconnecté ou session absente. Est-ce le chargement initial ? ${isInitialLoad}`);
        currentUser = null; // Réinitialise l'utilisateur global
        currentUserCode = null;
        activeSession = null; // Assure que la session active est nulle

        document.body.classList.remove('user-logged-in'); // Retire classe du body
        if(userInfoArea) userInfoArea.style.display = 'none'; // Cache zone user info
        if(loginArea) loginArea.style.display = 'block'; // Affiche zone login
        if(logoutButton) logoutButton.disabled = true; // Désactive le bouton logout

        // Cache et désactive tous les boutons protégés
        protectedButtons.forEach(btn => {
            btn.style.display = 'none';
            btn.disabled = true;
            btn.title = 'Connexion requise';
        });

        // Cache la modale si elle était ouverte
        hideQuantityModal();
        // Réinitialise l'afficheur 7 segments
        lastDisplayedDrawer = null;
        updateSevenSegmentDisplay(null);
        // Cache les feedbacks spécifiques aux vues
        if (logFeedbackDiv) { showLogFeedback('', 'none'); }
        if (adminFeedbackDiv) { showAdminFeedback('', 'none'); }
        if (exportFeedbackDiv) { showSettingsFeedback('export', '', 'none'); }
        if (importFeedbackDiv) { showSettingsFeedback('import', '', 'none'); }


        // Si ce n'est pas le chargement initial (c'est une déconnexion réelle)
        if (!isInitialLoad) {
            invalidateCategoriesCache(); // Vide le cache des catégories
            clearProtectedViewData(); // Vide les données affichées dans les vues protégées
            resetConversationState(); // Réinitialise l'état du chat
             // Réinitialise le chat si c'était la vue active
            if (searchView?.classList.contains('active-view') && chatHistory.length > 0) {
                 displayWelcomeMessage();
            }
        }

        // Vérifie si l'utilisateur était sur une vue protégée et redirige si nécessaire
        const activeView = document.querySelector('.view-section.active-view');
        if (activeView && (activeView.id === 'inventory-view' || activeView.id === 'log-view' || activeView.id === 'admin-view' || activeView.id === 'settings-view')) {
            console.log("Redirection vers la vue Recherche car l'utilisateur est déconnecté d'une vue protégée.");
            setActiveView(searchView, searchTabButton); // Redirige vers la recherche
        } else if (isInitialLoad && !activeView) {
            // Si chargement initial, pas de session, et aucune vue active, active la recherche
             console.log("Chargement initial sans utilisateur, aucune vue active, activation de la vue Recherche.");
            setActiveView(searchView, searchTabButton);
        }
    }

    // Vide les données spécifiques aux vues protégées de l'UI
    function clearProtectedViewData() {
        console.log("Nettoyage des données des vues protégées de l'UI...");
        // Inventaire
        if(inventoryTableBody) inventoryTableBody.innerHTML = '';
        if(inventoryPageInfo) inventoryPageInfo.textContent = 'Page - / -';
        if(inventoryPrevPageButton) inventoryPrevPageButton.disabled = true;
        if(inventoryNextPageButton) inventoryNextPageButton.disabled = true;
        if(inventoryNoResults) inventoryNoResults.style.display = 'none';
        if(inventoryCategoryFilter) inventoryCategoryFilter.innerHTML = '<option value="all">Toutes les catégories</option>'; // Reset filtres
        if(inventorySearchFilter) inventorySearchFilter.value = '';
        currentInventoryPage = 1; // Reset page inventaire
        currentInventoryFilters = { category: 'all', search: '' }; // Reset filtres état

        // Log
        if(logTableBody) logTableBody.innerHTML = '';
        if(logPageInfo) logPageInfo.textContent = 'Page - / -';
        if(logPrevPageButton) logPrevPageButton.disabled = true;
        if(logNextPageButton) logNextPageButton.disabled = true;
        if(logNoResults) logNoResults.style.display = 'none';
        currentLogPage = 1; // Reset page log
        // Retire les éléments spécifiques admin du log si présents
        const logActionsHeader = document.querySelector('#log-table th.log-actions-header');
        if (logActionsHeader) logActionsHeader.remove();
        const logActionCells = logTableBody?.querySelectorAll('td.log-actions-cell');
        logActionCells?.forEach(cell => cell.remove());
        if (purgeLogContainer) purgeLogContainer.style.display = 'none';
        if (logFeedbackDiv) { showLogFeedback('', 'none'); } // Cache feedback

        // Admin
        if (categoryList) categoryList.innerHTML = '';
        resetCategoryForm(); // Reset formulaire catégorie
        resetStockForm(); // Reset formulaire stock
        if (componentInfoDiv) componentInfoDiv.style.display = 'none'; // Cache infos composant
        if (adminFeedbackDiv) { adminFeedbackDiv.textContent = ''; adminFeedbackDiv.style.display = 'none'; } // Cache feedback admin

        // Settings
        if(exportFeedbackDiv) { exportFeedbackDiv.textContent = ''; exportFeedbackDiv.style.display = 'none'; } // Cache feedback export
        if(importFeedbackDiv) { importFeedbackDiv.textContent = ''; importFeedbackDiv.style.display = 'none'; } // Cache feedback import
        if(importCsvFileInput) importCsvFileInput.value = ''; // Reset champ fichier
        if(importFileLabel) importFileLabel.textContent = 'Choisir un fichier CSV...'; // Reset label fichier
        resetImportState(); // Assure que les boutons/radios sont dans l'état initial

        console.log("Données des vues protégées effacées de l'UI.");
    }


    // --- Navigation ---
    // Gère l'affichage de la vue sélectionnée et met en évidence le bouton actif
    function setActiveView(viewToShow, buttonToActivate){
        // Sécurité : si la vue n'existe pas, retourne à la recherche
        if (!viewToShow) {
            console.warn("setActiveView: Tentative d'activation d'une vue invalide. Retour à la vue Recherche.");
            viewToShow = searchView;
            buttonToActivate = searchTabButton;
        }

        // Si la vue demandée est déjà active, ne rien faire
        if (viewToShow.classList.contains('active-view')) {
            console.log(`Vue ${viewToShow.id} déjà active.`);
            return;
        }

        // Vérification de l'accès aux vues protégées
        // L'inventaire n'est PAS protégé, seul le clic sur une ligne l'est
        const isProtectedStrict = viewToShow.id === 'log-view' || viewToShow.id === 'admin-view' || viewToShow.id === 'settings-view';
        let canAccess = true;

        if (isProtectedStrict && !currentUser) {
            canAccess = false;
            console.warn(`Accès refusé à la vue protégée '${viewToShow.id}' car non connecté.`);
            // Affiche l'erreur dans la zone de login si elle existe
            if (loginError) {
                loginError.textContent = "Connexion requise pour accéder à cette section.";
                loginError.style.color = 'var(--error-color)';
                loginError.style.display = 'block';
            }
            loginCodeInput?.focus(); // Met le focus sur le champ de code
        } else if (viewToShow.id === 'settings-view' && currentUserCode !== 'zine') {
            // Cas spécifique pour la vue Paramètres, seul 'zine' y a accès
            canAccess = false;
            console.warn(`Accès refusé à la vue '${viewToShow.id}' pour l'utilisateur '${currentUserCode}' (seul 'zine' autorisé).`);
            alert("Accès à cette section réservé à l'administrateur 'zine'.");
            // Ne pas changer de vue si l'accès est refusé ici
            return;
        }

        // Si l'accès est refusé (non connecté), ne pas continuer
        if (!canAccess) {
            return;
        }

        console.log(`Activation de la vue: ${viewToShow.id}`);

        // Cache les messages de feedback des autres vues
        if (logFeedbackDiv) showLogFeedback('', 'none');
        if (adminFeedbackDiv) showAdminFeedback('', 'none');
        if (exportFeedbackDiv) showSettingsFeedback('export', '', 'none');
        if (importFeedbackDiv) showSettingsFeedback('import', '', 'none');
        if (modalFeedback) modalFeedback.textContent = ''; // Cache feedback modale aussi

        // Cache toutes les sections de vue et retire la classe active
        viewSections.forEach(section => {
            section.style.display = 'none';
            section.classList.remove('active-view');
        });

        // Retire la classe active de tous les boutons de navigation
        document.querySelectorAll('.nav-button').forEach(button => {
            button.classList.remove('active');
        });

        // Affiche la section de vue sélectionnée et ajoute la classe active
        viewToShow.style.display = 'block';
        viewToShow.classList.add('active-view');

        // Ajoute la classe active au bouton correspondant
        if (buttonToActivate) {
            buttonToActivate.classList.add('active');
        } else {
            // Fallback si buttonToActivate n'est pas fourni (devrait l'être)
            const realButtonId = `show-${viewToShow.id}`;
            const matchingButton = document.getElementById(realButtonId);
            if (matchingButton) {
                matchingButton.classList.add('active');
            }
        }

        // Actions spécifiques à lancer lors de l'activation de certaines vues
        if (viewToShow === searchView && chatHistory.length === 0) {
            displayWelcomeMessage(); // Affiche message d'accueil du chat si vide
        } else if (viewToShow === inventoryView) { // Pas besoin de currentUser ici, la vue est publique
            populateInventoryFilters(); // Charge les catégories dans le filtre
            displayInventory(); // Charge la première page de l'inventaire
        } else if (viewToShow === logView && currentUser) { // Protégé
            displayLog(); // Charge la première page du log
        } else if (viewToShow === adminView && currentUser) { // Protégé
            loadAdminData(); // Charge les données admin (catégories, etc.)
        } else if (viewToShow === settingsView && currentUser && currentUserCode === 'zine') { // Protégé + zine
            loadSettingsData(); // Charge les données/états des paramètres
        }
    }

    // --- LOGIQUE INVENTAIRE ---

    // Remplit le sélecteur de catégorie dans les filtres de l'inventaire
    async function populateInventoryFilters() {
        if (!inventoryCategoryFilter) {
            console.warn("Élément DOM inventory-category-filter introuvable.");
            return;
        }
        const currentVal = inventoryCategoryFilter.value; // Sauvegarde la valeur actuelle si déjà sélectionnée
        inventoryCategoryFilter.innerHTML = '<option value="all">Toutes les catégories</option>'; // Option par défaut
        try {
            const categories = await getCategories(); // Récupère les catégories (utilise le cache si possible)
            if (categories && categories.length > 0) {
                categories.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat.id; // Utilise l'ID de la catégorie comme valeur
                    option.textContent = cat.name; // Affiche le nom de la catégorie
                    inventoryCategoryFilter.appendChild(option);
                });
                // Resélectionne la valeur précédente si elle existe toujours
                if (inventoryCategoryFilter.querySelector(`option[value="${currentVal}"]`)) {
                    inventoryCategoryFilter.value = currentVal;
                } else {
                    inventoryCategoryFilter.value = 'all'; // Retour à 'Toutes' si la catégorie précédente a disparu
                }
                console.log("Filtres catégorie inventaire peuplés.");
            } else {
                console.warn("Aucune catégorie trouvée pour peupler les filtres d'inventaire.");
            }
        } catch (error) {
            console.error("Erreur lors du remplissage des filtres catégorie inventaire:", error);
            inventoryCategoryFilter.innerHTML = '<option value="all">Erreur chargement</option>';
        }
    }

    // Affiche la table de l'inventaire avec pagination et filtres
    async function displayInventory(page = 1) { // Par défaut à la page 1
        currentInventoryPage = page; // Met à jour la page courante globale
        if (!inventoryTableBody || !supabase) {
            console.warn("displayInventory: Prérequis manquants (inventoryTableBody ou client Supabase).");
            return;
        }

        // Affiche un état de chargement
        inventoryTableBody.innerHTML = '<tr class="loading-row"><td colspan="7" style="text-align:center; padding: 20px;"><i>Chargement de l\'inventaire...</i></td></tr>';
        if(inventoryNoResults) inventoryNoResults.style.display = 'none'; // Cache message "aucun résultat"
        if(inventoryPrevPageButton) inventoryPrevPageButton.disabled = true; // Désactive pagination pendant chargement
        if(inventoryNextPageButton) inventoryNextPageButton.disabled = true;
        if(inventoryPageInfo) inventoryPageInfo.textContent = 'Chargement...';

        const itemsPerPage = ITEMS_PER_PAGE;
        const startIndex = (currentInventoryPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage - 1;

        try {
            // *** VERSION DEBUG: SELECT simplifié pour tester RLS ***
            // Sélectionne toutes les colonnes de base, plus le seuil et les attributs JSON.
            // Ajoute { count: 'exact' } pour obtenir le nombre total d'éléments correspondant aux filtres.
            let query = supabase
                .from('inventory')
                .select('ref, description, category_id, manufacturer, quantity, drawer, datasheet, critical_threshold, attributes', { count: 'exact' });

            // Récupère les valeurs des filtres
            const searchValue = inventorySearchFilter?.value.trim().toLowerCase() || '';
            const categoryValue = inventoryCategoryFilter?.value || 'all';

            // Applique le filtre de recherche textuelle (si non vide)
            if (searchValue) {
                // Recherche dans ref, description, manufacturer. Ajoute 'drawer' si connecté.
                const searchColumns = ['ref', 'description', 'manufacturer'];
                if (currentUser) { // La recherche dans 'drawer' n'est pertinente que si connecté
                    searchColumns.push('drawer');
                }
                // Construit une condition OR pour rechercher dans plusieurs colonnes
                // Utilise ilike pour une recherche insensible à la casse
                query = query.or(searchColumns.map(col => `${col}.ilike.%${searchValue}%`).join(','));
                console.log(`Filtre inventaire recherche appliqué: "${searchValue}"`);
            }

            // Applique le filtre de catégorie (si pas 'all')
            if (categoryValue !== 'all') {
                query = query.eq('category_id', categoryValue);
                console.log(`Filtre inventaire catégorie appliqué: ID ${categoryValue}`);
            }

            // Applique le tri (par référence ascendante) et la pagination
            query = query.order('ref', { ascending: true }).range(startIndex, endIndex);

            // Exécute la requête
            const { data, error, count } = await query;

            // Vide le corps de la table avant d'ajouter les nouvelles lignes
            inventoryTableBody.innerHTML = '';

            // Gère les erreurs de la requête
            if (error) {
                // Détecte spécifiquement les erreurs RLS (Row Level Security)
                if (error.message.includes("security barrier") || error.message.includes("policy") || error.code === '42501') {
                    console.error(`Erreur RLS lors de la lecture de l'inventaire: ${error.message} (Code: ${error.code})`);
                    throw new Error(`Accès refusé aux données d'inventaire (RLS). Vérifiez les politiques de sécurité Supabase ou votre connexion.`);
                } else {
                    // Autres erreurs de base de données
                    console.error(`Erreur DB inconnue lors de la lecture de l'inventaire: ${error.message} (Code: ${error.code})`);
                    throw new Error(`Erreur base de données lors de la récupération de l'inventaire: ${error.message}`);
                }
            }

            // Traite les résultats
            const totalItems = count || 0; // Nombre total d'éléments correspondant aux filtres
            const totalPages = Math.ceil(totalItems / itemsPerPage); // Calcule le nombre total de pages

            if (totalItems === 0) {
                // Aucun résultat trouvé
                if(inventoryNoResults) {
                    inventoryNoResults.textContent = `Aucun composant trouvé${searchValue || categoryValue !== 'all' ? ' pour les filtres actuels' : ''}.`;
                    inventoryNoResults.style.display = 'block';
                }
                if(inventoryPageInfo) inventoryPageInfo.textContent = 'Page 0 / 0';
                console.log("Aucun composant trouvé dans l'inventaire avec les filtres actuels.");
            } else {
                // Des résultats ont été trouvés
                if(inventoryNoResults) inventoryNoResults.style.display = 'none'; // Cache le message "aucun résultat"

                // Prépare un map des noms de catégories pour un accès rapide (utilise le cache)
                const categoryNamesMap = (categoriesCache.length > 0)
                    ? Object.fromEntries(categoriesCache.map(cat => [cat.id, cat.name]))
                    : {};
                 // Si le cache est vide, tente de le charger à la volée (moins idéal)
                 if (Object.keys(categoryNamesMap).length === 0 && categoriesCache.length === 0) {
                     console.log("Cache catégories vide, tentative de récupération pour affichage inventaire...");
                     try {
                         const cats = await getCategories(true); // Force refresh si besoin
                         if (cats) {
                             cats.forEach(cat => categoryNamesMap[cat.id] = cat.name);
                         }
                     } catch (catError){
                         console.error("Impossible de charger les noms de catégories pour l'inventaire.", catError);
                     }
                 }


                // Crée les lignes de la table pour chaque composant (ordre correspond à thead HTML)
                data.forEach(item => {
                    const row = inventoryTableBody.insertRow();
                    row.dataset.ref = item.ref; // Ajoute la réf au dataset pour identification facile
                    row.classList.add('inventory-item-row'); // Pour ciblage CSS ou JS
                     // Rend la ligne cliquable (si l'utilisateur est connecté)
                    if (currentUser) {
                        row.style.cursor = 'pointer';
                        row.title = `Modifier la quantité de ${item.ref}`;
                    }


                    // Cellule 1: Indicateur de stock + Référence
                    const refCell = row.insertCell();
                    refCell.style.whiteSpace = 'nowrap'; // Empêche la césure de la réf
                    const statusIndicator = createStockIndicatorHTML(item.quantity, item.critical_threshold);
                    refCell.innerHTML = statusIndicator + ' ' + item.ref; // Ajoute indicateur et réf

                    // Cellule 2: Description
                    row.insertCell().textContent = item.description || '-';

                    // Cellule 3: Catégorie (affiche nom si trouvé, sinon ID ou '-')
                    const categoryName = item.category_id ? (categoryNamesMap[item.category_id] || `ID:${item.category_id}`) : '-';
                    row.insertCell().textContent = categoryName;

                    // Cellule 4: Fabricant
                    row.insertCell().textContent = item.manufacturer || '-';

                    // Cellule 5: Quantité
                    const qtyCell = row.insertCell();
                    qtyCell.textContent = item.quantity ?? 'N/A'; // Affiche 'N/A' si quantité nulle ou indéfinie
                    qtyCell.style.textAlign = 'right'; // Aligne la quantité à droite

                    // Cellule 6: Tiroir (uniquement si l'utilisateur est connecté)
                    const drawerCell = row.insertCell();
                    if (currentUser) {
                        drawerCell.textContent = item.drawer || '-';
                    } else {
                        drawerCell.textContent = 'N/C'; // Non Communiqué si pas connecté
                        drawerCell.title = 'Connectez-vous pour voir le tiroir';
                        drawerCell.style.fontStyle = 'italic';
                        drawerCell.style.color = 'var(--text-muted)';
                    }

                    // Cellule 7: Datasheet (lien cliquable si URL valide)
                    const datasheetCell = row.insertCell();
                    if (item.datasheet && typeof item.datasheet === 'string' && item.datasheet.startsWith('http')) {
                        datasheetCell.innerHTML = `<a href="${item.datasheet}" target="_blank" title="Ouvrir datasheet ${item.ref}"><i class="fas fa-file-pdf"></i> Lien</a>`;
                    } else {
                        datasheetCell.textContent = '-';
                    }
                });

                // Met à jour les informations de pagination
                if(inventoryPageInfo) inventoryPageInfo.textContent = `Page ${currentInventoryPage} / ${totalPages}`;
                if(inventoryPrevPageButton) inventoryPrevPageButton.disabled = (currentInventoryPage <= 1);
                if(inventoryNextPageButton) inventoryNextPageButton.disabled = (currentInventoryPage >= totalPages);

                console.log(`Inventaire affiché: Page ${currentInventoryPage}/${totalPages}, ${totalItems} éléments totaux (filtrés).`);
            }

        } catch (error) {
            // Gère les erreurs survenues pendant le processus (requête ou traitement)
            console.error("Erreur lors de l'affichage de l'inventaire:", error);
            inventoryTableBody.innerHTML = `<tr class="error-row"><td colspan="7" style="text-align:center; color: var(--error-color); padding: 20px;">Erreur lors du chargement de l'inventaire: ${error.message}</td></tr>`;
            if(inventoryPageInfo) inventoryPageInfo.textContent = 'Erreur';
            if(inventoryPrevPageButton) inventoryPrevPageButton.disabled = true;
            if(inventoryNextPageButton) inventoryNextPageButton.disabled = true;
        }
    }

    // --- LOGIQUE HISTORIQUE (LOG) ---

    // Affiche la table de l'historique avec pagination
    async function displayLog(page = 1) { // Par défaut à la page 1
        currentLogPage = page; // Met à jour la page courante globale
        if (!logTableBody || !supabase || !currentUser) { // Nécessite d'être connecté
            console.warn("displayLog: Prérequis manquants (logTableBody, Supabase ou utilisateur non connecté).");
            if(logTableBody) logTableBody.innerHTML = '<tr class="info-row"><td colspan="5" style="text-align:center; padding: 20px;"><i>Connexion requise pour voir l\'historique.</i></td></tr>';
            if(logPageInfo) logPageInfo.textContent = 'Page - / -';
            if(logPrevPageButton) logPrevPageButton.disabled = true;
            if(logNextPageButton) logNextPageButton.disabled = true;
            if(logNoResults) logNoResults.style.display = 'none';
             // Cache le bouton de purge si l'admin n'est pas connecté
             if (purgeLogContainer) purgeLogContainer.style.display = 'none';
            return;
        }

        // Affiche un état de chargement
        logTableBody.innerHTML = '<tr class="loading-row"><td colspan="5" style="text-align:center; padding: 20px;"><i>Chargement de l\'historique...</i></td></tr>';
        if(logNoResults) logNoResults.style.display = 'none';
        if(logPrevPageButton) logPrevPageButton.disabled = true;
        if(logNextPageButton) logNextPageButton.disabled = true;
        if(logPageInfo) logPageInfo.textContent = 'Chargement...';
         // Cache le bouton de purge pendant le chargement
         if (purgeLogContainer) purgeLogContainer.style.display = 'none';


        const itemsPerPage = ITEMS_PER_PAGE;
        const startIndex = (currentLogPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage - 1;

        try {
            // Récupère les entrées du log, triées par date décroissante (plus récent en premier)
            const { data, error, count } = await supabase
                .from('log')
                .select('*', { count: 'exact' }) // Récupère toutes les colonnes et le compte total
                .order('timestamp', { ascending: false }) // Trie par timestamp descendant
                .range(startIndex, endIndex); // Applique la pagination

            // Vide le corps de la table
            logTableBody.innerHTML = '';

            // Gère les erreurs de la requête (y compris RLS potentiel si mal configuré)
            if (error) {
                // Vérifie si l'erreur est due à la table manquante ou RLS
                if (error.message.includes('relation "public.log" does not exist')) {
                    console.error("Erreur: La table 'public.log' n'existe pas dans la base de données.", error);
                    throw new Error("Erreur: La table de l'historique n'a pas été trouvée. Veuillez contacter l'administrateur.");
                } else if (error.message.includes("security barrier") || error.message.includes("policy")) {
                    console.error(`Erreur RLS lors de la lecture du log: ${error.message}`);
                    throw new Error(`Accès refusé à l'historique (RLS). Vérifiez les politiques Supabase.`);
                } else {
                    console.error(`Erreur DB lors de la lecture du log: ${error.message}`);
                    throw new Error(`Erreur base de données lors de la récupération de l'historique: ${error.message}`);
                }
            }

            const totalItems = count || 0;
            const totalPages = Math.ceil(totalItems / itemsPerPage);

            // Vérifie si l'admin 'zine' est connecté pour afficher les options de suppression
            const isAdminZine = currentUserCode === 'zine';

            // Ajoute l'en-tête pour les actions si l'admin est connecté et qu'il n'existe pas déjà
            const logTableHead = document.querySelector('#log-table thead tr');
            let actionsHeader = logTableHead?.querySelector('.log-actions-header');
            if (isAdminZine && !actionsHeader && logTableHead) {
                actionsHeader = document.createElement('th');
                actionsHeader.classList.add('log-actions-header');
                actionsHeader.textContent = 'Actions';
                logTableHead.appendChild(actionsHeader);
            } else if (!isAdminZine && actionsHeader) {
                // Retire l'en-tête si l'utilisateur n'est pas l'admin 'zine'
                actionsHeader.remove();
            }

            if (totalItems === 0) {
                // Aucun log trouvé
                if(logNoResults) {
                    logNoResults.textContent = 'Aucune entrée dans l\'historique pour le moment.';
                    logNoResults.style.display = 'block';
                }
                if(logPageInfo) logPageInfo.textContent = 'Page 0 / 0';
                 // Cache le bouton de purge si log vide
                 if (purgeLogContainer) purgeLogContainer.style.display = 'none';
                console.log("Aucune entrée trouvée dans le log.");
            } else {
                 // Des logs ont été trouvés
                if(logNoResults) logNoResults.style.display = 'none';

                // Crée les lignes pour chaque entrée de log (ordre correspond à thead HTML)
                data.forEach(entry => {
                    const row = logTableBody.insertRow();
                    row.insertCell().textContent = formatLogTimestamp(entry.timestamp); // Timestamp formaté
                    row.insertCell().textContent = entry.user_code?.toUpperCase() || 'N/A'; // Code utilisateur
                    row.insertCell().textContent = entry.item_ref; // Référence de l'item
                    // Affiche le changement avec signe +/- et couleur
                    const changeCell = row.insertCell();
                    changeCell.textContent = (entry.change > 0 ? '+' : '') + entry.change;
                    changeCell.style.color = entry.change > 0 ? 'var(--success-color)' : 'var(--error-color)';
                    changeCell.style.fontWeight = 'bold';
                    row.insertCell().textContent = entry.new_quantity; // Nouvelle quantité

                    // Ajoute la cellule d'action (suppression) si l'admin 'zine' est connecté
                    if (isAdminZine) {
                        const actionCell = row.insertCell();
                        actionCell.classList.add('log-actions-cell'); // Pour ciblage CSS/JS
                        const deleteButton = document.createElement('button');
                        deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>'; // Utilise Font Awesome si disponible
                        // Fallback texte si pas d'icône: deleteButton.textContent = 'Suppr.';
                        deleteButton.classList.add('button-icon', 'button-danger-outline');
                        deleteButton.title = `Supprimer cette entrée (ID: ${entry.id})`;
                        deleteButton.dataset.logId = entry.id; // Stocke l'ID pour l'événement click
                        deleteButton.addEventListener('click', handleDeleteSingleLog); // Ajoute listener directement
                        actionCell.appendChild(deleteButton);
                    }
                });

                // Met à jour les informations de pagination
                if(logPageInfo) logPageInfo.textContent = `Page ${currentLogPage} / ${totalPages}`;
                if(logPrevPageButton) logPrevPageButton.disabled = (currentLogPage <= 1);
                if(logNextPageButton) logNextPageButton.disabled = (currentLogPage >= totalPages);

                // Affiche le bouton de purge si l'admin 'zine' est connecté et qu'il y a des logs
                if (isAdminZine && totalItems > 0 && purgeLogContainer) {
                    purgeLogContainer.style.display = 'block'; // Affiche le conteneur
                    // S'assure que le listener n'est ajouté qu'une fois (ou le remplace)
                    if (purgeLogButton && !purgeLogButton.dataset.listenerAttached) {
                        purgeLogButton.addEventListener('click', handleDeleteAllLogs);
                        purgeLogButton.dataset.listenerAttached = 'true'; // Marque comme attaché
                    }
                } else if (purgeLogContainer) {
                    purgeLogContainer.style.display = 'none'; // Cache sinon
                }

                console.log(`Log affiché: Page ${currentLogPage}/${totalPages}, ${totalItems} entrées totales.`);
            }

        } catch (error) {
            // Gère les erreurs survenues pendant le processus
            console.error("Erreur lors de l'affichage du log:", error);
            // CORRECTION TYPO: Utilise isAdminZine ici
            logTableBody.innerHTML = `<tr class="error-row"><td colspan="${isAdminZine ? 6 : 5}" style="text-align:center; color: var(--error-color); padding: 20px;">Erreur lors du chargement de l'historique: ${error.message}</td></tr>`;
            if(logPageInfo) logPageInfo.textContent = 'Erreur';
            if(logPrevPageButton) logPrevPageButton.disabled = true;
            if(logNextPageButton) logNextPageButton.disabled = true;
             // Cache le bouton de purge en cas d'erreur
             if (purgeLogContainer) purgeLogContainer.style.display = 'none';
        }
    }

    // Formate un timestamp ISO en format lisible JJ/MM/AAAA HH:MM:SS
    function formatLogTimestamp(isoTimestamp) {
        if (!isoTimestamp) return 'Date invalide';
        try {
            const date = new Date(isoTimestamp);
            // Vérifie si la date est valide
            if (isNaN(date.getTime())) {
                return 'Date invalide';
            }
            // Options pour formater la date et l'heure
            const optionsDate = { day: '2-digit', month: '2-digit', year: 'numeric' };
            const optionsTime = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
            // Combine les deux formats
            const formattedDate = date.toLocaleDateString('fr-FR', optionsDate);
            const formattedTime = date.toLocaleTimeString('fr-FR', optionsTime);
            return `${formattedDate} ${formattedTime}`;
        } catch (e) {
            console.error("Erreur de formatage du timestamp:", isoTimestamp, e);
            return 'Date invalide';
        }
    }

    // Ajoute une nouvelle entrée dans la table 'log' (n'est plus appelée directement si RPC utilisé)
    async function addLogEntry(itemRef, change, newQuantity) {
        // Vérifie si la table log existe avant de tenter d'insérer
         // Pas idéal de le faire à chaque fois, mais évite l'erreur si la table est créée après le chargement initial
        // Une meilleure approche serait de vérifier une seule fois au démarrage ou après une erreur.

        console.warn("addLogEntry appelée directement. La fonction RPC 'update_stock' devrait gérer le log.");
        // Garder le code ici comme fallback ou si la fonction RPC n'est pas utilisée pour certaines opérations
        if (!supabase || !currentUser || !currentUserCode) {
            console.warn("Impossible d'ajouter une entrée au log: Supabase non initialisé ou utilisateur non connecté.");
            return false;
        }
        if (itemRef === null || itemRef === undefined || change === null || change === undefined || newQuantity === null || newQuantity === undefined) {
             console.warn("Impossible d'ajouter une entrée au log: Données manquantes (ref, change ou newQuantity).");
             return false;
        }

        try {
            console.log(`Ajout au log (manuel): User=${currentUserCode}, Ref=${itemRef}, Change=${change}, NewQty=${newQuantity}`);
            const { error } = await supabase
                .from('log')
                .insert({
                    user_code: currentUserCode,
                    user_id: currentUser.id,
                    item_ref: itemRef.toUpperCase(),
                    change: Number(change),
                    new_quantity: Number(newQuantity)
                });

            if (error) {
                 if (error.message.includes('relation "public.log" does not exist')) {
                    console.error("Erreur: La table 'public.log' n'existe pas. Impossible d'ajouter l'entrée (manuel).");
                    showLogFeedback("Erreur: Impossible d'enregistrer dans l'historique (table manquante).", 'error');
                 } else {
                    console.error("Erreur lors de l'insertion dans le log Supabase (manuel):", error.message);
                    showLogFeedback(`Erreur lors de l'enregistrement de l'opération dans l'historique: ${error.message}`, 'error');
                 }
                return false;
            } else {
                console.log("Entrée ajoutée au log avec succès (manuel).");
                if (logView?.classList.contains('active-view')) {
                    displayLog(1);
                }
                return true;
            }
        } catch (err) {
            console.error("Erreur JavaScript lors de l'ajout au log (manuel):", err);
            showLogFeedback(`Erreur inattendue lors de l'enregistrement dans l'historique.`, 'error');
            return false;
        }
    }

    // Affiche un message de feedback dans la section log
    function showLogFeedback(message, type = 'info') { // types: 'info', 'success', 'warning', 'error', 'none'
        if (!logFeedbackDiv) return;

        logFeedbackDiv.textContent = message;
        logFeedbackDiv.className = `feedback-area ${type}`; // Utilise feedback-area maintenant

        if (type === 'none' || !message) {
            logFeedbackDiv.style.display = 'none'; // Cache si 'none' ou message vide
        } else {
            logFeedbackDiv.style.display = 'block'; // Affiche sinon
            // Cache automatiquement les messages après un délai (sauf les erreurs)
            if (type !== 'error') {
                setTimeout(() => {
                    if (logFeedbackDiv.textContent === message) { // Ne cache que si le message n'a pas changé entre temps
                       logFeedbackDiv.style.display = 'none';
                       logFeedbackDiv.textContent = '';
                    }
                }, 5000); // Cache après 5 secondes
            }
        }
    }

    // Gère le clic sur le bouton de suppression d'une entrée de log (pour admin 'zine')
    async function handleDeleteSingleLog(event) {
        // Cible le bouton, même si on a cliqué sur l'icône <i> à l'intérieur
        const button = event.target.closest('button[data-log-id]');
        if (!button || !supabase || currentUserCode !== 'zine') {
             // Ne fait rien si ce n'est pas le bouton, si pas connecté/supabase, ou pas l'admin 'zine'
            return;
        }

        const logId = button.dataset.logId;
        if (!logId) return;

        // Confirmation avant suppression
        if (!confirm(`Êtes-vous sûr de vouloir supprimer cette entrée de l'historique (ID: ${logId}) ? Cette action est irréversible.`)) {
            return;
        }

        console.log(`Tentative de suppression du log ID: ${logId}`);
        button.disabled = true; // Désactive le bouton pendant l'opération
        showLogFeedback(`Suppression de l'entrée ID ${logId}...`, 'info');

        try {
            const { error } = await supabase
                .from('log')
                .delete()
                .eq('id', logId);

            if (error) {
                console.error(`Erreur lors de la suppression du log ID ${logId}:`, error.message);
                showLogFeedback(`Erreur lors de la suppression de l'entrée: ${error.message}`, 'error');
                button.disabled = false; // Réactive le bouton en cas d'erreur
            } else {
                console.log(`Log ID ${logId} supprimé avec succès.`);
                showLogFeedback(`Entrée ID ${logId} supprimée avec succès.`, 'success');
                // Rafraîchit la vue log sur la page actuelle pour refléter la suppression
                // Il faut recharger la page pour s'assurer que le count est correct après suppression
                const totalItems = parseInt(logPageInfo.textContent.split('/')[1].trim(), 10);
                 const itemsOnCurrentPage = logTableBody.rows.length;
                 // Si c'était le dernier item de la page et pas la première page, aller page précédente
                 if (itemsOnCurrentPage === 1 && currentLogPage > 1) {
                    displayLog(currentLogPage - 1);
                 } else {
                    displayLog(currentLogPage);
                 }
            }
        } catch (err) {
            console.error("Erreur JavaScript lors de la suppression du log:", err);
            showLogFeedback(`Erreur inattendue lors de la suppression de l'entrée.`, 'error');
            button.disabled = false; // Réactive le bouton en cas d'erreur JS
        }
    }

    // Gère le clic sur le bouton "Purger l'historique" (pour admin 'zine')
    async function handleDeleteAllLogs() {
        if (!supabase || currentUserCode !== 'zine') {
            showLogFeedback("Action non autorisée.", "error");
            return;
        }

        // Double confirmation TRÈS importante
        if (!confirm("Êtes-vous ABSOLUMENT SÛR de vouloir supprimer TOUTES les entrées de l'historique ? Cette action est DÉFINITIVE et IRRÉVERSIBLE !")) {
            return;
        }
        // Deuxième confirmation pour être certain
         if (!confirm("Dernière confirmation : Vraiment supprimer TOUT l'historique ?")) {
            return;
        }

        if(purgeLogButton) purgeLogButton.disabled = true;
        showLogFeedback("Purge de l'historique en cours...", 'warning');
        console.log("Tentative de suppression de toutes les entrées du log...");

        try {
             // Pour supprimer toutes les lignes, on utilise une condition qui est toujours vraie
             // Ici, on supprime toutes les lignes où l'ID est supérieur ou égal à 0 (ce qui est toujours vrai pour les ID auto-incrémentés)
             // Utilisation de `gte('id', 0)` est plus sûr que `neq('id', -1)` qui pourrait échouer si aucun ID n'est -1.
            const { error, count } = await supabase
                .from('log')
                .delete()
                .gte('id', 0); // Condition pour cibler toutes les lignes (ou presque)

            if (error) {
                console.error("Erreur lors de la purge de l'historique:", error.message);
                showLogFeedback(`Erreur lors de la purge de l'historique: ${error.message}`, 'error');
            } else {
                console.log(`Historique purgé avec succès. ${count || 0} entrées supprimées.`);
                showLogFeedback(`Historique purgé avec succès (${count || 0} entrées supprimées).`, 'success');
                // Rafraîchit la vue log (qui devrait être vide maintenant)
                displayLog(1);
            }
        } catch (err) {
            console.error("Erreur JavaScript lors de la purge du log:", err);
            showLogFeedback("Erreur inattendue lors de la purge de l'historique.", 'error');
        } finally {
            if(purgeLogButton) purgeLogButton.disabled = false; // Réactive le bouton dans tous les cas
        }
    }


    // --- VUE ADMIN ---

    // Récupère les catégories depuis Supabase (avec gestion du cache)
    async function getCategories(forceRefresh = false) {
        // Si le cache est plein et qu'on ne force pas le rafraîchissement, retourne le cache
        if (categoriesCache.length > 0 && !forceRefresh) {
            console.log("Utilisation du cache pour les catégories.");
            return categoriesCache;
        }

        if (!supabase) {
            console.error("Impossible de récupérer les catégories : client Supabase non initialisé.");
            return []; // Retourne tableau vide en cas d'erreur
        }

        console.log("Récupération des catégories depuis Supabase...");
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('id, name, attributes') // Sélectionne id, nom et la colonne JSON des attributs
                .order('name', { ascending: true }); // Trie par nom

            if (error) {
                console.error("Erreur lors de la récupération des catégories:", error.message);
                showAdminFeedback(`Erreur chargement catégories: ${error.message}`, 'error');
                return []; // Retourne tableau vide
            }

            console.log(`Catégories récupérées: ${data ? data.length : 0}`);
            categoriesCache = data || []; // Met à jour le cache
            return categoriesCache;

        } catch (err) {
            console.error("Erreur JavaScript lors de la récupération des catégories:", err);
            showAdminFeedback("Erreur inattendue lors du chargement des catégories.", 'error');
            return []; // Retourne tableau vide
        }
    }

    // Invalide (vide) le cache des catégories
    function invalidateCategoriesCache() {
        console.log("Cache des catégories invalidé.");
        categoriesCache = [];
    }

    // Charge les données nécessaires pour la vue Admin (principalement les catégories)
    async function loadAdminData() {
        if (!currentUser) {
            console.warn("Tentative de chargement des données admin sans être connecté.");
            return;
        }
        console.log("Chargement des données pour la vue Admin...");
        showAdminFeedback("Chargement des données...", "info");
        await loadCategoriesAdmin(); // Charge et affiche les catégories
        await populateComponentCategorySelect(); // Peuple le sélecteur de catégorie dans le formulaire de stock
        resetStockForm(); // Assure que le formulaire de stock est propre au chargement
        showAdminFeedback("", "none"); // Cache le message de chargement
    }

    // Charge et affiche la liste des catégories dans la section Admin
    async function loadCategoriesAdmin() {
        if (!categoryList) return;
        categoryList.innerHTML = '<li>Chargement des catégories...</li>'; // Indicateur de chargement
        try {
            const categories = await getCategories(true); // Force le rafraîchissement pour l'admin
            categoryList.innerHTML = ''; // Vide la liste

            if (categories && categories.length > 0) {
                categories.forEach(cat => {
                    const li = document.createElement('li');
                    // Attributs: affiche les clés JSON ou 'Aucun'
                    let attributesText = '(Aucun attribut)';
                    if (cat.attributes) {
                        try {
                            if (Array.isArray(cat.attributes) && cat.attributes.length > 0) {
                                attributesText = `[${cat.attributes.join(', ')}]`;
                            } else if (typeof cat.attributes === 'object' && Object.keys(cat.attributes).length > 0) {
                                attributesText = `{${Object.keys(cat.attributes).join(', ')}}`;
                            }
                        } catch (e) { attributesText = '(Format attributs invalide)'; }
                    }


                    li.innerHTML = `
                        <span class="category-name">${cat.name}</span>
                        <span class="category-attributes">${attributesText}</span>
                        <div class="category-actions">
                            <button type="button" class="button-icon button-primary-outline edit-cat-btn" data-id="${cat.id}" title="Modifier ${cat.name}"><i class="fas fa-edit"></i></button>
                            <button type="button" class="button-icon button-danger-outline delete-cat-btn" data-id="${cat.id}" title="Supprimer ${cat.name}"><i class="fas fa-trash-alt"></i></button>
                        </div>
                    `;
                    categoryList.appendChild(li);
                });
            } else {
                categoryList.innerHTML = '<li>Aucune catégorie définie pour le moment.</li>';
            }
            // Ajoute les écouteurs après avoir peuplé la liste
            addCategoryEventListeners(); // Appelle la fonction qui ajoute les listeners

        } catch (error) {
            console.error("Erreur lors de l'affichage des catégories admin:", error);
            categoryList.innerHTML = '<li>Erreur lors du chargement des catégories.</li>';
            showAdminFeedback("Erreur chargement catégories.", "error");
        }
    }

    // Ajoute les écouteurs d'événements pour les boutons Modifier/Supprimer catégorie et submit form
    // Note: Cette fonction est appelée DANS loadCategoriesAdmin APRES la création des éléments
    function addCategoryEventListeners() {
        // Utilise la délégation d'événements sur la liste parente pour edit/delete
        categoryList?.addEventListener('click', async (event) => {
            const editButton = event.target.closest('.edit-cat-btn');
            const deleteButton = event.target.closest('.delete-cat-btn');

            if (editButton) {
                const catId = editButton.dataset.id;
                const category = categoriesCache.find(c => c.id.toString() === catId);
                if (category) {
                    console.log("Clic Modifier catégorie:", category);
                    if(categoryFormTitle) categoryFormTitle.textContent = `Modifier la catégorie "${category.name}"`;
                    if(categoryNameInput) categoryNameInput.value = category.name;
                    // Gère les attributs: convertit l'objet/array JSON en string pour l'input
                    let attributesString = '';
                    if (category.attributes) {
                         try {
                             // Tente de formater joliment si c'est un objet ou array non vide
                             if (typeof category.attributes === 'object' && Object.keys(category.attributes).length > 0) {
                                attributesString = JSON.stringify(category.attributes, null, 2); // Indenté
                             } else if (Array.isArray(category.attributes) && category.attributes.length > 0) {
                                 attributesString = JSON.stringify(category.attributes, null, 2);
                             } else if (typeof category.attributes === 'string') {
                                 // Si c'est déjà une string, essaie de la parser et re-stringifier pour formatage
                                 try { attributesString = JSON.stringify(JSON.parse(category.attributes), null, 2); } catch { attributesString = category.attributes; }
                             }
                         } catch {
                             // Fallback si JSON.stringify échoue
                             attributesString = category.attributes.toString();
                         }
                    }
                    if(categoryAttributesInput) categoryAttributesInput.value = attributesString;
                    if(categoryIdEditInput) categoryIdEditInput.value = category.id; // Stocke l'ID pour la sauvegarde
                    if(cancelEditButton) cancelEditButton.style.display = 'inline-block'; // Affiche Annuler
                    categoryNameInput?.focus(); // Met le focus sur le nom
                }
            } else if (deleteButton) {
                const catId = deleteButton.dataset.id;
                const category = categoriesCache.find(c => c.id.toString() === catId);
                 if (category && confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${category.name}" ?\nCela pourrait affecter les composants associés !`)) {
                    console.log("Clic Supprimer catégorie:", category);
                    deleteButton.disabled = true;
                    showAdminFeedback(`Suppression de la catégorie ${category.name}...`, 'info');
                    try {
                        const { error } = await supabase.from('categories').delete().eq('id', catId);
                        if (error) {
                            throw error;
                        }
                        showAdminFeedback(`Catégorie "${category.name}" supprimée avec succès.`, 'success');
                        invalidateCategoriesCache(); // Invalide cache
                        loadCategoriesAdmin(); // Recharge la liste
                        populateComponentCategorySelect(); // Met à jour le select dans l'autre formulaire
                        resetCategoryForm(); // Assure que le formulaire n'est pas en mode édition de l'élément supprimé
                    } catch (error) {
                         console.error("Erreur suppression catégorie:", error);
                         // Vérifie si l'erreur est due à une contrainte de clé étrangère
                         if (error.message.includes('violates foreign key constraint') && error.message.includes('inventory_category_id_fkey')) {
                            showAdminFeedback(`Impossible de supprimer "${category.name}". Des composants utilisent encore cette catégorie. Modifiez d'abord les composants concernés.`, 'error');
                         } else {
                            showAdminFeedback(`Erreur lors de la suppression de la catégorie: ${error.message}`, 'error');
                         }
                         deleteButton.disabled = false;
                    }
                }
            }
        });

        // Écouteur pour la soumission du formulaire catégorie (Ajout/Modification)
        categoryForm?.addEventListener('submit', async (event) => {
            event.preventDefault(); // Empêche la soumission HTML classique
            if (!supabase) return;

            const name = categoryNameInput?.value.trim();
            const attributesString = categoryAttributesInput?.value.trim();
            const idToEdit = categoryIdEditInput?.value;

            if (!name) {
                showAdminFeedback("Le nom de la catégorie est requis.", 'warning');
                categoryNameInput?.focus();
                return;
            }

            let attributesJSON = null;
            if (attributesString) {
                try {
                    // Tente de parser la string en JSON. Accepte objet {} ou array []
                    attributesJSON = JSON.parse(attributesString);
                     // Validation simple: doit être un objet ou un array
                    if (typeof attributesJSON !== 'object' || attributesJSON === null) { // Inclut la vérification pour 'null' qui est typeof 'object'
                       throw new Error("Les attributs doivent être un objet JSON valide (ex: {\"Tension\":\"V\", \"Package\":\"Type\"}) ou un tableau (ex: [\"Couleur\", \"Taille\"]).");
                    }
                     // Si c'est un objet, vérifie que les valeurs sont des strings simples (ou null/vide) pour éviter complexité
                     if (!Array.isArray(attributesJSON)) {
                        for (const key in attributesJSON) {
                            if (typeof attributesJSON[key] !== 'string' && attributesJSON[key] !== null && attributesJSON[key] !== '') {
                                console.warn(`Attribut '${key}' a une valeur non-string (${typeof attributesJSON[key]}), conversion en string.`);
                                attributesJSON[key] = String(attributesJSON[key]); // Convertit en string pour simplifier
                            } else if (attributesJSON[key] === '') {
                                delete attributesJSON[key]; // Supprime les clés avec valeur vide
                            }
                        }
                        if (Object.keys(attributesJSON).length === 0) attributesJSON = null; // Si objet vide après nettoyage, met à null
                     } else { // Si c'est un array, s'assure que ce sont des strings non vides
                         attributesJSON = attributesJSON.map(item => String(item).trim()).filter(item => item !== '');
                         if (attributesJSON.length === 0) attributesJSON = null; // Si vide après filtrage, met à null
                     }

                } catch (e) {
                    showAdminFeedback(`Erreur dans le format JSON des attributs: ${e.message}`, 'error');
                    categoryAttributesInput?.focus();
                    return;
                }
            }

            const categoryData = {
                name: name,
                attributes: attributesJSON // Stocke l'objet/array JSON ou null
            };

            const saveButton = categoryForm.querySelector('button[type="submit"]');
            if(saveButton) saveButton.disabled = true;
            if(cancelEditButton) cancelEditButton.disabled = true;
            showAdminFeedback(idToEdit ? 'Modification...' : 'Ajout...', 'info');

            try {
                let error;
                if (idToEdit) {
                    // --- Modification ---
                    console.log(`Modification catégorie ID ${idToEdit}:`, categoryData);
                    const { error: updateError } = await supabase
                        .from('categories')
                        .update(categoryData)
                        .eq('id', idToEdit);
                    error = updateError;
                } else {
                    // --- Ajout ---
                    console.log("Ajout nouvelle catégorie:", categoryData);
                    const { error: insertError } = await supabase
                        .from('categories')
                        .insert(categoryData);
                    error = insertError;
                }

                if (error) {
                    // Gère les erreurs (ex: nom dupliqué)
                    if (error.message.includes('duplicate key value violates unique constraint "categories_name_key"')) {
                        showAdminFeedback(`Le nom de catégorie "${name}" existe déjà.`, 'error');
                        categoryNameInput?.focus();
                    } else {
                        showAdminFeedback(`Erreur sauvegarde catégorie: ${error.message}`, 'error');
                    }
                    console.error("Erreur sauvegarde catégorie:", error);
                } else {
                    showAdminFeedback(`Catégorie "${name}" ${idToEdit ? 'modifiée' : 'ajoutée'} avec succès.`, 'success');
                    resetCategoryForm(); // Réinitialise le formulaire
                    invalidateCategoriesCache(); // Invalide le cache
                    loadCategoriesAdmin(); // Recharge la liste des catégories
                    populateComponentCategorySelect(); // Met à jour le sélecteur dans le formulaire de stock
                }
            } catch (err) {
                 console.error("Erreur JS sauvegarde catégorie:", err);
                 showAdminFeedback("Erreur inattendue lors de la sauvegarde.", 'error');
            } finally {
                 if(saveButton) saveButton.disabled = false;
                 if(cancelEditButton) cancelEditButton.disabled = false;
            }
        });

        // Écouteur pour le bouton Annuler l'édition
        cancelEditButton?.addEventListener('click', () => {
            resetCategoryForm();
        });
    }

    // Réinitialise le formulaire de catégorie à son état initial (Ajout)
    function resetCategoryForm(){
        if(categoryFormTitle) categoryFormTitle.textContent = 'Ajouter une nouvelle catégorie';
        if(categoryForm) categoryForm.reset(); // Réinitialise les champs du formulaire
        if(categoryIdEditInput) categoryIdEditInput.value = ''; // Vide l'ID caché
        if(cancelEditButton) cancelEditButton.style.display = 'none'; // Cache le bouton Annuler
        const saveButton = categoryForm?.querySelector('button[type="submit"]');
        if(saveButton) saveButton.disabled = false; // Réactive le bouton save
        if(cancelEditButton) cancelEditButton.disabled = false; // Assure que Annuler est réactivé s'il était visible
    }

    // Peuple le sélecteur <select> de catégorie dans le formulaire de gestion de stock
    async function populateComponentCategorySelect() {
        if (!componentCategorySelectAdmin) return;
        const currentVal = componentCategorySelectAdmin.value; // Sauvegarde valeur actuelle
        componentCategorySelectAdmin.innerHTML = '<option value="">-- Sélectionner une catégorie --</option>'; // Option vide par défaut
        try {
            const categories = await getCategories(); // Utilise le cache si possible
            if (categories && categories.length > 0) {
                categories.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat.id;
                    option.textContent = cat.name;
                    // Stocke les attributs dans un data-* pour y accéder facilement
                    option.dataset.attributes = JSON.stringify(cat.attributes || {}); // Stocke comme string JSON
                    componentCategorySelectAdmin.appendChild(option);
                });
                 // Resélectionne la valeur précédente si elle existe toujours
                 if (componentCategorySelectAdmin.querySelector(`option[value="${currentVal}"]`)) {
                    componentCategorySelectAdmin.value = currentVal;
                    // Déclenche manuellement l'événement change pour afficher les champs attributs si une cat était sélectionnée
                    componentCategorySelectAdmin.dispatchEvent(new Event('change'));
                } else {
                     componentCategorySelectAdmin.value = ""; // Retour à 'Sélectionner'
                     if(specificAttributesDiv) specificAttributesDiv.innerHTML = ''; // Vide les attributs si catégorie perdue
                     if(specificAttributesDiv) specificAttributesDiv.style.display = 'none';
                }
                console.log("Sélecteur de catégorie (admin stock) peuplé.");
            }
        } catch (error) {
            console.error("Erreur peuplement sélecteur catégorie admin:", error);
            componentCategorySelectAdmin.innerHTML = '<option value="">Erreur chargement catégories</option>';
        }
    }

    // Ajoute l'écouteur pour le changement de catégorie dans le formulaire de stock (pour afficher les attributs)
    function addComponentCategorySelectListener() {
        componentCategorySelectAdmin?.addEventListener('change', (event) => {
            if (!specificAttributesDiv) return;
            specificAttributesDiv.innerHTML = ''; // Vide les anciens attributs
            specificAttributesDiv.style.display = 'none'; // Cache par défaut

            const selectedOption = event.target.selectedOptions[0];
            const categoryId = selectedOption.value;

            if (categoryId) {
                try {
                    // Récupère les attributs depuis le data-attribut de l'option
                    const attributesData = JSON.parse(selectedOption.dataset.attributes || '{}');
                    let attributesHtml = '';

                    // Gère si attributesData est un objet {label: placeholder} ou un array [label]
                    if (Array.isArray(attributesData)) {
                         // Si c'est un array de strings (labels)
                         if (attributesData.length > 0) {
                             attributesHtml = attributesData.map(label => `
                                <div class="form-group">
                                    <label for="attr-${label.replace(/\s+/g, '-')}">${label}:</label>
                                    <input type="text" id="attr-${label.replace(/\s+/g, '-')}" name="attributes[${label}]" placeholder="${label}">
                                </div>
                            `).join('');
                         }
                    } else if (typeof attributesData === 'object' && attributesData !== null) {
                        // Si c'est un objet {label: placeholder}
                        const keys = Object.keys(attributesData);
                        if (keys.length > 0) {
                            attributesHtml = keys.map(label => {
                                const placeholder = attributesData[label] || label; // Utilise la valeur comme placeholder, ou le label si vide
                                return `
                                    <div class="form-group">
                                        <label for="attr-${label.replace(/\s+/g, '-')}">${label}:</label>
                                        <input type="text" id="attr-${label.replace(/\s+/g, '-')}" name="attributes[${label}]" placeholder="${placeholder}">
                                    </div>
                                `}).join('');
                        }
                    }

                    if (attributesHtml) {
                        specificAttributesDiv.innerHTML = `<h4>Attributs spécifiques à la catégorie</h4>${attributesHtml}`;
                        specificAttributesDiv.style.display = 'block'; // Affiche la section des attributs
                    }
                } catch (e) {
                    console.error("Erreur lors du parsing ou de l'affichage des attributs de catégorie:", e);
                    specificAttributesDiv.innerHTML = '<p class="error">Erreur lors du chargement des attributs.</p>';
                    specificAttributesDiv.style.display = 'block';
                }
            }
        });
    }

    // Affiche un message de feedback dans la section admin
    function showAdminFeedback(message, type = 'info'){ // types: 'info', 'success', 'warning', 'error', 'none'
        if (!adminFeedbackDiv) return;
        adminFeedbackDiv.textContent = message;
        adminFeedbackDiv.className = `feedback-area ${type}`; // Utilise feedback-area maintenant
        if (type === 'none' || !message) {
            adminFeedbackDiv.style.display = 'none';
        } else {
            adminFeedbackDiv.style.display = 'block';
            // Cache automatiquement après délai (sauf erreurs)
            if (type !== 'error') {
                setTimeout(() => {
                   if (adminFeedbackDiv.textContent === message) {
                       adminFeedbackDiv.style.display = 'none';
                       adminFeedbackDiv.textContent = '';
                   }
                }, 5000);
            }
        }
    }

    // Réinitialise le formulaire de gestion de stock
    function resetStockForm() {
        console.log("Réinitialisation du formulaire de stock admin.");
        if(stockForm) stockForm.reset(); // Reset tous les champs
        if(componentInfoDiv) componentInfoDiv.style.display = 'none'; // Cache la partie info/modif quantité
        if(specificAttributesDiv) specificAttributesDiv.innerHTML = ''; // Vide les attributs spécifiques
        if(specificAttributesDiv) specificAttributesDiv.style.display = 'none';
        if(componentRefAdminInput) componentRefAdminInput.disabled = false; // Réactive champ référence
        if(checkStockButton) checkStockButton.disabled = false; // Réactive bouton vérifier
        if(saveComponentButton) saveComponentButton.disabled = false; // Réactive bouton sauver
        if(saveComponentButton) saveComponentButton.textContent = "Ajouter/Modifier Composant"; // Texte par défaut
        if(componentInitialQuantityGroup) componentInitialQuantityGroup.style.display = 'none'; // Cache qté initiale par défaut
        if(currentQuantitySpan) currentQuantitySpan.textContent = '-'; // Reset affichage qté actuelle
        if(quantityChangeInput) quantityChangeInput.value = ''; // Vide champ modif qté
        if(updateQuantityButton) updateQuantityButton.disabled = true; // Désactive bouton mise à jour qté

        // Réactive tous les champs qui auraient pu être désactivés
        const fieldsToEnable = [componentCategorySelectAdmin, componentDescInput, componentMfgInput, componentDatasheetInput, componentDrawerAdminInput, componentThresholdInput];
        fieldsToEnable.forEach(field => { if(field) field.disabled = false; });

        componentRefAdminInput?.focus(); // Met le focus sur la référence
    }

    // Ajoute les écouteurs pour la partie gestion de stock admin
    function addStockEventListeners() {
        // Bouton "Vérifier / Charger"
        checkStockButton?.addEventListener('click', async () => {
            const ref = componentRefAdminInput?.value.trim().toUpperCase();
            if (!ref) {
                showAdminFeedback("Veuillez entrer une référence.", 'warning');
                componentRefAdminInput?.focus();
                return;
            }
            if (!supabase) return;

            checkStockButton.disabled = true;
            showAdminFeedback(`Recherche de la référence ${ref}...`, 'info');
            // Ne pas reset complet ici, juste la partie info/modif quantité
            if(componentInfoDiv) componentInfoDiv.style.display = 'none';
            if(updateQuantityButton) updateQuantityButton.disabled = true;
            if(quantityChangeInput) quantityChangeInput.value = '';


            try {
                const { data: component, error } = await supabase
                    .from('inventory')
                    .select('*, category_id, critical_threshold, attributes') // Assure-toi de sélectionner ce dont tu as besoin
                    .eq('ref', ref)
                    .single(); // Attend un seul résultat ou null

                if (error && error.code !== 'PGRST116') { // PGRST116 = 0 lignes retournées, ce n'est pas une erreur ici
                    throw error;
                }

                if (component) {
                    // --- Composant trouvé : Mode Modification ---
                    console.log("Composant trouvé:", component);
                    showAdminFeedback(`Composant ${ref} trouvé. Vous pouvez modifier ses informations ou sa quantité.`, 'success');
                    if(componentInfoDiv) componentInfoDiv.style.display = 'block'; // Affiche section modif
                    if(currentQuantitySpan) currentQuantitySpan.textContent = component.quantity ?? 'N/A';
                    if(updateQuantityButton) updateQuantityButton.disabled = false; // Active bouton mise à jour qté
                    if(saveComponentButton) saveComponentButton.textContent = `Sauver Modifs ${ref}`; // Change texte bouton
                    if(componentInitialQuantityGroup) componentInitialQuantityGroup.style.display = 'none'; // Cache qté initiale

                    // Remplit les champs du formulaire avec les données existantes
                    if(componentCategorySelectAdmin && component.category_id) {
                        componentCategorySelectAdmin.value = component.category_id;
                        // Déclenche 'change' pour afficher les attributs spécifiques
                         componentCategorySelectAdmin.dispatchEvent(new Event('change'));
                         // Remplit les valeurs des attributs spécifiques si elles existent
                         if (component.attributes && typeof component.attributes === 'object') {
                            setTimeout(() => { // Attend que les champs soient créés par l'event 'change'
                                for (const key in component.attributes) {
                                    const input = specificAttributesDiv?.querySelector(`input[name="attributes[${key}]"]`);
                                    if (input) {
                                        input.value = component.attributes[key] || ''; // Utilise '' si null/undefined
                                    }
                                }
                            }, 50); // Petit délai pour être sûr
                         }
                    } else if (componentCategorySelectAdmin) {
                         componentCategorySelectAdmin.value = ""; // Aucune catégorie
                         componentCategorySelectAdmin.dispatchEvent(new Event('change')); // Assure que les attributs sont cachés
                    }
                    if(componentDescInput) componentDescInput.value = component.description || '';
                    if(componentMfgInput) componentMfgInput.value = component.manufacturer || '';
                    if(componentDatasheetInput) componentDatasheetInput.value = component.datasheet || '';
                    if(componentDrawerAdminInput) componentDrawerAdminInput.value = component.drawer || '';
                    if(componentThresholdInput) componentThresholdInput.value = component.critical_threshold ?? ''; // Utilise '' si null/undefined

                    // Laisser la référence éditable pour corrections éventuelles
                    componentRefAdminInput.disabled = false;
                    // Mettre le focus sur le premier champ modifiable (ex: catégorie)
                    componentCategorySelectAdmin?.focus();

                } else {
                    // --- Composant non trouvé : Mode Ajout ---
                    console.log("Composant non trouvé, passage en mode ajout.");
                    showAdminFeedback(`Référence ${ref} non trouvée. Vous pouvez l'ajouter. Remplissez les détails.`, 'info');
                    if(componentInfoDiv) componentInfoDiv.style.display = 'none'; // Cache section modif quantité
                    if(saveComponentButton) saveComponentButton.textContent = `Ajouter ${ref}`; // Change texte bouton
                    if(componentInitialQuantityGroup) componentInitialQuantityGroup.style.display = 'block'; // Affiche qté initiale
                    if(componentInitialQuantityInput) componentInitialQuantityInput.value = '0'; // Défaut à 0
                    // Nettoie les autres champs (au cas où ils étaient pré-remplis)
                    if(componentCategorySelectAdmin) componentCategorySelectAdmin.value = '';
                    if(componentDescInput) componentDescInput.value = '';
                    if(componentMfgInput) componentMfgInput.value = '';
                    if(componentDatasheetInput) componentDatasheetInput.value = '';
                    if(componentDrawerAdminInput) componentDrawerAdminInput.value = '';
                    if(componentThresholdInput) componentThresholdInput.value = '';
                    if(specificAttributesDiv) specificAttributesDiv.innerHTML = ''; // Vide attributs
                    if(specificAttributesDiv) specificAttributesDiv.style.display = 'none';

                     componentRefAdminInput.disabled = false; // Laisser modifiable
                     componentCategorySelectAdmin?.focus(); // Met le focus sur la catégorie pour ajout
                }

            } catch (error) {
                 console.error(`Erreur vérification/chargement stock pour ${ref}:`, error);
                 showAdminFeedback(`Erreur lors de la recherche de ${ref}: ${error.message}`, 'error');
                 // Ne pas reset complet, laisser l'utilisateur corriger
                 // resetStockForm();
            } finally {
                 // Ne réactive pas checkStockButton ici pour forcer soit modif soit ajout via l'autre bouton
                 // Laisse checkStockButton désactivé jusqu'à ce que l'utilisateur reset ou sauve.
                 // Mise à jour : Réactivons-le pour permettre une nouvelle vérification si l'utilisateur change d'avis
                 if (checkStockButton) checkStockButton.disabled = false;
            }
        });

        // Bouton "Mettre à jour quantité" (dans la partie qui apparaît si composant existe)
        updateQuantityButton?.addEventListener('click', async () => {
            const ref = componentRefAdminInput?.value.trim().toUpperCase();
            const changeStr = quantityChangeInput?.value.trim();
            if (!ref || changeStr === '' || changeStr === null) { // Vérifie aussi chaîne vide
                 showAdminFeedback("Référence et changement de quantité (+/-) requis.", 'warning');
                 return;
            }
            const change = parseInt(changeStr, 10);
            if (isNaN(change) || change === 0) {
                 showAdminFeedback("Le changement doit être un nombre entier non nul (ex: +5 ou -3).", 'warning');
                 quantityChangeInput?.focus();
                 return;
            }
            if (!supabase || !currentUser) return;

            updateQuantityButton.disabled = true;
            showAdminFeedback(`Mise à jour quantité pour ${ref}...`, 'info');

            try {
                // Appelle la fonction Supabase pour mettre à jour le stock
                // Cette fonction devrait aussi gérer l'ajout au log
                const { newQuantity, error } = await updateStockInSupabase(ref, change);

                if (error) {
                     // updateStockInSupabase gère déjà l'erreur normalement via showAdminFeedback ou modalFeedback
                     console.error("Erreur retournée par updateStockInSupabase:", error);
                     // Affiche aussi ici au cas où
                     showAdminFeedback(`Erreur mise à jour quantité: ${error}`, 'error');
                } else {
                     showAdminFeedback(`Quantité de ${ref} mise à jour avec succès. Nouvelle quantité: ${newQuantity}.`, 'success');
                     if(currentQuantitySpan) currentQuantitySpan.textContent = newQuantity; // Met à jour l'affichage
                     if(quantityChangeInput) quantityChangeInput.value = ''; // Vide le champ de changement
                     // Rafraîchit l'inventaire si visible
                     if (inventoryView?.classList.contains('active-view')) {
                        displayInventory(currentInventoryPage);
                    }
                }
            } catch (err) {
                 console.error("Erreur JS mise à jour quantité:", err);
                 showAdminFeedback("Erreur inattendue lors de la mise à jour.", 'error');
            } finally {
                 if (updateQuantityButton) updateQuantityButton.disabled = false; // Réactive toujours
            }
        });

        // Soumission du formulaire principal (Ajouter/Modifier)
        stockForm?.addEventListener('submit', async (event) => {
            event.preventDefault(); // Empêche soumission HTML

            const ref = componentRefAdminInput?.value.trim().toUpperCase();
            if (!ref) {
                 showAdminFeedback("La référence du composant est requise.", 'warning');
                 componentRefAdminInput?.focus();
                 return;
            }

            const categoryId = componentCategorySelectAdmin?.value || null; // null si vide
            const description = componentDescInput?.value.trim() || null;
            const manufacturer = componentMfgInput?.value.trim() || null;
            const datasheet = componentDatasheetInput?.value.trim() || null;
            const drawer = componentDrawerAdminInput?.value.trim().toUpperCase() || null;
            const thresholdStr = componentThresholdInput?.value.trim();
            const initialQuantityStr = componentInitialQuantityInput?.value.trim();

            let critical_threshold = null;
            if (thresholdStr) {
                 critical_threshold = parseInt(thresholdStr, 10);
                 if (isNaN(critical_threshold) || critical_threshold < 0) {
                     showAdminFeedback("Le seuil critique doit être un nombre entier positif ou nul.", 'warning');
                     componentThresholdInput?.focus();
                     return;
                 }
            }

             // Récupère les attributs spécifiques
             const attributes = {};
             const attributeInputs = specificAttributesDiv?.querySelectorAll('input[name^="attributes["]');
             attributeInputs?.forEach(input => {
                 const keyMatch = input.name.match(/attributes\[(.*?)\]/);
                 if (keyMatch && keyMatch[1]) {
                     const key = keyMatch[1];
                     const value = input.value.trim();
                     if (value) { // N'ajoute que les attributs non vides
                         attributes[key] = value;
                     }
                 }
             });
             const attributesJSON = Object.keys(attributes).length > 0 ? attributes : null;


            // Détermine si c'est un ajout ou une modification basé sur l'affichage du groupe de qté initiale
            const isAdding = componentInitialQuantityGroup?.style.display === 'block';
            let quantity;

            if (isAdding) {
                 if (initialQuantityStr === '' || initialQuantityStr === null) {
                     showAdminFeedback("La quantité initiale est requise pour un nouveau composant.", 'warning');
                     componentInitialQuantityInput?.focus();
                     return;
                 }
                 quantity = parseInt(initialQuantityStr, 10);
                 if (isNaN(quantity) || quantity < 0) {
                     showAdminFeedback("La quantité initiale doit être un nombre entier positif ou nul.", 'warning');
                     componentInitialQuantityInput?.focus();
                     return;
                 }
            }
            // Si ce n'est pas un ajout, la quantité n'est PAS modifiée par ce formulaire.

            const componentData = {
                 ref: ref,
                 category_id: categoryId ? parseInt(categoryId, 10) : null, // Assure que c'est un nombre ou null
                 description: description,
                 manufacturer: manufacturer,
                 datasheet: datasheet,
                 drawer: drawer,
                 critical_threshold: critical_threshold,
                 attributes: attributesJSON // Stocke l'objet JSON ou null
            };

             // Ajoute la quantité SEULEMENT si c'est un nouvel ajout
            if (isAdding) {
                componentData.quantity = quantity;
            }

            if (!supabase || !currentUser) return;

            if(saveComponentButton) saveComponentButton.disabled = true;
            if(checkStockButton) checkStockButton.disabled = true; // Désactive aussi vérifier
            showAdminFeedback(`Sauvegarde de ${ref}...`, 'info');
            console.log("Données à sauvegarder:", componentData);

            try {
                // Utilise upsert pour ajouter si n'existe pas, ou mettre à jour si existe.
                // 'ref' est la colonne de conflit.
                // Si on est en mode ajout (isAdding=true), on inclut la quantité.
                // Si on est en mode modif (isAdding=false), on n'inclut PAS la quantité
                // pour ne pas écraser une modif faite par l'autre bouton.
                const dataToUpsert = { ...componentData };
                if (!isAdding) {
                    // En mode modification, on ne met à jour QUE les champs fournis via l'upsert.
                    // La quantité n'est pas incluse dans dataToUpsert si isAdding est faux.
                    // La fonction upsert mettra à jour les colonnes fournies.
                }


                const { data, error } = await supabase
                    .from('inventory')
                    .upsert(dataToUpsert, { onConflict: 'ref' })
                    .select() // Retourne la ligne insérée/mise à jour
                    .single(); // Attend un seul résultat

                if (error) {
                    // Gère les erreurs spécifiques (ex: category_id invalide)
                    if (error.message.includes('violates foreign key constraint') && error.message.includes('inventory_category_id_fkey')) {
                         showAdminFeedback(`Erreur: La catégorie sélectionnée n'existe pas ou est invalide.`, 'error');
                    } else {
                        showAdminFeedback(`Erreur lors de la sauvegarde de ${ref}: ${error.message}`, 'error');
                    }
                    console.error(`Erreur upsert pour ${ref}:`, error);
                } else {
                    showAdminFeedback(`Composant ${ref} sauvegardé avec succès.`, 'success');
                    console.log("Résultat Upsert:", data);

                     // Si c'était un ajout avec une quantité initiale > 0, logguer cette quantité initiale.
                     // La fonction RPC 'update_stock' est conçue pour les *changements*.
                     // Pour l'ajout initial, on peut soit appeler addLogEntry, soit adapter/créer une fonction RPC.
                     // Appelons addLogEntry ici pour l'instant.
                     if (isAdding && data.quantity > 0) {
                          console.log(`Ajout initial détecté pour ${ref} avec quantité ${data.quantity}. Tentative de log manuel.`);
                          await addLogEntry(ref, data.quantity, data.quantity);
                     }

                    resetStockForm(); // Réinitialise le formulaire après succès
                    // Rafraîchit l'inventaire si visible
                    if (inventoryView?.classList.contains('active-view')) {
                        displayInventory(currentInventoryPage);
                    }
                }
            } catch (err) {
                 console.error("Erreur JS sauvegarde composant:", err);
                 showAdminFeedback("Erreur inattendue lors de la sauvegarde.", 'error');
            } finally {
                 if(saveComponentButton) saveComponentButton.disabled = false;
                 if(checkStockButton) checkStockButton.disabled = false; // Réactive vérifier
            }
        });
    }


    // --- LOGIQUE VUE RECHERCHE (Chat AI) ---

    // Ajoute un message à la zone de chat
    async function addMessageToChat(sender, messageContent, isHTML = false) {
        if (!responseOutputChat) return; // Vérifie si l'élément existe

        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender.toLowerCase()); // Classe 'user' ou 'ai'

        // Ajoute l'élément message à la fin du chat
        responseOutputChat.appendChild(messageElement);

        if (sender === 'AI') {
            // Affiche l'indicateur de chargement pour l'IA
            if (loadingIndicatorChat) {
                loadingIndicatorChat.style.display = 'flex'; // Ou 'block' selon ton CSS
                // Assure que l'élément <i> existe avant de changer son texte
                const indicatorText = loadingIndicatorChat.querySelector('i');
                if (indicatorText) indicatorText.textContent = 'StockAV réfléchit...';
            }
            // Effet de frappe pour l'IA
            messageElement.innerHTML = '<span class="typing-indicator"></span>'; // Placeholder pendant la "frappe"
            await delay(300); // Petit délai avant de commencer à "taper"

            messageElement.innerHTML = ''; // Efface le placeholder
            if (isHTML) {
                 // Si le contenu est déjà du HTML formaté
                 messageElement.innerHTML = messageContent;
                 // Simule un délai basé sur la longueur pour l'affichage HTML
                 const simulatedTypingDelay = Math.min(messageContent.length * 2, 800); // Délai proportionnel, max 800ms
                 await delay(simulatedTypingDelay);
            } else {
                 // Effet de frappe lettre par lettre pour le texte simple
                for (let i = 0; i < messageContent.length; i++) {
                    messageElement.textContent += messageContent[i];
                    // Scrolle pendant la frappe si nécessaire
                    responseOutputChat.scrollTop = responseOutputChat.scrollHeight;
                    if (messageContent[i] !== ' ' && messageContent[i] !== '\n') {
                         await delay(15); // Délai plus long pour les lettres, plus court pour les espaces
                    } else {
                         await delay(5);
                    }
                }
            }
             // Cache l'indicateur de chargement une fois le message affiché
            if (loadingIndicatorChat) loadingIndicatorChat.style.display = 'none';

        } else { // Message de l'utilisateur
            messageElement.textContent = messageContent;
        }

        // Ajoute au log interne (limité aux 10 derniers échanges pour contexte IA)
        const role = sender === 'User' ? 'user' : 'assistant';
        chatHistory.push({ role: role, content: messageContent });
        // Limite la taille de l'historique pour éviter surcharge
        if (chatHistory.length > 20) { // Garde les 20 derniers messages (10 échanges)
            chatHistory.splice(0, chatHistory.length - 20);
        }

        // Scrolle automatiquement vers le bas pour voir le dernier message
        responseOutputChat.scrollTop = responseOutputChat.scrollHeight;
    }

    // Affiche le message de bienvenue initial dans le chat
    function displayWelcomeMessage() {
        if (responseOutputChat) responseOutputChat.innerHTML = ''; // Vide le chat précédent
        chatHistory = []; // Vide l'historique
        resetConversationState(); // Réinitialise l'état de la conversation
        addMessageToChat('AI', "Bonjour ! Je suis StockAV. Comment puis-je vous aider ?\nEntrez une référence (ex: `LM358`) ou posez une question (ex: 'quantité BC547', 'équivalents pour 2N2222', 'décris moi le NE555', 'pinout du 74HC595', 'compare LM317 et LM7805').");
        if(componentInputChat) {
            componentInputChat.value = ''; // Vide le champ input
            componentInputChat.focus(); // Met le focus sur l'input
        }
    }

    // Extrait la première référence probable d'un texte utilisateur
    function extractReference(text) {
        if (!text) return null;
        const upperText = text.toUpperCase();
        // Regex améliorée pour capturer divers formats de références, y compris avec espaces ou tirets optionnels
         // Priorise les formats longs et spécifiques
        const refPattern = /\b((?:PIC|AT[TINYMEGAXMEGA]+|STM32[A-Z]\d*|ESP-?\d+[A-Z]*-?[A-Z\d]*|IRF[A-Z]*\d+[A-Z]*|LM\d+[A-Z]*|NE\d+[A-Z]*|UA\d+[A-Z]*|MAX\d+[A-Z]*|SN74[A-ZLS]+?\d+[A-Z]*|CD4\d+[A-Z]*|BC\d+[A-Z]*|BD\d+[A-Z]*|TIP\d+[A-Z]*|MOC\d+[A-Z]*)[\s\-]?\d*[A-Z\d\-/]*)\b|\b([1-9]N\s?\d{4}[A-Z]*)\b|\b([2-9][NP]\s?\d+[A-Z]*)\b|\b([A-Z]{2,}\d{2,}[A-Z\d\-/]*)\b/g;

        let bestMatch = null;
        let match;
        while ((match = refPattern.exec(upperText)) !== null) {
             // Prend le premier groupe capturant non nul
            const currentMatch = match[1] || match[2] || match[3] || match[4];
            if (currentMatch) {
                const cleanedMatch = currentMatch.replace(/[\s\-]+/g, ''); // Nettoie espaces/tirets internes pour comparaison/stockage
                 // Donne priorité aux matchs plus longs ou plus spécifiques si plusieurs trouvés
                if (!bestMatch || cleanedMatch.length > bestMatch.length) {
                    bestMatch = cleanedMatch;
                }
            }
        }
        if (bestMatch) console.log(`extractReference: Référence extraite: ${bestMatch} (depuis: "${text}")`);
        return bestMatch;
    }

    // Analyse l'intention et les références dans la requête utilisateur
    function parseIntentAndRefs(text) {
        if (!text) return { intent: 'unknown', refs: [] };
        const upperText = text.toUpperCase();

        let intent = 'unknown';
        let refs = [];
        // Regex pour extraire les références (même que extractReference)
        const refPattern = /\b((?:PIC|AT[TINYMEGAXMEGA]+|STM32[A-Z]\d*|ESP-?\d+[A-Z]*-?[A-Z\d]*|IRF[A-Z]*\d+[A-Z]*|LM\d+[A-Z]*|NE\d+[A-Z]*|UA\d+[A-Z]*|MAX\d+[A-Z]*|SN74[A-ZLS]+?\d+[A-Z]*|CD4\d+[A-Z]*|BC\d+[A-Z]*|BD\d+[A-Z]*|TIP\d+[A-Z]*|MOC\d+[A-Z]*)[\s\-]?\d*[A-Z\d\-/]*)\b|\b([1-9]N\s?\d{4}[A-Z]*)\b|\b([2-9][NP]\s?\d+[A-Z]*)\b|\b([A-Z]{2,}\d{2,}[A-Z\d\-/]*)\b/g;

         let match;
         while ((match = refPattern.exec(upperText)) !== null) {
             const currentMatch = match[1] || match[2] || match[3] || match[4];
             if (currentMatch) {
                 // Utilise la ref nettoyée (sans espaces/tirets) pour la logique, mais on pourrait garder l'originale aussi si besoin
                 refs.push(currentMatch.replace(/[\s\-]+/g, ''));
             }
         }
        // Tri par longueur décroissante puis garde les refs uniques
        refs.sort((a, b) => b.length - a.length);
        refs = [...new Set(refs)];

        // Mots-clés pour détecter l'intention
        const compareKeywords = /\b(COMPARE|COMPARER|VS|CONTRE|DIFFERENCE)\b/;
        const pinoutKeywords = /\b(PINOUT|BROCHAGE|PATTES|PIN-OUT|SCHEMA|WIRING)\b/;
        const describeKeywords = /\b(D[EÉ]CRIS|DESCRIPTION|INFO|CARACT[EÉ]RISTIQUES?|DETAILS?|QU'EST-CE|C'EST QUOI|TYPE)\b/;
        const equivalentsKeywords = /\b([EÉ]QUIVALENTS?|REMPLACANTS?|SIMILAIRES?|ALTERNATIVES?)\b/;
        const quantityKeywords = /\b(STOCK|QUANTIT[EÉ]|DISPO|COMBIEN)\b/;

        // Détermination de l'intention (logique simple, priorité aux mots-clés explicites)
        if (compareKeywords.test(upperText) && refs.length >= 2) {
            intent = 'compare';
        } else if (equivalentsKeywords.test(upperText) && refs.length >= 1) {
            intent = 'equivalents';
        } else if (pinoutKeywords.test(upperText) && refs.length >= 1) {
            intent = 'pinout';
        } else if (describeKeywords.test(upperText) && refs.length >= 1) {
            intent = 'describe';
        } else if (quantityKeywords.test(upperText) && refs.length >= 1) {
            intent = 'quantity';
        } else if (refs.length > 0) {
            // Si référence trouvée sans mot clé clair, l'intention par défaut est 'quantity'
            intent = 'quantity';
            console.log("Référence trouvée sans intention claire, intention par défaut: quantity");
        } else if (equivalentsKeywords.test(upperText)) {
             // Cas spécial: "cherche équivalents" sans préciser la réf
             intent = 'ask_for_ref_equivalents';
        } else if (compareKeywords.test(upperText)) {
             // Cas spécial: "compare" sans refs suffisantes
             intent = 'ask_for_ref_compare';
        }
        // Ajouter d'autres cas si besoin (ex: demande de datasheet -> recherche google?)

        console.log(`parseIntentAndRefs - Texte: "${text}", Intent: ${intent}, Refs trouvées: ${refs.join(', ')}`);
        return { intent: intent, refs: refs.slice(0, 2) }; // Prend les 2 premières refs max
    }

    // Gère l'entrée utilisateur (clic ou Entrée), la logique de conversation et appelle l'IA
    async function handleUserInput() {
        if (!componentInputChat || !searchButtonChat) return; // Garde-fou

        const userInput = componentInputChat.value.trim();
        if (!userInput) return; // Ne rien faire si l'input est vide

        // Ajoute le message de l'utilisateur au chat
        addMessageToChat('User', userInput);
        componentInputChat.value = ''; // Vide l'input
        searchButtonChat.disabled = true; // Désactive le bouton pendant le traitement
        componentInputChat.disabled = true; // Désactive l'input aussi

        try {
            // --- Gestion de la conversation multi-tours ---
            if (conversationState.awaitingEquivalentChoice) {
                console.log("Gestion réponse choix équivalent:", userInput);
                await handleAIChatRequest('equivalent_choice_response', conversationState.originalRefChecked, userInput);
                return; // Sortir après avoir traité la réponse au choix
            }
            if (conversationState.awaitingQuantityConfirmation) {
                console.log("Gestion réponse confirmation quantité:", userInput);
                await handleQuantityResponse(userInput); // Gère la réponse OUI/NON/Qté
                return; // Sortir après avoir traité la réponse de quantité
            }

            // --- Si ce n'est pas une réponse attendue, c'est une NOUVELLE requête ---
            console.log("Nouvelle requête utilisateur détectée, reset de l'état de conversation.");
            resetConversationState();

            // Analyse l'intention et les références de la nouvelle requête
            const intentInfo = parseIntentAndRefs(userInput);
            let requestType = intentInfo.intent;
            let param1 = intentInfo.refs.length > 0 ? intentInfo.refs[0] : null; // Réf 1 ou null
            let param2 = intentInfo.refs.length > 1 ? intentInfo.refs[1] : null; // Réf 2 ou null

            // --- Logique de traitement basée sur l'intention ---
            switch (requestType) {
                case 'quantity':
                case 'describe':
                case 'pinout':
                case 'equivalents':
                    if (!param1) { // Ces intentions nécessitent une référence
                        await addMessageToChat('AI', `Pour que je puisse traiter votre demande de '${requestType}', veuillez spécifier la référence du composant (ex: '${requestType} LM358').`);
                        resetConversationState();
                    } else {
                        await handleAIChatRequest(requestType, param1); // Appelle l'IA avec la référence
                    }
                    break;
                case 'compare':
                    if (!param1 || !param2) { // Nécessite deux références
                        await addMessageToChat('AI', `Pour comparer, veuillez fournir deux références (ex: 'compare LM358 et TL072').`);
                        resetConversationState();
                    } else {
                        await handleAIChatRequest(requestType, param1, param2); // Appelle l'IA avec les deux références
                    }
                    break;
                 case 'ask_for_ref_equivalents':
                     await addMessageToChat('AI', "Pour quelle référence souhaitez-vous trouver des équivalents ?");
                     resetConversationState(); // Attend nouvelle entrée utilisateur
                     break;
                 case 'ask_for_ref_compare':
                     await addMessageToChat('AI', `Quelles sont les deux références que vous souhaitez comparer ?`);
                     resetConversationState();
                     break;
                case 'unknown':
                default:
                    // Si l'intention est inconnue ou non gérée, on pourrait soit demander de reformuler,
                    // soit tenter une requête générique (mais moins fiable)
                    await addMessageToChat('AI', "Désolé, je ne suis pas sûr de comprendre. Pouvez-vous reformuler en utilisant des mots-clés comme 'stock', 'quantité', 'équivalent', 'décris', 'pinout', 'compare' suivis de la référence ?");
                    resetConversationState();
                    break;
            }

        } catch (error) {
            console.error("Erreur majeure dans handleUserInput:", error);
            await addMessageToChat('AI', "Oups ! Une erreur interne s'est produite lors du traitement de votre demande. Veuillez réessayer.");
            resetConversationState(); // Reset l'état en cas d'erreur grave
        } finally {
            // Réactive le bouton et l'input à la fin du traitement (succès ou échec)
            if(searchButtonChat) searchButtonChat.disabled = false;
            if(componentInputChat) {
                componentInputChat.disabled = false;
                componentInputChat.focus(); // Remet le focus sur l'input
            }
        }
    }


    // Appelle la fonction Edge Supabase pour traiter la demande de l'IA
    async function handleAIChatRequest(requestType, param1, param2 = null) {
        if (!supabase) {
            await addMessageToChat('AI', "Erreur: La connexion au service IA n'est pas disponible (Supabase non initialisé).");
            return;
        }
        if (!AI_FUNCTION_NAME) {
             await addMessageToChat('AI', "Erreur: Le nom de la fonction IA n'est pas configuré.");
             return;
        }

        // Prépare le corps de la requête pour la fonction Edge
        const requestBody = {
            request_type: requestType,
            reference1: param1,
            reference2: param2, // Sera null si non fourni
            // history: chatHistory // Envoi de l'historique désactivé pour l'instant (simplification)
        };

        console.log(`Appel Fonction Edge: ${AI_FUNCTION_NAME} avec body:`, JSON.stringify(requestBody));
        // L'indicateur de chargement est géré via addMessageToChat('AI', "...")
        const aiThinkingMessagePromise = addMessageToChat('AI', "..."); // Ajoute '...' et démarre l'indicateur

        try {
            // Appelle la fonction Edge
            const { data: responseData, error: functionError } = await supabase.functions.invoke(AI_FUNCTION_NAME, {
                body: requestBody
            });

            // Attend que le message "..." soit ajouté avant de potentiellement le supprimer
            await aiThinkingMessagePromise;
            // Supprime le message "..." avant d'afficher la vraie réponse
            const thinkingElement = responseOutputChat?.querySelector('.message.ai:last-child');
            if (thinkingElement && thinkingElement.textContent === '...') {
               thinkingElement.remove();
            }
            if (loadingIndicatorChat) loadingIndicatorChat.style.display = 'none'; // Cache l'indicateur si besoin

            // Gère les erreurs *de l'invocation elle-même* (ex: réseau, fonction non trouvée, 5xx)
            if (functionError) {
                console.error("Erreur invocation fonction Edge Supabase:", functionError);
                let errorMessage = "Désolé, une erreur s'est produite en contactant l'assistant IA.";
                 // Tente de déduire l'erreur de la réponse (peut être un objet FunctionsHttpError, FunctionsRelayError, FunctionsFetchError)
                 if (functionError.message) {
                     if (functionError.message.includes('Function not found')) errorMessage = "Erreur: Le service IA est introuvable.";
                     else if (functionError.message.includes('timeout')) errorMessage = "Désolé, la réponse de l'assistant IA a mis trop de temps.";
                     else if (functionError.message.includes('failed to fetch') || functionError instanceof TypeError) errorMessage = "Impossible de contacter le service IA. Vérifiez la connexion ou l'URL de la fonction.";
                     // Spécifique pour les erreurs 5xx retournées par la fonction elle-même
                     else if (functionError.message.includes('status code 500') || functionError.message.includes('non-2xx status code')) {
                         errorMessage = "L'assistant IA a rencontré une erreur interne (Code 500).";
                         // On pourrait essayer de lire responseData si disponible, mais c'est souvent non défini pour les 500
                     } else {
                         errorMessage += ` Détails: ${functionError.message}`;
                     }
                 } else {
                     errorMessage += ` Type: ${functionError.name || 'Inconnu'}`;
                 }
                 await addMessageToChat('AI', errorMessage);
                 resetConversationState(); // Reset en cas d'erreur de l'IA
                 return; // Sortir si erreur invocation
            }

            // Traite la réponse de la fonction Edge (si l'invocation a réussi, statut 2xx)
             // La fonction Edge doit retourner { response_type, content }
            console.log("Réponse reçue de la fonction Edge (data):", responseData);

             if (!responseData || !responseData.response_type || responseData.content === undefined) {
                 await addMessageToChat('AI', "Désolé, j'ai reçu une réponse inattendue ou incomplète de l'assistant.");
                 resetConversationState();
                 return;
             }

            // --- Traitement du contenu basé sur response_type retourné par la fonction ---
            const returnedType = responseData.response_type;
            const responseContent = responseData.content;

            // Si la fonction elle-même a renvoyé une erreur interne structurée
             if (returnedType === 'error') {
                await addMessageToChat('AI', `Erreur de l'assistant: ${responseContent}`);
                resetConversationState();
                return;
             }

             // --- Formatage de la réponse basée sur le type ---
             let formattedReply = "";
             let isHtmlReply = false;

             if (returnedType === 'equivalents') {
                 if (Array.isArray(responseContent) && responseContent.length > 0) {
                     formattedReply = `Voici quelques équivalents possibles pour <strong>${param1}</strong> (vérifiez toujours la datasheet avant utilisation) :\n<ul>`;
                     // Ajoute la vérification du stock pour chaque équivalent
                     for (const eq of responseContent) {
                          const stockInfo = await getStockInfoFromSupabase(eq.ref);
                          const stockIndicator = createStockIndicatorHTML(stockInfo?.quantity, stockInfo?.critical_threshold);
                          // Rend la réf cliquable pour voir ses détails/stock
                          const clickableRef = `<a href="#" class="ref-link" data-ref="${eq.ref}" title="Voir détails/stock pour ${eq.ref}">${eq.ref}</a>`;
                          formattedReply += `<li>${stockIndicator} <strong>${clickableRef}</strong> : ${eq.reason || 'N/A'}</li>`;
                     }
                     formattedReply += `</ul>`;
                     isHtmlReply = true;
                 } else if (Array.isArray(responseContent) && responseContent.length === 0) {
                     formattedReply = `Je n'ai pas trouvé d'équivalents directs courants pour ${param1}.`;
                 } else {
                     formattedReply = responseContent || `Impossible de déterminer les équivalents pour ${param1}.`; // Fallback
                 }
                 // Ajoute les liens externes après la liste
                 formattedReply += provideExternalLinksHTML(param1); // Ajoute les liens pour la réf originale

             } else if (returnedType === 'compare') {
                 if (typeof responseContent === 'object' && responseContent !== null && (responseContent.similarities || responseContent.differences)) {
                     formattedReply = `Comparaison entre <strong>${param1}</strong> et <strong>${param2}</strong> :\n`;
                     if (responseContent.similarities && responseContent.similarities.length > 0) {
                         formattedReply += `\n<strong>Similitudes :</strong>\n<ul>${responseContent.similarities.map(s => `<li>${s}</li>`).join('')}</ul>`;
                     }
                     if (responseContent.differences && responseContent.differences.length > 0) {
                         formattedReply += `<strong>Différences :</strong>\n<ul>${responseContent.differences.map(d => `<li>${d}</li>`).join('')}</ul>`;
                     }
                     if (responseContent.notes) {
                         formattedReply += `\n<em>Note: ${responseContent.notes}</em>`;
                     }
                     isHtmlReply = true;
                 } else {
                     formattedReply = responseContent; // Si ce n'est pas l'objet attendu, affiche texte brut
                 }
                  // Ajoute les liens pour les deux références comparées
                 formattedReply += provideExternalLinksHTML(param1, false);
                 formattedReply += provideExternalLinksHTML(param2, false);

             } else if (returnedType === 'quantity') { // Gère le type 'quantity'
                const stockInfo = await getStockInfoFromSupabase(param1);
                if (stockInfo) {
                    const status = getStockStatus(stockInfo.quantity, stockInfo.critical_threshold);
                    const indicator = createStockIndicatorHTML(stockInfo.quantity, stockInfo.critical_threshold);
                    formattedReply = `${indicator} Il y a actuellement <strong>${stockInfo.quantity}</strong> unité(s) de ${param1} en stock (Tiroir: ${stockInfo.drawer || 'N/A'}).`;
                    // Propose de prendre du stock si > 0
                     if (stockInfo.quantity > 0) {
                         formattedReply += `<br><button class="take-button" data-action="take_stock" data-ref="${param1}" data-quantity="1">Prendre 1</button>`;
                     }
                    isHtmlReply = true;
                 } else {
                    formattedReply = `Je n'ai pas trouvé la référence ${param1} dans notre stock.`;
                 }
                  formattedReply += provideExternalLinksHTML(param1);

             } else { // describe, pinout, generic_query, ou autre
                 formattedReply = String(responseContent).replace(/\n/g, '<br>'); // Remplace retours ligne par <br>
                 isHtmlReply = true;
                 // Ajoute les liens pour la réf principale si disponible
                  if (param1 && (returnedType === 'describe' || returnedType === 'pinout')) {
                     formattedReply += provideExternalLinksHTML(param1);
                  }
             }


            // Affiche la réponse formatée de l'IA
            await addMessageToChat('AI', formattedReply, isHtmlReply);

             // Reset les flags 'awaiting' car cet échange est terminé
             conversationState.awaitingEquivalentChoice = false;
             conversationState.awaitingQuantityConfirmation = false;


        } catch (err) {
            // Erreur JavaScript lors de l'appel de la fonction ou du traitement de la réponse
            console.error("Erreur JavaScript lors de l'appel/traitement de la fonction Edge:", err);
            // Assure que l'indicateur de chargement est caché
            const thinkingElement = responseOutputChat?.querySelector('.message.ai:last-child');
            if (thinkingElement && thinkingElement.textContent === '...') thinkingElement.remove();
            if (loadingIndicatorChat) loadingIndicatorChat.style.display = 'none';
            await addMessageToChat('AI', "Une erreur technique inattendue s'est produite lors de la communication avec l'assistant IA.");
            resetConversationState(); // Reset complet en cas d'erreur JS grave
        }
    }


    // Gère le clic sur les boutons ou liens dans les messages de l'IA
    responseOutputChat?.addEventListener('click', async (event) => {
        const button = event.target.closest('button[data-action]'); // Cherche un bouton avec data-action
        const link = event.target.closest('a.ref-link[data-ref]'); // Cherche un lien de référence cliquable

        if (!button && !link) return; // Si ce n'est ni l'un ni l'autre, ignorer

        event.preventDefault(); // Empêche le comportement par défaut (surtout pour les liens #)

        if (button) {
            // --- Traitement Bouton ---
            const action = button.dataset.action;
            const ref = button.dataset.ref;
            const quantity = button.dataset.quantity ? parseInt(button.dataset.quantity, 10) : null;

            console.log(`Clic sur bouton IA: Action=${action}, Ref=${ref}, Quantité=${quantity}`);

            // Désactive le bouton immédiatement pour éviter double-clic
            button.disabled = true;
            const originalButtonText = button.textContent; // Sauvegarde le texte original
            button.textContent = '...'; // Indique le traitement

            try {
                if (action === 'take_stock') {
                    if (!ref || quantity === null || quantity <= 0) {
                        await addMessageToChat('AI', "Action invalide. Référence ou quantité manquante pour prendre du stock.");
                         button.disabled = false; button.textContent = originalButtonText; // Réactive
                        return;
                    }
                     // 1. Vérifier si l'utilisateur est connecté
                    if (!currentUser) {
                        await promptLoginBeforeAction(`prendre ${quantity} x ${ref}`);
                         button.disabled = false; button.textContent = originalButtonText; // Réactive car interrompu
                         resetConversationState();
                        return;
                    }
                    // 2. Si connecté, tenter de prendre le stock
                     await addMessageToChat('User', `Je prends ${quantity} x ${ref}`); // Simule l'entrée utilisateur
                     const { newQuantity, error } = await updateStockInSupabase(ref, -quantity); // Tente de retirer la quantité
                    if (error) {
                        // updateStockInSupabase gère l'affichage de l'erreur log/admin
                        await addMessageToChat('AI', `Impossible de prendre ${quantity} x ${ref}. ${error}`);
                         button.disabled = false; button.textContent = originalButtonText; // Réactive
                         resetConversationState();
                    } else {
                         await addMessageToChat('AI', `Ok, ${quantity} x ${ref} retiré(s) du stock. Nouvelle quantité: ${newQuantity}.`);
                         // Laisse le bouton désactivé car l'action est faite.
                         resetConversationState(); // L'action termine la conversation sur ce point.
                         // Mettre à jour l'inventaire si visible
                          if (inventoryView?.classList.contains('active-view')) {
                            displayInventory(currentInventoryPage);
                        }
                    }

                }
                // Ajouter d'autres actions de bouton ici si nécessaire...
                 else {
                     console.warn(`Action de bouton IA non gérée: ${action}`);
                     await addMessageToChat('AI', "Action non reconnue.");
                      button.disabled = false; button.textContent = originalButtonText; // Réactive
                 }

            } catch (err) {
                 console.error("Erreur lors du traitement du clic sur bouton IA:", err);
                 await addMessageToChat('AI', "Une erreur s'est produite lors du traitement de votre action.");
                 resetConversationState();
                 // Réactive le bouton en cas d'erreur JS inattendue
                 button.disabled = false;
                 button.textContent = "Erreur";
            }
        } else if (link) {
             // --- Traitement Lien Référence Cliquable ---
             const ref = link.dataset.ref;
             console.log(`Clic sur lien référence IA: ${ref}`);
             if (componentInputChat) {
                 componentInputChat.value = `${ref} quantité?`; // Pré-remplit l'input
                 handleUserInput(); // Lance la recherche pour cette référence
             }
        }
    });

     // Génère le HTML pour les liens externes (datasheet, fournisseurs)
     function provideExternalLinksHTML(ref, isBlock = true) {
        if (!ref) return '';
        const encodedRef = encodeURIComponent(ref);
        const googleUrl = `https://www.google.com/search?q=${encodedRef}+datasheet+pdf`;
        const octopartUrl = `https://octopart.com/search?q=${encodedRef}&currency=EUR&specs=0`;
        // const aliexpressUrl = `https://www.aliexpress.com/wholesale?SearchText=${encodedRef}`; // Attention aux redirections/blocages

        if (isBlock) {
             return `
                <div class="external-links-block">
                    <a href="${googleUrl}" target="_blank" rel="noopener noreferrer" class="external-link" title="Rechercher datasheet sur Google">Datasheet (Google)</a>
                    <a href="${octopartUrl}" target="_blank" rel="noopener noreferrer" class="external-link" title="Comparer prix et stocks sur Octopart">Prix/Stock (Octopart)</a>
                    {/* <a href="${aliexpressUrl}" target="_blank" rel="noopener noreferrer" class="external-link aliexpress" title="Rechercher sur AliExpress">AliExpress</a> */}
                </div>`;
        } else {
             // Version inline (plus petite)
             return `
                 <span class="external-links-inline">
                    (<a href="${googleUrl}" target="_blank" rel="noopener noreferrer" class="external-link-inline" title="Rechercher datasheet ${ref}">datasheet</a>
                    | <a href="${octopartUrl}" target="_blank" rel="noopener noreferrer" class="external-link-inline" title="Comparer prix/stocks pour ${ref}">prix</a>)
                    {/* | <a href="${aliexpressUrl}" target="_blank" rel="noopener noreferrer" class="external-link-inline aliexpress" title="Chercher ${ref} sur AliExpress">ali</a>) */}
                </span>`;
        }
    }


    // Demande à l'utilisateur de se connecter avant de faire une action
    async function promptLoginBeforeAction(actionDescription) {
        await addMessageToChat('AI', `Pour ${actionDescription}, vous devez être connecté. Veuillez vous identifier via le formulaire ci-dessus.`);
        loginCodeInput?.focus(); // Met le focus sur le champ de login
        // Ne pas reset l'état ici, on attend toujours la connexion
        // L'utilisateur devra répéter son action après connexion.
    }

     // Gère la réponse (oui/non/nombre) à une demande de confirmation de quantité
     async function handleQuantityResponse(userInput) {
        if (!conversationState.chosenRefForStockCheck) {
            console.error("handleQuantityResponse appelé sans chosenRefForStockCheck dans l'état.");
            resetConversationState();
            await addMessageToChat('AI', "Oups, j'ai perdu le fil. Pouvez-vous reformuler votre demande ?");
            return;
        }

        const ref = conversationState.chosenRefForStockCheck;
        const positiveResponses = ['oui', 'yes', 'ok', 'y', 'o', 'confirmer', 'prendre'];
        const negativeResponses = ['non', 'no', 'n', 'annuler', 'cancel'];
        const inputLower = userInput.toLowerCase();

        let quantityToTake = 0;

        // Essaye d'abord de voir si c'est un nombre
        const requestedQuantity = parseInt(userInput, 10);
        if (!isNaN(requestedQuantity) && requestedQuantity > 0) {
             quantityToTake = requestedQuantity;
             console.log(`Quantité numérique détectée: ${quantityToTake}`);
        } else if (positiveResponses.some(res => inputLower.includes(res))) {
            // Si c'est une réponse positive, on prend la quantité suggérée initialement
             quantityToTake = conversationState.suggestedQuantity || 1; // Utilise la qté suggérée par l'IA ou 1 par défaut
             console.log(`Réponse positive détectée, quantité à prendre: ${quantityToTake} (suggérée ou 1)`);
        } else if (negativeResponses.some(res => inputLower.includes(res))) {
             console.log("Réponse négative détectée.");
             await addMessageToChat('AI', "Ok, opération annulée.");
             resetConversationState(); // Annulation, on reset tout
             return; // Sortir
        } else {
            console.log("Réponse non comprise pour la confirmation de quantité.");
             await addMessageToChat('AI', `Désolé, je n'ai pas compris. Voulez-vous prendre du stock pour ${ref} ? Répondez par 'oui', 'non', ou entrez la quantité souhaitée.`);
             // Ne pas reset l'état, on attend toujours une réponse valide
             return;
        }

        // --- Si on a déterminé une quantité à prendre ---
        if (quantityToTake > 0) {
             // Vérifier si la quantité demandée est disponible (l'info est dans l'état)
             if (quantityToTake > conversationState.availableQuantity) {
                await addMessageToChat('AI', `Désolé, il n'y a que ${conversationState.availableQuantity} ${ref} en stock. Vous ne pouvez pas en prendre ${quantityToTake}.`);
                resetConversationState(); // Reset après échec quantité
                return;
             }

             // Vérifier si l'utilisateur est connecté (normalement déjà fait avant, mais sécurité)
             if (!currentUser) {
                 await promptLoginBeforeAction(`prendre ${quantityToTake} x ${ref}`);
                 resetConversationState(); // Interrompu par login
                 return;
             }

             // --- Procéder à la prise de stock ---
             console.log(`Tentative de prendre ${quantityToTake} x ${ref}`);
             const { newQuantity, error } = await updateStockInSupabase(ref, -quantityToTake);

             if (error) {
                 await addMessageToChat('AI', `Impossible de prendre ${quantityToTake} x ${ref}. ${error}`);
             } else {
                 await addMessageToChat('AI', `Ok, ${quantityToTake} x ${ref} retiré(s) du stock. Nouvelle quantité: ${newQuantity}.`);
                 if (inventoryView?.classList.contains('active-view')) {
                     displayInventory(currentInventoryPage);
                 }
             }
             // Que l'opération ait réussi ou échoué, la conversation sur ce point est terminée.
             resetConversationState();
        }
    }

    // Réinitialise complètement l'état de la conversation du chat
    function resetConversationState() {
        console.log("Réinitialisation de l'état de la conversation du chat.");
        conversationState = {
            awaitingEquivalentChoice: false,
            awaitingQuantityConfirmation: false,
            originalRefChecked: null,
            potentialEquivalents: [],
            chosenRefForStockCheck: null,
            availableQuantity: 0,
            criticalThreshold: null,
            suggestedQuantity: null // Assure que c'est réinitialisé aussi
        };
    }


    // --- Fonctions d'interaction Supabase (Inventaire & Log) ---

    // Récupère les informations de stock pour une référence donnée
    async function getStockInfoFromSupabase(ref) {
        if (!supabase || !ref) {
            console.warn("getStockInfoFromSupabase: Supabase non initialisé ou référence manquante.");
            return null;
        }
        const upperRef = ref.toUpperCase(); // Travaille toujours en majuscules pour la ref
        try {
            // SELECT explicite des colonnes nécessaires
            const { data, error } = await supabase
                .from('inventory')
                .select('ref, description, quantity, category_id, manufacturer, datasheet, drawer, critical_threshold, attributes')
                .eq('ref', upperRef)
                .single();

            // Gère les erreurs ou l'absence de résultat
            if (error) {
                if (error.code === 'PGRST116') { // Code spécifique pour "0 rows found" avec .single()
                    console.log(`Aucun stock trouvé pour la référence ${upperRef}.`);
                    return null;
                } else if (error.message.includes("security barrier") || error.code === '42501') {
                     console.error(`RLS a bloqué la lecture de l'inventaire pour ${upperRef}. Message: ${error.message}`);
                     return null;
                } else {
                    console.error(`Erreur Supabase lors de la récupération du stock pour ${upperRef}:`, error);
                    throw new Error(`Erreur DB lors de la recherche de ${upperRef}: ${error.message}`);
                }
            }
             if (data) console.log(`Stock trouvé pour ${upperRef}: Qty=${data.quantity}, Drawer=${data.drawer}`);
             return data;

        } catch (err) {
            console.error(`Erreur JavaScript dans getStockInfoFromSupabase pour ${upperRef}:`, err);
            return null; // Retourne null en cas d'erreur JS aussi
        }
    }

    // Met à jour la quantité en stock et ajoute une entrée au log via RPC
    async function updateStockInSupabase(ref, change) {
        // Vérifications initiales
        if (!supabase || !currentUser || !currentUserCode) {
            return { newQuantity: null, error: "Utilisateur non connecté ou Supabase non initialisé." };
        }
        if (!ref || change === null || change === undefined || isNaN(change)) {
             return { newQuantity: null, error: "Référence ou changement invalide/nul fourni." };
         }
         if (change === 0) {
             console.warn("Appel à updateStockInSupabase avec un changement de 0. Aucune action effectuée.");
             const currentInfo = await getStockInfoFromSupabase(ref);
             return { newQuantity: currentInfo?.quantity ?? null, error: null }; // Retourne quantité actuelle sans erreur
         }


        const upperRef = ref.toUpperCase();
        change = Number(change);

        console.log(`Appel RPC update_stock: Ref=${upperRef}, Change=${change}, User=${currentUserCode}`);

        try {
            // Utilise la fonction RPC Supabase 'update_stock'
             const { data, error } = await supabase.rpc('update_stock', {
                p_ref: upperRef,
                p_change: change,
                p_user_code: currentUserCode,
                p_user_id: currentUser.id
             });

            // Gestion de la réponse de la fonction RPC
            if (error) {
                console.error(`Erreur RPC 'update_stock' pour ${upperRef}:`, error.details || error.message);
                // Essaye de rendre l'erreur plus claire pour l'utilisateur
                let userErrorMessage = error.message;
                 // Accès aux détails spécifiques de l'erreur PostgreSQL si disponible (ex: via HINT dans la fonction SQL)
                 if (error.hint) { userErrorMessage = error.hint; }
                 else if (error.message.includes("insufficient_stock")) { userErrorMessage = "Quantité insuffisante en stock pour effectuer cette opération."; }
                 else if (error.message.includes("item_not_found")) { userErrorMessage = `Référence ${upperRef} non trouvée dans l'inventaire.`; }
                 else if (error.message.includes("permission denied") || error.message.includes("policy")) { userErrorMessage = "Permission refusée pour modifier le stock."; }

                // Affiche l'erreur dans la modale si elle est ouverte, sinon dans le log/admin
                 if (quantityChangeModal?.style.display === 'block' && modalFeedback) {
                    modalFeedback.textContent = userErrorMessage;
                    modalFeedback.className = 'modal-feedback error'; // Utilise classe modale
                    modalFeedback.style.display = 'block'; // Assure visibilité
                 } else {
                    showLogFeedback(userErrorMessage, 'error'); // Feedback dans le log si modale fermée
                    showAdminFeedback(userErrorMessage, 'error'); // Ou dans l'admin
                 }
                 return { newQuantity: null, error: userErrorMessage };
            }

            // Si la fonction RPC réussit, elle retourne la nouvelle quantité
            const newQuantity = data; // La fonction retourne directement INTEGER

            if (newQuantity === null || newQuantity === undefined || isNaN(newQuantity)) {
                 console.error("La fonction RPC 'update_stock' n'a pas retourné une nouvelle quantité valide.", data);
                 const errMsg = "La mise à jour a peut-être réussi, mais la nouvelle quantité n'a pas pu être confirmée.";
                 if (quantityChangeModal?.style.display === 'block' && modalFeedback) { modalFeedback.textContent = errMsg; modalFeedback.className = 'modal-feedback warning'; modalFeedback.style.display = 'block';}
                 else { showLogFeedback(errMsg, 'warning'); showAdminFeedback(errMsg, 'warning');}
                 return { newQuantity: null, error: errMsg };
             }

            console.log(`Stock de ${upperRef} mis à jour avec succès via RPC. Nouvelle quantité: ${newQuantity}`);

            // La fonction RPC gère l'ajout au log.

            // Met à jour l'afficheur 7 segments si le tiroir de cet item était le dernier affiché
            const updatedItemInfo = await getStockInfoFromSupabase(upperRef); // Récupère les infos (surtout le tiroir)
            if (updatedItemInfo && updatedItemInfo.drawer && updatedItemInfo.drawer === lastDisplayedDrawer) {
                 updateSevenSegmentDisplay(updatedItemInfo.drawer);
             }

            return { newQuantity: newQuantity, error: null }; // Retourne succès

        } catch (err) {
            console.error(`Erreur JavaScript inattendue dans updateStockInSupabase pour ${upperRef}:`, err);
            const errMsg = "Erreur technique inattendue lors de la mise à jour du stock.";
             if (quantityChangeModal?.style.display === 'block' && modalFeedback) { modalFeedback.textContent = errMsg; modalFeedback.className = 'modal-feedback error'; modalFeedback.style.display = 'block';}
             else { showLogFeedback(errMsg, 'error'); showAdminFeedback(errMsg, 'error');}
            return { newQuantity: null, error: errMsg };
        }
    }

    // --- Gestion Modale Quantité (+/-) ---

    // Gère le clic sur une ligne de la table d'inventaire pour ouvrir la modale
    async function handleInventoryRowClick(event) {
        if (!currentUser) {
             if(loginError) {
                 loginError.textContent = "Connectez-vous pour modifier la quantité.";
                 loginError.style.display = 'block';
             }
             loginCodeInput?.focus();
            return;
        }

        const row = event.target.closest('.inventory-item-row'); // Trouve la ligne parente cliquée
        if (!row || !row.dataset.ref) return; // Si ce n'est pas une ligne valide, sort

        const ref = row.dataset.ref;
        console.log(`Clic sur ligne inventaire: ${ref}. Ouverture modale...`);

        // Affiche un état de chargement ou désactive la ligne en attendant les données
        row.style.opacity = '0.5';
        row.style.pointerEvents = 'none';

        try {
            const item = await getStockInfoFromSupabase(ref); // Récupère les détails de l'item
            if (item) {
                showQuantityModal(item); // Affiche la modale avec les données
            } else {
                // Ne devrait pas arriver si la ligne existe, mais sécurité
                alert(`Impossible de charger les détails pour ${ref}. L'élément a peut-être été supprimé.`);
            }
        } catch (error) {
             console.error(`Erreur chargement détails pour modale (${ref}):`, error);
             alert(`Erreur lors du chargement des détails pour ${ref}: ${error.message}`);
        } finally {
             // Réactive la ligne
             row.style.opacity = '1';
             row.style.pointerEvents = 'auto';
        }
    }

    // Affiche la modale de modification de quantité
    function showQuantityModal(item) {
        if (!quantityChangeModal || !modalOverlay) {
            console.error("Éléments DOM de la modale introuvables.");
            return;
        }

        console.log("Affichage modale pour:", item.ref);
        modalCurrentRef = item.ref;
        modalInitialQuantity = Number(item.quantity ?? 0); // Utilise 0 si null/undefined
        currentModalChange = 0; // Réinitialise le changement

        // Remplit les informations de la modale
        if(modalRefSpan) modalRefSpan.textContent = item.ref;
        if(modalQtySpan) modalQtySpan.textContent = modalInitialQuantity;
        if(modalChangeAmountDisplay) modalChangeAmountDisplay.textContent = '0';
        if(modalFeedback) modalFeedback.textContent = ''; // Vide feedback précédent
        if(modalFeedback) modalFeedback.className = 'modal-feedback info'; // Reset style feedback
        if(modalFeedback) modalFeedback.style.display = 'none'; // Cache feedback initial

         // Affiche les attributs spécifiques (correction: utilise UL et LI)
         if (modalAttributesList && item.attributes && typeof item.attributes === 'object' && Object.keys(item.attributes).length > 0) {
            modalAttributesList.innerHTML = ''; // Vide les anciens
            for (const key in item.attributes) {
                 if (Object.prototype.hasOwnProperty.call(item.attributes, key)) { // Bonne pratique
                    const li = document.createElement('li');
                    // Utilise textContent pour éviter injection HTML potentielle dans les clés/valeurs
                    const strong = document.createElement('strong');
                    strong.textContent = `${key}: `;
                    li.appendChild(strong);
                    li.appendChild(document.createTextNode(item.attributes[key] || '-'));
                    modalAttributesList.appendChild(li);
                 }
            }
            if (modalAttributesSection) modalAttributesSection.style.display = 'block';
         } else {
             if (modalAttributesSection) modalAttributesSection.style.display = 'none'; // Cache si pas d'attributs
             if (modalAttributesList) modalAttributesList.innerHTML = '';
         }

        // Met à jour l'état initial des boutons +/-/Confirmer
        updateModalButtonStates();

        // Affiche la modale et l'overlay
        if (quantityChangeModal) quantityChangeModal.style.display = 'block';
        if (modalOverlay) modalOverlay.style.display = 'block';
        // Déclenche l'animation après un court délai pour permettre le display: block
        setTimeout(() => {
            if(modalOverlay) modalOverlay.classList.add('active');
            if(quantityChangeModal) quantityChangeModal.classList.add('active');
        }, 10);


        // Met à jour l'afficheur 7 segments avec le tiroir de l'item
        lastDisplayedDrawer = item.drawer || null; // Met à jour le dernier tiroir affiché
        updateSevenSegmentDisplay(lastDisplayedDrawer);
    }

    // Cache la modale de modification de quantité
    function hideQuantityModal() {
        if(modalOverlay) modalOverlay.classList.remove('active');
        if(quantityChangeModal) quantityChangeModal.classList.remove('active');
        // Cache les éléments après la fin de la transition
        setTimeout(() => {
             if (modalOverlay && !modalOverlay.classList.contains('active')) modalOverlay.style.display = 'none';
             if (quantityChangeModal && !quantityChangeModal.classList.contains('active')) quantityChangeModal.style.display = 'none';
        }, 300); // Doit correspondre à la durée de transition CSS

        console.log("Modale fermée.");
        // Optionnel: Effacer l'afficheur 7 segments à la fermeture ? Ou le laisser ?
        // Pour l'instant, on le laisse afficher la dernière valeur.
        // updateSevenSegmentDisplay(null); // Décommentez pour effacer
    }

    // Met à jour l'état (activé/désactivé) des boutons de la modale
    function updateModalButtonStates() {
        if (!quantityChangeModal || !modalOverlay) return; // Assure que la modale existe
        const newQuantity = modalInitialQuantity + currentModalChange;

        // Bouton - : Désactivé si la nouvelle quantité serait négative
        if(modalDecreaseButton) modalDecreaseButton.disabled = (newQuantity <= 0);

        // Bouton + : Toujours activé (on peut toujours ajouter)
        if(modalIncreaseButton) modalIncreaseButton.disabled = false;

        // Bouton Confirmer : Désactivé si aucun changement n'a été fait
        if(modalConfirmButton) modalConfirmButton.disabled = (currentModalChange === 0);

        // Affiche le changement en cours (+1, -2, etc.) ou 0
        if(modalChangeAmountDisplay) {
            modalChangeAmountDisplay.textContent = (currentModalChange > 0 ? '+' : '') + currentModalChange;
            // Change couleur si changement non nul
             modalChangeAmountDisplay.style.color = (currentModalChange !== 0)
                ? (currentModalChange > 0 ? 'var(--success-color)' : 'var(--error-color)')
                : 'inherit'; // Couleur par défaut si 0
             modalChangeAmountDisplay.style.fontWeight = (currentModalChange !== 0) ? 'bold' : 'normal';
        }

        // Met à jour la quantité *potentielle* après confirmation
        if(modalQtySpan) modalQtySpan.textContent = newQuantity; // Affiche la quantité si le changement était appliqué
    }

    // --- Gestion Afficheur 7 Segments ---
    // Mapping des chiffres (0-9) et quelques lettres/symboles aux segments (a-g)
    const segmentMap = {
        '0': ['a', 'b', 'c', 'd', 'e', 'f'], '1': ['b', 'c'], '2': ['a', 'b', 'g', 'e', 'd'],
        '3': ['a', 'b', 'g', 'c', 'd'], '4': ['f', 'g', 'b', 'c'], '5': ['a', 'f', 'g', 'c', 'd'],
        '6': ['a', 'f', 'e', 'd', 'c', 'g'], '7': ['a', 'b', 'c'], '8': ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
        '9': ['a', 'b', 'c', 'd', 'f', 'g'], 'A': ['a', 'b', 'c', 'e', 'f', 'g'], 'B': ['c', 'd', 'e', 'f', 'g'], // 'b' majuscule ressemble à 8
        'C': ['a', 'd', 'e', 'f'], 'D': ['b', 'c', 'd', 'e', 'g'], // 'd' minuscule
        'E': ['a', 'd', 'e', 'f', 'g'], 'F': ['a', 'e', 'f', 'g'], 'G': ['a', 'c', 'd', 'e', 'f'], // Majuscule
        'H': ['b', 'c', 'e', 'f', 'g'], // Majuscule
        'I': ['b', 'c'], // Comme 1
        'J': ['b', 'c', 'd', 'e'], 'L': ['d', 'e', 'f'], 'N': ['a', 'b', 'c', 'e', 'f'], // Majuscule
        'O': ['a', 'b', 'c', 'd', 'e', 'f'], // Comme 0
        'P': ['a', 'b', 'e', 'f', 'g'], 'Q': ['a', 'b', 'c', 'f', 'g'],
        'R': ['a', 'e', 'f'], // Majuscule (variante)
        'S': ['a', 'f', 'g', 'c', 'd'], // Comme 5
        'T': ['d', 'e', 'f', 'g'], // 't' minuscule
        'U': ['b', 'c', 'd', 'e', 'f'], // Majuscule
        'Y': ['b', 'c', 'd', 'f', 'g'], // Majuscule
        'Z': ['a', 'b', 'd', 'e', 'g'], // Comme 2
        '-': ['g'], '_': ['d'], ' ': [], '.': ['dp'],
    };

    // Met à jour l'affichage des 4 digits 7 segments
    function updateSevenSegmentDisplay(newDrawerValue = undefined) {
        if (!sevenSegmentDisplay || !segmentDigits.every(d => d)) {
            return; // Ne rien faire si l'afficheur n'est pas prêt
        }

        let displayString = "----"; // Valeur par défaut (tirets)
        let displayOn = false; // Indique si l'afficheur doit être "allumé"

        // Si une nouvelle valeur est fournie, l'utilise. Sinon, utilise la dernière valeur mémorisée.
        const valueToDisplay = (newDrawerValue !== undefined) ? newDrawerValue : lastDisplayedDrawer;

        if (valueToDisplay !== null && valueToDisplay !== undefined && String(valueToDisplay).trim() !== '') {
            // Prend les 4 derniers caractères, met en majuscules, et pad avec des espaces à gauche si moins de 4 cars
            displayString = String(valueToDisplay).slice(-4).toUpperCase().padStart(4, ' ');
            displayOn = true; // On a quelque chose à afficher
        } else {
             // Si la valeur est null, undefined ou vide, affiche vide
             displayString = "    "; // 4 espaces pour tout éteindre
             displayOn = false;
        }

        // Met à jour chaque digit
        for (let i = 0; i < 4; i++) {
            const digitElement = segmentDigits[i];
            if (!digitElement) continue; // Sécurité si un digit manque

            const charToDisplay = displayString[i] || ' '; // Prend le caractère ou un espace si vide

            // Récupère tous les segments possibles 'a' à 'g' pour ce digit
            const allSegments = digitElement.querySelectorAll('.segment');
            // Retire la classe 'on' de tous les segments
            allSegments.forEach(seg => seg.classList.remove('on'));

            // Récupère les segments à activer pour ce caractère
            const segmentsToActivate = segmentMap[charToDisplay] || segmentMap['-']; // Utilise '-' si char inconnu

            // Ajoute la classe 'on' aux segments corrects
            segmentsToActivate.forEach(segmentCode => {
                // Trouve le segment correspondant (ex: .segment-a)
                const segmentElement = digitElement.querySelector(`.segment-${segmentCode}`);
                if (segmentElement) {
                    segmentElement.classList.add('on');
                }
            });
        }

        // Allume ou éteint l'afficheur globalement
        if (displayOn) {
             sevenSegmentDisplay.classList.remove('display-off');
        } else {
             sevenSegmentDisplay.classList.add('display-off');
        }
    }


    // --- LOGIQUE VUE PARAMÈTRES ---

    // Charge les données ou états nécessaires pour la vue Paramètres
    function loadSettingsData() {
        if (!currentUser || currentUserCode !== 'zine') {
            console.warn("Tentative de chargement des données Paramètres refusée.");
            return;
        }
        console.log("Chargement des données/états pour la vue Paramètres...");
        resetImportState(); // Assure que la section import est dans l'état initial
        showSettingsFeedback('export', '', 'none'); // Cache les feedbacks
        showSettingsFeedback('import', '', 'none');
    }

    // Affiche un feedback dans une section spécifique des paramètres (export ou import)
    function showSettingsFeedback(type, message, level = 'info') { // type='export' ou 'import'
        const feedbackDiv = (type === 'export') ? exportFeedbackDiv : importFeedbackDiv;
        if (!feedbackDiv) return;

        feedbackDiv.textContent = message;
        feedbackDiv.className = `feedback-area ${level}`; // Applique classe CSS (info, success, warning, error)

        if (level === 'none' || !message) {
            feedbackDiv.style.display = 'none';
        } else {
            feedbackDiv.style.display = 'block';
            // Cache automatiquement (sauf erreurs)
            if (level !== 'error') {
                setTimeout(() => {
                    if (feedbackDiv.textContent === message) {
                        feedbackDiv.style.display = 'none';
                        feedbackDiv.textContent = '';
                    }
                }, 7000); // Délai un peu plus long pour les paramètres
            }
        }
    }

    // Fonction utilitaire pour déclencher le téléchargement d'un fichier
    function downloadFile(filename, content, mimeType) {
        try {
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a); // Requis pour Firefox
            a.click();
            document.body.removeChild(a); // Nettoie
            URL.revokeObjectURL(url); // Libère la mémoire
            console.log(`Fichier ${filename} téléchargement lancé.`);
            return true;
        } catch (error) {
            console.error("Erreur lors de la création ou du téléchargement du fichier:", error);
            return false;
        }
    }

    // Gère l'export de l'inventaire en CSV
    async function handleExportInventoryCSV() {
        if (!supabase || !currentUser) return;
        if (!Papa) {
            showSettingsFeedback('export', "Erreur: Librairie PapaParse manquante pour l'export CSV.", 'error');
            return;
        }

        showSettingsFeedback('export', "Préparation de l'export CSV de l'inventaire...", 'info');
        if(exportInventoryCsvButton) exportInventoryCsvButton.disabled = true;

        try {
            // Récupère TOUT l'inventaire, trié par référence. Sélectionne les colonnes pertinentes.
             const { data, error } = await supabase
                .from('inventory')
                .select('ref, description, category_id, manufacturer, quantity, datasheet, drawer, critical_threshold, attributes') // Colonnes à exporter
                .order('ref', { ascending: true });

            if (error) {
                // Gère erreur RLS ou autre DB error
                if (error.message.includes("security barrier") || error.message.includes("policy")) {
                    throw new Error(`Erreur RLS lors de l'export inventaire: Accès refusé.`);
                } else {
                    throw new Error(`Erreur base de données: ${error.message}`);
                }
            }

            if (!data || data.length === 0) {
                showSettingsFeedback('export', "L'inventaire est vide, rien à exporter.", 'warning');
                if(exportInventoryCsvButton) exportInventoryCsvButton.disabled = false; // Réactive bouton si vide
                return;
            }

            console.log(`Export CSV: ${data.length} lignes récupérées.`);

            // Récupère les noms des catégories pour les inclure dans le CSV
            let categoryNames = {};
            try {
                const categories = await getCategories(); // Utilise le cache si possible
                if (categories) {
                     categoryNames = Object.fromEntries(categories.map(cat => [cat.id, cat.name]));
                }
            } catch(catError) {
                 console.error("Erreur récupération noms catégories pour export CSV:", catError);
                 // Continue sans les noms si erreur
            }

            // Prépare les données pour PapaParse (ajoute nom catégorie, formate attributs)
             // IMPORTANT: L'ordre des clés ici détermine l'ordre des colonnes dans le CSV
            const csvData = data.map(item => ({
                Ref: item.ref, // Doit correspondre à l'en-tête attendu par l'import
                Description: item.description || '',
                Category: item.category_id ? (categoryNames[item.category_id] || '') : '', // Nom exact ou vide
                Manufacturer: item.manufacturer || '',
                Quantity: item.quantity ?? 0, // Utilise 0 si null/undefined
                Datasheet: item.datasheet || '',
                Drawer: item.drawer || '',
                Threshold: item.critical_threshold ?? '', // Utilise '' si null/undefined
                Attributes: item.attributes ? JSON.stringify(item.attributes) : '' // Exporte comme string JSON
            }));

            // Convertit en CSV avec PapaParse
            const csvString = Papa.unparse(csvData, {
                header: true, // Inclut l'en-tête
                quotes: true, // Met des guillemets autour des champs si nécessaire
                delimiter: ",", // Utilise la virgule comme séparateur standard
                 newline: "\r\n" // Fin de ligne standard Windows/CSV
            });

            // Crée un nom de fichier avec timestamp
            const timestamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-'); // Format YYYY-MM-DD-HH-MM
            const filename = `stockav_inventory_${timestamp}.csv`;

            // Déclenche le téléchargement
            const success = downloadFile(filename, csvString, 'text/csv;charset=utf-8;');

            if (success) {
                 showSettingsFeedback('export', `Export CSV terminé (${data.length} lignes). Fichier: ${filename}`, 'success');
            } else {
                 showSettingsFeedback('export', "Erreur lors de la création du fichier CSV à télécharger.", 'error');
            }

        } catch (err) {
            console.error("Erreur lors de l'export CSV de l'inventaire:", err);
            showSettingsFeedback('export', `Erreur lors de l'export: ${err.message}`, 'error');
        } finally {
            if(exportInventoryCsvButton) exportInventoryCsvButton.disabled = false; // Réactive le bouton
        }
    }

    // Gère l'export du log en fichier TXT
    async function handleExportLogTXT() {
        if (!supabase || !currentUser) return;

        showSettingsFeedback('export', "Préparation de l'export TXT de l'historique...", 'info');
        if(exportLogTxtButton) exportLogTxtButton.disabled = true;

        try {
            // Récupère TOUT le log, trié par date (le plus ancien en premier pour lecture chronologique)
             const { data, error } = await supabase
                .from('log')
                .select('*')
                .order('timestamp', { ascending: true }); // Plus ancien en premier

            if (error) {
                 if (error.message.includes("security barrier") || error.message.includes("policy")) {
                    throw new Error(`Erreur RLS lors de l'export historique: Accès refusé.`);
                 } else {
                    throw new Error(`Erreur base de données: ${error.message}`);
                 }
            }

            if (!data || data.length === 0) {
                showSettingsFeedback('export', "L'historique est vide, rien à exporter.", 'warning');
                if(exportLogTxtButton) exportLogTxtButton.disabled = false; // Réactive si vide
                return;
            }

            console.log(`Export Log TXT: ${data.length} lignes récupérées.`);

            // Formate les données en texte simple, une ligne par entrée
            const logLines = data.map(entry => {
                 const timestamp = formatLogTimestamp(entry.timestamp);
                 const user = entry.user_code?.toUpperCase() || 'N/A';
                 const change = (entry.change > 0 ? '+' : '') + entry.change;
                 return `${timestamp} | User: ${user.padEnd(8)} | Ref: ${entry.item_ref.padEnd(15)} | Change: ${change.padStart(4)} | New Qty: ${entry.new_quantity}`;
            });
            const txtContent = logLines.join('\n'); // Joint les lignes avec un retour chariot

            // Crée nom de fichier et télécharge
            const timestamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
            const filename = `stockav_log_${timestamp}.txt`;
            const success = downloadFile(filename, txtContent, 'text/plain;charset=utf-8;');

            if (success) {
                 showSettingsFeedback('export', `Export TXT terminé (${data.length} lignes). Fichier: ${filename}`, 'success');
            } else {
                 showSettingsFeedback('export', "Erreur lors de la création du fichier TXT à télécharger.", 'error');
            }

        } catch (err) {
            console.error("Erreur lors de l'export TXT du log:", err);
            showSettingsFeedback('export', `Erreur lors de l'export: ${err.message}`, 'error');
        } finally {
            if(exportLogTxtButton) exportLogTxtButton.disabled = false; // Réactive bouton
        }
    }

    // Gère l'import d'inventaire depuis un fichier CSV
    async function handleImportInventoryCSV() {
        if (!importCsvFileInput || !importCsvFileInput.files || importCsvFileInput.files.length === 0) {
            showSettingsFeedback('import', "Veuillez sélectionner un fichier CSV à importer.", 'warning');
            return;
        }
        if (!Papa) {
            showSettingsFeedback('import', "Erreur: Librairie PapaParse manquante pour l'import CSV.", 'error');
            return;
        }
        if (!supabase || !currentUser) {
             showSettingsFeedback('import', "Erreur: Connexion requise pour importer.", 'error');
             return;
        }

        const file = importCsvFileInput.files[0];
        const selectedModeRadio = document.querySelector('input[name="import-mode"]:checked');
        const importMode = selectedModeRadio ? selectedModeRadio.value : 'upsert'; // 'upsert' ou 'overwrite'

        console.log(`Début import CSV: ${file.name}, Mode: ${importMode}`);
        showSettingsFeedback('import', `Lecture du fichier ${file.name}...`, 'info');
        if(importInventoryCsvButton) importInventoryCsvButton.disabled = true;
        if(importCsvFileInput) importCsvFileInput.disabled = true;
        importModeRadios.forEach(radio => radio.disabled = true);

        // Utilise PapaParse pour lire le fichier CSV
        Papa.parse(file, {
            header: true,       // Le fichier doit avoir une ligne d'en-tête
            skipEmptyLines: 'greedy', // Ignore les lignes vides et celles avec seulement des espaces/délimiteurs
            dynamicTyping: false, // Traite tout comme string initialement pour éviter erreurs de type
            complete: async (results) => { // Fonction appelée quand le parsing est terminé
                showSettingsFeedback('import', `Fichier lu. ${results.data.length} lignes trouvées (hors lignes vides). Traitement en cours...`, 'info');
                console.log("Données CSV parsées:", results.data);
                console.log("Erreurs PapaParse:", results.errors);
                 if (results.errors.length > 0) {
                     // Affiche la première erreur de parsing
                    showSettingsFeedback('import', `Erreur lecture CSV ligne ${results.errors[0].row + 1}: ${results.errors[0].message}. Vérifiez le format du fichier.`, 'error');
                    resetImportState();
                    return;
                 }
                 if (results.data.length === 0) {
                     showSettingsFeedback('import', "Le fichier CSV est vide ou ne contient pas de données valides après filtrage des lignes vides.", 'warning');
                     resetImportState();
                     return;
                 }

                 // Récupère les catégories pour mapper les noms aux IDs
                 let categoryMap = {}; // { 'NOM_CATEGORIE_MAJ': id }
                 try {
                     const categories = await getCategories(true); // Force refresh
                     if (categories) {
                         categoryMap = Object.fromEntries(categories.map(cat => [cat.name.toUpperCase(), cat.id]));
                     }
                     console.log("Map des catégories pour import:", categoryMap);
                 } catch (catError) {
                      console.error("Erreur récupération catégories pour import:", catError);
                      showSettingsFeedback('import', `Avertissement: Erreur chargement catégories (${catError.message}). Les catégories ne seront pas importées correctement.`, 'warning');
                      // Continue sans le mapping si erreur
                 }


                // Transformation des données CSV en format Supabase
                let itemsToProcess = [];
                let skippedCount = 0;
                let headerError = false;
                // En-têtes attendus (insensible à la casse, trim) - Doivent correspondre à l'export
                const expectedHeaders = ['ref', 'quantity', 'category'];
                const optionalHeaders = ['description', 'manufacturer', 'datasheet', 'drawer', 'threshold', 'attributes'];

                 // Vérifie si les headers existent (même s'ils sont vides)
                 if (!results.meta || !results.meta.fields) {
                      headerError = true;
                      showSettingsFeedback('import', `Erreur: Impossible de lire les en-têtes du fichier CSV.`, 'error');
                      resetImportState();
                      return;
                  }
                 // Normalise les en-têtes lus pour comparaison insensible à la casse
                 const actualHeadersLower = results.meta.fields.map(h => String(h || '').toLowerCase().trim());

                 if (!expectedHeaders.every(h => actualHeadersLower.includes(h))) {
                     headerError = true;
                     const missing = expectedHeaders.filter(h => !actualHeadersLower.includes(h));
                     showSettingsFeedback('import', `Erreur: En-têtes requis manquants dans le CSV: ${missing.join(', ')}. Les en-têtes attendus sont Ref, Quantity, Category (insensible à la casse).`, 'error');
                     resetImportState();
                     return;
                 }


                results.data.forEach((row, index) => {
                     // Normalise les clés de l'objet row (lowercase, trim) pour la recherche
                     const normalizedRow = {};
                     const originalKeys = results.meta.fields; // Utilise les clés originales de PapaParse
                     originalKeys.forEach(key => {
                         const lowerKey = String(key || '').toLowerCase().trim();
                         normalizedRow[lowerKey] = String(row[key] ?? '').trim(); // Assure que c'est une string et trim
                     });


                    // Utilise les noms exacts des headers attendus (insensible à la casse via normalizedRow)
                    const ref = normalizedRow['ref'];
                    const quantityStr = normalizedRow['quantity'];
                    const categoryName = normalizedRow['category'] || ''; // Nom de la catégorie

                    // Vérifie les champs obligatoires (ref, quantity)
                    if (!ref || quantityStr === undefined || quantityStr === '') {
                         console.warn(`Ligne ${index + 2} ignorée: Référence ou Quantité manquante.`);
                         skippedCount++;
                         return; // Ignore cette ligne
                    }

                    const quantity = parseInt(quantityStr, 10);
                    if (isNaN(quantity) || quantity < 0) {
                        console.warn(`Ligne ${index + 2} ignorée: Quantité invalide pour ${ref} ("${quantityStr}"). Doit être un nombre >= 0.`);
                        skippedCount++;
                        return; // Ignore cette ligne
                    }

                    // Trouve l'ID de catégorie basé sur le nom (insensible à la casse)
                    const category_id = categoryName ? (categoryMap[categoryName.toUpperCase()] || null) : null;
                    if (categoryName && !category_id) {
                        console.warn(`Ligne ${index + 2}: Catégorie "${categoryName}" non trouvée pour ${ref}. Sera importé sans catégorie.`);
                         // Optionnel: ajouter une erreur si la catégorie est obligatoire?
                    }

                    // Récupère les autres champs optionnels en vérifiant s'ils existent dans les headers
                    const description = actualHeadersLower.includes('description') ? normalizedRow['description'] || null : null;
                    const manufacturer = actualHeadersLower.includes('manufacturer') ? normalizedRow['manufacturer'] || null : null;
                    const datasheet = actualHeadersLower.includes('datasheet') ? normalizedRow['datasheet'] || null : null;
                    const drawer = actualHeadersLower.includes('drawer') ? normalizedRow['drawer']?.toUpperCase() || null : null;
                    const thresholdStr = actualHeadersLower.includes('threshold') ? normalizedRow['threshold'] : undefined;

                    let critical_threshold = null;
                    if (thresholdStr !== undefined && thresholdStr !== '') {
                        critical_threshold = parseInt(thresholdStr, 10);
                        if (isNaN(critical_threshold) || critical_threshold < 0) {
                            console.warn(`Ligne ${index + 2}: Seuil invalide pour ${ref} ("${thresholdStr}"), ignoré.`);
                            critical_threshold = null;
                        }
                    }

                    // Gère les attributs (si la colonne 'Attributes' existe et contient du JSON valide)
                    let attributes = null;
                    const attributesStr = actualHeadersLower.includes('attributes') ? normalizedRow['attributes'] : undefined;
                     if (attributesStr) {
                        try {
                            const parsedAttrs = JSON.parse(attributesStr);
                            // Accepte seulement si c'est un objet non nul et non array
                            if (typeof parsedAttrs === 'object' && parsedAttrs !== null && !Array.isArray(parsedAttrs)) {
                                // Nettoie les valeurs vides dans l'objet attributs
                                for (const key in parsedAttrs) {
                                     if (parsedAttrs[key] === null || String(parsedAttrs[key]).trim() === '') {
                                         delete parsedAttrs[key];
                                     }
                                 }
                                if (Object.keys(parsedAttrs).length > 0) {
                                     attributes = parsedAttrs;
                                 }
                            } else {
                                 console.warn(`Ligne ${index + 2}: Attributs invalides pour ${ref} (doit être un objet JSON), ignorés.`);
                            }
                        } catch (e) {
                            console.warn(`Ligne ${index + 2}: Erreur parsing JSON des attributs pour ${ref}, ignorés. (${e.message})`);
                        }
                     }


                    // Ajoute l'item formaté à la liste
                    itemsToProcess.push({
                        ref: ref.toUpperCase(), // Toujours en majuscules
                        quantity: quantity,
                        category_id: category_id ? parseInt(category_id, 10) : null,
                        description: description,
                        manufacturer: manufacturer,
                        datasheet: datasheet,
                        drawer: drawer,
                        critical_threshold: critical_threshold,
                        attributes: attributes
                    });
                }); // Fin de la boucle forEach row

                 if (headerError) return; // Arrêt si headers invalides

                // --- Exécution de l'import dans Supabase ---
                if (itemsToProcess.length > 0) {
                    showSettingsFeedback('import', `Traitement de ${itemsToProcess.length} lignes valides (mode: ${importMode})...`, 'info');
                     let successCount = 0;
                     let errorCount = 0;

                     try {
                        if (importMode === 'overwrite') {
                            // --- Mode ÉCRASER ---
                            console.warn("Mode ÉCRASER sélectionné. Suppression de l'inventaire existant...");
                            if (!confirm("ATTENTION ! Le mode 'Écraser' va supprimer TOUT l'inventaire actuel avant d'importer. Êtes-vous sûr de vouloir continuer ?")) {
                                 showSettingsFeedback('import', "Import annulé par l'utilisateur.", 'warning');
                                 resetImportState();
                                 return;
                             }

                            showSettingsFeedback('import', `Suppression de l'inventaire existant...`, 'warning');
                             // Supprime les logs associés d'abord si nécessaire/voulu ? Non, l'inventaire seul.
                             // Supprimer inventaire
                             const { error: deleteError } = await supabase.from('inventory').delete().gte('id', 0); // Supprime tout
                            if (deleteError) {
                                throw new Error(`Erreur lors de la suppression de l'inventaire: ${deleteError.message}`);
                            }
                            console.log("Inventaire existant supprimé.");
                            showSettingsFeedback('import', `Inventaire supprimé. Importation des ${itemsToProcess.length} lignes...`, 'info');

                            // 2. Insérer les nouvelles données
                             const { error: insertError, count } = await supabase.from('inventory').insert(itemsToProcess);
                            if (insertError) {
                                let errMsg = insertError.message;
                                if (errMsg.includes('violates foreign key constraint') && errMsg.includes('inventory_category_id_fkey')) {
                                    errMsg = "Erreur: Une ou plusieurs catégories spécifiées dans le CSV n'existent pas.";
                                } else if (errMsg.includes('duplicate key value violates unique constraint "inventory_ref_key"')) {
                                     errMsg = "Erreur: Le fichier CSV contient des références dupliquées. Vérifiez le fichier.";
                                 }
                                throw new Error(`Erreur lors de l'insertion (overwrite): ${errMsg}`);
                            }
                            successCount = count || itemsToProcess.length;
                             // Log initial après overwrite ? Pourrait être lourd. À décider. Pas de log ici.

                        } else {
                            // --- Mode UPSERT (par défaut) ---
                            console.log("Mode UPSERT sélectionné. Mise à jour ou ajout...");
                            showSettingsFeedback('import', `Mise à jour/Ajout de ${itemsToProcess.length} lignes...`, 'info');
                             const { error: upsertError, data: upsertData, count } = await supabase
                                .from('inventory')
                                .upsert(itemsToProcess, { onConflict: 'ref' })
                                .select('ref, quantity'); // Récupère qté après upsert pour log éventuel

                            if (upsertError) {
                                 let errMsg = upsertError.message;
                                 if (errMsg.includes('violates foreign key constraint') && errMsg.includes('inventory_category_id_fkey')) {
                                    errMsg = "Erreur: Une ou plusieurs catégories spécifiées dans le CSV n'existent pas ou sont invalides.";
                                 }
                                throw new Error(`Erreur lors de l'upsert: ${errMsg}`);
                             }
                             // Le 'count' pour upsert peut être null, utiliser la longueur des données traitées
                             successCount = itemsToProcess.length;
                             // Log pour upsert ? Peut-être logguer seulement si quantité change significativement? Pour l'instant, pas de log auto pour upsert.
                        }

                        // --- Fin de l'import ---
                        const finalMessage = `Import terminé. ${successCount} lignes traitées avec succès. ${skippedCount > 0 ? `${skippedCount} lignes ignorées (voir console).` : ''}`;
                         showSettingsFeedback('import', finalMessage, 'success');
                         console.log(finalMessage);
                         // Rafraîchir la vue inventaire si elle est active
                         if (inventoryView?.classList.contains('active-view')) {
                             displayInventory(1); // Retour à la page 1
                         }
                         // Vider le champ fichier après succès
                         if (importCsvFileInput) importCsvFileInput.value = '';
                         if (importFileLabel) importFileLabel.textContent = 'Choisir un fichier CSV...';


                     } catch (dbError) {
                         // Erreur pendant l'opération DB (delete, insert, ou upsert)
                         console.error("Erreur base de données pendant l'import:", dbError);
                         showSettingsFeedback('import', `Erreur lors de l'import dans la base de données: ${dbError.message}`, 'error');
                         // Ne pas reset le fichier input pour que l'user puisse réessayer ? Resetons.
                          if (importCsvFileInput) importCsvFileInput.value = '';
                          if (importFileLabel) importFileLabel.textContent = 'Choisir un fichier CSV...';

                     } finally {
                         resetImportState(); // Réactive les boutons/input dans tous les cas
                     }

                } else {
                     showSettingsFeedback('import', `Aucune ligne valide à importer. ${skippedCount > 0 ? `${skippedCount} lignes ignorées (voir console).` : ''}`, 'warning');
                     resetImportState();
                 }

            },
            error: (err, file) => { // Fonction appelée en cas d'erreur de parsing PapaParse
                console.error("Erreur PapaParse:", err, file);
                showSettingsFeedback('import', `Erreur lors de la lecture du fichier CSV: ${err.message}`, 'error');
                resetImportState();
            }
        });
    }

     // Réinitialise l'état des contrôles d'import
     function resetImportState() {
        if(importInventoryCsvButton) importInventoryCsvButton.disabled = false;
        if(importCsvFileInput) importCsvFileInput.disabled = false;
        importModeRadios.forEach(radio => radio.disabled = false);
        // On ne vide pas le fichier input ici, l'utilisateur pourrait vouloir corriger et relancer
        // if (importCsvFileInput) importCsvFileInput.value = '';
        // if (importFileLabel) importFileLabel.textContent = 'Choisir un fichier CSV...';
     }

    // Ajoute les écouteurs pour la vue Paramètres
    function addSettingsEventListeners() {
         exportInventoryCsvButton?.addEventListener('click', handleExportInventoryCSV);
         exportLogTxtButton?.addEventListener('click', handleExportLogTXT);
         importInventoryCsvButton?.addEventListener('click', handleImportInventoryCSV);
         // Met à jour le label quand un fichier est choisi
         importCsvFileInput?.addEventListener('change', () => {
             if (importCsvFileInput.files && importCsvFileInput.files.length > 0) {
                 const fileName = importCsvFileInput.files[0].name;
                 if (importFileLabel) importFileLabel.textContent = fileName;
                 showSettingsFeedback('import', '', 'none'); // Cache ancien feedback
             } else {
                 if (importFileLabel) importFileLabel.textContent = 'Choisir un fichier CSV...'; // Texte par défaut
             }
         });
    }


    // --- Initialisation Générale de l'Application ---
    function initializeApp() {
        console.log("Initialisation de StockAV...");

        // Vérification rapide de la présence d'éléments DOM essentiels
        const requiredIds = [
            'login-area', 'user-info-area', 'main-navigation', 'search-view',
            'inventory-view', 'log-view', 'admin-view', 'settings-view',
            'login-button', 'logout-button', 'show-search-view',
            'inventory-table-body', 'log-table-body', 'response-output',
            'component-input', 'search-button', 'quantity-change-modal', 'modal-overlay',
            'category-list', 'stock-form', 'settings-view', 'export-inventory-csv-button',
            'import-inventory-csv-button', 'import-csv-file', 'log-table', // Ajout log-table pour querySelector
            'inventory-table' // Ajout inventory-table pour querySelector
        ];
        const missingElement = requiredIds.find(id => !document.getElementById(id));
        if (missingElement) {
             const errorMsg = `FATAL: Élément DOM essentiel manquant! ID: "${missingElement}". Vérifiez votre fichier index.html. L'application ne peut pas démarrer.`;
             console.error(errorMsg);
             document.body.innerHTML = `<p style='color:red; font-weight: bold; padding: 20px; font-family: sans-serif;'>${errorMsg}</p>`;
             return; // Arrête l'initialisation
        }
        console.log("Vérification initiale des éléments DOM essentiels: OK.");


        // --- Ajout des Écouteurs d'Événements Globaux ---

        // Navigation principale
        searchTabButton?.addEventListener('click', () => setActiveView(searchView, searchTabButton));
        inventoryTabButton?.addEventListener('click', () => setActiveView(inventoryView, inventoryTabButton));
        logTabButton?.addEventListener('click', () => setActiveView(logView, logTabButton));
        adminTabButton?.addEventListener('click', () => setActiveView(adminView, adminTabButton));
        settingsTabButton?.addEventListener('click', () => setActiveView(settingsView, settingsTabButton));

        // Authentification
        loginButton?.addEventListener('click', handleLogin);
        logoutButton?.addEventListener('click', handleLogout);
        loginCodeInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') loginPasswordInput?.focus(); }); // Passe au mdp sur Entrée
        loginPasswordInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleLogin(); });

        // Chat (Recherche)
        searchButtonChat?.addEventListener('click', handleUserInput);
        componentInputChat?.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) { // Empêche Shift+Enter de soumettre
                event.preventDefault();
                handleUserInput();
            }
        });
         // Le listener pour les clics DANS le chat (boutons/liens IA) est ajouté plus haut.

        // Inventaire
        applyInventoryFilterButton?.addEventListener('click', () => {
            currentInventoryFilters.category = inventoryCategoryFilter?.value || 'all';
            currentInventoryFilters.search = inventorySearchFilter?.value || '';
            console.log("Application filtres inventaire:", currentInventoryFilters);
            displayInventory(1);
        });
        inventorySearchFilter?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') applyInventoryFilterButton?.click();
        });
        inventoryCategoryFilter?.addEventListener('change', () => {
             applyInventoryFilterButton?.click();
        });
        inventoryPrevPageButton?.addEventListener('click', () => {
            if (currentInventoryPage > 1) displayInventory(currentInventoryPage - 1);
        });
        inventoryNextPageButton?.addEventListener('click', () => {
             if (!inventoryNextPageButton.disabled) displayInventory(currentInventoryPage + 1);
        });
        inventoryTableBody?.addEventListener('click', handleInventoryRowClick);


        // Log (Historique)
        logPrevPageButton?.addEventListener('click', () => {
            if (currentLogPage > 1) displayLog(currentLogPage - 1);
        });
        logNextPageButton?.addEventListener('click', () => {
             if (!logNextPageButton.disabled) displayLog(currentLogPage + 1);
        });
         // Listeners pour suppression log (simple/tout) ajoutés dynamiquement dans displayLog

        // Admin
        // Les listeners pour catégorie (liste et formulaire) sont ajoutés dans loadCategoriesAdmin
        addStockEventListeners(); // Attache listeners form stock (check/update/save)
        addComponentCategorySelectListener(); // Attache listener pour changement catégorie -> attributs

        // Paramètres
        addSettingsEventListeners(); // Attache les listeners export/import

        // Modale Quantité
        modalDecreaseButton?.addEventListener('click', () => { currentModalChange--; updateModalButtonStates(); });
        modalIncreaseButton?.addEventListener('click', () => { currentModalChange++; updateModalButtonStates(); });
        modalCancelButton?.addEventListener('click', hideQuantityModal);
        modalOverlay?.addEventListener('click', (event) => {
             if (event.target === modalOverlay) hideQuantityModal();
        });
        modalConfirmButton?.addEventListener('click', async () => {
             if (currentModalChange === 0 || !modalCurrentRef) return; // Ne rien faire si pas de changement

             const change = currentModalChange;
             const ref = modalCurrentRef;

             modalConfirmButton.disabled = true;
             modalCancelButton.disabled = true;
             if (modalFeedback) {
                 modalFeedback.textContent = `Mise à jour de ${ref}...`;
                 modalFeedback.className = 'modal-feedback info';
                 modalFeedback.style.display = 'block'; // Assure visibilité
             }

             // Appelle la fonction RPC qui met à jour DB et log
             const { newQuantity, error } = await updateStockInSupabase(ref, change);

             if (error) {
                  // updateStockInSupabase gère déjà le feedback dans la modale
                  modalConfirmButton.disabled = false; // Réactive confirmer
                  modalCancelButton.disabled = false; // Réactive annuler
             } else {
                 // Succès
                 if (modalFeedback) {
                     modalFeedback.textContent = `Stock de ${ref} mis à jour ! Nouvelle quantité: ${newQuantity}.`;
                     modalFeedback.className = 'modal-feedback success';
                     // Garde visible
                 }
                 // Met à jour l'inventaire en arrière-plan si visible
                 if (inventoryView?.classList.contains('active-view')) {
                     displayInventory(currentInventoryPage);
                 }
                  // Met à jour aussi le log si visible
                 if (logView?.classList.contains('active-view')) {
                     displayLog(1); // Retour page 1 du log après modif
                 }
                 // Ferme la modale après un court délai
                 setTimeout(hideQuantityModal, 1500);
             }
             // Pas besoin de réactiver si succès car la modale ferme
        });


        // --- Initialisation finale ---
        setupAuthListener(); // Lance l'écouteur d'authentification Supabase
        updateSevenSegmentDisplay(null); // Initialise l'afficheur
        // La vue initiale est gérée par l'auth listener / CSS par défaut

        console.log("StockAV initialisé et prêt.");
    }

    // --- Lancer l'application ---
    initializeApp();

}); // ----- FIN DU FICHIER script.js -----
