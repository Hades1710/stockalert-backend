import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', padding: '4rem 2rem' }}>
      <div className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem' }}>
        <Link href="/" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '14px', display: 'block', marginBottom: '2rem' }}>
          ← Back to App
        </Link>
        
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', fontWeight: 800 }}>Privacy Policy</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Last Updated: April 10, 2026</p>

        <section style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>1. Information We Collect</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              We collect your email address for authentication and subscription management. We also store your Telegram ID to deliver stock alerts as requested.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>2. How We Use Data</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Your data is used solely to provide the stock tracking service, manage your subscription tier, and communicate important service updates. We do not sell your personal data to third parties.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>3. Third-Party Services</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              We use <strong>Supabase</strong> for authentication and database management, and <strong>Dodo Payments</strong> for payment processing. These services have their own privacy policies governing your data.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>4. Security</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              We implement industry-standard security measures to protect your information. However, no method of transmission over the internet is 100% secure.
            </p>
          </div>

          <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
              Privacy concerns? Reach out at <strong style={{ color: 'var(--accent-primary)' }}>chinmaya.sangmesh@gmail.com</strong>
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
