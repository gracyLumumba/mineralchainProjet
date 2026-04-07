import { createContext, useContext, useEffect, useState } from 'react';
import { loadPreferences, savePreferences } from '../services/storage/preferencesStorage';

const PreferencesContext = createContext(null);

const translations = {
  fr: {
    refresh: 'Actualiser',
    refreshing: 'Mise a jour...',
    logout: 'Quitter',
    login: 'Connexion',
    register: 'Inscription',
    secure_access: 'Acces securise aux operations terrain et aux certificats.',
    create_account: 'Creation d un compte operateur pour les flux mobiles.',
    identifier: 'Identifiant',
    password: 'Mot de passe',
    email_or_username: 'Email ou nom utilisateur',
    sign_in: 'Se connecter',
    signing_in: 'Connexion...',
    full_name: 'Nom complet',
    username: 'Nom utilisateur',
    email: 'Email',
    role: 'Role',
    organization: 'Organisation',
    site: 'Site',
    create_account_btn: 'Creer le compte',
    creating_account: 'Inscription...',
    dashboard_subtitle: 'Operations terrain, certification et suivi on-chain.',
    connection_unavailable: 'Connexion indisponible',
    tracking: 'Suivi',
    view_lots: 'Voir les lots',
    issuance: 'Emission',
    certify_lot: 'Certifier un lot',
    supervision_center: 'Centre de supervision',
    summary: 'Resume',
    active_indicators: 'Indicateurs actifs',
    inventory: 'Inventaire',
    lots: 'Lots',
    lot_subtitle: 'Consulter le detail d un lot et son statut blockchain.',
    search_lot: 'Recherche rapide',
    search_lot_placeholder: 'Lot, site, statut ou stockage',
    no_search_result: 'Aucun resultat',
    adjust_search: 'Essayez un autre mot-cle ou actualisez les donnees.',
    no_lot: 'Aucun lot',
    no_data: 'Aucune donnee disponible pour le moment.',
    certification: 'Certification',
    cert_subtitle: 'Creation et emission du certificat mineral.',
    processing: 'Traitement...',
    launch_certification: 'Lancer la certification',
    error: 'Erreur',
    certificate_issued: 'Certificat emis',
    open_certificate: 'Ouvrir le certificat',
    opening: 'Ouverture...',
    system: 'Systeme',
    theme: 'Theme',
    language: 'Langue',
    light: 'Clair',
    dark: 'Sombre',
  },
  en: {
    refresh: 'Refresh',
    refreshing: 'Updating...',
    logout: 'Sign out',
    login: 'Sign in',
    register: 'Register',
    secure_access: 'Secure access to field operations and certificates.',
    create_account: 'Create an operator account for mobile workflows.',
    identifier: 'Identifier',
    password: 'Password',
    email_or_username: 'Email or username',
    sign_in: 'Sign in',
    signing_in: 'Signing in...',
    full_name: 'Full name',
    username: 'Username',
    email: 'Email',
    role: 'Role',
    organization: 'Organization',
    site: 'Site',
    create_account_btn: 'Create account',
    creating_account: 'Registering...',
    dashboard_subtitle: 'Field operations, certification, and on-chain tracking.',
    connection_unavailable: 'Connection unavailable',
    tracking: 'Tracking',
    view_lots: 'View lots',
    issuance: 'Issuance',
    certify_lot: 'Certify a lot',
    supervision_center: 'Supervision center',
    summary: 'Summary',
    active_indicators: 'Active indicators',
    inventory: 'Inventory',
    lots: 'Lots',
    lot_subtitle: 'Review lot details and blockchain status.',
    search_lot: 'Quick search',
    search_lot_placeholder: 'Lot, site, status or storage',
    no_search_result: 'No result',
    adjust_search: 'Try another keyword or refresh the data.',
    no_lot: 'No lots',
    no_data: 'No data available right now.',
    certification: 'Certification',
    cert_subtitle: 'Create and issue the mineral certificate.',
    processing: 'Processing...',
    launch_certification: 'Launch certification',
    error: 'Error',
    certificate_issued: 'Certificate issued',
    open_certificate: 'Open certificate',
    opening: 'Opening...',
    system: 'System',
    theme: 'Theme',
    language: 'Language',
    light: 'Light',
    dark: 'Dark',
  },
};

const themes = {
  light: {
    screen: '#efe6d5',
    card: '#fcf8ef',
    cardAlt: '#f8f1e5',
    text: '#1d2c2b',
    muted: '#5f675c',
    brand: '#1d6b57',
    brandDark: '#183632',
    accent: '#bf8b4c',
    border: '#dcccb5',
    input: '#fffdf9',
    inputBorder: '#dccbb1',
    overlayOne: '#d7b487',
    overlayTwo: '#9fc3b3',
    surfaceStrong: '#183632',
    surfaceStrongText: '#d8ebe4',
    successBg: '#edf7f0',
    successBorder: '#9cc8ae',
    successText: '#245b49',
    errorBg: '#fff0ed',
    errorBorder: '#efb0a0',
    errorText: '#8f2d14',
    infoBg: '#f0f7ff',
    infoBorder: '#bfd4ef',
    infoText: '#17324c',
    ghostButton: '#efe3d2',
    ghostButtonText: '#6b5635',
    badgeBg: '#d7eadf',
    badgeText: '#245b49',
    shadow: '#8e7453',
  },
  dark: {
    screen: '#0d1312',
    card: '#141d1b',
    cardAlt: '#1a2623',
    text: '#eef2ef',
    muted: '#a6b4ae',
    brand: '#2d8c74',
    brandDark: '#0f1917',
    accent: '#d39a59',
    border: '#293734',
    input: '#101816',
    inputBorder: '#33413f',
    overlayOne: '#6c5334',
    overlayTwo: '#1f4f47',
    surfaceStrong: '#101b19',
    surfaceStrongText: '#d3e6df',
    successBg: '#10221d',
    successBorder: '#295647',
    successText: '#91d6bc',
    errorBg: '#2b1715',
    errorBorder: '#6a312b',
    errorText: '#ffb9ae',
    infoBg: '#121f2b',
    infoBorder: '#2f4a63',
    infoText: '#b7d9ff',
    ghostButton: '#23312d',
    ghostButtonText: '#d8e4df',
    badgeBg: '#19342d',
    badgeText: '#9ee0c4',
    shadow: '#050808',
  },
};

export function PreferencesProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('fr');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    loadPreferences().then((prefs) => {
      if (!active) return;
      setTheme(prefs.theme);
      setLanguage(prefs.language);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const update = async (next) => {
    setTheme(next.theme);
    setLanguage(next.language);
    await savePreferences(next);
  };

  const toggleTheme = async () => {
    const next = theme === 'light' ? 'dark' : 'light';
    await update({ theme: next, language });
  };

  const toggleLanguage = async () => {
    const next = language === 'fr' ? 'en' : 'fr';
    await update({ theme, language: next });
  };

  const value = {
    ready,
    theme,
    language,
    colors: themes[theme],
    t: (key) => translations[language][key] || key,
    toggleTheme,
    toggleLanguage,
  };

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within PreferencesProvider');
  }
  return context;
}
