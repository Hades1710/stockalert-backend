'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

interface AlertLog {
  id: string
  symbol: string
  rule_type: string
  message: string
  triggered_at: string
}

const RULE_ICONS: Record<string, string> = {
  price_threshold: '💹',
  price_breakout: '🎯',
  '52w_high_low': '📊',
  // unusual_volume: '🔊',
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function groupByDate(alerts: AlertLog[]): Record<string, AlertLog[]> {
  return alerts.reduce((acc, alert) => {
    const key = formatDate(alert.triggered_at)
    if (!acc[key]) acc[key] = []
    acc[key].push(alert)
    return acc
  }, {} as Record<string, AlertLog[]>)
}

export default function AlertsPage() {
  const [token, setToken] = useState('')
  const [alerts, setAlerts] = useState<AlertLog[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.push('/login'); return }
      const tok = data.session.access_token
      setToken(tok)

      fetch(`${BACKEND}/alerts/history`, { headers: { Authorization: `Bearer ${tok}` } })
        .then(r => r.json())
        .then(d => setAlerts(Array.isArray(d) ? d : []))
        .catch(() => setAlerts([]))
        .finally(() => setLoading(false))
    })
  }, [])

  const grouped = groupByDate(alerts)
  const dateGroups = Object.keys(grouped)

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

      <div className="animate-fade-in" style={{ maxWidth: '680px', margin: '0 auto', padding: '2rem' }}>

        {/* Page title */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.75rem', margin: 0 }}>Alert History</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
            Last 30 triggered alerts across all your stocks
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ color: 'var(--text-muted)', padding: '2rem 0' }}>Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔕</div>
            <h3 style={{ marginBottom: '0.5rem' }}>No alerts yet</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Alerts will appear here when your tracked stocks trigger rules during market hours.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {dateGroups.map(dateLabel => (
              <div key={dateLabel}>
                {/* Date group header */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem'
                }}>
                  <span style={{
                    fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em',
                    textTransform: 'uppercase', color: 'var(--text-muted)',
                  }}>{dateLabel}</span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }} />
                  <span style={{
                    fontSize: '11px', color: 'var(--text-muted)',
                    background: 'rgba(255,255,255,0.05)',
                    padding: '2px 8px', borderRadius: '999px',
                  }}>
                    {grouped[dateLabel].length} alert{grouped[dateLabel].length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Alert entries */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {grouped[dateLabel].map((alert, i) => (
                    <div
                      key={alert.id}
                      className="animate-fade-in"
                      style={{
                        display: 'flex', gap: '1rem', alignItems: 'flex-start',
                        padding: '14px 16px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-sm)',
                        animationDelay: `${i * 40}ms`,
                      }}
                    >
                      {/* Icon */}
                      <div style={{
                        width: '36px', height: '36px', flexShrink: 0,
                        background: 'rgba(99,102,241,0.1)',
                        border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '16px',
                      }}>
                        {RULE_ICONS[alert.rule_type] || '🔔'}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          <span style={{
                            fontWeight: 700, fontSize: '14px',
                            color: 'var(--accent-primary)',
                          }}>{alert.symbol}</span>
                          <span style={{
                            fontSize: '11px', color: 'var(--text-muted)',
                            background: 'rgba(255,255,255,0.05)',
                            padding: '1px 8px', borderRadius: '999px',
                          }}>
                            {alert.rule_type.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p style={{
                          fontSize: '13px', color: 'var(--text-secondary)',
                          lineHeight: 1.5, margin: 0,
                          overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {alert.message}
                        </p>
                      </div>

                      {/* Time */}
                      <div style={{
                        fontSize: '12px', color: 'var(--text-muted)',
                        flexShrink: 0, paddingTop: '2px',
                      }}>
                        {formatTime(alert.triggered_at)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
