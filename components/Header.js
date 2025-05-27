import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function Header() {
  const { data: session, status } = useSession();
  const loading = status === 'loading';

  return (
    <header className="main-header">
      <Link href="/" className="logo-link">
        <h1 className="logo">My App</h1>
      </Link>
      <nav className="main-nav">
        {loading && <p className="nav-item">Loading...</p>}
        {!loading && !session && (
          <>
            <Link href="/login" className="nav-item nav-link">
              Login
            </Link>
            <Link href="/signup" className="nav-item nav-link">
              Sign Up
            </Link>
          </>
        )}
        {session && session.user && (
          <>
            <span className="nav-item user-email">Signed in as {session.user.email}</span>
            <button onClick={() => signOut({ callbackUrl: '/' })} className="nav-item nav-button">Logout</button>
          </>
        )}
      </nav>
    </header>
  );
}
