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
    // (Identique à la version précédente...)
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
    const modalAttributesSection = document.querySelector('.modal-attributes-section');
    const modalAttributesList = document.getElementById('modal-component-attributes');
    const sevenSegmentDisplay = document.getElementById('seven-segment-display');
    const segmentDigits = sevenSegmentDisplay ? [
        sevenSegmentDisplay.querySelector('.digit-1'), sevenSegmentDisplay.querySelector('.digit-2'),
        sevenSegmentDisplay.querySelector('.digit-3'), sevenSegmentDisplay.querySelector('.digit-4')
    ] : [null, null, null, null];
    let modalCurrentRef = null;
    let modalInitialQuantity = 0;
    let currentModalChange = 0;
    let currentInventoryPage = 1;
    let currentInventoryFilters = { category: 'all', search: '' };
    const inventoryTableBody = document.getElementById('inventory-table-body');
    const inventoryCategoryFilter = document.getElementById('inventory-category-filter');
    const inventorySearchFilter = document.getElementById('inventory-search-filter');
    const applyInventoryFilterButton = document.getElementById('apply-inventory-filter-button');
    const inventoryPrevPageButton = document.getElementById('inventory-prev-page');
    const inventoryNextPageButton = document.getElementById('inventory-next-page');
    const inventoryPageInfo = document.getElementById('inventory-page-info');
    const inventoryNoResults = document.getElementById('inventory-no-results');
    let currentLogPage = 1;
    const logTableBody = document.getElementById('log-table-body');
    const logPrevPageButton = document.getElementById('log-prev-page');
    const logNextPageButton = document.getElementById('log-next-page');
    const logPageInfo = document.getElementById('log-page-info');
    const logNoResults = document.getElementById('log-no-results');
    const logFeedbackDiv = document.getElementById('log-feedback');
    const purgeLogContainer = document.getElementById('purge-log-container');
    const purgeLogButton = document.getElementById('purge-log-button');
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
    const componentInitialQuantityGroup = document.querySelector('.initial-quantity-group');
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
    const importFileLabel = document.getElementById('import-file-label');
    const importInventoryCsvButton = document.getElementById('import-inventory-csv-button');
    const importFeedbackDiv = document.getElementById('import-feedback');
    const importModeRadios = document.querySelectorAll('input[name="import-mode"]');
    let chatHistory = [];
    let conversationState = {
        awaitingEquivalentChoice: false, awaitingQuantityConfirmation: false, originalRefChecked: null,
        potentialEquivalents: [], chosenRefForStockCheck: null, availableQuantity: 0,
        criticalThreshold: null, suggestedQuantity: null
    };
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    function getStockStatus(quantity, threshold) {
        if (quantity === undefined || quantity === null || isNaN(quantity)) return 'unknown';
        quantity = Number(quantity);
        threshold = (threshold === undefined || threshold === null || isNaN(threshold)) ? -1 : Number(threshold);
        if (quantity <= 0) return 'critical';
        if (threshold >= 0 && quantity <= threshold) return 'warning';
        return 'ok';
    }
    function createStockIndicatorHTML(quantity, threshold) {
        const status = getStockStatus(quantity, threshold);
        const statusText = status.toUpperCase();
        const thresholdText = (threshold === undefined || threshold === null || threshold < 0) ? 'N/A' : threshold;
        const qtyText = (quantity === undefined || quantity === null) ? 'N/A' : quantity;
        const title = `Stock: ${statusText} (Qté: ${qtyText}, Seuil: ${thresholdText})`;
        return `<span class="stock-indicator level-${status}" title="${title}"></span>`;
    }
    async function handleLogin() { /* ... (identique) ... */ }
    async function handleLogout() { /* ... (identique) ... */ }
    async function setupAuthListener() { /* ... (identique) ... */ }
    function handleUserConnected(user, isInitialLoad) { /* ... (identique) ... */ }
    function handleUserDisconnected(isInitialLoad) { /* ... (identique) ... */ }
    function clearProtectedViewData() { /* ... (identique) ... */ }
    function setActiveView(viewToShow, buttonToActivate){ /* ... (identique) ... */ }
    async function populateInventoryFilters() { /* ... (identique) ... */ }
    async function displayInventory(page = 1) { /* ... (identique) ... */ }
    async function displayLog(page = 1) { /* ... (identique) ... */ }
    function formatLogTimestamp(isoTimestamp) { /* ... (identique) ... */ }
    async function addLogEntry(itemRef, change, newQuantity) { /* ... (identique) ... */ }
    function showLogFeedback(message, type = 'info') { /* ... (identique) ... */ }
    async function handleDeleteSingleLog(event) { /* ... (identique) ... */ }
    async function handleDeleteAllLogs() { /* ... (identique) ... */ }
    async function getCategories(forceRefresh = false) { /* ... (identique) ... */ }
    function invalidateCategoriesCache() { /* ... (identique) ... */ }
    async function loadAdminData() { /* ... (identique) ... */ }
    async function loadCategoriesAdmin() { /* ... (identique) ... */ }
    function addCategoryEventListeners() { /* ... (identique) ... */ }
    function resetCategoryForm(){ /* ... (identique) ... */ }
    async function populateComponentCategorySelect() { /* ... (identique) ... */ }
    function addComponentCategorySelectListener() { /* ... (identique) ... */ }
    function showAdminFeedback(message, type = 'info'){ /* ... (identique) ... */ }
    function resetStockForm() { /* ... (identique) ... */ }
    function addStockEventListeners() { /* ... (identique) ... */ }
    async function addMessageToChat(sender, messageContent, isHTML = false) { /* ... (identique) ... */ }
    function displayWelcomeMessage() { /* ... (identique) ... */ }
    function extractReference(text) { /* ... (identique) ... */ }
    function parseIntentAndRefs(text) { /* ... (identique) ... */ }
    async function handleUserInput() { /* ... (identique) ... */ }
    async function handleAIChatRequest(requestType, param1, param2 = null) { /* ... (identique) ... */ }
    responseOutputChat?.addEventListener('click', async (event) => { /* ... (identique) ... */ });
    function provideExternalLinksHTML(ref, isBlock = true) { /* ... (identique) ... */ }
    async function promptLoginBeforeAction(actionDescription) { /* ... (identique) ... */ }
    async function handleQuantityResponse(userInput) { /* ... (identique) ... */ }
    function resetConversationState() { /* ... (identique) ... */ }
    async function getStockInfoFromSupabase(ref) { /* ... (identique) ... */ }
    async function updateStockInSupabase(ref, change) { /* ... (identique) ... */ }
    async function handleInventoryRowClick(event) { /* ... (identique) ... */ }
    function showQuantityModal(item) {
        if (!quantityChangeModal || !modalOverlay) {
            console.error("Éléments DOM de la modale introuvables.");
            return;
        }

        console.log("Affichage modale pour:", item.ref);
        // DIAG: Log pour le tiroir dans la modale
        console.log(">> showQuantityModal: Tiroir reçu dans item:", item.drawer, "(Type:", typeof item.drawer, ")");
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

         // Affiche les attributs spécifiques
         if (modalAttributesList && item.attributes && typeof item.attributes === 'object' && Object.keys(item.attributes).length > 0) {
            modalAttributesList.innerHTML = ''; // Vide les anciens
            for (const key in item.attributes) {
                 if (Object.prototype.hasOwnProperty.call(item.attributes, key)) { // Bonne pratique
                    const li = document.createElement('li');
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
        // DIAG: Log juste avant d'appeler updateSevenSegmentDisplay
        console.log(">> showQuantityModal: lastDisplayedDrawer mis à jour:", lastDisplayedDrawer, "(Type:", typeof lastDisplayedDrawer, ")");
        updateSevenSegmentDisplay(lastDisplayedDrawer);
    }
    function hideQuantityModal() { /* ... (identique) ... */ }
    function updateModalButtonStates() { /* ... (identique) ... */ }

    // --- Gestion Afficheur 7 Segments ---
    const segmentMap = { /* ... (identique) ... */ };

    // Met à jour l'affichage des 4 digits 7 segments
    function updateSevenSegmentDisplay(newDrawerValue = undefined) {
        if (!sevenSegmentDisplay || !segmentDigits.every(d => d)) {
            return; // Ne rien faire si l'afficheur n'est pas prêt
        }
        // DIAG: Log au début de la fonction
        console.log(`>> updateSevenSegmentDisplay: Appelée avec newDrawerValue='${newDrawerValue}' (type: ${typeof newDrawerValue}), lastDrawerStored='${lastDisplayedDrawer}'`);

        let displayString = "----"; // Valeur par défaut (tirets)
        let displayOn = false; // Indique si l'afficheur doit être "allumé"

        // Si une nouvelle valeur est fournie, l'utilise. Sinon, utilise la dernière valeur mémorisée.
        const valueToDisplay = (newDrawerValue !== undefined) ? newDrawerValue : lastDisplayedDrawer;

        if (valueToDisplay !== null && valueToDisplay !== undefined && String(valueToDisplay).trim() !== '') {
            displayString = String(valueToDisplay).slice(-4).toUpperCase().padStart(4, ' ');
            displayOn = true;
        } else {
             displayString = "    ";
             displayOn = false;
        }

        // DIAG: Log avant la boucle
        console.log(`>> updateSevenSegmentDisplay: Va afficher la chaîne "${displayString}", displayOn=${displayOn}`);

        // Met à jour chaque digit
        const segmentCodes = ['a', 'b', 'c', 'd', 'e', 'f', 'g']; // Liste des segments possibles
        for (let i = 0; i < 4; i++) {
            const digitElement = segmentDigits[i];
            if (!digitElement) continue;

            const charToDisplay = displayString[i] || ' ';
            const segmentsToActivate = segmentMap[charToDisplay] || segmentMap['-']; // Utilise '-' si char inconnu

            // Parcourt tous les segments possibles (a-g)
            segmentCodes.forEach(code => {
                 const segmentElement = digitElement.querySelector(`.segment-${code}`);
                 if (segmentElement) {
                     // Si ce segment DOIT être activé pour ce caractère, ajoute 'on', sinon retire 'on'
                     if (segmentsToActivate.includes(code)) {
                         segmentElement.classList.add('on');
                     } else {
                         segmentElement.classList.remove('on');
                     }
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
    function loadSettingsData() { /* ... (identique) ... */ }
    function showSettingsFeedback(type, message, level = 'info') { /* ... (identique) ... */ }
    function downloadFile(filename, content, mimeType) { /* ... (identique) ... */ }
    async function handleExportInventoryCSV() { /* ... (identique) ... */ }
    async function handleExportLogTXT() { /* ... (identique) ... */ }
    async function handleImportInventoryCSV() { /* ... (identique) ... */ }
     function resetImportState() { /* ... (identique) ... */ }
    function addSettingsEventListeners() { /* ... (identique) ... */ }


    // --- Initialisation Générale de l'Application ---
    function initializeApp() {
        console.log("Initialisation de StockAV...");

        // Vérification rapide de la présence d'éléments DOM essentiels
        const requiredIds = [ /* ... (identique) ... */ ];
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
        loginCodeInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') loginPasswordInput?.focus(); });
        loginPasswordInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleLogin(); });
        // Chat (Recherche)
        searchButtonChat?.addEventListener('click', handleUserInput);
        componentInputChat?.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleUserInput();
            }
        });
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
        // Admin
        addCategoryEventListeners(); // Écouteurs pour liste+formulaire catégorie
        addStockEventListeners();    // Écouteurs formulaire stock
        addComponentCategorySelectListener(); // Écouteur select catégorie
        // Paramètres
        addSettingsEventListeners(); // Écouteurs export/import
        // Modale Quantité
        modalDecreaseButton?.addEventListener('click', () => { currentModalChange--; updateModalButtonStates(); });
        modalIncreaseButton?.addEventListener('click', () => { currentModalChange++; updateModalButtonStates(); });
        modalCancelButton?.addEventListener('click', hideQuantityModal);
        modalOverlay?.addEventListener('click', (event) => {
             if (event.target === modalOverlay) hideQuantityModal();
        });
        modalConfirmButton?.addEventListener('click', async () => {
            /* ... (identique) ... */
             if (currentModalChange === 0 || !modalCurrentRef) return;
             const change = currentModalChange;
             const ref = modalCurrentRef;
             modalConfirmButton.disabled = true;
             modalCancelButton.disabled = true;
             if (modalFeedback) {
                 modalFeedback.textContent = `Mise à jour de ${ref}...`;
                 modalFeedback.className = 'modal-feedback info';
                 modalFeedback.style.display = 'block';
             }
             const { newQuantity, error } = await updateStockInSupabase(ref, change);
             if (error) {
                  modalConfirmButton.disabled = false;
                  modalCancelButton.disabled = false;
             } else {
                 if (modalFeedback) {
                     modalFeedback.textContent = `Stock de ${ref} mis à jour ! Nouvelle quantité: ${newQuantity}.`;
                     modalFeedback.className = 'modal-feedback success';
                 }
                 if (inventoryView?.classList.contains('active-view')) {
                     displayInventory(currentInventoryPage);
                 }
                 if (logView?.classList.contains('active-view')) {
                     displayLog(1);
                 }
                 setTimeout(hideQuantityModal, 1500);
             }
        });

        // --- Initialisation finale ---
        setupAuthListener(); // Lance l'écouteur d'authentification Supabase
        updateSevenSegmentDisplay(null); // Initialise l'afficheur
        console.log("StockAV initialisé et prêt.");
    }

    // --- Lancer l'application ---
    initializeApp();

}); // ----- FIN DU FICHIER script.js -----
