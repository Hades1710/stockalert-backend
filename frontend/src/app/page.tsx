'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import LandingNavbar from './_components/LandingNavbar'
import ScrollReveal from './_components/ScrollReveal'
import PromoBanner from './_components/PromoBanner'

// ─── Static data ────────────────────────────────────────────────────────────

const MOCK_TICKERS = [
  { symbol: 'AAPL', price: '$195.40', change: '+2.31%', up: true },
  { symbol: 'NVDA', price: '$887.20', change: '+4.08%', up: true },
  { symbol: 'TSLA', price: '$248.10', change: '-1.24%', up: false },
  { symbol: 'MSFT', price: '$415.85', change: '+0.97%', up: true },
]

const STEPS = [
  {
    num: '01',
    icon: '🔍',
    title: 'Add Stocks',
    desc: 'Search and add any US-listed stock to your personal watchlist in seconds.',
  },
  {
    num: '02',
    icon: '🎯',
    title: 'Set Your Rules',
    desc: 'Define price thresholds, breakout conditions, 52-week high/low triggers and more.',
  },
  {
    num: '03',
    icon: '📱',
    title: 'Get Notified',
    desc: "We poll the market and fire instant Telegram messages the moment your rules are met.",
  },
]

const FEATURES = [
  {
    icon: '⚡',
    title: 'Blazing-Fast Polling',
    desc: 'Free tier: 15-min · Plus: 5-min · Pro: 1-min. Alerts reach you before the crowd moves.',
    accent: 'rgba(99,102,241,0.15)',
    border: 'rgba(99,102,241,0.25)',
  },
  {
    icon: '📊',
    title: '6 Alert Rule Types',
    desc: 'Price threshold, price breakout, 52-week high/low, unusual volume, insider trading, analyst upgrades.',
    accent: 'rgba(16,185,129,0.1)',
    border: 'rgba(16,185,129,0.25)',
  },
  {
    icon: '📱',
    title: 'Telegram Delivery',
    desc: 'No app to install. Alerts land directly in your Telegram via a private secure bot.',
    accent: 'rgba(56,189,248,0.1)',
    border: 'rgba(56,189,248,0.25)',
  },
  {
    icon: '🔒',
    title: 'Secure by Design',
    desc: 'Supabase JWT auth, Row Level Security on every table. Your watchlist data is yours alone.',
    accent: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.22)',
  },
  {
    icon: '🏦',
    title: 'Institutional-Grade Data',
    desc: 'Powered by Finnhub for real-time quotes and FMP for financials, earnings, and corporate events.',
    accent: 'rgba(168,85,247,0.1)',
    border: 'rgba(168,85,247,0.25)',
  },
  {
    icon: '💸',
    title: 'Free Tier Forever',
    desc: 'Start with 3 stocks and unlimited alerts at no cost. Upgrade only when you need more firepower.',
    accent: 'rgba(99,102,241,0.08)',
    border: 'rgba(99,102,241,0.2)',
  },
]

const PRICING_TIERS = [
  {
    name: 'Hobbyist',
    price: '$0',
    color: 'var(--text-muted)',
    bg: 'rgba(255,255,255,0.02)',
    border: 'var(--border-light)',
    shadow: 'none',
    badge: null,
    features: ['3 Active Stocks', '15-minute Polling', 'Telegram Notifications', 'Price Change & Breakout'],
    cta: 'Start Free',
    href: '/signup',
    ctaStyle: {
      background: 'rgba(255,255,255,0.06)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-light)',
    },
  },
  {
    name: 'Trader Plus',
    price: '$9.99',
    color: 'var(--accent-primary)',
    bg: 'linear-gradient(180deg, rgba(99,102,241,0.06) 0%, rgba(99,102,241,0.16) 100%)',
    border: 'var(--accent-primary)',
    shadow: '0 0 40px rgba(99,102,241,0.2)',
    badge: 'MOST POPULAR',
    features: ['15 Active Stocks', '5-minute Polling', '52-Week High/Low Alerts', 'Breaking News & Earnings', 'Everything in Free'],
    cta: 'Upgrade to Plus',
    href: '/signup',
    ctaStyle: {
      background: 'var(--accent-primary)',
      color: 'white',
      border: 'none',
    },
  },
  {
    name: 'Wall Street Pro',
    price: '$29.99',
    color: '#fbbf24',
    bg: 'linear-gradient(180deg, rgba(245,158,11,0.05) 0%, rgba(245,158,11,0.15) 100%)',
    border: 'rgba(245,158,11,0.5)',
    shadow: '0 0 24px rgba(245,158,11,0.1)',
    badge: null,
    features: ['Unlimited Stocks', '1-minute Lightning Polling', 'Insider Trading Alerts', 'Analyst Upgrades', 'Premium Support', '🎁 FREE FOR FIRST 50 USERS'],
    cta: 'Go Pro',
    href: '/signup',
    ctaStyle: {
      background: 'linear-gradient(90deg, #d97706, #fbbf24)',
      color: '#09090b',
      border: 'none',
    },
  },
]

