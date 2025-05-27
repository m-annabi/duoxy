import Head from 'next/head';
import Header from '../components/Header';
import { useSession } from 'next-auth/react';

export default function HomePage() {
  const { data: session, status } = useSession();
  const loading = status === 'loading';

  return (
    <div>
      <Head>
        <title>NextAuth.js Example</title>
        <meta name="description" content="NextAuth.js example application" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main style={{ padding: '1rem' }}>
        {loading && <p>Loading session...</p>}
        
        {!loading && !session && (
          <>
            <h2>Welcome!</h2>
            <p>Please log in or sign up to continue.</p>
          </>
        )}

        {session && session.user && (
          <>
            <h2>Welcome, {session.user.name || session.user.email}!</h2>
            <p>This is your dashboard or home page content.</p>
            <p>Your session details:</p>
            <pre>{JSON.stringify(session, null, 2)}</pre>
          </>
        )}
      </main>

      <footer style={{ padding: '1rem', borderTop: '1px solid #ccc', marginTop: '2rem', textAlign: 'center' }}>
        <p>NextAuth.js Example App</p>
      </footer>
    </div>
  );
}
