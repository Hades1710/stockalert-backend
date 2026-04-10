'use client'

import { useState, Suspense } from 'react'
import { signup } from '../auth/actions'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function SignupForm() {
  const searchParams = useSearchParams()
  const serverError = searchParams.get('error')
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {}
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    if (!validate()) {
      e.preventDefault()
    } else {
      setIsSubmitting(true)
    }
  }

  return (
    <div className="glass-panel" style={{ width: '100%', maxWidth: '400px' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Create Account</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Join the StockAlert community</p>
      </div>
      
      <form action={signup} onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Email Address</label>
          <input 
            className="input-premium" 
            id="email" 
            name="email" 
            type="email" 
            placeholder="e.g. trader@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (errors.email) setErrors(prev => ({ ...prev, email: undefined }))
            }}
            required 
          />
          {errors.email && (
            <span style={{ color: 'var(--accent-danger)', fontSize: '12px', fontWeight: 500 }}>{errors.email}</span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Password</label>
          <input 
            className="input-premium" 
            id="password" 
            name="password" 
            type="password" 
            placeholder="Min 8 characters"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (errors.password) setErrors(prev => ({ ...prev, password: undefined }))
            }}
            required 
          />
          {errors.password && (
            <span style={{ color: 'var(--accent-danger)', fontSize: '12px', fontWeight: 500 }}>{errors.password}</span>
          )}
        </div>
        
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="btn-primary" 
          style={{ width: '100%', marginTop: '0.5rem', opacity: isSubmitting ? 0.7 : 1 }}
        >
          {isSubmitting ? 'Creating Account...' : 'Sign Up'}
        </button>
        
        {(serverError || (errors.email || errors.password)) && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '12px', 
            borderRadius: 'var(--radius-sm)', 
            background: 'rgba(239, 68, 68, 0.08)', 
            border: '1px solid rgba(239, 68, 68, 0.2)',
            textAlign: 'center'
          }}>
            <p style={{ color: 'var(--accent-danger)', fontSize: '14px', margin: 0, fontWeight: 500 }}>
              {serverError || 'Please correct the errors above.'}
            </p>
          </div>
        )}
      </form>
      
      <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '14px' }}>
        <span style={{ color: 'var(--text-muted)' }}>Already have an account? </span>
        <Link href="/login" style={{ 
          color: 'var(--accent-primary)', 
          textDecoration: 'none', 
          fontWeight: 600,
          transition: 'opacity 0.2s'
        }} onMouseEnter={e => e.currentTarget.style.opacity = '0.8'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
          Sign In
        </Link>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100%' }}>
      <Suspense fallback={
        <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', textAlign: 'center', padding: '3rem' }}>
          <div className="skeleton" style={{ height: '32px', width: '60%', margin: '0 auto 1.5rem auto' }} />
          <div className="skeleton" style={{ height: '16px', width: '80%', margin: '0 auto 2.5rem auto' }} />
          <div className="skeleton" style={{ height: '45px', width: '100%', marginBottom: '1.25rem' }} />
          <div className="skeleton" style={{ height: '45px', width: '100%' }} />
        </div>
      }>
        <SignupForm />
      </Suspense>
    </div>
  )
}
