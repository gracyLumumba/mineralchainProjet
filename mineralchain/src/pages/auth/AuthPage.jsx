import React, { useState } from 'react';
import { useAuth }  from '../../contexts/AuthContext';
import { useI18n }  from '../../contexts/i18nContext';
import { useTheme } from '../../contexts/ThemeContext';
import { LanguageSwitcher } from '../../components/layout/Header';
import { ThemeSwitcherInline } from '../../components/layout/ThemeSwitcher';
import { Ic } from '../../components/common/Icons';

function HexIcon({ size = 40, color = 'var(--brand)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <polygon
        points="20,2 36,11 36,29 20,38 4,29 4,11"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        style={{ filter: `drop-shadow(0 0 6px ${color})` }}
      />
      <g transform="translate(13 13)">
        <Ic name="mine" size={14} color={color}/>
      </g>
    </svg>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{
      width: 16, height: 16,
      border: '2px solid rgba(0,0,0,0.2)',
      borderTop: '2px solid #0c0a06',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
      flexShrink: 0,
    }}/>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────
function Field({ label, type = 'text', value, onChange, placeholder, required, error, icon }) {
  const [show, setShow] = useState(false);
  const isPwd = type === 'password';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{
        fontSize: '0.75rem', fontWeight: 700,
        color: 'var(--text-secondary)',
        letterSpacing: '0.07em', textTransform: 'uppercase',
      }}>
        {label}{required && <span style={{ color: 'var(--crimson)', marginLeft: 3 }}>*</span>}
      </label>
      <div style={{ position: 'relative' }}>
        {icon && (
          <span style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-muted)', pointerEvents: 'none', display: 'flex',
          }}>
            <Ic name={icon} size={14} color="var(--text-muted)"/>
          </span>
        )}
        <input
          type={isPwd ? (show ? 'text' : 'password') : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          style={{
            width: '100%',
            padding: `10px ${isPwd ? '40px' : '14px'} 10px ${icon ? '38px' : '14px'}`,
            background: 'var(--input-bg, var(--bg-surface))',
            border: `1px solid ${error ? 'var(--crimson)' : 'var(--input-border, var(--border-soft))'}`,
            borderRadius: 'var(--r-md)',
            color: 'var(--text-primary)',
            fontSize: '0.88rem',
            fontFamily: 'var(--font-body)',
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            boxSizing: 'border-box',
          }}
          onFocus={e => {
            e.target.style.borderColor = 'var(--brand)';
            e.target.style.boxShadow   = '0 0 0 3px var(--brand-dim)';
          }}
          onBlur={e => {
            e.target.style.borderColor = error ? 'var(--crimson)' : 'var(--input-border, var(--border-soft))';
            e.target.style.boxShadow   = error ? '0 0 0 3px rgba(239,68,68,0.1)' : 'none';
          }}
        />
        {isPwd && (
          <button type="button" onClick={() => setShow(s => !s)} style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', display: 'flex',
          }}>
            <Ic name={show ? 'eye_off' : 'eye'} size={14} color="var(--text-muted)"/>
          </button>
        )}
      </div>
      {error && <span style={{ fontSize: '0.7rem', color: 'var(--crimson)' }}>{error}</span>}
    </div>
  );
}

