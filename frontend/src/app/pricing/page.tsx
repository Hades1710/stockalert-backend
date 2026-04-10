'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export default function PricingPage() {
  const [token, setToken] = useState('')
  const [currentTier, setCurrentTier] = useState<string>('free') // default assume free until load
  const [loading, setLoading] = useState<string | null>(null) // null, 'plus', or 'pro'
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.push('/login'); return }
      const tok = data.session.access_token
      setToken(tok)
      
      // Fetch tier from /auth/me endpoint
      fetch(`${BACKEND}/auth/me`, { headers: { Authorization: `Bearer ${tok}` } })
        .then(r => r.ok ? r.json() : { tier: 'free' })
        .then(d => setCurrentTier(d.tier || 'free'))
        .catch(() => {})
    })
  }, [router])

  const handleUpgrade = async (tier: 'plus' | 'pro') => {
    if (!token) return
    setLoading(tier)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No user found")

      const res = await fetch(`${BACKEND}/payments/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tier, user_id: user.id })
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.detail || 'Failed to generate checkout link')
      }

      const backendData = await res.json()
      
      if (backendData.checkout_url) {
        // Redirect completely to Dodo Payments checkout flow
        window.location.href = backendData.checkout_url
      } else {
        throw new Error("No checkout URL returned from payment processor")
      }
    } catch (e: any) {
      setError(e.message)
      setLoading(null)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        padding: '1rem 2rem', borderBottom: '1px solid var(--border-light)',
        background: 'rgba(11,14,20,0.8)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', gap: '1rem',
      }}>
        <button
          onClick={() => router.push('/dashboard')}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '20px' }}
        >←</button>
        <h1 style={{ fontSize: '1.25rem', margin: 0 }}>📈 StockAlert</h1>
      </header>

      <div className="animate-fade-in" style={{ flex: 1, padding: '4rem 2rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '3rem', margin: '0 0 1rem 0', fontFamily: 'var(--font-heading)', background: 'linear-gradient(to right, #ffffff, #a1a1aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Choose your edge.
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 3rem auto', lineHeight: 1.6 }}>
          Whether you're tracking a few favorites or actively day-trading the entire market, we have a tier for you. Upgrade seamlessly in seconds.
        </p>

        {error && (
          <div style={{ color: 'var(--accent-danger)', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', border: '1px solid var(--accent-danger)', borderRadius: '8px', maxWidth: '600px', margin: '0 auto 2rem auto' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center', alignItems: 'stretch' }}>
          
          {/* FREE TIER */}
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)',
            borderRadius: '24px', padding: '2.5rem', width: '320px', display: 'flex', flexDirection: 'column', textAlign: 'left',
          }}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-muted)', margin: '0 0 0.5rem 0' }}>Hobbyist</h3>
            <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>$0 <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>/mo</span></div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', color: 'var(--text-secondary)', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <li>✅ 3 Active Stocks</li>
              <li>✅ 15-minute Polling</li>
              <li>✅ Telegram Notifications</li>
              <li>✅ Price Change & Breakout</li>
            </ul>
            <button disabled style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border-light)', padding: '12px', borderRadius: '8px', cursor: 'not-allowed', fontWeight: 600 }}>
              {currentTier === 'free' ? 'Current Plan' : 'Included'}
            </button>
          </div>

          {/* PLUS TIER */}
          <div style={{
            background: 'linear-gradient(180deg, rgba(99,102,241,0.05) 0%, rgba(99,102,241,0.15) 100%)', 
            border: '1px solid var(--accent-primary)',
            boxShadow: '0 0 40px rgba(99,102,241,0.2)',
            borderRadius: '24px', padding: '2.5rem', width: '320px', display: 'flex', flexDirection: 'column', textAlign: 'left', position: 'relative', transform: 'scale(1.05)'
          }}>
            <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: 'var(--accent-primary)', color: 'white', padding: '4px 16px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, letterSpacing: '1px' }}>
              MOST POPULAR
            </div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--accent-primary)', margin: '0 0 0.5rem 0' }}>Trader Plus</h3>
            <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>$9.99 <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>/mo</span></div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', color: 'var(--text-primary)', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <li>🚀 <strong>15 Active Stocks</strong></li>
              <li>⚡ <strong>5-minute Polling</strong></li>
              {/* <li>📈 <strong>Unusual Volume Alerts</strong></li> */}
              <li>📊 52-Week High/Low Alerts</li>
              <li>📰 Breaking News & Earnings</li>
              <li>🤝 Everything in Free</li>
            </ul>
            {currentTier === 'plus' ? (
              <button disabled style={{ background: 'rgba(99,102,241,0.2)', color: 'var(--accent-primary)', border: '1px solid var(--accent-primary)', padding: '14px', borderRadius: '8px', cursor: 'not-allowed', fontWeight: 700, fontSize: '1rem' }}>
                Current Plan
              </button>
            ) : currentTier === 'pro' ? (
              <button disabled style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border-light)', padding: '14px', borderRadius: '8px', cursor: 'not-allowed', fontWeight: 700, fontSize: '1rem' }}>
                Included in Pro
              </button>
            ) : (
              <button 
                onClick={() => handleUpgrade('plus')} 
                disabled={loading !== null}
                style={{ background: 'var(--accent-primary)', color: 'white', border: 'none', padding: '14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', transition: 'all 0.2s', opacity: loading ? 0.7 : 1 }}
                onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.1)')}
                onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}
              >
                {loading === 'plus' ? 'Redirecting...' : 'Upgrade to Plus'}
              </button>
            )}
          </div>

          {/* PRO TIER */}
          <div style={{
            background: 'linear-gradient(180deg, rgba(245,158,11,0.05) 0%, rgba(245,158,11,0.15) 100%)', 
            border: '1px solid rgba(245,158,11,0.5)',
            borderRadius: '24px', padding: '2.5rem', width: '320px', display: 'flex', flexDirection: 'column', textAlign: 'left',
          }}>
            <h3 style={{ fontSize: '1.25rem', color: '#fbbf24', margin: '0 0 0.5rem 0' }}>Wall Street Pro</h3>
            <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>$29.99 <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>/mo</span></div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', color: 'var(--text-primary)', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <li>♾️ <strong>Unlimited Stocks</strong></li>
              <li>🔥 <strong>1-minute Lightning Polling</strong></li>
              <li>🕵️‍♂️ <strong>Insider Trading Alerts</strong></li>
              <li>🏦 <strong>Analyst Upgrades</strong></li>
              <li>👑 Premium Support</li>
            </ul>
            {currentTier === 'pro' ? (
              <button disabled style={{ background: 'rgba(245,158,11,0.2)', color: '#fbbf24', border: '1px solid #fbbf24', padding: '14px', borderRadius: '8px', cursor: 'not-allowed', fontWeight: 800, fontSize: '1rem' }}>
                Current Plan
              </button>
            ) : (
              <button 
                onClick={() => handleUpgrade('pro')} 
                disabled={loading !== null}
                style={{ background: 'linear-gradient(90deg, #d97706, #fbbf24)', color: '#09090b', border: 'none', padding: '14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '1rem', transition: 'all 0.2s', opacity: loading ? 0.7 : 1 }}
                onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.1)')}
                onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}
              >
                {loading === 'pro' ? 'Redirecting...' : 'Upgrade to Pro'}
              </button>
            )}
          </div>

        </div>

        <div style={{ marginTop: '4rem', color: 'var(--text-muted)', fontSize: '13px' }}>
          🔒 Secure payments securely processed globally by Dodo Payments.
        </div>
      </div>
    </div>
  )
}
