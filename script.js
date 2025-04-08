// ----- DÉBUT DU FICHIER script.js -----
// Assure que le code s'exécute après le chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
    "use strict";
    console.log(">>> DOMContentLoaded - Script démarré !"); // NOUVEAU LOG 1

    // --- Configuration et Variables Globales ---
    let currentUser = null;
    let currentUserCode = null;
    const ITEMS_PER_PAGE = 15;
    let isInitialAuthCheckComplete = false;
    let activeSession = null;
    let lastDisplayedDrawer = null;
    let categoriesCache = [];
    const SUPABASE_URL = 'https://tjdergojgghzmopuuley.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZGVyZ29qZ2doem1vcHV1bGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4MTU0OTUsImV4cCI6MjA1OTM5MTQ5NX0.XejQYEPYoCrgYOwW4T9g2VcmohCdLLndDdwpSYXAwPA';
    const FAKE_EMAIL_DOMAIN = '@stockav.local';
    const AI_FUNCTION_NAME = 'ai-component-info';
    let supabase = null;

    // --- Initialisation des Clients et Vérifications ---
    try {
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !FAKE_EMAIL_DOMAIN) { throw new Error("Config Supabase manquante"); }
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log("Client Supabase initialisé avec succès.");
        } else { throw new Error("Librairie Supabase non chargée"); }
        if (typeof Papa === 'undefined') { console.warn("PapaParse non chargé."); }
    } catch (error) {
        console.error("Erreur critique lors de l'initialisation:", error);
        // ... (gestion de l'erreur identique)
        const body = document.querySelector('body');
        if (body) {
             body.innerHTML = `<div style="padding: 20px; background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; border-radius: .25rem; font-family: sans-serif;"><h2>Erreur Critique</h2><p>L'application n'a pas pu démarrer correctement.</p><p><strong>Détails :</strong> ${error.message}</p><p>Veuillez vérifier la console du navigateur (F12) pour plus d'informations techniques et vous assurer que les librairies externes (Supabase.js) sont correctement chargées dans votre fichier HTML.</p></div>`;
        }
        return;
    }

    // --- Récupération Éléments DOM Simplifiée (juste pour le test) ---
    const loginButton = document.getElementById('login-button');
    const loginCodeInput = document.getElementById('login-code');
    const loginPasswordInput = document.getElementById('login-password');
    const loginError = document.getElementById('login-error');

    // --- Fonctions Essentielles (Login et Auth Listener) ---
    async function handleLogin() {
        console.log(">>> Tentative de connexion détectée !");
        if (!supabase) {
            if(loginError) { loginError.textContent = "Erreur: Client Supabase non initialisé."; loginError.style.display = 'block'; }
            return;
        }
        const code = loginCodeInput?.value.trim().toLowerCase();
        const password = loginPasswordInput?.value.trim();
        if (!code || !password) {
            if(loginError) { loginError.textContent = "Code et mot de passe requis."; loginError.style.display = 'block'; }
            return;
        }
        const email = code + FAKE_EMAIL_DOMAIN;
        if(loginButton) loginButton.disabled = true;
        if(loginError) { loginError.textContent = "Connexion en cours..."; loginError.style.color = 'var(--text-muted)'; loginError.style.display = 'block'; loginError.style.display = 'block'; }

        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email: email, password: password });
            if (error) {
                console.error("Erreur connexion Supabase:", error.message);
                if(loginError) { loginError.textContent = (error.message.includes("Invalid login credentials")) ? "Code ou mot de passe incorrect." : "Erreur de connexion."; loginError.style.color = 'var(--error-color)'; loginError.style.display = 'block'; }
                loginCodeInput?.focus();
            } else {
                console.log("Demande de connexion Supabase réussie pour:", data.user?.email);
                if(loginError) loginError.style.display = 'none';
                if(loginCodeInput) loginCodeInput.value = '';
                if(loginPasswordInput) loginPasswordInput.value = '';
            }
        } catch (err) {
             console.error("Erreur JavaScript pendant la connexion:", err);
             if(loginError) { loginError.textContent = "Erreur inattendue."; loginError.style.color = 'var(--error-color)'; loginError.style.display = 'block'; }
        } finally {
             if(loginButton) loginButton.disabled = false;
        }
    }

    // Auth listener simplifié (juste pour le test, ne met pas à jour l'UI)
    async function setupAuthListener() {
        if (!supabase) { console.error("Auth Listener: Supabase non init."); return; }
        supabase.auth.onAuthStateChange((event, session) => {
            console.log(`>>> Événement Auth reçu: ${event}`, session ? `Session: ${session.user.email}` : "Pas de session");
            // Pas de mise à jour UI dans cette version simplifiée
        });
         // Vérification initiale simplifiée
        const { data: { session } } = await supabase.auth.getSession();
        console.log(">>> Session initiale:", session ? session.user.email : "Aucune");
    }


    // --- Initialisation Simplifiée ---
    function initializeApp() {
        console.log("Initialisation de StockAV (VERSION SIMPLIFIÉE)...");

        const loginButtonCheck = document.getElementById('login-button');
        if (!loginButtonCheck) {
             const errorMsg = `FATAL: Élément DOM essentiel manquant! ID: "login-button". Vérifiez index.html.`;
             console.error(errorMsg);
             document.body.innerHTML = `<p style='color:red; font-weight: bold; padding: 20px; font-family: sans-serif;'>${errorMsg}</p>`;
             return;
        }
        console.log("Bouton de connexion trouvé.");

        // --- Attachement UNIQUEMENT du listener de connexion ---
        console.log(">>> initializeApp - Attachement du listener au bouton de connexion..."); // NOUVEAU LOG 2
        loginButtonCheck.addEventListener('click', handleLogin);
        console.log("Listener ajouté au bouton de connexion.");

        // --- Initialisation Supabase Auth Listener ---
        setupAuthListener();

        console.log("StockAV initialisé (simplifié) et prêt.");
    }

    // --- Lancer l'application ---
    initializeApp(); // Appelle la fonction simplifiée

}); // ----- FIN DU FICHIER script.js -----
