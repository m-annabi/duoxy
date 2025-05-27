import SignupForm from '../components/SignupForm';
import Header from '../components/Header'; // Optional: if you want the header on the signup page
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function SignupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const loading = status === 'loading';

  useEffect(() => {
    if (!loading && session) {
      // If the user is already logged in, redirect them from the signup page
      router.push('/');
    }
  }, [session, loading, router]);

  if (loading) {
    return <p>Loading...</p>;
  }

  // If not loading and not logged in, show the signup form
  if (!session) {
    return (
      <>
        <Header /> {/* Or a simplified header for login/signup pages */}
        <main style={{ padding: '1rem' }}>
          <SignupForm />
        </main>
      </>
    );
  }

  // If already logged in (this should ideally not be reached due to the redirect)
  return (
    <>
      <Header />
      <main style={{ padding: '1rem' }}>
        <p>You are already logged in. You cannot sign up again.</p>
      </main>
    </>
  );
}
