import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { DEFAULT_OWNER_ADDRESS } from '../config/blockchain';
import { getBackendUrl } from '../config/backend';

const AuthContext = createContext(null);
const BACKEND_URL = getBackendUrl();

const LS = {
  get: (k, fb = null) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (error) { void error; return fb; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (error) { void error; } },
  del: (k) => { try { localStorage.removeItem(k); } catch (error) { void error; } },
};

const KEYS = { users: 'mc_users', currentUser: 'mc_current_user', backendToken: 'mc_backend_token' };

function hashPassword(pw) {
  let h = 0;
  for (let i = 0; i < pw.length; i++) h = Math.imul(31, h) + pw.charCodeAt(i) | 0;
  return `mc_${Math.abs(h).toString(36)}_${pw.length}`;
}

//  Utilisateurs prÃ©-approuvÃ©s (dÃ©mo) 
// account_status : 'approved' | 'pending' | 'rejected'
const DEMO_USERS = [
  {
    id: 'demo-admin-001',
    username: 'admin',
    email: 'admin@mineralchain.cd',
    password: hashPassword('Admin2025!'),
    full_name: 'Administrateur SystÃ¨me',
    role: 'admin',
    organization: 'MineralChain',
    wallet: '0xAd1234567890abcdef1234567890abcdef123456',
    avatar: 'shield',
    account_status: 'approved',
    approved_by: 'system',
    approved_at: new Date('2025-01-01').toISOString(),
    created_at: new Date('2025-01-01').toISOString(),
    permissions: ['approve_users', 'view_all', 'manage_system'],
  },
  {
    id: 'demo-producer-001',
    username: 'producteur',
    email: 'producteur@kamoa.cd',
    password: hashPassword('Demo2025!'),
    full_name: 'Jean-Baptiste Mutombo',
    role: 'producer',
    organization: 'KAMOA-KANSOKO Mining',
    site: 'KAMOA',
    wallet: DEFAULT_OWNER_ADDRESS,
    avatar: 'mine',
    account_status: 'approved',
    approved_by: 'admin',
    approved_at: new Date('2025-01-01').toISOString(),
    created_at: new Date('2025-01-01').toISOString(),
    permissions: ['submit_lots', 'view_own_lots', 'request_certification'],
  },
  {
    id: 'demo-regulator-001',
    username: 'regulateur',
    email: 'regulateur@dgmr.gouv.cd',
    password: hashPassword('Demo2025!'),
    full_name: 'Marie-Claire Kabongo',
    role: 'regulator',
    organization: 'DGMR â€” Direction des Mines',
    wallet: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
    avatar: 'scale',
    account_status: 'approved',
    approved_by: 'admin',
    approved_at: new Date('2025-01-01').toISOString(),
    created_at: new Date('2025-01-01').toISOString(),
    permissions: ['validate_lots', 'view_all_lots', 'flag_suspect', 'issue_alerts'],
  },
  {
    id: 'demo-transporter-001',
    username: 'transporteur',
    email: 'transport@mininglogistics.cd',
    password: hashPassword('Demo2025!'),
    full_name: 'Pierre Lukusa',
    role: 'transporter',
    organization: 'Katanga Mineral Transit',
    wallet: '0x5c1149F4C63f72aB67065E9A2EbFf5CA6D73d63',
    avatar: 'truck',
    account_status: 'approved',
    approved_by: 'admin',
    approved_at: new Date('2025-01-01').toISOString(),
    created_at: new Date('2025-01-01').toISOString(),
    permissions: ['transport_lots', 'confirm_delivery', 'scan_certificates'],
  },
];

const DEMO_CREDENTIALS = DEMO_USERS.map((user) => ({
  role: user.role,
  username: user.username,
  email: user.email,
  password: user.role === 'admin' ? 'Admin2025!' : 'Demo2025!',
  icon: user.avatar,
}));

