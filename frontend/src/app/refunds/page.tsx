import Link from 'next/link'

export default function RefundsPage() {
  return (
    <div style={{ minHeight: '100vh', padding: '4rem 2rem' }}>
      <div className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem' }}>
        <Link href="/" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '14px', display: 'block', marginBottom: '2rem' }}>
          ← Back to App
        </Link>
        
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', fontWeight: 800 }}>Refund & Cancellation</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Last Updated: April 10, 2026</p>

        <section style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>1. 7-Day Money-Back Guarantee</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              We offer a full refund within the first 7 days of your initial subscription if you are not satisfied with the StockAlert service. No questions asked.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>2. Subscription Cancellation</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              You can cancel your subscription at any time via your Settings page. Upon cancellation, you will continue to have access to your paid tier until the end of your current billing period.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>3. Refund Process</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              To request a refund during the 7-day guarantee period, please email us directly with your account details. Refunds are processed via our payment provider (Dodo Payments) and typically appear in your account within 5-10 business days.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>4. Modifying Subscriptions</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Upgrades take effect immediately and are prorated. Downgrades take effect at the start of your next billing cycle.
            </p>
          </div>

          <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
              Need a refund or help cancelling? Email: <strong style={{ color: 'var(--accent-primary)' }}>chinmaya.sangmesh@gmail.com</strong>
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
