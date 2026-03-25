import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotif, NOTIF_TYPES } from '../../contexts/NotifContext';
import { Ic } from '../../components/common/Icons';
import { useApp, fmt } from '../../contexts/AppContext';
import { useI18n } from '../../contexts/i18nContext';

const TEAL = '#166a52';

const ROLE_META = {
  producer:    { color: '#b87333', bg: 'rgba(184,115,51,0.10)', labelKey: 'nav.role.producer', icon: 'mine' },
  regulator:   { color: '#1a5fa0', bg: 'rgba(26,95,160,0.10)', labelKey: 'nav.role.regulator', icon: 'scale' },
  transporter: { color: '#166a52', bg: 'rgba(22,106,82,0.10)', labelKey: 'nav.role.transporter', icon: 'truck' },
  admin:       { color: '#6d3fa0', bg: 'rgba(109,63,160,0.10)', labelKey: 'nav.role.admin', icon: 'shield' },
};

const ACCOUNT_STATUS_META = {
  approved: { color: '#166a52', bg: 'rgba(22,106,82,0.10)', labelKey: 'admin.status.approved' },
  pending:  { color: '#b45309', bg: 'rgba(180,83,9,0.10)', labelKey: 'admin.status.pending' },
  rejected: { color: '#c0392b', bg: 'rgba(192,57,43,0.10)', labelKey: 'admin.status.rejected' },
};

function Pill({ color, bg, children }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '2px 9px',
      borderRadius: 99,
      background: bg,
      color,
      fontSize: '0.68rem',
      fontWeight: 700,
      letterSpacing: '0.04em',
      whiteSpace: 'nowrap',
      border: `1px solid ${color}30`,
    }}>
      {children}
    </span>
  );
}

