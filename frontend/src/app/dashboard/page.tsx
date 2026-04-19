'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { signOut } from '../auth/actions'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

interface WatchlistItem { id: string; symbol: string; user_id: string }
interface Quote { price: number; change_pct: number }
interface AlertRule { id: string; rule_type: string; threshold: number }
interface AlertLog { id: string; symbol: string; rule_type: string; message: string; triggered_at: string }

// ─── Skeleton card ────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      background: 'rgba(21,26,34,0.4)', border: '1px solid var(--border-light)',
      borderRadius: 'var(--radius-lg)', padding: '24px',
    }}>
      <div className="skeleton" style={{ height: '28px', width: '60px', marginBottom: '16px' }} />
      <div className="skeleton" style={{ height: '40px', width: '120px', marginBottom: '8px' }} />
      <div className="skeleton" style={{ height: '16px', width: '80px', marginBottom: '20px' }} />
      <div style={{ display: 'flex', gap: '6px' }}>
        <div className="skeleton" style={{ height: '20px', width: '90px', borderRadius: '999px' }} />
        <div className="skeleton" style={{ height: '20px', width: '70px', borderRadius: '999px' }} />
      </div>
    </div>
  )
}

// ─── Polling status pill ──────────────────────────────────────────────
function PollingPill({ token }: { token: string }) {
  const [label, setLabel] = useState('...')
  const [ok, setOk] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${BACKEND}/health/polling`, { headers: { Authorization: `Bearer ${token}` } })
        const data = await res.json()
        if (data.last_poll) {
          const mins = Math.round((Date.now() - new Date(data.last_poll).getTime()) / 60000)
          setLabel(mins < 2 ? 'Just now' : `${mins}m ago`)
          setOk(true)
        } else { setLabel('No data'); setOk(false) }
      } catch { setLabel('Offline'); setOk(false) }
    }
    load()
    const t = setInterval(load, 60000)
    return () => clearInterval(t)
  }, [token])

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      background: ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
      border: `1px solid ${ok ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
      borderRadius: '999px', padding: '5px 12px', fontSize: '13px',
    }}>
      <span style={{
        width: '7px', height: '7px', borderRadius: '50%',
        background: ok ? 'var(--accent-success)' : 'var(--accent-danger)',
        animation: ok ? 'pulse 2s infinite' : 'none',
      }} />
      <span style={{ color: ok ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
        {ok ? `Last checked: ${label}` : label}
      </span>
    </div>
  )
}

