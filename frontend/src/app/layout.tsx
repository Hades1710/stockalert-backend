import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'StockPing — Never Miss a Market Move',
  description:
    'Real-time US stock alerts delivered instantly to your Telegram. Track price changes, breakouts, 52-week highs and more. Free tier available forever.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <main className="animate-fade-in" style={{ flex: 1 }}>
          {children}
        </main>
        
        {/* Global Premium Footer for Trust & Compliance */}
        <footer style={{
          padding: '4rem 2rem',
          borderTop: '1px solid var(--border-light)',
          background: 'rgba(11,14,20,0.5)',
          backdropFilter: 'blur(8px)',
          marginTop: 'auto'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', gap: '3rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 300px' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>📈 StockPing</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.6, maxWidth: '280px' }}>
                Empowering traders with real-time institutional-grade stock alerts. Track movements like a pro.
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '4rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h4 style={{ fontSize: '14px', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Platform</h4>
                <Link href="/pricing" style={{ color: 'var(--text-muted)', fontSize: '14px', textDecoration: 'none' }}>Pricing</Link>
                <Link href="/alerts" style={{ color: 'var(--text-muted)', fontSize: '14px', textDecoration: 'none' }}>Alert History</Link>
                <Link href="/dashboard" style={{ color: 'var(--text-muted)', fontSize: '14px', textDecoration: 'none' }}>Dashboard</Link>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h4 style={{ fontSize: '14px', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Legal</h4>
                <Link href="/terms" style={{ color: 'var(--text-muted)', fontSize: '14px', textDecoration: 'none' }}>Terms of Service</Link>
                <Link href="/privacy" style={{ color: 'var(--text-muted)', fontSize: '14px', textDecoration: 'none' }}>Privacy Policy</Link>
                <Link href="/refunds" style={{ color: 'var(--text-muted)', fontSize: '14px', textDecoration: 'none' }}>Refund Policy</Link>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h4 style={{ fontSize: '14px', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Support</h4>
                <a href="mailto:chinmaya.sangmesh@gmail.com" style={{ color: 'var(--accent-primary)', fontSize: '14px', textDecoration: 'none', fontWeight: 500 }}>
                  chinmaya.sangmesh@gmail.com
                </a>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0, opacity: 0.8 }}>
                  Response time: &lt; 24h
                </p>
              </div>
            </div>
          </div>
          
          <div style={{ maxWidth: '1200px', margin: '3rem auto 0 auto', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
              &copy; {new Date().getFullYear()} StockPing. All rights reserved. Built with ❤️ for intelligent traders.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
