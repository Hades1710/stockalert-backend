import { signup } from '../auth/actions'
import Link from 'next/link'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams
  return (
    <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100%' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2>Create Account</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Join StockAlert</p>
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
          
          <button formAction={signup} className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            Sign Up
          </button>
          
          {params?.error && (
            <p style={{ color: 'var(--accent-danger)', textAlign: 'center', fontSize: '14px', marginTop: '1rem' }}>
              {params.error}
            </p>
          )}
        </form>
        
        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '14px' }}>
          <span style={{ color: 'var(--text-muted)' }}>Already have an account? </span>
          <Link href="/login" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 500 }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
