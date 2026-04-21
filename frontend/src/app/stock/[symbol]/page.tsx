'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

interface Quote { symbol: string; price: number; change_pct: number; high: number; low: number; prev_close: number }
interface AlertRule { id: string; rule_type: string; threshold: number }

const RULE_META: Record<string, { label: string; icon: string; unit: string; desc: string }> = {
  price_threshold: { label: 'Price Change Alert', icon: '💹', unit: '%', desc: 'Alert when daily price moves by this %' },
  price_breakout:  { label: 'Price Breakout',     icon: '🎯', unit: '$', desc: 'Alert when price crosses specific target' },
  '52w_high_low':  { label: '52-Week High/Low',   icon: '📊', unit: '%', desc: 'Alert when price hits yearly extremes (Plus)' },
  // unusual_volume:  { label: 'Unusual Volume',      icon: '🔊', unit: '%', desc: 'Alert when volume exceeds this % of average' },
  analyst_upgrade: { label: 'Analyst Upgrades',    icon: '📈', unit: '', desc: 'Alert when a bank upgrades this stock' },
  insider_buying:  { label: 'Insider Trading',     icon: '🕵️', unit: '', desc: 'Alert when executives buy/sell shares' },
  earnings_alert:  { label: 'Earnings Upcoming',   icon: '📅', unit: 'Days', desc: 'Alert days before earnings report' },
  // breaking_news:   { label: 'Breaking News',       icon: '📰', unit: '', desc: 'Alert on major news catalysts' },
}

