'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function PromoBanner() {
  const [promoSpots, setPromoSpots] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/promo/status`)
      .then(r => r.json())
      .then(d => {
        if (d.remaining !== undefined) {
          setPromoSpots(d.remaining)
        }
      })
      .catch(console.error)
  }, [])

  // Avoid hydration mismatch and only show when spots are available
  if (!mounted || promoSpots === null || promoSpots <= 0) {
    return null
  }

  return (
    <div className="animate-fade-in" style={{
      background: 'linear-gradient(90deg, rgba(99,102,241,0.25), rgba(59,130,246,0.25))',
      borderBottom: '1px solid rgba(99,102,241,0.5)',
      color: '#e0e7ff',
      padding: '16px 20px',
      textAlign: 'center',
      fontSize: '18px',
      fontWeight: 'bold',
      position: 'relative',
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      boxShadow: '0 4px 20px rgba(99,102,241, 0.3)',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    }}>
      <span style={{ fontSize: '24px' }}>🚀</span> 
      <div>
        <span style={{ color: '#a5b4fc' }}>Launch Promo — Only {promoSpots} spots left:</span>{' '}
        <span style={{ fontWeight: 500, textTransform: 'none' }}>Sign up & connect Telegram for a FREE lifetime PRO upgrade!</span>
      </div>
      <Link href="/signup" style={{ 
        background: 'rgba(255,255,255,0.15)', 
        padding: '6px 14px', 
        borderRadius: '8px',
        color: 'white', 
        textDecoration: 'none', 
        marginLeft: '8px',
        border: '1px solid rgba(255,255,255,0.3)',
        transition: 'all 0.2s',
        textTransform: 'none',
        fontWeight: 600,
        fontSize: '16px'
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
      >
        Claim yours →
      </Link>
    </div>
  )
}
