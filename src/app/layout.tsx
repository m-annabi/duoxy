import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import SessionProviderWrapper from './SessionProviderWrapper';
import Header from '../../components/Header'; // Adjusted path
import '../styles/globals.css'; // Assuming styles/globals.css is at the root

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CoupleConnect', // Default title
  description: 'Connect with other couples and find new friends.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProviderWrapper>
          <Header />
          {/* Removed <main> from here, pages should define their own main structure if needed */}
          {children}
          <footer className="homepage-footer" style={{ textAlign: 'center', padding: '1.5rem', borderTop: '1px solid #eee', marginTop: '2rem', fontSize: '0.9rem', color: '#777' }}>
            <p>&copy; {new Date().getFullYear()} CoupleConnect. All rights reserved.</p>
          </footer>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