function Stat({ label, value, icon, color }) {
  return (
    <div style={{
      background: 'var(--bg-raised)',
      borderRadius: 'var(--r-md)',
      padding: '16px 20px',
      border: '1px solid var(--border-soft)',
      boxShadow: 'var(--shadow-xs)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          background: `${color}18`,
          border: `1px solid ${color}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color,
        }}>
          {icon}
        </div>
        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: '1.9rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
        {value}
      </div>
    </div>
  );
}

function SearchField({ value, onChange, placeholder, maxWidth = 280 }) {
  return (
    <div style={{ position: 'relative', flex: 1, maxWidth }}>
      <input
        className="form-input"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{ paddingLeft: 34 }}
      />
      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
        <Ic size={14} d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>} />
      </span>
    </div>
  );
}

function UsersTab() {
  const { currentUser, users, approveUser, rejectUser, revokeUser } = useAuth();
  const { notify } = useNotif();
  const { t } = useI18n();
  const [tab, setTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const handleDelete = (userId) => {
    const allUsers = JSON.parse(localStorage.getItem('mc_users') || '[]');
    const updated = allUsers.filter((user) => user.id !== userId);
    localStorage.setItem('mc_users', JSON.stringify(updated));
    window.location.reload();
  };

  const counts = {
    pending: users.filter((user) => user.account_status === 'pending' && user.id !== currentUser?.id).length,
    approved: users.filter((user) => user.account_status === 'approved' && user.id !== currentUser?.id).length,
    rejected: users.filter((user) => user.account_status === 'rejected' && user.id !== currentUser?.id).length,
  };

  const tabs = [
    { id: 'pending', label: t('admin.status.pending'), count: counts.pending },
    { id: 'approved', label: t('admin.status.approved'), count: counts.approved },
    { id: 'rejected', label: t('admin.status.rejected'), count: counts.rejected },
    { id: 'all', label: t('admin.filter.all'), count: users.filter((user) => user.id !== currentUser?.id).length },
  ];

  const filtered = users.filter((user) => {
    if (user.id === currentUser?.id) return false;
    if (tab === 'pending' && user.account_status !== 'pending') return false;
    if (tab === 'approved' && user.account_status !== 'approved') return false;
    if (tab === 'rejected' && user.account_status !== 'rejected') return false;
    if (search && ![user.full_name, user.username, user.email, user.organization].join(' ').toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
        <Stat label={t('admin.status.pending')} value={counts.pending} icon={<Ic name="clock" size={16}/>} color="#b45309" />
        <Stat label={t('admin.status.approved')} value={counts.approved} icon={<Ic name="check" size={16}/>} color={TEAL} />
        <Stat label={t('admin.status.rejected')} value={counts.rejected} icon={<Ic name="x" size={16}/>} color="#c0392b" />
        <Stat label={t('admin.stats.total')} value={users.filter((user) => user.id !== currentUser?.id).length} icon={<Ic name="users" size={16}/>} color="#6d3fa0" />
      </div>

      {counts.pending > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 16px',
            marginBottom: 16,
            background: 'rgba(180,83,9,0.08)',
            border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: 'var(--r-md)',
            cursor: 'pointer',
          }}
          onClick={() => setTab('pending')}
        >
          <Ic name="clock" size={16} />
          <span style={{ fontSize: '0.85rem', color: '#b45309', fontWeight: 600 }}>
            {t('admin.banner.awaiting', { count: counts.pending })}
          </span>
          <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: '#b45309', textDecoration: 'underline' }}>
            {t('admin.banner.review')}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 0, background: 'var(--bg-void)', borderRadius: 'var(--r-sm)', padding: 3, border: '1px solid var(--border-soft)' }}>
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                background: tab === item.id ? 'var(--brand)' : 'transparent',
                color: tab === item.id ? '#fff' : 'var(--text-muted)',
                fontWeight: tab === item.id ? 700 : 500,
                fontSize: '0.8rem',
                fontFamily: 'var(--font-body)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {item.label}
              {item.count > 0 && (
                <span style={{ background: tab === item.id ? 'rgba(255,255,255,0.25)' : 'var(--brand-dim)', color: tab === item.id ? '#fff' : 'var(--brand)', borderRadius: 99, padding: '0 6px', fontSize: '0.68rem', fontWeight: 700 }}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <SearchField
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('admin.search.users')}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '40px 24px', textAlign: 'center', background: 'var(--bg-raised)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border-soft)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('admin.empty.users')}</div>
          </div>
        ) : filtered.map((user) => {
          const role = ROLE_META[user.role] || ROLE_META.admin;
          const status = ACCOUNT_STATUS_META[user.account_status] || ACCOUNT_STATUS_META.pending;
          const isDemo = user.id.startsWith('demo-');

          return (
            <div
              key={user.id}
              style={{
                background: 'var(--bg-raised)',
                borderRadius: 'var(--r-md)',
                border: `1px solid ${user.account_status === 'pending' ? 'rgba(245,158,11,0.3)' : 'var(--border-soft)'}`,
                padding: '16px 18px',
                boxShadow: user.account_status === 'pending' ? '0 0 0 3px rgba(245,158,11,0.06)' : 'var(--shadow-xs)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  flexShrink: 0,
                  background: role.bg,
                  border: `2px solid ${role.color}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: role.color,
                }}>
                  <Ic name={role.icon} size={16} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                      {user.full_name}
                    </span>
                    <Pill color={role.color} bg={role.bg}>{t(role.labelKey)}</Pill>
                    <Pill color={status.color} bg={status.bg}>{t(status.labelKey)}</Pill>
                    {isDemo && <Pill color="var(--text-muted)" bg="var(--bg-hover)">{t('admin.user.demo')}</Pill>}
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                    @{user.username} · {user.email}
                  </div>

                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {user.organization && <span>{user.organization}</span>}
                    {user.site && <span>{t('label.site')}: {user.site}</span>}
                    <span>{t('admin.user.registered')}: {fmt.date(user.created_at)}</span>
                    {user.approved_at && <span>{t('admin.user.processed')}: {fmt.date(user.approved_at)}</span>}
                  </div>

                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
                    {(user.permissions || []).map((permission) => (
                      <span key={permission} style={{ fontSize: '0.62rem', padding: '2px 7px', background: 'var(--bg-void)', border: '1px solid var(--border-soft)', borderRadius: 99, color: 'var(--text-muted)' }}>
                        {permission.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>

                  {user.registration_note && (
                    <div style={{ marginTop: 8, padding: '7px 11px', background: 'var(--bg-void)', borderRadius: 8, fontSize: '0.76rem', color: 'var(--text-secondary)', fontStyle: 'italic', borderLeft: '3px solid var(--border-medium)' }}>
                      "{user.registration_note}"
                    </div>
                  )}

                  {user.rejection_reason && (
                    <div style={{ marginTop: 8, padding: '6px 10px', background: 'var(--crimson-dim)', border: '1px solid var(--crimson)30', borderRadius: 8, fontSize: '0.73rem', color: 'var(--crimson)' }}>
                      {t('admin.user.rejection_reason')}: {user.rejection_reason}
                    </div>
                  )}
                </div>

                {!isDemo && (
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {user.account_status === 'pending' && (
                      <>
                        <button
                          onClick={() => {
                            approveUser(user.id, currentUser.id);
                            notify(NOTIF_TYPES.USER_APPROVED, { userName: user.full_name, role: user.role });
                          }}
                          title={t('admin.action.approve')}
                          style={{ padding: '7px 12px', borderRadius: 'var(--r-sm)', border: '1px solid rgba(22,106,82,0.3)', background: 'rgba(22,106,82,0.08)', color: TEAL, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', fontWeight: 600, fontFamily: 'var(--font-body)' }}
                        >
                          <Ic name="check" size={13}/> {t('admin.action.approve')}
                        </button>

                        <button
                          onClick={() => setRejectId(user.id)}
                          title={t('admin.action.reject')}
                          style={{ padding: '7px 12px', borderRadius: 'var(--r-sm)', border: '1px solid rgba(192,57,43,0.25)', background: 'rgba(192,57,43,0.07)', color: 'var(--crimson)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', fontWeight: 600, fontFamily: 'var(--font-body)' }}
                        >
                          <Ic name="x" size={13}/> {t('admin.action.reject')}
                        </button>
                      </>
                    )}

                    {user.account_status === 'approved' && (
                      <button
                        onClick={() => revokeUser(user.id, currentUser.id)}
                        title={t('admin.action.revoke')}
                        style={{ padding: '7px 12px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border-soft)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', fontFamily: 'var(--font-body)' }}
                      >
                        <Ic name="history" size={13}/> {t('admin.action.revoke')}
                      </button>
                    )}

                    <button
                      onClick={() => setDeleteId(user.id)}
                      title={t('admin.action.delete_account')}
                      style={{ padding: '7px 10px', borderRadius: 'var(--r-sm)', border: '1px solid rgba(192,57,43,0.2)', background: 'transparent', color: 'var(--crimson)', cursor: 'pointer' }}
                    >
                      <Ic name="trash" size={14}/>
                    </button>
                  </div>
                )}
              </div>

              {rejectId === user.id && (
                <div style={{ borderTop: '1px solid var(--border-dim)', marginTop: 12, paddingTop: 12 }}>
                  <input
                    className="form-input"
                    placeholder={t('admin.reject.placeholder')}
                    value={rejectReason}
                    onChange={(event) => setRejectReason(event.target.value)}
                    style={{ marginBottom: 8 }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      disabled={!rejectReason.trim()}
                      onClick={() => {
                        rejectUser(user.id, currentUser.id, rejectReason);
                        setRejectId(null);
                        setRejectReason('');
                      }}
                      style={{ padding: '7px 16px', borderRadius: 'var(--r-sm)', background: 'var(--crimson)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'var(--font-body)', opacity: rejectReason.trim() ? 1 : 0.5 }}
                    >
                      {t('admin.reject.confirm')}
                    </button>
                    <button
                      onClick={() => { setRejectId(null); setRejectReason(''); }}
                      style={{ padding: '7px 14px', borderRadius: 'var(--r-sm)', background: 'transparent', border: '1px solid var(--border-soft)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'var(--font-body)' }}
                    >
                      {t('action.cancel')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--r-xl)', padding: '28px 32px', maxWidth: 380, width: '90%', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border-soft)' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--crimson-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: 'var(--crimson)' }}>
              <Ic name="trash" size={20}/>
            </div>
            <h3 style={{ textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 8, color: 'var(--text-primary)' }}>
              {t('admin.action.delete_account')}
            </h3>
            <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
              {t('admin.delete.warning')}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setDeleteId(null)}
                style={{ flex: 1, padding: '10px', borderRadius: 'var(--r-md)', border: '1px solid var(--border-soft)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.85rem' }}
              >
                {t('action.cancel')}
              </button>
              <button
                onClick={() => { handleDelete(deleteId); setDeleteId(null); }}
                style={{ flex: 1, padding: '10px', borderRadius: 'var(--r-md)', border: 'none', background: 'var(--crimson)', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.85rem', fontWeight: 700 }}
              >
                {t('admin.action.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TransactionsTab() {
  const { lots } = useApp();
  const { t } = useI18n();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [siteFilter, setSiteFilter] = useState('all');

  const siteColors = { KAMOA: '#b87333', KANSOKO: '#1a5fa0', KCC: TEAL };

  const filters = [
    { id: 'all', label: t('admin.lots.all'), count: lots.length },
    { id: 'certified', label: t('admin.lots.certified'), count: lots.filter((lot) => lot.token_id != null).length },
    { id: 'pending', label: t('admin.lots.awaiting'), count: lots.filter((lot) => !lot.regulator_validated && lot.status !== 'SUSPECT').length },
    { id: 'suspect', label: t('admin.lots.suspect'), count: lots.filter((lot) => lot.status === 'SUSPECT').length },
    { id: 'delivered', label: t('admin.lots.delivered'), count: lots.filter((lot) => lot.transport_status === 'delivered').length },
  ];

  const statusMap = {
    AUTHENTIQUE: { color: TEAL, bg: 'rgba(22,106,82,0.10)', label: t('admin.tx.authentic') },
    SUSPECT: { color: '#c0392b', bg: 'rgba(192,57,43,0.10)', label: t('admin.tx.suspect') },
    'À VÉRIFIER': { color: '#b45309', bg: 'rgba(180,83,9,0.10)', label: t('admin.tx.to_verify') },
  };

  const filtered = lots.filter((lot) => {
    if (filter === 'certified' && lot.token_id == null) return false;
    if (filter === 'suspect' && lot.status !== 'SUSPECT') return false;
    if (filter === 'pending' && (lot.regulator_validated || lot.status === 'SUSPECT')) return false;
    if (filter === 'delivered' && lot.transport_status !== 'delivered') return false;
    if (siteFilter !== 'all' && lot.site !== siteFilter) return false;
    if (search && !lot.lot_id.toLowerCase().includes(search.toLowerCase()) && !(lot.destination || '').toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <Stat label={t('admin.stats.total_lots')} value={lots.length} icon={<Ic name="package" size={16}/>} color={TEAL} />
        <Stat label={t('admin.stats.certified')} value={lots.filter((lot) => lot.token_id != null).length} icon={<Ic name="check" size={16}/>} color="#1a5fa0" />
        <Stat label={t('admin.stats.in_transit')} value={lots.filter((lot) => lot.transport_status === 'en_route').length} icon={<Ic name="truck" size={16}/>} color="#b87333" />
        <Stat label={t('admin.stats.delivered')} value={lots.filter((lot) => lot.transport_status === 'delivered').length} icon={<Ic name="activity" size={16}/>} color="#6d3fa0" />
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 0, background: 'var(--bg-void)', borderRadius: 'var(--r-sm)', padding: 3, border: '1px solid var(--border-soft)' }}>
          {filters.map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              style={{
                padding: '5px 11px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                background: filter === item.id ? 'var(--brand)' : 'transparent',
                color: filter === item.id ? '#fff' : 'var(--text-muted)',
                fontWeight: filter === item.id ? 700 : 500,
                fontSize: '0.75rem',
                fontFamily: 'var(--font-body)',
              }}
            >
              {item.label} {item.count > 0 && `(${item.count})`}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          {['all', 'KAMOA', 'KANSOKO', 'KCC'].map((site) => (
            <button
              key={site}
              onClick={() => setSiteFilter(site)}
              style={{
                padding: '5px 11px',
                borderRadius: 99,
                border: `1px solid ${siteFilter === site ? siteColors[site] || TEAL : 'var(--border-soft)'}`,
                background: siteFilter === site ? `${siteColors[site] || TEAL}18` : 'transparent',
                color: siteFilter === site ? siteColors[site] || TEAL : 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.72rem',
                fontWeight: 700,
                fontFamily: 'var(--font-body)',
              }}
            >
              {site === 'all' ? t('admin.filter.all_sites') : site}
            </button>
          ))}
        </div>

        <SearchField
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('admin.search.lots')}
          maxWidth={220}
        />

        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {t('admin.results', { count: filtered.length })}
        </span>
      </div>

      <div style={{ background: 'var(--bg-raised)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border-soft)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-void)', borderBottom: '1px solid var(--border-soft)' }}>
                {[t('label.lot_id'), t('label.site'), t('label.mineral_type'), t('label.status'), t('admin.table.nft'), t('admin.table.dgmr'), t('admin.table.transport'), t('label.date')].map((heading) => (
                  <th key={heading} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {t('admin.empty.transactions')}
                  </td>
                </tr>
              ) : filtered.map((lot, index) => {
                const lotStatus = statusMap[lot.status] || statusMap['À VÉRIFIER'];
                const siteColor = siteColors[lot.site] || TEAL;

                return (
                  <tr key={lot.lot_id} style={{ borderBottom: '1px solid var(--border-dim)', background: index % 2 === 0 ? 'transparent' : 'var(--bg-void)' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700, color: 'var(--brand)' }}>
                        {lot.lot_id}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <Pill color={siteColor} bg={`${siteColor}18`}>{lot.site}</Pill>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                        {lot.mineral_type || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <Pill color={lotStatus.color} bg={lotStatus.bg}>{lotStatus.label}</Pill>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {lot.token_id != null
                        ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#1a5fa0', fontWeight: 700 }}>#{lot.token_id}</span>
                        : <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {lot.regulator_validated
                        ? <span style={{ color: TEAL, fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><Ic name="check" size={12}/> {t('admin.dgmr.validated')}</span>
                        : lot.status === 'SUSPECT'
                          ? <span style={{ color: 'var(--crimson)', fontSize: '0.72rem', fontWeight: 700 }}>{t('admin.dgmr.blocked')}</span>
                          : <span style={{ color: '#b45309', fontSize: '0.72rem' }}>{t('admin.dgmr.pending')}</span>}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: '0.72rem', color: lot.transport_status === 'delivered' ? TEAL : lot.transport_status === 'en_route' ? '#b87333' : 'var(--text-muted)', fontWeight: lot.transport_status ? 600 : 400 }}>
                        {lot.transport_status === 'delivered' ? t('admin.transport.delivered')
                          : lot.transport_status === 'en_route' ? t('admin.transport.in_transit')
                          : '—'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                      {fmt.date(lot.analyzed_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { users } = useAuth();
  const { t } = useI18n();
  const [tab, setTab] = useState('users');

  const pendingCount = users.filter((user) => user.account_status === 'pending').length;
  const tabs = [
    { id: 'users', icon: <Ic name="users" size={15}/>, label: t('admin.tab.users') },
    { id: 'transactions', icon: <Ic name="activity" size={15}/>, label: t('admin.tab.transactions') },
  ];

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(109,63,160,0.12)', border: '1px solid rgba(109,63,160,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6d3fa0' }}>
            <Ic name="shield" size={18}/>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Administration
          </h1>
          {pendingCount > 0 && (
            <span style={{ padding: '3px 10px', borderRadius: 99, background: 'rgba(180,83,9,0.12)', color: '#b45309', fontSize: '0.72rem', fontWeight: 700, border: '1px solid rgba(245,158,11,0.3)' }}>
              {t('admin.pending_badge', { count: pendingCount })}
            </span>
          )}
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
          {t('admin.subtitle')}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 0, marginBottom: 24, background: 'var(--bg-raised)', borderRadius: 'var(--r-md)', padding: 4, border: '1px solid var(--border-soft)', width: 'fit-content', boxShadow: 'var(--shadow-xs)' }}>
        {tabs.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '8px 20px',
              borderRadius: 10,
              border: 'none',
              cursor: 'pointer',
              background: tab === item.id ? 'var(--brand)' : 'transparent',
              color: tab === item.id ? '#fff' : 'var(--text-secondary)',
              fontWeight: tab === item.id ? 700 : 500,
              fontSize: '0.85rem',
              fontFamily: 'var(--font-body)',
              transition: 'all 0.15s',
            }}
          >
            {item.icon} {item.label}
          </button>
        ))}
      </div>

      {tab === 'users' && <UsersTab />}
      {tab === 'transactions' && <TransactionsTab />}
    </div>
  );
}
