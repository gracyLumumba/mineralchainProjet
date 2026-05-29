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
  organization: '',
  role: 'producer',
  site: 'Kamoa-Kansoko',
};

const DEMO_CREDENTIALS = [
  { key: 'producer',    label: 'Producteur',  identifier: 'producteur',  password: 'Demo2025!',  icon: 'pickaxe',        iconLib: 'MaterialCommunityIcons', description: 'Creation et certification des lots' },
  { key: 'regulator',  label: 'Regulateur',  identifier: 'regulateur',  password: 'Demo2025!',  icon: 'scale-balance',  iconLib: 'MaterialCommunityIcons', description: 'Controle et verification des donnees' },
  { key: 'transporter',label: 'Transporteur',identifier: 'transporteur',password: 'Demo2025!',  icon: 'truck-outline',  iconLib: 'MaterialCommunityIcons', description: 'Suivi logistique et expedition' },
  { key: 'admin',      label: 'Admin',       identifier: 'admin',       password: 'Admin2025!', icon: 'shield-account', iconLib: 'MaterialCommunityIcons', description: 'Supervision et gestion des comptes', isAdmin: true },
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
    name: 'Patrick Tshisekedi',
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
    setRegisterForm((current) => ({
      ...current,
      [key]: value,
    }));
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
      setNotice('Verifiez l URL API ci-dessous puis relancez la connexion.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitRegister = async () => {
    try {
      setIsSubmitting(true);
      setError('');
      setNotice('');
      const result = await register(registerForm);
      setNotice(result.message || 'Compte cree');
      setMode('login');
      setIdentifier(registerForm.username);
      setPassword('');
      setRegisterForm(REGISTER_INITIAL);
    } catch (submitError) {
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
