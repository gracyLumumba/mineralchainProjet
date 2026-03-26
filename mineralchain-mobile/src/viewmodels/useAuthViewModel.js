import { useState } from 'react';
import { login } from '../services/api/authService';

export function useAuthViewModel({ onLogin }) {
  const [identifier, setIdentifier] = useState('producteur');
  const [password, setPassword] = useState('Demo2025!');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    try {
      setIsSubmitting(true);
      setError('');
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

  return {
    identifier,
    setIdentifier,
    password,
    setPassword,
    isSubmitting,
    error,
    submit,
  };
}
