'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

// ─── Step indicators ────────────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '2rem' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === current ? '28px' : '10px',
            height: '10px',
            borderRadius: '999px',
            background: i === current
              ? 'var(--accent-primary)'
              : i < current
              ? 'var(--accent-success)'
              : 'var(--border-light)',
            transition: 'all 0.3s ease',
          }}
        />
      ))}
    </div>
  )
}

// ─── Step 1: Telegram Connect (code-based) ───────────────────────────
function StepTelegram({ token, onComplete }: { token: string; onComplete: () => void }) {
  const [code, setCode] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [status, setStatus] = useState<'waiting' | 'verified'>('waiting')
  const BOT_NAME = 'StockAlertNotifBot' // update with your actual bot username

  const generateCode = async () => {
    setGenerating(true)
    try {
      const res = await fetch(`${BACKEND_URL}/notifications/telegram/generate-code`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setCode(data.code)
    } finally { setGenerating(false) }
  }

  // Poll verify-status every 2 seconds once a code has been shown
  useEffect(() => {
    if (!code || status === 'verified') return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/notifications/telegram/verify-status`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.verified) {
          setStatus('verified')
          clearInterval(interval)
          setTimeout(onComplete, 1500)
        }
      } catch {}
    }, 2000)
    return () => clearInterval(interval)
  }, [code, status, token, onComplete])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📱</div>
        <h2 style={{ marginBottom: '0.5rem' }}>Connect Telegram</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
          Receive stock alerts directly in Telegram.
        </p>
      </div>

      {!code ? (
        <button className="btn-primary" onClick={generateCode} disabled={generating} style={{ width: '100%' }}>
          {generating ? 'Generating...' : 'Generate Verification Code'}
        </button>
      ) : status === 'verified' ? (
        <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(16,185,129,0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
          <p style={{ color: 'var(--accent-success)', fontWeight: 600 }}>Telegram connected!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Code display */}
          <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(99,102,241,0.08)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glow)' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Your verification code</p>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, letterSpacing: '0.3em', fontFamily: 'monospace', color: 'var(--accent-primary)' }}>
              {code}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '0.75rem' }}>Expires in 10 minutes</p>
          </div>

          {/* Instructions */}
          <ol style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '14px', color: 'var(--text-secondary)' }}>
            <li>Open Telegram and search <strong style={{ color: 'var(--text-primary)' }}>@{BOT_NAME}</strong></li>
            <li>Send <strong style={{ color: 'var(--text-primary)' }}>/start</strong> to the bot</li>
            <li>Send the code: <strong style={{ color: 'var(--accent-primary)', letterSpacing: '0.15em' }}>{code}</strong></li>
          </ol>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '13px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)', animation: 'pulse 1.5s infinite', display: 'inline-block' }} />
            Waiting for verification...
          </div>

          <button onClick={generateCode} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline', textAlign: 'left' }}>
            Generate new code
          </button>
        </div>
      )}

      <button
        onClick={onComplete}
        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline', textAlign: 'center' }}
      >
        Skip for now
      </button>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  )
}


// ─── Step 2: Add First Stock ─────────────────────────────────────────
function StepAddStock({ token, onComplete }: { token: string; onComplete: (symbol: string) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ symbol: string; name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  const search = useCallback(async (q: string) => {
    if (q.length < 1) { setResults([]); return }
    setLoading(true)
    try {
      const res = await fetch(`${BACKEND_URL}/market/search?q=${encodeURIComponent(q)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setResults(data.slice(0, 8))
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    const timer = setTimeout(() => search(query), 350)
    return () => clearTimeout(timer)
  }, [query, search])

  const addStock = async () => {
    if (!selected) return
    setAdding(true)
    setError('')
    try {
      const res = await fetch(`${BACKEND_URL}/watchlist/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ symbol: selected }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Failed to add stock')
      }
      onComplete(selected)
    } catch (e: any) {
      setError(e.message)
      setAdding(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📈</div>
        <h2 style={{ marginBottom: '0.5rem' }}>Add Your First Stock</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Search for any US stock to start tracking it.
        </p>
      </div>

      <div style={{ position: 'relative' }}>
        <input
          className="input-premium"
          placeholder="Search by name or ticker (e.g. Apple, TSLA)"
          value={query}
          onChange={e => { setQuery(e.target.value); setSelected(null) }}
          autoComplete="off"
        />
        {(results.length > 0 || loading) && (
          <div style={{
            position: 'absolute', top: '110%', left: 0, right: 0,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-sm)',
            zIndex: 100,
            maxHeight: '240px',
            overflowY: 'auto',
          }}>
            {loading && (
              <div style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '14px' }}>Searching...</div>
            )}
            {results.map(r => (
              <div
                key={r.symbol}
                onClick={() => { setSelected(r.symbol); setQuery(`${r.symbol} — ${r.name}`); setResults([]) }}
                style={{
                  padding: '10px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '14px',
                  borderBottom: '1px solid var(--border-light)',
                  background: selected === r.symbol ? 'rgba(99,102,241,0.1)' : 'transparent',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{r.symbol}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-sm)', padding: '10px 16px', fontSize: '14px', color: 'var(--accent-success)' }}>
          ✓ Selected: <strong>{selected}</strong>
        </div>
      )}

      {error && <p style={{ color: 'var(--accent-danger)', fontSize: '14px' }}>{error}</p>}

      <button
        className="btn-primary"
        onClick={addStock}
        disabled={!selected || adding}
        style={{ width: '100%' }}
      >
        {adding ? 'Adding...' : 'Add to Watchlist'}
      </button>
    </div>
  )
}

// ─── Step 3: Default Rules Review ────────────────────────────────────
function StepRulesReview({ symbol, token, onComplete }: { symbol: string; token: string; onComplete: () => void }) {
  const rules = [
    { label: 'Price Change Alert', desc: 'Alert when price moves ±5% in a day', icon: '💹', value: '5%' },
    { label: '52-Week High/Low', desc: 'Alert when price hits yearly extremes', icon: '📊', value: 'Enabled' },
    { label: 'Unusual Volume', desc: 'Alert when trading volume is 2× normal', icon: '🔊', value: '200%' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔔</div>
        <h2 style={{ marginBottom: '0.5rem' }}>Default Alert Rules</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          These rules have been set up for <strong style={{ color: 'var(--accent-primary)' }}>{symbol}</strong>. You can customize them anytime from the dashboard.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {rules.map(r => (
          <div key={r.label} style={{
            display: 'flex', alignItems: 'center', gap: '1rem',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-sm)',
            padding: '14px 16px',
          }}>
            <span style={{ fontSize: '1.5rem' }}>{r.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>{r.label}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>{r.desc}</div>
            </div>
            <span style={{
              background: 'rgba(99,102,241,0.15)',
              color: 'var(--accent-primary)',
              padding: '3px 10px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 600,
            }}>{r.value}</span>
          </div>
        ))}
      </div>

      <button className="btn-primary" onClick={onComplete} style={{ width: '100%', marginTop: '0.5rem' }}>
        Go to Dashboard →
      </button>
    </div>
  )
}

// ─── Main Onboard Page ───────────────────────────────────────────────
export default function OnboardPage() {
  const [step, setStep] = useState(0)
  const [token, setToken] = useState('')
  const [addedSymbol, setAddedSymbol] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push('/login')
        return
      }
      setToken(data.session.access_token)
    })
  }, [])

  const handleDone = () => router.push('/dashboard')

  return (
    <div className="animate-fade-in" style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      minHeight: '100vh', padding: '2rem',
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '480px' }}>
        <StepIndicator current={step} total={3} />

        {step === 0 && token && (
          <StepTelegram token={token} onComplete={() => setStep(1)} />
        )}
        {step === 1 && token && (
          <StepAddStock token={token} onComplete={(sym) => { setAddedSymbol(sym); setStep(2) }} />
        )}
        {step === 2 && (
          <StepRulesReview symbol={addedSymbol} token={token} onComplete={handleDone} />
        )}
      </div>
    </div>
  )
}