// ── RoleSelector ──────────────────────────────────────────────────────────────
function RoleSelector({ value, onChange, t }) {
  const roles = [
    { id: 'producer',    icon: 'mine',  label: t('nav.role.producer'),    desc: 'KAMOA · KANSOKO · KCC', color: '#c9a84c' },
    { id: 'regulator',   icon: 'scale', label: t('nav.role.regulator'),   desc: 'DGMR · CEEC',           color: '#3a7bd5' },
    { id: 'transporter', icon: 'truck', label: t('nav.role.transporter'),  desc: 'Transit & Logistique',  color: '#10b981' },
  ];
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {roles.map(r => (
        <button
          key={r.id} type="button" onClick={() => onChange(r.id)}
          style={{
            flex: 1, padding: '10px 6px',
            background: value === r.id
              ? `rgba(${r.id==='producer'?'22,106,82':r.id==='regulator'?'58,123,213':'16,185,129'},0.12)`
              : 'var(--bg-raised)',
            border: `1px solid ${value===r.id ? r.color : 'var(--border-soft)'}`,
            borderRadius: 'var(--r-md)',
            cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center',
            color: value===r.id ? r.color : 'var(--text-muted)',
          }}
        >
          <div style={{ marginBottom: 4, display:'flex', justifyContent:'center' }}>
            <Ic name={r.icon} size={18} color={value===r.id ? r.color : 'var(--text-muted)'}/>
          </div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.03em' }}>{r.label}</div>
          <div style={{ fontSize: '0.6rem', opacity: 0.65, marginTop: 2 }}>{r.desc}</div>
        </button>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  LOGIN FORM
// ════════════════════════════════════════════════════════════════════════════
function LoginForm({ onSwitch }) {
  const { login, isLoading, authError, setAuthError, demoCredentials } = useAuth();
  const { t } = useI18n();
  const [identifier, setIdentifier] = useState('');
  const [password,   setPassword]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setAuthError(t('login.error.required'));
      return;
    }
    await login(identifier, password);
  };

  const fillDemo = (cred) => {
    setIdentifier(cred.username);
    setPassword(cred.password || cred.pw || '');
    setAuthError('');
  };

  return (
    <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>

      <Field
        label={t('login.field.identifier')}
        value={identifier}
        onChange={e => { setIdentifier(e.target.value); setAuthError(''); }}
        placeholder={t('login.placeholder.id')}
        required
        icon="mail"
      />

      <Field
        label={t('login.field.password')}
        type="password"
        value={password}
        onChange={e => { setPassword(e.target.value); setAuthError(''); }}
        placeholder={t('login.placeholder.pwd')}
        required
        icon="lock"
      />

      {authError && (
        <div style={{
          padding: '10px 14px',
          background: 'var(--crimson-dim, rgba(192,57,43,0.1))',
          border: '1px solid rgba(192,57,43,0.25)',
          borderRadius: 'var(--r-md)',
          fontSize: '0.82rem', color: 'var(--crimson)',
          display: 'flex', gap: 8, alignItems: 'flex-start',
        }}>
          <Ic name="alert" size={14} color="var(--crimson)"/>{' '}
          <span>{authError}</span>
        </div>
      )}

      <button type="submit" disabled={isLoading} style={{
        width: '100%', padding: '12px', marginTop: 4,
        background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-light) 100%)',
        border: 'none', borderRadius: 'var(--r-md)',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        color: '#ffffff', fontWeight: 700, fontSize: '0.95rem',
        fontFamily: 'var(--font-body)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        opacity: isLoading ? 0.75 : 1, transition: 'all 0.2s',
        boxShadow: 'var(--shadow-brand)',
      }}>
        {isLoading
          ? <><Spinner/> {t('login.loading')}</>
          : <><Ic name="check" size={15} color="#ffffff"/> {t('login.btn')}</>
        }
      </button>

      {/* Demo accounts */}
      <div>
        <div style={{
          fontSize: '0.68rem', color: 'var(--text-muted)',
          textAlign: 'center', marginBottom: 10,
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          {t('login.demo_title')}
        </div>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {demoCredentials.map(c => (
            <button key={c.role} type="button" onClick={() => fillDemo(c)} style={{
              flex: '1 1 calc(25% - 6px)', minWidth: 64,
              padding: '7px 4px',
              background: 'var(--bg-raised)',
              border: '1px solid var(--border-soft)',
              borderRadius: 'var(--r-md)',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              fontSize: '0.7rem',
              fontFamily: 'var(--font-body)',
              transition: 'all 0.15s',
              textAlign: 'center',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='var(--brand)'; e.currentTarget.style.color='var(--brand)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border-soft)'; e.currentTarget.style.color='var(--text-secondary)'; }}
            >
              <div style={{ fontSize: 15, marginBottom: 2, display:'flex', justifyContent:'center' }}>
                <Ic name={c.icon || 'mine'} size={14} color="var(--text-muted)"/>
              </div>
              <div style={{ fontWeight: 700 }}>{c.role}</div>
              <div style={{ opacity: 0.6, marginTop: 1 }}>{c.username}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
        {t('login.no_account')}{' '}
        <button type="button" onClick={onSwitch} style={{
          background: 'none', border: 'none', color: 'var(--brand)',
          cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font-body)',
        }}>
          {t('login.register_link')}
        </button>
      </div>
    </form>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  REGISTER FORM
// ════════════════════════════════════════════════════════════════════════════
function RegisterForm({ onSwitch }) {
  const { register, isLoading, authError, setAuthError } = useAuth();
  const { t } = useI18n();

  const [form, setForm] = useState({
    full_name: '', username: '', email: '', password: '', confirm: '',
    role: 'producer', organization: '', site: 'KAMOA',
  });
  const [errors, setErrors] = useState({});
  const [done,   setDone]   = useState(false);

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setErrors(er => ({ ...er, [k]: '' }));
    setAuthError('');
  };

  const validate = () => {
    const errs = {};
    if (!form.full_name.trim())          errs.full_name    = t('register.err.fullname');
    if (form.username.length < 3)        errs.username     = t('register.err.username');
    if (!/\S+@\S+\.\S+/.test(form.email))errs.email        = t('register.err.email');
    if (form.password.length < 6)        errs.password     = t('register.err.password');
    if (form.password !== form.confirm)  errs.confirm      = t('register.err.confirm');
    if (!form.organization.trim())       errs.organization = t('register.err.org');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const ok = await register(form);
    if (ok) setDone(true);
  };

  if (done) return (
    <div style={{ textAlign:'center', padding:'16px 0' }}>
      <div style={{ fontSize:52, marginBottom:16 }}>
        <Ic name="clock" size={52} color="var(--brand)"/>
      </div>
      <h3 style={{
        fontSize:'1.2rem', fontWeight:700,
        color:'var(--text-primary)', marginBottom:10,
        fontFamily:'var(--font-display)',
      }}>
        {t('auth.register.success.title')}
      </h3>
      <p style={{
        fontSize:'0.86rem', color:'var(--text-secondary)',
        lineHeight:1.7, marginBottom:20,
      }}>
        {t('auth.register.success.msg')}
      </p>
      <div style={{
        padding:'10px 14px',
        background:'rgba(4,120,87,0.08)',
        border:'1px solid rgba(4,120,87,0.2)',
        borderRadius:10, fontSize:'0.82rem', color:'#047857', marginBottom:20,
      }}>
        {t('register.success.id_label')} <strong>{form.username}</strong>
      </div>
      <button className="btn btn-outline" style={{ width:'100%', justifyContent:'center' }} onClick={onSwitch}>
        {t('register.back_login')}
      </button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:13 }}>

      {/* Role */}
      <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
        <label style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--text-secondary)', letterSpacing:'0.07em', textTransform:'uppercase' }}>
          {t('register.field.role')} <span style={{ color:'var(--crimson)' }}>*</span>
        </label>
        <RoleSelector value={form.role} onChange={(r) => setForm(f => ({ ...f, role:r }))} t={t}/>
      </div>

      {/* Name + Username — responsive grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}
        className="auth-grid-2">
        <Field
          label={t('register.field.fullname')} value={form.full_name}
          onChange={set('full_name')} placeholder={t('register.placeholder.name')}
          required icon="pen" error={errors.full_name}
        />
        <Field
          label={t('register.field.username')} value={form.username}
          onChange={set('username')} placeholder={t('register.placeholder.user')}
          required icon="users" error={errors.username}
        />
      </div>

      {/* Email */}
      <Field
        label={t('register.field.email')} type="email" value={form.email}
        onChange={set('email')} placeholder={t('register.placeholder.email')}
        required icon="mail" error={errors.email}
      />

      {/* Organisation + Site */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}
        className="auth-grid-2">
        <Field
          label={t('register.field.org')} value={form.organization}
          onChange={set('organization')} placeholder={t('register.placeholder.org')}
          required icon="factory" error={errors.organization}
        />
        {form.role === 'producer' && (
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            <label style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--text-secondary)', letterSpacing:'0.07em', textTransform:'uppercase' }}>
              {t('register.field.site')}
            </label>
            <select value={form.site} onChange={set('site')} style={{
              padding:'10px 14px', background:'var(--input-bg, var(--bg-surface))',
              border:'1px solid var(--input-border, var(--border-soft))',
              borderRadius:'var(--r-md)', color:'var(--text-primary)',
              fontSize:'0.88rem', fontFamily:'var(--font-body)', outline:'none',
            }}>
              <option value="KAMOA">KAMOA-KANSOKO</option>
              <option value="KANSOKO">KANSOKO Mine</option>
              <option value="KCC">KCC — Kamoto</option>
            </select>
          </div>
        )}
      </div>

      {/* Passwords */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}
        className="auth-grid-2">
        <Field
          label={t('register.field.password')} type="password" value={form.password}
          onChange={set('password')} placeholder="••••••••"
          required icon="lock" error={errors.password}
        />
        <Field
          label={t('register.field.confirm')} type="password" value={form.confirm}
          onChange={set('confirm')} placeholder="••••••••"
          required icon="lock" error={errors.confirm}
        />
      </div>

      {authError && (
        <div style={{
          padding:'10px 14px',
          background:'var(--crimson-dim, rgba(192,57,43,0.1))',
          border:'1px solid rgba(192,57,43,0.25)',
          borderRadius:'var(--r-md)',
          fontSize:'0.82rem', color:'var(--crimson)',
          display:'flex', gap:8, alignItems:'center',
        }}>
          <Ic name="alert" size={14} color="var(--crimson)"/> {authError}
        </div>
      )}

      <button type="submit" disabled={isLoading} style={{
        width:'100%', padding:'12px', marginTop:4,
        background:'linear-gradient(135deg, var(--brand) 0%, var(--brand-light) 100%)',
        border:'none', borderRadius:'var(--r-md)',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        color:'#ffffff', fontWeight:700, fontSize:'0.95rem',
        fontFamily:'var(--font-body)',
        display:'flex', alignItems:'center', justifyContent:'center', gap:8,
        opacity: isLoading ? 0.75 : 1,
        boxShadow:'var(--shadow-brand)',
      }}>
        {isLoading
          ? <><Spinner/> {t('register.loading')}</>
          : <><Ic name="pen" size={15} color="#ffffff"/> {t('register.btn')}</>
        }
      </button>

      <div style={{ textAlign:'center', fontSize:'0.82rem', color:'var(--text-muted)' }}>
        {t('register.has_account')}{' '}
        <button type="button" onClick={onSwitch} style={{
          background:'none', border:'none', color:'var(--brand)',
          cursor:'pointer', fontWeight:700, fontFamily:'var(--font-body)',
        }}>
          {t('register.login_link')}
        </button>
      </div>
    </form>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  PAGE PRINCIPALE
// ════════════════════════════════════════════════════════════════════════════
export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const { t }           = useI18n();

  return (
    <div className="auth-page-root" style={{
      minHeight: '100vh',
      background: 'var(--bg-void)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Fond hexagonal décoratif */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden' }}>
        {[
          { size:320, top:'-90px',  left:'-90px', opacity:0.04 },
          { size:220, bottom:'-70px', right:'-70px', opacity:0.05 },
          { size:160, top:'40%',   right:'8%',  opacity:0.03 },
        ].map((h,i) => (
          <svg key={i} style={{
            position:'absolute', top:h.top, left:h.left,
            bottom:h.bottom, right:h.right, opacity:h.opacity,
          }} width={h.size} height={h.size} viewBox="0 0 100 100">
            <polygon points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5"
              fill="none" stroke="rgba(31,122,96,0.28)" strokeWidth="1"/>
          </svg>
        ))}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(rgba(31,122,96,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(31,122,96,0.025) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}/>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(31,122,96,0.06) 0%, transparent 70%)',
        }}/>
      </div>

      {/* Controls top-right */}
      <div className="auth-controls">
        <ThemeSwitcherInline/>
        <LanguageSwitcher/>
      </div>

      {/* Card */}
      <div className="auth-card" style={{
        width: '100%',
        maxWidth: mode === 'register' ? 560 : 440,
        background: 'var(--bg-raised)',
        border: '1px solid var(--border-soft)',
        borderRadius: 'var(--r-xl)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative',
        animation: 'fadeUp 0.4s ease',
        transition: 'max-width 0.3s ease',
      }}>
        <div style={{
          background: 'var(--bg-surface)',
          padding: '32px 36px 24px',
          borderBottom: '1px solid var(--border-soft)',
          textAlign: 'center',
          position: 'relative',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <div style={{
              width: 64,
              height: 64,
              background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-light) 100%)',
              borderRadius: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 24px rgba(31,122,96,0.22)',
              animation: 'glowPulse 3s ease infinite',
            }}>
              <HexIcon size={34} color="#ffffff"/>
            </div>
          </div>

          <div style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '1.8rem',
            color: 'var(--text-primary)',
            letterSpacing: '0.04em',
            marginBottom: 4,
          }}>
            MineralChain
          </div>
          <div style={{
            fontSize: '0.68rem',
            letterSpacing: '0.2em',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            marginBottom: 16,
          }}>
            Katanga · RDC · Certification Minérale
          </div>

          <div style={{ display: 'flex', background: 'var(--bg-deep)', borderRadius: 'var(--r-md)', padding: 4, gap: 4 }}>
          {[['login', t('login.title')], ['register', t('register.title')]].map(([m, lbl]) => (
            <button key={m} type="button" onClick={() => setMode(m)} style={{
              flex:1, padding:'8px 12px',
              background: mode===m ? 'var(--brand)' : 'transparent',
              border:'none',
              borderRadius: 7,
              cursor:'pointer',
              color: mode===m ? '#ffffff' : 'var(--text-muted)',
              fontWeight: mode===m ? 700 : 500,
              fontSize:'0.85rem',
              fontFamily:'var(--font-body)',
              transition:'all 0.2s',
              boxShadow: mode===m ? 'var(--shadow-brand)' : 'none',
            }}>
              {lbl}
            </button>
          ))}
          </div>
        </div>

        {/* Form */}
        <div className="auth-form-body" style={{ padding: '28px 36px 32px', background: 'var(--bg-raised)' }}>
          {mode === 'login'
            ? <LoginForm    onSwitch={() => setMode('register')}/>
            : <RegisterForm onSwitch={() => setMode('login')}/>
          }
        </div>

        <div style={{
          padding: '12px 36px',
          borderTop: '1px solid var(--border-dim)',
          background: 'var(--bg-surface)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Ic name="chain" size={11} color="var(--text-muted)"/> 0xE7A5...9Fbb
          </span>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
            IA · Blockchain · ERC-721
          </span>
        </div>
      </div>

      <style>{`
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 10px 24px rgba(31,122,96,0.22); }
          50% { box-shadow: 0 14px 34px rgba(31,122,96,0.30); }
        }
      `}</style>
    </div>
  );
}
