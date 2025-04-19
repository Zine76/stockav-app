<<<<<<< HEAD
// --- START OF FILE script.js (CORRECTED WITH Supabase Kit Storage + Visual Feedback) ---

=======
// CONTENU COMPLET DE SCRIPT.JS (AVEC CONNEXION FONCTIONNELLE + APPEL RPC POUR INVENTAIRE)
>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99
document.addEventListener('DOMContentLoaded', () => {
    "use strict"; // Active le mode strict

    // --- Configuration et Variables Globales ---
    let currentUser = null;
    let currentUserCode = null; // Stockera 'zine', 'tech1', etc.
<<<<<<< HEAD
    let ITEMS_PER_PAGE = 15; // Sera écrasé par localStorage si présent
=======
    let ITEMS_PER_PAGE = 15;
>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99
    let isInitialAuthCheckComplete = false;
    let activeSession = null;
    let lastDisplayedDrawerRef = null;
    let lastDisplayedDrawerThreshold = null;
    let categoriesCache = []; // Cache pour les catégories {id, name, attributes}
<<<<<<< HEAD
    let currentKitSelection = []; // Stocke les objets composants sélectionnés pour le kit (localement pour l'UI)
    // --- AJOUT --- : Pour stocker l'état des tiroirs collectés dans bom.html
    let currentCollectedDrawers = new Set();
=======
    let currentKitSelection = []; // Stocke les objets composants sélectionnés pour le kit
>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99

    // --- Configuration Supabase ---
    const SUPABASE_URL = 'https://tjdergojgghzmopuuley.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZGVyZ29qZ2doem1vcHV1bGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4MTU0OTUsImV4cCI6MjA1OTM5MTQ5NX0.XejQYEPYoCrgYOwW4T9g2VcmohCdLLndDdwpSYXAwPA';
    const FAKE_EMAIL_DOMAIN = '@stockav.local';
    let supabase = null;

    // --- Initialisation des Clients et Vérifications ---
    try {
        // ... (code d'initialisation Supabase/PapaParse inchangé) ...
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
<<<<<<< HEAD
        // ... (gestion erreur critique inchangée) ...
         document.body.innerHTML = `<div style="padding:20px; background-color:#f8d7da; color:#721c24; border: 1px solid #f5c6cb; border-radius: 5px;">
=======
        document.body.innerHTML = `<div style="padding:20px; background-color:#f8d7da; color:#721c24; border: 1px solid #f5c6cb; border-radius: 5px;">
>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99
                                    <h2>Erreur Critique d'Initialisation</h2>
                                    <p>L'application n'a pas pu démarrer correctement.</p>
                                    <p><strong>Détail :</strong> ${error.message}</p>
                                    <p>Veuillez vérifier la console du navigateur (F12) pour plus d'informations et contacter l'administrateur si le problème persiste.</p>
                                   </div>`;
        return;
    }

    // --- Récupération des Éléments DOM ---
<<<<<<< HEAD
    // ... (toute la section de récupération des éléments DOM reste INCHANGÉE) ...
=======
    // (Cette section est longue et n'a pas changé, je la garde identique à la version précédente)
>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99
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
<<<<<<< HEAD
    const kitTabButton = document.getElementById('show-bom-view'); // Garder l'ID original bom-view même si renommé "Kit"
=======
    const kitTabButton = document.getElementById('show-bom-view'); // Garde l'ID 'show-bom-view' pour l'onglet Kit Actuel
>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99
    const searchView = document.getElementById('search-view');
    const inventoryView = document.getElementById('inventory-view');
    const logView = document.getElementById('log-view');
    const adminView = document.getElementById('admin-view');
    const settingsView = document.getElementById('settings-view');
    const auditView = document.getElementById('audit-view');
<<<<<<< HEAD
    const kitView = document.getElementById('bom-view'); // Garder l'ID original
=======
    const kitView = document.getElementById('bom-view'); // Garde l'ID 'bom-view' pour la section Kit Actuel
>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99
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
<<<<<<< HEAD
    //const componentInfoDiv = document.getElementById('component-info'); // semble non utilisé
=======
    const componentInfoDiv = document.getElementById('component-info');
>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99
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
<<<<<<< HEAD
    const kitFeedbackDiv = document.getElementById('bom-feedback'); // bom-feedback est l'ID dans index.html
    const currentKitDrawersDiv = document.getElementById('current-kit-drawers'); // ID dans index.html
    const clearKitButton = document.getElementById('clear-kit-button'); // ID dans index.html
    const genericFeedbackDiv = document.getElementById('generic-feedback');
    const itemsPerPageSelect = document.getElementById('items-per-page-select');


    // --- État et Historique du Chat ---
    let chatHistory = [];
    let conversationState = {
        awaitingEquivalentChoice: false,
        awaitingQuantityConfirmation: false,
        originalRefChecked: null,
        chosenRefForStockCheck: null,
        availableQuantity: 0,
        criticalThreshold: null
    };
=======
    const kitFeedbackDiv = document.getElementById('bom-feedback');
    const currentKitDrawersDiv = document.getElementById('current-kit-drawers');
    const clearKitButton = document.getElementById('clear-kit-button');
    const genericFeedbackDiv = document.getElementById('generic-feedback');

    // --- État et Historique du Chat ---
    let chatHistory = [];
    let conversationState = { awaitingQuantityConfirmation: false, componentRef: null, maxQuantity: 0 };
>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    // --- Fonction pour sauvegarder le kit dans Supabase ---
    async function saveKitToSupabase() {
        if (!currentUser || !supabase) {
            console.warn("Impossible de sauvegarder le kit : Utilisateur non connecté ou Supabase non prêt.");
            return;
        }
        // Optimisation : ne pas sauvegarder un kit vide (préférer supprimer la ligne)
        if (currentKitSelection.length === 0) {
            console.log("Kit local vide, tentative de suppression de l'enregistrement du kit en DB.");
            await clearKitInSupabase(); // Appelle la fonction qui supprime la ligne
            return;
        }

        console.log(`Sauvegarde du kit (${currentKitSelection.length} éléments) dans Supabase pour user ${currentUser.id}...`);
        try {
            // Utilise upsert : insère si n'existe pas, met à jour si existe.
            // --- MODIFIÉ --- : On ne sauvegarde plus collected_drawers ici, car c'est bom.html qui le gère.
            const { error } = await supabase
                .from('user_kits')
                .upsert({
                    user_id: currentUser.id,
                    kit_data: currentKitSelection,
                    // collected_drawers est géré par bom-script.js
                }, {
                    onConflict: 'user_id' // La contrainte de conflit est sur user_id
                });

            if (error) {
                // Gérer les erreurs potentielles, notamment RLS
                if (error.message.includes('violates row-level security policy')) {
                    console.error("Erreur RLS : L'utilisateur n'a pas la permission de modifier ce kit.", error);
                    showKitFeedback("Erreur de permission (sauvegarde kit).", 'error');
                } else {
                    console.error("Erreur lors de la sauvegarde du kit dans Supabase:", error);
                    showKitFeedback("Erreur sauvegarde du kit.", 'error');
                }
            } else {
                console.log("Kit sauvegardé avec succès dans Supabase (sans toucher à collected_drawers).");
                // Optionnel : feedback succès discret
                // showKitFeedback("Kit sauvegardé.", 'success', 1500);
            }
        } catch (err) {
            console.error("Erreur JS inattendue lors de la sauvegarde du kit:", err);
            showKitFeedback("Erreur technique sauvegarde kit.", 'error');
        }
    }

    // --- MODIFIÉ --- : Fonction pour charger le kit ET l'état collecté depuis Supabase ---
    async function loadKitFromSupabase() {
        currentKitSelection = []; // Réinitialiser d'abord le kit local
        currentCollectedDrawers = new Set(); // --- AJOUT --- : Réinitialiser aussi les tiroirs collectés

        if (!currentUser || !supabase) {
            console.log("Chargement du kit/collecté annulé : Utilisateur non connecté ou Supabase non prêt.");
            return;
        }
        console.log(`Chargement du kit et état collecté depuis Supabase pour user ${currentUser.id}...`);
        try {
            // --- MODIFIÉ --- : Sélectionner aussi collected_drawers
            const { data, error } = await supabase
                .from('user_kits')
                .select('kit_data, collected_drawers') // Charger les deux colonnes
                .eq('user_id', currentUser.id)
                .maybeSingle(); // Récupère 0 ou 1 ligne

            if (error) {
                // Gérer les erreurs potentielles (code inchangé)
                 if (error.message.includes('relation "public.user_kits" does not exist')) {
                     console.error("Erreur critique : La table 'user_kits' n'existe pas dans la base de données !");
                     showKitFeedback("Erreur: Table 'user_kits' manquante.", 'error');
                 } else if (error.message.includes('violates row-level security policy')) {
                     console.error("Erreur RLS : L'utilisateur n'a pas la permission de lire ce kit.", error);
                     showKitFeedback("Erreur de permission (lecture kit).", 'error');
                 } else {
                     console.error("Erreur lors du chargement du kit/collecté depuis Supabase:", error);
                     showKitFeedback("Erreur chargement du kit/collecté.", 'error');
                 }
                 return; // Sortir si erreur
            }

            if (data) {
                // Charger kit_data (inchangé)
                if (data.kit_data && Array.isArray(data.kit_data)) {
                    currentKitSelection = data.kit_data;
                    console.log(`Kit chargé depuis Supabase (${currentKitSelection.length} éléments).`);
                } else {
                    console.log("Aucun kit_data trouvé ou invalide.");
                    currentKitSelection = [];
                }

                // --- AJOUT --- : Charger collected_drawers
                if (data.collected_drawers && Array.isArray(data.collected_drawers)) {
                    currentCollectedDrawers = new Set(data.collected_drawers);
                    console.log(`État 'collecté' chargé depuis Supabase: ${currentCollectedDrawers.size} tiroirs.`);
                } else {
                    currentCollectedDrawers = new Set(); // S'assurer qu'il est vide si null/invalide
                    console.log("Aucun état 'collecté' trouvé ou invalide dans Supabase.");
                }

            } else {
                console.log("Aucun kit trouvé dans Supabase pour cet utilisateur.");
                currentKitSelection = [];
                currentCollectedDrawers = new Set(); // Assurer état vide
            }

        } catch (err) {
            console.error("Erreur JS inattendue lors du chargement du kit/collecté:", err);
            currentKitSelection = []; // Assurer un état propre
            currentCollectedDrawers = new Set(); // Assurer un état propre
            showKitFeedback("Erreur technique chargement kit/collecté.", 'error');
        } finally {
            // Mettre à jour l'UI après le chargement (même si vide)
             if (kitView.classList.contains('active-view') || inventoryView.classList.contains('active-view')) {
                // Appelle displayInventory qui utilise maintenant currentCollectedDrawers
                await refreshKitRelatedUI();
             }
        }
    }

    // --- Fonction pour supprimer/vider le kit dans Supabase (inchangée) ---
    async function clearKitInSupabase() {
         if (!currentUser || !supabase) {
             console.warn("Impossible de vider le kit en DB: Utilisateur non connecté ou Supabase non prêt.");
             return false; // Indiquer l'échec
         }
         console.log(`Suppression du kit dans Supabase pour user ${currentUser.id}...`);
         try {
             // La suppression de la ligne vide aussi collected_drawers implicitement
             const { error } = await supabase
                 .from('user_kits')
                 .delete()
                 .eq('user_id', currentUser.id); // RLS assure qu'on ne supprime que le sien

             if (error) {
                 // Gérer les erreurs potentielles, notamment RLS ou si la ligne n'existe pas (pas une vraie erreur)
                 if (error.message.includes('violates row-level security policy')) {
                     console.error("Erreur RLS : L'utilisateur n'a pas la permission de supprimer ce kit.", error);
                 } else {
                     console.error("Erreur lors de la suppression du kit dans Supabase:", error);
                 }
                 return false; // Indiquer l'échec
             } else {
                 console.log("Kit supprimé/vidé avec succès dans Supabase.");
                 return true; // Indiquer le succès
             }
         } catch (err) {
             console.error("Erreur JS inattendue lors de la suppression du kit en DB:", err);
             return false; // Indiquer l'échec
         }
     }

    // --- Helper pour afficher feedback dans la vue Kit (index.html) ---
    function showKitFeedback(message, type = 'info', duration = 3000) {
        if (!kitFeedbackDiv) return;
        kitFeedbackDiv.textContent = message;
        kitFeedbackDiv.className = `feedback-area ${type}`; // Appliquer la classe de style
        kitFeedbackDiv.style.display = 'block';
        if (duration > 0) {
            setTimeout(() => {
                 if (kitFeedbackDiv.textContent === message) { // Masquer seulement si le message n'a pas changé
                     kitFeedbackDiv.style.display = 'none';
                 }
            }, duration);
        }
    }

     // --- Helper pour rafraîchir l'UI liée au kit (tableau inventaire et vue kit) ---
     async function refreshKitRelatedUI() {
         console.log("Rafraîchissement UI liée au kit...");
         // Mettre à jour l'affichage de la vue Kit si elle est active
         if (kitView.classList.contains('active-view') && currentUser) {
             displayCurrentKitDrawers();
         }
         // Mettre à jour les coches et styles dans le tableau d'inventaire s'il est visible
         if (inventoryView.classList.contains('active-view')) {
             await displayInventory(currentInventoryPage); // Re-display pour mettre à jour coches ET styles .drawer-collected-in-bom
         }
         console.log("Fin rafraîchissement UI Kit.");
     }


    // --- Helper: Statut du Stock ---
    // ... (fonction getStockStatus inchangée) ...
    function getStockStatus(quantity, threshold) {
        if (quantity === undefined || quantity === null || isNaN(quantity)) return 'unknown';
        quantity = Number(quantity);
        threshold = (threshold === undefined || threshold === null || isNaN(threshold) || threshold < 0) ? -1 : Number(threshold);
        if (quantity <= 0) return 'critical';
        if (threshold !== -1 && quantity <= threshold) return 'warning';
        return 'ok';
    }


    // --- Helper: Créer le HTML pour l'indicateur de stock (chat) ---
    // ... (fonction createStockIndicatorHTML inchangée) ...
    function createStockIndicatorHTML(quantity, threshold) {
        const status = getStockStatus(quantity, threshold);
<<<<<<< HEAD
        const qtyText = (quantity === undefined || quantity === null) ? 'N/A' : quantity;
        const thresholdText = (threshold === undefined || threshold === null || threshold < 0) ? 'N/A' : threshold;
        return `<span class="stock-indicator-chat level-${status}" title="Stock: ${status.toUpperCase()} (Qté: ${qtyText}, Seuil: ${thresholdText})"></span>`;
=======
        return `<span class="stock-indicator-chat level-${status}" title="Stock: ${status.toUpperCase()} (Qté: ${quantity}, Seuil: ${threshold ?? 'N/A'})"></span>`;
>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99
    }


    // --- Authentification ---
<<<<<<< HEAD
    // ... (handleLogin, handleLogout inchangés) ...
=======
    // (handleLogin, handleLogout, setupAuthListener, handleUserConnected, handleUserDisconnected - Inchangé)
>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99
    async function handleLogin() {
        // ... code handleLogin inchangé ...
        if (!supabase) { loginError.textContent = "Erreur: Client Supabase non initialisé."; loginError.style.display = 'block'; return; }
        const code = loginCodeInput.value.trim().toLowerCase();
        const password = loginPasswordInput.value.trim();
        loginError.style.display = 'none';
        if (!code || !password) { loginError.textContent = "Code et mot de passe requis."; loginError.style.display = 'block'; return; }
        const email = code + FAKE_EMAIL_DOMAIN;
        loginButton.disabled = true; loginError.textContent = "Connexion..."; loginError.style.display = 'block'; loginError.style.color = 'var(--text-muted)';
        console.log("<<< STEP handleLogin - START >>>");
        console.log("   Code:", code, "Email:", email);

        try {
            console.log("   Attempting supabase.auth.signInWithPassword...");
            const { data, error } = await supabase.auth.signInWithPassword({ email: email, password: password });
            console.log("   supabase.auth.signInWithPassword returned.");

            if (error) {
                console.error("   Erreur connexion Supabase:", error.message, error);
                loginError.textContent = (error.message.includes("Invalid login credentials")) ? "Code ou mot de passe incorrect." : "Erreur de connexion.";
                loginError.style.color = 'var(--error-color)';
                loginError.style.display = 'block';
                loginCodeInput.focus();
            } else {
                console.log("   Connexion Supabase réussie (signInWithPassword success):", data.user?.email);
                loginError.style.display = 'none';
                loginCodeInput.value = '';
                loginPasswordInput.value = '';
                // Le listener onAuthStateChange prend le relais
            }
        } catch (err) {
             console.error("   Erreur JS inattendue lors de la connexion:", err);
             loginError.textContent = "Erreur inattendue lors de la connexion.";
             loginError.style.color = 'var(--error-color)';
             loginError.style.display = 'block';
        } finally {
             loginButton.disabled = false;
             console.log("<<< STEP handleLogin - END >>>");
        }
    }
    async function handleLogout() {
<<<<<<< HEAD
        // ... code handleLogout inchangé, appelle handleUserDisconnected ...
=======
>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99
        if (!supabase) { console.error("Client Supabase non initialisé lors du logout."); showGenericError("Erreur: Client non initialisé."); return; }
        console.log("Tentative de déconnexion...");
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Erreur déconnexion Supabase:", error.message, error);
            showGenericError(`Erreur lors de la déconnexion: ${error.message}. Vérifiez la console.`);
        } else {
            console.log("Déconnexion Supabase réussie.");
             updateSevenSegmentForComponent(null);
             invalidateCategoriesCache();
<<<<<<< HEAD
             // --- MODIFIÉ --- : Vider la variable locale du kit ET des tiroirs collectés lors de la déconnexion
             currentKitSelection = [];
             currentCollectedDrawers = new Set(); // <-- Vidage ici
             if (kitView?.classList.contains('active-view')) {
                 setActiveView(searchView, searchTabButton);
             }
             // handleUserDisconnected sera appelé par onAuthStateChange
        }
    }

    // --- setupAuthListener, handleUserConnected pour charger kit ET état collecté
=======
             if (kitView?.classList.contains('active-view')) {
                 setActiveView(searchView, searchTabButton);
             }
        }
    }
>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99
    async function setupAuthListener() {
        if (!supabase) { console.error("Listener Auth impossible: Supabase non initialisé."); return; }
        try {
            console.log(">>> setupAuthListener: Getting initial session...");
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            console.log(">>> setupAuthListener: getSession completed.", session ? `Initial session found for ${session.user?.email}` : "No initial session.");
             if (sessionError) {
                 console.error("Erreur critique getSession initiale:", sessionError);
             }
            activeSession = session;
            isInitialAuthCheckComplete = true;
            console.log(">>> setupAuthListener: isInitialAuthCheckComplete set to true.");

            if (session) {
                console.log("Session initiale trouvée. Traitement connexion...");
<<<<<<< HEAD
                await handleUserConnected(session.user, true); // isInitialLoad = true
            } else {
                console.log("Pas de session initiale trouvée. Traitement déconnexion...");
                handleUserDisconnected(true); // isInitialLoad = true
=======
                await handleUserConnected(session.user, true);
            } else {
                console.log("Pas de session initiale trouvée. Traitement déconnexion...");
                handleUserDisconnected(true);
>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99
            }
        } catch (error) {
            console.error("Erreur critique lors du setupAuthListener (getSession):", error);
            isInitialAuthCheckComplete = true;
            handleUserDisconnected(true);
        }

        console.log(">>> setupAuthListener: Attaching onAuthStateChange listener...");
        supabase.auth.onAuthStateChange(async (event, session) => {
             console.log(`!!! [onAuthStateChange RECEIVED] Event: ${event}, Session User: ${session?.user?.email ?? 'null'}, isInitialAuthCheckComplete: ${isInitialAuthCheckComplete}`);
             activeSession = session;
<<<<<<< HEAD

=======
             // Modification : Ne plus ignorer les événements même si isInitialAuthCheckComplete est false
             // car getSession() et onAuthStateChange peuvent arriver dans un ordre imprévisible
             // On se fie juste à l'état de 'session'
>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99
            switch (event) {
                case 'SIGNED_IN':
                    console.log("   [onAuthStateChange] SIGNED_IN detected. Calling handleUserConnected...");
                    if (session) await handleUserConnected(session.user, false);
                    else console.warn("   [onAuthStateChange] SIGNED_IN event but no session ?!");
                    break;
                case 'SIGNED_OUT':
                    console.log("   [onAuthStateChange] SIGNED_OUT detected. Calling handleUserDisconnected...");
                    handleUserDisconnected(false);
                    break;
                case 'INITIAL_SESSION':
<<<<<<< HEAD
                     console.log("   [onAuthStateChange] Initial session event received.");
                     if (session && (!currentUser || currentUser.id !== session.user.id)) {
                         console.log("   [onAuthStateChange] Correcting state based on INITIAL_SESSION: Connecting user.");
                         await handleUserConnected(session.user, true);
                     }
                     else if (!session && currentUser) {
                         console.log("   [onAuthStateChange] Correcting state based on INITIAL_SESSION: Disconnecting user.");
                         handleUserDisconnected(true);
                     } else {
                          console.log("   [onAuthStateChange] INITIAL_SESSION state matches current state.");
                     }
                    break;
                 case 'TOKEN_REFRESHED':
                    console.log("   [onAuthStateChange] Token rafraîchi.");
                    if (session && currentUser && session.user.id !== currentUser.id) {
                        console.warn("   [onAuthStateChange] TOKEN_REFRESHED with user ID mismatch! Re-handling connection...");
                        await handleUserConnected(session.user, false);
                    } else if (!session && currentUser) {
                        console.warn("   [onAuthStateChange] TOKEN_REFRESHED but session is now null! Disconnecting...");
                        handleUserDisconnected(false);
                    } else if (session && !currentUser) {
                         console.warn("   [onAuthStateChange] TOKEN_REFRESHED and session exists, but no currentUser! Handling connection...");
                         await handleUserConnected(session.user, false);
                    }
                    break;
                case 'USER_UPDATED':
                    console.log("   [onAuthStateChange] User updated.");
                    if (session) {
                         await handleUserConnected(session.user, false);
                    }
                    break;
                case 'PASSWORD_RECOVERY':
                    console.log("   [onAuthStateChange] Password recovery event.");
=======
                    // Déjà géré par getSession(), mais on log si ça arrive
                     console.log("   [onAuthStateChange] Initial session event received.");
                     if (session && !currentUser) { // S'assurer que l'utilisateur n'est pas déjà connecté par getSession
                         console.log("   [onAuthStateChange] Processing INITIAL_SESSION for connection.");
                         await handleUserConnected(session.user, true); // Traiter comme chargement initial
                     } else if (!session && currentUser) {
                         console.log("   [onAuthStateChange] Processing INITIAL_SESSION for disconnection.");
                         handleUserDisconnected(true); // Traiter comme chargement initial
                     } else {
                         console.log("   [onAuthStateChange] INITIAL_SESSION state matches current state.");
                     }
                    break;
                case 'TOKEN_REFRESHED':
                    console.log("   [onAuthStateChange] Token rafraîchi.");
                    // Pas d'action UI directe nécessaire, mais s'assurer que activeSession est à jour
                    activeSession = session;
                    break;
                case 'USER_UPDATED':
                    console.log("   [onAuthStateChange] User updated.");
                    if (session) await handleUserConnected(session.user, false); // Retraiter comme connexion
                    break;
                case 'PASSWORD_RECOVERY':
                    console.log("   [onAuthStateChange] Password recovery event.");
                    // Peut-être afficher un message à l'utilisateur
>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99
                    break;
                default:
                    console.log("   [onAuthStateChange] Événement Auth non géré:", event);
            }
             console.log(`!!! [onAuthStateChange FINISHED] Event: ${event}`);
        });
         console.log(">>> setupAuthListener: onAuthStateChange listener attached.");
<<<<<<< HEAD
=======
    }
    async function handleUserConnected(user, isInitialLoad) {
         const userChanged = !currentUser || user.id !== currentUser.id;
         currentUser = user;
         currentUserCode = currentUser.email.split('@')[0].toLowerCase();
         console.log(`Utilisateur connecté: ${currentUserCode} (ID: ${currentUser.id})${isInitialLoad ? ' [Initial]' : ''}${userChanged ? ' [Changed]' : ''}`);
         document.body.classList.add('user-logged-in');
         if(loginArea) loginArea.style.display = 'none';
         if(userInfoArea) userInfoArea.style.display = 'flex';
         if(userDisplay) userDisplay.textContent = currentUserCode.toUpperCase();
         if(loginError) loginError.style.display = 'none';
         protectedButtons.forEach(btn => {
             if (btn) {
                 const isSettingsButton = btn.id === 'show-settings-view';
                 const canAccessSettings = currentUserCode === 'zine';
                 if (isSettingsButton) {
                     btn.style.display = canAccessSettings ? 'inline-block' : 'none';
                     btn.disabled = !canAccessSettings;
                     btn.title = canAccessSettings ? '' : 'Accès réservé à l\'administrateur';
                 } else {
                     btn.style.display = 'inline-block'; btn.disabled = false; btn.title = '';
                 }
             }
         });
        const canAccessSettings = currentUserCode === 'zine';
        const activeView = document.querySelector('main.view-section.active-view');
        if (!canAccessSettings && activeView === settingsView) {
             console.log("Redirection depuis Paramètres car utilisateur non autorisé.");
             setActiveView(searchView, searchTabButton); return;
        }
         // Condition modifiée pour recharger même si l'utilisateur est le même (ex: TOKEN_REFRESHED ou USER_UPDATED)
         // et s'assurer qu'on recharge au moins une fois après la connexion initiale
         if (userChanged || isInitialLoad || !isInitialAuthCheckComplete) { // Recharge si user change, si c'est le load initial, OU si le check initial n'était pas fini
             console.log("Rechargement données/caches suite à connexion/update...");
              if (userChanged) { invalidateCategoriesCache(); handleClearKit(); if (searchView?.classList.contains('active-view')) { displayWelcomeMessage(); } }
              if(categoriesCache.length === 0) { try { await getCategories(); } catch (e) { console.error("Erreur chargement catégories:", e); } }
              const currentActiveView = activeView || document.querySelector('main.view-section.active-view');
              if (currentActiveView) { await reloadActiveViewData(currentActiveView); }
              else { setActiveView(searchView, searchTabButton); }
         } else {
            console.log("Utilisateur déjà connecté et état stable, pas de rechargement de données complet.");
         }
    }
    function handleUserDisconnected(isInitialLoad) {
         const wasConnected = !!currentUser;
         console.log(`Utilisateur déconnecté.${isInitialLoad ? ' [Initial]' : ''}`);
         currentUser = null; currentUserCode = null; activeSession = null;
         document.body.classList.remove('user-logged-in');
         if(userInfoArea) userInfoArea.style.display = 'none';
         if(loginArea) loginArea.style.display = 'flex';
         protectedButtons.forEach(btn => { if (btn) { btn.style.display = 'none'; btn.disabled = true; btn.title = 'Connexion requise'; }});
         hideQuantityModal(); updateSevenSegmentForComponent(null); handleClearKit();
         // Nettoyer les données seulement si on était connecté avant, ou au chargement initial si pas de session
         if (wasConnected || isInitialLoad) {
             console.log("Nettoyage données protégées et état...");
             invalidateCategoriesCache();
             clearProtectedViewData();
             if (searchView?.classList.contains('active-view') && chatHistory.length > 0) {
                 displayWelcomeMessage(); // Afficher message accueil si vue recherche active
             }
         }
         const activeView = document.querySelector('main.view-section.active-view');
         const isProtectedViewActive = activeView && ['log-view', 'admin-view', 'settings-view', 'audit-view', 'bom-view'].includes(activeView.id);
         if (isProtectedViewActive) {
             console.log("Redirection vers recherche car déconnecté d'une vue protégée.");
             setActiveView(searchView, searchTabButton);
         } else if (!activeView && !isInitialLoad) {
              // Si aucune vue n'est active et que ce n'est pas le chargement initial (ex: logout explicite),
              // aller à la vue recherche. Au chargement initial sans session, on attendra setActiveView(searchView) à la fin de l'init.
             console.log("Activation vue recherche par défaut après déconnexion.");
             setActiveView(searchView, searchTabButton);
         } else if (!activeView && isInitialLoad) {
             console.log("Pas de session initiale, vue recherche sera activée plus tard si besoin.");
             // setActiveView(searchView, searchTabButton); // Pas forcément nécessaire ici, handleUserConnected/Disconnected gère déjà la redirection
         }
>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99
    }
    async function handleUserConnected(user, isInitialLoad) {
         const userChanged = !currentUser || user.id !== currentUser.id;
         const previousUserCode = currentUserCode;

<<<<<<< HEAD
         currentUser = user;
         currentUserCode = currentUser.email.split('@')[0].toLowerCase();
         console.log(`Utilisateur connecté: ${currentUserCode} (ID: ${currentUser.id})${isInitialLoad ? ' [Initial]' : ''}${userChanged ? ' [Changed]' : ''}`);

         // Mise à jour UI générale (inchangée)
         document.body.classList.add('user-logged-in');
         if(loginArea) loginArea.style.display = 'none';
         if(userInfoArea) userInfoArea.style.display = 'flex';
         if(userDisplay) userDisplay.textContent = currentUserCode.toUpperCase();
         if(loginError) loginError.style.display = 'none';

         // Mise à jour des boutons protégés (inchangée)
         protectedButtons.forEach(btn => {
             // ... (logique accès boutons inchangée, y compris settings pour 'zine') ...
             if (btn) {
                 const isSettingsButton = btn.id === 'show-settings-view';
                 const canAccessSettings = currentUserCode === 'zine';
                 if (isSettingsButton) {
                     btn.style.display = canAccessSettings ? 'inline-block' : 'none';
                     btn.disabled = !canAccessSettings;
                     btn.title = canAccessSettings ? '' : 'Accès réservé à l\'administrateur';
                 } else {
                     btn.style.display = 'inline-block'; btn.disabled = false; btn.title = '';
                 }
             }
         });

         // Redirection si vue active non autorisée (inchangée)
         const canAccessSettings = currentUserCode === 'zine';
         const activeView = document.querySelector('main.view-section.active-view');
         if (!canAccessSettings && activeView === settingsView) {
             console.log("Redirection depuis Paramètres car utilisateur non autorisé.");
             await setActiveView(searchView, searchTabButton);
             return; // Important
         }

         // --- MODIFIÉ --- : Logique de chargement du kit/état collecté et rechargement des données
         if (userChanged || isInitialLoad) {
             console.log("Chargement données/caches suite à connexion/changement user...");

             // 1. Charger le kit ET l'état collecté depuis Supabase
             console.log("Tentative de chargement du kit ET état collecté depuis Supabase...");
             await loadKitFromSupabase(); // Charge currentKitSelection ET currentCollectedDrawers

             // 2. Invalider cache catégories si nécessaire (inchangé)
             if (userChanged || categoriesCache.length === 0) {
                 invalidateCategoriesCache();
                 if(categoriesCache.length === 0) { try { await getCategories(); } catch (e) { console.error("Erreur chargement catégories:", e); } }
             }

             // 3. Afficher message de bienvenue si l'utilisateur a changé et on est sur la vue recherche (inchangé)
             if (userChanged && !isInitialLoad && searchView?.classList.contains('active-view')) {
                 displayWelcomeMessage();
             }

             // 4. Recharger les données de la vue active
             const currentActiveView = activeView || document.querySelector('main.view-section.active-view');
             if (currentActiveView) {
                 await reloadActiveViewData(currentActiveView); // Met à jour l'UI, y compris les styles .drawer-collected-in-bom
             } else {
                 console.log("Aucune vue active trouvée, activation de la vue Recherche par défaut.");
                 await setActiveView(searchView, searchTabButton);
             }
         } else {
            console.log("Utilisateur déjà connecté et état stable, pas de rechargement de données complet.");
            // On rafraîchit quand même l'UI kit/inventaire pour refléter l'état collecté chargé
             await refreshKitRelatedUI();
         }
    }
    function handleUserDisconnected(isInitialLoad) {
         const wasConnected = !!currentUser;
         console.log(`Utilisateur déconnecté.${isInitialLoad ? ' [Initial]' : ''}`);

         // Réinitialiser état utilisateur et UI (inchangé)
         currentUser = null; currentUserCode = null; activeSession = null;
         document.body.classList.remove('user-logged-in');
         if(userInfoArea) userInfoArea.style.display = 'none';
         if(loginArea) loginArea.style.display = 'flex';
         protectedButtons.forEach(btn => { if (btn) { btn.style.display = 'none'; btn.disabled = true; btn.title = 'Connexion requise'; }});
         hideQuantityModal(); updateSevenSegmentForComponent(null);

         // --- MODIFIÉ --- : Vider la variable kit locale ET l'état collecté lors de la déconnexion
         currentKitSelection = [];
         currentCollectedDrawers = new Set(); // <-- Vidage ici

         // Nettoyage données et caches si nécessaire (inchangé)
         if (wasConnected || isInitialLoad) {
             console.log("Nettoyage données protégées et état...");
             invalidateCategoriesCache();
             clearProtectedViewData(); // Nettoie les affichages (log, admin, audit, etc.)
             if (searchView?.classList.contains('active-view') && chatHistory.length > 0) {
                 displayWelcomeMessage(); // Réinitialise le chat si vue active
             }
         }

         // Gestion de la vue active (inchangé)
         const activeView = document.querySelector('main.view-section.active-view');
         const isProtectedViewId = activeView && ['log-view', 'admin-view', 'settings-view', 'audit-view', 'bom-view'].includes(activeView.id);

         if (isProtectedViewActive) {
             console.log("Redirection vers recherche car déconnecté d'une vue protégée.");
             setActiveView(searchView, searchTabButton);
         } else if (!activeView && isInitialLoad) {
             console.log("Pas de session initiale, activation vue recherche par défaut.");
             setActiveView(searchView, searchTabButton);
         } else if (activeView?.id === 'inventory-view') {
              // Si on était sur l'inventaire, recharger pour masquer coches/tiroirs et styles collectés
              setActiveView(inventoryView, inventoryTabButton);
         } else if (!activeView && !isInitialLoad) {
             console.log("Activation vue recherche par défaut après déconnexion.");
             setActiveView(searchView, searchTabButton);
         }
    }


    // --- Mise à jour UI/État pour Authentification ---
    // ... (reloadActiveViewData, showGenericError, clearProtectedViewData, setActiveView inchangés) ...
    async function reloadActiveViewData(viewElement) {
        if (!viewElement) return;
         const viewId = viewElement.id;
         const canAccessSettings = currentUser && currentUserCode === 'zine';
         console.log(`Reloading data for active view: ${viewId}`);
         try {
             switch(viewId) {
                case 'inventory-view':
                    if (categoriesCache.length === 0 && currentUser) await getCategories();
                    await populateInventoryFilters();
                    // displayInventory utilisera currentCollectedDrawers pour le style
                    await displayInventory(currentInventoryPage);
                    break;
                case 'log-view': if (currentUser) await displayLog(currentLogPage); break;
                case 'admin-view': if (currentUser) await loadAdminData(); break;
                case 'settings-view': if (canAccessSettings) loadSettingsData(); break;
                case 'audit-view': if (currentUser) { await populateAuditFilters(); await displayAudit(); } break;
                case 'bom-view': // Vue Kit
                    if (currentUser) displayCurrentKitDrawers();
                    else currentKitDrawersDiv.innerHTML = '<p><i>Connectez-vous pour voir le kit.</i></p>';
                     break;
                case 'search-view': if (chatHistory.length === 0) displayWelcomeMessage(); break;
             }
         } catch (error) { console.error(`Erreur rechargement ${viewId}:`, error); showGenericError(`Erreur chargement ${viewId}. Détails: ${error.message}`); }
    }
    function showGenericError(message) {
        // ... code inchangé ...
         if (genericFeedbackDiv) { genericFeedbackDiv.textContent = `Erreur: ${message}`; genericFeedbackDiv.className = 'feedback-area error'; genericFeedbackDiv.style.display = 'block'; }
        else { console.error("Erreur (genericFeedbackDiv manquant):", message); const activeFeedback = document.querySelector('.feedback-area:not(#login-error)'); if (activeFeedback) { activeFeedback.textContent = `Erreur: ${message}`; activeFeedback.className = 'feedback-area error'; activeFeedback.style.display = 'block'; } else { alert(`Erreur: ${message}`); } }
    }
    function clearProtectedViewData() {
        // ... code inchangé ...
         if(logTableBody) logTableBody.innerHTML = ''; if(logNoResults) logNoResults.style.display = 'none'; if(logPrevPageButton) logPrevPageButton.disabled = true; if(logNextPageButton) logNextPageButton.disabled = true; if(logPageInfo) logPageInfo.textContent = 'Page 1 / 1'; currentLogPage = 1;
        if(categoryList) categoryList.innerHTML = ''; if(categoryForm) categoryForm.reset(); resetCategoryForm(); if(stockForm) stockForm.reset(); resetStockForm(); if(adminFeedbackDiv) { adminFeedbackDiv.style.display = 'none'; adminFeedbackDiv.textContent = ''; }
        if(exportFeedbackDiv) { exportFeedbackDiv.style.display = 'none'; exportFeedbackDiv.textContent = ''; } if(importFeedbackDiv) { importFeedbackDiv.style.display = 'none'; importFeedbackDiv.textContent = ''; } resetImportState();
        if (auditCategoryFilter) { auditCategoryFilter.innerHTML = '<option value="all">Toutes</option>'; auditCategoryFilter.value = 'all'; } if (auditDrawerFilter) auditDrawerFilter.value = ''; if (auditTableBody) auditTableBody.innerHTML = ''; if (auditNoResults) auditNoResults.style.display = 'none'; if (auditFeedbackDiv) { auditFeedbackDiv.style.display = 'none'; auditFeedbackDiv.textContent = ''; auditFeedbackDiv.className = 'feedback-area';}
        // Vider aussi la vue kit (index.html)
        if(currentKitDrawersDiv) currentKitDrawersDiv.innerHTML = '<p><i>Kit vidé ou non disponible.</i></p>';
=======
    // --- Mise à jour UI/État pour Authentification ---
    // (reloadActiveViewData, showGenericError, clearProtectedViewData, setActiveView - Inchangé)
    async function reloadActiveViewData(viewElement) {
        if (!viewElement) return;
         const viewId = viewElement.id;
         const canAccessSettings = currentUser && currentUserCode === 'zine'; // Vérifier currentUser existe
         console.log(`Reloading data for active view: ${viewId}`);
         try {
             switch(viewId) {
                case 'inventory-view':
                    // S'assurer que les catégories sont chargées *avant* d'afficher l'inventaire
                    if (categoriesCache.length === 0 && currentUser) await getCategories();
                    await populateInventoryFilters(); // Popule aussi les filtres attributs
                    await displayInventory(currentInventoryPage);
                    break;
                case 'log-view': if (currentUser) await displayLog(currentLogPage); break;
                case 'admin-view': if (currentUser) await loadAdminData(); break;
                case 'settings-view': if (canAccessSettings) loadSettingsData(); break;
                case 'audit-view': if (currentUser) { await populateAuditFilters(); await displayAudit(); } break;
                case 'bom-view': if (currentUser) displayCurrentKitDrawers(); break;
                case 'search-view': if (chatHistory.length === 0) displayWelcomeMessage(); break;
             }
         } catch (error) { console.error(`Erreur rechargement ${viewId}:`, error); showGenericError(`Erreur chargement ${viewId}. Détails: ${error.message}`); }
    }
    function showGenericError(message) {
        if (genericFeedbackDiv) { genericFeedbackDiv.textContent = `Erreur: ${message}`; genericFeedbackDiv.className = 'feedback-area error'; genericFeedbackDiv.style.display = 'block'; }
        else { console.error("Erreur (genericFeedbackDiv manquant):", message); const activeFeedback = document.querySelector('.feedback-area:not(#login-error)'); if (activeFeedback) { activeFeedback.textContent = `Erreur: ${message}`; activeFeedback.className = 'feedback-area error'; activeFeedback.style.display = 'block'; } else { alert(`Erreur: ${message}`); } }
    }
    function clearProtectedViewData() {
        if(logTableBody) logTableBody.innerHTML = ''; if(logNoResults) logNoResults.style.display = 'none'; if(logPrevPageButton) logPrevPageButton.disabled = true; if(logNextPageButton) logNextPageButton.disabled = true; if(logPageInfo) logPageInfo.textContent = 'Page 1 / 1'; currentLogPage = 1;
        if(categoryList) categoryList.innerHTML = ''; if(categoryForm) categoryForm.reset(); resetCategoryForm(); if(stockForm) stockForm.reset(); resetStockForm(); if(adminFeedbackDiv) { adminFeedbackDiv.style.display = 'none'; adminFeedbackDiv.textContent = ''; }
        if(exportFeedbackDiv) { exportFeedbackDiv.style.display = 'none'; exportFeedbackDiv.textContent = ''; } if(importFeedbackDiv) { importFeedbackDiv.style.display = 'none'; importFeedbackDiv.textContent = ''; } resetImportState();
        if (auditCategoryFilter) { auditCategoryFilter.innerHTML = '<option value="all">Toutes</option>'; auditCategoryFilter.value = 'all'; } if (auditDrawerFilter) auditDrawerFilter.value = ''; if (auditTableBody) auditTableBody.innerHTML = ''; if (auditNoResults) auditNoResults.style.display = 'none'; if (auditFeedbackDiv) { auditFeedbackDiv.style.display = 'none'; auditFeedbackDiv.textContent = ''; auditFeedbackDiv.className = 'feedback-area';}
>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99
        if (kitFeedbackDiv) { kitFeedbackDiv.style.display = 'none'; kitFeedbackDiv.textContent = ''; kitFeedbackDiv.className = 'feedback-area'; }
        console.log("Données des vues protégées effacées.");
    }
    async function setActiveView(viewToShow, buttonToActivate){
<<<<<<< HEAD
        // ... code inchangé ...
=======
>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99
        if (!viewToShow || !viewSections.length || ![...viewSections].includes(viewToShow)) {
            console.warn("setActiveView: Vue invalide demandée, retour à la recherche.");
            viewToShow = searchView;
            buttonToActivate = searchTabButton;
        }
<<<<<<< HEAD
        if (viewToShow.classList.contains('active-view')) {
             console.log(`Vue ${viewToShow.id} déjà active.`);
             return;
        }
        const canAccessSettings = currentUser && currentUserCode === 'zine';
        const isSettingsView = viewToShow === settingsView;
        const isProtectedViewId = ['log-view', 'admin-view', 'audit-view', 'bom-view', 'settings-view'].includes(viewToShow.id);

        if (isProtectedViewId && !currentUser) {
            console.warn(`Accès refusé: La vue "${viewToShow.id}" nécessite une connexion.`);
            if (loginError) { loginError.textContent = "Connexion requise pour accéder à cette section."; loginError.style.color = 'var(--error-color)'; loginError.style.display = 'block'; }
            loginCodeInput?.focus();
            return;
        }
        if (isSettingsView && !canAccessSettings) {
            console.warn(`Accès refusé: La vue Paramètres est réservée à 'zine'. User: ${currentUserCode}`);
            showGenericError("Accès à la vue Paramètres réservé à l'administrateur.");
            return;
        }

        viewSections.forEach(section => { section.style.display = 'none'; section.classList.remove('active-view'); });
        document.querySelectorAll('.nav-button').forEach(button => { button.classList.remove('active'); });
        viewToShow.style.display = 'block';
        viewToShow.classList.add('active-view');
        if (buttonToActivate) { buttonToActivate.classList.add('active'); }
        else { const matchingButton = document.getElementById(`show-${viewToShow.id}`); if (matchingButton) matchingButton.classList.add('active'); }
        console.log(`Activation vue: ${viewToShow.id}`);
=======

        const canAccessSettings = currentUser && currentUserCode === 'zine';
        const isSettingsView = viewToShow === settingsView;
        const isProtectedViewId = ['log-view', 'admin-view', 'audit-view', 'bom-view', 'settings-view'].includes(viewToShow.id);

        // Vérification d'accès pour les vues protégées
        if (isProtectedViewId && !currentUser) {
            console.warn(`Accès refusé: La vue "${viewToShow.id}" nécessite une connexion.`);
            if (loginError) {
                loginError.textContent = "Connexion requise pour accéder à cette section.";
                loginError.style.color = 'var(--error-color)';
                loginError.style.display = 'block';
            }
            loginCodeInput?.focus();
            // Empêcher le changement de vue
            return;
        }

        // Vérification d'accès spécifique pour la vue Paramètres
        if (isSettingsView && !canAccessSettings) {
            console.warn(`Accès refusé: La vue Paramètres est réservée à 'zine'. User: ${currentUserCode}`);
            showGenericError("Accès à la vue Paramètres réservé à l'administrateur.");
            // Empêcher le changement de vue
            return;
        }

        // Cacher toutes les sections et désactiver tous les boutons de nav
        viewSections.forEach(section => {
            section.style.display = 'none';
            section.classList.remove('active-view');
        });
        document.querySelectorAll('.nav-button').forEach(button => {
            button.classList.remove('active');
        });

        // Afficher la section demandée et activer le bouton correspondant
        viewToShow.style.display = 'block';
        viewToShow.classList.add('active-view');
        if (buttonToActivate) {
            buttonToActivate.classList.add('active');
        } else {
            // Essayer de trouver le bouton par ID si non fourni
            const matchingButton = document.getElementById(`show-${viewToShow.id}`);
            if (matchingButton) {
                matchingButton.classList.add('active');
            }
        }

        console.log(`Activation vue: ${viewToShow.id}`);

        // Recharger les données pour la nouvelle vue active
        // S'assurer que reloadActiveViewData est appelé APRES que la vue soit visible
>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99
        await reloadActiveViewData(viewToShow);
    }


    // --- LOGIQUE INVENTAIRE ---
<<<<<<< HEAD
    // ... (updateAttributeFiltersUI, getUniqueAttributeValues, escapeHtml, populateInventoryFilters inchangés) ...
     async function updateAttributeFiltersUI() {
         // ... code inchangé ...
=======
    // (updateAttributeFiltersUI, getUniqueAttributeValues, escapeHtml, populateInventoryFilters - Inchangé)
    async function updateAttributeFiltersUI() {
>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99
        if (!attributeFiltersContainer || !inventoryCategoryFilter) return;
        const selectedCategoryId = inventoryCategoryFilter.value;
        attributeFiltersContainer.innerHTML = ''; // Clear previous filters

        console.log("--- updateAttributeFiltersUI ---");
        console.log("Selected Category ID:", selectedCategoryId);

        if (selectedCategoryId === 'all' || categoriesCache.length === 0) {
            attributeFiltersContainer.innerHTML = '<i>Sélectionnez une catégorie pour voir les filtres spécifiques.</i>';
            return;
        }

        const category = categoriesCache.find(cat => String(cat.id) == String(selectedCategoryId)); // Comparaison string/string
        console.log("Found Category Object:", category);

        if (!category || !category.attributes || !Array.isArray(category.attributes) || category.attributes.length === 0) {
             attributeFiltersContainer.innerHTML = '<i>Aucun attribut spécifique défini pour cette catégorie.</i>';
             return;
        }
        console.log("Category Attributes to process:", category.attributes);

<<<<<<< HEAD
        try {
            const attributes = category.attributes;
             attributeFiltersContainer.innerHTML = '<i>Chargement des filtres...</i>';
             let filtersAdded = 0; // Compteur pour savoir si on a ajouté des filtres

            for (const attr of attributes) {
                if (!attr || typeof attr !== 'string' || attr.trim() === '') continue;
                console.log(`Processing Attribute: "${attr}"`);

                try {
                    console.log(`Calling getUniqueAttributeValues for category ${selectedCategoryId} and attribute "${attr}"...`);
                    // Assurer que categoryId est bien une string pour l'appel RPC
                    const uniqueValues = await getUniqueAttributeValues(String(selectedCategoryId), attr);
                    console.log(`Result for "${attr}":`, uniqueValues);

                    if (uniqueValues && uniqueValues.length > 0) {
                        // Déduplication case-insensitive
                        const lowerCaseValues = uniqueValues.map(val => String(val).toLowerCase());
                        const uniqueLowerCaseValues = [...new Set(lowerCaseValues)];

                        if (uniqueLowerCaseValues.length > 0) {
                            if (filtersAdded === 0) {
                                attributeFiltersContainer.innerHTML = '';
                            }
                            filtersAdded++;

                            const formGroup = document.createElement('div');
                            formGroup.className = 'form-group';

                            const label = document.createElement('label');
                            label.htmlFor = `attr-filter-${attr}`;
                            label.textContent = `${attr}:`;
                            label.title = attr;

                            const select = document.createElement('select');
                            select.id = `attr-filter-${attr}`;
                            select.dataset.attributeName = attr; // Stocker le nom original (avec casse)

                            const allOption = document.createElement('option');
                            allOption.value = 'all';
                            allOption.textContent = 'Tous';
                            select.appendChild(allOption);

                            // Trier et ajouter les options uniques (en minuscules pour la valeur)
                            uniqueLowerCaseValues.sort().forEach(value => {
                                const option = document.createElement('option');
                                option.value = value; // Valeur en minuscules
                                option.textContent = value; // Affichage en minuscules aussi (pour cohérence)
                                select.appendChild(option);
                            });

                            formGroup.appendChild(label);
                            formGroup.appendChild(select);
                            attributeFiltersContainer.appendChild(formGroup);
                            console.log(`   -> Filter dropdown for "${attr}" added to DOM (options: ${uniqueLowerCaseValues.length}).`);
                        } else {
                             console.log(`   -> No unique values after case-insensitive deduplication for "${attr}".`);
                        }
                    } else {
                        console.log(`   -> No unique values found or returned for "${attr}".`);
                    }
                } catch (rpcError) {
                    console.error(`   -> Error calling RPC for attribute "${attr}":`, rpcError);
                }
            } // fin boucle for

            if (filtersAdded === 0) {
                 if(attributeFiltersContainer.innerHTML === '<i>Chargement des filtres...</i>' || attributeFiltersContainer.innerHTML === ''){
                     attributeFiltersContainer.innerHTML = '<i>Aucun filtre applicable basé sur les données actuelles.</i>';
                 }
                 console.log("Finished loop, no filters were added.");
            } else {
                 console.log(`Finished loop, ${filtersAdded} filters were added.`);
            }

        } catch (error) {
            console.error(`Error during attribute filter creation for ${category?.name}:`, error);
            attributeFiltersContainer.innerHTML = `<i style="color: var(--error-color);">Erreur chargement filtres.</i>`;
        }
        console.log("--- updateAttributeFiltersUI END ---");
    }
    async function getUniqueAttributeValues(categoryId, attributeName) {
        // ... code inchangé ...
         // categoryId doit être une string (UUID) pour la RPC
        if (!supabase || !categoryId || !attributeName) return [];
        try {
             console.log(`RPC call: get_unique_attribute_values for category (string UUID) ${categoryId}, attribute '${attributeName}'`);
             const { data, error } = await supabase.rpc('get_unique_attribute_values', {
                 category_id_param: categoryId, // Le nom doit correspondre exactement au param SQL
                 attribute_key_param: attributeName // Le nom doit correspondre exactement au param SQL
             });
             if (error) { console.error(`Erreur RPC get_unique_attribute_values pour '${attributeName}': ${error.message || error.details || JSON.stringify(error)}`); return []; }
             console.log(`RPC result for '${attributeName}':`, data);
             const resultData = data && Array.isArray(data) ? data : [];
             return resultData.filter(val => val !== null && val !== undefined);
        } catch (err) { console.error(`Erreur JS récupération valeurs uniques pour ${attributeName}:`, err); return []; }
    }
    function escapeHtml(unsafe) {
        // ... code inchangé ...
        if (typeof unsafe !== 'string') return unsafe;
        return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }
    async function populateInventoryFilters() {
        // ... code inchangé ...
         if (!inventoryCategoryFilter) return;
        try {
             const currentCategoryValue = inventoryCategoryFilter.value;
             inventoryCategoryFilter.innerHTML = '<option value="all">Toutes</option>';
             if (categoriesCache.length === 0 && currentUser) await getCategories();

             categoriesCache.sort((a, b) => a.name.localeCompare(b.name)).forEach(cat => {
                 const option = document.createElement('option');
                 option.value = cat.id; // Utiliser l'ID (UUID string)
                 option.textContent = escapeHtml(cat.name);
                 inventoryCategoryFilter.appendChild(option);
             });
             if (categoriesCache.some(cat => String(cat.id) === String(currentCategoryValue))) {
                 inventoryCategoryFilter.value = currentCategoryValue;
             } else {
                 inventoryCategoryFilter.value = 'all';
             }
             await updateAttributeFiltersUI();
         } catch (err) {
             console.error("Erreur population filtres inventaire:", err);
             if (inventoryCategoryFilter) inventoryCategoryFilter.innerHTML = '<option value="all" disabled>Erreur chargement</option>';
             if (attributeFiltersContainer) attributeFiltersContainer.innerHTML = '<i style="color: var(--error-color);">Erreur chargement catégories.</i>';
         }
    }
    // --- MODIFIÉ --- : displayInventory pour ajouter la classe CSS si tiroir collecté
=======
        try {
            const attributes = category.attributes;
             attributeFiltersContainer.innerHTML = '<i>Chargement des filtres...</i>';
             let filtersAdded = 0; // Compteur pour savoir si on a ajouté des filtres

            for (const attr of attributes) {
                if (!attr || typeof attr !== 'string' || attr.trim() === '') continue;
                console.log(`Processing Attribute: "${attr}"`);

                try {
                    console.log(`Calling getUniqueAttributeValues for category ${selectedCategoryId} and attribute "${attr}"...`);
                    // Assurer que categoryId est bien une string pour l'appel RPC
                    const uniqueValues = await getUniqueAttributeValues(String(selectedCategoryId), attr);
                    console.log(`Result for "${attr}":`, uniqueValues);

                    if (uniqueValues && uniqueValues.length > 0) {
                        // Déduplication case-insensitive
                        const lowerCaseValues = uniqueValues.map(val => String(val).toLowerCase());
                        const uniqueLowerCaseValues = [...new Set(lowerCaseValues)];

                        if (uniqueLowerCaseValues.length > 0) {
                            if (filtersAdded === 0) {
                                attributeFiltersContainer.innerHTML = '';
                            }
                            filtersAdded++;

                            const formGroup = document.createElement('div');
                            formGroup.className = 'form-group';

                            const label = document.createElement('label');
                            label.htmlFor = `attr-filter-${attr}`;
                            label.textContent = `${attr}:`;
                            label.title = attr;

                            const select = document.createElement('select');
                            select.id = `attr-filter-${attr}`;
                            select.dataset.attributeName = attr; // Stocker le nom original (avec casse)

                            const allOption = document.createElement('option');
                            allOption.value = 'all';
                            allOption.textContent = 'Tous';
                            select.appendChild(allOption);

                            // Trier et ajouter les options uniques (en minuscules pour la valeur)
                            uniqueLowerCaseValues.sort().forEach(value => {
                                const option = document.createElement('option');
                                option.value = value; // Valeur en minuscules
                                option.textContent = value; // Affichage en minuscules aussi (pour cohérence)
                                select.appendChild(option);
                            });

                            formGroup.appendChild(label);
                            formGroup.appendChild(select);
                            attributeFiltersContainer.appendChild(formGroup);
                            console.log(`   -> Filter dropdown for "${attr}" added to DOM (options: ${uniqueLowerCaseValues.length}).`);
                        } else {
                             console.log(`   -> No unique values after case-insensitive deduplication for "${attr}".`);
                        }
                    } else {
                        console.log(`   -> No unique values found or returned for "${attr}".`);
                    }
                } catch (rpcError) {
                    console.error(`   -> Error calling RPC for attribute "${attr}":`, rpcError);
                    // Afficher une info d'erreur pour ce filtre spécifique ?
                }
            } // fin boucle for

            if (filtersAdded === 0) {
                 if(attributeFiltersContainer.innerHTML === '<i>Chargement des filtres...</i>' || attributeFiltersContainer.innerHTML === ''){
                     attributeFiltersContainer.innerHTML = '<i>Aucun filtre applicable basé sur les données actuelles.</i>';
                 }
                 console.log("Finished loop, no filters were added.");
            } else {
                 console.log(`Finished loop, ${filtersAdded} filters were added.`);
            }

        } catch (error) {
            console.error(`Error during attribute filter creation for ${category?.name}:`, error);
            attributeFiltersContainer.innerHTML = `<i style="color: var(--error-color);">Erreur chargement filtres.</i>`;
        }
        console.log("--- updateAttributeFiltersUI END ---");
    }
    async function getUniqueAttributeValues(categoryId, attributeName) {
        // categoryId doit être une string (UUID) pour la RPC
        if (!supabase || !categoryId || !attributeName) return [];
        try {
             console.log(`RPC call: get_unique_attribute_values for category (string UUID) ${categoryId}, attribute '${attributeName}'`);
             const { data, error } = await supabase.rpc('get_unique_attribute_values', {
                 category_id_param: categoryId, // Le nom doit correspondre exactement au param SQL
                 attribute_key_param: attributeName // Le nom doit correspondre exactement au param SQL
             });
             if (error) { console.error(`Erreur RPC get_unique_attribute_values pour '${attributeName}': ${error.message || error.details || JSON.stringify(error)}`); return []; }
             console.log(`RPC result for '${attributeName}':`, data);
             // La RPC retourne déjà un array de strings distinctes (ou null)
             const resultData = data && Array.isArray(data) ? data : [];
             // Filtrer les null potentiels dans le résultat si la clé n'existe pas pour certains items
             return resultData.filter(val => val !== null && val !== undefined);
        } catch (err) { console.error(`Erreur JS récupération valeurs uniques pour ${attributeName}:`, err); return []; }
    }
    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return unsafe;
        return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }
    async function populateInventoryFilters() {
        if (!inventoryCategoryFilter) return;
        try {
             const currentCategoryValue = inventoryCategoryFilter.value;
             inventoryCategoryFilter.innerHTML = '<option value="all">Toutes</option>';
             // S'assurer que les catégories sont chargées
             if (categoriesCache.length === 0 && currentUser) await getCategories();

             categoriesCache.sort((a, b) => a.name.localeCompare(b.name)).forEach(cat => {
                 const option = document.createElement('option');
                 option.value = cat.id; // Utiliser l'ID (UUID string)
                 option.textContent = escapeHtml(cat.name);
                 inventoryCategoryFilter.appendChild(option);
             });
             // Restaurer la sélection précédente si elle existe toujours
             if (categoriesCache.some(cat => String(cat.id) === String(currentCategoryValue))) {
                 inventoryCategoryFilter.value = currentCategoryValue;
             } else {
                 inventoryCategoryFilter.value = 'all'; // Sinon, revenir à "Toutes"
             }
             // Mettre à jour les filtres d'attributs après population/sélection catégorie
             await updateAttributeFiltersUI();
         } catch (err) {
             console.error("Erreur population filtres inventaire:", err);
             if (inventoryCategoryFilter) inventoryCategoryFilter.innerHTML = '<option value="all" disabled>Erreur chargement</option>';
             if (attributeFiltersContainer) attributeFiltersContainer.innerHTML = '<i style="color: var(--error-color);">Erreur chargement catégories.</i>';
         }
    }

    // --- MODIFIED: displayInventory using RPC ---
>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99
    async function displayInventory(page = 1) {
        currentInventoryPage = page;
        if (!inventoryTableBody || !supabase || !attributeFiltersContainer) {
            console.warn("displayInventory: Prérequis manquants (DOM, Supabase).");
            if(inventoryTableBody) inventoryTableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">Erreur interne ou DOM manquant.</td></tr>`;
            return;
        }

<<<<<<< HEAD
=======
        // --- Réinitialisation UI ---
>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99
        inventoryTableBody.innerHTML = `<tr class="loading-row"><td colspan="8" style="text-align:center;"><i>Chargement...</i></td></tr>`;
        if(inventoryNoResults) inventoryNoResults.style.display = 'none';
        if(inventoryPrevPageButton) inventoryPrevPageButton.disabled = true;
        if(inventoryNextPageButton) inventoryNextPageButton.disabled = true;
        if(inventoryPageInfo) inventoryPageInfo.textContent = 'Chargement...';

        try {
<<<<<<< HEAD
            // Récupération des filtres (inchangée)
            const categoryValue = inventoryCategoryFilter?.value || 'all';
            const categoryIdToSend = categoryValue === 'all' ? null : categoryValue;
            const searchValue = inventorySearchFilter?.value.trim() || '';
            const searchTermToSend = searchValue || null;
            const attributeFiltersToSend = {};
            attributeFiltersContainer.querySelectorAll('select').forEach(selectElement => {
                const attributeName = selectElement.dataset.attributeName;
                const selectedValue = selectElement.value;
                if (attributeName && selectedValue !== 'all') {
                    attributeFiltersToSend[attributeName] = selectedValue;
                }
            });
=======
            // --- 1. Collecter les paramètres pour la RPC ---
            const categoryValue = inventoryCategoryFilter?.value || 'all';
            const categoryIdToSend = categoryValue === 'all' ? null : categoryValue; // Envoyer null si "Toutes"

            const searchValue = inventorySearchFilter?.value.trim() || '';
            const searchTermToSend = searchValue || null; // Envoyer null si vide

            const attributeFiltersToSend = {};
            attributeFiltersContainer.querySelectorAll('select').forEach(selectElement => {
                const attributeName = selectElement.dataset.attributeName; // Nom original de l'attribut
                const selectedValue = selectElement.value; // Valeur sélectionnée (en minuscules)

                if (attributeName && selectedValue !== 'all') {
                    // La RPC s'attend à {"Nom Attribut": "valeur sélectionnée"}
                    attributeFiltersToSend[attributeName] = selectedValue;
                }
            });
            // Envoyer null si aucun filtre d'attribut n'est actif
>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99
            const finalAttributeFilters = Object.keys(attributeFiltersToSend).length > 0 ? attributeFiltersToSend : null;

            console.log("Calling RPC search_inventory with params:", {
                p_category_id: categoryIdToSend,
                p_search_term: searchTermToSend,
                p_attribute_filters: finalAttributeFilters,
<<<<<<< HEAD
                p_page: currentInventoryPage,
                p_items_per_page: ITEMS_PER_PAGE
            });

            // Appel RPC (inchangé)
=======
                p_page: currentInventoryPage, // Utiliser la page actuelle
                p_items_per_page: ITEMS_PER_PAGE
            });

            // --- 2. Appeler la fonction RPC ---
>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99
            const { data, error } = await supabase.rpc('search_inventory', {
                p_category_id: categoryIdToSend,
                p_search_term: searchTermToSend,
                p_attribute_filters: finalAttributeFilters,
                p_page: currentInventoryPage,
                p_items_per_page: ITEMS_PER_PAGE
            });

<<<<<<< HEAD
            inventoryTableBody.innerHTML = '';

            if (error) {
                throw new Error(`Erreur RPC search_inventory: ${error.message} (Code: ${error.code}, Details: ${error.details})`);
            }

            const totalItems = (data && data.length > 0) ? data[0].total_count : 0;
            const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
            console.log(`RPC returned ${data?.length || 0} items for page ${currentInventoryPage}. Total items matching filters: ${totalItems}`);

            if (totalItems === 0) {
                // Gestion aucun résultat (inchangée)
                if(inventoryNoResults) {
                    inventoryNoResults.textContent = `Aucun composant trouvé pour les filtres sélectionnés.`;
                    inventoryTableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 20px;">${inventoryNoResults.textContent}</td></tr>`;
                    inventoryNoResults.style.display = 'none';
=======
            // --- 3. Gérer la réponse ---
            inventoryTableBody.innerHTML = ''; // Vider le message de chargement

            if (error) {
                // Afficher l'erreur spécifique de la RPC
                throw new Error(`Erreur RPC search_inventory: ${error.message} (Code: ${error.code}, Details: ${error.details})`);
            }

            // --- 4. Traiter les données et mettre à jour l'UI ---
            // La RPC retourne un tableau `data`. Chaque objet dans `data` a une propriété `total_count`.
            const totalItems = (data && data.length > 0) ? data[0].total_count : 0;
            const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

            console.log(`RPC returned ${data?.length || 0} items for page ${currentInventoryPage}. Total items matching filters: ${totalItems}`);

            if (totalItems === 0) {
                // Affichage "aucun résultat"
                if(inventoryNoResults) {
                    inventoryNoResults.textContent = `Aucun composant trouvé pour les filtres sélectionnés.`;
                    // Afficher le message dans le corps du tableau pour une meilleure visibilité
                    inventoryTableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 20px;">${inventoryNoResults.textContent}</td></tr>`;
                    inventoryNoResults.style.display = 'none'; // Cacher le <p> séparé
>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99
                }
                if(inventoryPageInfo) inventoryPageInfo.textContent = 'Page 0 / 0';
                if(inventoryPrevPageButton) inventoryPrevPageButton.disabled = true;
                if(inventoryNextPageButton) inventoryNextPageButton.disabled = true;
            } else {
<<<<<<< HEAD
                 if(inventoryNoResults) inventoryNoResults.style.display = 'none';
                 data.forEach(item => {
                    const row = inventoryTableBody.insertRow();
                    row.dataset.ref = item.ref;
                    // Stocker les données complètes pour la modale et l'ajout au kit
                    row.dataset.itemData = JSON.stringify(item);
                    row.classList.add('inventory-item-row');

                    // --- MODIFIÉ --- : Vérifier si l'item est dans le kit LOCAL
                    const isSelected = currentUser && currentKitSelection.some(kitItem => kitItem.ref === item.ref);
                    if (isSelected) {
                        row.classList.add('kit-selected');
                    }

                    // --- AJOUT --- : Vérifier si le tiroir est dans la liste des collectés et ajouter la classe
                    const drawerKey = item.drawer?.trim().toUpperCase();
                    if (currentUser && drawerKey && currentCollectedDrawers.has(drawerKey)) {
                        row.classList.add('drawer-collected-in-bom');
                        console.log(`   -> Tiroir ${drawerKey} (pour ${item.ref}) est marqué comme collecté.`);
                    }

                    // Cellule Sélection (Checkbox)
                    const selectCell = row.insertCell(); selectCell.classList.add('col-select');
                    // Afficher checkbox seulement si user connecté ET quantité > 0
                    if (currentUser && item.quantity > 0) {
                        const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.classList.add('kit-select-checkbox'); checkbox.dataset.ref = item.ref; checkbox.title = `Ajouter/Retirer ${item.ref} au kit`;
                        checkbox.checked = isSelected; // Cocher si déjà sélectionné
                        selectCell.appendChild(checkbox);
                    } else if (currentUser && item.quantity <= 0) {
                        // Si connecté mais qté=0, indiquer pourquoi pas de checkbox
                        selectCell.innerHTML = '<span title="Stock épuisé" style="cursor:default; color: var(--text-muted); font-size:0.8em;">N/A</span>';
                    } else {
                        // Si non connecté, cellule vide
                         selectCell.innerHTML = '&nbsp;';
                    }

                    // Remplissage des autres cellules (inchangé)
                    const refCell = row.insertCell(); const status = getStockStatus(item.quantity, item.critical_threshold); const indicatorSpan = document.createElement('span'); indicatorSpan.classList.add('stock-indicator', `level-${status}`); indicatorSpan.title = `Stock: ${status.toUpperCase()} (Qté: ${item.quantity}, Seuil: ${item.critical_threshold ?? 'N/A'})`; refCell.appendChild(indicatorSpan); refCell.appendChild(document.createTextNode(" " + (item.ref || 'N/A')));
                    row.insertCell().textContent = item.description || '-';
                    row.insertCell().textContent = item.category_name || 'N/A';
                    const typeAttribute = item.attributes?.Type || '-'; row.insertCell().textContent = typeAttribute;
                    const drawerCell = row.insertCell(); drawerCell.textContent = item.drawer || '-'; drawerCell.style.textAlign = 'center';
                    const qtyCell = row.insertCell(); qtyCell.textContent = item.quantity ?? 0; qtyCell.style.textAlign = 'center';
                    const dsCell = row.insertCell(); dsCell.style.textAlign = 'center';
                    if (item.datasheet) { try { new URL(item.datasheet); const link = document.createElement('a'); link.href = item.datasheet; link.textContent = 'Voir'; link.target = '_blank'; link.rel = 'noopener noreferrer'; dsCell.appendChild(link); } catch (_) { dsCell.textContent = '-'; } } else { dsCell.textContent = '-'; }
                 });

                // Mise à jour pagination (inchangée)
=======
                 // Affichage des lignes de données
                if(inventoryNoResults) inventoryNoResults.style.display = 'none';

                data.forEach(item => {
                    const row = inventoryTableBody.insertRow();
                    row.dataset.ref = item.ref;
                    // Stocker les données retournées par la RPC (elles contiennent déjà category_name)
                    // Pas besoin de supprimer 'categories' car il n'est pas retourné par la RPC
                    row.dataset.itemData = JSON.stringify(item);
                    row.classList.add('inventory-item-row');
                    if (currentKitSelection.some(kitItem => kitItem.ref === item.ref)) {
                        row.classList.add('kit-selected');
                    }

                    // Colonne Sélection Kit
                    const selectCell = row.insertCell(); selectCell.classList.add('col-select');
                    if (item.quantity > 0) {
                        const checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.classList.add('kit-select-checkbox');
                        checkbox.dataset.ref = item.ref;
                        checkbox.title = `Ajouter/Retirer ${item.ref} au kit`;
                        checkbox.checked = currentKitSelection.some(kitItem => kitItem.ref === item.ref);
                        selectCell.appendChild(checkbox);
                    } else {
                        selectCell.innerHTML = '&nbsp;'; // Pas de checkbox si qté=0
                    }

                    // Colonne Ref + Indicateur Stock
                    const refCell = row.insertCell();
                    const status = getStockStatus(item.quantity, item.critical_threshold);
                    const indicatorSpan = document.createElement('span');
                    indicatorSpan.classList.add('stock-indicator', `level-${status}`);
                    indicatorSpan.title = `Stock: ${status.toUpperCase()} (Qté: ${item.quantity}, Seuil: ${item.critical_threshold ?? 'N/A'})`;
                    refCell.appendChild(indicatorSpan);
                    refCell.appendChild(document.createTextNode(" " + (item.ref || 'N/A')));

                    // Colonne Description
                    row.insertCell().textContent = item.description || '-';

                    // Colonne Catégorie (directement depuis category_name retourné par RPC)
                    row.insertCell().textContent = item.category_name || 'N/A';

                    // Colonne Attribut 'Type' (si existe)
                    const typeAttribute = item.attributes?.Type || '-'; // Accès direct à l'attribut
                    row.insertCell().textContent = typeAttribute;

                    // Colonne Tiroir
                    const drawerCell = row.insertCell();
                    drawerCell.textContent = item.drawer || '-';
                    drawerCell.style.textAlign = 'center';

                    // Colonne Quantité
                    const qtyCell = row.insertCell();
                    qtyCell.textContent = item.quantity ?? 0;
                    qtyCell.style.textAlign = 'center';

                    // Colonne Datasheet
                    const dsCell = row.insertCell();
                    dsCell.style.textAlign = 'center';
                    if (item.datasheet) {
                        try {
                            // Simple validation d'URL (peut être améliorée)
                            new URL(item.datasheet);
                            const link = document.createElement('a');
                            link.href = item.datasheet;
                            link.textContent = 'Voir';
                            link.target = '_blank';
                            link.rel = 'noopener noreferrer'; // Sécurité
                            dsCell.appendChild(link);
                        } catch (_) {
                            // Si l'URL n'est pas valide, afficher '-'
                            dsCell.textContent = '-';
                        }
                    } else {
                        dsCell.textContent = '-';
                    }
                });

                // Mise à jour de la pagination (basée sur totalItems et totalPages)
                // S'assurer que la page actuelle n'est pas hors limites après un filtre
>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99
                currentInventoryPage = Math.max(1, Math.min(currentInventoryPage, totalPages || 1));
                if(inventoryPageInfo) inventoryPageInfo.textContent = `Page ${currentInventoryPage} / ${totalPages || 1}`;
                if(inventoryPrevPageButton) inventoryPrevPageButton.disabled = currentInventoryPage === 1;
                if(inventoryNextPageButton) inventoryNextPageButton.disabled = currentInventoryPage >= totalPages;
            }

        } catch (err) {
<<<<<<< HEAD
            // Gestion erreur (inchangée)
            console.error("Erreur affichage inventaire:", err);
            inventoryTableBody.innerHTML = `<tr><td colspan="8" class="error-message" style="text-align:center; color: var(--error-color);">Erreur chargement: ${err.message}</td></tr>`;
            if(inventoryPageInfo) inventoryPageInfo.textContent = 'Erreur';
            if(inventoryNoResults) { inventoryNoResults.textContent = `Erreur chargement inventaire: ${err.message}`; inventoryNoResults.style.display = 'block'; }
=======
            // Gestion des erreurs (RPC ou autres)
            console.error("Erreur affichage inventaire:", err);
            inventoryTableBody.innerHTML = `<tr><td colspan="8" class="error-message" style="text-align:center; color: var(--error-color);">Erreur chargement: ${err.message}</td></tr>`;
            if(inventoryPageInfo) inventoryPageInfo.textContent = 'Erreur';
            if(inventoryNoResults) {
                inventoryNoResults.textContent = `Erreur chargement inventaire: ${err.message}`;
                inventoryNoResults.style.display = 'block';
            }
            // S'assurer que les boutons sont désactivés en cas d'erreur
>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99
            if(inventoryPrevPageButton) inventoryPrevPageButton.disabled = true;
            if(inventoryNextPageButton) inventoryNextPageButton.disabled = true;
        }
    }


    // --- LOGIQUE HISTORIQUE ---
<<<<<<< HEAD
    // ... (displayLog, formatLogTimestamp, addLogEntry inchangés) ...
     async function displayLog(page = 1) {
        // ... code inchangé ...
=======
    // (displayLog, formatLogTimestamp, addLogEntry [Probablement obsolète si RPC OK] - Inchangé)
    async function displayLog(page = 1) {
>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99
        currentLogPage = page;
        if (!logTableBody || !supabase || !currentUser) {
            if(logTableBody) logTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">${currentUser ? 'Erreur interne ou DOM.' : 'Connexion requise.'}</td></tr>`;
            console.warn("displayLog: Prérequis manquants (DOM, Supabase ou User).");
            return;
        }
        logTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;"><i>Chargement...</i></td></tr>`;
        if(logNoResults) logNoResults.style.display = 'none';
        if(logPrevPageButton) logPrevPageButton.disabled = true;
        if(logNextPageButton) logNextPageButton.disabled = true;
        if(logPageInfo) logPageInfo.textContent = 'Chargement...';

        const itemsPerPage = ITEMS_PER_PAGE;
        const startIndex = (currentLogPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage - 1;

        try {
             console.log(`Fetching log data for page ${currentLogPage} (Range: ${startIndex}-${endIndex})`);
             let query = supabase
<<<<<<< HEAD
                 .from('log') // Nom de la table correct
=======
                 .from('log')
>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99
                 .select('created_at, user_code, action, item_ref, quantity_change, final_quantity', { count: 'exact' })
                 .order('created_at', { ascending: false })
                 .range(startIndex, endIndex);

             const { data, error, count } = await query;
             console.log(`Log query returned. Error: ${error ? error.message : 'null'}, Count: ${count}`);

             logTableBody.innerHTML = ''; // Clear loading message

             if (error) {
                 throw new Error(`Erreur DB log: ${error.message}`); // Throw error to be caught below
             }

             const totalItems = count || 0;
             const totalPages = Math.ceil(totalItems / itemsPerPage);

             if (totalItems === 0) {
                 if(logNoResults) {
                     logNoResults.textContent = "L'historique est vide.";
                     logTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px;">${logNoResults.textContent}</td></tr>`;
                     logNoResults.style.display = 'none'; // Cache le P, affiche dans le TD
                 }
                 if(logPageInfo) logPageInfo.textContent = 'Page 0 / 0';
                 if(logPrevPageButton) logPrevPageButton.disabled = true;
                 if(logNextPageButton) logNextPageButton.disabled = true;
                 console.log("Log is empty.");
             } else {
                 if(logNoResults) logNoResults.style.display = 'none';
                 console.log(`Displaying ${data.length} log entries.`);
                 data.forEach(entry => {
                     const row = logTableBody.insertRow();
                     row.insertCell().textContent = formatLogTimestamp(entry.created_at);
                     row.insertCell().textContent = entry.user_code ? entry.user_code.toUpperCase() : 'Système';
                     row.insertCell().textContent = entry.action || 'Inconnue';
                     row.insertCell().textContent = entry.item_ref || 'N/A';
                     const changeCell = row.insertCell();
                     const change = entry.quantity_change ?? 0;
                     changeCell.textContent = change > 0 ? `+${change}` : (change < 0 ? `${change}` : '0');
                     changeCell.classList.add(change > 0 ? 'positive' : (change < 0 ? 'negative' : ''));
                     changeCell.style.textAlign = 'center';
                     const finalQtyCell = row.insertCell();
                     finalQtyCell.textContent = entry.final_quantity ?? 'N/A';
                     finalQtyCell.style.textAlign = 'center';
                 });
                 currentLogPage = Math.max(1, Math.min(currentLogPage, totalPages || 1));
                 if(logPageInfo) logPageInfo.textContent = `Page ${currentLogPage} / ${totalPages || 1}`;
                 if(logPrevPageButton) logPrevPageButton.disabled = currentLogPage === 1;
                 if(logNextPageButton) logNextPageButton.disabled = currentLogPage >= totalPages;
             }
        } catch (err) {
            console.error("Erreur displayLog:", err); // Log complet de l'erreur
            const errorMsg = `Erreur chargement historique: ${err.message}`;
            logTableBody.innerHTML = `<tr><td colspan="6" class="error-message" style="text-align:center; color: var(--error-color);">${errorMsg}</td></tr>`;
            if(logPageInfo) logPageInfo.textContent = 'Erreur';
<<<<<<< HEAD
            if(logNoResults) { logNoResults.textContent = errorMsg; logNoResults.style.display = 'block'; }
=======
            if(logNoResults) {
                logNoResults.textContent = errorMsg;
                logNoResults.style.display = 'block'; // Afficher le P avec l'erreur
            }
>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99
            if(logPrevPageButton) logPrevPageButton.disabled = true;
            if(logNextPageButton) logNextPageButton.disabled = true;
        }
    }
    function formatLogTimestamp(dateString) {
<<<<<<< HEAD
        // ... code inchangé ...
         if (!dateString) return 'Date inconnue'; try { const date = new Date(dateString); if (isNaN(date.getTime())) return 'Date invalide'; const year = date.getFullYear(); const month = (date.getMonth() + 1).toString().padStart(2, '0'); const day = date.getDate().toString().padStart(2, '0'); const hours = date.getHours().toString().padStart(2, '0'); const minutes = date.getMinutes().toString().padStart(2, '0'); const seconds = date.getSeconds().toString().padStart(2, '0'); return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`; } catch (e) { console.warn("Erreur formatage date:", e); return dateString; }
    }
    async function addLogEntry(itemRef, change, newQuantity, actionType = null) {
        // ... code inchangé (avertissement maintenu) ...
        console.warn("Appel direct à addLogEntry. Le log devrait être géré par RPC 'update_stock_and_log'.");
        // Cette fonction peut être gardée pour des logs manuels spécifiques si nécessaire,
        // mais l'essentiel des logs de stock doit passer par la RPC.
        if (!supabase || !currentUser) { console.error("Log impossible: Supabase/User manquant."); return; }
        if (change === 0) { console.log("Log ignoré (addLogEntry): Aucun changement."); return; }
        const logData = {
            user_id: currentUser.id,
            user_code: currentUserCode,
            action: actionType || (change > 0 ? 'Ajout Manuel (Frontend)' : 'Retrait Manuel (Frontend)'),
            item_ref: itemRef,
            quantity_change: change,
            final_quantity: newQuantity
        };
        console.log("Tentative ajout log (frontend):", logData);
        try {
            const { error } = await supabase.from('log').insert(logData);
            if (error) { throw new Error(`Erreur insertion log (frontend): ${error.message}`); }
            console.log(`Log (frontend) ajouté pour ${itemRef}.`);
            if (logView.classList.contains('active-view')) { await displayLog(1); }
        } catch (err) {
            console.error("Erreur ajout log (frontend):", err);
            showGenericError(`Erreur historique pour ${itemRef}.`);
        }
=======
        if (!dateString) return 'Date inconnue'; try { const date = new Date(dateString); if (isNaN(date.getTime())) return 'Date invalide'; const year = date.getFullYear(); const month = (date.getMonth() + 1).toString().padStart(2, '0'); const day = date.getDate().toString().padStart(2, '0'); const hours = date.getHours().toString().padStart(2, '0'); const minutes = date.getMinutes().toString().padStart(2, '0'); const seconds = date.getSeconds().toString().padStart(2, '0'); return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`; } catch (e) { console.warn("Erreur formatage date:", e); return dateString; }
    }
    // NOTE: Cette fonction n'est probablement plus nécessaire si toutes les modifs de stock
    // passent par des RPC qui gèrent elles-mêmes le log (ex: update_stock_and_log)
    async function addLogEntry(itemRef, change, newQuantity, actionType = null) {
        console.warn("Appel à addLogEntry détecté. Est-ce intentionnel ? Les RPC devraient gérer le log.");
        if (!supabase || !currentUser) { console.error("Log impossible: Supabase/User manquant."); return; } if (change === 0 && actionType !== 'Suppression Admin') { console.log("Log ignoré: Aucun changement."); return; } const logData = { user_id: currentUser.id, user_code: currentUserCode, action: actionType || (change > 0 ? 'Ajout manuel' : 'Retrait manuel'), item_ref: itemRef, quantity_change: change, final_quantity: newQuantity }; console.log("Ajout entrée log (frontend):", logData); try { const { error } = await supabase.from('log').insert(logData); if (error) { throw new Error(`Erreur insertion log: ${error.message}`); } console.log("Entrée log ajoutée pour", itemRef); if (logView.classList.contains('active-view')) { await displayLog(1); } } catch (err) { console.error("Erreur ajout log:", err); showGenericError(`Erreur historique pour ${itemRef}.`); }
>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99
    }


    // --- VUE ADMIN ---
<<<<<<< HEAD
    // ... (getCategories, invalidateCategoriesCache, loadAdminData, loadCategoriesAdmin, addCategoryEventListeners, resetCategoryForm inchangés) ...
    // ... (populateComponentCategorySelectAdmin, renderSpecificAttributes, addComponentCategorySelectListener, showAdminFeedback, resetStockForm inchangés) ...
    // ... (addStockEventListeners, handleExportCriticalStockTXT inchangés car les modifs nécessaires pour le kit y étaient déjà) ...
     async function getCategories() {
         // ... code inchangé ...
=======
    // (getCategories, invalidateCategoriesCache, loadAdminData, loadCategoriesAdmin, addCategoryEventListeners, resetCategoryForm - Inchangé)
    // (populateComponentCategorySelectAdmin, renderSpecificAttributes, addComponentCategorySelectListener, showAdminFeedback, resetStockForm, addStockEventListeners, handleExportCriticalStockTXT - Inchangé)
    async function getCategories() {
>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99
        if (!supabase) { console.error("getCategories: Supabase non initialisé."); return []; }
        console.log("Récupération catégories...");
        try {
            const { data, error } = await supabase.from('categories').select('id, name, attributes').order('name', { ascending: true });
            if (error) throw new Error(`Erreur DB catégories: ${error.message}`);
            categoriesCache = (data || []).map(cat => {
<<<<<<< HEAD
                 if (cat.attributes && !Array.isArray(cat.attributes)) {
                     console.warn(`Attributs catégorie ${cat.name} (ID: ${cat.id}) ne sont pas un Array:`, cat.attributes);
                     if (typeof cat.attributes === 'string') { try { const parsed = JSON.parse(cat.attributes); if (Array.isArray(parsed)) { cat.attributes = parsed.map(String); } else { throw new Error("JSON parsed is not an array"); } } catch (e) { cat.attributes = cat.attributes.split(',').map(s => s.trim()).filter(Boolean); } } else { cat.attributes = []; }
                 } else if (!cat.attributes) { cat.attributes = []; }
                 cat.attributes = cat.attributes.map(attr => String(attr).trim()).filter(Boolean);
                 cat.id = String(cat.id); // Assurer que l'ID est une chaîne
=======
                 // Vérifier et potentiellement corriger le format des attributs
                 if (cat.attributes && !Array.isArray(cat.attributes)) {
                     console.warn(`Attributs catégorie ${cat.name} (ID: ${cat.id}) ne sont pas un Array:`, cat.attributes);
                     // Tentative de correction si c'est une string JSON ou CSV
                     if (typeof cat.attributes === 'string') {
                         try {
                             const parsed = JSON.parse(cat.attributes);
                             if (Array.isArray(parsed)) {
                                 cat.attributes = parsed.map(String); // Assurer que ce sont des strings
                             } else {
                                 throw new Error("JSON parsed is not an array");
                             }
                         } catch (e) {
                             // Si ce n'est pas du JSON valide, essayer de splitter par virgule
                             cat.attributes = cat.attributes.split(',').map(s => s.trim()).filter(Boolean);
                         }
                     } else {
                         // Si ce n'est ni un array ni une string, on réinitialise
                         cat.attributes = [];
                     }
                 } else if (!cat.attributes) {
                     // Si null ou undefined, initialiser à tableau vide
                     cat.attributes = [];
                 }
                 // Assurer que les attributs sont bien des strings
                 cat.attributes = cat.attributes.map(attr => String(attr).trim()).filter(Boolean);

                 cat.id = String(cat.id); // Assurer ID est une string
>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99
                 return cat;
             });
            console.log("Catégories récupérées et formatées:", categoriesCache.length);
            return categoriesCache;
        } catch (err) { console.error("Erreur récupération catégories:", err); categoriesCache = []; showAdminFeedback("Erreur chargement catégories.", 'error'); return []; }
    }
    function invalidateCategoriesCache() {
<<<<<<< HEAD
         // ... code inchangé ...
        console.log("Cache catégories invalidé."); categoriesCache = []; [inventoryCategoryFilter, componentCategorySelectAdmin, auditCategoryFilter].forEach(select => { if (select) { const currentValue = select.value; select.innerHTML = '<option value="">Chargement...</option>'; if (select === inventoryCategoryFilter || select === auditCategoryFilter) { select.innerHTML = '<option value="all">Toutes</option>' + select.innerHTML; select.value = (currentValue === 'all') ? 'all' : ''; } } }); if(attributeFiltersContainer) attributeFiltersContainer.innerHTML = ''; if(specificAttributesDiv) specificAttributesDiv.style.display = 'none';
    }
    async function loadAdminData() {
         // ... code inchangé ...
        if (!adminView.classList.contains('active-view') || !currentUser) return;
        console.log("Chargement données Admin...");
        showAdminFeedback("Chargement...", 'info');
        resetStockForm(); resetCategoryForm();
        try {
            if (categoriesCache.length === 0) await getCategories();
            await loadCategoriesAdmin();
            await populateComponentCategorySelectAdmin();
            showAdminFeedback("", 'info', true); // Clear loading message
        } catch (err) { console.error("Erreur chargement admin:", err); showAdminFeedback(`Erreur chargement admin: ${err.message}`, 'error'); }
    }
    async function loadCategoriesAdmin() {
        // ... code inchangé ...
        if (!categoryList) return; categoryList.innerHTML = '<li><i>Chargement...</i></li>';
        try {
            if (categoriesCache.length === 0 && currentUser) { await getCategories(); }
            categoryList.innerHTML = '';
            if (categoriesCache.length === 0) { categoryList.innerHTML = '<li>Aucune catégorie définie.</li>'; return; }
            categoriesCache.forEach(cat => {
                const li = document.createElement('li'); li.dataset.categoryId = cat.id; const nameSpan = document.createElement('span'); nameSpan.textContent = cat.name; li.appendChild(nameSpan); const actionsSpan = document.createElement('span'); actionsSpan.classList.add('category-actions');
                const editButton = document.createElement('button'); editButton.textContent = 'Modifier'; editButton.classList.add('edit-cat', 'action-button', 'secondary'); editButton.dataset.categoryId = cat.id;
                editButton.addEventListener('click', () => { if (!categoryFormTitle || !categoryIdEditInput || !categoryNameInput || !categoryAttributesInput || !cancelEditButton) return; categoryFormTitle.textContent = `Modifier la catégorie: ${cat.name}`; categoryIdEditInput.value = cat.id; categoryNameInput.value = cat.name; const attributesString = Array.isArray(cat.attributes) ? cat.attributes.join(', ') : ''; categoryAttributesInput.value = attributesString; cancelEditButton.style.display = 'inline-block'; categoryForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); categoryNameInput.focus(); }); actionsSpan.appendChild(editButton);
                const deleteButton = document.createElement('button'); deleteButton.textContent = 'Suppr.'; deleteButton.classList.add('delete-cat', 'action-button', 'danger'); deleteButton.dataset.categoryId = cat.id;
                deleteButton.addEventListener('click', async () => { if (!confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${cat.name}" ?\nCeci mettra la catégorie à 'NULL' pour tous les composants associés.`)) return; showAdminFeedback(`Suppression de "${cat.name}"...`, 'info'); deleteButton.disabled = true; editButton.disabled = true; try { console.log(`Mise à jour des composants associés à la catégorie ${cat.id} avant suppression...`); const { error: updateError } = await supabase.from('inventory').update({ category_id: null }).eq('category_id', cat.id); if (updateError && updateError.code !== 'PGRST116') { console.warn(`Erreur (non bloquante) lors de la mise à jour des composants associés: ${updateError.message}`); } else if (updateError?.code === 'PGRST116') { console.log(`Aucun composant trouvé pour la catégorie ${cat.id}, mise à jour non nécessaire.`); } else { console.log(`Composants associés à ${cat.id} mis à jour (category_id = NULL).`); } console.log(`Suppression de la catégorie ${cat.id} (${cat.name})...`); const { error: deleteError } = await supabase.from('categories').delete().eq('id', cat.id); if (deleteError) { if (deleteError.message.includes('foreign key constraint')) { throw new Error(`Impossible de supprimer : des composants sont toujours associés (échec de la mise à jour précédente?). Détails DB: ${deleteError.message}`); } throw new Error(`Erreur lors de la suppression dans la base de données: ${deleteError.message}`); } showAdminFeedback(`Catégorie "${cat.name}" supprimée avec succès.`, 'success'); invalidateCategoriesCache(); await loadAdminData(); if (inventoryView.classList.contains('active-view')) await populateInventoryFilters(); if (auditView.classList.contains('active-view')) await populateAuditFilters(); } catch (err) { console.error("Erreur lors de la suppression de la catégorie:", err); showAdminFeedback(`Erreur lors de la suppression de ${cat.name}: ${err.message}`, 'error'); deleteButton.disabled = false; editButton.disabled = false; } }); actionsSpan.appendChild(deleteButton);
                li.appendChild(actionsSpan); categoryList.appendChild(li);
            });
        } catch (err) { console.error("Erreur chargement catégories admin:", err); categoryList.innerHTML = `<li style="color: var(--error-color);">Erreur lors du chargement des catégories.</li>`; showAdminFeedback(`Erreur chargement catégories: ${err.message}`, 'error'); }
    }
    function addCategoryEventListeners() {
         // ... code inchangé ...
         categoryForm?.addEventListener('submit', async (event) => {
             event.preventDefault(); if (!categoryNameInput || !categoryAttributesInput || !categoryIdEditInput || !currentUser) { showAdminFeedback("Erreur interne ou connexion requise.", 'error'); return; }
             const name = categoryNameInput.value.trim(); const attributesRaw = categoryAttributesInput.value.trim(); const attributesSet = new Set(attributesRaw ? attributesRaw.split(',').map(attr => attr.trim()).filter(Boolean) : []); const attributes = [...attributesSet]; const id = categoryIdEditInput.value; const isEditing = !!id;
             if (!name) { showAdminFeedback("Le nom de la catégorie est requis.", 'error'); categoryNameInput.focus(); return; }
             showAdminFeedback(`Enregistrement de "${name}"...`, 'info'); const saveButton = categoryForm.querySelector('button[type="submit"]'); if(saveButton) saveButton.disabled = true; if(cancelEditButton) cancelEditButton.disabled = true;
             try { let result; const categoryData = { name, attributes }; if (isEditing) { result = await supabase.from('categories').update(categoryData).eq('id', id).select().single(); } else { result = await supabase.from('categories').insert(categoryData).select().single(); } const { data: savedData, error } = result; if (error) { if (error.code === '23505') { throw new Error(`Le nom de catégorie "${name}" existe déjà.`); } else { throw new Error(`Erreur base de données: ${error.message} (Code: ${error.code})`); } } showAdminFeedback(`Catégorie "${savedData.name}" ${isEditing ? 'mise à jour' : 'ajoutée'} avec succès.`, 'success'); invalidateCategoriesCache(); resetCategoryForm(); await loadAdminData(); if(inventoryView.classList.contains('active-view')) await populateInventoryFilters(); if(auditView.classList.contains('active-view')) await populateAuditFilters(); } catch (err) { console.error("Erreur lors de l'enregistrement de la catégorie:", err); showAdminFeedback(`Erreur: ${err.message}`, 'error'); } finally { if(saveButton) saveButton.disabled = false; if(cancelEditButton) { cancelEditButton.disabled = !isEditing; if (!isEditing) cancelEditButton.style.display = 'none'; } }
         });
         cancelEditButton?.addEventListener('click', resetCategoryForm);
    }
    function resetCategoryForm(){
        // ... code inchangé ...
         if (!categoryForm) return; categoryForm.reset(); if(categoryIdEditInput) categoryIdEditInput.value = ''; if(categoryFormTitle) categoryFormTitle.textContent = 'Ajouter une Catégorie'; if(cancelEditButton) cancelEditButton.style.display = 'none'; if (adminFeedbackDiv && !adminFeedbackDiv.classList.contains('error')) { showAdminFeedback('', 'info', true); }
    }
    async function populateComponentCategorySelectAdmin() {
         // ... code inchangé ...
         if (!componentCategorySelectAdmin) return; const currentVal = componentCategorySelectAdmin.value; componentCategorySelectAdmin.innerHTML = '<option value="">-- Sélectionner une catégorie --</option>';
         try { if (categoriesCache.length === 0 && currentUser) await getCategories(); categoriesCache.forEach(cat => { const option = document.createElement('option'); option.value = cat.id; option.textContent = escapeHtml(cat.name); componentCategorySelectAdmin.appendChild(option); }); if (categoriesCache.some(c => String(c.id) === String(currentVal))) { componentCategorySelectAdmin.value = currentVal; } else { componentCategorySelectAdmin.value = ""; if (specificAttributesDiv) specificAttributesDiv.style.display = 'none'; } } catch (err) { console.error("Erreur lors du remplissage du select catégorie admin:", err); componentCategorySelectAdmin.innerHTML = '<option value="" disabled>Erreur chargement</option>'; }
     }
    function renderSpecificAttributes(attributesArray, categoryName, existingValues = {}) {
        // ... code inchangé ...
        if (!specificAttributesDiv || !Array.isArray(attributesArray)) { if (specificAttributesDiv) { specificAttributesDiv.innerHTML = ''; specificAttributesDiv.style.display = 'none'; } console.log("Pas d'attributs à afficher pour", categoryName); return; }
        console.log(`Rendu des attributs spécifiques pour ${categoryName}:`, attributesArray, "Valeurs existantes:", existingValues); specificAttributesDiv.innerHTML = `<h4>Attributs Spécifiques (${escapeHtml(categoryName)})</h4>`;
        if (attributesArray.length === 0) { specificAttributesDiv.innerHTML += '<p><i>Aucun attribut spécifique défini pour cette catégorie.</i></p>'; } else {
            attributesArray.forEach(attrName => { if (!attrName || typeof attrName !== 'string' || attrName.trim() === '') return; const cleanAttrName = attrName.trim(); const formGroup = document.createElement('div'); formGroup.classList.add('form-group'); const label = document.createElement('label'); const inputId = `attr-${cleanAttrName.replace(/[^a-zA-Z0-9-_]/g, '-')}`; label.htmlFor = inputId; label.textContent = `${cleanAttrName}:`; const input = document.createElement('input'); input.type = 'text'; input.id = inputId; input.name = `attribute_${cleanAttrName}`; input.dataset.attributeName = cleanAttrName; input.placeholder = `Valeur pour ${cleanAttrName}`; if (existingValues && existingValues.hasOwnProperty(cleanAttrName)) { const value = existingValues[cleanAttrName]; input.value = (value !== null && value !== undefined) ? String(value) : ''; } formGroup.appendChild(label); formGroup.appendChild(input); specificAttributesDiv.appendChild(formGroup); });
        }
        specificAttributesDiv.style.display = 'block';
    }
    function addComponentCategorySelectListener() {
         // ... code inchangé ...
         componentCategorySelectAdmin?.addEventListener('change', () => {
             const categoryId = componentCategorySelectAdmin.value; const existingAttributes = {}; if (!categoryId) { if (specificAttributesDiv) specificAttributesDiv.style.display = 'none'; return; } const category = categoriesCache.find(cat => String(cat.id) === String(categoryId)); if (category && Array.isArray(category.attributes)) { renderSpecificAttributes(category.attributes, category.name, existingAttributes); } else { if (specificAttributesDiv) specificAttributesDiv.style.display = 'none'; if (category && !Array.isArray(category.attributes)) { console.warn("Format des attributs invalide pour la catégorie:", categoryId, category.attributes); } else if (!category) { console.warn("Catégorie sélectionnée non trouvée dans le cache:", categoryId); } }
         });
     }
    function showAdminFeedback(message, type = 'info', instantHide = false){
        // ... code inchangé ...
         if(!adminFeedbackDiv) { console.log(`Admin Feedback (${type}): ${message}`); return; } adminFeedbackDiv.textContent = message; adminFeedbackDiv.className = `feedback-area ${type}`; adminFeedbackDiv.style.display = message ? 'block' : 'none'; if (type !== 'error') { const delay = instantHide ? 0 : (type === 'info' ? 2500 : 4000); setTimeout(() => { if (adminFeedbackDiv.textContent === message) { adminFeedbackDiv.style.display = 'none'; } }, delay); }
    }
    function resetStockForm() {
        // ... code inchangé ...
        if (!stockForm) return; stockForm.reset(); if(componentRefAdminInput) { componentRefAdminInput.disabled = false; componentRefAdminInput.value = ''; } if(checkStockButton) checkStockButton.disabled = false; if(componentActionsWrapper) componentActionsWrapper.style.display = 'none'; if(componentDetails) componentDetails.style.display = 'block'; const refDisplay = document.getElementById('component-ref-display'); if (refDisplay) refDisplay.textContent = 'N/A'; if(currentQuantitySpan) currentQuantitySpan.textContent = 'N/A'; if(quantityChangeInput) quantityChangeInput.value = '0'; if(updateQuantityButton) updateQuantityButton.disabled = true; if(deleteComponentButton) { deleteComponentButton.style.display = 'none'; deleteComponentButton.disabled = true; } if(specificAttributesDiv) { specificAttributesDiv.innerHTML = ''; specificAttributesDiv.style.display = 'none'; } if(saveComponentButton) { saveComponentButton.disabled = false; saveComponentButton.textContent = 'Enregistrer Nouveau Composant'; } if (adminFeedbackDiv && !adminFeedbackDiv.classList.contains('error')) { showAdminFeedback('', 'info', true); } componentRefAdminInput?.focus();
    }
    function addStockEventListeners() {
         checkStockButton?.addEventListener('click', async () => {
             // ... code de chargement inchangé ...
             const ref = componentRefAdminInput?.value.trim().toUpperCase(); if (!ref) { showAdminFeedback("Veuillez entrer une référence composant.", 'error'); componentRefAdminInput.focus(); return; }
             showAdminFeedback(`Vérification de la référence "${ref}"...`, 'info'); componentRefAdminInput.disabled = true; checkStockButton.disabled = true; componentActionsWrapper.style.display = 'none'; componentDetails.style.display = 'block'; saveComponentButton.disabled = true;
             try { const item = await getStockInfoFromSupabase(ref); if (item) { showAdminFeedback(`Composant "${ref}" trouvé. Mode édition.`, 'info', true); componentActionsWrapper.style.display = 'block'; const refDisplay = document.getElementById('component-ref-display'); if (refDisplay) refDisplay.textContent = ref; currentQuantitySpan.textContent = item.quantity; quantityChangeInput.value = 0; updateQuantityButton.disabled = false; deleteComponentButton.style.display = 'inline-block'; deleteComponentButton.disabled = false; componentCategorySelectAdmin.value = item.category_id || ""; componentDescInput.value = item.description || ""; componentMfgInput.value = item.manufacturer || ""; componentDatasheetInput.value = item.datasheet || ""; componentDrawerAdminInput.value = item.drawer || ""; componentInitialQuantityInput.value = item.quantity; componentThresholdInput.value = item.critical_threshold ?? ""; const category = categoriesCache.find(c => String(c.id) === String(item.category_id)); if (category && Array.isArray(category.attributes)) { renderSpecificAttributes(category.attributes, category.name, item.attributes || {}); } else { if(specificAttributesDiv) specificAttributesDiv.style.display = 'none'; } saveComponentButton.textContent = `Enregistrer Modifications (${ref})`; saveComponentButton.disabled = false; } else { showAdminFeedback(`Référence "${ref}" non trouvée. Passage en mode ajout.`, 'warning'); componentActionsWrapper.style.display = 'none'; componentCategorySelectAdmin.value = ""; componentDescInput.value = ""; componentMfgInput.value = ""; componentDatasheetInput.value = ""; componentDrawerAdminInput.value = ""; componentInitialQuantityInput.value = 0; componentThresholdInput.value = ""; if (specificAttributesDiv) specificAttributesDiv.style.display = 'none'; saveComponentButton.textContent = `Enregistrer Nouveau Composant`; saveComponentButton.disabled = false; } } catch (err) { console.error("Erreur lors de la vérification du stock:", err); showAdminFeedback(`Erreur lors de la vérification de "${ref}": ${err.message}`, 'error'); resetStockForm(); } finally { if (componentRefAdminInput && !componentRefAdminInput.disabled) componentRefAdminInput.disabled = false; if (checkStockButton && !checkStockButton.disabled) checkStockButton.disabled = false; } // Correction: Ne réactiver que si pas déjà désactivé ailleurs
         });

         updateQuantityButton?.addEventListener('click', async () => {
              // Le code ici mettait déjà à jour le kit si nécessaire, donc pas de changement
              const refElement = document.getElementById('component-ref-display'); const ref = refElement?.textContent; const changeStr = quantityChangeInput?.value; const change = parseInt(changeStr || '0', 10);
              if (!ref || ref === 'N/A') { showAdminFeedback("Référence composant inconnue pour la mise à jour.", 'error'); return; } if (isNaN(change)) { showAdminFeedback("Quantité de changement invalide.", 'error'); quantityChangeInput.focus(); return; } if (change === 0) { showAdminFeedback("Aucun changement de quantité spécifié.", 'info', true); return; } if (!currentUser) { showAdminFeedback("Connexion requise pour modifier le stock.", 'error'); return; }
              showAdminFeedback(`Mise à jour quantité pour "${ref}" (${change > 0 ? '+' : ''}${change})...`, 'info'); updateQuantityButton.disabled = true; deleteComponentButton.disabled = true;
              try { console.log(`Calling RPC update_stock_and_log for ${ref}, change: ${change}`); const { data: newQuantity, error: rpcError } = await supabase.rpc('update_stock_and_log', { p_ref: ref, p_quantity_change: change, p_user_id: currentUser.id, p_user_code: currentUserCode, p_action_type: 'Admin Adjust Qty' }); if (rpcError) { if (rpcError.message.includes('new_quantity_below_zero')) throw new Error("Stock insuffisant pour ce retrait."); if (rpcError.message.includes('component_not_found')) throw new Error("Composant non trouvé (peut-être supprimé ?)."); throw new Error(`Erreur RPC: ${rpcError.message} (Code: ${rpcError.code})`); } showAdminFeedback(`Quantité pour "${ref}" mise à jour. Nouvelle quantité: ${newQuantity}.`, 'success'); currentQuantitySpan.textContent = newQuantity; quantityChangeInput.value = 0; if (componentInitialQuantityInput) componentInitialQuantityInput.value = newQuantity;
                  if (inventoryView.classList.contains('active-view')) await displayInventory(currentInventoryPage);
                  if (auditView.classList.contains('active-view')) await displayAudit();
                  if (logView.classList.contains('active-view')) await displayLog(1);
                  if(lastDisplayedDrawerRef === ref) await updateSevenSegmentForComponent(ref);
                  const kitIndex = currentKitSelection.findIndex(k => k.ref === ref);
                  if (kitIndex > -1) {
                      currentKitSelection[kitIndex].quantity = newQuantity;
                      await saveKitToSupabase();
                      if (kitView.classList.contains('active-view')) displayCurrentKitDrawers();
                  }
              } catch (err) { console.error("Erreur lors de la mise à jour rapide de quantité:", err); showAdminFeedback(`Erreur MàJ "${ref}": ${err.message}`, 'error'); } finally { updateQuantityButton.disabled = false; if (componentActionsWrapper.style.display !== 'none') { deleteComponentButton.disabled = false; } }
         });

         stockForm?.addEventListener('submit', async (event) => {
              // Le code ici mettait déjà à jour le kit si nécessaire, donc pas de changement
             event.preventDefault(); if (!currentUser) { showAdminFeedback("Connexion requise.", 'error'); return; }
             const ref = componentRefAdminInput?.value.trim().toUpperCase(); const categoryId = componentCategorySelectAdmin?.value || null; const description = componentDescInput?.value.trim() || null; const manufacturer = componentMfgInput?.value.trim() || null; const datasheet = componentDatasheetInput?.value.trim() || null; const drawer = componentDrawerAdminInput?.value.trim().toUpperCase() || null; const quantityRaw = componentInitialQuantityInput?.value; const thresholdRaw = componentThresholdInput?.value.trim();
             if (!ref) { showAdminFeedback("La référence composant est requise.", 'error'); componentRefAdminInput.focus(); return; } if (ref.length > 50) { showAdminFeedback("La référence est trop longue (max 50).", "error"); componentRefAdminInput.focus(); return; } const quantity = parseInt(quantityRaw, 10); if (quantityRaw === '' || quantityRaw === null || isNaN(quantity) || quantity < 0) { showAdminFeedback("La quantité doit être un nombre positif ou zéro.", 'error'); componentInitialQuantityInput.focus(); return; } if (datasheet) { try { new URL(datasheet); } catch (_) { showAdminFeedback("L'URL de la datasheet n'est pas valide.", 'error'); componentDatasheetInput.focus(); return; } } if (drawer && !/^[A-Z0-9\-]{1,10}$/.test(drawer)) { showAdminFeedback("Format du tiroir invalide (max 10, A-Z, 0-9, -).", "error"); componentDrawerAdminInput.focus(); return; } const critical_threshold = (thresholdRaw && !isNaN(parseInt(thresholdRaw)) && parseInt(thresholdRaw) >= 0) ? parseInt(thresholdRaw) : null;
             const attributes = {}; let attributesValid = true; specificAttributesDiv?.querySelectorAll('input[data-attribute-name]').forEach(input => { const name = input.dataset.attributeName; let value = input.value.trim(); if (value !== '') { attributes[name] = value; } else { attributes[name] = null; } }); if (!attributesValid) { return; } const attributesToSave = Object.keys(attributes).length > 0 ? attributes : null;
             const isEditing = componentActionsWrapper?.style.display === 'block';
             const componentData = { ref, category_id: categoryId || null, description, manufacturer, datasheet, drawer, critical_threshold, attributes: attributesToSave };
             if (!isEditing) { componentData.quantity = quantity; }
             if (!isEditing) { console.log("Préparation ajout nouveau composant:", componentData); showAdminFeedback(`Ajout du nouveau composant "${ref}"...`, 'info'); } else { console.log(`Préparation modification composant "${ref}":`, componentData); showAdminFeedback(`Enregistrement des modifications pour "${ref}"...`, 'info'); }
             saveComponentButton.disabled = true; checkStockButton.disabled = true; componentRefAdminInput.disabled = true; if(updateQuantityButton) updateQuantityButton.disabled = true; if(deleteComponentButton) deleteComponentButton.disabled = true;
             try {
                 const { data: upsertedData, error: upsertError } = await supabase.from('inventory').upsert(componentData, { onConflict: 'ref' }).select().single();
                 if (upsertError) { if (upsertError.message.includes('violates foreign key constraint') && upsertError.message.includes('category_id')) { const failedCategoryOption = [...componentCategorySelectAdmin.options].find(opt => opt.value === categoryId); const failedCategoryName = failedCategoryOption ? failedCategoryOption.textContent : categoryId; throw new Error(`La catégorie sélectionnée "${failedCategoryName}" n'existe pas ou plus.`); } throw new Error(`Erreur base de données lors de l'enregistrement: ${upsertError.message} (Code: ${upsertError.code})`); }
                 let finalQuantity = quantity;
                 if (isEditing) {
                     const currentDbQuantity = parseInt(currentQuantitySpan.textContent, 10);
                     const quantityInForm = parseInt(quantityRaw, 10);
                     if (!isNaN(currentDbQuantity) && !isNaN(quantityInForm) && quantityInForm !== currentDbQuantity) {
                         const change = quantityInForm - currentDbQuantity;
                         console.log(`Modification détectée dans le formulaire de quantité (${currentDbQuantity} -> ${quantityInForm}). Appel RPC pour ajuster de ${change}.`);
                         showAdminFeedback(`Mise à jour quantité pour "${ref}" (${change > 0 ? '+' : ''}${change})...`, 'info');
                         const { data: updatedQtyRpc, error: rpcError } = await supabase.rpc('update_stock_and_log', { p_ref: ref, p_quantity_change: change, p_user_id: currentUser.id, p_user_code: currentUserCode, p_action_type: 'Admin Form Adjust' });
                         if (rpcError) { if (rpcError.message.includes('new_quantity_below_zero')) throw new Error("Stock insuffisant (ajustement formulaire)."); if (rpcError.message.includes('component_not_found')) throw new Error("Composant non trouvé (ajustement formulaire)."); throw new Error(`Erreur RPC (ajustement formulaire): ${rpcError.message}`); }
                         finalQuantity = updatedQtyRpc;
                         console.log(`Quantité ajustée via RPC (formulaire): ${finalQuantity}`);
                     } else { finalQuantity = currentDbQuantity; }
                 } else {
                    if (finalQuantity > 0) {
                        console.log(`Log manuel de l'ajout initial de ${finalQuantity} pour ${ref} via RPC...`);
                        const { error: logError } = await supabase.rpc('update_stock_and_log', { p_ref: ref, p_quantity_change: 0, p_user_id: currentUser.id, p_user_code: currentUserCode, p_action_type: 'Admin Initial Add', p_force_log: true, p_initial_quantity: finalQuantity });
                        if (logError) console.warn("Erreur lors du log de l'ajout initial:", logError);
                    }
                 }
                 const operationType = isEditing ? 'Modifié' : 'Ajouté';
                 showAdminFeedback(`Composant "${ref}" ${operationType} avec succès.`, 'success');
                 resetStockForm();
                 if (inventoryView.classList.contains('active-view')) await displayInventory(1);
                 if (auditView.classList.contains('active-view')) await displayAudit();
                 if (logView.classList.contains('active-view')) await displayLog(1);
                 await updateSevenSegmentForComponent(ref);
                 const kitIndex = currentKitSelection.findIndex(k => k.ref === ref);
                 if (kitIndex > -1) {
                     const updatedItemForKit = await getStockInfoFromSupabase(ref);
                     if (updatedItemForKit) {
                         currentKitSelection[kitIndex] = updatedItemForKit;
                         console.log(`Item ${ref} mis à jour dans le kit local.`);
                     } else {
                         currentKitSelection.splice(kitIndex, 1);
                         console.log(`Item ${ref} retiré du kit local car introuvable après modification.`);
                     }
                     await saveKitToSupabase();
                     if (kitView.classList.contains('active-view')) displayCurrentKitDrawers();
                 }
             } catch (err) { console.error("Erreur lors de l'enregistrement du composant:", err); showAdminFeedback(`Erreur enregistrement "${ref}": ${err.message}`, 'error'); saveComponentButton.disabled = false; checkStockButton.disabled = false; componentRefAdminInput.disabled = false; if (isEditing) { if(updateQuantityButton) updateQuantityButton.disabled = false; if(deleteComponentButton) deleteComponentButton.disabled = false; } }
         });

         deleteComponentButton?.addEventListener('click', async () => {
              // Le code ici mettait déjà à jour le kit si nécessaire, donc pas de changement
             const refElement = document.getElementById('component-ref-display'); const ref = refElement?.textContent;
             if (!ref || ref === 'N/A') { showAdminFeedback("Référence composant inconnue pour la suppression.", 'error'); return; } if (!currentUser) { showAdminFeedback("Connexion requise pour supprimer.", 'error'); return; } if (!confirm(`ATTENTION !\nÊtes-vous sûr de vouloir supprimer définitivement le composant "${ref}" et tout son historique associé ?\n\nCette action est IRRÉVERSIBLE.`)) { return; }
             showAdminFeedback(`Suppression de "${ref}" et de son historique en cours...`, 'info'); deleteComponentButton.disabled = true; updateQuantityButton.disabled = true; saveComponentButton.disabled = true; checkStockButton.disabled = true; componentRefAdminInput.disabled = true;
             let kitWasModified = false;
             const indexInKit = currentKitSelection.findIndex(k => k.ref === ref);
             if (indexInKit > -1) {
                 currentKitSelection.splice(indexInKit, 1);
                 kitWasModified = true;
                 console.log(`Item ${ref} retiré du kit local avant suppression.`);
             }
             try {
                 console.log(`Suppression de l'historique (log) pour ${ref}...`); const { error: deleteLogError } = await supabase.from('log').delete().eq('item_ref', ref); if (deleteLogError) { console.warn(`Erreur (non bloquante) lors de la suppression de l'historique pour ${ref}: ${deleteLogError.message}`); } else { console.log(`Historique pour ${ref} supprimé.`); }
                 console.log(`Suppression du composant ${ref} de l'inventaire...`); const { error: deleteInvError } = await supabase.from('inventory').delete().eq('ref', ref);
                 if (deleteInvError && deleteInvError.code === 'PGRST116') { showAdminFeedback(`Composant "${ref}" non trouvé (peut-être déjà supprimé).`, 'warning'); } else if (deleteInvError) { throw new Error(`Erreur lors de la suppression du composant dans la base de données: ${deleteInvError.message}`); } else { showAdminFeedback(`Composant "${ref}" et son historique supprimés avec succès.`, 'success'); }
                 if (kitWasModified) { await saveKitToSupabase(); }
                 resetStockForm();
                 if(lastDisplayedDrawerRef === ref) updateSevenSegmentForComponent(null);
                 if (inventoryView.classList.contains('active-view')) await displayInventory(1);
                 if (auditView.classList.contains('active-view')) await displayAudit();
                 if (logView.classList.contains('active-view')) await displayLog(1);
                 if (kitView.classList.contains('active-view')) displayCurrentKitDrawers();
             } catch (err) { console.error("Erreur lors de la suppression du composant:", err); showAdminFeedback(`Erreur lors de la suppression de "${ref}": ${err.message}`, 'error'); checkStockButton.disabled = false; componentRefAdminInput.disabled = false; }
         });
         exportCriticalButton?.addEventListener('click', handleExportCriticalStockTXT);
    }
    async function handleExportCriticalStockTXT() {
         // ... code inchangé ...
         if (!exportCriticalFeedbackDiv) return; exportCriticalFeedbackDiv.textContent = 'Export du stock critique en cours...'; exportCriticalFeedbackDiv.className = 'feedback-area info'; exportCriticalFeedbackDiv.style.display = 'block';
         try { const { data, error } = await supabase.from('inventory').select('ref, description, quantity, critical_threshold, drawer').order('ref'); if (error) throw new Error(`Erreur fetch inventaire: ${error.message}`); if (!data || data.length === 0) { exportCriticalFeedbackDiv.textContent = 'L\'inventaire est vide.'; exportCriticalFeedbackDiv.className = 'feedback-area warning'; return; } const criticalItems = data.filter(item => { const qty = item.quantity; const threshold = item.critical_threshold; if (qty <= 0) return true; if (threshold !== null && threshold >= 0 && qty <= threshold) return true; return false; }); if (criticalItems.length === 0) { exportCriticalFeedbackDiv.textContent = 'Aucun composant en état critique trouvé.'; exportCriticalFeedbackDiv.className = 'feedback-area info'; return; } let fileContent = `Rapport StockAV - Composants Critiques (${new Date().toLocaleString('fr-FR')})\n`; fileContent += `======================================================================\n\n`; criticalItems.forEach(item => { const status = item.quantity <= 0 ? "!! RUPTURE DE STOCK !!" : "** STOCK FAIBLE **"; fileContent += `Référence:    ${item.ref}\n`; fileContent += `Description:  ${item.description || '-'}\n`; fileContent += `Tiroir:       ${item.drawer || 'N/A'}\n`; fileContent += `Quantité:     ${item.quantity}\n`; fileContent += `Seuil critique: ${item.critical_threshold ?? 'Non défini'}\n`; fileContent += `STATUT:       ${status}\n`; fileContent += `----------------------------------------------------------------------\n`; }); const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-'); const filename = `stockav_critique_${timestamp}.txt`; downloadFile(filename, fileContent, 'text/plain;charset=utf-8'); exportCriticalFeedbackDiv.textContent = `Export TXT (${criticalItems.length} composants critiques) réussi.`; exportCriticalFeedbackDiv.className = 'feedback-area success'; } catch (err) { console.error("Erreur lors de l'export du stock critique:", err); exportCriticalFeedbackDiv.textContent = `Erreur lors de l'export: ${err.message}`; exportCriticalFeedbackDiv.className = 'feedback-area error'; }
     }


    // --- VUE RECHERCHE (CHAT IA) ---
    // ... (addMessageToChat, displayWelcomeMessage, handleUserInput, extractReference inchangés) ...
    // ... (checkComponentWithAI, promptLoginBeforeAction, provideExternalLinksHTML inchangés) ...
    // ... (handleQuantityResponse, resetConversationState, getStockInfoFromSupabase inchangés car les modifs nécessaires pour le kit y étaient déjà) ...
    async function addMessageToChat(sender, messageContent, isHTML = false) {
        // ... code inchangé ...
        if (!responseOutputChat) return;
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender.toLowerCase()); // 'user' or 'ai'

        if (isHTML) {
            const sanitizedHTML = messageContent.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
=======
        console.log("Cache catégories invalidé."); categoriesCache = []; [inventoryCategoryFilter, componentCategorySelectAdmin, auditCategoryFilter].forEach(select => { if (select) { const currentValue = select.value; select.innerHTML = '<option value="">Chargement...</option>'; if (select === inventoryCategoryFilter || select === auditCategoryFilter) { select.innerHTML = '<option value="all">Toutes</option>' + select.innerHTML; select.value = (currentValue === 'all') ? 'all' : ''; } } }); if(attributeFiltersContainer) attributeFiltersContainer.innerHTML = ''; if(specificAttributesDiv) specificAttributesDiv.style.display = 'none';
    }
    async function loadAdminData() {
        if (!adminView.classList.contains('active-view') || !currentUser) return;
        console.log("Chargement données Admin...");
        showAdminFeedback("Chargement...", 'info');
        resetStockForm();
        resetCategoryForm();
        try {
            // Assurer que les catégories sont là avant de continuer
            if (categoriesCache.length === 0) await getCategories();
            await loadCategoriesAdmin(); // Affiche la liste des catégories existantes
            await populateComponentCategorySelectAdmin(); // Remplit le <select> du formulaire composant
            showAdminFeedback("", 'info', true); // Cache le message "Chargement..."
        } catch (err) {
            console.error("Erreur chargement admin:", err);
            showAdminFeedback(`Erreur chargement admin: ${err.message}`, 'error');
        }
    }
    async function loadCategoriesAdmin() {
        if (!categoryList) return;
        categoryList.innerHTML = '<li><i>Chargement...</i></li>';
        try {
            // Utiliser le cache s'il est rempli, sinon le fetcher
            if (categoriesCache.length === 0 && currentUser) { // Vérifier currentUser aussi
                await getCategories();
            }

            categoryList.innerHTML = ''; // Vider la liste

            if (categoriesCache.length === 0) {
                categoryList.innerHTML = '<li>Aucune catégorie définie.</li>';
                return;
            }

            categoriesCache.forEach(cat => {
                const li = document.createElement('li');
                li.dataset.categoryId = cat.id;

                const nameSpan = document.createElement('span');
                nameSpan.textContent = cat.name;
                li.appendChild(nameSpan);

                const actionsSpan = document.createElement('span');
                actionsSpan.classList.add('category-actions');

                // Bouton Modifier
                const editButton = document.createElement('button');
                editButton.textContent = 'Modifier';
                editButton.classList.add('edit-cat', 'action-button', 'secondary');
                editButton.dataset.categoryId = cat.id;
                editButton.addEventListener('click', () => {
                    if (!categoryFormTitle || !categoryIdEditInput || !categoryNameInput || !categoryAttributesInput || !cancelEditButton) return;
                    categoryFormTitle.textContent = `Modifier la catégorie: ${cat.name}`;
                    categoryIdEditInput.value = cat.id;
                    categoryNameInput.value = cat.name;
                    // Assurer que les attributs sont bien un Array avant de joindre
                    const attributesString = Array.isArray(cat.attributes) ? cat.attributes.join(', ') : '';
                    categoryAttributesInput.value = attributesString;
                    cancelEditButton.style.display = 'inline-block';
                    categoryForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    categoryNameInput.focus(); // Focus sur le nom
                });
                actionsSpan.appendChild(editButton);

                // Bouton Supprimer
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Suppr.';
                deleteButton.classList.add('delete-cat', 'action-button', 'danger');
                deleteButton.dataset.categoryId = cat.id;
                deleteButton.addEventListener('click', async () => {
                    if (!confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${cat.name}" ?\nCeci mettra la catégorie à 'NULL' pour tous les composants associés.`)) return;

                    showAdminFeedback(`Suppression de "${cat.name}"...`, 'info');
                    deleteButton.disabled = true; // Désactiver pendant l'opération
                    editButton.disabled = true;

                    try {
                        // 1. Mettre à jour les composants associés (mettre category_id à NULL)
                        // Utiliser maybeSingle() ou équivalent si aucun composant n'est associé
                        console.log(`Mise à jour des composants associés à la catégorie ${cat.id} avant suppression...`);
                        const { error: updateError } = await supabase
                            .from('inventory')
                            .update({ category_id: null })
                            .eq('category_id', cat.id);

                        // Ne pas bloquer si l'erreur est "aucun enregistrement mis à jour" (PGRST116)
                        if (updateError && updateError.code !== 'PGRST116') {
                            // Logguer une erreur non bloquante pour les autres cas
                            console.warn(`Erreur (non bloquante) lors de la mise à jour des composants associés: ${updateError.message}`);
                            // On pourrait décider de s'arrêter ici si l'erreur est grave
                            // throw new Error(`Erreur mise à jour composants: ${updateError.message}`);
                        } else if (updateError?.code === 'PGRST116') {
                            console.log(`Aucun composant trouvé pour la catégorie ${cat.id}, mise à jour non nécessaire.`);
                        } else {
                            console.log(`Composants associés à ${cat.id} mis à jour (category_id = NULL).`);
                        }


                        // 2. Supprimer la catégorie elle-même
                        console.log(`Suppression de la catégorie ${cat.id} (${cat.name})...`);
                        const { error: deleteError } = await supabase
                            .from('categories')
                            .delete()
                            .eq('id', cat.id);

                        if (deleteError) {
                            // Gérer spécifiquement les erreurs de contrainte FK si l'étape 1 a échoué pour une raison imprévue
                            if (deleteError.message.includes('foreign key constraint')) {
                                throw new Error(`Impossible de supprimer : des composants sont toujours associés (échec de la mise à jour précédente?). Détails DB: ${deleteError.message}`);
                            }
                            throw new Error(`Erreur lors de la suppression dans la base de données: ${deleteError.message}`);
                        }

                        showAdminFeedback(`Catégorie "${cat.name}" supprimée avec succès.`, 'success');

                        // 3. Mettre à jour l'UI
                        invalidateCategoriesCache(); // Très important
                        await loadAdminData(); // Recharger la section admin (liste cat + select composant)
                        // Mettre à jour aussi les filtres dans les autres vues si elles sont actives
                        if (inventoryView.classList.contains('active-view')) await populateInventoryFilters();
                        if (auditView.classList.contains('active-view')) await populateAuditFilters();

                    } catch (err) {
                        console.error("Erreur lors de la suppression de la catégorie:", err);
                        showAdminFeedback(`Erreur lors de la suppression de ${cat.name}: ${err.message}`, 'error');
                        // Réactiver les boutons en cas d'erreur
                        deleteButton.disabled = false;
                        editButton.disabled = false;
                    }
                });
                actionsSpan.appendChild(deleteButton);

                li.appendChild(actionsSpan);
                categoryList.appendChild(li);
            });

        } catch (err) {
            console.error("Erreur chargement catégories admin:", err);
            categoryList.innerHTML = `<li style="color: var(--error-color);">Erreur lors du chargement des catégories.</li>`;
            // Afficher l'erreur aussi dans la zone de feedback principale
            showAdminFeedback(`Erreur chargement catégories: ${err.message}`, 'error');
        }
    }
    function addCategoryEventListeners() {
         categoryForm?.addEventListener('submit', async (event) => {
             event.preventDefault();
             if (!categoryNameInput || !categoryAttributesInput || !categoryIdEditInput || !currentUser) {
                 showAdminFeedback("Erreur interne ou connexion requise.", 'error');
                 return;
             }

             const name = categoryNameInput.value.trim();
             const attributesRaw = categoryAttributesInput.value.trim();
             // Nettoyer, dédupliquer et filtrer les attributs
             const attributesSet = new Set(
                 attributesRaw
                     ? attributesRaw.split(',')
                           .map(attr => attr.trim()) // Enlever espaces avant/après
                           .filter(Boolean) // Enlever chaînes vides
                     : []
             );
             const attributes = [...attributesSet]; // Convertir en Array

             const id = categoryIdEditInput.value; // Si ID existe, on est en mode édition
             const isEditing = !!id;

             if (!name) {
                 showAdminFeedback("Le nom de la catégorie est requis.", 'error');
                 categoryNameInput.focus();
                 return;
             }

             showAdminFeedback(`Enregistrement de "${name}"...`, 'info');
             const saveButton = categoryForm.querySelector('button[type="submit"]');
             if(saveButton) saveButton.disabled = true;
             if(cancelEditButton) cancelEditButton.disabled = true;

             try {
                 let result;
                 const categoryData = { name, attributes }; // Préparer l'objet à envoyer

                 if (isEditing) {
                     // Mode Mise à jour
                     console.log(`Mise à jour catégorie ID ${id}:`, categoryData);
                     result = await supabase
                         .from('categories')
                         .update(categoryData)
                         .eq('id', id)
                         .select() // Demander le retour de l'enregistrement mis à jour
                         .single(); // S'attendre à un seul résultat
                 } else {
                     // Mode Création
                     console.log("Création nouvelle catégorie:", categoryData);
                     result = await supabase
                         .from('categories')
                         .insert(categoryData)
                         .select() // Demander le retour de l'enregistrement créé
                         .single(); // S'attendre à un seul résultat
                 }

                 const { data: savedData, error } = result;

                 if (error) {
                     // Gérer les erreurs spécifiques de Supabase/Postgres
                     if (error.code === '23505') { // Violation de contrainte unique (probablement sur le nom)
                         throw new Error(`Le nom de catégorie "${name}" existe déjà.`);
                     } else {
                         throw new Error(`Erreur base de données: ${error.message} (Code: ${error.code})`);
                     }
                 }

                 // Succès
                 showAdminFeedback(`Catégorie "${savedData.name}" ${isEditing ? 'mise à jour' : 'ajoutée'} avec succès.`, 'success');

                 // Mise à jour UI
                 invalidateCategoriesCache(); // Forcer le rechargement du cache
                 resetCategoryForm(); // Vider le formulaire
                 await loadAdminData(); // Recharger toute la section admin
                 // Mettre à jour les filtres des autres vues si elles sont actives
                 if(inventoryView.classList.contains('active-view')) await populateInventoryFilters();
                 if(auditView.classList.contains('active-view')) await populateAuditFilters();

             } catch (err) {
                 console.error("Erreur lors de l'enregistrement de la catégorie:", err);
                 showAdminFeedback(`Erreur: ${err.message}`, 'error');
             } finally {
                 // Réactiver les boutons dans tous les cas (succès ou erreur)
                 if(saveButton) saveButton.disabled = false;
                 if(cancelEditButton) {
                     // Réactiver le bouton Annuler seulement s'il était visible (mode édition)
                     cancelEditButton.disabled = !isEditing;
                     // S'assurer qu'il reste caché si on n'était pas en mode édition
                     if (!isEditing) cancelEditButton.style.display = 'none';
                 }
             }
         });

         // Bouton Annuler (pour le mode édition)
         cancelEditButton?.addEventListener('click', resetCategoryForm);
    }
    function resetCategoryForm(){
         if (!categoryForm) return;
         categoryForm.reset();
         if(categoryIdEditInput) categoryIdEditInput.value = ''; // Vider l'ID caché
         if(categoryFormTitle) categoryFormTitle.textContent = 'Ajouter une Catégorie'; // Titre par défaut
         if(cancelEditButton) cancelEditButton.style.display = 'none'; // Cacher Annuler
         // Optionnel: Cacher le feedback s'il n'est pas une erreur persistante
         if (adminFeedbackDiv && !adminFeedbackDiv.classList.contains('error')) {
             showAdminFeedback('', 'info', true); // Cache immédiatement
         }
         // Remettre le focus sur le nom pour faciliter l'ajout suivant
         // categoryNameInput?.focus(); // Peut être gênant si on annule juste
    }
    async function populateComponentCategorySelectAdmin() {
         if (!componentCategorySelectAdmin) return;
         const currentVal = componentCategorySelectAdmin.value; // Sauver la valeur actuelle
         componentCategorySelectAdmin.innerHTML = '<option value="">-- Sélectionner une catégorie --</option>'; // Option par défaut
         try {
             // Utiliser le cache, le remplir si vide
             if (categoriesCache.length === 0 && currentUser) await getCategories();

             categoriesCache.forEach(cat => {
                 const option = document.createElement('option');
                 option.value = cat.id; // Utiliser l'ID comme valeur
                 option.textContent = escapeHtml(cat.name); // Afficher le nom
                 componentCategorySelectAdmin.appendChild(option);
             });

             // Essayer de restaurer la valeur précédente si elle existe toujours
             if (categoriesCache.some(c => String(c.id) === String(currentVal))) {
                 componentCategorySelectAdmin.value = currentVal;
             } else {
                 componentCategorySelectAdmin.value = ""; // Revenir à la sélection par défaut
                 // Si une catégorie était sélectionnée mais n'existe plus, cacher les champs spécifiques
                 if (specificAttributesDiv) specificAttributesDiv.style.display = 'none';
             }

         } catch (err) {
             console.error("Erreur lors du remplissage du select catégorie admin:", err);
             componentCategorySelectAdmin.innerHTML = '<option value="" disabled>Erreur chargement</option>';
         }
     }
    function renderSpecificAttributes(attributesArray, categoryName, existingValues = {}) {
        // attributesArray: Array de strings (noms d'attributs de la catégorie)
        // categoryName: Nom de la catégorie (pour l'affichage)
        // existingValues: Object { nomAttribut: valeurActuelle } du composant en cours d'édition
        if (!specificAttributesDiv || !Array.isArray(attributesArray)) {
             if (specificAttributesDiv) {
                 specificAttributesDiv.innerHTML = ''; // Vider au cas où
                 specificAttributesDiv.style.display = 'none';
             }
             console.log("Pas d'attributs à afficher pour", categoryName);
             return;
         }

        console.log(`Rendu des attributs spécifiques pour ${categoryName}:`, attributesArray, "Valeurs existantes:", existingValues);
        specificAttributesDiv.innerHTML = `<h4>Attributs Spécifiques (${escapeHtml(categoryName)})</h4>`; // Titre clair

        if (attributesArray.length === 0) {
            specificAttributesDiv.innerHTML += '<p><i>Aucun attribut spécifique défini pour cette catégorie.</i></p>';
        } else {
            attributesArray.forEach(attrName => {
                // Ignorer les noms d'attributs vides ou invalides
                if (!attrName || typeof attrName !== 'string' || attrName.trim() === '') return;

                const cleanAttrName = attrName.trim(); // Utiliser le nom nettoyé

                const formGroup = document.createElement('div');
                formGroup.classList.add('form-group');

                const label = document.createElement('label');
                // Créer un ID unique et valide pour le input
                const inputId = `attr-${cleanAttrName.replace(/[^a-zA-Z0-9-_]/g, '-')}`;
                label.htmlFor = inputId;
                label.textContent = `${cleanAttrName}:`; // Afficher le nom de l'attribut

                const input = document.createElement('input');
                input.type = 'text'; // Toujours utiliser text pour flexibilité (JSONB stocke du texte)
                input.id = inputId;
                input.name = `attribute_${cleanAttrName}`; // Utile si on soumettait un formulaire standard
                input.dataset.attributeName = cleanAttrName; // Stocker le nom exact de l'attribut
                input.placeholder = `Valeur pour ${cleanAttrName}`;

                // Pré-remplir avec la valeur existante si elle existe
                if (existingValues && existingValues.hasOwnProperty(cleanAttrName)) {
                    const value = existingValues[cleanAttrName];
                    // Afficher la valeur telle quelle (null ou undefined devient chaîne vide)
                    input.value = (value !== null && value !== undefined) ? String(value) : '';
                }

                formGroup.appendChild(label);
                formGroup.appendChild(input);
                specificAttributesDiv.appendChild(formGroup);
            });
        }
        // Afficher la section seulement si elle contient quelque chose (titre ou attributs)
        specificAttributesDiv.style.display = 'block';
    }
    function addComponentCategorySelectListener() {
         componentCategorySelectAdmin?.addEventListener('change', () => {
             const categoryId = componentCategorySelectAdmin.value;
             // On ne connaît pas les valeurs existantes à ce stade (on change juste la catégorie)
             // sauf si on était en train d'éditer un composant -> à gérer dans 'checkStockButton'
             const existingAttributes = {}; // Vide pour l'instant

             if (!categoryId) {
                 // Si on sélectionne "-- Sélectionner --"
                 if (specificAttributesDiv) specificAttributesDiv.style.display = 'none';
                 return;
             }

             // Trouver la catégorie sélectionnée dans le cache
             const category = categoriesCache.find(cat => String(cat.id) === String(categoryId));

             if (category && Array.isArray(category.attributes)) {
                 // Afficher les champs pour les attributs de cette catégorie
                 renderSpecificAttributes(category.attributes, category.name, existingAttributes);
             } else {
                 // Si catégorie non trouvée ou attributs invalides, cacher la section
                 if (specificAttributesDiv) specificAttributesDiv.style.display = 'none';
                 if (category && !Array.isArray(category.attributes)) {
                     console.warn("Format des attributs invalide pour la catégorie:", categoryId, category.attributes);
                 } else if (!category) {
                      console.warn("Catégorie sélectionnée non trouvée dans le cache:", categoryId);
                 }
             }
         });
     }
    function showAdminFeedback(message, type = 'info', instantHide = false){
         if(!adminFeedbackDiv) { console.log(`Admin Feedback (${type}): ${message}`); return; }
         adminFeedbackDiv.textContent = message;
         adminFeedbackDiv.className = `feedback-area ${type}`;
         adminFeedbackDiv.style.display = message ? 'block' : 'none';
         // Cacher automatiquement après un délai sauf si c'est une erreur
         if (type !== 'error') {
             const delay = instantHide ? 0 : (type === 'info' ? 2500 : 4000); // Délai plus long pour succès
             setTimeout(() => {
                 // Vérifier si le message est toujours le même avant de cacher
                 if (adminFeedbackDiv.textContent === message) {
                     adminFeedbackDiv.style.display = 'none';
                 }
             }, delay);
         }
     }
    function resetStockForm() {
         if (!stockForm) return;
         stockForm.reset(); // Réinitialise les champs du formulaire

         // Réinitialiser l'état des éléments spécifiques
         if(componentRefAdminInput) {
             componentRefAdminInput.disabled = false; // Activer le champ Ref
             componentRefAdminInput.value = '';
         }
         if(checkStockButton) checkStockButton.disabled = false; // Activer le bouton Vérifier

         // Cacher la section des actions rapides et afficher les détails généraux
         if(componentActionsWrapper) componentActionsWrapper.style.display = 'none';
         if(componentDetails) componentDetails.style.display = 'block'; // Assurer que la partie principale est visible

         // Réinitialiser les valeurs affichées dans les actions rapides (même si cachées)
         const refDisplay = document.getElementById('component-ref-display');
         if (refDisplay) refDisplay.textContent = 'N/A';
         if(currentQuantitySpan) currentQuantitySpan.textContent = 'N/A';
         if(quantityChangeInput) quantityChangeInput.value = '0';
         if(updateQuantityButton) updateQuantityButton.disabled = true;
         if(deleteComponentButton) {
            deleteComponentButton.style.display = 'none'; // Cacher le bouton Supprimer
            deleteComponentButton.disabled = true;
         }

         // Vider les attributs spécifiques
         if(specificAttributesDiv) {
             specificAttributesDiv.innerHTML = '';
             specificAttributesDiv.style.display = 'none';
         }

         // Réinitialiser le bouton Enregistrer
         if(saveComponentButton) {
             saveComponentButton.disabled = false; // Activer
             saveComponentButton.textContent = 'Enregistrer Nouveau Composant'; // Texte par défaut
         }

         // Cacher le feedback s'il n'est pas une erreur
         if (adminFeedbackDiv && !adminFeedbackDiv.classList.contains('error')) {
             showAdminFeedback('', 'info', true);
         }

         // Remettre le focus sur le champ de référence
         componentRefAdminInput?.focus();
     }
    function addStockEventListeners() {
         // --- Bouton Vérifier/Charger Composant ---
         checkStockButton?.addEventListener('click', async () => {
             const ref = componentRefAdminInput?.value.trim().toUpperCase();
             if (!ref) {
                 showAdminFeedback("Veuillez entrer une référence composant.", 'error');
                 componentRefAdminInput.focus();
                 return;
             }

             showAdminFeedback(`Vérification de la référence "${ref}"...`, 'info');
             componentRefAdminInput.disabled = true;
             checkStockButton.disabled = true;
             componentActionsWrapper.style.display = 'none'; // Cacher actions rapides
             componentDetails.style.display = 'block';    // Assurer détails visibles
             saveComponentButton.disabled = true;     // Désactiver sauvegarde pendant chargement

             try {
                 // Utiliser la fonction helper pour récupérer les infos
                 const item = await getStockInfoFromSupabase(ref);

                 if (item) {
                     // --- Composant Trouvé ---
                     showAdminFeedback(`Composant "${ref}" trouvé. Mode édition.`, 'info', true);

                     // Afficher les actions rapides
                     componentActionsWrapper.style.display = 'block';
                     const refDisplay = document.getElementById('component-ref-display');
                     if (refDisplay) refDisplay.textContent = ref; // Afficher la ref dans la zone actions
                     currentQuantitySpan.textContent = item.quantity;
                     quantityChangeInput.value = 0;
                     updateQuantityButton.disabled = false; // Activer MàJ quantité
                     deleteComponentButton.style.display = 'inline-block'; // Afficher Supprimer
                     deleteComponentButton.disabled = false;

                     // Pré-remplir le formulaire principal
                     componentCategorySelectAdmin.value = item.category_id || ""; // Sélectionner la catégorie
                     componentDescInput.value = item.description || "";
                     componentMfgInput.value = item.manufacturer || "";
                     componentDatasheetInput.value = item.datasheet || "";
                     componentDrawerAdminInput.value = item.drawer || "";
                     componentInitialQuantityInput.value = item.quantity; // Mettre la quantité actuelle
                     componentThresholdInput.value = item.critical_threshold ?? ""; // Mettre le seuil

                     // Afficher les attributs spécifiques
                     const category = categoriesCache.find(c => String(c.id) === String(item.category_id));
                     if (category && Array.isArray(category.attributes)) {
                         renderSpecificAttributes(category.attributes, category.name, item.attributes || {});
                     } else {
                         // Pas de catégorie ou pas d'attributs définis pour elle
                         if(specificAttributesDiv) specificAttributesDiv.style.display = 'none';
                     }

                     saveComponentButton.textContent = `Enregistrer Modifications (${ref})`;
                     saveComponentButton.disabled = false; // Activer le bouton de sauvegarde

                 } else {
                     // --- Composant Non Trouvé ---
                     showAdminFeedback(`Référence "${ref}" non trouvée. Passage en mode ajout.`, 'warning');
                     // Assurer que les actions rapides restent cachées
                     componentActionsWrapper.style.display = 'none';
                     // Vider/Réinitialiser les champs qui auraient pu être pré-remplis
                     componentCategorySelectAdmin.value = "";
                     componentDescInput.value = "";
                     componentMfgInput.value = "";
                     componentDatasheetInput.value = "";
                     componentDrawerAdminInput.value = "";
                     componentInitialQuantityInput.value = 0; // Quantité initiale à 0 pour ajout
                     componentThresholdInput.value = "";
                     if (specificAttributesDiv) specificAttributesDiv.style.display = 'none'; // Cacher attributs
                     // Configurer le bouton pour l'ajout
                     saveComponentButton.textContent = `Enregistrer Nouveau Composant`;
                     saveComponentButton.disabled = false; // Activer pour permettre l'ajout
                 }

             } catch (err) {
                 console.error("Erreur lors de la vérification du stock:", err);
                 showAdminFeedback(`Erreur lors de la vérification de "${ref}": ${err.message}`, 'error');
                 // En cas d'erreur grave, réinitialiser complètement
                 resetStockForm();
             } finally {
                 // Réactiver les contrôles de recherche dans tous les cas (sauf si resetStockForm l'a déjà fait)
                 if (!componentRefAdminInput.disabled) componentRefAdminInput.disabled = false;
                 if (!checkStockButton.disabled) checkStockButton.disabled = false;
                 // Ne pas réactiver saveButton ici, sa logique dépend du résultat
             }
         });

         // --- Bouton Mise à Jour Rapide Quantité ---
         updateQuantityButton?.addEventListener('click', async () => {
              const refElement = document.getElementById('component-ref-display');
              const ref = refElement?.textContent;
              const changeStr = quantityChangeInput?.value;
              const change = parseInt(changeStr || '0', 10);

              if (!ref || ref === 'N/A') { showAdminFeedback("Référence composant inconnue pour la mise à jour.", 'error'); return; }
              if (isNaN(change)) { showAdminFeedback("Quantité de changement invalide.", 'error'); quantityChangeInput.focus(); return; }
              if (change === 0) { showAdminFeedback("Aucun changement de quantité spécifié.", 'info', true); return; }
              if (!currentUser) { showAdminFeedback("Connexion requise pour modifier le stock.", 'error'); return; }

              showAdminFeedback(`Mise à jour quantité pour "${ref}" (${change > 0 ? '+' : ''}${change})...`, 'info');
              updateQuantityButton.disabled = true;
              deleteComponentButton.disabled = true; // Désactiver pendant l'opération

              try {
                  // Utilisation de la RPC dédiée qui gère aussi le log
                  console.log(`Calling RPC update_stock_and_log for ${ref}, change: ${change}`);
                  const { data: newQuantity, error: rpcError } = await supabase.rpc('update_stock_and_log', {
                      p_ref: ref,
                      p_quantity_change: change,
                      p_user_id: currentUser.id,
                      p_user_code: currentUserCode,
                      p_action_type: 'Admin Adjust Qty' // Type d'action spécifique
                  });

                  if (rpcError) {
                      // Gérer les erreurs spécifiques de la RPC
                      if (rpcError.message.includes('new_quantity_below_zero')) throw new Error("Stock insuffisant pour ce retrait.");
                      if (rpcError.message.includes('component_not_found')) throw new Error("Composant non trouvé (peut-être supprimé ?).");
                      // Erreur générique RPC
                      throw new Error(`Erreur RPC: ${rpcError.message} (Code: ${rpcError.code})`);
                  }

                  // Succès de la RPC
                  showAdminFeedback(`Quantité pour "${ref}" mise à jour. Nouvelle quantité: ${newQuantity}.`, 'success');

                  // Mettre à jour l'UI dans la section admin
                  currentQuantitySpan.textContent = newQuantity;
                  quantityChangeInput.value = 0; // Réinitialiser le champ de changement
                  // Mettre aussi à jour le champ "Quantité initiale/actuelle" du formulaire principal
                  if (componentInitialQuantityInput) componentInitialQuantityInput.value = newQuantity;

                  // Mettre à jour les autres vues si nécessaire
                  if (inventoryView.classList.contains('active-view')) await displayInventory(currentInventoryPage);
                  if (auditView.classList.contains('active-view')) await displayAudit(); // Recharger audit aussi
                  if (logView.classList.contains('active-view')) await displayLog(1); // Aller à la première page du log
                  if(lastDisplayedDrawerRef === ref) await updateSevenSegmentForComponent(ref); // MàJ 7 segments si affiché

                  // Mettre à jour la quantité dans le kit si l'item y est
                  const kitIndex = currentKitSelection.findIndex(k => k.ref === ref);
                  if (kitIndex > -1) {
                      currentKitSelection[kitIndex].quantity = newQuantity;
                      if (kitView.classList.contains('active-view')) displayCurrentKitDrawers();
                  }

              } catch (err) {
                  console.error("Erreur lors de la mise à jour rapide de quantité:", err);
                  showAdminFeedback(`Erreur MàJ "${ref}": ${err.message}`, 'error');
              } finally {
                  // Réactiver les boutons (sauf si le composant n'existe plus)
                  updateQuantityButton.disabled = false;
                  // Réactiver Supprimer seulement si les actions rapides sont toujours visibles
                  if (componentActionsWrapper.style.display !== 'none') {
                    deleteComponentButton.disabled = false;
                  }
              }
         });

         // --- Soumission du Formulaire Principal (Ajout/Modification Composant) ---
         stockForm?.addEventListener('submit', async (event) => {
             event.preventDefault();
             if (!currentUser) { showAdminFeedback("Connexion requise.", 'error'); return; }

             // --- Récupération et Validation des Données ---
             const ref = componentRefAdminInput?.value.trim().toUpperCase();
             const categoryId = componentCategorySelectAdmin?.value || null; // null si non sélectionné
             const description = componentDescInput?.value.trim() || null;
             const manufacturer = componentMfgInput?.value.trim() || null;
             const datasheet = componentDatasheetInput?.value.trim() || null;
             const drawer = componentDrawerAdminInput?.value.trim().toUpperCase() || null;
             const quantityRaw = componentInitialQuantityInput?.value;
             const thresholdRaw = componentThresholdInput?.value.trim();

             // Validations de base
             if (!ref) { showAdminFeedback("La référence composant est requise.", 'error'); componentRefAdminInput.focus(); return; }
             if (ref.length > 50) { showAdminFeedback("La référence est trop longue (max 50).", "error"); componentRefAdminInput.focus(); return; }

             const quantity = parseInt(quantityRaw, 10);
             if (quantityRaw === '' || quantityRaw === null || isNaN(quantity) || quantity < 0) {
                 showAdminFeedback("La quantité doit être un nombre positif ou zéro.", 'error');
                 componentInitialQuantityInput.focus();
                 return;
             }

             if (datasheet) {
                 try { new URL(datasheet); } catch (_) {
                     showAdminFeedback("L'URL de la datasheet n'est pas valide.", 'error');
                     componentDatasheetInput.focus();
                     return;
                 }
             }
             if (drawer && !/^[A-Z0-9\-]{1,10}$/.test(drawer)) {
                 // Exemple: Accepte lettres majuscules, chiffres, tiret, max 10 caractères
                 showAdminFeedback("Format du tiroir invalide (max 10, A-Z, 0-9, -).", "error");
                 componentDrawerAdminInput.focus();
                 return;
             }

             const critical_threshold = (thresholdRaw && !isNaN(parseInt(thresholdRaw)) && parseInt(thresholdRaw) >= 0)
                                        ? parseInt(thresholdRaw) : null;

             // Récupération des attributs spécifiques
             const attributes = {};
             let attributesValid = true;
             specificAttributesDiv?.querySelectorAll('input[data-attribute-name]').forEach(input => {
                 const name = input.dataset.attributeName;
                 let value = input.value.trim(); // Toujours récupérer comme string

                 // Stocker la valeur si elle n'est pas vide.
                 // La conversion en nombre/booléen se fera idéalement côté serveur ou lors de requêtes spécifiques.
                 // JSONB stocke tout de manière flexible. On enregistre la string ou null.
                 if (value !== '') {
                    // TODO : Valider le format si nécessaire pour certains attributs ? (ex: Nombre pour Capacité ?)
                    // Pour l'instant, on stocke la string telle quelle.
                    attributes[name] = value;
                 } else {
                     attributes[name] = null; // Stocker null si le champ est vide
                 }
             });

             if (!attributesValid) {
                 // Un message d'erreur plus spécifique aura été affiché lors de la validation
                 return;
             }

             // Utiliser null si l'objet attributes est vide
             const attributesToSave = Object.keys(attributes).length > 0 ? attributes : null;

             // --- Préparation de l'objet pour Supabase ---
             // On ne met PAS la quantité ici si on modifie, car elle est gérée par updateQuantityButton ou audit.
             // On ne la met QUE si c'est un NOUVEAU composant.
             const isEditing = componentActionsWrapper?.style.display === 'block'; // Est-on en mode édition ?

             const componentData = {
                 ref,
                 category_id: categoryId || null, // Assurer null si vide
                 description,
                 manufacturer,
                 datasheet,
                 drawer,
                 critical_threshold,
                 attributes: attributesToSave
                 // Ne pas inclure 'quantity' lors d'une modification via ce formulaire principal.
                 // Inclure 'quantity' seulement lors de la création.
             };

             if (!isEditing) {
                 componentData.quantity = quantity; // Ajouter la quantité seulement pour un NOUVEAU composant
                 console.log("Préparation ajout nouveau composant:", componentData);
                 showAdminFeedback(`Ajout du nouveau composant "${ref}"...`, 'info');
             } else {
                 console.log(`Préparation modification composant "${ref}":`, componentData);
                 showAdminFeedback(`Enregistrement des modifications pour "${ref}"...`, 'info');
             }


             // Désactiver les boutons pendant la sauvegarde
             saveComponentButton.disabled = true;
             checkStockButton.disabled = true;
             componentRefAdminInput.disabled = true;
             if(updateQuantityButton) updateQuantityButton.disabled = true;
             if(deleteComponentButton) deleteComponentButton.disabled = true;

             try {
                 // --- Appel Supabase : Upsert ---
                 // Upsert met à jour si la ref existe, ou insère si elle n'existe pas.
                 // Parfait pour gérer à la fois l'ajout et la modification des détails.
                 const { data: upsertedData, error: upsertError } = await supabase
                     .from('inventory')
                     .upsert(componentData, { onConflict: 'ref' }) // Conflit sur la clé primaire 'ref'
                     .select() // Retourner l'enregistrement inséré/mis à jour
                     .single(); // S'attendre à un seul résultat

                 if (upsertError) {
                     // Gérer les erreurs d'upsert
                     if (upsertError.message.includes('violates foreign key constraint') && upsertError.message.includes('category_id')) {
                         // Essayer de trouver le nom de la catégorie qui a posé problème
                         const failedCategoryOption = [...componentCategorySelectAdmin.options].find(opt => opt.value === categoryId);
                         const failedCategoryName = failedCategoryOption ? failedCategoryOption.textContent : categoryId;
                         throw new Error(`La catégorie sélectionnée "${failedCategoryName}" n'existe pas ou plus.`);
                     }
                     throw new Error(`Erreur base de données lors de l'enregistrement: ${upsertError.message} (Code: ${upsertError.code})`);
                 }

                 // --- Succès ---
                 const operationType = isEditing ? 'Modifié' : 'Ajouté';
                 showAdminFeedback(`Composant "${ref}" ${operationType} avec succès.`, 'success');

                 // Si c'était un ajout, un log pourrait être pertinent (mais pas géré par update_stock_and_log)
                 if (!isEditing) {
                     console.warn(`Log manuel pour ajout initial de quantité (${quantity}) pour ${ref} non implémenté ici. Utiliser la fonction RPC si nécessaire.`);
                     // Optionnel: Appeler addLogEntry ou une RPC spécifique pour logguer l'ajout initial
                     // await addLogEntry(ref, quantity, quantity, 'Admin Add New');
                 }

                 // --- Mise à jour UI ---
                 resetStockForm(); // Réinitialiser complètement le formulaire après succès
                 if (inventoryView.classList.contains('active-view')) await displayInventory(1); // Recharger inventaire
                 if (auditView.classList.contains('active-view')) await displayAudit(); // Recharger audit
                 if (logView.classList.contains('active-view')) await displayLog(1); // Recharger log si ajout loggé

                 // Mettre à jour le 7 segments si ce composant était affiché
                 await updateSevenSegmentForComponent(ref);

                 // Mettre à jour le composant dans le kit s'il y est
                 const kitIndex = currentKitSelection.findIndex(k => k.ref === ref);
                 if (kitIndex > -1) {
                     // Il faut recréer l'objet kit avec les nouvelles données (y compris category_name)
                     const updatedItemForKit = await getStockInfoFromSupabase(ref); // Récupérer les données complètes
                     if (updatedItemForKit) {
                         currentKitSelection[kitIndex] = updatedItemForKit;
                     } else {
                         // Si l'item n'est plus trouvé (ne devrait pas arriver après upsert), le retirer du kit
                         currentKitSelection.splice(kitIndex, 1);
                     }
                     if (kitView.classList.contains('active-view')) displayCurrentKitDrawers();
                 }

             } catch (err) {
                 console.error("Erreur lors de l'enregistrement du composant:", err);
                 showAdminFeedback(`Erreur enregistrement "${ref}": ${err.message}`, 'error');
                 // Laisser les boutons désactivés ? Ou les réactiver ?
                 // Réactiver permet à l'utilisateur de corriger et réessayer.
                 saveComponentButton.disabled = false;
                 checkStockButton.disabled = false;
                 componentRefAdminInput.disabled = false;
                 if (isEditing) { // Réactiver actions rapides seulement si on était en édition
                    if(updateQuantityButton) updateQuantityButton.disabled = false;
                    if(deleteComponentButton) deleteComponentButton.disabled = false;
                 }
             }
             // finally { // Le 'finally' ici pourrait réactiver des boutons trop tôt
             // }
         });

         // --- Bouton Supprimer Composant ---
         deleteComponentButton?.addEventListener('click', async () => {
             const refElement = document.getElementById('component-ref-display');
             const ref = refElement?.textContent;

             if (!ref || ref === 'N/A') { showAdminFeedback("Référence composant inconnue pour la suppression.", 'error'); return; }
             if (!currentUser) { showAdminFeedback("Connexion requise pour supprimer.", 'error'); return; }

             if (!confirm(`ATTENTION !\nÊtes-vous sûr de vouloir supprimer définitivement le composant "${ref}" et tout son historique associé ?\n\nCette action est IRRÉVERSIBLE.`)) {
                 return; // Annulation par l'utilisateur
             }

             showAdminFeedback(`Suppression de "${ref}" et de son historique en cours...`, 'info');
             // Désactiver tous les boutons pendant l'opération
             deleteComponentButton.disabled = true;
             updateQuantityButton.disabled = true;
             saveComponentButton.disabled = true;
             checkStockButton.disabled = true;
             componentRefAdminInput.disabled = true;

             try {
                 // 1. Supprimer l'historique associé (table 'log')
                 //    Il est préférable de faire cela avant de supprimer le composant lui-même
                 //    pour éviter les problèmes de contraintes FK si jamais elles existaient.
                 console.log(`Suppression de l'historique (log) pour ${ref}...`);
                 const { error: deleteLogError } = await supabase
                     .from('log')
                     .delete()
                     .eq('item_ref', ref);

                 // Logguer une erreur si la suppression du log échoue, mais continuer quand même
                 // (la suppression du composant est prioritaire)
                 if (deleteLogError) {
                     console.warn(`Erreur (non bloquante) lors de la suppression de l'historique pour ${ref}: ${deleteLogError.message}`);
                 } else {
                     console.log(`Historique pour ${ref} supprimé.`);
                 }

                 // 2. Supprimer le composant de la table 'inventory'
                 console.log(`Suppression du composant ${ref} de l'inventaire...`);
                 const { error: deleteInvError } = await supabase
                     .from('inventory')
                     .delete()
                     .eq('ref', ref);

                 // Gérer les erreurs de suppression de l'inventaire
                 if (deleteInvError && deleteInvError.code === 'PGRST116') {
                     // Cas où le composant n'a pas été trouvé (peut-être déjà supprimé ?)
                     showAdminFeedback(`Composant "${ref}" non trouvé (peut-être déjà supprimé).`, 'warning');
                 } else if (deleteInvError) {
                     // Autre erreur de base de données
                     throw new Error(`Erreur lors de la suppression du composant dans la base de données: ${deleteInvError.message}`);
                 } else {
                     // Succès de la suppression
                     showAdminFeedback(`Composant "${ref}" et son historique supprimés avec succès.`, 'success');
                 }

                 // 3. Réinitialiser l'interface et mettre à jour les vues
                 resetStockForm(); // Réinitialiser le formulaire admin

                 // Si le composant supprimé était affiché sur le 7 segments, l'éteindre
                 if(lastDisplayedDrawerRef === ref) updateSevenSegmentForComponent(null);

                 // Recharger les vues potentiellement affectées
                 if (inventoryView.classList.contains('active-view')) await displayInventory(1);
                 if (auditView.classList.contains('active-view')) await displayAudit();
                 if (logView.classList.contains('active-view')) await displayLog(1); // Recharger le log (qui devrait être vide pour ce ref)

                 // Retirer le composant du kit s'il y était
                 const indexInKit = currentKitSelection.findIndex(k => k.ref === ref);
                 if (indexInKit > -1) {
                     currentKitSelection.splice(indexInKit, 1);
                     if (kitView.classList.contains('active-view')) displayCurrentKitDrawers();
                 }

             } catch (err) {
                 console.error("Erreur lors de la suppression du composant:", err);
                 showAdminFeedback(`Erreur lors de la suppression de "${ref}": ${err.message}`, 'error');
                 // En cas d'erreur, réactiver les contrôles pour permettre une nouvelle tentative ?
                 // Probablement seulement le bouton 'Vérifier' et la ref.
                 checkStockButton.disabled = false;
                 componentRefAdminInput.disabled = false;
                 // Laisser les autres désactivés car l'état est incertain.
             } finally {
                 // Ne rien réactiver ici, le reset ou l'erreur gère l'état final.
             }
         });

         // --- Bouton Export Stock Critique ---
         exportCriticalButton?.addEventListener('click', handleExportCriticalStockTXT);
    }
    async function handleExportCriticalStockTXT() {
         if (!exportCriticalFeedbackDiv) return;
         exportCriticalFeedbackDiv.textContent = 'Export du stock critique en cours...';
         exportCriticalFeedbackDiv.className = 'feedback-area info';
         exportCriticalFeedbackDiv.style.display = 'block';

         try {
             // Récupérer tous les items avec les colonnes nécessaires
             const { data, error } = await supabase
                 .from('inventory')
                 .select('ref, description, quantity, critical_threshold, drawer')
                 .order('ref'); // Trier par référence pour la lisibilité

             if (error) throw new Error(`Erreur fetch inventaire: ${error.message}`);
             if (!data || data.length === 0) {
                 exportCriticalFeedbackDiv.textContent = 'L\'inventaire est vide.';
                 exportCriticalFeedbackDiv.className = 'feedback-area warning';
                 return;
             }

             // Filtrer les items critiques côté client
             const criticalItems = data.filter(item => {
                 const qty = item.quantity;
                 const threshold = item.critical_threshold;
                 // Est critique si quantité <= 0 OU si seuil défini ET quantité <= seuil
                 if (qty <= 0) return true;
                 if (threshold !== null && threshold >= 0 && qty <= threshold) return true;
                 return false;
             });

             if (criticalItems.length === 0) {
                 exportCriticalFeedbackDiv.textContent = 'Aucun composant en état critique trouvé.';
                 exportCriticalFeedbackDiv.className = 'feedback-area info'; // Info, pas succès
                 return;
             }

             // Construire le contenu du fichier texte
             let fileContent = `Rapport StockAV - Composants Critiques (${new Date().toLocaleString('fr-FR')})\n`;
             fileContent += `======================================================================\n\n`;

             criticalItems.forEach(item => {
                 const status = item.quantity <= 0 ? "!! RUPTURE DE STOCK !!" : "** STOCK FAIBLE **";
                 fileContent += `Référence:    ${item.ref}\n`;
                 fileContent += `Description:  ${item.description || '-'}\n`;
                 fileContent += `Tiroir:       ${item.drawer || 'N/A'}\n`;
                 fileContent += `Quantité:     ${item.quantity}\n`;
                 fileContent += `Seuil critique: ${item.critical_threshold ?? 'Non défini'}\n`;
                 fileContent += `STATUT:       ${status}\n`;
                 fileContent += `----------------------------------------------------------------------\n`;
             });

             // Générer et télécharger le fichier
             const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
             const filename = `stockav_critique_${timestamp}.txt`;
             downloadFile(filename, fileContent, 'text/plain;charset=utf-8');

             exportCriticalFeedbackDiv.textContent = `Export TXT (${criticalItems.length} composants critiques) réussi.`;
             exportCriticalFeedbackDiv.className = 'feedback-area success';

         } catch (err) {
             console.error("Erreur lors de l'export du stock critique:", err);
             exportCriticalFeedbackDiv.textContent = `Erreur lors de l'export: ${err.message}`;
             exportCriticalFeedbackDiv.className = 'feedback-area error';
         }
     }

    // --- VUE RECHERCHE (CHAT IA) ---
    // (addMessageToChat, displayWelcomeMessage, handleUserInput, extractReference, checkComponentWithAI, promptLoginBeforeAction, provideExternalLinksHTML, handleQuantityResponse, resetConversationState - Inchangé)
    async function addMessageToChat(sender, messageContent, isHTML = false) {
        if (!responseOutputChat) return;
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender); // 'user' or 'ai'

        if (isHTML) {
            // Basic sanitization: remove script tags
            const sanitizedHTML = messageContent.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
            // Use Range API to create a document fragment (safer than innerHTML directly)
>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99
            try {
                const fragment = document.createRange().createContextualFragment(sanitizedHTML);
                messageDiv.appendChild(fragment);
            } catch (e) {
                console.error("Error parsing chat HTML:", e);
                messageDiv.textContent = "[Erreur affichage message HTML]";
            }
        } else {
            messageDiv.textContent = messageContent;
        }
<<<<<<< HEAD
        responseOutputChat.insertBefore(messageDiv, responseOutputChat.firstChild);
        const role = sender === 'user' ? 'user' : 'assistant';
        chatHistory.push({ role: role, content: messageContent });
        if(chatHistory.length > 20) chatHistory.shift();
=======

        // Add message to the top of the chat
        responseOutputChat.insertBefore(messageDiv, responseOutputChat.firstChild);

        // Add to history (for potential future context)
        chatHistory.push({ role: sender === 'user' ? 'user' : 'assistant', content: messageContent });

        // Limit messages in DOM to prevent performance issues
>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99
        const maxMessagesInDOM = 50;
        while (responseOutputChat.children.length > maxMessagesInDOM) {
            responseOutputChat.removeChild(responseOutputChat.lastChild);
        }
<<<<<<< HEAD
        responseOutputChat.scrollTop = 0;
    }
    function displayWelcomeMessage() {
        // ... code inchangé ...
        if (!responseOutputChat) return;
        responseOutputChat.innerHTML = '';
        chatHistory = [];
        resetConversationState();
        addMessageToChat('ai', "Bonjour ! Entrez une référence composant pour obtenir des informations ou trouver des équivalents.");
        if(componentInputChat) { componentInputChat.value = ''; componentInputChat.focus();}
    }
     async function handleUserInput() {
         // ... code inchangé ...
        if (!componentInputChat || !searchButtonChat || !loadingIndicatorChat || !responseOutputChat) {
            console.error("handleUserInput: Un ou plusieurs éléments DOM sont manquants.");
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
            if (conversationState.awaitingQuantityConfirmation) {
                console.log("handleUserInput: Attente de confirmation de quantité détectée. Appel de handleQuantityResponse.");
                await handleQuantityResponse(userMessageContent);
                return;
            }
            const potentialRef = extractReference(userMessageContent);
            let isComponentSearch = false;
            if (potentialRef) {
                const simpleSearchPattern = new RegExp(`^${potentialRef}(\\s*\\?)?(\\s+(DISPO|STOCK|EQUIV|EQUIVALENT|CHERCHE|FIND|SEARCH|AVAILABLE))?$`, 'i');
                if (simpleSearchPattern.test(userMessageContent)) {
                     isComponentSearch = true;
                     console.log("Intention détectée : Recherche Composant (Pattern simple détecté).");
                } else {
                    isComponentSearch = false;
                    console.log("Intention détectée : Question Générale (Référence trouvée mais message plus complexe).");
                }
            } else {
                isComponentSearch = false;
                console.log("Intention détectée : Question Générale (pas de référence).");
            }
            resetConversationState();
            if (isComponentSearch && potentialRef) {
                loadingIndicatorChat.querySelector('i').textContent = `Recherche ${potentialRef}...`;
                conversationState.originalRefChecked = potentialRef;
                await checkComponentWithAI(potentialRef);
            } else {
                loadingIndicatorChat.querySelector('i').textContent = 'StockAV réfléchit...';
                const HISTORY_LENGTH = 10;
                const recentHistory = chatHistory.slice(-HISTORY_LENGTH);
                console.log("Sending history to ai-general-chat:", recentHistory);
                const { data: chatData, error: chatError } = await supabase.functions.invoke('ai-general-chat', {
                    body: { query: userMessageContent, history: recentHistory }
                });
                if (chatError) {
                     let detail = chatError.message || "Erreur inconnue";
                     if (chatError instanceof Error && 'message' in chatError && typeof chatError.message === 'string' && chatError.message.includes("Failed to send")) {
                         detail = "Impossible d'envoyer la requête à la fonction Edge.";
                         console.error("Vérifiez la connectivité réseau et les logs Supabase.");
                     } else if (chatError instanceof Error && 'message' in chatError && typeof chatError.message === 'string' && chatError.message.includes("non-2xx status code")) {
                          detail = "Le service IA a retourné une erreur.";
                          console.error("Vérifiez les logs serveur Supabase pour 'ai-general-chat' ! Cause probable: Secrets invalides ou erreur interne IA/fonction.");
                     }
                     throw new Error(`Erreur appel fonction chat: ${detail}`);
                }
                if (chatData.error) {
                    console.error("Erreur retournée par la fonction Edge 'ai-general-chat':", chatData.error);
                    throw new Error(`Erreur retournée par fonction chat: ${chatData.error}`);
                }
                if (chatData.reply) {
                    await addMessageToChat('ai', chatData.reply, false);
                } else {
                    await addMessageToChat('ai', "Désolé, je n'ai pas pu obtenir de réponse.", false);
                }
            }
        } catch (error) {
             console.error("Erreur majeure handleUserInput:", error);
             await addMessageToChat('ai', `Oups ! Erreur technique: ${error.message}.`);
             resetConversationState();
        } finally {
             componentInputChat.disabled = false;
             searchButtonChat.disabled = false;
             loadingIndicatorChat.style.display = 'none';
             componentInputChat.focus();
        }
    }
    function extractReference(text) {
         // ... code inchangé ...
        const upperText = text.toUpperCase();
        let bestMatch = null;
        const patterns=[
            /\b(STM32[A-Z]\d{2,}[A-Z\d]{1,6})\b/,
            /\b(PIC\s?(?:[1-3]\d[A-Z\d]{2,7}|[1-3]\d[A-Z]?LF\d{3,6}))\b/,
            /\b(ESP(?:-)?(?:32|8266|32-S\d|32-C\d)(?:-[A-Z\d]{1,8})?)\b/,
            /\b(AT(?:MEGA|TINY|XMEGA)\s?\d+[A-Z\d\-]{0,5})\b/,
            /\b(SN\s?74[A-Z\d]{2,8})\b/,
            /\b(CD\s?4\d{3,4}[A-Z]{1,3})\b/,
            /\b((?:LM|NE|UA|TL|LF|TLC|OP|MCP)\s?\d{2,4}[A-Z\d\-/]{0,6})\b/,
            /\b(MAX\s?\d{3,5}[A-Z\d\-/]{0,6})\b/,
            /\b((?:[1-9]N|[2-9]SD|[2-9]SA|[2-9]SC|[2-9]SJ|[Bb][CDUFT])\s?\d{3,4}[A-Z\d\-]{0,4})\b/, // Transistors, diodes
            /\b(IRF[A-Z\d]{3,7})\b/, // MOSFETs
            /\b(MOC\s?\d{4}[A-Z\d]{0,3})\b/, // Optocouplers
            /\b(\d+(?:\.\d+)?\s?(?:[GMK]?HZ))\b/i, // Fréquences
            /\b(\d+(?:\.\d+)?\s?(?:[KMR]?)\s?OHMS?)\b/i, // Résistances
            /\b(\d+(?:\.\d+)?\s?(?:[PFNµU]|MF)\s?F?)\b/i, // Capacités
            /\b(\d+(?:\.\d+)?\s?(?:[MUN]?H))\b/i, // Inductances
            /\b(\d+(?:\.\d+)?\s?V)\b/i, // Tensions
            /\b(\d+(?:\.\d+)?\s?W)\b/i, // Puissances
            /\b(\d+(?:\.\d+)?\s?(?:M?A))\b/i, // Courants
            /\b([A-Z]{2,}\d{2,}[A-Z\d\-/]*)\b/,
            /\b(\d{2,}[A-Z]{1,}[A-Z\d\-/]*)\b/,
            /\b([A-Z]{1,}\d{3,}[A-Z\d\-/]*)\b/
        ];
        const ignoreWords=new Set(['POUR','AVEC','COMBIEN','STOCK','CHERCHE','RECHERCHE','DISPO','EQUIV','REMPLACE','TROUVE','QUEL','EST','QUE','SONT','LES','DU','UN','UNE','OU','ET','LE','LA','DE','À','PLUS','MOINS','PEUT','IL','ELLE','ON','JE','TU','COMME','DANS','SUR','VOLTS','AMPERES','WATTS','OHMS','FARADS','HENRYS','TYPE','VALEUR','REFERENCE','COMPOSANT','PIECE','REF','DESCRIPTION','DONNE','MOI','TOUS','DES','MES','TES','SES','NOS','VOS','LEURS']);

        for(const pattern of patterns){
            const match=upperText.match(pattern);
            if(match && match[1]){
                let potentialRef = match[1].replace(/\s+/g, '');
                if (potentialRef.length >= 3 && /[A-Z]/i.test(potentialRef) && !/^\d+$/.test(potentialRef) && !ignoreWords.has(potentialRef)) {
                    if (!bestMatch || potentialRef.length > bestMatch.length) {
                        bestMatch = potentialRef;
                    }
                }
            }
        }
        if (!bestMatch) {
            const words = upperText.split(/[\s,;:!?()]+/);
            const potentialRefs = words.filter(w =>
                w.length >= 3 && /\d/.test(w) && /[A-Z]/i.test(w) && !/^\d+[.,]?\d*[A-Z]{0,3}$/.test(w) && !ignoreWords.has(w)
            );
            if (potentialRefs.length > 0) {
                potentialRefs.sort((a, b) => b.length - a.length);
                bestMatch = potentialRefs[0];
            }
        }
        console.log(`Référence extraite: "${bestMatch || 'Aucune'}"`);
        return bestMatch;
    }
    async function checkComponentWithAI(originalRef) {
         // ... code inchangé ...
        if (!responseOutputChat || !loadingIndicatorChat || !supabase) return;
        loadingIndicatorChat.style.display = 'block';
        loadingIndicatorChat.querySelector('i').textContent = `Analyse stock local ${originalRef}...`;
        let originalStockInfo = null;
        let equivalents = [];
        let aiError = null;
        let responseHTML = "";
        try {
            originalStockInfo = await getStockInfoFromSupabase(originalRef);
            await delay(150);
            if (originalStockInfo) { updateSevenSegmentForComponent(originalStockInfo.ref); } else { updateSevenSegmentForComponent(null); }
            const showDrawer = currentUser && originalStockInfo?.drawer;
            let originalStatusHTML = "";
            if (originalStockInfo) {
                const indicatorHTML = createStockIndicatorHTML(originalStockInfo.quantity, originalStockInfo.critical_threshold);
                const catName = originalStockInfo.category_name || 'N/A';
                const typeAttr = originalStockInfo.attributes?.Type || '';
                if (originalStockInfo.quantity > 0) {
                    originalStatusHTML = `${indicatorHTML} Original <strong>${originalRef}</strong> : Dispo (Qté: ${originalStockInfo.quantity}, Cat: ${catName}${typeAttr ? `/${typeAttr}` : ''}${showDrawer ? `, Tiroir: ${originalStockInfo.drawer}` : ''}).`;
                    conversationState.criticalThreshold = originalStockInfo.critical_threshold;
                } else { originalStatusHTML = `${indicatorHTML} Original <strong>${originalRef}</strong> : Rupture stock local.`; }
                if (originalStockInfo.description) originalStatusHTML += `<br/><small><i>Desc: ${escapeHtml(originalStockInfo.description)}</i></small>`;
                if (originalStockInfo.datasheet) originalStatusHTML += ` <a href="${escapeHtml(originalStockInfo.datasheet)}" target="_blank" rel="noopener noreferrer" class="external-link-inline">[Datasheet]</a>`;
            } else { originalStatusHTML = `${createStockIndicatorHTML(undefined, undefined)} Original <strong>${originalRef}</strong> : Non trouvé dans le stock local.`; }
            responseHTML += originalStatusHTML;

            if (supabase) {
                loadingIndicatorChat.querySelector('i').textContent = `Recherche équivalents IA pour ${originalRef}...`;
                try {
                    console.log(`Appel fonction Edge 'ai-component-info' pour: ${originalRef}`);
                    const { data: aiResult, error: edgeError } = await supabase.functions.invoke('ai-component-info', { body: { reference: originalRef } });
                    if (edgeError) throw new Error(edgeError.message || "Erreur appel fonction Edge IA.");
                    if (aiResult && aiResult.error) throw new Error(aiResult.error);
                    equivalents = aiResult?.equivalents || [];
                    console.log("Equivalents suggérés par IA:", equivalents);
                } catch (error) { aiError = error.message; console.error("Erreur fonction Edge IA:", aiError); }
            } else { aiError = "Client Supabase non initialisé, recherche IA impossible."; }

            let equivalentsStockInfo = {};
            if (equivalents.length > 0 && supabase) {
                loadingIndicatorChat.querySelector('i').textContent = `Vérification stock des équivalents...`;
                const equivalentRefs = equivalents.map(eq => eq.ref).filter(ref => ref && ref.toUpperCase() !== originalRef.toUpperCase());
                if (equivalentRefs.length > 0) {
                    const stockCheckPromises = equivalentRefs.map(async ref => { const stockInfo = await getStockInfoFromSupabase(ref); return { ref, stockInfo }; });
                    const results = await Promise.all(stockCheckPromises);
                    results.forEach(({ ref, stockInfo }) => { if (stockInfo) { equivalentsStockInfo[ref] = stockInfo; } });
                    console.log("Stock local des équivalents:", equivalentsStockInfo);
                }
            }

            if (equivalents.length > 0) {
                responseHTML += "<br/><br/><strong>Équivalents suggérés par l'IA :</strong>";
                let foundAvailableEquivalent = false;
                equivalents.forEach(eq => {
                     if (!eq.ref || eq.ref.toUpperCase() === originalRef.toUpperCase()) return;
                     const eqStock = equivalentsStockInfo[eq.ref];
                     const eqIndicatorHTML = createStockIndicatorHTML(eqStock?.quantity, eqStock?.critical_threshold);
                     const eqShowDrawer = currentUser && eqStock?.drawer;
                     const eqCatName = eqStock?.category_name || 'N/A';
                     const eqTypeAttr = eqStock?.attributes?.Type || '';
                     responseHTML += `<div class="equivalent-item" style="margin-top: 8px; padding-left: 10px; border-left: 3px solid #eee;">`;
                     responseHTML += `${eqIndicatorHTML}<strong>${eq.ref}</strong> <small>(${(eq.reason || 'Suggestion AI').substring(0, 50)}${eq.reason && eq.reason.length > 50 ? '...' : ''})</small>`;
                     if (eqStock) {
                         responseHTML += `<br/><small><i>Cat: ${eqCatName}${eqTypeAttr ? `/${eqTypeAttr}` : ''}</i></small>`;
                         if (eqStock.quantity > 0) {
                             foundAvailableEquivalent = true;
                             responseHTML += ` : Dispo (Qté: ${eqStock.quantity}${eqShowDrawer ? `, Tiroir: ${eqStock.drawer}` : ''})`;
                             if (currentUser) { responseHTML += ` <button class="choice-button take-button" data-ref="${eq.ref}" data-qty="${eqStock.quantity}" data-threshold="${eqStock.critical_threshold ?? ''}" title="Sélectionner cet équivalent">Prendre</button>`; }
                         } else { responseHTML += ` : Rupture stock local.`; responseHTML += provideExternalLinksHTML(eq.ref, true); }
                     } else { responseHTML += ` : Non trouvé localement.`; responseHTML += provideExternalLinksHTML(eq.ref, true); }
                     responseHTML += `</div>`;
                 });
                 if (foundAvailableEquivalent || (originalStockInfo && originalStockInfo.quantity > 0)) { conversationState.awaitingEquivalentChoice = true; }
            } else if (!aiError) { responseHTML += "<br/><br/>L'IA n'a pas suggéré d'équivalents."; }

            if (originalStockInfo && originalStockInfo.quantity > 0) {
                if (currentUser) {
                    responseHTML += `<br/><br/><button class="choice-button take-button" data-ref="${originalRef}" data-qty="${originalStockInfo.quantity}" data-threshold="${originalStockInfo.critical_threshold ?? ''}" title="Sélectionner le composant original">Prendre original (${originalRef})</button>`;
                    conversationState.awaitingEquivalentChoice = true;
                } else { responseHTML += `<br/><br/><i>Original disponible. Connectez-vous pour pouvoir le prendre.</i>`; }
            }
            if (!originalStockInfo || originalStockInfo.quantity <= 0) { responseHTML += provideExternalLinksHTML(originalRef, false); }
            if (aiError) { responseHTML += `<br/><br/><i style="color: var(--error-color);">Erreur IA équivalents: ${aiError}.</i>`; }
            if (!conversationState.awaitingEquivalentChoice && !conversationState.awaitingQuantityConfirmation) { responseHTML += "<br/><br/>Autre recherche ?"; resetConversationState(); }
            else if (conversationState.awaitingEquivalentChoice && !currentUser) { responseHTML += `<br/><br/><i>Connectez-vous pour pouvoir choisir et prendre un composant.</i>`; }
        } catch (error) {
            console.error(`Erreur dans checkComponentWithAI pour ${originalRef}:`, error);
            responseHTML = `Erreur lors de la recherche de <strong>${originalRef}</strong>.<br>Détails: ${error.message}`;
            resetConversationState();
            updateSevenSegmentForComponent(null);
        } finally {
            loadingIndicatorChat.style.display = 'none';
            await addMessageToChat('ai', responseHTML, true);
        }
    }
    async function promptLoginBeforeAction(actionDesc) {
         // ... code inchangé ...
        await addMessageToChat('ai', `Vous devez être connecté pour ${actionDesc}.`);
        loginCodeInput?.focus();
    }
    function provideExternalLinksHTML(ref, inline = false) {
         // ... code inchangé ...
        if (!ref) return '';
        const encodedRef = encodeURIComponent(ref);
        const links = [
            { name: 'Mouser', url: `https://www.mouser.fr/Search/Refine?Keyword=${encodedRef}`, class: 'mouser' },
            { name: 'Digi-Key', url: `https://www.digikey.fr/fr/products/result?keywords=${encodedRef}`, class: 'digikey' },
            { name: 'LCSC', url: `https://lcsc.com/search?q=${encodedRef}`, class: 'lcsc' },
            { name: 'AliExpress', url: `https://www.aliexpress.com/wholesale?SearchText=${encodedRef}`, class: 'aliexpress' }
        ];
        let linksHTML = '';
        const linkItems = links.map(link => `<a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" class="external-link ${inline ? 'external-link-inline' : ''} ${link.class}" title="Chercher ${ref} sur ${link.name}">${link.name}</a>`).join(inline ? ' ' : '');
        if (inline) { linksHTML = `<span class="external-links-inline">[ ${linkItems} ]</span>`; }
        else { linksHTML = `<div class="external-links-block"><strong>Liens externes :</strong> ${linkItems}</div>`; }
        return linksHTML;
    }
    async function handleQuantityResponse(userInput) {
        // Le code ici mettait déjà à jour le kit si nécessaire, donc pas de changement
        const ref = conversationState.chosenRefForStockCheck;
        const maxQty = conversationState.availableQuantity;
        const threshold = conversationState.criticalThreshold;
        if (!conversationState.awaitingQuantityConfirmation || !ref || !currentUser) {
            console.warn("handleQuantityResponse appelé hors contexte.");
            if (!conversationState.awaitingQuantityConfirmation) { await handleUserInput(); }
            return;
        }
        const lowerInput = userInput.toLowerCase();
        if (lowerInput === 'non' || lowerInput === 'annuler' || lowerInput === '0' || lowerInput === 'cancel' || lowerInput === 'no') {
            await addMessageToChat('ai', "Ok, opération de prise de composant annulée.");
            resetConversationState(); updateSevenSegmentForComponent(null); await delay(300);
            await addMessageToChat('ai', "Besoin d'autre chose ?");
            return;
        }
        const match = userInput.match(/\d+/);
        const quantityToTake = match ? parseInt(match[0], 10) : NaN;
        if (isNaN(quantityToTake) || quantityToTake <= 0) {
            await addMessageToChat('ai', "Quantité non comprise. Veuillez entrer un nombre positif, ou 'non' pour annuler.");
            return;
        }
        if (quantityToTake > maxQty) {
            await addMessageToChat('ai', `Stock insuffisant. Il ne reste que ${maxQty} ${ref}. Combien voulez-vous en prendre (max ${maxQty}) ? Ou entrez 'non' pour annuler.`);
            return;
        }
        await addMessageToChat('ai', `Ok, enregistrement de la sortie de ${quantityToTake} x ${ref}...`);
        loadingIndicatorChat.style.display = 'block';
        loadingIndicatorChat.querySelector('i').textContent = `Mise à jour stock ${ref}...`;
        const change = -quantityToTake;
        try {
            console.log(`Calling RPC update_stock_and_log from Chat for ${ref}, change: ${change}`);
            const { data: newQuantity, error: rpcError } = await supabase.rpc('update_stock_and_log', { p_ref: ref, p_quantity_change: change, p_user_id: currentUser.id, p_user_code: currentUserCode, p_action_type: 'Chat Take Qty' });
            if (rpcError) { if (rpcError.message.includes('new_quantity_below_zero')) throw new Error("Stock devenu insuffisant (vérification RPC)."); if (rpcError.message.includes('component_not_found')) throw new Error("Composant non trouvé lors de la mise à jour."); throw new Error(`Erreur RPC: ${rpcError.message}`); }
            const statusIndicatorHTML = createStockIndicatorHTML(newQuantity, threshold);
            await addMessageToChat('ai', `${statusIndicatorHTML} Sortie enregistrée ! Stock restant pour <strong>${ref}</strong> : ${newQuantity}.`);
            if (inventoryView.classList.contains('active-view')) await displayInventory(currentInventoryPage);
            if (auditView.classList.contains('active-view')) await displayAudit();
            if (logView.classList.contains('active-view')) await displayLog(1);
            if (lastDisplayedDrawerRef === ref) await updateSevenSegmentForComponent(ref);
             const kitIndex = currentKitSelection.findIndex(k => k.ref === ref);
             if (kitIndex > -1) {
                 currentKitSelection[kitIndex].quantity = newQuantity;
                 await saveKitToSupabase();
                 if (kitView.classList.contains('active-view')) displayCurrentKitDrawers();
             }
        } catch (err) {
            console.error("Erreur lors de la mise à jour du stock via le chat:", err);
            await addMessageToChat('ai', `Désolé, une erreur est survenue : ${err.message}. L'opération a échoué.`);
        } finally {
            loadingIndicatorChat.style.display = 'none';
            resetConversationState();
            await delay(300);
            await addMessageToChat('ai', "Besoin d'autre chose ?");
        }
    }
    function resetConversationState() {
        // ... code inchangé ...
        conversationState = {
            awaitingEquivalentChoice: false, awaitingQuantityConfirmation: false,
            originalRefChecked: null, chosenRefForStockCheck: null,
            availableQuantity: 0, criticalThreshold: null
        };
        console.log("Conversation state reset.");
    }
    async function getStockInfoFromSupabase(ref) {
         // ... code inchangé ...
         if (!supabase) { console.error("getStockInfoFromSupabase: Supabase non initialisé."); return null; }
         if (!ref) { console.warn("getStockInfoFromSupabase: Référence manquante."); return null; }
         const upperRef = ref.toUpperCase();
         try {
             console.log(`getStockInfoFromSupabase: Fetching details for ${upperRef}...`);
             const { data, error } = await supabase.from('inventory').select(`*, categories ( name )`).eq('ref', upperRef).maybeSingle();
             if (error && error.code !== 'PGRST116') { throw new Error(`Erreur base de données getStockInfo: ${error.message}`); }
             if (data) {
                 data.category_name = data.categories?.name || null;
                 if (data.category_id) data.category_id = String(data.category_id);
                 delete data.categories;
                 console.log(`getStockInfoFromSupabase: Data found for ${upperRef}:`, data);
             }
             return data;
         } catch (err) { console.error(`Erreur JS dans getStockInfoFromSupabase pour ${upperRef}:`, err); return null; }
     }

    // --- Gestion Modale Quantité (+/-) ---
    // ... (handleInventoryRowClick, getBadgeClassForKey, showQuantityModal, hideQuantityModal, updateModalButtonStates, listeners +/-/Cancel/Overlay inchangés) ...
    // ... (listener Confirm inchangé car les modifs nécessaires pour le kit y étaient déjà) ...
     async function handleInventoryRowClick(event) {
        // ... code inchangé ...
        const row = event.target.closest('tr.inventory-item-row'); if (!row) return; if (event.target.classList.contains('kit-select-checkbox')) return; if (event.target.closest('a')) return; if (!currentUser) { showGenericError("Connectez-vous pour modifier les quantités."); loginCodeInput?.focus(); return; } const ref = row.dataset.ref; if (!ref) { console.error("Référence manquante sur la ligne d'inventaire:", row); showGenericError("Erreur: Référence interne manquante."); return; } console.log(`Clic sur ligne inventaire pour ouvrir modale: ${ref}`); row.style.cursor = 'wait';
        try { let itemData = null; if (row.dataset.itemData) { try { itemData = JSON.parse(row.dataset.itemData); if (!itemData || typeof itemData.quantity === 'undefined' ) { console.warn("Données partielles dans data-item-data, refetching...", itemData); itemData = null; } } catch(e) { console.warn("Erreur parsing itemData depuis l'attribut data-item-data:", e); itemData = null; } } if (!itemData) { console.log(`Données non trouvées ou incomplètes dans data-item-data pour ${ref}, refetching from Supabase...`); itemData = await getStockInfoFromSupabase(ref); } if (itemData) { updateSevenSegmentForComponent(itemData.ref); showQuantityModal(itemData.ref, itemData.quantity, itemData.attributes || {}); } else { console.error(`Impossible de récupérer les détails pour le composant ${ref}.`); showGenericError(`Erreur: Impossible de charger les détails pour ${ref}. L'inventaire va être rafraîchi.`); await displayInventory(currentInventoryPage); updateSevenSegmentForComponent(null); } } catch (error) { console.error(`Erreur lors du traitement du clic sur la ligne ${ref}:`, error); showGenericError(`Erreur lors de l'ouverture des détails de ${ref}: ${error.message}`); updateSevenSegmentForComponent(null); } finally { row.style.cursor = ''; }
    }
    function getBadgeClassForKey(key) {
        // ... code inchangé ...
         if (!key) return 'badge-color-default'; const lowerKey = key.toLowerCase(); if (lowerKey.includes('volt') || lowerKey.includes('tension')) return 'badge-color-red'; if (lowerKey.includes('package') || lowerKey.includes('boitier') || lowerKey.includes('format')) return 'badge-color-gray'; if (lowerKey.includes('type')) return 'badge-color-blue'; if (lowerKey.includes('capacit') || lowerKey.includes('valeur') || lowerKey.includes('r_sistance') || lowerKey.includes('inductance')) return 'badge-color-green'; if (lowerKey.includes('tol_rance')) return 'badge-color-yellow'; if (lowerKey.includes('puissance')) return 'badge-color-orange'; return 'badge-color-default';
    }
    function showQuantityModal(ref, quantity, attributes) {
        // ... code inchangé ...
        if (!quantityChangeModal || !modalOverlay || !modalRefSpan || !modalQtySpan) return; modalCurrentRef = ref; modalInitialQuantity = quantity; currentModalChange = 0; modalRefSpan.textContent = ref; modalQtySpan.textContent = quantity; modalChangeAmountDisplay.textContent = currentModalChange; if(modalFeedback) { modalFeedback.style.display = 'none'; modalFeedback.textContent = ''; } if (modalAttributesContainer && modalAttributesList && attributes && typeof attributes === 'object' && Object.keys(attributes).length > 0) { modalAttributesList.innerHTML = ''; Object.entries(attributes).forEach(([key, value]) => { if (value !== null && value !== undefined && String(value).trim() !== '') { const badge = document.createElement('span'); badge.classList.add('attribute-badge', getBadgeClassForKey(key)); badge.textContent = `${key}: ${value}`; badge.title = `${key}: ${value}`; modalAttributesList.appendChild(badge); } }); modalAttributesContainer.style.display = 'block'; } else { if (modalAttributesContainer) { modalAttributesContainer.style.display = 'none'; } if (attributes && typeof attributes !== 'object') { console.warn("Format d'attributs invalide pour la modale:", attributes); } } updateModalButtonStates(); modalOverlay.classList.add('active'); quantityChangeModal.classList.add('active'); modalIncreaseButton?.focus();
    }
    function hideQuantityModal() {
        // ... code inchangé ...
        if (!quantityChangeModal || !modalOverlay) return; modalOverlay.classList.remove('active'); quantityChangeModal.classList.remove('active'); modalCurrentRef = null; modalInitialQuantity = 0; currentModalChange = 0;
    }
    function updateModalButtonStates() {
        // ... code inchangé ...
        if (!modalDecreaseButton || !modalIncreaseButton || !modalConfirmButton) return; const potentialNewQuantity = modalInitialQuantity + currentModalChange; modalDecreaseButton.disabled = potentialNewQuantity <= 0; modalIncreaseButton.disabled = false; modalConfirmButton.disabled = currentModalChange === 0;
    }
    modalDecreaseButton?.addEventListener('click', () => {
        // ... code inchangé ...
        if (modalInitialQuantity + currentModalChange > 0) { currentModalChange--; modalChangeAmountDisplay.textContent = currentModalChange; updateModalButtonStates(); }
    });
    modalIncreaseButton?.addEventListener('click', () => {
        // ... code inchangé ...
        currentModalChange++; modalChangeAmountDisplay.textContent = currentModalChange; updateModalButtonStates();
    });
    modalCancelButton?.addEventListener('click', hideQuantityModal);
    modalOverlay?.addEventListener('click', (event) => {
        // ... code inchangé ...
        if(event.target === modalOverlay) { hideQuantityModal(); }
    });
    modalConfirmButton?.addEventListener('click', async () => {
        // Le code ici mettait déjà à jour le kit si nécessaire, donc pas de changement
        if (!modalCurrentRef || currentModalChange === 0 || !currentUser) { console.warn("Conditions non remplies pour confirmer la modale."); return; }
        const ref = modalCurrentRef;
        const change = currentModalChange;
        const initialQtyBeforeUpdate = modalInitialQuantity;
        if (modalFeedback) { modalFeedback.textContent = `Mise à jour du stock pour ${ref} (${change > 0 ? '+' : ''}${change})...`; modalFeedback.className = 'modal-feedback info'; modalFeedback.style.display = 'block'; }
        modalConfirmButton.disabled = true; modalCancelButton.disabled = true; modalDecreaseButton.disabled = true; modalIncreaseButton.disabled = true;
        try {
            console.log(`Calling RPC update_stock_and_log from modal for ${ref}, change: ${change}`);
            const { data: newQuantity, error: rpcError } = await supabase.rpc('update_stock_and_log', { p_ref: ref, p_quantity_change: change, p_user_id: currentUser.id, p_user_code: currentUserCode, p_action_type: 'Modal Adjust' });
            if (rpcError) { if (rpcError.message.includes('new_quantity_below_zero')) throw new Error("Stock insuffisant (vérification RPC)."); if (rpcError.message.includes('component_not_found')) throw new Error("Composant non trouvé (peut-être supprimé ?)."); throw new Error(`Erreur RPC: ${rpcError.message}`); }
            if (modalFeedback) { modalFeedback.textContent = `Stock mis à jour: ${initialQtyBeforeUpdate} -> ${newQuantity}.`; modalFeedback.className = 'modal-feedback success'; }
            modalQtySpan.textContent = newQuantity;
            modalInitialQuantity = newQuantity;
            currentModalChange = 0;
            modalChangeAmountDisplay.textContent = '0';
            updateModalButtonStates();
            modalCancelButton.disabled = false;
            if (inventoryView.classList.contains('active-view')) await displayInventory(currentInventoryPage);
            if (auditView.classList.contains('active-view')) await displayAudit();
            if (logView.classList.contains('active-view')) await displayLog(1);
            if (lastDisplayedDrawerRef === ref) await updateSevenSegmentForComponent(ref);
            const kitIndex = currentKitSelection.findIndex(k => k.ref === ref);
            if (kitIndex > -1) {
                currentKitSelection[kitIndex].quantity = newQuantity;
                await saveKitToSupabase();
                if (kitView.classList.contains('active-view')) displayCurrentKitDrawers();
            }
        } catch (err) { console.error("Erreur lors de la confirmation de la modale:", err); if (modalFeedback) { modalFeedback.textContent = `Erreur: ${err.message}`; modalFeedback.className = 'modal-feedback error'; } else { showGenericError(`Erreur modale (${ref}): ${err.message}`); } modalConfirmButton.disabled = (currentModalChange === 0); modalCancelButton.disabled = false; const potentialQtyBeforeError = modalInitialQuantity + currentModalChange; modalDecreaseButton.disabled = potentialQtyBeforeError <= 0; modalIncreaseButton.disabled = false; }
    });


    // --- Gestion Afficheur 7 Segments ---
    // ... (segmentMap, updateSevenSegmentForComponent, updateSevenSegmentDisplayVisuals inchangés) ...
    const segmentMap = { /* ... map inchangée ... */ '0':'abcdef', '1':'bc', '2':'abged', '3':'abcdg', '4':'fgbc', '5':'afgcd', '6':'afgcde', '7':'abc', '8':'abcdefg', '9':'abcdfg', 'A':'abcefg', 'B':'fcdeg', 'C':'afed', 'D':'bcdeg', 'E':'afged', 'F':'afge', 'G':'afcde', 'H':'fbceg', 'I':'bc', 'J':'bcde', 'K':'afceg', 'L':'fed', 'M':'aceg', 'N':'abcef', 'O':'abcdef', 'P':'abfeg', 'Q':'abcdfg', 'R':'afge', 'S':'afgcd', 'T':'fged', 'U':'bcdef', 'V':'bcef', 'W':'bdfg', 'X':'fageb', 'Y':'fgbcd', 'Z':'abdeg', '-': 'g', '_': 'd', '.': 'g', '?': 'abgedg', ' ':'', };
    async function updateSevenSegmentForComponent(ref) {
        // ... code inchangé ...
         if (!sevenSegmentDisplay || !currentUser) { lastDisplayedDrawerRef = null; lastDisplayedDrawerThreshold = null; if (sevenSegmentDisplay) updateSevenSegmentDisplayVisuals('    ', 'off'); return; } lastDisplayedDrawerRef = ref; if (!ref) { updateSevenSegmentDisplayVisuals('----', 'off'); lastDisplayedDrawerThreshold = null; return; } try { const { data: item, error } = await supabase.from('inventory').select('drawer, quantity, critical_threshold').eq('ref', ref).maybeSingle(); if (error && error.code !== 'PGRST116') { throw new Error(`Erreur DB récupération 7seg: ${error.message}`); } if (item && item.drawer) { const drawer = item.drawer.toUpperCase().replace(/\s/g, '_').slice(0, 4).padEnd(4, ' '); const status = getStockStatus(item.quantity, item.critical_threshold); lastDisplayedDrawerThreshold = item.critical_threshold; updateSevenSegmentDisplayVisuals(drawer, status); } else if (item && !item.drawer) { updateSevenSegmentDisplayVisuals('----', 'unknown'); lastDisplayedDrawerThreshold = item.critical_threshold; } else { console.log(`7seg: Composant ${ref} non trouvé.`); updateSevenSegmentDisplayVisuals('NFND', 'critical'); lastDisplayedDrawerThreshold = null; } } catch (err) { console.error(`Erreur mise à jour 7 segments pour ${ref}:`, err); updateSevenSegmentDisplayVisuals('ERR ', 'critical'); lastDisplayedDrawerThreshold = null; }
    }
    function updateSevenSegmentDisplayVisuals(drawerValue, status = 'unknown') {
        // ... code inchangé ...
        if (!sevenSegmentDisplay || !segmentDigits || segmentDigits.length < 4) return; if (status === 'off' || !drawerValue || String(drawerValue).trim() === '') { sevenSegmentDisplay.className = 'seven-segment-display display-off'; status = 'off'; } else { sevenSegmentDisplay.className = 'seven-segment-display'; sevenSegmentDisplay.classList.add(`status-${status}`); } for (let i = 0; i < 4; i++) { const digitElement = segmentDigits[i]; if (!digitElement) continue; const char = (drawerValue[i] || ' ').toUpperCase(); const segmentsOn = segmentMap[char] ?? segmentMap['?']; ['a', 'b', 'c', 'd', 'e', 'f', 'g'].forEach(seg => { const segmentElement = digitElement.querySelector(`.segment-${seg}`); if (segmentElement) { if (status !== 'off' && segmentsOn.includes(seg)) { segmentElement.classList.add('on'); } else { segmentElement.classList.remove('on'); } } }); }
    }


    // --- Logique pour la vue Paramètres ---
    // ... (loadSettingsData, showSettingsFeedback, downloadFile, handleExportInventoryCSV, handleExportLogTXT inchangés) ...
    // ... (handleImportInventoryCSV, resetImportState, addSettingsEventListeners inchangés) ...
    function loadSettingsData() { console.log("Vue Paramètres chargée."); if(exportFeedbackDiv) { exportFeedbackDiv.style.display = 'none'; exportFeedbackDiv.textContent = '';} if(importFeedbackDiv) { importFeedbackDiv.style.display = 'none'; importFeedbackDiv.textContent = '';} resetImportState(); }
    function showSettingsFeedback(type, message, level = 'info') { let feedbackDiv; if (type === 'export') feedbackDiv = exportFeedbackDiv; else if (type === 'import') feedbackDiv = importFeedbackDiv; else feedbackDiv = genericFeedbackDiv; if (!feedbackDiv) { console.log(`Settings Feedback (${type}, ${level}): ${message}`); return; } feedbackDiv.textContent = message; feedbackDiv.className = `feedback-area ${level}`; feedbackDiv.style.display = message ? 'block' : 'none'; if (level !== 'error') { setTimeout(() => { if (feedbackDiv.textContent === message) { feedbackDiv.style.display = 'none'; } }, level === 'info' ? 3000 : 5000); } }
    function downloadFile(filename, content, mimeType) { try { const blob = new Blob([content], { type: mimeType }); if (typeof saveAs !== 'undefined') { saveAs(blob, filename); } else { console.warn("FileSaver.js non détecté, utilisation de la méthode de téléchargement standard."); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); } console.log(`Fichier "${filename}" préparé pour le téléchargement.`); } catch (e) { console.error("Erreur lors de la création/téléchargement du fichier:", e); showSettingsFeedback('export', `Erreur lors de la création du fichier: ${e.message}`, 'error'); } }
    async function handleExportInventoryCSV() { /* ... code inchangé ... */ showSettingsFeedback('export', 'Préparation de l\'export CSV de l\'inventaire...', 'info'); if (!supabase) { showSettingsFeedback('export', 'Erreur: Client Supabase non initialisé.', 'error'); return; } if (typeof Papa === 'undefined') { showSettingsFeedback('export', 'Erreur: Librairie PapaParse (pour CSV) non chargée.', 'error'); return; } try { console.log("Export CSV: Récupération de tout l'inventaire..."); const { data: allItems, error: fetchError } = await supabase.from('inventory').select(`ref, description, quantity, manufacturer, datasheet, drawer, critical_threshold, attributes, categories ( name )`).order('ref'); if (fetchError) throw new Error(`Erreur lors de la récupération des données: ${fetchError.message}`); console.log(`Export CSV: ${allItems?.length || 0} éléments récupérés.`); if (!allItems || allItems.length === 0) { showSettingsFeedback('export', 'L\'inventaire est vide, rien à exporter.', 'warning'); return; } const csvData = allItems.map(item => ({ ref: item.ref, quantity: item.quantity, description: item.description || '', manufacturer: item.manufacturer || '', datasheet: item.datasheet || '', drawer: item.drawer || '', category_name: item.categories?.name || '', critical_threshold: item.critical_threshold ?? '', attributes: (item.attributes && typeof item.attributes === 'object') ? JSON.stringify(item.attributes) : '' })); const csvString = Papa.unparse(csvData, { header: true, quotes: true, delimiter: ",", newline: "\r\n" }); const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-'); const filename = `stockav_inventory_${timestamp}.csv`; downloadFile(filename, "\uFEFF" + csvString, 'text/csv;charset=utf-8'); showSettingsFeedback('export', `Export CSV (${allItems.length} éléments) réussi.`, 'success'); } catch (err) { console.error("Erreur lors de l'export CSV:", err); showSettingsFeedback('export', `Erreur lors de l'export CSV: ${err.message}`, 'error'); } }
    async function handleExportLogTXT() { /* ... code inchangé ... */ showSettingsFeedback('export', 'Préparation de l\'export TXT de l\'historique...', 'info'); if (!supabase) { showSettingsFeedback('export', 'Erreur: Client Supabase non initialisé.', 'error'); return; } try { console.log("Export Log TXT: Récupération de tout l'historique..."); const { data: allLogs, error: fetchError } = await supabase.from('log').select('created_at, user_code, action, item_ref, quantity_change, final_quantity').order('created_at', { ascending: true }); if (fetchError) throw new Error(`Erreur lors de la récupération de l'historique: ${fetchError.message}`); console.log(`Export Log TXT: ${allLogs?.length || 0} entrées récupérées.`); if (!allLogs || allLogs.length === 0) { showSettingsFeedback('export', 'L\'historique est vide, rien à exporter.', 'warning'); return; } let fileContent = `Historique StockAV - Export du ${new Date().toLocaleString('fr-FR')}\n`; fileContent += `=========================================================================================\n`; const dateWidth = 20; const userWidth = 8; const actionWidth = 18; const refWidth = 18; const changeWidth = 10; const finalQtyWidth = 12; fileContent += 'Date & Heure'.padEnd(dateWidth) + ' | ' + 'Tech.'.padEnd(userWidth) + ' | ' + 'Action'.padEnd(actionWidth) + ' | ' + 'Référence'.padEnd(refWidth) + ' | ' + '+/-'.padEnd(changeWidth) + ' | ' + 'Stock Final'.padEnd(finalQtyWidth) + '\n'; fileContent += ''.padEnd(dateWidth, '-') + '-+-' + ''.padEnd(userWidth, '-') + '-+-' + ''.padEnd(actionWidth, '-') + '-+-' + ''.padEnd(refWidth, '-') + '-+-' + ''.padEnd(changeWidth, '-') + '-+-' + ''.padEnd(finalQtyWidth, '-') + '\n'; allLogs.forEach(log => { const date = formatLogTimestamp(log.created_at).padEnd(dateWidth); const user = (log.user_code || 'N/A').toUpperCase().padEnd(userWidth); const action = (log.action || 'Inconnue').padEnd(actionWidth); const ref = (log.item_ref || 'N/A').padEnd(refWidth); const changeNum = log.quantity_change; let changeStr = 'N/A'; if (changeNum !== null && changeNum !== undefined) { changeStr = changeNum > 0 ? `+${changeNum}` : String(changeNum); } const change = changeStr.padEnd(changeWidth); const finalQty = (log.final_quantity === null || log.final_quantity === undefined ? 'N/A' : log.final_quantity).toString().padEnd(finalQtyWidth); fileContent += `${date} | ${user} | ${action} | ${ref} | ${change} | ${finalQty}\n`; }); const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-'); const filename = `stockav_log_${timestamp}.txt`; downloadFile(filename, fileContent, 'text/plain;charset=utf-8'); showSettingsFeedback('export', `Export TXT (${allLogs.length} entrées) réussi.`, 'success'); } catch (err) { console.error("Erreur lors de l'export TXT de l'historique:", err); showSettingsFeedback('export', `Erreur lors de l'export TXT: ${err.message}`, 'error'); } }
    async function handleImportInventoryCSV() { /* ... code inchangé ... */ if (!importCsvFileInput?.files || importCsvFileInput.files.length === 0) { showSettingsFeedback('import', 'Veuillez d\'abord sélectionner un fichier CSV.', 'warning'); return; } if (!supabase) { showSettingsFeedback('import', 'Erreur: Client Supabase non initialisé.', 'error'); return; } if (typeof Papa === 'undefined') { showSettingsFeedback('import', 'Erreur: Librairie PapaParse (pour CSV) non chargée.', 'error'); return; } const file = importCsvFileInput.files[0]; const modeRadio = document.querySelector('input[name="import-mode"]:checked'); const importMode = modeRadio ? modeRadio.value : 'enrich'; if (importMode === 'overwrite') { if (!confirm("ATTENTION !\n\nLe mode 'Écraser et Remplacer' va SUPPRIMER TOUT l'inventaire et TOUT l'historique actuels avant d'importer le nouveau fichier.\n\nCette action est IRRÉVERSIBLE.\n\nÊtes-vous absolument sûr de vouloir continuer ?")) { showSettingsFeedback('import', 'Importation annulée par l\'utilisateur.', 'info'); resetImportState(); return; } } showSettingsFeedback('import', `Importation CSV en mode '${importMode}'... Lecture du fichier "${file.name}"...`, 'info'); importInventoryCsvButton.disabled = true; importCsvFileInput.disabled = true; document.querySelectorAll('input[name="import-mode"]').forEach(radio => radio.disabled = true); try { await getCategories(); const categoryNameToIdMap = new Map(categoriesCache.map(cat => [cat.name.toLowerCase(), cat.id])); console.log("Import CSV: Map Nom Catégorie -> ID créée:", categoryNameToIdMap); Papa.parse(file, { header: true, skipEmptyLines: 'greedy', encoding: "UTF-8", transformHeader: header => header.trim().toLowerCase().replace(/\s+/g, '_'), complete: async (results) => { const data = results.data; const errors = results.errors; const headers = results.meta.fields; console.log("Import CSV: Parsing terminé.", results.meta); console.log("Import CSV: Headers détectés:", headers); if (errors.length > 0) { console.error("Import CSV: Erreurs lors du parsing PapaParse:", errors); const firstError = errors[0]; throw new Error(`Erreur de parsing CSV à la ligne ${firstError.row + 2}: ${firstError.message}. Vérifiez le format du fichier.`); } const requiredHeaders = ['ref', 'quantity']; const missingHeaders = requiredHeaders.filter(h => !headers.includes(h)); if (missingHeaders.length > 0) { throw new Error(`Erreur CSV: Les colonnes suivantes sont manquantes: ${missingHeaders.join(', ')}.`); } if (data.length === 0) { showSettingsFeedback('import', 'Le fichier CSV est vide ou ne contient aucune donnée valide.', 'warning'); resetImportState(); return; } showSettingsFeedback('import', `Lecture CSV réussie (${data.length} lignes trouvées). Validation des données...`, 'info'); let itemsToUpsert = []; const processingErrors = []; let uniqueRefs = new Set(); if (importMode === 'overwrite') { showSettingsFeedback('import', `Mode Écraser: Suppression de l'historique existant...`, 'info'); console.log("Import CSV (Overwrite): Deleting log entries..."); const { error: deleteLogError } = await supabase.from('log').delete().neq('id', 0); if (deleteLogError) throw new Error(`Échec de la suppression de l'historique: ${deleteLogError.message}`); showSettingsFeedback('import', `Mode Écraser: Suppression de l'inventaire existant...`, 'info'); console.log("Import CSV (Overwrite): Deleting inventory items..."); const { error: deleteInvError } = await supabase.from('inventory').delete().neq('ref', 'dummy'); if (deleteInvError) throw new Error(`Échec de la suppression de l'inventaire: ${deleteInvError.message}`); console.log("Import CSV (Overwrite): Ancien stock et historique supprimés."); showSettingsFeedback('import', `Ancien stock/log supprimé. Validation et préparation de ${data.length} lignes...`, 'info'); } for (let i = 0; i < data.length; i++) { const row = data[i]; const lineNumber = i + 2; const ref = row.ref?.trim().toUpperCase(); if (!ref) { processingErrors.push(`L${lineNumber}: Référence manquante.`); continue; } if (ref.length > 50) { processingErrors.push(`L${lineNumber} (${ref}): Référence trop longue (max 50).`); continue; } if (uniqueRefs.has(ref)) { processingErrors.push(`L${lineNumber}: Référence "${ref}" est dupliquée dans le fichier.`); continue; } uniqueRefs.add(ref); const quantityRaw = row.quantity; const quantity = parseInt(quantityRaw, 10); if (quantityRaw === null || quantityRaw === undefined || quantityRaw === '' || isNaN(quantity) || quantity < 0) { processingErrors.push(`L${lineNumber} (${ref}): Quantité invalide ou négative: "${quantityRaw}". Sera mis à 0.`); row.quantity = 0; } else { row.quantity = quantity; } let categoryId = null; const categoryName = row.category_name?.trim().toLowerCase(); if (categoryName) { categoryId = categoryNameToIdMap.get(categoryName); if (!categoryId) { processingErrors.push(`L${lineNumber} (${ref}): Catégorie "${row.category_name}" non trouvée. Sera importé sans catégorie.`); } } const thresholdRaw = row.critical_threshold?.trim(); let critical_threshold = null; if (thresholdRaw && thresholdRaw !== '') { const threshold = parseInt(thresholdRaw, 10); if (!isNaN(threshold) && threshold >= 0) { critical_threshold = threshold; } else { processingErrors.push(`L${lineNumber} (${ref}): Seuil critique invalide: "${thresholdRaw}". Sera ignoré.`); } } let attributes = null; const attributesRaw = row.attributes?.trim(); if (attributesRaw) { try { attributes = JSON.parse(attributesRaw); if (typeof attributes !== 'object' || attributes === null || Array.isArray(attributes)) { processingErrors.push(`L${lineNumber} (${ref}): La colonne 'attributes' doit contenir un objet JSON. Reçu: "${attributesRaw}". Ignoré.`); attributes = null; } } catch (e) { processingErrors.push(`L${lineNumber} (${ref}): Erreur de parsing JSON pour les attributs: ${e.message}. Reçu: "${attributesRaw}". Ignoré.`); attributes = null; } } itemsToUpsert.push({ ref: ref, quantity: row.quantity, description: row.description?.trim() || null, manufacturer: row.manufacturer?.trim() || null, datasheet: row.datasheet?.trim() || null, drawer: row.drawer?.trim().toUpperCase() || null, category_id: categoryId, critical_threshold: critical_threshold, attributes: attributes }); } if (processingErrors.length > 0) { const errorMsg = `Validation terminée avec ${processingErrors.length} erreurs/warnings (voir console). ${itemsToUpsert.length} lignes seront importées.`; showSettingsFeedback('import', errorMsg, 'warning'); console.warn("Import CSV: Erreurs/Warnings de validation:", processingErrors); if (itemsToUpsert.length === 0) { throw new Error("Aucune ligne valide à importer après validation."); } } else { showSettingsFeedback('import', `Validation OK. ${itemsToUpsert.length} lignes prêtes pour l'importation...`, 'info'); } const batchSize = 500; let importedCount = 0; console.log(`Import CSV: Début de l'upsert par lots de ${batchSize}...`); for (let i = 0; i < itemsToUpsert.length; i += batchSize) { const batch = itemsToUpsert.slice(i, i + batchSize); const batchNum = Math.floor(i / batchSize) + 1; const totalBatches = Math.ceil(itemsToUpsert.length / batchSize); showSettingsFeedback('import', `Importation du lot ${batchNum}/${totalBatches} (${batch.length} lignes)...`, 'info'); console.log(`Import CSV: Upserting batch ${batchNum} (${batch.length} items)...`); const { error: upsertError } = await supabase.from('inventory').upsert(batch, { onConflict: 'ref' }); if (upsertError) { let detailMsg = upsertError.message; if (upsertError.details) detailMsg += ` | Détails: ${upsertError.details}`; if (upsertError.hint) detailMsg += ` | Indice: ${upsertError.hint}`; console.error("Import CSV: Erreur lors de l'Upsert du lot:", detailMsg, upsertError); throw new Error(`Erreur lors de l'importation du lot ${batchNum}: ${detailMsg}`); } importedCount += batch.length; console.log(`Import CSV: Lot ${batchNum} importé avec succès.`); } let successMsg = `Importation en mode '${importMode}' terminée. ${importedCount} composants traités.`; if (processingErrors.length > 0) { successMsg += ` (${processingErrors.length} lignes ignorées ou avec warnings - voir console).`; } showSettingsFeedback('import', successMsg, 'success'); console.log("Import CSV: Importation terminée."); if (inventoryView.classList.contains('active-view')) await displayInventory(1); if (auditView.classList.contains('active-view')) await displayAudit(); if (importMode === 'overwrite' && logView.classList.contains('active-view')) await displayLog(1); }, error: (err, file) => { console.error("Import CSV: Erreur majeure PapaParse:", err, file); showSettingsFeedback('import', `Erreur critique lors de la lecture du fichier CSV: ${err.message}`, 'error'); resetImportState(); } }); } catch (err) { console.error("Erreur globale lors du processus d'importation CSV:", err); showSettingsFeedback('import', `Erreur d'importation: ${err.message}`, 'error'); resetImportState(); } finally { if (!importFeedbackDiv?.classList.contains('error')) { resetImportState(); } } }
    function resetImportState() { /* ... code inchangé ... */ if(importCsvFileInput) { importCsvFileInput.value = ''; importCsvFileInput.disabled = false; } if(importInventoryCsvButton) importInventoryCsvButton.disabled = false; document.querySelectorAll('input[name="import-mode"]').forEach(radio => radio.disabled = false); const enrichRadio = document.getElementById('import-mode-enrich'); if (enrichRadio) enrichRadio.checked = true; if (importFeedbackDiv && !importFeedbackDiv.classList.contains('error')) { importFeedbackDiv.style.display = 'none'; importFeedbackDiv.textContent = ''; } }
    function addSettingsEventListeners() { /* ... code inchangé ... */ exportInventoryCsvButton?.addEventListener('click', handleExportInventoryCSV); exportLogTxtButton?.addEventListener('click', handleExportLogTXT); importInventoryCsvButton?.addEventListener('click', handleImportInventoryCSV); importCsvFileInput?.addEventListener('change', () => { if (importCsvFileInput.files && importCsvFileInput.files.length > 0) { showSettingsFeedback('import', `Fichier sélectionné: ${importCsvFileInput.files[0].name}`, 'info'); } else { showSettingsFeedback('import', '', 'info'); } }); }

    // --- FONCTIONS POUR L'AUDIT ---
    // ... (populateAuditFilters, displayAudit, updateDifferenceAndButtonState inchangés) ...
    // ... (handleAdjustStock inchangé car les modifs nécessaires pour le kit y étaient déjà) ...
    // ... (showAuditFeedback inchangé) ...
     async function populateAuditFilters() { /* ... code inchangé ... */ if (!auditCategoryFilter) return; try { const currentCategoryValue = auditCategoryFilter.value; auditCategoryFilter.innerHTML = '<option value="all">Toutes les catégories</option>'; if (categoriesCache.length === 0 && currentUser) await getCategories(); categoriesCache.sort((a, b) => a.name.localeCompare(b.name)).forEach(cat => { const option = document.createElement('option'); option.value = cat.id; option.textContent = escapeHtml(cat.name); auditCategoryFilter.appendChild(option); }); if (categoriesCache.some(cat => String(cat.id) === String(currentCategoryValue))) { auditCategoryFilter.value = currentCategoryValue; } else { auditCategoryFilter.value = 'all'; } } catch (err) { console.error("Erreur lors de la population des filtres d'audit:", err); auditCategoryFilter.innerHTML = '<option value="all" disabled>Erreur chargement</option>'; } }
    async function displayAudit() { /* ... code inchangé ... */ if (!auditTableBody || !supabase || !currentUser) { if (auditTableBody) auditTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">${currentUser ? 'Erreur interne ou DOM manquant.' : 'Connexion requise pour l\'audit.'}</td></tr>`; return; } auditTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;"><i>Chargement de la liste d'audit...</i></td></tr>`; if(auditNoResults) auditNoResults.style.display = 'none'; showAuditFeedback('', 'info', true); const categoryId = auditCategoryFilter?.value || 'all'; const drawerFilter = auditDrawerFilter?.value.trim().toUpperCase() || ''; try { let query = supabase.from('inventory').select('ref, description, drawer, quantity').order('drawer', { ascending: true, nullsFirst: false }).order('ref', { ascending: true }); if (categoryId !== 'all') { query = query.eq('category_id', categoryId); } if (drawerFilter) { const drawerPattern = drawerFilter.replace(/\*/g, '%'); query = query.ilike('drawer', drawerPattern); } console.log("Executing audit query..."); const { data, error } = await query; auditTableBody.innerHTML = ''; if (error) { throw new Error(`Erreur base de données lors de la récupération pour l'audit: ${error.message}`); } if (!data || data.length === 0) { if (auditNoResults) { auditNoResults.textContent = "Aucun composant trouvé correspondant aux filtres sélectionnés."; auditTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 20px;">${auditNoResults.textContent}</td></tr>`; auditNoResults.style.display = 'none'; } } else { if (auditNoResults) auditNoResults.style.display = 'none'; data.forEach(item => { const row = auditTableBody.insertRow(); row.dataset.ref = item.ref; row.insertCell().textContent = item.ref; row.insertCell().textContent = item.description || '-'; row.insertCell().textContent = item.drawer || 'N/A'; const systemQtyCell = row.insertCell(); systemQtyCell.textContent = item.quantity; systemQtyCell.dataset.systemQuantity = item.quantity; systemQtyCell.classList.add('system-qty'); const physicalQtyCell = row.insertCell(); const input = document.createElement('input'); input.type = 'number'; input.min = '0'; input.classList.add('physical-qty-input'); input.dataset.ref = item.ref; input.value = item.quantity; input.addEventListener('input', () => updateDifferenceAndButtonState(row)); input.addEventListener('change', () => updateDifferenceAndButtonState(row)); input.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); const adjustButton = row.querySelector('button.adjust-button'); if (adjustButton && !adjustButton.disabled) { adjustButton.click(); } } }); physicalQtyCell.appendChild(input); const diffCell = row.insertCell(); diffCell.classList.add('difference'); diffCell.textContent = '0'; const actionCell = row.insertCell(); const button = document.createElement('button'); button.textContent = 'Ajuster'; button.classList.add('adjust-button', 'action-button', 'primary'); button.disabled = true; button.addEventListener('click', () => handleAdjustStock(row, button, input)); actionCell.appendChild(button); updateDifferenceAndButtonState(row); }); } } catch (err) { console.error("Erreur lors de l'affichage de l'audit:", err); auditTableBody.innerHTML = `<tr><td colspan="7" class="error-message" style="text-align:center; color: var(--error-color);">Erreur chargement audit: ${err.message}</td></tr>`; if (auditNoResults) { auditNoResults.textContent = 'Erreur lors du chargement des données d\'audit.'; auditNoResults.style.display = 'block'; } } }
    function updateDifferenceAndButtonState(row) { /* ... code inchangé ... */ const systemQtyCell = row.cells[3]; const physicalInput = row.querySelector('input.physical-qty-input'); const diffCell = row.cells[5]; const adjustButton = row.querySelector('button.adjust-button'); if (!systemQtyCell || !physicalInput || !diffCell || !adjustButton) { console.error("Éléments manquants dans la ligne d'audit pour màj différence."); return; } const systemQty = parseInt(systemQtyCell.dataset.systemQuantity, 10); const physicalQtyRaw = physicalInput.value; let physicalQty = NaN; if (physicalQtyRaw !== '' && !isNaN(parseInt(physicalQtyRaw, 10)) && parseInt(physicalQtyRaw, 10) >= 0) { physicalQty = parseInt(physicalQtyRaw, 10); physicalInput.classList.remove('input-error'); } else { physicalInput.classList.add('input-error'); } if (!isNaN(physicalQty)) { const difference = physicalQty - systemQty; diffCell.textContent = difference; diffCell.classList.toggle('positive', difference > 0); diffCell.classList.toggle('negative', difference < 0); diffCell.classList.remove('error-state'); adjustButton.disabled = (difference === 0 || adjustButton.classList.contains('adjusted')); if (adjustButton.classList.contains('adjusted') && difference === 0) { adjustButton.textContent = 'Ajusté ✔'; } else { adjustButton.textContent = 'Ajuster'; } } else { diffCell.textContent = 'ERR'; diffCell.className = 'difference error-state'; adjustButton.disabled = true; adjustButton.textContent = 'Ajuster'; } }
    async function handleAdjustStock(row, button, input) {
        // Le code ici mettait déjà à jour le kit si nécessaire, donc pas de changement
        if (!row || !button || !input || !currentUser) return;
        const ref = row.dataset.ref;
        const systemQtyCell = row.cells[3];
        const systemQty = parseInt(systemQtyCell.dataset.systemQuantity, 10);
        const physicalQtyRaw = input.value;
        const physicalQty = parseInt(physicalQtyRaw, 10);
        if (!ref) { showAuditFeedback(`Erreur: Référence manquante pour l'ajustement.`, 'error'); return; }
        if (isNaN(physicalQty) || physicalQty < 0) { showAuditFeedback(`Valeur physique entrée pour ${ref} est invalide (${physicalQtyRaw}). Ajustement annulé.`, 'error'); input.classList.add('input-error'); input.focus(); return; }
        const difference = physicalQty - systemQty;
        if (difference === 0) { showAuditFeedback(`Aucun ajustement nécessaire pour ${ref} (quantités identiques).`, 'info', true); button.disabled = true; return; }
        button.disabled = true; button.textContent = 'Ajustement...'; input.disabled = true;
        try {
            console.log(`Calling RPC update_stock_and_log from Audit for ${ref}, change: ${difference}`);
            const { data: newQuantity, error: rpcError } = await supabase.rpc('update_stock_and_log', { p_ref: ref, p_quantity_change: difference, p_user_id: currentUser.id, p_user_code: currentUserCode, p_action_type: 'Audit Adjust' });
             if (rpcError) { if (rpcError.message.includes('new_quantity_below_zero')) throw new Error("Stock système incohérent (résultat négatif après RPC)."); if (rpcError.message.includes('component_not_found')) throw new Error("Composant non trouvé lors de l'ajustement (peut-être supprimé ?)."); throw new Error(`Erreur RPC: ${rpcError.message}`); }
            systemQtyCell.textContent = newQuantity;
            systemQtyCell.dataset.systemQuantity = newQuantity;
            input.value = newQuantity;
            input.classList.remove('input-error');
            input.disabled = false;
            updateDifferenceAndButtonState(row);
            button.textContent = 'Ajusté ✔';
            button.classList.add('adjusted');
            button.disabled = true;
            row.classList.add('row-highlighted-success');
            setTimeout(() => row.classList.remove('row-highlighted-success'), 2500);
            showAuditFeedback(`Stock pour ${ref} ajusté avec succès: ${systemQty} -> ${newQuantity}.`, 'success');
            if (inventoryView.classList.contains('active-view')) await displayInventory(currentInventoryPage);
            if (logView.classList.contains('active-view')) await displayLog(1);
            if (lastDisplayedDrawerRef === ref) await updateSevenSegmentForComponent(ref);
            const kitIndex = currentKitSelection.findIndex(k => k.ref === ref);
            if (kitIndex > -1) {
                currentKitSelection[kitIndex].quantity = newQuantity;
                await saveKitToSupabase();
                if (kitView.classList.contains('active-view')) displayCurrentKitDrawers();
            }
        } catch (err) { console.error(`Erreur lors de l'ajustement du stock pour ${ref}:`, err); showAuditFeedback(`Erreur ajustement ${ref}: ${err.message}`, 'error'); button.textContent = 'Erreur!'; button.disabled = false; input.disabled = false; input.focus(); row.classList.add('row-highlighted-error'); setTimeout(() => row.classList.remove('row-highlighted-error'), 3500); }
    }
    function showAuditFeedback(message, type = 'info', instantHide = false) {
        // ... code inchangé ...
         if (!auditFeedbackDiv) { console.log(`Audit Feedback (${type}): ${message}`); return; } auditFeedbackDiv.textContent = message; auditFeedbackDiv.className = `feedback-area ${type}`; auditFeedbackDiv.style.display = message ? 'block' : 'none'; if (type !== 'error') { const delay = instantHide ? 0 : 4000; setTimeout(() => { if (auditFeedbackDiv.textContent === message) { auditFeedbackDiv.style.display = 'none'; } }, delay); }
    }


    // --- *** KIT ACTUEL / PRÉLÈVEMENT (Vue index.html) *** ---
    // ... (handleKitCheckboxChange, displayCurrentKitDrawers, handleDrawerButtonClick inchangés car ils géraient déjà le kit local et la sauvegarde) ...
    function handleKitCheckboxChange(event) {
        const checkbox = event.target;
        if (!checkbox || checkbox.type !== 'checkbox' || !checkbox.classList.contains('kit-select-checkbox') || !inventoryTableBody?.contains(checkbox)) {
            return;
        }
        if (!currentUser) {
             checkbox.checked = !checkbox.checked;
             showGenericError("Vous devez être connecté pour gérer le kit.");
             return;
         }
        const ref = checkbox.dataset.ref;
        const row = checkbox.closest('tr');
        if (!ref || !row || !row.dataset.itemData) { console.error("Données manquantes (ref ou itemData) sur la ligne pour la checkbox du kit.", checkbox, row); checkbox.checked = !checkbox.checked; showGenericError("Erreur lors de la sélection du composant pour le kit."); return; }

        try {
            const itemData = JSON.parse(row.dataset.itemData);
            let kitWasModified = false;
            if (checkbox.checked) {
                if (!currentKitSelection.some(item => item.ref === ref)) {
                    currentKitSelection.push({ ...itemData });
                    console.log(`Ajout au kit local: ${ref}`, itemData);
                    row.classList.add('kit-selected');
                    kitWasModified = true;
                } else { console.warn(`Tentative d'ajout de ${ref} au kit local alors qu'il y est déjà.`); }
            } else {
                const indexToRemove = currentKitSelection.findIndex(item => item.ref === ref);
                if (indexToRemove > -1) {
                    currentKitSelection.splice(indexToRemove, 1);
                    console.log(`Retiré du kit local: ${ref}`);
                    row.classList.remove('kit-selected');
                    kitWasModified = true;
                } else { console.warn(`Tentative de retrait de ${ref} du kit local alors qu'il n'y est pas.`); }
            }
            if (kitWasModified) {
                saveKitToSupabase(); // Appel asynchrone
            }
            if (kitView?.classList.contains('active-view')) {
                displayCurrentKitDrawers();
            }
        } catch (error) { console.error(`Erreur lors de la gestion de la sélection kit pour ${ref}:`, error); checkbox.checked = !checkbox.checked; showGenericError(`Erreur lors de la sélection de ${ref} pour le kit: ${error.message}`); }
    }
    function displayCurrentKitDrawers() {
        // Affichage basé sur currentKitSelection (inchangé)
        if (!currentKitDrawersDiv || !kitFeedbackDiv) { console.error("Éléments DOM manquants pour la vue Kit (#current-kit-drawers / #bom-feedback)."); return; }
        currentKitDrawersDiv.innerHTML = '';
        if (!currentUser) { currentKitDrawersDiv.innerHTML = '<p><i>Connectez-vous pour utiliser le kit.</i></p>'; if (kitFeedbackDiv) kitFeedbackDiv.style.display = 'none'; return; }
        if (currentKitSelection.length === 0) { currentKitDrawersDiv.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px 0;"><i>Le kit est vide. Sélectionnez des composants dans l\'onglet Inventaire.</i></p>'; if (kitFeedbackDiv) kitFeedbackDiv.style.display = 'none'; return; }
        const drawersMap = new Map();
        currentKitSelection.forEach(item => { const drawerKey = item.drawer?.trim().toUpperCase() || 'TIROIR_INCONNU'; if (!drawersMap.has(drawerKey)) { drawersMap.set(drawerKey, { items: [] }); } drawersMap.get(drawerKey).items.push(item); });
        const sortedDrawers = Array.from(drawersMap.keys()).sort((a, b) => { if (a === 'TIROIR_INCONNU') return 1; if (b === 'TIROIR_INCONNU') return -1; return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }); });
        sortedDrawers.forEach(drawerKey => {
            const drawerData = drawersMap.get(drawerKey); const itemsInDrawer = drawerData.items;
            let worstStatus = 'ok'; let statusPriority = { ok: 1, warning: 2, critical: 3, unknown: 0 };
            itemsInDrawer.forEach(item => { const itemStatus = getStockStatus(item.quantity, item.critical_threshold); if (statusPriority[itemStatus] > statusPriority[worstStatus]) { worstStatus = itemStatus; } });
            const button = document.createElement('button'); button.classList.add('drawer-button'); button.classList.add(`status-${worstStatus}`); button.dataset.drawer = drawerKey; button.textContent = drawerKey === 'TIROIR_INCONNU' ? '?' : drawerKey;
            let tooltipContent = `Tiroir: ${drawerKey === 'TIROIR_INCONNU' ? 'Non défini' : drawerKey}\n`; tooltipContent += `Statut (pire): ${worstStatus.toUpperCase()}\n`; tooltipContent += `------------------------------\nComposants dans ce tiroir:\n`;
            itemsInDrawer.forEach(item => { const itemStatus = getStockStatus(item.quantity, item.critical_threshold); tooltipContent += `- ${item.ref} (Stock: ${item.quantity ?? 'N/A'}, Statut: ${itemStatus.toUpperCase()})\n`; });
            button.title = tooltipContent.trim();
            // Pas de gestion .collected ici
            currentKitDrawersDiv.appendChild(button);
        });
        if (kitFeedbackDiv && kitFeedbackDiv.textContent === '' && currentKitSelection.length > 0) { kitFeedbackDiv.style.display = 'none'; }
    }
    function handleDrawerButtonClick(event) {
        // Gère juste le style local (inchangé)
        const button = event.target.closest('.drawer-button'); if (!button || !currentKitDrawersDiv?.contains(button)) return;
        button.classList.toggle('collected');
        const drawer = button.dataset.drawer; const isCollected = button.classList.contains('collected');
        console.log(`Tiroir ${drawer} marqué visuellement comme ${isCollected ? 'collecté' : 'non collecté'} (index.html).`);
    }
    // --- MODIFIÉ --- : handleClearKit pour vider aussi currentCollectedDrawers
    async function handleClearKit() {
        if (!currentUser) {
            showKitFeedback("Vous devez être connecté pour vider le kit.", 'error');
            return;
        }
        console.log("Vidage du kit actuel...");
        const itemsClearedCount = currentKitSelection.length;

        // 1. Vider les variables locales
        currentKitSelection = [];
        currentCollectedDrawers = new Set(); // <-- Vidage ici

        // 2. Vider dans Supabase
        const clearedInDb = await clearKitInSupabase();

        // 3. Mettre à jour l'UI locale
        await refreshKitRelatedUI(); // Met à jour l'inventaire et la vue kit

        // 4. Afficher feedback
        if (clearedInDb && itemsClearedCount > 0) {
             showKitFeedback("Le kit actuel a été vidé.", 'success');
        } else if (!clearedInDb && itemsClearedCount > 0) {
            showKitFeedback("Erreur lors du vidage du kit en base de données.", 'error');
        } else if (itemsClearedCount === 0) {
            showKitFeedback("Le kit était déjà vide.", 'info');
        }
    }

        // --- Initialisation Générale ---
    function initializeApp() {
        console.log("Initialisation StockAV...");

        // Configuration Items par page (inchangé)
        try { const userItemsPerPage = parseInt(localStorage.getItem('stockav_itemsPerPage') || '15', 10); ITEMS_PER_PAGE = (userItemsPerPage > 0 && userItemsPerPage <= 100) ? userItemsPerPage : 15; console.log(`Items par page chargés: ${ITEMS_PER_PAGE}`); if (itemsPerPageSelect) { itemsPerPageSelect.value = ITEMS_PER_PAGE; itemsPerPageSelect.addEventListener('change', (e) => { const newIPP = parseInt(e.target.value, 10); if (newIPP > 0 && newIPP <= 100) { ITEMS_PER_PAGE = newIPP; localStorage.setItem('stockav_itemsPerPage', ITEMS_PER_PAGE); console.log(`Items par page mis à jour: ${ITEMS_PER_PAGE}`); const activeView = document.querySelector('main.view-section.active-view'); if (activeView && (activeView.id === 'inventory-view' || activeView.id === 'log-view')) { if (activeView.id === 'inventory-view') currentInventoryPage = 1; if (activeView.id === 'log-view') currentLogPage = 1; reloadActiveViewData(activeView); } } }); } } catch (e) { console.warn("Erreur lecture/configuration items par page:", e); ITEMS_PER_PAGE = 15; }

        // Vérification IDs HTML (inchangé)
        const requiredIds = [ /* ... liste inchangée ... */ 'login-area', 'login-code', 'login-password', 'login-button', 'login-error', 'user-info-area', 'user-display', 'logout-button', 'main-navigation', 'show-search-view', 'show-inventory-view', 'show-log-view', 'show-admin-view', 'show-settings-view', 'show-audit-view', 'show-bom-view', 'search-view', 'inventory-view', 'log-view', 'admin-view', 'settings-view', 'audit-view', 'bom-view', 'quantity-change-modal', 'modal-overlay', 'modal-component-ref', 'modal-current-quantity', 'modal-decrease-button', 'modal-increase-button', 'modal-change-amount', 'modal-confirm-button', 'modal-cancel-button', 'modal-feedback', 'modal-current-attributes', 'modal-attributes-list', 'seven-segment-display', 'inventory-table-body', 'inventory-category-filter', 'inventory-search-filter', 'apply-inventory-filter-button', 'inventory-prev-page', 'inventory-next-page', 'inventory-page-info', 'inventory-no-results', 'inventory-attribute-filters', 'log-table-body', 'log-prev-page', 'log-next-page', 'log-page-info', 'log-no-results', 'category-list', 'category-form', 'category-name', 'category-attributes', 'category-id-edit', 'cancel-edit-button', 'category-form-title', 'admin-feedback', 'stock-form', 'component-ref-admin', 'check-stock-button', 'component-actions', 'current-quantity', 'update-quantity-button', 'quantity-change', 'delete-component-button', 'component-category-select', 'category-specific-attributes', 'component-desc', 'component-mfg', 'component-datasheet', 'component-initial-quantity', 'component-drawer-admin', 'component-threshold', 'save-component-button', 'export-critical-txt-button', 'export-critical-feedback', 'component-details', 'search-button', 'component-input', 'response-output', 'loading-indicator', 'export-inventory-csv-button', 'export-log-txt-button', 'export-feedback', 'import-csv-file', 'import-inventory-csv-button', 'import-feedback', 'audit-category-filter', 'audit-drawer-filter', 'apply-audit-filter-button', 'audit-table-body', 'audit-no-results', 'audit-feedback', 'bom-feedback', 'current-kit-drawers', 'clear-kit-button', 'generic-feedback', 'items-per-page-select'];
        const missingIds = requiredIds.filter(id => !document.getElementById(id));
        if (missingIds.length > 0) { const errorMsg = `Erreur critique d'initialisation: Éléments HTML manquants: ${missingIds.join(', ')}.`; console.error(errorMsg); document.body.innerHTML = `<div style="padding:20px; background-color:#f8d7da; color:#721c24; border: 1px solid #f5c6cb; border-radius: 5px;"><h2>Erreur Critique</h2><p>${errorMsg}</p></div>`; return; }

        // --- Écouteurs Événements ---
        // (Les fonctions appelées gèrent maintenant le kit local/DB et l'état collecté)
=======
         // Scroll to bottom (or top in this case) ? Maybe not necessary if newest is at top.
         // responseOutputChat.scrollTop = 0;
    }
    function displayWelcomeMessage() {
         if (!responseOutputChat) return;
         responseOutputChat.innerHTML = ''; // Clear previous messages
         chatHistory = []; // Clear history
         addMessageToChat('ai', "Bonjour ! Entrez une référence composant pour obtenir des informations ou trouver des composants similaires.");
         resetConversationState(); // Ensure conversation state is clean
     }
    async function handleUserInput() {
        if (!componentInputChat || !searchButtonChat || !loadingIndicatorChat || !responseOutputChat) return;

        const userInput = componentInputChat.value.trim();
        if (!userInput) return; // Ignore empty input

        addMessageToChat('user', userInput);
        componentInputChat.value = ''; // Clear input field
        componentInputChat.disabled = true;
        searchButtonChat.disabled = true;
        loadingIndicatorChat.style.display = 'block';
        responseOutputChat.scrollTop = 0; // Scroll to show user message immediately

        // --- Logique de recherche ---
        // 1. Essayer une correspondance exacte (case-insensitive via getStockInfoFromSupabase)
        // 2. Si pas de correspondance exacte, chercher des similaires (via ILIKE)
        // 3. Si connecté et correspondance exacte, proposer de prendre une quantité
        // 4. Toujours proposer des liens externes

        try {
            const potentialRef = userInput.toUpperCase(); // Normalize ref for exact match check
            let exactMatch = await getStockInfoFromSupabase(potentialRef); // This function handles case-insensitivity

            if (exactMatch) {
                // --- Correspondance Exacte Trouvée ---
                const item = exactMatch; // Already contains category_name etc.
                const indicator = createStockIndicatorHTML(item.quantity, item.critical_threshold);
                const catName = item.category_name || 'N/A'; // category_name from getStockInfo...
                const typeAttr = item.attributes?.Type || ''; // Access attributes directly

                let responseMsg = `${indicator} **${item.ref}** trouvé :\n\n`;
                responseMsg += `*   **Description:** ${item.description || '-'}\n`;
                responseMsg += `*   **Catégorie:** ${catName} ${typeAttr ? `(${typeAttr})` : ''}\n`;
                responseMsg += `*   **Stock Actuel:** ${item.quantity}\n`;

                if (currentUser && item.drawer) {
                    responseMsg += `*   **Emplacement:** Tiroir **${item.drawer}**\n`;
                    updateSevenSegmentForComponent(item.ref); // Update 7-segment only if logged in
                } else if (currentUser && !item.drawer) {
                    responseMsg += `*   **Emplacement:** Non défini\n`;
                    updateSevenSegmentForComponent(item.ref);
                } else if (!currentUser) {
                     responseMsg += `*   **Emplacement:** (Connectez-vous pour voir)\n`;
                     updateSevenSegmentForComponent(null); // Clear 7-segment if not logged in
                }

                if (item.datasheet) {
                    responseMsg += `*   **Datasheet:** <a href="${escapeHtml(item.datasheet)}" target="_blank" rel="noopener noreferrer">Ouvrir le lien</a>\n`;
                }
                responseMsg += "\n" + provideExternalLinksHTML(item.ref); // Add external links

                // Proposer de prendre si en stock et connecté
                if (item.quantity > 0 && currentUser) {
                    responseMsg += `\n\nVoulez-vous en prendre ? Si oui, combien ? (Entrez un nombre ou 'non' pour annuler)`;
                    // Mettre à jour l'état de la conversation
                    conversationState.awaitingQuantityConfirmation = true;
                    conversationState.componentRef = item.ref;
                    conversationState.maxQuantity = item.quantity;
                } else if (item.quantity <= 0) {
                    responseMsg += `\n\nStock à zéro. Impossible d'en prendre.`;
                    resetConversationState();
                } else if (!currentUser) {
                    responseMsg += `\n\n(Connectez-vous pour pouvoir prendre des composants)`;
                    resetConversationState();
                }

                addMessageToChat('ai', responseMsg, true); // Add AI response as HTML

            } else {
                // --- Pas de Correspondance Exacte -> Recherche Similaire ---
                console.log(`Pas de correspondance exacte pour '${potentialRef}', recherche de similaires avec ILIKE...`);
                const searchPattern = `%${userInput}%`; // Pattern for ILIKE

                // Recherche sur 'ref' OU 'description'
                const { data: similarData, error: similarError } = await supabase
                    .from('inventory')
                    .select('ref, description, quantity, critical_threshold, drawer, datasheet, attributes, category_id, categories(name)') // Besoin de join ici car getStockInfo pas appelé
                    .or(`ref.ilike.${searchPattern},description.ilike.${searchPattern}`)
                    .limit(5); // Limiter le nombre de résultats similaires

                if (similarError) {
                    throw new Error(`Erreur lors de la recherche de composants similaires: ${similarError.message}`);
                }

                if (similarData && similarData.length > 0) {
                    // --- Composants Similaires Trouvés ---
                    console.log("Composants similaires trouvés:", similarData);
                    let responseMsg = `Pas de correspondance exacte pour "${userInput}", mais voici ${similarData.length} composant(s) similaire(s) trouvé(s) :\n\n`;

                    for (const item of similarData) {
                        const indicator = createStockIndicatorHTML(item.quantity, item.critical_threshold);
                        // Attention: ici on utilise 'categories.name' car on a fait le join
                        const catName = item.categories?.name || 'N/A';
                        const typeAttr = item.attributes?.Type || '';
                        responseMsg += `${indicator} **${item.ref}**\n`;
                        responseMsg += ` *Desc:* ${item.description || '-'}\n`;
                        responseMsg += ` *Cat:* ${catName} ${typeAttr ? `(${typeAttr})` : ''}\n`;
                        responseMsg += ` *Qté:* ${item.quantity}`;
                        if (currentUser && item.drawer) {
                             responseMsg += ` (Tiroir: ${item.drawer})\n`;
                        } else {
                             responseMsg += `\n`;
                        }
                        // Ajouter les liens externes pour chaque similaire
                        responseMsg += provideExternalLinksHTML(item.ref, true) + "\n";
                        responseMsg += `----------\n`; // Separator
                    }
                    addMessageToChat('ai', responseMsg, true);

                } else {
                    // --- Aucun Similaire Trouvé ---
                    console.log("Aucun composant similaire trouvé.");
                    let notFoundMsg = `Désolé, je n'ai rien trouvé dans l'inventaire correspondant à "${userInput}".`;
                    // Proposer quand même les liens externes pour la recherche initiale
                    notFoundMsg += "\n" + provideExternalLinksHTML(userInput);
                    addMessageToChat('ai', notFoundMsg, true);
                }
                // Pas de correspondance exacte, donc pas de proposition de quantité
                resetConversationState();
                updateSevenSegmentForComponent(null); // Effacer 7 segments si rien trouvé
            }

        } catch (error) {
            console.error("Erreur lors du traitement de l'entrée utilisateur (chat):", error);
            addMessageToChat('ai', `Oups ! Une erreur est survenue lors de la recherche : ${error.message}`);
            resetConversationState(); // Réinitialiser en cas d'erreur
            updateSevenSegmentForComponent(null);
        } finally {
            // Réactiver les contrôles dans tous les cas
            componentInputChat.disabled = false;
            searchButtonChat.disabled = false;
            loadingIndicatorChat.style.display = 'none';
            // Remettre le focus sur l'input seulement si on n'attend pas de confirmation de quantité
            if (!conversationState.awaitingQuantityConfirmation) {
                 componentInputChat.focus();
            } else {
                 // Si on attend une quantité, peut-être mettre en évidence l'input ?
                 componentInputChat.focus(); // Garder le focus pour la réponse
            }
        }
    }
    function extractReference(text) {
        // Simple extraction for now, assumes the text IS the reference
        // Could be enhanced with regex later if needed
        return text.trim().toUpperCase();
    }
    async function checkComponentWithAI(originalRef) {
        // Fonctionnalité IA désactivée ou non implémentée
        console.warn("Fonction checkComponentWithAI appelée mais l'IA n'est pas active.");
        addMessageToChat('ai', `La recherche via IA externe pour "${originalRef}" n'est pas activée dans cette version.`);
        // Pourrait éventuellement appeler provideExternalLinksHTML ici aussi
        // addMessageToChat('ai', provideExternalLinksHTML(originalRef), true);
        return; // Ne fait rien
    }
    async function promptLoginBeforeAction(actionDesc) {
        addMessageToChat('ai', `Vous devez être connecté pour ${actionDesc}.`);
        // Optionnel: Faire défiler jusqu'à la zone de login ou mettre le focus
        loginCodeInput?.focus();
    }
    function provideExternalLinksHTML(ref, inline = false) {
        if (!ref) return '';
        const encodedRef = encodeURIComponent(ref); // Assurer l'encodage pour les URLs

        // Définir les URLs de recherche
        const mouserUrl = `https://www.mouser.fr/Search/Refine?Keyword=${encodedRef}`;
        const digikeyUrl = `https://www.digikey.fr/fr/products/result?keywords=${encodedRef}`;
        const aliUrl = `https://www.aliexpress.com/wholesale?SearchText=${encodedRef}`;
        const lcscUrl = `https://lcsc.com/search?q=${encodedRef}`;

        // Créer les liens
        const links = [
            { name: 'Mouser', url: mouserUrl, class: 'mouser' },
            { name: 'Digi-Key', url: digikeyUrl, class: 'digikey' },
            { name: 'LCSC', url: lcscUrl, class: 'lcsc' },
            { name: 'AliExpress', url: aliUrl, class: 'aliexpress' }
        ];

        let linksHTML = '';
        const linkItems = links.map(link =>
            `<a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" class="external-link ${inline ? 'external-link-inline' : ''} ${link.class}" title="Chercher ${ref} sur ${link.name}">${link.name}</a>`
        ).join(inline ? ' ' : ''); // Joindre avec espace si inline

        if (inline) {
            linksHTML = `<span class="external-links-inline">[ ${linkItems} ]</span>`;
        } else {
            linksHTML = `<div class="external-links-block"><strong>Liens externes :</strong> ${linkItems}</div>`;
        }
        return linksHTML;
    }
    async function handleQuantityResponse(userInput) {
        // Vérifier si on attend bien une réponse et si l'utilisateur est connecté
        if (!conversationState.awaitingQuantityConfirmation || !conversationState.componentRef || !currentUser) {
            console.warn("handleQuantityResponse appelé hors contexte ou sans utilisateur connecté.");
            // Si hors contexte, traiter comme une nouvelle entrée utilisateur normale
            resetConversationState();
            await handleUserInput(); // Retraiter l'input comme une recherche normale
            return;
        }

        const ref = conversationState.componentRef;
        const maxQty = conversationState.maxQuantity;
        const lowerInput = userInput.toLowerCase();

        // Gérer l'annulation
        if (lowerInput === 'non' || lowerInput === 'annuler' || lowerInput === '0' || lowerInput === 'cancel' || lowerInput === 'no') {
            addMessageToChat('ai', "Ok, opération de prise de composant annulée.");
            resetConversationState(); // Réinitialiser l'état
            componentInputChat.focus(); // Remettre le focus
            return;
        }

        // Essayer d'extraire un nombre positif de l'entrée
        const match = userInput.match(/\d+/);
        const quantityToTake = match ? parseInt(match[0], 10) : NaN;

        // Valider la quantité
        if (isNaN(quantityToTake) || quantityToTake <= 0) {
            addMessageToChat('ai', "Quantité non comprise. Veuillez entrer un nombre positif pour la quantité à prendre, ou 'non' pour annuler.");
            // Ne pas réinitialiser l'état, on attend toujours une réponse valide
            componentInputChat.focus();
            return;
        }

        // Vérifier si la quantité demandée est supérieure au stock
        if (quantityToTake > maxQty) {
            addMessageToChat('ai', `Stock insuffisant. Il ne reste que ${maxQty} ${ref}. Combien voulez-vous en prendre (max ${maxQty}) ? Ou entrez 'non' pour annuler.`);
            // Ne pas réinitialiser l'état
            componentInputChat.focus();
            return;
        }

        // Si tout est valide, procéder à la mise à jour du stock via RPC
        addMessageToChat('ai', `Ok, enregistrement de la sortie de ${quantityToTake} x ${ref}...`);
        // Désactiver l'input pendant l'opération
        componentInputChat.disabled = true;
        searchButtonChat.disabled = true;
        loadingIndicatorChat.style.display = 'block';

        // Sauvegarder l'état avant de le réinitialiser (au cas où on doive le restaurer si erreur ?)
        // const originalState = { ...conversationState };
        resetConversationState(); // Réinitialiser l'état car l'action va être tentée

        try {
            // Appeler la RPC pour décrémenter le stock et ajouter au log
            console.log(`Calling RPC update_stock_and_log for ${ref}, change: ${-quantityToTake}`);
            const { data: newQuantity, error: rpcError } = await supabase.rpc('update_stock_and_log', {
                p_ref: ref,
                p_quantity_change: -quantityToTake, // Négatif car on retire
                p_user_id: currentUser.id,
                p_user_code: currentUserCode,
                p_action_type: 'Chat Take Qty' // Action spécifique pour le log
            });

            if (rpcError) {
                // Gérer les erreurs RPC spécifiques
                if (rpcError.message.includes('new_quantity_below_zero')) throw new Error("Stock devenu insuffisant (vérification RPC).");
                if (rpcError.message.includes('component_not_found')) throw new Error("Composant non trouvé lors de la mise à jour (peut-être supprimé ?).");
                throw new Error(`Erreur RPC: ${rpcError.message}`);
            }

            // Succès
            addMessageToChat('ai', `Sortie enregistrée ! Le stock restant pour ${ref} est maintenant de ${newQuantity}.`);

            // Mettre à jour les autres vues si nécessaire
            if (inventoryView.classList.contains('active-view')) await displayInventory(currentInventoryPage);
            if (auditView.classList.contains('active-view')) await displayAudit();
            if (logView.classList.contains('active-view')) await displayLog(1);
            if (lastDisplayedDrawerRef === ref) await updateSevenSegmentForComponent(ref);

            // Mettre à jour le kit
            const kitIndex = currentKitSelection.findIndex(k => k.ref === ref);
            if (kitIndex > -1) {
                currentKitSelection[kitIndex].quantity = newQuantity;
                if (kitView.classList.contains('active-view')) displayCurrentKitDrawers();
            }

        } catch (err) {
            console.error("Erreur lors de la mise à jour du stock via le chat:", err);
            addMessageToChat('ai', `Désolé, une erreur est survenue lors de l'enregistrement de la sortie : ${err.message}. L'opération a échoué.`);
            // Restaurer l'état pour permettre de réessayer ? Non, plus sûr de recommencer la recherche.
            // conversationState = originalState;
        } finally {
            // Réactiver l'input dans tous les cas
            componentInputChat.disabled = false;
            searchButtonChat.disabled = false;
            loadingIndicatorChat.style.display = 'none';
            componentInputChat.focus();
        }
    }
    function resetConversationState() {
        conversationState = { awaitingQuantityConfirmation: false, componentRef: null, maxQuantity: 0 };
        console.log("Conversation state reset.");
    }


    // --- Fonctions d'interaction Supabase (Données Stock) ---
    // (getStockInfoFromSupabase - Inchangé)
    async function getStockInfoFromSupabase(ref) {
         if (!supabase) { console.error("getStockInfoFromSupabase: Supabase non initialisé."); return null; }
         if (!ref) { console.warn("getStockInfoFromSupabase: Référence manquante."); return null; }

         const upperRef = ref.toUpperCase(); // Normaliser la référence en majuscules

         try {
             console.log(`getStockInfoFromSupabase: Fetching details for ${upperRef}...`);
             const { data, error } = await supabase
                 .from('inventory')
                 // Sélectionner toutes les colonnes de 'inventory' et le nom de la catégorie associée
                 .select(`
                     *,
                     categories ( name )
                 `)
                 .eq('ref', upperRef) // Chercher la référence exacte (insensible à la casse grâce à la normalisation)
                 .maybeSingle(); // Retourne null si non trouvé, un objet si trouvé, erreur si plusieurs

             if (error) {
                 // Ne pas considérer "aucun résultat" comme une erreur bloquante ici
                 if (error.code === 'PGRST116') {
                     console.log(`getStockInfoFromSupabase: Référence ${upperRef} non trouvée.`);
                     return null;
                 }
                 // Autre erreur DB
                 throw new Error(`Erreur base de données getStockInfo: ${error.message}`);
             }

             if (data) {
                 // Formater la réponse pour inclure category_name directement
                 data.category_name = data.categories?.name || null; // Ajouter category_name
                 if (data.category_id) {
                    data.category_id = String(data.category_id); // Assurer que l'ID est une string
                 }
                 delete data.categories; // Supprimer l'objet imbriqué 'categories' devenu inutile
                 console.log(`getStockInfoFromSupabase: Data found for ${upperRef}:`, data);
             }

             return data; // Retourne l'objet ou null

         } catch (err) {
             console.error(`Erreur JS dans getStockInfoFromSupabase pour ${upperRef}:`, err);
             return null; // Retourner null en cas d'erreur JS aussi
         }
     }

    // --- Gestion Modale Quantité (+/-) ---
    // (handleInventoryRowClick, getBadgeClassForKey, showQuantityModal, hideQuantityModal, updateModalButtonStates, listeners +/-/Cancel/Overlay - Inchangé)
    // (listener Confirm - Inchangé, utilise déjà RPC)
    async function handleInventoryRowClick(event) {
        const row = event.target.closest('tr.inventory-item-row');
        if (!row) return; // Clic en dehors d'une ligne

        // Ignorer si le clic était sur la checkbox du kit ou un lien datasheet
        if (event.target.classList.contains('kit-select-checkbox')) return;
        if (event.target.closest('a')) return;

        // Vérifier si l'utilisateur est connecté
        if (!currentUser) {
            showGenericError("Connectez-vous pour modifier les quantités.");
            // Optionnel : Mettre le focus sur le login
            loginCodeInput?.focus();
            return;
        }

        const ref = row.dataset.ref;
        if (!ref) {
            console.error("Référence manquante sur la ligne d'inventaire:", row);
            showGenericError("Erreur: Référence interne manquante.");
            return;
        }

        console.log(`Clic sur ligne inventaire pour ouvrir modale: ${ref}`);
        row.style.cursor = 'wait'; // Indiquer chargement

        try {
            let itemData = null;
            // Essayer de récupérer les données depuis l'attribut data-item-data (plus rapide)
            if (row.dataset.itemData) {
                try {
                    itemData = JSON.parse(row.dataset.itemData);
                    // Vérifier si les données sont complètes (contiennent au moins ref, quantity, attributes)
                    if (!itemData || typeof itemData.quantity === 'undefined' || typeof itemData.attributes === 'undefined') {
                       console.warn("Données partielles dans data-item-data, refetching...", itemData);
                       itemData = null; // Forcer le refetch
                    }
                } catch(e) {
                    console.warn("Erreur parsing itemData depuis l'attribut data-item-data:", e);
                    itemData = null; // Forcer le refetch en cas d'erreur
                }
            }

            // Si les données n'ont pas pu être récupérées de l'attribut, les chercher en DB
            if (!itemData) {
                console.log(`Données non trouvées ou incomplètes dans data-item-data pour ${ref}, refetching from Supabase...`);
                itemData = await getStockInfoFromSupabase(ref);
            }

            if (itemData) {
                // Afficher la modale avec les données récupérées
                updateSevenSegmentForComponent(itemData.ref); // Mettre à jour le 7 segments
                showQuantityModal(itemData.ref, itemData.quantity, itemData.attributes || {}); // Passer les attributs
            } else {
                // Si même après refetch, on n'a pas les données
                console.error(`Impossible de récupérer les détails pour le composant ${ref}.`);
                showGenericError(`Erreur: Impossible de charger les détails pour ${ref}. L'inventaire va être rafraîchi.`);
                // Rafraîchir l'inventaire pour refléter l'état actuel
                await displayInventory(currentInventoryPage);
                updateSevenSegmentForComponent(null); // Effacer 7 segments
            }
        } catch (error) {
            console.error(`Erreur lors du traitement du clic sur la ligne ${ref}:`, error);
            showGenericError(`Erreur lors de l'ouverture des détails de ${ref}: ${error.message}`);
            updateSevenSegmentForComponent(null); // Effacer 7 segments en cas d'erreur
        } finally {
            row.style.cursor = ''; // Rétablir le curseur par défaut
        }
    }
    function getBadgeClassForKey(key) {
        if (!key) return 'badge-color-default';
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('volt') || lowerKey.includes('tension')) return 'badge-color-red';
        if (lowerKey.includes('package') || lowerKey.includes('boitier') || lowerKey.includes('format')) return 'badge-color-gray'; // Ajout 'format'
        if (lowerKey.includes('type')) return 'badge-color-blue';
        if (lowerKey.includes('capacit') || lowerKey.includes('valeur') || lowerKey.includes('r_sistance') || lowerKey.includes('inductance')) return 'badge-color-green'; // Ajout inductance
        if (lowerKey.includes('tol_rance')) return 'badge-color-yellow';
        if (lowerKey.includes('puissance')) return 'badge-color-orange';
        // Ajouter d'autres couleurs si besoin
        return 'badge-color-default'; // Couleur par défaut
    }
    function showQuantityModal(ref, quantity, attributes) {
         if (!quantityChangeModal || !modalOverlay || !modalRefSpan || !modalQtySpan) return;

         modalCurrentRef = ref;
         modalInitialQuantity = quantity;
         currentModalChange = 0; // Réinitialiser le changement

         // Afficher les infos de base
         modalRefSpan.textContent = ref;
         modalQtySpan.textContent = quantity;
         modalChangeAmountDisplay.textContent = currentModalChange; // Afficher 0

         // Cacher le feedback précédent
         if(modalFeedback) {
             modalFeedback.style.display = 'none';
             modalFeedback.textContent = '';
         }

         // Afficher les attributs sous forme de badges
         if (modalAttributesContainer && modalAttributesList && attributes && typeof attributes === 'object' && Object.keys(attributes).length > 0) {
             modalAttributesList.innerHTML = ''; // Vider les anciens badges
             Object.entries(attributes).forEach(([key, value]) => {
                 // N'afficher que les attributs qui ont une valeur non nulle/vide
                 if (value !== null && value !== undefined && String(value).trim() !== '') {
                     const badge = document.createElement('span');
                     badge.classList.add('attribute-badge', getBadgeClassForKey(key)); // Ajouter classe de couleur
                     badge.textContent = `${key}: ${value}`;
                     badge.title = `${key}: ${value}`; // Tooltip
                     modalAttributesList.appendChild(badge);
                 }
             });
             modalAttributesContainer.style.display = 'block'; // Afficher le conteneur
         } else {
             // Cacher si pas d'attributs ou format invalide
             if (modalAttributesContainer) {
                modalAttributesContainer.style.display = 'none';
             }
             if (attributes && typeof attributes !== 'object') {
                 console.warn("Format d'attributs invalide pour la modale:", attributes);
             }
         }

         // Mettre à jour l'état des boutons (+/- et Confirmer)
         updateModalButtonStates();

         // Afficher la modale et l'overlay
         modalOverlay.classList.add('active');
         quantityChangeModal.classList.add('active');

         // Mettre le focus sur un bouton (par exemple, +)
         modalIncreaseButton?.focus();
     }
    function hideQuantityModal() {
        if (!quantityChangeModal || !modalOverlay) return;
        modalOverlay.classList.remove('active');
        quantityChangeModal.classList.remove('active');
        // Réinitialiser l'état lié à la modale
        modalCurrentRef = null;
        modalInitialQuantity = 0;
        currentModalChange = 0;
    }
    function updateModalButtonStates() {
        if (!modalDecreaseButton || !modalIncreaseButton || !modalConfirmButton) return;
        // Quantité potentielle après application du changement actuel
        const potentialNewQuantity = modalInitialQuantity + currentModalChange;

        // Désactiver '-' si la nouvelle quantité serait négative ou nulle
        modalDecreaseButton.disabled = potentialNewQuantity <= 0;

        // Le bouton '+' peut toujours être activé (pas de limite supérieure ici)
        modalIncreaseButton.disabled = false;

        // Désactiver 'Confirmer' si aucun changement n'a été fait
        modalConfirmButton.disabled = currentModalChange === 0;
    }
    modalDecreaseButton?.addEventListener('click', () => {
        // Vérifier si on peut encore décrémenter
        if (modalInitialQuantity + currentModalChange > 0) {
            currentModalChange--;
            modalChangeAmountDisplay.textContent = currentModalChange;
            updateModalButtonStates();
        }
    });
    modalIncreaseButton?.addEventListener('click', () => {
        currentModalChange++;
        modalChangeAmountDisplay.textContent = currentModalChange;
        updateModalButtonStates();
    });
    modalCancelButton?.addEventListener('click', hideQuantityModal);
    modalOverlay?.addEventListener('click', (event) => {
        // Fermer si on clique sur l'overlay lui-même, pas sur la modale
        if(event.target === modalOverlay) {
            hideQuantityModal();
        }
    });
    modalConfirmButton?.addEventListener('click', async () => {
         if (!modalCurrentRef || currentModalChange === 0 || !currentUser) {
             console.warn("Conditions non remplies pour confirmer la modale.");
             return;
         }

         const ref = modalCurrentRef;
         const change = currentModalChange;
         const initialQtyBeforeUpdate = modalInitialQuantity; // Garder pour le message

         // Afficher feedback et désactiver boutons
         if (modalFeedback) {
             modalFeedback.textContent = `Mise à jour du stock pour ${ref} (${change > 0 ? '+' : ''}${change})...`;
             modalFeedback.className = 'modal-feedback info'; // Classe CSS pour style
             modalFeedback.style.display = 'block';
         }
         modalConfirmButton.disabled = true;
         modalCancelButton.disabled = true;
         modalDecreaseButton.disabled = true;
         modalIncreaseButton.disabled = true;

         try {
             // Appel RPC pour mettre à jour stock et log
             console.log(`Calling RPC update_stock_and_log from modal for ${ref}, change: ${change}`);
             const { data: newQuantity, error: rpcError } = await supabase.rpc('update_stock_and_log', {
                 p_ref: ref,
                 p_quantity_change: change,
                 p_user_id: currentUser.id,
                 p_user_code: currentUserCode,
                 p_action_type: 'Modal Adjust' // Type d'action pour le log
             });

             if (rpcError) {
                 // Gérer erreurs RPC spécifiques
                 if (rpcError.message.includes('new_quantity_below_zero')) throw new Error("Stock insuffisant (vérification RPC).");
                 if (rpcError.message.includes('component_not_found')) throw new Error("Composant non trouvé (peut-être supprimé ?).");
                 throw new Error(`Erreur RPC: ${rpcError.message}`);
             }

             // --- Succès ---
             if (modalFeedback) {
                 modalFeedback.textContent = `Stock mis à jour: ${initialQtyBeforeUpdate} -> ${newQuantity}.`;
                 modalFeedback.className = 'modal-feedback success';
             }

             // Mettre à jour l'affichage dans la modale elle-même
             modalQtySpan.textContent = newQuantity; // Afficher la nouvelle quantité
             modalInitialQuantity = newQuantity; // Mettre à jour la quantité de base pour les clics suivants
             currentModalChange = 0; // Réinitialiser le compteur de changement
             modalChangeAmountDisplay.textContent = '0'; // Afficher 0

             // Réactiver les boutons de la modale (sauf confirmer)
             updateModalButtonStates(); // Met à jour +/- basé sur newQuantity
             modalCancelButton.disabled = false; // Réactiver Annuler

             // Mettre à jour les autres vues de l'application
             if (inventoryView.classList.contains('active-view')) await displayInventory(currentInventoryPage);
             if (auditView.classList.contains('active-view')) await displayAudit();
             if (logView.classList.contains('active-view')) await displayLog(1);
             if (lastDisplayedDrawerRef === ref) await updateSevenSegmentForComponent(ref);

             // Mettre à jour le kit
             const kitIndex = currentKitSelection.findIndex(k => k.ref === ref);
             if (kitIndex > -1) {
                 currentKitSelection[kitIndex].quantity = newQuantity;
                 // Faut-il aussi mettre à jour les autres données (attributs etc) ? Non, juste la quantité ici.
                 if (kitView.classList.contains('active-view')) displayCurrentKitDrawers();
             }

         } catch (err) {
             console.error("Erreur lors de la confirmation de la modale:", err);
             if (modalFeedback) {
                 modalFeedback.textContent = `Erreur: ${err.message}`;
                 modalFeedback.className = 'modal-feedback error';
             } else {
                 // Fallback si feedback div n'existe pas
                 showGenericError(`Erreur modale (${ref}): ${err.message}`);
             }
             // En cas d'erreur, réactiver les boutons pour permettre correction/nouvelle tentative
             modalConfirmButton.disabled = (currentModalChange === 0); // Réactiver confirmer si changement != 0
             modalCancelButton.disabled = false;
             // Réactiver +/- basé sur l'état *avant* l'erreur
             const potentialQtyBeforeError = modalInitialQuantity + currentModalChange;
             modalDecreaseButton.disabled = potentialQtyBeforeError <= 0;
             modalIncreaseButton.disabled = false;
         }
     });

    // --- Gestion Afficheur 7 Segments ---
    // (segmentMap, updateSevenSegmentForComponent, updateSevenSegmentDisplayVisuals - Inchangé)
    const segmentMap = { /* '0'-'9', A-Z, '-', '_', '.', '?', ' ' */ '0':'abcdef', '1':'bc', '2':'abged', '3':'abcdg', '4':'fgbc', '5':'afgcd', '6':'afgcde', '7':'abc', '8':'abcdefg', '9':'abcdfg', 'A':'abcefg', 'B':'fcdeg', /* B majuscule est 8 */ 'C':'afed', 'D':'bcdeg', /* D majuscule est 0 */ 'E':'afged', 'F':'afge', 'G':'afcde', 'H':'fbceg', /* H majuscule */ 'I':'bc', 'J':'bcde', 'K':'afceg', /* Approximation */ 'L':'fed', 'M':'aceg', /* Approximation */ 'N':'abcef', /* N majuscule */ 'O':'abcdef', 'P':'abfeg', 'Q':'abcdfg', 'R':'afge', /* R majuscule */ 'S':'afgcd', 'T':'fged', 'U':'bcdef', 'V':'bcef', /* Approximation U sans la barre du bas */ 'W':'bdfg', /* Approximation */ 'X':'fageb', /* Approximation H avec barre milieu */ 'Y':'fgbcd', 'Z':'abdeg', /* Approximation 2 */ '-': 'g', '_': 'd', '.': 'g', /* Utiliser g pour point/tiret */ '?': 'abgedg', /* ? avec point */ ' ':'', /* Espace vide */ };
    async function updateSevenSegmentForComponent(ref) {
        // Ne rien faire si l'élément n'existe pas ou si l'utilisateur n'est pas connecté
        if (!sevenSegmentDisplay || !currentUser) {
            lastDisplayedDrawerRef = null;
            lastDisplayedDrawerThreshold = null;
            if (sevenSegmentDisplay) updateSevenSegmentDisplayVisuals('    ', 'off'); // Éteindre l'afficheur
            return;
        }

        lastDisplayedDrawerRef = ref; // Mémoriser la ref affichée

        if (!ref) {
            // Si ref est null, afficher des tirets et éteindre (ou état neutre)
            updateSevenSegmentDisplayVisuals('----', 'off');
            lastDisplayedDrawerThreshold = null;
            return;
        }

        try {
            // Récupérer juste les infos nécessaires: drawer, quantity, critical_threshold
            const { data: item, error } = await supabase
                .from('inventory')
                .select('drawer, quantity, critical_threshold')
                .eq('ref', ref)
                .maybeSingle(); // Gère le cas où l'item n'existe pas

            if (error && error.code !== 'PGRST116') {
                // Erreur base de données autre que "non trouvé"
                throw new Error(`Erreur DB récupération 7seg: ${error.message}`);
            }

            if (item && item.drawer) {
                // Item trouvé AVEC un tiroir défini
                const drawer = item.drawer.toUpperCase().replace(/\s/g, '_').slice(0, 4).padEnd(4, ' '); // Nettoyer et formater
                const status = getStockStatus(item.quantity, item.critical_threshold); // Obtenir le statut
                lastDisplayedDrawerThreshold = item.critical_threshold; // Mémoriser le seuil
                updateSevenSegmentDisplayVisuals(drawer, status); // Mettre à jour l'affichage visuel
            } else if (item && !item.drawer) {
                 // Item trouvé SANS tiroir défini
                 updateSevenSegmentDisplayVisuals('----', 'unknown'); // Afficher tirets, statut inconnu/neutre
                 lastDisplayedDrawerThreshold = item.critical_threshold; // Mémoriser quand même le seuil
            } else {
                // Item non trouvé (error.code === 'PGRST116' ou data est null)
                console.log(`7seg: Composant ${ref} non trouvé.`);
                updateSevenSegmentDisplayVisuals('NFND', 'critical'); // Afficher "Not Found" en rouge
                lastDisplayedDrawerThreshold = null;
            }

        } catch (err) {
            console.error(`Erreur mise à jour 7 segments pour ${ref}:`, err);
            updateSevenSegmentDisplayVisuals('ERR ', 'critical'); // Afficher "ERR " en rouge
            lastDisplayedDrawerThreshold = null;
        }
    }
    function updateSevenSegmentDisplayVisuals(drawerValue, status = 'unknown') {
        if (!sevenSegmentDisplay || !segmentDigits || segmentDigits.length < 4) return;

        // Gérer l'état global de l'afficheur (allumé/éteint/couleur)
        if (status === 'off' || !drawerValue || String(drawerValue).trim() === '') {
            // Éteindre complètement
            sevenSegmentDisplay.className = 'seven-segment-display display-off'; // Assurer la classe de base + off
            status = 'off'; // Forcer statut off pour la logique suivante
        } else {
            // Allumer et appliquer la classe de statut pour la couleur
            sevenSegmentDisplay.className = 'seven-segment-display'; // Classe de base
            sevenSegmentDisplay.classList.add(`status-${status}`); // Ajouter status-ok, status-warning, etc.
        }

        // Mettre à jour chaque digit
        for (let i = 0; i < 4; i++) {
            const digitElement = segmentDigits[i];
            if (!digitElement) continue;

            // Obtenir le caractère à afficher (ou espace si drawerValue trop court)
            const char = (drawerValue[i] || ' ').toUpperCase(); // Toujours en majuscule pour la map

            // Trouver les segments à allumer pour ce caractère
            const segmentsOn = segmentMap[char] ?? segmentMap['?']; // Utiliser '?' si caractère inconnu

            // Parcourir les 7 segments (a-g) de ce digit
            ['a', 'b', 'c', 'd', 'e', 'f', 'g'].forEach(seg => {
                const segmentElement = digitElement.querySelector(`.segment-${seg}`);
                if (segmentElement) {
                    // Allumer ou éteindre le segment
                    if (status !== 'off' && segmentsOn.includes(seg)) {
                        segmentElement.classList.add('on');
                    } else {
                        segmentElement.classList.remove('on');
                    }
                }
            });
        }
    }

    // --- Logique pour la vue Paramètres ---
    // (loadSettingsData, showSettingsFeedback, downloadFile, handleExportInventoryCSV, handleExportLogTXT, handleImportInventoryCSV, resetImportState, addSettingsEventListeners - Inchangé)
    function loadSettingsData() {
        // Fonction appelée quand on active la vue Paramètres
        console.log("Vue Paramètres chargée.");
        // Réinitialiser les zones de feedback
        if(exportFeedbackDiv) { exportFeedbackDiv.style.display = 'none'; exportFeedbackDiv.textContent = '';}
        if(importFeedbackDiv) { importFeedbackDiv.style.display = 'none'; importFeedbackDiv.textContent = '';}
        // Réinitialiser l'état de l'import (champ fichier, boutons)
        resetImportState();
    }
    function showSettingsFeedback(type, message, level = 'info') {
        let feedbackDiv;
        if (type === 'export') feedbackDiv = exportFeedbackDiv;
        else if (type === 'import') feedbackDiv = importFeedbackDiv;
        else feedbackDiv = genericFeedbackDiv; // Fallback sur le feedback générique

        if (!feedbackDiv) {
            console.log(`Settings Feedback (${type}, ${level}): ${message}`);
            return;
        }

        feedbackDiv.textContent = message;
        feedbackDiv.className = `feedback-area ${level}`; // Appliquer la classe de style (info, success, warning, error)
        feedbackDiv.style.display = message ? 'block' : 'none'; // Afficher ou cacher

        // Cacher automatiquement après un délai, sauf si c'est une erreur
        if (level !== 'error') {
            setTimeout(() => {
                // Vérifier si le message est toujours le même avant de cacher
                // (évite de cacher un nouveau message arrivé entre-temps)
                if (feedbackDiv.textContent === message) {
                    feedbackDiv.style.display = 'none';
                }
            }, level === 'info' ? 3000 : 5000); // 3s pour info, 5s pour succès/warning
        }
    }
    function downloadFile(filename, content, mimeType) {
        try {
            const blob = new Blob([content], { type: mimeType });

            // Utiliser FileSaver.js si disponible (meilleure compatibilité)
            if (typeof saveAs !== 'undefined') {
                saveAs(blob, filename);
            } else {
                // Fallback méthode standard (moins fiable sur certains navigateurs)
                console.warn("FileSaver.js non détecté, utilisation de la méthode de téléchargement standard.");
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a); // Requis pour Firefox
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url); // Libérer la mémoire
            }
            console.log(`Fichier "${filename}" préparé pour le téléchargement.`);
        } catch (e) {
            console.error("Erreur lors de la création/téléchargement du fichier:", e);
            // Afficher l'erreur dans la section export
            showSettingsFeedback('export', `Erreur lors de la création du fichier: ${e.message}`, 'error');
        }
    }
    async function handleExportInventoryCSV() {
        showSettingsFeedback('export', 'Préparation de l\'export CSV de l\'inventaire...', 'info');
        if (!supabase) { showSettingsFeedback('export', 'Erreur: Client Supabase non initialisé.', 'error'); return; }
        if (typeof Papa === 'undefined') { showSettingsFeedback('export', 'Erreur: Librairie PapaParse (pour CSV) non chargée.', 'error'); return; }

        try {
            console.log("Export CSV: Récupération de tout l'inventaire...");
            // Récupérer TOUS les items, le tri n'est pas crucial ici mais peut aider à la cohérence
            const { data: allItems, error: fetchError } = await supabase
                .from('inventory')
                .select(`
                    ref, description, quantity, manufacturer, datasheet, drawer,
                    critical_threshold, attributes,
                    categories ( name )
                `)
                .order('ref'); // Trier par ref pour un fichier plus ordonné

            if (fetchError) throw new Error(`Erreur lors de la récupération des données: ${fetchError.message}`);

            console.log(`Export CSV: ${allItems?.length || 0} éléments récupérés.`);
            if (!allItems || allItems.length === 0) {
                showSettingsFeedback('export', 'L\'inventaire est vide, rien à exporter.', 'warning');
                return;
            }

            // Transformer les données pour le CSV
            const csvData = allItems.map(item => ({
                ref: item.ref,
                quantity: item.quantity,
                description: item.description || '',
                manufacturer: item.manufacturer || '',
                datasheet: item.datasheet || '',
                drawer: item.drawer || '',
                category_name: item.categories?.name || '', // Nom de la catégorie
                critical_threshold: item.critical_threshold ?? '', // Seuil critique (vide si null)
                // Sérialiser les attributs JSONB en string JSON pour le CSV
                attributes: (item.attributes && typeof item.attributes === 'object') ? JSON.stringify(item.attributes) : ''
            }));

            // Convertir en chaîne CSV avec PapaParse
            const csvString = Papa.unparse(csvData, {
                header: true,       // Inclure l'en-tête
                quotes: true,       // Mettre des guillemets autour des champs
                delimiter: ",",     // Séparateur virgule
                newline: "\r\n"     // Standard Windows/CSV
            });

            // Préparer et télécharger le fichier
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
            const filename = `stockav_inventory_${timestamp}.csv`;
            // Ajouter BOM UTF-8 pour meilleure compatibilité Excel
            downloadFile(filename, "\uFEFF" + csvString, 'text/csv;charset=utf-8');

            showSettingsFeedback('export', `Export CSV (${allItems.length} éléments) réussi.`, 'success');

        } catch (err) {
            console.error("Erreur lors de l'export CSV:", err);
            showSettingsFeedback('export', `Erreur lors de l'export CSV: ${err.message}`, 'error');
        }
    }
    async function handleExportLogTXT() {
        showSettingsFeedback('export', 'Préparation de l\'export TXT de l\'historique...', 'info');
        if (!supabase) { showSettingsFeedback('export', 'Erreur: Client Supabase non initialisé.', 'error'); return; }

        try {
            console.log("Export Log TXT: Récupération de tout l'historique...");
            // Récupérer TOUTES les entrées de log, triées par date (la plus ancienne en premier)
            const { data: allLogs, error: fetchError } = await supabase
                .from('log')
                .select('created_at, user_code, action, item_ref, quantity_change, final_quantity')
                .order('created_at', { ascending: true }); // Trier par date croissante

            if (fetchError) throw new Error(`Erreur lors de la récupération de l'historique: ${fetchError.message}`);

            console.log(`Export Log TXT: ${allLogs?.length || 0} entrées récupérées.`);
            if (!allLogs || allLogs.length === 0) {
                showSettingsFeedback('export', 'L\'historique est vide, rien à exporter.', 'warning');
                return;
            }

            // Construire le contenu du fichier texte formaté
            let fileContent = `Historique StockAV - Export du ${new Date().toLocaleString('fr-FR')}\n`;
            fileContent += `=========================================================================================\n`;
            // Définir les largeurs de colonnes pour l'alignement
            const dateWidth = 20;
            const userWidth = 8;
            const actionWidth = 18;
            const refWidth = 18; // Augmenté pour refs longues
            const changeWidth = 10;
            const finalQtyWidth = 12;
            // En-tête
            fileContent +=
                'Date & Heure'.padEnd(dateWidth) + ' | ' +
                'Tech.'.padEnd(userWidth) + ' | ' +
                'Action'.padEnd(actionWidth) + ' | ' +
                'Référence'.padEnd(refWidth) + ' | ' +
                '+/-'.padEnd(changeWidth) + ' | ' +
                'Stock Final'.padEnd(finalQtyWidth) + '\n';
            // Ligne séparatrice
            fileContent +=
                ''.padEnd(dateWidth, '-') + '-+-' +
                ''.padEnd(userWidth, '-') + '-+-' +
                ''.padEnd(actionWidth, '-') + '-+-' +
                ''.padEnd(refWidth, '-') + '-+-' +
                ''.padEnd(changeWidth, '-') + '-+-' +
                ''.padEnd(finalQtyWidth, '-') + '\n';

            // Ajouter chaque entrée de log
            allLogs.forEach(log => {
                const date = formatLogTimestamp(log.created_at).padEnd(dateWidth);
                const user = (log.user_code || 'N/A').toUpperCase().padEnd(userWidth);
                const action = (log.action || 'Inconnue').padEnd(actionWidth);
                const ref = (log.item_ref || 'N/A').padEnd(refWidth);
                // Formatage du changement (+1, -1, 0, N/A)
                const changeNum = log.quantity_change;
                let changeStr = 'N/A';
                if (changeNum !== null && changeNum !== undefined) {
                   changeStr = changeNum > 0 ? `+${changeNum}` : String(changeNum);
                }
                const change = changeStr.padEnd(changeWidth);
                // Quantité finale (ou N/A)
                const finalQty = (log.final_quantity === null || log.final_quantity === undefined ? 'N/A' : log.final_quantity).toString().padEnd(finalQtyWidth);

                fileContent += `${date} | ${user} | ${action} | ${ref} | ${change} | ${finalQty}\n`;
            });

            // Générer et télécharger le fichier
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
            const filename = `stockav_log_${timestamp}.txt`;
            downloadFile(filename, fileContent, 'text/plain;charset=utf-8');

            showSettingsFeedback('export', `Export TXT (${allLogs.length} entrées) réussi.`, 'success');

        } catch (err) {
            console.error("Erreur lors de l'export TXT de l'historique:", err);
            showSettingsFeedback('export', `Erreur lors de l'export TXT: ${err.message}`, 'error');
        }
    }
    async function handleImportInventoryCSV() {
        if (!importCsvFileInput?.files || importCsvFileInput.files.length === 0) {
            showSettingsFeedback('import', 'Veuillez d\'abord sélectionner un fichier CSV.', 'warning');
            return;
        }
        if (!supabase) { showSettingsFeedback('import', 'Erreur: Client Supabase non initialisé.', 'error'); return; }
        if (typeof Papa === 'undefined') { showSettingsFeedback('import', 'Erreur: Librairie PapaParse (pour CSV) non chargée.', 'error'); return; }

        const file = importCsvFileInput.files[0];
        const modeRadio = document.querySelector('input[name="import-mode"]:checked');
        const importMode = modeRadio ? modeRadio.value : 'enrich'; // 'enrich' ou 'overwrite'

        // Confirmation pour le mode Écraser
        if (importMode === 'overwrite') {
            if (!confirm("ATTENTION !\n\nLe mode 'Écraser et Remplacer' va SUPPRIMER TOUT l'inventaire et TOUT l'historique actuels avant d'importer le nouveau fichier.\n\nCette action est IRRÉVERSIBLE.\n\nÊtes-vous absolument sûr de vouloir continuer ?")) {
                showSettingsFeedback('import', 'Importation annulée par l\'utilisateur.', 'info');
                resetImportState(); // Réinitialiser pour permettre nouvelle sélection
                return;
            }
        }

        showSettingsFeedback('import', `Importation CSV en mode '${importMode}'... Lecture du fichier "${file.name}"...`, 'info');
        // Désactiver les contrôles pendant l'import
        importInventoryCsvButton.disabled = true;
        importCsvFileInput.disabled = true;
        document.querySelectorAll('input[name="import-mode"]').forEach(radio => radio.disabled = true);

        try {
            // 1. Charger les catégories pour mapper les noms aux IDs
            //    Faire cela avant toute suppression potentielle
            await getCategories();
            const categoryNameToIdMap = new Map(categoriesCache.map(cat => [cat.name.toLowerCase(), cat.id]));
            console.log("Import CSV: Map Nom Catégorie -> ID créée:", categoryNameToIdMap);

            // 2. Parser le fichier CSV avec PapaParse
            Papa.parse(file, {
                header: true,           // Utiliser la première ligne comme en-tête
                skipEmptyLines: 'greedy',// Ignorer les lignes vides et celles avec juste des délimiteurs
                encoding: "UTF-8",      // Spécifier l'encodage
                transformHeader: header => header.trim().toLowerCase().replace(/\s+/g, '_'), // Nettoyer les en-têtes (lowercase, underscore)
                complete: async (results) => {
                    // --- Callback exécuté après parsing complet ---
                    const data = results.data;
                    const errors = results.errors;
                    const headers = results.meta.fields; // Headers nettoyés

                    console.log("Import CSV: Parsing terminé.", results.meta);
                    console.log("Import CSV: Headers détectés:", headers);
                    // console.log("Import CSV: Données brutes:", data); // Attention, peut être très volumineux

                    // --- Validation des erreurs de parsing ---
                    if (errors.length > 0) {
                        console.error("Import CSV: Erreurs lors du parsing PapaParse:", errors);
                        // Afficher la première erreur rencontrée
                        const firstError = errors[0];
                        throw new Error(`Erreur de parsing CSV à la ligne ${firstError.row + 2}: ${firstError.message}. Vérifiez le format du fichier.`);
                    }

                    // --- Validation des headers requis ---
                    const requiredHeaders = ['ref', 'quantity']; // Minimum requis
                    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
                    if (missingHeaders.length > 0) {
                        throw new Error(`Erreur CSV: Les colonnes suivantes sont manquantes: ${missingHeaders.join(', ')}.`);
                    }

                    if (data.length === 0) {
                        showSettingsFeedback('import', 'Le fichier CSV est vide ou ne contient aucune donnée valide.', 'warning');
                        resetImportState();
                        return;
                    }

                    showSettingsFeedback('import', `Lecture CSV réussie (${data.length} lignes trouvées). Validation des données...`, 'info');

                    // --- Préparation pour l'import ---
                    let itemsToUpsert = [];
                    const processingErrors = []; // Erreurs/Warnings de validation
                    let uniqueRefs = new Set();

                    // --- Mode Écraser: Suppression des anciennes données ---
                    if (importMode === 'overwrite') {
                        showSettingsFeedback('import', `Mode Écraser: Suppression de l'historique existant...`, 'info');
                        console.log("Import CSV (Overwrite): Deleting log entries...");
                        const { error: deleteLogError } = await supabase.from('log').delete().neq('id', 0); // Supprime tout sauf une ligne fictive potentielle
                        if (deleteLogError) throw new Error(`Échec de la suppression de l'historique: ${deleteLogError.message}`);

                        showSettingsFeedback('import', `Mode Écraser: Suppression de l'inventaire existant...`, 'info');
                        console.log("Import CSV (Overwrite): Deleting inventory items...");
                        const { error: deleteInvError } = await supabase.from('inventory').delete().neq('ref', 'dummy'); // Supprime tout
                        if (deleteInvError) throw new Error(`Échec de la suppression de l'inventaire: ${deleteInvError.message}`);

                        console.log("Import CSV (Overwrite): Ancien stock et historique supprimés.");
                        showSettingsFeedback('import', `Ancien stock/log supprimé. Validation et préparation de ${data.length} lignes...`, 'info');
                    }

                    // --- Validation Ligne par Ligne ---
                    for (let i = 0; i < data.length; i++) {
                        const row = data[i];
                        const lineNumber = i + 2; // +1 pour index 0, +1 pour header

                        // Nettoyer et valider 'ref'
                        const ref = row.ref?.trim().toUpperCase();
                        if (!ref) { processingErrors.push(`L${lineNumber}: Référence manquante.`); continue; }
                        if (ref.length > 50) { processingErrors.push(`L${lineNumber} (${ref}): Référence trop longue (max 50).`); continue; }
                        if (uniqueRefs.has(ref)) { processingErrors.push(`L${lineNumber}: Référence "${ref}" est dupliquée dans le fichier.`); continue; }
                        uniqueRefs.add(ref);

                        // Nettoyer et valider 'quantity'
                        const quantityRaw = row.quantity;
                        const quantity = parseInt(quantityRaw, 10);
                        if (quantityRaw === null || quantityRaw === undefined || quantityRaw === '' || isNaN(quantity) || quantity < 0) {
                             processingErrors.push(`L${lineNumber} (${ref}): Quantité invalide ou négative: "${quantityRaw}". Sera mis à 0.`);
                             // Forcer à 0 si invalide, mais continuer l'import de l'item
                             row.quantity = 0;
                        } else {
                            row.quantity = quantity; // Assurer que c'est bien un nombre
                        }


                        // Mapper 'category_name' à 'category_id'
                        let categoryId = null;
                        const categoryName = row.category_name?.trim().toLowerCase();
                        if (categoryName) {
                            categoryId = categoryNameToIdMap.get(categoryName);
                            if (!categoryId) {
                                processingErrors.push(`L${lineNumber} (${ref}): Catégorie "${row.category_name}" non trouvée. Sera importé sans catégorie.`);
                                // categoryId reste null
                            }
                        }

                        // Valider 'critical_threshold'
                        const thresholdRaw = row.critical_threshold?.trim();
                        let critical_threshold = null;
                        if (thresholdRaw && thresholdRaw !== '') {
                            const threshold = parseInt(thresholdRaw, 10);
                            if (!isNaN(threshold) && threshold >= 0) {
                                critical_threshold = threshold;
                            } else {
                                processingErrors.push(`L${lineNumber} (${ref}): Seuil critique invalide: "${thresholdRaw}". Sera ignoré.`);
                            }
                        }

                        // Parser 'attributes' (doit être une string JSON valide)
                        let attributes = null;
                        const attributesRaw = row.attributes?.trim();
                        if (attributesRaw) {
                            try {
                                attributes = JSON.parse(attributesRaw);
                                // Vérifier que c'est bien un objet et non un array ou autre chose
                                if (typeof attributes !== 'object' || attributes === null || Array.isArray(attributes)) {
                                    processingErrors.push(`L${lineNumber} (${ref}): La colonne 'attributes' doit contenir un objet JSON (ex: {"Type":"Céramique"}). Reçu: "${attributesRaw}". Ignoré.`);
                                    attributes = null;
                                }
                            } catch (e) {
                                processingErrors.push(`L${lineNumber} (${ref}): Erreur de parsing JSON pour les attributs: ${e.message}. Reçu: "${attributesRaw}". Ignoré.`);
                                attributes = null;
                            }
                        }

                        // Ajouter l'item préparé à la liste d'upsert
                        itemsToUpsert.push({
                            ref: ref,
                            quantity: row.quantity, // Utiliser la quantité validée/corrigée
                            description: row.description?.trim() || null,
                            manufacturer: row.manufacturer?.trim() || null,
                            datasheet: row.datasheet?.trim() || null,
                            drawer: row.drawer?.trim().toUpperCase() || null,
                            category_id: categoryId, // ID ou null
                            critical_threshold: critical_threshold, // Seuil ou null
                            attributes: attributes // Objet JSON ou null
                        });
                    } // Fin boucle for (validation)

                    // --- Afficher les erreurs de validation ---
                    if (processingErrors.length > 0) {
                        const errorMsg = `Validation terminée avec ${processingErrors.length} erreurs/warnings (voir console). ${itemsToUpsert.length} lignes seront importées.`;
                        showSettingsFeedback('import', errorMsg, 'warning'); // Afficher comme warning
                        console.warn("Import CSV: Erreurs/Warnings de validation:", processingErrors);
                        if (itemsToUpsert.length === 0) {
                            // Si aucune ligne n'est valide après les erreurs, arrêter
                            throw new Error("Aucune ligne valide à importer après validation.");
                        }
                    } else {
                        showSettingsFeedback('import', `Validation OK. ${itemsToUpsert.length} lignes prêtes pour l'importation...`, 'info');
                    }

                    // --- Importation par Lots (Upsert) ---
                    const batchSize = 500; // Taille raisonnable pour upsert
                    let importedCount = 0;
                    console.log(`Import CSV: Début de l'upsert par lots de ${batchSize}...`);

                    for (let i = 0; i < itemsToUpsert.length; i += batchSize) {
                        const batch = itemsToUpsert.slice(i, i + batchSize);
                        const batchNum = Math.floor(i / batchSize) + 1;
                        const totalBatches = Math.ceil(itemsToUpsert.length / batchSize);

                        showSettingsFeedback('import', `Importation du lot ${batchNum}/${totalBatches} (${batch.length} lignes)...`, 'info');
                        console.log(`Import CSV: Upserting batch ${batchNum} (${batch.length} items)...`);

                        const { error: upsertError } = await supabase
                            .from('inventory')
                            .upsert(batch, { onConflict: 'ref' }); // Upsert basé sur la référence

                        if (upsertError) {
                            // Construire un message d'erreur détaillé
                            let detailMsg = upsertError.message;
                            if (upsertError.details) detailMsg += ` | Détails: ${upsertError.details}`;
                            if (upsertError.hint) detailMsg += ` | Indice: ${upsertError.hint}`;
                            console.error("Import CSV: Erreur lors de l'Upsert du lot:", detailMsg, upsertError);
                            throw new Error(`Erreur lors de l'importation du lot ${batchNum}: ${detailMsg}`);
                        }
                        importedCount += batch.length;
                        console.log(`Import CSV: Lot ${batchNum} importé avec succès.`);
                    }

                    // --- Fin de l'Importation ---
                    let successMsg = `Importation en mode '${importMode}' terminée. ${importedCount} composants traités.`;
                    if (processingErrors.length > 0) {
                         successMsg += ` (${processingErrors.length} lignes ignorées ou avec warnings - voir console).`;
                    }
                    showSettingsFeedback('import', successMsg, 'success');
                    console.log("Import CSV: Importation terminée.");

                    // --- Mettre à jour l'UI ---
                    if (inventoryView.classList.contains('active-view')) await displayInventory(1);
                    if (auditView.classList.contains('active-view')) await displayAudit();
                    // Recharger le log seulement si on a écrasé
                    if (importMode === 'overwrite' && logView.classList.contains('active-view')) await displayLog(1);

                }, // Fin callback 'complete'
                error: (err, file) => {
                    // --- Callback exécuté si PapaParse rencontre une erreur majeure ---
                    console.error("Import CSV: Erreur majeure PapaParse:", err, file);
                    showSettingsFeedback('import', `Erreur critique lors de la lecture du fichier CSV: ${err.message}`, 'error');
                    resetImportState(); // Réactiver les contrôles en cas d'erreur de lecture
                }
            }); // Fin Papa.parse

        } catch (err) {
            // --- Attrape les erreurs levées pendant le processus (validation, suppression, upsert) ---
            console.error("Erreur globale lors du processus d'importation CSV:", err);
            showSettingsFeedback('import', `Erreur d'importation: ${err.message}`, 'error');
            // Laisser les contrôles désactivés si une erreur grave s'est produite ?
            // Ou les réactiver pour permettre une nouvelle tentative ? => Plutôt réactiver.
             resetImportState();
        } finally {
            // Ce finally s'exécute après le try/catch externe, mais potentiellement avant
            // la fin du callback 'complete' de Papa.parse (qui est asynchrone).
            // Il vaut mieux réactiver les contrôles dans 'complete' ou dans 'error'.
            // MAIS on peut s'assurer de les réactiver SI aucune erreur n'est affichée
             if (!importFeedbackDiv?.classList.contains('error')) {
                 resetImportState();
             }
        }
    }
    function resetImportState() {
        if(importCsvFileInput) {
            importCsvFileInput.value = ''; // Vider la sélection de fichier
            importCsvFileInput.disabled = false; // Réactiver
        }
        if(importInventoryCsvButton) importInventoryCsvButton.disabled = false; // Réactiver
        // Réactiver les boutons radio de mode
        document.querySelectorAll('input[name="import-mode"]').forEach(radio => radio.disabled = false);
        // Optionnel: Resélectionner le mode par défaut ('enrich')
        const enrichRadio = document.getElementById('import-mode-enrich');
        if (enrichRadio) enrichRadio.checked = true;

        // Cacher le feedback s'il n'affiche pas une erreur persistante
        if (importFeedbackDiv && !importFeedbackDiv.classList.contains('error')) {
            importFeedbackDiv.style.display = 'none';
            importFeedbackDiv.textContent = '';
        }
    }
    function addSettingsEventListeners() {
        exportInventoryCsvButton?.addEventListener('click', handleExportInventoryCSV);
        exportLogTxtButton?.addEventListener('click', handleExportLogTXT);
        importInventoryCsvButton?.addEventListener('click', handleImportInventoryCSV);
        // Peut-être ajouter un listener sur importCsvFileInput pour afficher le nom du fichier choisi ?
        importCsvFileInput?.addEventListener('change', () => {
            if (importCsvFileInput.files && importCsvFileInput.files.length > 0) {
                 showSettingsFeedback('import', `Fichier sélectionné: ${importCsvFileInput.files[0].name}`, 'info');
            } else {
                 showSettingsFeedback('import', '', 'info'); // Cacher si aucun fichier
            }
        });
    }

    // --- FONCTIONS POUR L'AUDIT ---
    // (populateAuditFilters, displayAudit, updateDifferenceAndButtonState, handleAdjustStock, showAuditFeedback - Inchangé)
    async function populateAuditFilters() {
        if (!auditCategoryFilter) return;
        try {
            const currentCategoryValue = auditCategoryFilter.value;
            auditCategoryFilter.innerHTML = '<option value="all">Toutes les catégories</option>'; // Texte plus clair

            // Assurer que le cache est rempli
            if (categoriesCache.length === 0 && currentUser) await getCategories();

            categoriesCache.sort((a, b) => a.name.localeCompare(b.name)).forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id; // Utiliser l'ID
                option.textContent = escapeHtml(cat.name);
                auditCategoryFilter.appendChild(option);
            });

            // Restaurer la sélection si elle existe toujours
            if (categoriesCache.some(cat => String(cat.id) === String(currentCategoryValue))) {
                auditCategoryFilter.value = currentCategoryValue;
            } else {
                auditCategoryFilter.value = 'all'; // Revenir à 'Toutes'
            }
        } catch (err) {
            console.error("Erreur lors de la population des filtres d'audit:", err);
            auditCategoryFilter.innerHTML = '<option value="all" disabled>Erreur chargement</option>';
        }
    }
    async function displayAudit() {
        if (!auditTableBody || !supabase || !currentUser) {
            if (auditTableBody) auditTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">${currentUser ? 'Erreur interne ou DOM manquant.' : 'Connexion requise pour l\'audit.'}</td></tr>`;
            return;
        }

        auditTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;"><i>Chargement de la liste d'audit...</i></td></tr>`;
        if(auditNoResults) auditNoResults.style.display = 'none';
        showAuditFeedback('', 'info', true); // Cacher feedback précédent

        // Récupérer les filtres
        const categoryId = auditCategoryFilter?.value || 'all';
        const drawerFilter = auditDrawerFilter?.value.trim().toUpperCase() || ''; // Filtre tiroir (peut contenir *)

        try {
            // Construire la requête de base
            let query = supabase
                .from('inventory')
                .select('ref, description, drawer, quantity') // Sélectionner les colonnes nécessaires
                // Trier par tiroir puis par référence pour regrouper
                .order('drawer', { ascending: true, nullsFirst: false }) // Tiroirs définis en premier
                .order('ref', { ascending: true });

            // Appliquer filtre catégorie si sélectionné
            if (categoryId !== 'all') {
                query = query.eq('category_id', categoryId);
            }

            // Appliquer filtre tiroir si fourni (supporte wildcard *)
            if (drawerFilter) {
                // Remplacer * par % pour la requête ILIKE
                const drawerPattern = drawerFilter.replace(/\*/g, '%');
                query = query.ilike('drawer', drawerPattern); // Recherche insensible à la casse
            }

            // Exécuter la requête
            console.log("Executing audit query...");
            const { data, error } = await query;

            auditTableBody.innerHTML = ''; // Vider le message de chargement

            if (error) {
                throw new Error(`Erreur base de données lors de la récupération pour l'audit: ${error.message}`);
            }

            if (!data || data.length === 0) {
                // Aucun composant trouvé pour ces filtres
                if (auditNoResults) {
                    auditNoResults.textContent = "Aucun composant trouvé correspondant aux filtres sélectionnés.";
                    auditTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 20px;">${auditNoResults.textContent}</td></tr>`;
                    auditNoResults.style.display = 'none'; // Cacher le <p>
                }
            } else {
                // Afficher les composants trouvés
                if (auditNoResults) auditNoResults.style.display = 'none'; // Cacher le <p>

                data.forEach(item => {
                    const row = auditTableBody.insertRow();
                    row.dataset.ref = item.ref; // Stocker la réf pour l'ajustement

                    // Colonnes: Ref, Desc, Tiroir
                    row.insertCell().textContent = item.ref;
                    row.insertCell().textContent = item.description || '-';
                    row.insertCell().textContent = item.drawer || 'N/A'; // Afficher N/A si null

                    // Colonne Quantité Système (non modifiable)
                    const systemQtyCell = row.insertCell();
                    systemQtyCell.textContent = item.quantity;
                    systemQtyCell.dataset.systemQuantity = item.quantity; // Stocker la valeur initiale
                    systemQtyCell.classList.add('system-qty'); // Pour style éventuel

                    // Colonne Quantité Physique (input)
                    const physicalQtyCell = row.insertCell();
                    const input = document.createElement('input');
                    input.type = 'number';
                    input.min = '0'; // Quantité physique ne peut être négative
                    input.classList.add('physical-qty-input');
                    input.dataset.ref = item.ref; // Lier l'input à la ref
                    input.value = item.quantity; // Pré-remplir avec la quantité système
                    input.addEventListener('input', () => updateDifferenceAndButtonState(row)); // Mettre à jour à chaque frappe
                    input.addEventListener('change', () => updateDifferenceAndButtonState(row));// Mettre à jour si valeur change (blur, etc)
                    input.addEventListener('keypress', (e) => {
                        // Valider l'ajustement si Entrée est pressée dans l'input
                        if (e.key === 'Enter') {
                            e.preventDefault(); // Empêcher soumission formulaire si existant
                            const adjustButton = row.querySelector('button.adjust-button');
                            if (adjustButton && !adjustButton.disabled) {
                                adjustButton.click(); // Simuler clic sur Ajuster
                            }
                        }
                    });
                    physicalQtyCell.appendChild(input);

                    // Colonne Différence (calculée)
                    const diffCell = row.insertCell();
                    diffCell.classList.add('difference');
                    diffCell.textContent = '0'; // Initialement 0

                    // Colonne Action (bouton Ajuster)
                    const actionCell = row.insertCell();
                    const button = document.createElement('button');
                    button.textContent = 'Ajuster';
                    button.classList.add('adjust-button', 'action-button', 'primary');
                    button.disabled = true; // Désactivé par défaut (différence = 0)
                    button.addEventListener('click', () => handleAdjustStock(row, button, input));
                    actionCell.appendChild(button);

                    // Calculer la différence initiale (devrait être 0)
                    updateDifferenceAndButtonState(row);
                });
            }
        } catch (err) {
            console.error("Erreur lors de l'affichage de l'audit:", err);
            auditTableBody.innerHTML = `<tr><td colspan="7" class="error-message" style="text-align:center; color: var(--error-color);">Erreur chargement audit: ${err.message}</td></tr>`;
            if (auditNoResults) {
                auditNoResults.textContent = 'Erreur lors du chargement des données d\'audit.';
                auditNoResults.style.display = 'block';
            }
        }
    }
        function updateDifferenceAndButtonState(row) {
        const systemQtyCell = row.cells[3]; // Cellule Qté Système
        const physicalInput = row.querySelector('input.physical-qty-input');
        const diffCell = row.cells[5]; // Cellule Différence
        const adjustButton = row.querySelector('button.adjust-button'); // Le bouton est ici

        if (!systemQtyCell || !physicalInput || !diffCell || !adjustButton) {
            console.error("Éléments manquants dans la ligne d'audit pour màj différence.");
            return;
        }

        const systemQty = parseInt(systemQtyCell.dataset.systemQuantity, 10); // Qté initiale stockée
        const physicalQtyRaw = physicalInput.value;
        let physicalQty = NaN;

        // Valider la quantité physique entrée
        if (physicalQtyRaw !== '' && !isNaN(parseInt(physicalQtyRaw, 10)) && parseInt(physicalQtyRaw, 10) >= 0) {
            physicalQty = parseInt(physicalQtyRaw, 10);
            physicalInput.classList.remove('input-error'); // Enlever style erreur si valide
        } else {
            physicalInput.classList.add('input-error'); // Ajouter style erreur si invalide
        }

        // Si la quantité physique est valide, calculer et afficher la différence
        if (!isNaN(physicalQty)) {
            const difference = physicalQty - systemQty;
            diffCell.textContent = difference;
            // Appliquer style basé sur la différence
            diffCell.classList.toggle('positive', difference > 0);
            diffCell.classList.toggle('negative', difference < 0);
            diffCell.classList.remove('error-state'); // Enlever style erreur valeur

            // Activer/Désactiver le bouton Ajuster
            adjustButton.disabled = (difference === 0 || adjustButton.classList.contains('adjusted')); // Désactiver si 0 ou déjà ajusté

            // *** CORRECTION ICI : Utiliser adjustButton au lieu de button ***
            // Changer le texte du bouton si ajusté
            if (adjustButton.classList.contains('adjusted') && difference === 0) {
                 adjustButton.textContent = 'Ajusté ✔';
            } else {
                 adjustButton.textContent = 'Ajuster'; // Texte normal sinon
            }

        } else {
            // Si quantité physique invalide
            diffCell.textContent = 'ERR'; // Indiquer erreur
            diffCell.className = 'difference error-state'; // Appliquer style erreur
            adjustButton.disabled = true; // Désactiver le bouton

            // *** CORRECTION ICI : Utiliser adjustButton au lieu de button ***
            adjustButton.textContent = 'Ajuster'; // Texte normal
        }
    }
    async function handleAdjustStock(row, button, input) {
        if (!row || !button || !input || !currentUser) return;

        const ref = row.dataset.ref;
        const systemQtyCell = row.cells[3];
        const systemQty = parseInt(systemQtyCell.dataset.systemQuantity, 10);
        const physicalQtyRaw = input.value;
        const physicalQty = parseInt(physicalQtyRaw, 10);

        // Re-valider avant d'envoyer
        if (!ref) { showAuditFeedback(`Erreur: Référence manquante pour l'ajustement.`, 'error'); return; }
        if (isNaN(physicalQty) || physicalQty < 0) {
            showAuditFeedback(`Valeur physique entrée pour ${ref} est invalide (${physicalQtyRaw}). Ajustement annulé.`, 'error');
            input.classList.add('input-error');
            input.focus();
            return;
        }

        const difference = physicalQty - systemQty;

        if (difference === 0) {
            showAuditFeedback(`Aucun ajustement nécessaire pour ${ref} (quantités identiques).`, 'info', true);
            button.disabled = true; // Désactiver car pas de différence
            return;
        }

        // Confirmer l'ajustement (optionnel mais recommandé)
        // if (!confirm(`Confirmer l'ajustement pour ${ref} ?\nQuantité Système: ${systemQty}\nQuantité Physique: ${physicalQty}\nDifférence: ${difference}`)) {
        //     return;
        // }

        button.disabled = true;
        button.textContent = 'Ajustement...';
        input.disabled = true; // Désactiver l'input pendant l'opération

        try {
            console.log(`Calling RPC update_stock_and_log from Audit for ${ref}, change: ${difference}`);
            const { data: newQuantity, error: rpcError } = await supabase.rpc('update_stock_and_log', {
                p_ref: ref,
                p_quantity_change: difference, // Envoyer la différence calculée
                p_user_id: currentUser.id,
                p_user_code: currentUserCode,
                p_action_type: 'Audit Adjust' // Type d'action spécifique
            });

            if (rpcError) {
                // Gérer erreurs RPC
                if (rpcError.message.includes('new_quantity_below_zero')) throw new Error("Stock système incohérent (résultat négatif après RPC).");
                if (rpcError.message.includes('component_not_found')) throw new Error("Composant non trouvé lors de l'ajustement (peut-être supprimé ?).");
                throw new Error(`Erreur RPC: ${rpcError.message}`);
            }

            // --- Succès de l'ajustement ---
            // Mettre à jour l'UI de la ligne d'audit
            systemQtyCell.textContent = newQuantity; // Afficher la nouvelle quantité système
            systemQtyCell.dataset.systemQuantity = newQuantity; // Mettre à jour la valeur stockée
            input.value = newQuantity; // Mettre à jour l'input physique pour refléter le nouvel état
            input.classList.remove('input-error');
            input.disabled = false; // Réactiver l'input (peut-être pas nécessaire si on considère l'audit fini pour cette ligne ?)

            updateDifferenceAndButtonState(row); // Recalculer la différence (devrait être 0)

            button.textContent = 'Ajusté ✔'; // Indiquer succès sur le bouton
            button.classList.add('adjusted'); // Ajouter classe pour état visuel/logique
            button.disabled = true; // Laisser désactivé après succès

            // Ajouter un highlight temporaire sur la ligne
            row.classList.add('row-highlighted-success');
            setTimeout(() => row.classList.remove('row-highlighted-success'), 2500);

            showAuditFeedback(`Stock pour ${ref} ajusté avec succès: ${systemQty} -> ${newQuantity}.`, 'success');

            // Mettre à jour les autres vues affectées
            if (inventoryView.classList.contains('active-view')) await displayInventory(currentInventoryPage);
            if (logView.classList.contains('active-view')) await displayLog(1);
            if (lastDisplayedDrawerRef === ref) await updateSevenSegmentForComponent(ref);

            // Mettre à jour le kit
            const kitIndex = currentKitSelection.findIndex(k => k.ref === ref);
            if (kitIndex > -1) {
                currentKitSelection[kitIndex].quantity = newQuantity;
                if (kitView.classList.contains('active-view')) displayCurrentKitDrawers();
            }

        } catch (err) {
            console.error(`Erreur lors de l'ajustement du stock pour ${ref}:`, err);
            showAuditFeedback(`Erreur ajustement ${ref}: ${err.message}`, 'error');
            // En cas d'erreur, réactiver le bouton et l'input pour permettre nouvelle tentative
            button.textContent = 'Erreur!'; // Indiquer erreur sur bouton
            button.disabled = false; // Réactiver
            input.disabled = false;
            input.focus(); // Remettre focus sur l'input
            // Ajouter highlight d'erreur
            row.classList.add('row-highlighted-error');
            setTimeout(() => row.classList.remove('row-highlighted-error'), 3500);
        }
    }
    function showAuditFeedback(message, type = 'info', instantHide = false) {
        if (!auditFeedbackDiv) { console.log(`Audit Feedback (${type}): ${message}`); return; }
        auditFeedbackDiv.textContent = message;
        auditFeedbackDiv.className = `feedback-area ${type}`;
        auditFeedbackDiv.style.display = message ? 'block' : 'none';
        if (type !== 'error') {
            const delay = instantHide ? 0 : 4000; // Délai un peu plus long pour succès/info audit
            setTimeout(() => {
                if (auditFeedbackDiv.textContent === message) {
                    auditFeedbackDiv.style.display = 'none';
                }
            }, delay);
        }
    }

    // --- *** KIT ACTUEL / PRÉLÈVEMENT *** ---
    // (handleKitCheckboxChange, displayCurrentKitDrawers, handleDrawerButtonClick, handleClearKit - Inchangé)
    function handleKitCheckboxChange(event) {
        const checkbox = event.target;
        // Vérifier que c'est bien la checkbox de kit dans le tableau d'inventaire
        if (!checkbox || checkbox.type !== 'checkbox' || !checkbox.classList.contains('kit-select-checkbox') || !inventoryTableBody?.contains(checkbox)) {
            return;
        }

        const ref = checkbox.dataset.ref;
        const row = checkbox.closest('tr'); // Trouver la ligne parente

        if (!ref || !row || !row.dataset.itemData) {
            console.error("Données manquantes (ref ou itemData) sur la ligne pour la checkbox du kit.", checkbox, row);
            // Annuler le changement de la checkbox pour éviter incohérence
            checkbox.checked = !checkbox.checked;
            showGenericError("Erreur lors de la sélection du composant pour le kit.");
            return;
        }

        try {
            // Récupérer les données complètes de l'item depuis l'attribut data
            const itemData = JSON.parse(row.dataset.itemData);

            if (checkbox.checked) {
                // --- Ajouter au kit ---
                // Vérifier qu'il n'y est pas déjà (double sécurité)
                if (!currentKitSelection.some(item => item.ref === ref)) {
                    currentKitSelection.push({ ...itemData }); // Ajouter une copie de l'objet
                    console.log(`Ajout au kit: ${ref}`, itemData);
                    row.classList.add('kit-selected'); // Style visuel sur la ligne
                } else {
                    console.warn(`Tentative d'ajout de ${ref} au kit alors qu'il y est déjà.`);
                }
            } else {
                // --- Retirer du kit ---
                const indexToRemove = currentKitSelection.findIndex(item => item.ref === ref);
                if (indexToRemove > -1) {
                    currentKitSelection.splice(indexToRemove, 1); // Retirer l'élément du tableau
                    console.log(`Retiré du kit: ${ref}`);
                    row.classList.remove('kit-selected'); // Retirer style visuel
                } else {
                    console.warn(`Tentative de retrait de ${ref} du kit alors qu'il n'y est pas.`);
                }
            }

            // Mettre à jour la vue Kit si elle est active
            if (kitView?.classList.contains('active-view') && currentUser) {
                displayCurrentKitDrawers();
            }

        } catch (error) {
            console.error(`Erreur lors de la gestion de la sélection kit pour ${ref}:`, error);
            // Annuler le changement de la checkbox en cas d'erreur
            checkbox.checked = !checkbox.checked;
            showGenericError(`Erreur lors de la sélection de ${ref} pour le kit: ${error.message}`);
        }
    }
    function displayCurrentKitDrawers() {
        if (!currentKitDrawersDiv || !kitFeedbackDiv) {
            console.error("Éléments DOM manquants pour la vue Kit (#current-kit-drawers / #bom-feedback).");
            return;
        }

        currentKitDrawersDiv.innerHTML = ''; // Vider l'affichage précédent

        if (!currentUser) {
            currentKitDrawersDiv.innerHTML = '<p><i>Connectez-vous pour utiliser le kit.</i></p>';
            if (kitFeedbackDiv) kitFeedbackDiv.style.display = 'none';
            return;
        }

        if (currentKitSelection.length === 0) {
            currentKitDrawersDiv.innerHTML = '<p><i>Le kit est vide. Sélectionnez des composants dans l\'onglet Inventaire.</i></p>';
            if (kitFeedbackDiv) kitFeedbackDiv.style.display = 'none'; // Cacher feedback si kit vide
            return;
        }

        // Regrouper les composants par tiroir
        const drawersMap = new Map();
        currentKitSelection.forEach(item => {
            const drawerKey = item.drawer?.trim().toUpperCase() || 'TIROIR_INCONNU'; // Clé pour le map
            if (!drawersMap.has(drawerKey)) {
                // Initialiser l'entrée pour ce tiroir
                drawersMap.set(drawerKey, { items: [], collected: false }); // Ajouter 'collected' status? Non, géré par classe CSS
            }
            // Ajouter l'item à la liste de ce tiroir
            drawersMap.get(drawerKey).items.push(item);
        });

        // Trier les clés (tiroirs) pour un affichage ordonné
        const sortedDrawers = Array.from(drawersMap.keys()).sort((a, b) => {
            // Mettre 'TIROIR_INCONNU' à la fin
            if (a === 'TIROIR_INCONNU') return 1;
            if (b === 'TIROIR_INCONNU') return -1;
            // Tri alphanumérique standard pour les autres
            return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
        });

        // Créer un bouton pour chaque tiroir
        sortedDrawers.forEach(drawerKey => {
            const drawerData = drawersMap.get(drawerKey);
            const itemsInDrawer = drawerData.items;

            // Déterminer le statut le plus critique parmi les items de ce tiroir
            let worstStatus = 'ok';
            let statusPriority = { ok: 1, warning: 2, critical: 3, unknown: 0 };
            itemsInDrawer.forEach(item => {
                const itemStatus = getStockStatus(item.quantity, item.critical_threshold);
                if (statusPriority[itemStatus] > statusPriority[worstStatus]) {
                    worstStatus = itemStatus;
                }
            });

            // Créer le bouton
            const button = document.createElement('button');
            button.classList.add('drawer-button');
            // Appliquer la classe de statut pour la couleur de fond/bordure
            button.classList.add(`status-${worstStatus}`);
            button.dataset.drawer = drawerKey; // Stocker la clé du tiroir
            // Texte du bouton (numéro ou '?')
            button.textContent = drawerKey === 'TIROIR_INCONNU' ? '?' : drawerKey;

            // Créer le tooltip (title) avec la liste des composants
            let tooltipContent = `Tiroir: ${drawerKey === 'TIROIR_INCONNU' ? 'Non défini' : drawerKey}\n`;
            tooltipContent += `Statut (pire): ${worstStatus.toUpperCase()}\n`;
            tooltipContent += `------------------------------\nComposants dans ce tiroir:\n`;
            itemsInDrawer.forEach(item => {
                const itemStatus = getStockStatus(item.quantity, item.critical_threshold);
                tooltipContent += `- ${item.ref} (Stock: ${item.quantity}, Statut: ${itemStatus.toUpperCase()})\n`;
            });
            button.title = tooltipContent.trim(); // Appliquer le tooltip

            // Ajouter le bouton au conteneur
            currentKitDrawersDiv.appendChild(button);
        });

        // Cacher le feedback s'il n'y a pas de message actif
        if (kitFeedbackDiv && kitFeedbackDiv.textContent === '' && currentKitSelection.length > 0) {
             kitFeedbackDiv.style.display = 'none';
        }
    }
    function handleDrawerButtonClick(event) {
        // S'assurer que le clic vient bien d'un bouton de tiroir dans le conteneur
        const button = event.target.closest('.drawer-button');
        if (!button || !currentKitDrawersDiv?.contains(button)) return;

        // Basculer la classe 'collected' pour marquer/démarquer comme pris
        button.classList.toggle('collected');

        const drawer = button.dataset.drawer;
        const isCollected = button.classList.contains('collected');
        console.log(`Tiroir ${drawer} marqué comme ${isCollected ? 'collecté' : 'non collecté'}.`);
        // Aucune autre logique nécessaire ici, juste l'état visuel
    }
    function handleClearKit() {
        console.log("Vidage du kit actuel...");
        const itemsClearedCount = currentKitSelection.length;
        currentKitSelection = []; // Vider le tableau

        // Mettre à jour l'UI de la vue Kit si elle est active
        if (kitView?.classList.contains('active-view') && currentUser) {
            displayCurrentKitDrawers(); // Affichera le message "kit vide"
            if (kitFeedbackDiv && itemsClearedCount > 0) {
                // Afficher un message de confirmation si le kit n'était pas vide
                kitFeedbackDiv.textContent = "Le kit actuel a été vidé.";
                kitFeedbackDiv.className = 'feedback-area success';
                kitFeedbackDiv.style.display = 'block';
                setTimeout(() => {
                    // Cacher le message après quelques secondes
                     if (kitFeedbackDiv.textContent === "Le kit actuel a été vidé.") {
                         kitFeedbackDiv.style.display = 'none';
                     }
                }, 3000);
            } else if (kitFeedbackDiv) {
                // Cacher le feedback si le kit était déjà vide
                kitFeedbackDiv.style.display = 'none';
            }
        }

        // Décocher toutes les checkboxes dans la vue Inventaire
        inventoryTableBody?.querySelectorAll('input.kit-select-checkbox:checked').forEach(checkbox => {
            checkbox.checked = false;
        });
        // Retirer la classe 'kit-selected' de toutes les lignes dans l'inventaire
        inventoryTableBody?.querySelectorAll('tr.kit-selected').forEach(row => {
            row.classList.remove('kit-selected');
        });
    }

    // --- Initialisation Générale ---
    // (initializeApp - Inchangé, vérifie DOM, ajoute listeners, appelle setupAuthListener)
    function initializeApp() {
        console.log("Initialisation StockAV...");

        // --- Configuration Items par Page ---
        try {
            const userItemsPerPage = parseInt(localStorage.getItem('stockav_itemsPerPage') || '15', 10);
            // Valider la valeur récupérée
            ITEMS_PER_PAGE = (userItemsPerPage > 0 && userItemsPerPage <= 100) ? userItemsPerPage : 15;
            console.log(`Items par page chargés: ${ITEMS_PER_PAGE}`);

            const itemsPerPageSelect = document.getElementById('items-per-page-select');
            if (itemsPerPageSelect) {
                itemsPerPageSelect.value = ITEMS_PER_PAGE; // Mettre la valeur actuelle dans le select
                // Ajouter l'écouteur pour sauvegarder et recharger si la valeur change
                itemsPerPageSelect.addEventListener('change', (e) => {
                    const newIPP = parseInt(e.target.value, 10);
                    if (newIPP > 0 && newIPP <= 100) {
                        ITEMS_PER_PAGE = newIPP;
                        localStorage.setItem('stockav_itemsPerPage', ITEMS_PER_PAGE); // Sauvegarder dans localStorage
                        console.log(`Items par page mis à jour: ${ITEMS_PER_PAGE}`);
                        // Recharger la vue active si c'est une vue paginée
                        const activeView = document.querySelector('main.view-section.active-view');
                        if (activeView && (activeView.id === 'inventory-view' || activeView.id === 'log-view')) {
                             // Aller à la page 1 lors du changement du nb d'items/page
                             if (activeView.id === 'inventory-view') currentInventoryPage = 1;
                             if (activeView.id === 'log-view') currentLogPage = 1;
                             reloadActiveViewData(activeView);
                        }
                    }
                });
            }
        } catch (e) {
            console.warn("Erreur lors de la lecture/configuration des items par page depuis localStorage:", e);
            ITEMS_PER_PAGE = 15; // Valeur par défaut en cas d'erreur
        }

        // --- Vérification des éléments DOM essentiels ---
        // (Liste étendue pour couvrir tous les éléments utilisés)
        const requiredIds = [
            'login-area', 'login-code', 'login-password', 'login-button', 'login-error',
            'user-info-area', 'user-display', 'logout-button',
            'main-navigation', 'show-search-view', 'show-inventory-view', 'show-log-view',
            'show-admin-view', 'show-settings-view', 'show-audit-view', 'show-bom-view',
            'search-view', 'inventory-view', 'log-view', 'admin-view', 'settings-view', 'audit-view', 'bom-view',
            'seven-segment-display',
            'inventory-table-body', 'inventory-category-filter', 'inventory-search-filter',
            'apply-inventory-filter-button', 'inventory-prev-page', 'inventory-next-page',
            'inventory-page-info', 'inventory-no-results', 'inventory-attribute-filters',
            'log-table-body', 'log-prev-page', 'log-next-page', 'log-page-info', 'log-no-results',
            'admin-feedback', 'category-list', 'category-form', 'category-name', 'category-attributes',
            'category-id-edit', 'cancel-edit-button', 'stock-form', 'component-ref-admin',
            'check-stock-button', 'component-actions', 'component-ref-display', 'current-quantity',
            'update-quantity-button', 'quantity-change', 'delete-component-button',
            'component-category-select', 'category-specific-attributes', 'component-desc',
            'component-mfg', 'component-datasheet', 'component-initial-quantity', 'component-drawer-admin',
            'component-threshold', 'save-component-button', 'export-critical-txt-button', 'export-critical-feedback',
            'component-details',
            'response-output', 'component-input', 'search-button', 'loading-indicator',
            'quantity-change-modal', 'modal-overlay', 'modal-component-ref', 'modal-current-quantity',
            'modal-decrease-button', 'modal-increase-button', 'modal-change-amount',
            'modal-confirm-button', 'modal-cancel-button', 'modal-feedback', 'modal-current-attributes', 'modal-attributes-list',
            'export-inventory-csv-button', 'export-log-txt-button', 'export-feedback',
            'import-csv-file', 'import-inventory-csv-button', 'import-feedback',
            'audit-category-filter', 'audit-drawer-filter', 'apply-audit-filter-button',
            'audit-table-body', 'audit-no-results', 'audit-feedback',
            'bom-feedback', 'current-kit-drawers', 'clear-kit-button',
            'generic-feedback', 'items-per-page-select'
        ];
        const missingIds = requiredIds.filter(id => !document.getElementById(id));
        if (missingIds.length > 0) {
            const errorMsg = `Erreur critique d'initialisation: Les éléments HTML suivants sont manquants dans index.html: ${missingIds.join(', ')}. L'application ne peut pas démarrer.`;
            console.error(errorMsg);
            // Afficher l'erreur de manière visible à l'utilisateur
            document.body.innerHTML = `<div style="padding:20px; background-color:#f8d7da; color:#721c24; border: 1px solid #f5c6cb; border-radius: 5px;"><h2>Erreur Critique</h2><p>${errorMsg}</p></div>`;
            return; // Arrêter l'initialisation
        }

        // --- Ajout des Écouteurs d'Événements ---

        // Navigation Principale
>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99
        searchTabButton?.addEventListener('click', () => setActiveView(searchView, searchTabButton));
        inventoryTabButton?.addEventListener('click', () => setActiveView(inventoryView, inventoryTabButton));
        logTabButton?.addEventListener('click', () => setActiveView(logView, logTabButton));
        adminTabButton?.addEventListener('click', () => setActiveView(adminView, adminTabButton));
        settingsTabButton?.addEventListener('click', () => setActiveView(settingsView, settingsTabButton));
        auditTabButton?.addEventListener('click', () => setActiveView(auditView, auditTabButton));
<<<<<<< HEAD
        kitTabButton?.addEventListener('click', () => setActiveView(kitView, kitTabButton)); // kitView = bom-view
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
        inventoryTableBody?.addEventListener('change', handleKitCheckboxChange); // Gère ajout/retrait kit local + sauvegarde DB
        inventoryTableBody?.addEventListener('click', handleInventoryRowClick); // Gère clic pour modale
        logPrevPageButton?.addEventListener('click', () => { if (currentLogPage > 1) displayLog(currentLogPage - 1); });
        logNextPageButton?.addEventListener('click', () => { if (!logNextPageButton?.disabled) displayLog(currentLogPage + 1); });
        applyAuditFilterButton?.addEventListener('click', displayAudit);
        auditDrawerFilter?.addEventListener('keypress', (e) => { if (e.key === 'Enter') displayAudit(); });
        auditCategoryFilter?.addEventListener('change', displayAudit);
        addCategoryEventListeners();
        addComponentCategorySelectListener();
        addStockEventListeners(); // Gère aussi la MAJ kit si item modifié/supprimé
=======
        kitTabButton?.addEventListener('click', () => setActiveView(kitView, kitTabButton));

        // Authentification
        loginButton?.addEventListener('click', handleLogin);
        // Ajouter 'Enter' sur les champs login/password
        loginPasswordInput?.addEventListener('keypress', (e) => { if(e.key === 'Enter') handleLogin(); });
        loginCodeInput?.addEventListener('keypress', (e) => { if(e.key === 'Enter') handleLogin(); });
        logoutButton?.addEventListener('click', handleLogout);

        // Vue Recherche (Chat)
        searchButtonChat?.addEventListener('click', handleUserInput);
        componentInputChat?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { // 'Enter' sans 'Shift'
                e.preventDefault(); // Empêcher retour à la ligne
                // Vérifier si on attend une quantité ou si c'est une nouvelle recherche
                if (conversationState.awaitingQuantityConfirmation) {
                    handleQuantityResponse(componentInputChat.value.trim());
                } else {
                    handleUserInput();
                }
            }
        });

        // Vue Inventaire
        applyInventoryFilterButton?.addEventListener('click', () => { displayInventory(1); }); // Aller page 1 quand filtres appliqués
        inventorySearchFilter?.addEventListener('keypress', (e) => { if (e.key === 'Enter') applyInventoryFilterButton?.click(); });
        inventoryCategoryFilter?.addEventListener('change', async () => {
             await updateAttributeFiltersUI(); // Mettre à jour filtres attributs
             displayInventory(1); // Recharger page 1
         });
        // Listener pour les changements sur les filtres d'attributs (délégation d'événement)
        attributeFiltersContainer?.addEventListener('change', (event) => {
            if (event.target.tagName === 'SELECT') { // Si le changement vient d'un select
                 displayInventory(1); // Recharger page 1
             }
        });
        inventoryPrevPageButton?.addEventListener('click', () => { if (currentInventoryPage > 1) displayInventory(currentInventoryPage - 1); });
        inventoryNextPageButton?.addEventListener('click', () => { if (!inventoryNextPageButton?.disabled) displayInventory(currentInventoryPage + 1); });
        inventoryTableBody?.addEventListener('change', handleKitCheckboxChange); // Listener pour checkbox kit
        inventoryTableBody?.addEventListener('click', handleInventoryRowClick); // Listener pour clic ligne (modale)

        // Vue Historique (Log)
        logPrevPageButton?.addEventListener('click', () => { if (currentLogPage > 1) displayLog(currentLogPage - 1); });
        logNextPageButton?.addEventListener('click', () => { if (!logNextPageButton?.disabled) displayLog(currentLogPage + 1); });

        // Vue Audit
        applyAuditFilterButton?.addEventListener('click', displayAudit); // Appliquer filtres et recharger
        auditDrawerFilter?.addEventListener('keypress', (e) => { if (e.key === 'Enter') displayAudit(); }); // Enter sur filtre tiroir
        auditCategoryFilter?.addEventListener('change', displayAudit); // Changer catégorie

        // Vue Admin (listeners ajoutés par des fonctions dédiées)
        addCategoryEventListeners();
        addComponentCategorySelectListener();
        addStockEventListeners();

        // Vue Paramètres (listeners ajoutés par fonction dédiée)
>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99
        addSettingsEventListeners();
        currentKitDrawersDiv?.addEventListener('click', handleDrawerButtonClick); // Gère style local 'collected' dans index.html
        clearKitButton?.addEventListener('click', handleClearKit); // Gère vidage variable locale kit/collecté + Supabase

<<<<<<< HEAD
        // Écouteur pour boutons "Prendre" dans le chat (inchangé, met à jour kit si nécessaire)
        responseOutputChat?.addEventListener('click', async (event) => {
            const targetButton = event.target.closest('button.choice-button.take-button');
            if (targetButton && conversationState.awaitingEquivalentChoice) {
                const chosenRef = targetButton.dataset.ref;
                const availableQtyStr = targetButton.dataset.qty;
                const criticalThresholdStr = targetButton.dataset.threshold;

                if (!chosenRef || availableQtyStr === undefined) return;
                const availableQty = parseInt(availableQtyStr, 10);
                if (isNaN(availableQty) || availableQty <= 0) return;

                if (!currentUser) {
                    await promptLoginBeforeAction(`prendre ${chosenRef}`);
                    return;
                }

                console.log(`Choix composant: ${chosenRef}, Qté dispo: ${availableQty}`);
                conversationState.awaitingEquivalentChoice = false;
                addMessageToChat('user', `Je prends ${chosenRef}`);
                await delay(50);
                conversationState.chosenRefForStockCheck = chosenRef;
                conversationState.availableQuantity = availableQty;
                conversationState.criticalThreshold = (criticalThresholdStr && !isNaN(parseInt(criticalThresholdStr, 10))) ? parseInt(criticalThresholdStr, 10) : null;
                conversationState.awaitingQuantityConfirmation = true;

                updateSevenSegmentForComponent(chosenRef);
                await addMessageToChat('ai', `Combien de <strong>${chosenRef}</strong> ? (Stock actuel : ${availableQty}) Entrez un nombre ou 'non'.`);
                componentInputChat?.focus();

            } else if (event.target.tagName === 'A' && (event.target.classList.contains('external-link') || event.target.classList.contains('external-link-inline'))) {
                event.preventDefault();
                window.open(event.target.href, '_blank', 'noopener,noreferrer');
            }
        });

        // Démarrer Auth et état initial
        setupAuthListener(); // handleUserConnected chargera kit ET état collecté
        updateSevenSegmentDisplayVisuals('----', 'off');
        console.log("StockAV initialisé et prêt.");

    } // Fin initializeApp

    // --- Lancer l'app ---
    initializeApp();

}); // Fin DOMContentLoaded
// --- END OF FILE script.js (CORRECTED WITH Supabase Kit Storage + Visual Feedback) ---
=======
        // Vue Kit Actuel
        currentKitDrawersDiv?.addEventListener('click', handleDrawerButtonClick); // Clic sur bouton tiroir
        clearKitButton?.addEventListener('click', handleClearKit); // Bouton vider kit

        // --- Initialisation de l'état d'authentification ---
        // IMPORTANT: Ceci doit être appelé APRÈS que tous les éléments DOM et listeners
        // qui dépendent de l'état connecté/déconnecté soient prêts.
        setupAuthListener(); // Lance la vérification de session initiale et attache le listener onAuthStateChange

        // --- Initialisation finale UI ---
        updateSevenSegmentDisplayVisuals('----', 'off'); // Assurer que le 7 segments est éteint au début

        console.log("StockAV initialisé et prêt.");

        // Optionnel: Activer la vue recherche par défaut SI aucune session n'est trouvée
        // (handleUserDisconnected gère déjà la redirection si on est sur une vue protégée)
        // setTimeout(async () => { // Laisser un peu de temps à l'auth listener
        //     if (!currentUser && !document.querySelector('main.view-section.active-view')) {
        //         console.log("Pas d'utilisateur et pas de vue active, activation vue Recherche.");
        //         await setActiveView(searchView, searchTabButton);
        //     }
        // }, 50); // Court délai


    } // Fin initializeApp

    // --- Démarrer l'application ---
    initializeApp();

}); // Fin DOMContentLoaded
>>>>>>> 1f58c510d28f10acb01970f7ef84d93495272f99
