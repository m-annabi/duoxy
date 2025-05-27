"use client"; // This must be a client component to use useSession

import { useSession } from "next-auth/react";
import Link from "next/link";

// Metadata can be exported from page.tsx for page-specific metadata
// For this subtask, we'll rely on RootLayout for the base title.
// export const metadata = {
//   title: 'CoupleConnect - Home', 
// };

export default function HomePage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <main className="container homepage-main"> {/* Added main tag here */}
        <div className="loading-container">
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return (
      <main className="container homepage-main"> {/* Added main tag here */}
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
      </main>
    );
  }

  if (status === "authenticated" && session) {
    return (
      <main className="container homepage-main"> {/* Added main tag here */}
        <div className="logged-in-view">
          <h1>Welcome back, {session.user?.name || session.user?.email}!</h1>
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
      </main>
    );
  }

  // Fallback UI or null if no other status matches
  // This part should ideally not be reached if status is one of the three.
  return (
    <main className="container homepage-main">
      <p>Something went wrong or session status is unknown.</p>
    </main>
  );
}