// ─── Stock Card (quotes passed as prop — no individual fetch) ─────────
function StockCard({
  item, quote, token, onRemove
}: { item: WatchlistItem; quote: Quote | null; token: string; onRemove: (sym: string) => void }) {
  const [rules, setRules] = useState<AlertRule[]>([])
  const router = useRouter()

  useEffect(() => {
    fetch(`${BACKEND}/watchlist/${item.symbol}/rules`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setRules).catch(() => {})
  }, [item.symbol, token])

  const isPositive = quote ? quote.change_pct >= 0 : null

  return (
    <div
      className="glass-panel animate-fade-in"
      style={{ cursor: 'pointer', position: 'relative' }}
      onClick={() => router.push(`/stock/${item.symbol}`)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--accent-primary)' }}>
          {item.symbol}
        </div>
        <button
          onClick={e => { e.stopPropagation(); onRemove(item.symbol) }}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px', padding: '2px 6px' }}
          title="Remove"
        >✕</button>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        {quote ? (
          <>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
              ${quote.price?.toFixed(2)}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px', color: isPositive ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
              {isPositive ? '▲' : '▼'} {Math.abs(quote.change_pct)?.toFixed(2)}% today
            </div>
          </>
        ) : (
          <>
            <div className="skeleton" style={{ height: '36px', width: '110px', marginBottom: '8px' }} />
            <div className="skeleton" style={{ height: '16px', width: '70px' }} />
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {rules.length > 0 ? rules.map(r => (
          <span key={r.id} style={{
            background: 'rgba(99,102,241,0.12)', color: 'var(--accent-primary)',
            border: '1px solid rgba(99,102,241,0.2)', borderRadius: '999px',
            padding: '2px 10px', fontSize: '11px', fontWeight: 600,
          }}>
            {r.rule_type.replace(/_/g, ' ')}
          </span>
        )) : (
          <div className="skeleton" style={{ height: '20px', width: '100px', borderRadius: '999px' }} />
        )}
      </div>
    </div>
  )
}

// ─── Add Stock Search ─────────────────────────────────────────────────
function AddStockBar({ token, onAdded }: { token: string; onAdded: () => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ symbol: string; name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  const search = useCallback(async (q: string) => {
    if (q.length < 1) { setResults([]); return }
    setLoading(true)
    try {
      const res = await fetch(`${BACKEND}/market/search?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setResults((await res.json()).slice(0, 6))
    } catch { setResults([]) }
    finally { setLoading(false) }
  }, [token])

  useEffect(() => {
    const t = setTimeout(() => search(query), 350)
    return () => clearTimeout(t)
  }, [query, search])

  const add = async (symbol: string) => {
    setAdding(true); setError('')
    try {
      const res = await fetch(`${BACKEND}/watchlist/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ symbol }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail) }
      setQuery(''); setResults([])
      onAdded()
    } catch (e: any) { setError(e.message) }
    finally { setAdding(false) }
  }

  return (
    <div style={{ position: 'relative', maxWidth: '400px' }}>
      <input
        className="input-premium"
        placeholder="Search and add a stock..."
        value={query}
        onChange={e => { setQuery(e.target.value); setError('') }}
        autoComplete="off"
      />
      {error && <p style={{ color: 'var(--accent-danger)', fontSize: '12px', marginTop: '4px' }}>{error}</p>}
      {(results.length > 0 || loading) && (
        <div style={{
          position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 200,
          background: 'var(--bg-surface)', border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-sm)', maxHeight: '220px', overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}>
          {loading && <div style={{ padding: '10px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>Searching...</div>}
          {results.map(r => (
            <div
              key={r.symbol}
              onClick={() => add(r.symbol)}
              style={{
                padding: '10px 16px', cursor: 'pointer', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center',
                fontSize: '13px', borderBottom: '1px solid var(--border-light)',
                opacity: adding ? 0.5 : 1, transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{r.symbol}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{r.name.slice(0, 30)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Recent Alerts ────────────────────────────────────────────────────
function RecentAlerts({ token }: { token: string }) {
  const [alerts, setAlerts] = useState<AlertLog[]>([])

  useEffect(() => {
    fetch(`${BACKEND}/alerts/history`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setAlerts(d.slice(0, 5))).catch(() => {})
  }, [token])

  return (
    <div className="glass-panel" style={{ minWidth: '280px' }}>
      <h3 style={{ marginBottom: '1rem', fontSize: '15px' }}>Recent Alerts</h3>
      {alerts.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No alerts triggered yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {alerts.map(a => (
            <div key={a.id} style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '13px' }}>{a.symbol}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {new Date(a.triggered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{a.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Dashboard Page ───────────────────────────────────────────────────
export default function DashboardPage() {
  const [token, setToken] = useState('')
  const [email, setEmail] = useState('')
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [quotes, setQuotes] = useState<Record<string, Quote>>({})
  const [loadingList, setLoadingList] = useState(true)
  const [loadingQuotes, setLoadingQuotes] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Batch fetch all quotes in ONE request
  const loadQuotes = useCallback(async (tok: string, symbols: string[]) => {
    if (symbols.length === 0) return
    setLoadingQuotes(true)
    try {
      const res = await fetch(`${BACKEND}/market/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
        body: JSON.stringify({ symbols }),
      })
      setQuotes(await res.json())
    } catch {}
    finally { setLoadingQuotes(false) }
  }, [])

  const loadWatchlist = useCallback(async (tok: string) => {
    try {
      const res = await fetch(`${BACKEND}/watchlist/`, { headers: { Authorization: `Bearer ${tok}` } })
      if (!res.ok) {
        setWatchlist([])
        return
      }
      const data = await res.json()
      const wl = Array.isArray(data) ? data : []
      setWatchlist(wl)
      // Immediately fire batch quote fetch
      if (wl.length > 0) loadQuotes(tok, wl.map((w: WatchlistItem) => w.symbol))
    } catch {
      setWatchlist([])
    }
  }, [loadQuotes])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.push('/login'); return }
      const tok = data.session.access_token
      setToken(tok)
      setEmail(data.session.user.email || '')
      loadWatchlist(tok).finally(() => setLoadingList(false))
    })
  }, [])

  const removeStock = async (symbol: string) => {
    await fetch(`${BACKEND}/watchlist/${symbol}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    setWatchlist(prev => prev.filter(w => w.symbol !== symbol))
    setQuotes(prev => { const next = { ...prev }; delete next[symbol]; return next })
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1rem 2rem', borderBottom: '1px solid var(--border-light)',
        background: 'rgba(11,14,20,0.8)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <h1 style={{ fontSize: '1.25rem', margin: 0 }}>📈 StockPing</h1>
          {token && <PollingPill token={token} />}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{email}</span>
          
          <Link href="/pricing" style={{
            background: 'var(--accent-primary)', color: 'white', fontSize: '13px', textDecoration: 'none', fontWeight: 600,
            padding: '6px 14px', borderRadius: '999px', transition: 'filter 0.2s',
          }} onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.1)')} onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}>
            ⭐ Upgrade Tier
          </Link>

          <Link href="/alerts" style={{
            color: 'var(--text-secondary)', fontSize: '13px', textDecoration: 'none', fontWeight: 500,
            padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)',
            transition: 'all 0.2s',
          }}>🔔 Alert History</Link>
          <Link href="/settings" style={{
            color: 'var(--text-secondary)', fontSize: '13px', textDecoration: 'none', fontWeight: 500,
            padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)',
            transition: 'all 0.2s',
          }}>⚙️ Settings</Link>
          <form action={signOut}>
            <button type="submit" className="btn-secondary" style={{ padding: '6px 14px', fontSize: '13px' }}>Sign Out</button>
          </form>
        </div>
      </header>

      {/* Body */}
      <div style={{ flex: 1, padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>My Watchlist</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
              {watchlist.length} stock{watchlist.length !== 1 ? 's' : ''} tracked
            </p>
          </div>
          {token && <AddStockBar token={token} onAdded={() => loadWatchlist(token)} />}
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
          {/* Watchlist grid */}
          <div style={{ flex: 1 }}>
            {loadingList ? (
              // Skeleton grid while watchlist loads
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : watchlist.length === 0 ? (
              <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                <h3 style={{ marginBottom: '0.5rem' }}>No stocks yet</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  Search for a stock above to start tracking it.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                {watchlist.map(item => (
                  <StockCard
                    key={item.id}
                    item={item}
                    quote={quotes[item.symbol] ?? null}
                    token={token}
                    onRemove={removeStock}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          {token && (
            <div style={{ width: '300px', flexShrink: 0 }}>
              <RecentAlerts token={token} />
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
