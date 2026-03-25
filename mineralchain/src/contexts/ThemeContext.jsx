import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);
const THEME_KEY = 'mc_theme';

// 60-30-10 Light palette (default)
// 60% = neutrals (bg-void, bg-base, bg-raised, text)
// 30% = brand teal (sidebar, buttons, brand elements)
// 10% = accents (crimson, amber, cobalt, gold — status/action only)
const LIGHT = {
  '--bg-void':       '#f2f6f4',
  '--bg-deep':       '#e8efec',
  '--bg-base':       '#f7faf8',
  '--bg-raised':     '#ffffff',
  '--bg-surface':    '#ffffff',
  '--bg-hover':      '#edf5f0',
  '--bg-card':       '#ffffff',

  '--text-primary':  '#0d1f1a',
  '--text-secondary':'#2d4a40',
  '--text-muted':    '#6b9080',
  '--text-light':    '#a0bfb4',

  // 30% — teal brand
  '--brand':        '#166a52',
  '--brand-hover':  '#1a8066',
  '--brand-light':  '#2aab88',
  '--brand-dim':    'rgba(22,106,82,0.09)',
  '--brand-mid':    'rgba(22,106,82,0.16)',

  '--emerald':      '#166a52',
  '--emerald-dim':  'rgba(22,106,82,0.09)',
  '--emerald-mid':  'rgba(22,106,82,0.18)',

  // 10% — accent colors (used sparingly)
  '--crimson':      '#b83228',
  '--crimson-dim':  'rgba(184,50,40,0.08)',
  '--amber':        '#c97a08',
  '--amber-dim':    'rgba(201,122,8,0.09)',
  '--cobalt':       '#1855a0',
  '--cobalt-light': '#2775cc',
  '--cobalt-dim':   'rgba(24,85,160,0.09)',
  '--violet':       '#6435a0',
  '--violet-dim':   'rgba(100,53,160,0.09)',
  '--gold':         '#b07c08',
  '--gold-light':   '#cc9414',
  '--gold-dim':     'rgba(176,124,8,0.09)',
  '--gold-text':    '#7a5200',
  '--copper':       '#a04a20',
  '--copper-light': '#c05a2a',
  '--copper-dim':   'rgba(160,74,32,0.09)',

  '--border-dim':    'rgba(22,106,82,0.06)',
  '--border-soft':   'rgba(22,106,82,0.11)',
  '--border-medium': 'rgba(22,106,82,0.20)',
  '--border-strong': 'rgba(22,106,82,0.38)',
  '--border-gold':   'rgba(176,124,8,0.22)',
  '--border-active': '#166a52',

  '--shadow-xs':     '0 1px 3px rgba(13,31,26,0.05)',
  '--shadow-sm':     '0 2px 8px rgba(13,31,26,0.07)',
  '--shadow-md':     '0 4px 16px rgba(13,31,26,0.09)',
  '--shadow-lg':     '0 8px 32px rgba(13,31,26,0.11)',
  '--shadow-xl':     '0 16px 48px rgba(13,31,26,0.13)',
  '--shadow-brand':  '0 4px 20px rgba(22,106,82,0.18)',

  '--input-bg':      '#ffffff',
  '--input-border':  'rgba(22,106,82,0.18)',

  '--font-display':  "'Sora', sans-serif",
  '--font-body':     "'DM Sans', sans-serif",
  '--font-mono':     "'JetBrains Mono', monospace",

  '--r-xs':          '4px',
  '--r-sm':          '8px',
  '--r-md':          '12px',
  '--r-lg':          '18px',
  '--r-xl':          '24px',
  '--r-2xl':         '32px',
  '--r-full':        '9999px',
  '--sidebar-w':     '260px',
  '--sidebar-collapsed': '68px',
  '--header-h':      '64px',
};

