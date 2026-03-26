import { useState } from 'react';
import { createUserSession } from '../models/UserSession';

export function useAuthViewModel({ onLogin }) {
  const [name, setName] = useState('Denise');
  const [role, setRole] = useState('producer');
  const [site, setSite] = useState('Kamoa-Kansoko');

  const submit = () => {
    onLogin(
      createUserSession({
        name: name.trim() || 'Operateur',
        role,
        site: site.trim() || 'Kamoa-Kansoko',
      })
    );
  };

  return {
    name,
    setName,
    role,
    setRole,
    site,
    setSite,
    submit,
  };
}
