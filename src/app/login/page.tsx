"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation"; // Correct import for App Router
import { useEffect, useState } from "react";
import Link from "next/link"; // For the "Sign Up" link

// Metadata for the page (optional but good practice)
// Note: For static metadata, it's usually exported from the component.
// However, since this is a client component, if metadata needs to be dynamic,
// other approaches might be needed or it's handled by parent layouts/global settings.
// For this task, we'll focus on the component logic. A simple static title could be added to layout.tsx if needed
// or we can add a simple Head tag usage here if allowed for client components in app router (less common).
// For now, assuming title will be handled by RootLayout or a future step if specific title is needed.

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // For form submission state

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/"); // Redirect to homepage if already authenticated
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        redirect: false, // Handle redirect manually based on result
        email,
        password,
      });

      if (result?.error) {
        setError(result.error);
        setIsSubmitting(false);
      } else if (result?.ok) {
        // Successful sign-in
        router.push('/'); // Redirect to homepage or dashboard
        // router.refresh(); // Optionally refresh server components or layout data
      } else {
        // Should not happen if error is not set and ok is not true, but as a fallback
        setError('Login failed. Please try again.');
        setIsSubmitting(false);
      }
    } catch (err) {
      // This catch block might be for network errors or unexpected issues with signIn itself
      console.error("Login submission error:", err);
      setError('An unexpected error occurred during login.');
      setIsSubmitting(false);
    }
  };

  if (status === "loading" || status === "authenticated") {
    // Show loading indicator while checking session or if already authenticated (before redirect)
    return (
      <main className="container homepage-main"> {/* Using homepage-main for similar centering */}
        <div className="loading-container">
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  // If not loading and not authenticated, show the login form
  return (
    <main className="container" style={{ maxWidth: '500px', margin: '2rem auto' }}> {/* Centered form container */}
      <div style={{ padding: '2rem', border: '1px solid #eee', borderRadius: '8px', backgroundColor: '#fff' }}>
        <h1 style={{ textAlign: 'center' }}>Login</h1> {/* Removed marginBottom */}
        <form onSubmit={handleSubmit}>
          {error && <p style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}
          
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              // Global styles from styles/globals.css for inputs will apply
            />
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              // Global styles from styles/globals.css for inputs will apply
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isSubmitting} 
            className="btn-block-mobile" // Uses global responsive button style
            style={{ backgroundColor: '#0070f3', color: 'white' }} // Specific button color
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          Don't have an account?{' '}
          <Link href="/signup" style={{ color: '#0070f3', textDecoration: 'underline' }}>
            Sign Up
          </Link>
        </p>
      </div>
    </main>
  );
}
