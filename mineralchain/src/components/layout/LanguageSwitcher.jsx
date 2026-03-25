import React, { useState } from 'react';
import { useI18n } from '../../contexts/i18nContext';

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const [hovered, setHovered] = useState(null);

  const langs = [
    { code: 'fr', flag: 'FR', label: 'FR' },
    { code: 'en', flag: 'EN', label: 'EN' },
  ];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      background: 'var(--bg-raised)',
      border: '1px solid var(--border-soft)',
      borderRadius: 'var(--r-md)',
      padding: '3px 4px',
    }}>
      {langs.map(lang => {
        const isActive = locale === lang.code;
        const isHovered = hovered === lang.code;
        return (
          <button
            key={lang.code}
            onClick={() => setLocale(lang.code)}
            onMouseEnter={() => setHovered(lang.code)}
            onMouseLeave={() => setHovered(null)}
            title={t(`lang.${lang.code}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              background: isActive
                ? 'linear-gradient(135deg, var(--gold) 0%, var(--copper) 100%)'
                : isHovered ? 'var(--bg-hover)' : 'transparent',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              color: isActive ? '#0c0a06' : 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: isActive ? 700 : 500,
              fontFamily: 'var(--font-body)',
              transition: 'all 0.15s',
              letterSpacing: '0.04em',
              boxShadow: isActive ? '0 2px 8px rgba(201,168,76,0.3)' : 'none',
            }}
          >
            <span style={{ fontSize: 13 }}>{lang.flag}</span>
            <span>{lang.label}</span>
          </button>
        );
      })}
    </div>
  );
}
