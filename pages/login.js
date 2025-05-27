import LoginForm from '../components/LoginForm';
import Header from '../components/Header'; // Optional: if you want the header on the login page
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const loading = status === 'loading';

  useEffect(() => {
    if (!loading && session) {
      // If the user is already logged in, redirect them from the login page
      router.push('/');
    }
  }, [session, loading, router]);

  if (loading) {
    return <p>Loading...</p>;
  }

  // If not loading and not logged in, show the login form
  if (!session) {
    return (
      <>
        <Header /> {/* Or a simplified header for login/signup pages */}
        <main style={{ padding: '1rem' }}>
          <LoginForm />
        </main>
      </>
    );
  }

  // If already logged in (this should ideally not be reached due to the redirect)
  return (
    <>
      <Header />
      <main style={{ padding: '1rem' }}>
        <p>You are already logged in.</p>
      </main>
    </>
  );
}
