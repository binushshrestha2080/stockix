'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stats {
  totalUsers: number;
  totalPortfolios: number;
  totalWatchlists: number;
}

interface User {
  _id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: string;
}

interface Portfolio {
  _id: string;
  userId: { email: string };
  positions: { symbol: string; shares: number; avgPrice: number }[];
}

interface Watchlist {
  _id: string;
  userId: { email: string };
  items: { symbol: string }[];
}

type Tab = 'overview' | 'users' | 'portfolios' | 'watchlists';

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
  wrap: {
    display: 'flex',
    minHeight: '100vh',
    background: '#0d0d0d',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  } as React.CSSProperties,

  // Sidebar
  sidebar: {
    width: 220,
    flexShrink: 0,
    background: '#111',
    borderRight: '0.5px solid rgba(255,255,255,0.08)',
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '0 0 1rem',
  },
  logo: {
    padding: '1.4rem 1.25rem 1.1rem',
    borderBottom: '0.5px solid rgba(255,255,255,0.08)',
    marginBottom: '0.5rem',
  },
  logoTitle: {
    fontSize: 17,
    fontWeight: 600,
    color: '#fff',
    letterSpacing: '-0.3px',
  },
  logoBadge: {
    fontSize: 10,
    background: 'rgba(74,222,128,0.1)',
    color: '#4ade80',
    borderRadius: 4,
    padding: '2px 7px',
    marginLeft: 6,
    fontWeight: 700,
    letterSpacing: '0.05em',
  },
  navItem: (active: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 1.25rem',
    fontSize: 13.5,
    cursor: 'pointer',
    background: active ? 'rgba(255,255,255,0.05)' : 'transparent',
    borderLeft: active ? '2px solid #4ade80' : '2px solid transparent',
    color: active ? '#fff' : 'rgba(255,255,255,0.45)',
    fontWeight: active ? 500 : 400,
    transition: 'all 0.15s',
  } as React.CSSProperties),
  sidebarFooter: {
    marginTop: 'auto',
    padding: '1rem 1.25rem',
    borderTop: '0.5px solid rgba(255,255,255,0.08)',
  },
  avatar: {
    width: 30, height: 30,
    borderRadius: '50%',
    background: '#4ade80',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 600,  color: '#0d0d0d', flexShrink: 0,
  } as React.CSSProperties,

  // Main
  main: { flex: 1, display: 'flex', flexDirection: 'column' as const, overflow: 'auto' },
  topbar: {
    background: '#111',
    borderBottom: '0.5px solid rgba(255,255,255,0.08)',
    padding: '0 1.5rem',
    height: 52,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexShrink: 0,
  },
  topbarTitle: { fontSize: 15, fontWeight: 500, color: '#fff' },
  liveBadge: {
    fontSize: 11,
    background: 'rgba(30,100,60,0.35)',
    color: '#4caf7d',
    borderRadius: 20,
    padding: '3px 10px',
    border: '1px solid rgba(30,100,60,0.4)',
  },

  // Content
  content: { padding: '1.5rem', display: 'flex', flexDirection: 'column' as const, gap: '1.25rem' },

  // Stat cards
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 12,
  } as React.CSSProperties,
  statCard: {
    background: 'rgba(255,255,255,0.04)',
    border: '0.5px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: '1rem 1.25rem',
    position: 'relative' as const,
    overflow: 'hidden',
  },
  statLabel: {
    fontSize: 10, color: '#555',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 26, fontWeight: 600,
    color: '#fff', lineHeight: 1,
    marginBottom: 5,
  },
  statDeltaUp: { fontSize: 11, color: '#4caf7d' },
  statDeltaNeutral: { fontSize: 11, color: '#555' },

  // Panel
  panel: {
    background: 'rgba(255,255,255,0.04)',
    border: '0.5px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  panelHeader: {
    padding: '0.9rem 1.25rem',
     borderBottom: '0.5px solid rgba(255,255,255,0.08)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  panelTitle: { fontSize: 13, fontWeight: 500, color: '#fff' },
  panelCount: {
    fontSize: 11, color: '#555',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 20, padding: '2px 8px',
  },

  // Table
  th: {
    fontSize: 10,
    textAlign: 'left' as const,
    padding: '8px 1.25rem',
    borderBottom: '0.5px solid rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.35)',
    fontWeight: 400,
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
  },
  td: {
    fontSize: 13,
    padding: '10px 1.25rem',
    borderBottom: '0.5px solid rgba(255,255,255,0.05)',
    color: 'rgba(255,255,255,0.7)',
  },

  // Badges
  pillAdmin: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 20,
    fontSize: 11,
    background: 'rgba(74,222,128,0.1)',
    color: '#4ade80',
    fontWeight: 600,
  },
  pillUser: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 20,
    fontSize: 11,
    background: 'rgba(255,255,255,0.08)',
    color: '#666',
  },
  pillActive: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 20,
    fontSize: 11,
    background: 'rgba(30,100,60,0.25)',
    color: '#4caf7d',
  },

  // Buttons
  deleteBtn: {
    fontSize: 11, color: '#c0392b',
    cursor: 'pointer',
    background: 'none', border: 'none',
    padding: 0,
  },
  refreshBtn: {
    fontSize: 12,
    cursor: 'pointer',
    background: 'none',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 6,
    padding: '4px 10px',
    color: '#666',
  } as React.CSSProperties,
  logoutBtn: {
    fontSize: 12, color: '#555',
    cursor: 'pointer',
    background: 'none',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 6,
    padding: '4px 10px',
  } as React.CSSProperties,

  // Bar chart
  barRow: {
    padding: '10px 1.25rem',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  barMeta: { display: 'flex', justifyContent: 'space-between', marginBottom: 5 },
  barTrack: { height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' as const },
  barFill: (pct: number) => ({
    height: 4, width: `${pct}%`, background: '#4ade80', borderRadius: 2,
  }),

  // Mini stats
  miniStat: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 1.25rem',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  miniLabel: { fontSize: 13, color: '#555' },
  miniVal: { fontSize: 13, fontWeight: 500, color: '#ccc' },

  // Empty state
  empty: {
    padding: '2.5rem',
    textAlign: 'center' as const,
    color: '#444',
    fontSize: 13,
  },
  loading: {
    padding: '2rem',
    textAlign: 'center' as const,
    color: '#444',
    fontSize: 13,
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { user, token, logout, isLoading } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // Guard
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.replace('/auth/admin');
    }
  }, [user, isLoading, router]);

  // Load all data
  const loadData = async () => {
    if (!token) return;
    setDataLoading(true);
    try {
      const [statsRes, usersRes, portRes, watchRes] = await Promise.all([
        fetch(`${API}/admin/stats`, { headers: authHeaders }),
        fetch(`${API}/admin/users`, { headers: authHeaders }),
        fetch(`${API}/admin/portfolios`, { headers: authHeaders }),
        fetch(`${API}/admin/watchlists`, { headers: authHeaders }),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      if (portRes.ok) setPortfolios(await portRes.json());
      if (watchRes.ok) setWatchlists(await watchRes.json());
    } catch (err) {
      console.error('Admin load error:', err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadData();
  }, [token]);

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    try {
      const res = await fetch(`${API}/admin/users/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u._id !== id));
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Top watched symbols derived from watchlists
  const symbolCounts: Record<string, number> = {};
  watchlists.forEach(w => {
    w.items?.forEach(item => {
      symbolCounts[item.symbol] = (symbolCounts[item.symbol] || 0) + 1;
    });
  });
  const topSymbols = Object.entries(symbolCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxCount = topSymbols[0]?.[1] || 1;

  if (isLoading || !user) {
    return <div style={{ ...S.loading, minHeight: '100vh', background: '#0d0d0d' }}>Loading...</div>;
  }

  const navItems: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '▦' },
    { id: 'users', label: 'Users', icon: '👤' },
    { id: 'portfolios', label: 'Portfolios', icon: '💼' },
    { id: 'watchlists', label: 'Watchlists', icon: '★' },
  ];

  return (
    <div style={S.wrap}>
      {/* Sidebar */}
      <div style={S.sidebar}>
        <div style={S.logo}>
          <span style={S.logoTitle}>
            STOCKIX
            <span style={S.logoBadge}>ADMIN</span>
          </span>
        </div>

        {navItems.map(n => (
          <div key={n.id} style={S.navItem(tab === n.id)} onClick={() => setTab(n.id)}>
            <span style={{ fontSize: 15, width: 18 }}>{n.icon}</span>
            {n.label}
          </div>
        ))}

        <div style={S.sidebarFooter}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={S.avatar}>AD</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#ccc' }}>{user.email}</div>
              <div style={{ fontSize: 10, color: '#555' }}>Super Admin</div>
            </div>
          </div>
          <button style={S.logoutBtn} onClick={logout}>Log out</button>
        </div>
      </div>

      {/* Main */}
      <div style={S.main}>
        {/* Topbar */}
        <div style={S.topbar}>
          <span style={S.topbarTitle}>
            {tab === 'overview' && 'Platform overview'}
            {tab === 'users' && `Users (${users.length})`}
            {tab === 'portfolios' && `Portfolios (${portfolios.length})`}
            {tab === 'watchlists' && `Watchlists (${watchlists.length})`}
          </span>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={S.liveBadge}>● Live</span>
            <button style={S.refreshBtn} onClick={loadData}>Refresh</button>
          </div>
        </div>

        {dataLoading ? (
          <div style={S.loading}>Loading data...</div>
        ) : (
          <div style={S.content}>

            {/* ── OVERVIEW TAB ── */}
            {tab === 'overview' && (
              <>
                {/* Stat cards */}
                <div style={S.statsGrid}>
                  {[
                    { label: 'Total users', value: stats?.totalUsers ?? users.length, delta: '↑ growing', color: '#4ade80' },
                    { label: 'Active portfolios', value: stats?.totalPortfolios ?? portfolios.length, delta: '↑ with positions', color: '#4caf7d' },
                    { label: 'Watchlists', value: stats?.totalWatchlists ?? watchlists.length, delta: '↑ tracking', color: '#5B8EE6' },
                    { label: 'Total positions', value: portfolios.reduce((a, p) => a + (p.positions?.length || 0), 0), delta: 'across all users', color: '#c0392b' },
                  ].map(s => (
                    <div key={s.label} style={S.statCard}>
                      <div style={S.statLabel}>{s.label}</div>
                      <div style={S.statValue}>{s.value.toLocaleString()}</div>
                      <div style={S.statDeltaUp}>{s.delta}</div>
                      <div style={{ position: 'absolute', right: 0, top: 16, width: 3, height: 40, background: s.color, borderRadius: '2px 0 0 2px' }} />
                    </div>
                  ))}
                </div>

                {/* Recent users + right panels */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.25rem' }}>
                  <div style={S.panel}>
                    <div style={S.panelHeader}>
                      <span style={S.panelTitle}>Recent users</span>
                      <span style={S.panelCount}>{users.length} total</span>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={S.th}>Email</th>
                          <th style={S.th}>Role</th>
                          <th style={S.th}>Joined</th>
                          <th style={S.th}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.slice(0, 6).map(u => (
                          <tr key={u._id}>
                            <td style={S.td}>{u.email}</td>
                            <td style={S.td}>
                              <span style={u.role === 'admin' ? S.pillAdmin : S.pillUser}>
                                {u.role}
                              </span>
                            </td>
                            <td style={{ ...S.td, color: '#444', fontSize: 12 }}>
                              {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </td>
                            <td style={S.td}>
                              {u.role !== 'admin' && (
                                <button style={S.deleteBtn} onClick={() => handleDeleteUser(u._id)}>
                                  Delete
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={S.panel}>
                      <div style={S.panelHeader}>
                        <span style={S.panelTitle}>Platform stats</span>
                      </div>
                      {[
                        { label: 'Avg positions / portfolio', val: portfolios.length ? (portfolios.reduce((a, p) => a + (p.positions?.length || 0), 0) / portfolios.length).toFixed(1) : '0' },
                        { label: 'Avg watchlist size', val: watchlists.length ? (watchlists.reduce((a, w) => a + (w.items?.length || 0), 0) / watchlists.length).toFixed(1) : '0' },
                        { label: 'Total positions', val: portfolios.reduce((a, p) => a + (p.positions?.length || 0), 0).toLocaleString() },
                        { label: 'Total watched symbols', val: watchlists.reduce((a, w) => a + (w.items?.length || 0), 0).toLocaleString() },
                      ].map(item => (
                        <div key={item.label} style={S.miniStat}>
                          <span style={S.miniLabel}>{item.label}</span>
                          <span style={S.miniVal}>{item.val}</span>
                        </div>
                      ))}
                    </div>

                    {topSymbols.length > 0 && (
                      <div style={S.panel}>
                        <div style={S.panelHeader}>
                          <span style={S.panelTitle}>Top watched symbols</span>
                        </div>
                        {topSymbols.map(([sym, count]) => (
                          <div key={sym} style={S.barRow}>
                            <div style={S.barMeta}>
                              <span style={{ fontSize: 12, color: '#ccc' }}>{sym}</span>
                              <span style={{ fontSize: 12, color: '#555' }}>{Math.round((count / maxCount) * 100)}%</span>
                            </div>
                            <div style={S.barTrack}>
                              <div style={S.barFill(Math.round((count / maxCount) * 100))} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ── USERS TAB ── */}
            {tab === 'users' && (
              <div style={S.panel}>
                <div style={S.panelHeader}>
                  <span style={S.panelTitle}>All users</span>
                  <span style={S.panelCount}>{users.length} total</span>
                </div>
                {users.length === 0 ? (
                  <div style={S.empty}>No users found</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={S.th}>Email</th>
                        <th style={S.th}>Name</th>
                        <th style={S.th}>Role</th>
                        <th style={S.th}>Joined</th>
                        <th style={S.th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u._id}>
                          <td style={S.td}>{u.email}</td>
                          <td style={{ ...S.td, color: '#666' }}>{u.name || '—'}</td>
                          <td style={S.td}>
                            <span style={u.role === 'admin' ? S.pillAdmin : S.pillUser}>{u.role}</span>
                          </td>
                          <td style={{ ...S.td, color: '#444', fontSize: 12 }}>
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td style={S.td}>
                            {u.role !== 'admin' ? (
                              <button style={S.deleteBtn} onClick={() => handleDeleteUser(u._id)}>
                                Delete
                              </button>
                            ) : (
                              <span style={{ color: '#333', fontSize: 11 }}>Protected</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* ── PORTFOLIOS TAB ── */}
            {tab === 'portfolios' && (
              <div style={S.panel}>
                <div style={S.panelHeader}>
                  <span style={S.panelTitle}>All portfolios</span>
                  <span style={S.panelCount}>{portfolios.length} total</span>
                </div>
                {portfolios.length === 0 ? (
                  <div style={S.empty}>No portfolios yet</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={S.th}>User</th>
                        <th style={S.th}>Positions</th>
                        <th style={S.th}>Holdings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portfolios.map(p => (
                        <tr key={p._id}>
                          <td style={S.td}>{p.userId?.email || 'Unknown'}</td>
                          <td style={S.td}>{p.positions?.length || 0} positions</td>
                          <td style={S.td}>
                            <span style={{ color: '#555', fontSize: 12 }}>
                              {p.positions?.slice(0, 4).map(pos => pos.symbol).join(', ')}
                              {(p.positions?.length || 0) > 4 ? ` +${(p.positions?.length || 0) - 4} more` : ''}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* ── WATCHLISTS TAB ── */}
            {tab === 'watchlists' && (
              <div style={S.panel}>
                <div style={S.panelHeader}>
                  <span style={S.panelTitle}>All watchlists</span>
                  <span style={S.panelCount}>{watchlists.length} total</span>
                </div>
                {watchlists.length === 0 ? (
                  <div style={S.empty}>No watchlists yet</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={S.th}>User</th>
                        <th style={S.th}>Items</th>
                        <th style={S.th}>Symbols</th>
                      </tr>
                    </thead>
                    <tbody>
                      {watchlists.map(w => (
                        <tr key={w._id}>
                          <td style={S.td}>{w.userId?.email || 'Unknown'}</td>
                          <td style={S.td}>{w.items?.length || 0} symbols</td>
                          <td style={S.td}>
                            <span style={{ color: '#555', fontSize: 12 }}>
                              {w.items?.slice(0, 5).map(i => i.symbol).join(', ')}
                              {(w.items?.length || 0) > 5 ? ` +${(w.items?.length || 0) - 5} more` : ''}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