// ─── Sub-components ──────────────────────────────────────────────────────────

function MockDashboard() {
  return (
    <div style={{
      background: 'rgba(21,26,34,0.55)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '20px',
      padding: '24px',
      width: '320px',
      boxShadow: '0 24px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(99,102,241,0.1)',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '15px' }}>My Watchlist</span>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'rgba(16,185,129,0.1)',
          border: '1px solid rgba(16,185,129,0.25)',
          borderRadius: '999px', padding: '4px 10px', fontSize: '11px',
          color: 'var(--accent-success)', fontWeight: 600,
        }}>
          <span style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: 'var(--accent-success)',
            display: 'inline-block',
            animation: 'heroPulse 2s infinite',
          }} />
          Live
        </div>
      </div>

      {/* Ticker rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {MOCK_TICKERS.map(t => (
          <div key={t.symbol} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '10px', padding: '10px 14px',
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: t.up ? 'var(--accent-success)' : 'var(--accent-danger)',
                flexShrink: 0,
              }} />
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '14px', color: 'var(--accent-primary)' }}>
                {t.symbol}
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '14px' }}>{t.price}</div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: t.up ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                {t.up ? '▲' : '▼'} {t.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Alert preview */}
      <div style={{
        marginTop: '16px', padding: '12px',
        background: 'rgba(99,102,241,0.08)', borderRadius: '10px',
        border: '1px solid rgba(99,102,241,0.2)',
        fontSize: '12px', color: 'var(--text-secondary)',
      }}>
        <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>🔔 Alert fired</span>
        {' '}· NVDA crossed $880 threshold
      </div>
    </div>
  )
}

function HeroSection() {
  return (
    <section style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '100px 2rem 4rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
        maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
        pointerEvents: 'none',
      }} />

      {/* Extra ambient glows */}
      <div style={{
        position: 'absolute', top: '20%', left: '10%',
        width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '5%',
        width: '300px', height: '300px',
        background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Content */}
      <div style={{
        maxWidth: '1100px', width: '100%', margin: '0 auto',
        display: 'flex', gap: '4rem', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap',
      }}>
        {/* Left — copy */}
        <div className="animate-fade-in" style={{ flex: '1 1 480px', maxWidth: '580px' }}>
          {/* Eyebrow badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: '999px', padding: '6px 16px', marginBottom: '2rem',
            fontSize: '13px', fontWeight: 600, color: 'var(--accent-primary)',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-success)', display: 'inline-block', animation: 'heroPulse 2s infinite' }} />
            Real-time US Market Alerts
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(2.8rem, 5vw, 4.5rem)',
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: '-0.03em',
            margin: '0 0 1.5rem 0',
          }}>
            Never Miss a{' '}
            <span style={{
              background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 40%, #10b981 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Market Move.
            </span>
          </h1>

          {/* Subheadline */}
          <p style={{
            fontSize: '1.2rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.65,
            margin: '0 0 2.5rem 0',
            maxWidth: '460px',
          }}>
            Real-time US stock alerts delivered instantly to your{' '}
            <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Telegram</strong>.
            Set your rules — we do the watching while you sleep.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '2rem' }}>
            <Link href="/signup" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: 'white', textDecoration: 'none',
              fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '16px',
              padding: '14px 28px', borderRadius: '10px',
              boxShadow: '0 0 0 1px rgba(99,102,241,0.4), 0 8px 28px rgba(99,102,241,0.4)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 0 0 1px rgba(99,102,241,0.5), 0 12px 36px rgba(99,102,241,0.55)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 0 0 1px rgba(99,102,241,0.4), 0 8px 28px rgba(99,102,241,0.4)'
              }}
            >
              ▶ Start for Free
            </Link>

            <Link href="#pricing" style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'transparent',
              color: 'var(--text-secondary)', textDecoration: 'none',
              fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '15px',
              padding: '14px 24px', borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.1)',
              transition: 'color 0.2s, border-color 0.2s',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--text-primary)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--text-secondary)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
              }}
            >
              See Pricing →
            </Link>
          </div>

          {/* Social proof bar */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '1.25rem',
            fontSize: '13px', color: 'var(--text-muted)',
          }}>
            {['✅ No credit card required', '✅ Free tier forever', '✅ Live in 60 seconds'].map(t => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>

        {/* Right — mock dashboard card */}
        <div style={{
          flex: '0 0 auto',
          animation: 'heroFloat 6s ease-in-out infinite',
        }}>
          <MockDashboard />
        </div>
      </div>

      <style>{`
        @keyframes heroPulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px rgba(16,185,129,0.6); }
          50% { opacity: 0.5; box-shadow: none; }
        }
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0px) rotate(0.5deg); }
          50% { transform: translateY(-14px) rotate(-0.5deg); }
        }
      `}</style>
    </section>
  )
}

