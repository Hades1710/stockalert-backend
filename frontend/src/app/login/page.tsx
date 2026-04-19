import { login } from '../auth/actions'
import Link from 'next/link'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams
  return (
    <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100%' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2>Welcome Back</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Sign in to StockPing</p>
        </div>
        
        <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>Email</label>
            <input className="input-premium" id="email" name="email" type="email" required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>Password</label>
            <input className="input-premium" id="password" name="password" type="password" required />
          </div>
          
          <button formAction={login} className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            Sign In
          </button>
          
          {params?.error && (
            <p style={{ color: 'var(--accent-danger)', textAlign: 'center', fontSize: '14px', marginTop: '1rem' }}>
              {params.error}
            </p>
          )}
        </form>
        
        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '14px' }}>
          <span style={{ color: 'var(--text-muted)' }}>Don't have an account? </span>
          <Link href="/signup" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 500 }}>
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  )
}
