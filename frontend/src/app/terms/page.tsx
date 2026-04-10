import Link from 'next/link'

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', padding: '4rem 2rem' }}>
      <div className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem' }}>
        <Link href="/" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '14px', display: 'block', marginBottom: '2rem' }}>
          ← Back to App
        </Link>
        
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', fontWeight: 800 }}>Terms of Service</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Last Updated: April 10, 2026</p>

        <section style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>1. Acceptance of Terms</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              By accessing and using StockAlert, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>2. Description of Service</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              StockAlert provides real-time stock alert notifications via Telegram. Our service includes price tracking, 52-week updates, and institutional data alerts across various subscription tiers.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>3. Market Data Disclaimer</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Market data is provided by third-party APIs (Finnhub). While we strive for accuracy, StockAlert does not guarantee the timeliness or correctness of the data provided. All information is for informational purposes only and does not constitute financial advice.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>4. Subscription and Billing</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Subscriptions are managed via Dodo Payments. By subscribing to a paid tier, you authorize us to charge your payment method on a recurring basis as specified during the checkout process.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>5. Limitation of Liability</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              StockAlert shall not be liable for any financial losses or damages resulting from the use of our alert service or reliance on market data.
            </p>
          </div>

          <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
              Questions about these terms? Contact us at <strong style={{ color: 'var(--accent-primary)' }}>chinmaya.sangmesh@gmail.com</strong>
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