// 60-30-10 Dark palette
const DARK = {
  '--bg-void':       '#060f0c',
  '--bg-deep':       '#091410',
  '--bg-base':       '#0c1a15',
  '--bg-raised':     '#102219',
  '--bg-surface':    '#152c20',
  '--bg-hover':      '#1b3a2b',
  '--bg-card':       '#102219',

  '--text-primary':  '#e2f0ea',
  '--text-secondary':'#7ab59e',
  '--text-muted':    '#3d6b56',
  '--text-light':    '#244d3a',

  '--brand':        '#25a87e',
  '--brand-hover':  '#2ec48f',
  '--brand-light':  '#4dd4a8',
  '--brand-dim':    'rgba(37,168,126,0.12)',
  '--brand-mid':    'rgba(37,168,126,0.22)',

  '--emerald':      '#25a87e',
  '--emerald-dim':  'rgba(37,168,126,0.12)',
  '--emerald-mid':  'rgba(37,168,126,0.22)',

  '--crimson':      '#e05c4b',
  '--crimson-dim':  'rgba(224,92,75,0.12)',
  '--amber':        '#e8a020',
  '--amber-dim':    'rgba(232,160,32,0.12)',
  '--cobalt':       '#3a8fd4',
  '--cobalt-light': '#5aaee8',
  '--cobalt-dim':   'rgba(58,143,212,0.12)',
  '--violet':       '#9b6dd4',
  '--violet-dim':   'rgba(155,109,212,0.12)',
  '--gold':         '#d4a017',
  '--gold-light':   '#e8b830',
  '--gold-dim':     'rgba(212,160,23,0.12)',
  '--gold-text':    '#e8c040',
  '--copper':       '#c07040',
  '--copper-light': '#d48050',
  '--copper-dim':   'rgba(192,112,64,0.12)',

  '--border-dim':    'rgba(37,168,126,0.08)',
  '--border-soft':   'rgba(37,168,126,0.14)',
  '--border-medium': 'rgba(37,168,126,0.24)',
  '--border-strong': 'rgba(37,168,126,0.42)',
  '--border-gold':   'rgba(212,160,23,0.22)',
  '--border-active': '#25a87e',

  '--shadow-xs':     '0 1px 4px rgba(0,0,0,0.3)',
  '--shadow-sm':     '0 2px 10px rgba(0,0,0,0.35)',
  '--shadow-md':     '0 4px 20px rgba(0,0,0,0.4)',
  '--shadow-lg':     '0 8px 36px rgba(0,0,0,0.45)',
  '--shadow-xl':     '0 16px 52px rgba(0,0,0,0.5)',
  '--shadow-brand':  '0 4px 24px rgba(37,168,126,0.22)',

  '--input-bg':      '#0c1a15',
  '--input-border':  'rgba(37,168,126,0.20)',

  '--font-display':  "'Sora', sans-serif",
  '--font-body':     "'DM Sans', sans-serif",
  '--font-mono':     "'JetBrains Mono', monospace",

  '--r-xs':          '4px',
  '--r-sm':          '8px',
  '--r-md':          '12px',
  '--r-lg':          '18px',
  '--r-xl':          '24px',
  '--r-2xl':         '32px',
  '--r-full':        '9999px',
  '--sidebar-w':     '260px',
  '--sidebar-collapsed': '68px',
  '--header-h':      '64px',
};

function applyTheme(theme) {
  const root   = document.documentElement;
  const tokens = theme === 'dark' ? DARK : LIGHT;
  Object.entries(tokens).forEach(([k, v]) => root.style.setProperty(k, v));
  root.setAttribute('data-theme', theme);
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try { return localStorage.getItem(THEME_KEY) || 'light'; }
    catch (error) { void error; return 'light'; }
  });

  useEffect(() => { applyTheme(theme); }, [theme]);

  const setTheme = useCallback((t) => {
    // Only accept 'light' or 'dark' — no system
    const resolved = t === 'dark' ? 'dark' : 'light';
    setThemeState(resolved);
    try { localStorage.setItem(THEME_KEY, resolved); } catch (error) { void error; }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{
      theme,
      mode: theme,
      setTheme,
      setMode: setTheme,
      toggleTheme,
      isDark:  theme === 'dark',
      isLight: theme === 'light',
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
