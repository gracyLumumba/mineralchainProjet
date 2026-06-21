import { useState } from 'react';
import { login } from '../services/api/authService';
import { register } from '../services/api/registerService';
import { isNetworkUnavailableError } from '../services/api/client';
import { createUserSession } from '../models/UserSession';

const REGISTER_INITIAL = {
  full_name: '',
  username: '',
  email: '',
  password: '',
  organization: 'MineralChain',
  role: 'producer',
  site: 'Kamoa-Kansoko',
};

const DEMO_CREDENTIALS = [
  { key: 'producer', label: 'Producteur', identifier: 'producteur', password: 'Demo2025!', icon: 'pickaxe', iconLib: 'MaterialCommunityIcons', description: 'Creation et certification des lots' },
  { key: 'regulator', label: 'Regulateur', identifier: 'regulateur', password: 'Demo2025!', icon: 'scale-balance', iconLib: 'MaterialCommunityIcons', description: 'Controle et verification des donnees' },
  { key: 'transporter', label: 'Transporteur', identifier: 'transporteur', password: 'Demo2025!', icon: 'truck-outline', iconLib: 'MaterialCommunityIcons', description: 'Suivi logistique et expedition' },
  { key: 'admin', label: 'Admin', identifier: 'admin', password: 'Admin2025!', icon: 'shield-account', iconLib: 'MaterialCommunityIcons', description: 'Supervision et gestion des comptes', isAdmin: true },
];

const DEMO_USERS = {
  producteur: {
    id: 'demo-producer-001',
    name: 'Jean Mutombo',
    role: 'producer',
    username: 'producteur',
    email: 'producteur@mineralchain.cd',
    organization: 'Kamoa-Kansoko',
  },
  regulateur: {
    id: 'demo-regulator-001',
    name: 'Marie-Claire Kabongo',
    role: 'regulator',
    username: 'regulateur',
    email: 'regulateur@dgmr.gouv.cd',
    organization: 'DGMR',
  },
  transporteur: {
    id: 'demo-transporter-001',
    name: 'Eliel Ilunga',
    role: 'transporter',
    username: 'transporteur',
    email: 'transporteur@logistique.cd',
    organization: 'Kamoa Logistics',
  },
  admin: {
    id: 'demo-admin-001',
    name: 'Admin MineralChain',
    role: 'admin',
    username: 'admin',
    email: 'admin@mineralchain.cd',
    organization: 'MineralChain',
  },
};

function getDefaultOrganization(role, site) {
  const normalizedRole = String(role || '').trim().toLowerCase();
  const normalizedSite = String(site || '').trim();

  if (normalizedRole === 'regulator') {
    return 'DGMR';
  }

  if (normalizedRole === 'transporter') {
    return 'Kamoa Logistics';
  }

  if (normalizedSite) {
    return `${normalizedSite} Mining`;
  }

  return 'MineralChain';
}

function isAutoOrganization(value, role, site) {
  const normalized = String(value || '').trim();
  if (!normalized) {
    return true;
  }

  return normalized === getDefaultOrganization(role, site)
    || normalized === REGISTER_INITIAL.organization;
}

function createOfflineDemoSession(identifier, password) {
  const normalized = String(identifier || '').trim().toLowerCase();
  const credential = DEMO_CREDENTIALS.find((item) => item.identifier === normalized);
  if (!credential || (password && credential.password !== password)) {
    return null;
  }

  return createUserSession({
    ...DEMO_USERS[normalized],
    site: 'Kamoa-Kansoko',
    token: `offline-demo-${credential.key}`,
  });
}

export function useAuthViewModel({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [registerForm, setRegisterForm] = useState(REGISTER_INITIAL);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const updateRegisterField = (key, value) => {
    setRegisterForm((current) => {
      const next = {
        ...current,
        [key]: value,
      };

      if (key === 'role' && isAutoOrganization(current.organization, current.role, current.site)) {
        next.organization = getDefaultOrganization(value, current.site);
      }

      if (key === 'site' && isAutoOrganization(current.organization, current.role, current.site)) {
        next.organization = getDefaultOrganization(current.role, value);
      }

      return next;
    });
  };

  const fillDemoCredentials = (credential) => {
    setMode('login');
    setIdentifier(credential.identifier);
    setPassword(credential.password);
    setError('');
    setNotice(`Compte demo charge : ${credential.label}`);
  };

  const submitLogin = async () => {
    const normalizedIdentifier = identifier.trim().toLowerCase();
    const demoCredential = DEMO_CREDENTIALS.find((item) => item.identifier === normalizedIdentifier);
    const loginPassword = password || demoCredential?.password || '';

    if (!identifier.trim() || !loginPassword) {
      setError('Renseignez l identifiant et le mot de passe.');
      setNotice('');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      setNotice('');
      const session = await login({
        identifier: identifier.trim(),
        password: loginPassword,
      });
      onLogin(session);
    } catch (submitError) {
      const offlineSession = isNetworkUnavailableError(submitError)
        ? createOfflineDemoSession(identifier, loginPassword)
        : null;
      if (offlineSession) {
        onLogin(offlineSession);
        return;
      }
      setError(submitError.message || 'Connexion impossible');
      setNotice("Si vous venez de creer un compte, il attend peut-etre l approbation de l administrateur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitRegister = async () => {
    const normalizedForm = {
      ...registerForm,
      full_name: String(registerForm.full_name || '').trim(),
      username: String(registerForm.username || '').trim(),
      email: String(registerForm.email || '').trim(),
      password: String(registerForm.password || ''),
      role: String(registerForm.role || 'producer').trim().toLowerCase(),
      site: String(registerForm.site || '').trim() || 'Kamoa-Kansoko',
      organization: String(registerForm.organization || '').trim(),
    };

    if (!normalizedForm.username || !normalizedForm.password || !normalizedForm.email || !normalizedForm.full_name) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (normalizedForm.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caracteres.');
      return;
    }

    if (!normalizedForm.organization || isAutoOrganization(normalizedForm.organization, normalizedForm.role, normalizedForm.site)) {
      normalizedForm.organization = getDefaultOrganization(normalizedForm.role, normalizedForm.site);
    }

    try {
      setIsSubmitting(true);
      setError('');
      setNotice('');
      const result = await register(normalizedForm);
      setNotice(result.message || 'Compte cree. Il attend maintenant l approbation de l administrateur.');
      setMode('login');
      setIdentifier(normalizedForm.username);
      setPassword('');
      setRegisterForm(REGISTER_INITIAL);
    } catch (submitError) {
      if (isNetworkUnavailableError(submitError)) {
        const targetUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'Non definie';
        setError('Serveur injoignable');
        setNotice(`L'application tente de contacter : ${targetUrl}. Verifiez que votre telephone et votre PC sont sur le meme reseau Wi-Fi.`);
        return;
      }
      setError(submitError.message || 'Inscription impossible');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    mode,
    setMode,
    identifier,
    setIdentifier,
    password,
    setPassword,
    registerForm,
    updateRegisterField,
    isSubmitting,
    error,
    notice,
    demoCredentials: DEMO_CREDENTIALS,
    fillDemoCredentials,
    submitLogin,
    submitRegister,
  };
}
