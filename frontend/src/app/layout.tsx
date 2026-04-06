import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'StockAlert Dashboard',
  description: 'Premium Stock Alert Tracker',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <main className="animate-fade-in">
          {children}
        </main>
      </body>
    </html>
  );
}
