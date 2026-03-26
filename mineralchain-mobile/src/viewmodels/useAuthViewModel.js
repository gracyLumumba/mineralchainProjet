import { useState } from 'react';
import { login } from '../services/api/authService';
import { register } from '../services/api/registerService';

const REGISTER_INITIAL = {
  full_name: '',
  username: '',
  email: '',
  password: '',
  organization: '',
  role: 'producer',
  site: 'Kamoa-Kansoko',
};

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

  const submitLogin = async () => {
    try {
      setIsSubmitting(true);
      setError('');
      setNotice('');
      const session = await login({
        identifier: identifier.trim(),
        password,
      });
      onLogin(session);
    } catch (submitError) {
      setError(submitError.message || 'Connexion impossible');
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
      setNotice(result.message || 'Compte créé');
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
    submitLogin,
    submitRegister,
  };
}