function HowItWorksSection() {
  return (
    <section style={{ padding: '6rem 2rem', position: 'relative' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <ScrollReveal style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <p style={{ color: 'var(--accent-primary)', fontWeight: 700, fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            How It Works
          </p>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
            Up and running in three steps.
          </h2>
        </ScrollReveal>

        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center', position: 'relative' }}>
          {/* Connector line (desktop) */}
          <div style={{
            position: 'absolute',
            top: '52px', left: '14%', right: '14%',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.3) 20%, rgba(99,102,241,0.3) 80%, transparent)',
            pointerEvents: 'none',
          }} />

          {STEPS.map((step, i) => (
            <ScrollReveal key={step.num} delay={i * 130} style={{ flex: '1 1 280px', maxWidth: '330px' }}>
              <div style={{
                background: 'rgba(21,26,34,0.5)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '20px',
                padding: '2rem',
                textAlign: 'center',
                transition: 'border-color 0.3s, transform 0.3s',
                cursor: 'default',
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.3)'
                  ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'
                  ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                }}
              >
                {/* Number badge */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: '48px', height: '48px', borderRadius: '14px',
                  background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
                  fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '16px',
                  color: 'var(--accent-primary)', marginBottom: '1.25rem',
                }}>
                  {step.num}
                </div>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{step.icon}</div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.2rem', marginBottom: '0.75rem' }}>
                  {step.title}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.65, margin: 0 }}>
                  {step.desc}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeaturesSection() {
  return (
    <section style={{ padding: '6rem 2rem', background: 'rgba(255,255,255,0.01)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <ScrollReveal style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <p style={{ color: 'var(--accent-primary)', fontWeight: 700, fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            Platform Features
          </p>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
            Everything you need to trade{' '}
            <span style={{ background: 'linear-gradient(135deg, #6366f1, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              smarter.
            </span>
          </h2>
        </ScrollReveal>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.25rem',
        }}>
          {FEATURES.map((f, i) => (
            <ScrollReveal key={f.title} delay={i * 80}>
              <div style={{
                background: f.accent,
                border: `1px solid ${f.border}`,
                borderRadius: '16px',
                padding: '1.75rem',
                height: '100%',
                transition: 'transform 0.25s, box-shadow 0.25s',
                cursor: 'default',
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = `0 12px 32px rgba(0,0,0,0.2)`
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{f.icon}</div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.6rem' }}>
                  {f.title}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.65, margin: 0 }}>
                  {f.desc}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function PricingSection() {
  return (
    <section id="pricing" style={{ padding: '6rem 2rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <ScrollReveal style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <p style={{ color: 'var(--accent-primary)', fontWeight: 700, fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            Pricing
          </p>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 1rem 0' }}>
            Choose your edge.
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto' }}>
            Start free, scale when you&apos;re ready. No surprises.
          </p>
        </ScrollReveal>

        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'stretch' }}>
          {PRICING_TIERS.map((tier, i) => (
            <ScrollReveal key={tier.name} delay={i * 100} style={{ flex: '1 1 280px', maxWidth: '330px' }}>
              <div style={{
                background: tier.bg,
                border: `1px solid ${tier.border}`,
                borderRadius: '24px',
                padding: '2.25rem',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                boxShadow: tier.shadow,
                transform: tier.badge ? 'scale(1.04)' : 'scale(1)',
              }}>
                {tier.badge && (
                  <div style={{
                    position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--accent-primary)', color: 'white',
                    padding: '4px 18px', borderRadius: '999px', fontSize: '11px',
                    fontWeight: 800, letterSpacing: '1px', fontFamily: 'var(--font-heading)',
                    whiteSpace: 'nowrap',
                  }}>
                    {tier.badge}
                  </div>
                )}

                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: tier.color, margin: '0 0 0.5rem 0' }}>
                  {tier.name}
                </h3>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.75rem', fontWeight: 800, marginBottom: '1.5rem' }}>
                  {tier.price} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>/mo</span>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                  {tier.features.map(f => (
                    <li key={f} style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ color: tier.color, fontWeight: 600, flexShrink: 0, marginTop: '1px' }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link href={tier.href} style={{
                  display: 'block', textAlign: 'center', textDecoration: 'none',
                  padding: '13px', borderRadius: '10px',
                  fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '15px',
                  transition: 'filter 0.2s, transform 0.2s',
                  ...tier.ctaStyle,
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.filter = 'brightness(1.1)'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.filter = 'brightness(1)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  {tier.cta}
                </Link>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal style={{ textAlign: 'center', marginTop: '2.5rem' }}>
          <Link href="/pricing" style={{
            color: 'var(--accent-primary)', fontSize: '14px', fontWeight: 600, textDecoration: 'none',
          }}
            onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
          >
            View full pricing details →
          </Link>
        </ScrollReveal>
      </div>
    </section>
  )
}

function TrustStrip() {
  const items = [
    { icon: '🛡️', text: '7-Day Money-Back Guarantee' },
    { icon: '🔒', text: 'Secured by Dodo Payments' },
    { icon: '📈', text: 'Powered by Finnhub & FMP' },
    { icon: '⚡', text: 'Sub-minute Alert Delivery' },
  ]

  return (
    <section style={{
      borderTop: '1px solid rgba(255,255,255,0.06)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(99,102,241,0.03)',
      padding: '2rem',
    }}>
      <div style={{
        maxWidth: '900px', margin: '0 auto',
        display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '1.5rem',
      }}>
        {items.map(item => (
          <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.3rem' }}>{item.icon}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>{item.text}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function FinalCTA() {
  return (
    <section style={{ padding: '7rem 2rem' }}>
      <ScrollReveal>
        <div style={{
          maxWidth: '700px', margin: '0 auto', textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(16,185,129,0.05) 100%)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: '28px',
          padding: '4rem 3rem',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Glow orb */}
          <div style={{
            position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)',
            width: '300px', height: '200px',
            background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <h2 style={{
            fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.8rem, 4vw, 2.75rem)',
            fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 1rem 0',
          }}>
            Ready to trade smarter?
          </h2>
          <p style={{
            color: 'var(--text-secondary)', fontSize: '1.1rem', margin: '0 0 2.5rem 0', lineHeight: 1.6,
          }}>
            Join traders who never miss a move. Set up in 60 seconds — no card needed.
          </p>
          <Link href="/signup" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            color: 'white', textDecoration: 'none',
            fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '17px',
            padding: '16px 36px', borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(99,102,241,0.45)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(99,102,241,0.6)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(99,102,241,0.45)'
            }}
          >
            Get Started Free — It Takes 60 Seconds
          </Link>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '1.25rem' }}>
            No credit card · Free tier forever · Cancel anytime
          </p>
        </div>
      </ScrollReveal>
    </section>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <>
      <LandingNavbar />
      <PromoBanner />

      <main>
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSection />
        <TrustStrip />
        <PricingSection />
        <FinalCTA />
      </main>
    </>
  )
}
