"use client";

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation'; // Correct import for App Router
// Header is part of RootLayout, so no need to import here.
// import Head from 'next/head'; // Head can be used if needed for page-specific title, but usually handled in layout or page metadata export

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // State for Change Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordChangeMessage, setPasswordChangeMessage] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [isPasswordChanging, setIsPasswordChanging] = useState(false);

  // State for Delete Account
  const [deleteAccountMessage, setDeleteAccountMessage] = useState('');
  const [deleteAccountError, setDeleteAccountError] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);


  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeMessage('');
    setPasswordChangeError('');

    if (newPassword !== confirmNewPassword) {
      setPasswordChangeError("New passwords don't match.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordChangeError('New password must be at least 6 characters long.');
      return;
    }

    setIsPasswordChanging(true);
    try {
      const res = await fetch('/api/user/change-password', { // Points to new App Router endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setPasswordChangeMessage(data.message || 'Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setPasswordChangeError(data.message || 'Failed to change password.');
      }
    } catch (error) {
      console.error('Change password error:', error);
      setPasswordChangeError('An unexpected error occurred.');
    } finally {
      setIsPasswordChanging(false);
    }
  };

  // Handle Delete Account
  const handleDeleteAccount = async () => {
    setDeleteAccountMessage('');
    setDeleteAccountError('');

    if (window.confirm('Are you sure you want to delete your account? This action is irreversible.')) {
      setIsDeletingAccount(true);
      try {
        const res = await fetch('/api/user/delete-account', { // Points to new App Router endpoint
          method: 'POST', 
        });

        const data = await res.json();
        if (res.ok) {
          setDeleteAccountMessage(data.message || 'Account deleted successfully. Redirecting...');
          await signOut({ callbackUrl: '/' });
        } else {
          setDeleteAccountError(data.message || 'Failed to delete account.');
          setIsDeletingAccount(false); // Re-enable button if error
        }
      } catch (error) {
        console.error('Delete account error:', error);
        setDeleteAccountError('An unexpected error occurred while deleting the account.');
        setIsDeletingAccount(false); // Re-enable button if error
      }
      // No finally setIsDeletingAccount(false) here, because successful deletion leads to navigation
    }
  };

  if (status === 'loading') {
    return (
      <main className="container homepage-main">
        <div className="loading-container">
          <p>Loading...</p>
        </div>
      </main>
    );
  }
  
  if (status === 'unauthenticated') {
     // Should be handled by useEffect redirect, but good to have a fallback UI
    return (
      <main className="container homepage-main">
        <div className="loading-container">
          <p>Redirecting to login...</p>
        </div>
      </main>
    );
  }

  return (
    <>
      {/* <Head> <title>Account Settings</title> </Head> */} {/* Title can be set via exported metadata if needed */}
      <main className="container" style={{ maxWidth: '600px', margin: '2rem auto' }}>
          <h1 style={{ textAlign: 'center' }}>Account Settings</h1> {/* Removed marginBottom */}

        {/* Change Password Section */}
        <section style={{ marginBottom: '2rem', padding: '2rem', border: '1px solid #eee', borderRadius: '8px', backgroundColor: '#fff' }}>
          <h2 style={{ marginTop: 0, marginBottom: '1.5rem', textAlign: 'center' }}>Change Password</h2>
          <form onSubmit={handleChangePassword}>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="currentPassword" style={{ display: 'block', marginBottom: '0.5rem' }}>Current Password:</label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="newPassword" style={{ display: 'block', marginBottom: '0.5rem' }}>New Password:</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="confirmNewPassword" style={{ display: 'block', marginBottom: '0.5rem' }}>Confirm New Password:</label>
              <input
                type="password"
                id="confirmNewPassword"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <button type="submit" disabled={isPasswordChanging} className="btn-block-mobile" style={{ backgroundColor: '#0070f3', color: 'white' }}>
              {isPasswordChanging ? 'Changing...' : 'Change Password'}
            </button>
            {passwordChangeMessage && <p style={{ color: 'green', marginTop: '1rem', textAlign: 'center' }}>{passwordChangeMessage}</p>}
            {passwordChangeError && <p style={{ color: 'red', marginTop: '1rem', textAlign: 'center' }}>{passwordChangeError}</p>}
          </form>
        </section>

        {/* Delete Account Section */}
        <section style={{ padding: '2rem', border: '1px solid #eee', borderRadius: '8px', backgroundColor: '#fff0f0' }}>
          <h2 style={{ marginTop: 0, marginBottom: '1.5rem', textAlign: 'center' }}>Delete Account</h2>
          <p style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            This action is irreversible. All your data, including your couple profile, will be permanently deleted.
          </p>
          <button
            onClick={handleDeleteAccount}
            disabled={isDeletingAccount}
            className="btn-block-mobile"
            style={{ backgroundColor: 'red', color: 'white' }}
          >
            {isDeletingAccount ? 'Deleting...' : 'Delete My Account'}
          </button>
          {deleteAccountMessage && <p style={{ color: 'green', marginTop: '1rem', textAlign: 'center' }}>{deleteAccountMessage}</p>}
          {deleteAccountError && <p style={{ color: 'red', marginTop: '1rem', textAlign: 'center' }}>{deleteAccountError}</p>}
        </section>
      </main>
    </>
  );
}
