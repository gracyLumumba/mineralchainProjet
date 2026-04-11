import React, { useEffect } from 'react';

export default function ClearCache() {
  useEffect(() => {
    // Vider localStorage
    localStorage.clear();
    console.log('[CACHE] localStorage vidé');
    
    // Vider sessionStorage
    sessionStorage.clear();
    console.log('[CACHE] sessionStorage vidé');
    
    // Rediriger vers la page de login après 1 seconde
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  }, []);

  return (
    <div style={{ textAlign: 'center', padding: '40px', fontFamily: 'sans-serif' }}>
      <h2>Vidage du cache en cours...</h2>
      <p>Vous serez redirigé vers la page de connexion.</p>
    </div>
  );
}
