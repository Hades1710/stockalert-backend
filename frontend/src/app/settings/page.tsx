'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { signOut } from '../auth/actions'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

interface Profile {
  telegram_chat_id: string | null
  telegram_enabled: boolean | null
}

// ─── Section wrapper ──────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ fontSize: '15px', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-light)' }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

// ─── Row item ─────────────────────────────────────────────────────────
function SettingRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
      <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: '14px', color: muted ? 'var(--text-muted)' : 'var(--text-primary)', fontWeight: 500 }}>{value}</span>
    </div>
  )
}

export default function SettingsPage() {
  const [token, setToken] = useState('')
  const [email, setEmail] = useState('')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [chatIdInput, setChatIdInput] = useState('')
  const [linkStatus, setLinkStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [linkError, setLinkError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push('/login'); return }
      const tok = data.session.access_token
      const userId = data.session.user.id
      setToken(tok)
      setEmail(data.session.user.email || '')

      // Pull profile from Supabase directly
      const { data: profileData } = await supabase
        .from('profiles')
        .select('telegram_chat_id, telegram_enabled')
        .eq('id', userId)
        .single()

      setProfile(profileData ?? { telegram_chat_id: null, telegram_enabled: false })
    })
  }, [])

  const linkTelegram = async () => {
    if (!chatIdInput.trim()) return
    setLinkStatus('saving')
    setLinkError('')
    try {
      const res = await fetch(`${BACKEND}/notifications/telegram/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ chat_id: chatIdInput.trim() }),
      })
      if (!res.ok) throw new Error('Failed to link')
      setProfile(prev => prev ? { ...prev, telegram_chat_id: chatIdInput.trim(), telegram_enabled: true } : prev)
      setLinkStatus('success')
      setChatIdInput('')
      setTimeout(() => setLinkStatus('idle'), 3000)
    } catch {
      setLinkStatus('error')
      setLinkError('Could not link. Check your Chat ID and try again.')
    }
  }

  const disconnectTelegram = async () => {
    if (!confirm('Disconnect Telegram? You will stop receiving alerts.')) return
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData.session?.user.id
      if (!userId) return
      await supabase.from('profiles').update({ telegram_enabled: false, telegram_chat_id: null }).eq('id', userId)
      setProfile(prev => prev ? { ...prev, telegram_chat_id: null, telegram_enabled: false } : prev)
    } catch {}
  }

  const deleteAccount = async () => {
    if (deleteConfirm !== email) return
    setDeleting(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData.session?.user.id
      if (!userId) return
      // Clear user data
      await supabase.from('watchlist').delete().eq('user_id', userId)
      await supabase.from('alert_rules').delete().eq('user_id', userId)
      await supabase.from('profiles').delete().eq('id', userId)
      await supabase.auth.signOut()
      router.push('/signup')
    } catch { setDeleting(false) }
  }

  const telegramConnected = profile?.telegram_chat_id && profile?.telegram_enabled

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        padding: '1rem 2rem', borderBottom: '1px solid var(--border-light)',
        background: 'rgba(11,14,20,0.8)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', gap: '1rem',
      }}>
        <button
          onClick={() => router.push('/dashboard')}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '20px' }}
        >←</button>
        <h1 style={{ fontSize: '1.1rem', margin: 0 }}>📈 StockPing</h1>
      </header>

      <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.75rem', margin: 0 }}>Settings</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Manage your account and preferences</p>
        </div>

        {/* Account Details */}
        <Section title="Account">
          <SettingRow label="Email" value={email || '...'} />
          <SettingRow label="Plan" value="Free Tier" muted />
        </Section>

        {/* Telegram */}
        <Section title="Telegram Alerts">
          {/* Status badge */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Connection status</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: telegramConnected ? 'var(--accent-success)' : 'var(--text-muted)',
                  display: 'inline-block',
                }} />
                <span style={{ fontSize: '14px', fontWeight: 600, color: telegramConnected ? 'var(--accent-success)' : 'var(--text-muted)' }}>
                  {telegramConnected ? `Connected (ID: ${profile?.telegram_chat_id})` : 'Not connected'}
                </span>
              </div>
            </div>
            {telegramConnected && (
              <button
                onClick={disconnectTelegram}
                style={{
                  background: 'none', border: '1px solid rgba(239,68,68,0.3)',
                  color: 'var(--accent-danger)', padding: '6px 14px',
                  borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '13px',
                  transition: 'all 0.2s',
                }}
              >
                Disconnect
              </button>
            )}
          </div>

          {/* Link / Reconnect */}
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
            {!telegramConnected && (
              <div style={{ padding: '10px 14px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>🚀</span>
                <p style={{ margin: 0, fontSize: '13px', color: '#60a5fa', fontWeight: 500, lineHeight: 1.4 }}>
                  <strong>Limited time offer:</strong> The first 50 users to connect Telegram receive a FREE lifetime upgrade to the PRO tier!
                </p>
              </div>
            )}
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              {telegramConnected ? 'Update your Telegram Chat ID:' : 'Connect your Telegram to receive alerts:'}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                className="input-premium"
                placeholder="Your Telegram Chat ID"
                value={chatIdInput}
                onChange={e => { setChatIdInput(e.target.value); setLinkStatus('idle') }}
                style={{ flex: 1 }}
              />
              <button
                className="btn-primary"
                onClick={linkTelegram}
                disabled={!chatIdInput.trim() || linkStatus === 'saving'}
                style={{ whiteSpace: 'nowrap' }}
              >
                {linkStatus === 'saving' ? 'Saving...' : telegramConnected ? 'Update' : 'Connect'}
              </button>
            </div>
            {linkStatus === 'success' && (
              <p style={{ color: 'var(--accent-success)', fontSize: '13px', marginTop: '8px' }}>✅ Telegram linked successfully!</p>
            )}
            {linkStatus === 'error' && (
              <p style={{ color: 'var(--accent-danger)', fontSize: '13px', marginTop: '8px' }}>{linkError}</p>
            )}
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
              Don't know your Chat ID? Message <strong>@userinfobot</strong> on Telegram — it will reply with your ID instantly.
            </p>
          </div>
        </Section>

        {/* Email preferences (future) */}
        <Section title="Email Preferences">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.5 }}>
            <div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Email digest</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Daily summary of triggered alerts</div>
            </div>
            <span style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)',
              color: 'var(--text-muted)', padding: '3px 12px', borderRadius: '999px', fontSize: '12px',
            }}>Coming soon</span>
          </div>
        </Section>

        {/* Sign out */}
        <Section title="Session">
          <form action={signOut}>
            <button type="submit" className="btn-secondary" style={{ width: '100%' }}>
              Sign Out
            </button>
          </form>
        </Section>

        {/* Danger Zone */}
        <div className="glass-panel" style={{ border: '1px solid rgba(239,68,68,0.2)', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '15px', color: 'var(--accent-danger)', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(239,68,68,0.15)' }}>
            Danger Zone
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.6 }}>
            Permanently delete your account, watchlist, and all alert rules. This cannot be undone.
          </p>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Type your email to confirm: <strong>{email}</strong>
            </label>
            <input
              className="input-premium"
              placeholder={email}
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              style={{ borderColor: deleteConfirm === email ? 'var(--accent-danger)' : undefined }}
            />
          </div>
          <button
            onClick={deleteAccount}
            disabled={deleteConfirm !== email || deleting}
            style={{
              background: deleteConfirm === email ? 'rgba(239,68,68,0.15)' : 'transparent',
              border: '1px solid rgba(239,68,68,0.3)',
              color: 'var(--accent-danger)', padding: '10px 20px',
              borderRadius: 'var(--radius-sm)', cursor: deleteConfirm === email ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '14px',
              width: '100%', transition: 'all 0.2s', opacity: deleteConfirm === email ? 1 : 0.5,
            }}
          >
            {deleting ? 'Deleting account...' : 'Delete My Account Permanently'}
          </button>
        </div>

      </div>
    </div>
  )
}
