import Head from 'next/head';
import Header from '../components/Header';
import { useSession } from 'next-auth/react';
import Link from 'next/link'; // Import Link

export default function HomePage() {
  const { data: session, status } = useSession();
  // const loading = status === 'loading'; // status already covers this

  return (
    <> {/* Using Fragment to avoid unnecessary div */}
      <Head>
        <title>CoupleConnect - Home</title>
        <meta name="description" content="Connect with other couples and find new friends." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main className="container homepage-main"> {/* Added .container and specific class */}
        {status === 'loading' && (
          <div className="loading-container">
            <p>Loading...</p>
          </div>
        )}

        {status === 'unauthenticated' && (
          <div className="logged-out-view">
            <h1>Welcome to CoupleConnect!</h1>
            <p className="tagline">Find new couple friends and share amazing experiences together.</p>
            <div className="action-buttons">
              <Link href="/login" className="btn btn-primary">
                Login
              </Link>
              <Link href="/signup" className="btn btn-secondary">
                Sign Up
              </Link>
            </div>
          </div>
        )}

        {status === 'authenticated' && session && (
          <div className="logged-in-view">
            <h1>Welcome back, {session.user.name || session.user.email}!</h1>
            <p>What would you like to do today?</p>
            <nav className="dashboard-nav">
              <Link href="/discover" className="nav-card">
                <h3>Find New Connections</h3>
                <p>Browse profiles and discover new couples.</p>
              </Link>
              <Link href="/connections" className="nav-card">
                <h3>View Your Matches</h3>
                <p>See the couples you've connected with.</p>
              </Link>
              <Link href="/couple-profile" className="nav-card">
                <h3>Manage Our Profile</h3>
                <p>Update your couple's details and preferences.</p>
              </Link>
              <Link href="/settings" className="nav-card">
                <h3>Account Settings</h3>
                <p>Manage your account preferences.</p>
              </Link>
            </nav>
          </div>
        )}
      </main>

      <footer className="homepage-footer"> {/* Added specific class */}
        <p>&copy; {new Date().getFullYear()} CoupleConnect. All rights reserved.</p>
      </footer>
    </>
  );
}
