"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation"; // Correct import for App Router
import { useEffect, useState } from "react";
import Link from "next/link"; // For the "Login" link

export default function SignupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // Added for password confirmation
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false); // For form submission state

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/"); // Redirect to homepage if already authenticated
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    // Client-side validation
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      setIsLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setIsLoading(false);
      return;
    }
    // Basic email validation (can be more complex)
    if (!/\S+@\S+\.\S+/.test(email)) {
        setError('Please enter a valid email address.');
        setIsLoading(false);
        return;
    }

    try {
      const res = await fetch('/api/auth/signup', { // This should point to src/app/api/auth/signup/route.ts
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) { // Check for 201 or other success statuses specifically if API returns them
        setSuccessMessage(data.message || 'Signup successful! Redirecting to login...');
        setEmail(''); // Clear form
        setPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          router.push('/login');
        }, 2000); // 2 seconds delay
      } else {
        setError(data.message || 'Signup failed. Please try again.');
      }
    } catch (err) {
      console.error('Signup fetch error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
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

  // If not loading and not authenticated, show the signup form
  return (
    <main className="container" style={{ maxWidth: '500px', margin: '2rem auto' }}> {/* Centered form container */}
      <div style={{ padding: '2rem', border: '1px solid #eee', borderRadius: '8px', backgroundColor: '#fff' }}>
        <h1 style={{ textAlign: 'center' }}>Sign Up</h1> {/* Removed marginBottom */}
        <form onSubmit={handleSubmit}>
          {error && <p style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}
          {successMessage && <p style={{ color: 'green', marginBottom: '1rem', textAlign: 'center' }}>{successMessage}</p>}
          
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '0.5rem' }}>Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading} 
            className="btn-block-mobile" // Uses global responsive button style
            style={{ backgroundColor: '#0070f3', color: 'white' }} // Specific button color
          >
            {isLoading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#0070f3', textDecoration: 'underline' }}>
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