// ─── Inline editable threshold row ───────────────────────────────────
function RuleRow({ rule, token, onDelete }: { rule: AlertRule; token: string; onDelete: (id: string) => void }) {
  const meta = RULE_META[rule.rule_type] || { label: rule.rule_type, icon: '🔔', unit: '', desc: '' }
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(String(rule.threshold))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const save = async () => {
    const num = parseFloat(value)
    if (isNaN(num) || num <= 0) { setValue(String(rule.threshold)); setEditing(false); return }
    setSaving(true)
    try {
      await fetch(`${BACKEND}/watchlist/rules/${rule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ threshold: num }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally { setSaving(false); setEditing(false) }
  }

  const handleDelete = async () => {
    if (!confirm(`Remove "${meta.label}" rule?`)) return
    await fetch(`${BACKEND}/watchlist/rules/${rule.id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    })
    onDelete(rule.id)
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '1rem',
      padding: '16px', borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--border-light)',
      background: 'rgba(255,255,255,0.02)',
      transition: 'border-color 0.2s',
    }}>
      <span style={{ fontSize: '1.5rem' }}>{meta.icon}</span>

      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: '14px' }}>{meta.label}</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>{meta.desc}</div>
      </div>

      {/* Inline threshold editor */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {meta.unit !== '' && (
          editing ? (
            <>
              <input
                type="number"
                value={value}
                onChange={e => setValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
                autoFocus
                style={{
                  background: 'var(--bg-surface)', border: '1px solid var(--accent-primary)',
                  color: 'var(--text-primary)', borderRadius: '6px',
                  padding: '4px 8px', width: '70px', fontSize: '14px',
                }}
              />
              <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{meta.unit}</span>
              <button onClick={save} disabled={saving} className="btn-primary" style={{ padding: '4px 12px', fontSize: '12px' }}>
                {saving ? '...' : 'Save'}
              </button>
              <button onClick={() => setEditing(false)} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>✕</button>
            </>
          ) : (
            <div
              onClick={() => setEditing(true)}
              title="Click to edit"
              style={{
                background: 'rgba(99,102,241,0.12)', color: 'var(--accent-primary)',
                border: '1px solid rgba(99,102,241,0.2)', borderRadius: '999px',
                padding: '4px 14px', fontSize: '13px', fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.2s',
                outline: saved ? '2px solid var(--accent-success)' : 'none',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.22)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.12)')}
            >
              {saved ? '✓ Saved' : `${value}${meta.unit}`}
            </div>
          )
        )}
      </div>

      {/* Delete rule */}
      <button
        onClick={handleDelete}
        title="Remove rule"
        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px', padding: '4px 6px', borderRadius: '4px', transition: 'color 0.15s' }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--accent-danger)')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
      >🗑</button>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────
export default function StockDetailPage() {
  const params = useParams()
  const symbol = (params?.symbol as string)?.toUpperCase()
  const router = useRouter()
  const supabase = createClient()

  const [token, setToken] = useState('')
  const [quote, setQuote] = useState<Quote | null>(null)
  const [rules, setRules] = useState<AlertRule[]>([])
  const [removing, setRemoving] = useState(false)

  // Add Rule state
  const [showAddRule, setShowAddRule] = useState(false)
  const [newRuleType, setNewRuleType] = useState('price_threshold')
  const [newRuleThreshold, setNewRuleThreshold] = useState('5.0')
  const [addingRule, setAddingRule] = useState(false)
  const [addError, setAddError] = useState('')

  const loadRules = useCallback(async (tok: string) => {
    const res = await fetch(`${BACKEND}/watchlist/${symbol}/rules`, {
      headers: { Authorization: `Bearer ${tok}` }
    })
    setRules(await res.json())
  }, [symbol])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.push('/login'); return }
      const tok = data.session.access_token
      setToken(tok)

      fetch(`${BACKEND}/market/quote/${symbol}`, { headers: { Authorization: `Bearer ${tok}` } })
        .then(r => r.ok ? r.json() : null).then(setQuote).catch(() => {})

      loadRules(tok)
    })
  }, [symbol])

  const removeFromWatchlist = async () => {
    if (!confirm(`Remove ${symbol} from your watchlist?`)) return
    setRemoving(true)
    await fetch(`${BACKEND}/watchlist/${symbol}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    router.push('/dashboard')
  }

  const handleAddRule = async () => {
    setAddError('')
    const num = parseFloat(newRuleThreshold) || 1.0
    setAddingRule(true)
    try {
      const res = await fetch(`${BACKEND}/watchlist/${symbol}/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rule_type: newRuleType, threshold: num })
      })
      if (!res.ok) {
        const errData = await res.json()
        setAddError(errData.detail || 'Failed to add rule')
        return
      }
      await loadRules(token)
      setShowAddRule(false)
    } catch (e) {
      setAddError('Network error')
    } finally {
      setAddingRule(false)
    }
  }

  const isPositive = quote && quote.change_pct >= 0

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        padding: '1rem 2rem',
        borderBottom: '1px solid var(--border-light)',
        background: 'rgba(11,14,20,0.8)',
        backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', gap: '1rem',
      }}>
        <button
          onClick={() => router.push('/dashboard')}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '20px' }}
        >←</button>
        <h1 style={{ fontSize: '1.1rem', margin: 0 }}>📈 StockPing</h1>
      </header>

      <div className="animate-fade-in" style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem' }}>

        {/* Stock hero block */}
        <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ fontSize: '2.5rem', margin: 0, color: 'var(--accent-primary)' }}>{symbol}</h2>
              {quote ? (
                <>
                  <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.5rem' }}>
                    ${quote.price?.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 600, marginTop: '4px', color: isPositive ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                    {isPositive ? '▲' : '▼'} {Math.abs(quote.change_pct)?.toFixed(2)}% today
                  </div>
                </>
              ) : (
                <div style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Loading price...</div>
              )}
            </div>

            {quote && (
              <div style={{ textAlign: 'right', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <div>H: <strong>${quote.high?.toFixed(2)}</strong></div>
                <div>L: <strong>${quote.low?.toFixed(2)}</strong></div>
                <div>Prev: <strong>${quote.prev_close?.toFixed(2)}</strong></div>
              </div>
            )}
          </div>
        </div>

        {/* Alert Rules */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Alert Rules</h3>
            <button 
              onClick={() => router.push('/alerts-guide')}
              style={{ background: 'none', border: '1px solid var(--border-light)', color: 'var(--text-secondary)', padding: '4px 10px', borderRadius: '999px', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              📖 View Alerts Guide
            </button>
          </div>
          {rules.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '14px', padding: '1rem 0' }}>
              No rules configured for this stock.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {rules.map(rule => (
                <RuleRow
                  key={rule.id}
                  rule={rule}
                  token={token}
                  onDelete={id => setRules(prev => prev.filter(r => r.id !== id))}
                />
              ))}
            </div>
          )}
          
          <div style={{ marginTop: '1rem' }}>
            {!showAddRule ? (
              <button 
                onClick={() => setShowAddRule(true)}
                className="btn-secondary" 
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                + Add Rule
              </button>
            ) : (
              <div style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)', padding: '16px', marginTop: '8px'
              }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Create New Alert</h4>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <select 
                    value={newRuleType} 
                    onChange={e => setNewRuleType(e.target.value)}
                    style={{
                      background: 'var(--bg-surface)', border: '1px solid var(--border-light)',
                      color: 'var(--text-primary)', padding: '8px', borderRadius: '6px', fontSize: '13px'
                    }}
                  >
                    {Object.entries(RULE_META).map(([key, meta]) => (
                      <option key={key} value={key}>{meta.icon} {meta.label}</option>
                    ))}
                  </select>
                  
                  {RULE_META[newRuleType]?.unit !== '' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input 
                        type="number" 
                        value={newRuleThreshold} 
                        onChange={e => setNewRuleThreshold(e.target.value)}
                        style={{
                          background: 'var(--bg-surface)', border: '1px solid var(--border-light)',
                          color: 'var(--text-primary)', padding: '8px', width: '80px', borderRadius: '6px', fontSize: '13px'
                        }} 
                      />
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {RULE_META[newRuleType]?.unit}
                      </span>
                    </div>
                  )}
                  
                  <button onClick={handleAddRule} disabled={addingRule} className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                    {addingRule ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => setShowAddRule(false)} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                    Cancel
                  </button>
                </div>
                {addError && <div style={{ color: 'var(--accent-danger)', fontSize: '13px', marginTop: '12px', fontWeight: 600 }}>{addError}</div>}
              </div>
            )}
          </div>
          
          <p style={{ marginTop: '0.75rem', fontSize: '12px', color: 'var(--text-muted)' }}>
            💡 Click a threshold badge to edit it inline. Press Enter or Save to confirm.
          </p>
        </div>

        {/* Remove from watchlist */}
        <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
          <h3 style={{ marginBottom: '0.5rem', fontSize: '15px', color: 'var(--accent-danger)' }}>Danger Zone</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Removing {symbol} will delete all its alert rules permanently.
          </p>
          <button
            onClick={removeFromWatchlist}
            disabled={removing}
            style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              color: 'var(--accent-danger)', padding: '10px 20px',
              borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '14px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.2)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)')}
          >
            {removing ? 'Removing...' : `Remove ${symbol} from Watchlist`}
          </button>
        </div>

      </div>
    </div>
  )
}
