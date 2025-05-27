import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import Header from '../components/Header'; // Assuming you have a Header component
import Head from 'next/head';

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

  // Redirect if not authenticated
  if (status === 'loading') {
    return (
      <>
        <Head><title>Settings</title></Head>
        <Header />
        <main style={{ padding: '1rem' }}><p>Loading...</p></main>
      </>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return ( // Return minimal content during redirect
      <>
        <Head><title>Settings</title></Head>
        <Header />
        <main style={{ padding: '1rem' }}><p>Redirecting to login...</p></main>
      </>
    );
  }

  // Handle Change Password
  const handleChangePassword = async (e) => {
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
      const res = await fetch('/api/user/change-password', {
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
        const res = await fetch('/api/user/delete-account', {
          method: 'POST', // Or 'DELETE', API supports both
        });

        const data = await res.json();
        if (res.ok) {
          setDeleteAccountMessage(data.message || 'Account deleted successfully. Redirecting...');
          // Sign out and redirect to home page
          await signOut({ callbackUrl: '/' });
        } else {
          setDeleteAccountError(data.message || 'Failed to delete account.');
        }
      } catch (error) {
        console.error('Delete account error:', error);
        setDeleteAccountError('An unexpected error occurred while deleting the account.');
      } finally {
        setIsDeletingAccount(false); // Only if not redirecting immediately
      }
    }
  };


  return (
    <>
      <Head>
        <title>Account Settings</title>
      </Head>
      <Header />
      <main className="container" style={{ maxWidth: '600px', margin: 'auto' }}> {/* Used .container */}
        <h1>Account Settings</h1>

        {/* Change Password Section */}
        <section style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #eee', borderRadius: '5px' }}>
          <h2>Change Password</h2>
          <form onSubmit={handleChangePassword}>
            <div style={{ marginBottom: '1rem' }}> {/* Increased margin for better spacing */}
              <label htmlFor="currentPassword">Current Password:</label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                // style attribute removed, global styles apply
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="newPassword">New Password:</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                // style attribute removed, global styles apply
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="confirmNewPassword">Confirm New Password:</label>
              <input
                type="password"
                id="confirmNewPassword"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                minLength={6}
                // style attribute removed, global styles apply
              />
            </div>
            <button type="submit" disabled={isPasswordChanging} className="btn-block-mobile" style={{ padding: '10px 15px' }}>
              {isPasswordChanging ? 'Changing...' : 'Change Password'}
            </button>
            {passwordChangeMessage && <p style={{ color: 'green', marginTop: '0.5rem' }}>{passwordChangeMessage}</p>}
            {passwordChangeError && <p style={{ color: 'red', marginTop: '0.5rem' }}>{passwordChangeError}</p>}
          </form>
        </section>

        {/* Delete Account Section */}
        <section style={{ padding: '1rem', border: '1px solid #eee', borderRadius: '5px', background: '#fff0f0' }}>
          <h2>Delete Account</h2>
          <p>
            This action is irreversible. All your data, including your couple profile, will be permanently deleted.
          </p>
          <button
            onClick={handleDeleteAccount}
            disabled={isDeletingAccount}
            style={{ backgroundColor: 'red', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }} // Removed padding, base button style has it
            className="btn-block-mobile" // Added class for responsive width
          >
            {isDeletingAccount ? 'Deleting...' : 'Delete My Account'}
          </button>
          {deleteAccountMessage && <p style={{ color: 'green', marginTop: '0.5rem' }}>{deleteAccountMessage}</p>}
          {deleteAccountError && <p style={{ color: 'red', marginTop: '0.5rem' }}>{deleteAccountError}</p>}
        </section>
      </main>
    </>
  );
}
