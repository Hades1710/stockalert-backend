'use client'

import { useRouter } from 'next/navigation'

export default function AlertsGuidePage() {
  const router = useRouter()

  const alertTypes = [
    {
      id: 'price_threshold',
      title: 'Price Change Alert',
      icon: '💹',
      badge: 'Free',
      color: 'var(--text-primary)',
      desc: 'The bread and butter of StockPing. Set a daily percentage threshold, and be notified instantly if the stock moves up or down by that amount compared to its previous close.',
      example: 'Alert me if TSLA moves by 5% today.',
    },
    {
      id: 'price_breakout',
      title: 'Price Breakout',
      icon: '🎯',
      badge: 'Free',
      color: 'var(--text-primary)',
      desc: 'Perfect for technical traders. Set an exact dollar value target. You will be alerted the moment the stock crosses above or below this precise target price.',
      example: 'Alert me when NVDA crosses above $900.',
    },
    {
      id: '52w_high_low',
      title: '52-Week High / Low',
      icon: '📊',
      badge: 'Plus',
      color: 'var(--accent-primary)',
      desc: 'Track momentum and deep value. We calculate the 52-week extremes and alert you when the current price gets within your specified percentage of those bounds.',
      example: 'Alert me when AAPL is within 2% of its 52-week high.',
    },
    {
      id: 'earnings_alert',
      title: 'Upcoming Earnings',
      icon: '📅',
      badge: 'Plus',
      color: 'var(--accent-primary)',
      desc: 'Never get caught off-guard. We monitor Wall Street reporting calendars and will notify you a specified number of days before a company is scheduled to report quarterly earnings, including EPS estimates.',
      example: 'Alert me 3 days before MSFT announces earnings.',
    },
    {
      id: 'analyst_upgrade',
      title: 'Institutional Upgrades',
      icon: '📈',
      badge: 'Pro',
      color: '#fbbf24', // Gold
      desc: 'Track the smart money. We analyze daily institutional ratings (Buy/Hold/Sell consensus) from major banks. If a stock receives sudden new Buy upgrades or a large downgrade wave, you are the first to know.',
      example: 'Alert me if major Wall Street banks shift their consensus on PLTR to "Buy".',
    },
    {
      id: 'insider_buying',
      title: 'Insider Trading',
      icon: '🕵️',
      badge: 'Pro',
      color: '#fbbf24', // Gold
      desc: 'Follow the executives. If CEOs, CFOs, or board members aggressively buy net shares of their own company, it\'s often a heavily bullish sign. We aggregate SEC filings and alert you to massive insider accumulation or dumping.',
      example: 'Alert me if executives at AMC suddenly sell over 100,000 shares.',
    },
  ]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <header style={{
        padding: '1rem 2rem', borderBottom: '1px solid var(--border-light)',
        background: 'rgba(11,14,20,0.95)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', gap: '1rem',
      }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '20px' }}
        >←</button>
        <h1 style={{ fontSize: '1.25rem', margin: 0 }}>📈 StockPing</h1>
      </header>

      {/* Main Content */}
      <div className="animate-fade-in" style={{ flex: 1, padding: '3rem 2rem', maxWidth: '900px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'left', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '3rem', margin: '0 0 1rem 0', fontFamily: 'var(--font-heading)', background: 'linear-gradient(to right, #ffffff, #a1a1aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Alerts Guide
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.6, maxWidth: '700px' }}>
            We monitor the markets actively while you sleep. Review the different alert rule types below to understand what signals we look for and how you can use them to your advantage.
          </p>
        </div>

        {/* Alerts Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {alertTypes.map(type => (
            <div key={type.id} className="glass-panel" style={{ 
              display: 'flex', flexDirection: 'column', gap: '1rem',
              borderTop: `4px solid ${type.color}`,
              position: 'relative'
            }}>
              
              {/* Badge */}
              <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
                <span style={{
                  fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                  padding: '4px 10px', borderRadius: '999px',
                  background: type.badge === 'Free' ? 'rgba(255,255,255,0.05)' : type.badge === 'Plus' ? 'rgba(99,102,241,0.15)' : 'rgba(245,158,11,0.15)',
                  color: type.badge === 'Free' ? 'var(--text-muted)' : type.color,
                  border: `1px solid ${type.color}40`
                }}>
                  {type.badge}
                </span>
              </div>

              {/* Title & Icon */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '24px'
                }}>
                  {type.icon}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>{type.title}</h3>
                  <code style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{type.id}</code>
                </div>
              </div>

              {/* Description */}
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {type.desc}
              </p>

              {/* Example */}
              <div style={{
                marginTop: 'auto',
                background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px',
                borderLeft: `2px solid ${type.color}`
              }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Example Idea</div>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontStyle: 'italic' }}>"{type.example}"</div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