function initUsers() {
  const stored = LS.get(KEYS.users, []);
  const ids = stored.map(u => u.id);
  const merged = [...stored];
  DEMO_USERS.forEach(d => { if (!ids.includes(d.id)) merged.push(d); });
  LS.set(KEYS.users, merged);
  return merged;
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
export function AuthProvider({ children }) {
  const [users,       setUsers]       = useState(() => initUsers());
  const [currentUser, setCurrentUser] = useState(() => LS.get(KEYS.currentUser));
  const [isLoading,   setIsLoading]   = useState(false);
  const [authError,   setAuthError]   = useState('');

  useEffect(() => {
    if (currentUser) LS.set(KEYS.currentUser, currentUser);
    else             LS.del(KEYS.currentUser);
  }, [currentUser]);

  useEffect(() => {
    const syncBackendTokenForDemoUser = async () => {
      if (!currentUser) return;
      if (LS.get(KEYS.backendToken)) return;

      const demoPasswordByUsername = {
        admin: 'Admin2025!',
        producteur: 'Demo2025!',
        regulateur: 'Demo2025!',
        transporteur: 'Demo2025!',
      };

      const demoPassword = demoPasswordByUsername[currentUser.username];
      if (!demoPassword) return;

      try {
        const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: currentUser.username, password: demoPassword }),
        });
        const payload = await response.json();
        if (response.ok && payload?.token) {
          LS.set(KEYS.backendToken, payload.token);
        }
      } catch (error) {
        console.warn('[AUTH] Backend token auto-sync unavailable:', error);
      }
    };

    syncBackendTokenForDemoUser();
  }, [currentUser]);

  //  Login 
  const login = useCallback(async (identifier, password) => {
    setIsLoading(true); setAuthError('');
    await new Promise(r => setTimeout(r, 600));

    const allUsers = LS.get(KEYS.users, []);
    const user = allUsers.find(u =>
      (u.email === identifier.trim().toLowerCase() ||
       u.username === identifier.trim().toLowerCase()) &&
      u.password === hashPassword(password)
    );

    if (!user) {
      setAuthError('Identifiants incorrects.');
      LS.del(KEYS.backendToken);
      setIsLoading(false);
      return { success: false, reason: 'invalid_credentials' };
    }

    //  VÃ©rifier le statut du compte 
    if (user.account_status === 'pending') {
      setAuthError('Votre compte est en attente d\'approbation par l\'administrateur.');
      LS.del(KEYS.backendToken);
      setIsLoading(false);
      return { success: false, reason: 'pending_approval' };
    }
    if (user.account_status === 'rejected') {
      setAuthError('Votre demande d\'accÃ¨s a Ã©tÃ© refusÃ©e. Contactez l\'administration.');
      LS.del(KEYS.backendToken);
      setIsLoading(false);
      return { success: false, reason: 'rejected' };
    }

    const { password: _, ...safeUser } = user;
    setCurrentUser({ ...safeUser, login_at: new Date().toISOString() });

    // Synchronise une session backend pour les routes protegÃ©es (certification, lots, etc.).
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const payload = await response.json();
      if (response.ok && payload?.token) {
        LS.set(KEYS.backendToken, payload.token);
      } else {
        LS.del(KEYS.backendToken);
      }
    } catch (error) {
      console.warn('[AUTH] Backend login unavailable:', error);
      LS.del(KEYS.backendToken);
    }

    setIsLoading(false);
    return { success: true };
  }, []);

  //  Register â€” crÃ©e un compte PENDING 
  const register = useCallback(async (formData) => {
    setIsLoading(true); setAuthError('');
    await new Promise(r => setTimeout(r, 700));

    const allUsers = LS.get(KEYS.users, []);

    if (allUsers.some(u => u.email === formData.email.trim().toLowerCase())) {
      setAuthError('Cet email est dÃ©jÃ  utilisÃ©.');
      setIsLoading(false);
      return false;
    }
    if (allUsers.some(u => u.username === formData.username.trim().toLowerCase())) {
      setAuthError('Ce nom d\'utilisateur est dÃ©jÃ  pris.');
      setIsLoading(false);
      return false;
    }

    const ROLE_AVATARS    = { producer: 'mine', regulator: 'scale', transporter: 'truck' };
    const ROLE_PERMS = {
      producer:    ['submit_lots', 'view_own_lots', 'request_certification'],
      regulator:   ['validate_lots', 'view_all_lots', 'flag_suspect', 'issue_alerts'],
      transporter: ['transport_lots', 'confirm_delivery', 'scan_certificates'],
    };

    const newUser = {
      id:             `user-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      username:       formData.username.trim().toLowerCase(),
      email:          formData.email.trim().toLowerCase(),
      password:       hashPassword(formData.password),
      full_name:      formData.full_name.trim(),
      role:           formData.role,
      organization:   formData.organization?.trim() || '',
      site:           formData.site || null,
      phone:          formData.phone?.trim() || '',
      wallet:         `0x${Array.from({length:40}, () => '0123456789abcdef'[Math.floor(Math.random()*16)]).join('')}`,
      avatar:         ROLE_AVATARS[formData.role] || 'users',
      //  Statut PENDING â€” doit Ãªtre approuvÃ© 
      account_status: 'pending',
      approved_by:    null,
      approved_at:    null,
      rejection_reason: null,
      permissions:    ROLE_PERMS[formData.role] || [],
      created_at:     new Date().toISOString(),
      registration_note: formData.note?.trim() || '',
    };

    const updated = [...allUsers, newUser];
    LS.set(KEYS.users, updated);
    setUsers(updated);
    setIsLoading(false);
    // Ne connecte PAS l'utilisateur â€” il doit attendre l'approbation
    return true;
  }, []);

  //  Approbation / Rejet (admin uniquement) 
  const approveUser = useCallback((userId, adminId) => {
    const allUsers = LS.get(KEYS.users, []);
    const updated  = allUsers.map(u => u.id !== userId ? u : {
      ...u,
      account_status: 'approved',
      approved_by:    adminId,
      approved_at:    new Date().toISOString(),
      rejection_reason: null,
    });
    LS.set(KEYS.users, updated);
    setUsers(updated);
  }, []);

  const rejectUser = useCallback((userId, adminId, reason) => {
    const allUsers = LS.get(KEYS.users, []);
    const updated  = allUsers.map(u => u.id !== userId ? u : {
      ...u,
      account_status: 'rejected',
      approved_by:    adminId,
      approved_at:    new Date().toISOString(),
      rejection_reason: reason,
    });
    LS.set(KEYS.users, updated);
    setUsers(updated);
  }, []);

  const revokeUser = useCallback((userId, adminId) => {
    const allUsers = LS.get(KEYS.users, []);
    const updated  = allUsers.map(u => u.id !== userId ? u : {
      ...u,
      account_status: 'pending',
      approved_by:    null,
      approved_at:    null,
    });
    LS.set(KEYS.users, updated);
    setUsers(updated);
  }, []);

  //  Logout 
  const logout = useCallback(() => {
    setCurrentUser(null);
    LS.del(KEYS.currentUser);
    LS.del(KEYS.backendToken);
  }, []);

  const updateProfile = useCallback((updates) => {
    if (!currentUser) return;
    const allUsers = LS.get(KEYS.users, []);
    const updated  = allUsers.map(u => u.id === currentUser.id ? { ...u, ...updates } : u);
    LS.set(KEYS.users, updated);
    setUsers(updated);
    const up = { ...currentUser, ...updates };
    setCurrentUser(up);
    LS.set(KEYS.currentUser, up);
  }, [currentUser]);

  const isAdmin = currentUser?.role === 'admin';
  const pendingUsers = users.filter(u => u.account_status === 'pending' && !DEMO_USERS.find(d => d.id === u.id && u.id === d.id));

  return (
    <AuthContext.Provider value={{
      currentUser, users, isLoading, authError, setAuthError,
      isAuthenticated: !!currentUser,
      isAdmin,
      pendingUsers,
      demoCredentials: DEMO_CREDENTIALS,
      login, register, logout, updateProfile,
      approveUser, rejectUser, revokeUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

