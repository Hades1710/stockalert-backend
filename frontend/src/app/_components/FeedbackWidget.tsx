'use client'

import { useState } from 'react'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [type, setType] = useState('general')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    setStatus('submitting')
    
    // Attempt to grab auth token if logged in (optional for feedback)
    let token = ''
    try {
      const match = document.cookie.match(new RegExp('(^| )sb-access-token=([^;]+)'))
      if (match) token = match[2]
    } catch {}

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    try {
      const res = await fetch(`${BACKEND}/internal/feedback`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ type, message })
      })

      if (res.ok) {
        setStatus('success')
        setTimeout(() => {
          setIsOpen(false)
          setStatus('idle')
          setMessage('')
        }, 2000)
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn-primary"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          borderRadius: '999px',
          padding: '12px 24px',
          boxShadow: '0 8px 30px rgba(99,102,241,0.4)',
          display: isOpen ? 'none' : 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 600,
          fontFamily: 'var(--font-heading)'
        }}
      >
        <span>💡</span> Feedback
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '320px',
          zIndex: 10000,
          background: 'rgba(11,14,20,0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--border-light)',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ 
            padding: '16px', 
            borderBottom: '1px solid var(--border-light)', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            background: 'rgba(255,255,255,0.02)'
          }}>
            <h3 style={{ margin: 0, fontSize: '15px' }}>Send Feedback</h3>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {status === 'success' ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--accent-success)' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎉</div>
                <div style={{ fontWeight: 600 }}>Thank you!</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Your feedback helps us improve.</div>
              </div>
            ) : (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Type</label>
                  <select 
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="input-premium"
                    style={{ width: '100%', padding: '8px', fontSize: '13px' }}
                  >
                    <option value="general">General Feedback</option>
                    <option value="feature">Feature Request</option>
                    <option value="bug">Report a Bug</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Message</label>
                  <textarea 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="input-premium"
                    placeholder="Tell us what you think..."
                    rows={4}
                    style={{ width: '100%', resize: 'none', fontSize: '13px' }}
                    required
                  />
                </div>

                {status === 'error' && (
                  <div style={{ color: 'var(--accent-danger)', fontSize: '12px' }}>
                    Failed to send feedback. Please try again.
                  </div>
                )}

                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={status === 'submitting' || !message.trim()}
                  style={{ marginTop: '4px', width: '100%', justifyContent: 'center' }}
                >
                  {status === 'submitting' ? 'Sending...' : 'Send Feedback'}
                </button>
              </>
            )}
          </form>
        </div>
      )}
    </>
  )
}
