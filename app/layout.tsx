import type { Metadata } from 'next';
import Navbar from '../components/Navbar';
import FloatingAIWidget from '../components/FloatingAIWidget';
import { AIComparisonProvider } from '../context/AIComparisonContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'AutoCompare AI - Osobisty Asystent Aut',
  description: 'Inteligentne porównywanie i analiza ryzyka ofert aut używanych',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body>
        <AIComparisonProvider>
          <div className="layout-wrapper">
            {/* Sidebar menu */}
            <Navbar />

            {/* Main workspace */}
            <main className="main-content">
              {children}
            </main>
          </div>

          {/* Globalny widget stanu AI w tle */}
          <FloatingAIWidget />
        </AIComparisonProvider>
      </body>
    </html>
  );
}
