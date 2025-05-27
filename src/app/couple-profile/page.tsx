"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation'; // Correct import for App Router
// Assuming Header is in src/components or a similar accessible path from src/app
// If Header.js is still in root /components, path would be ../../components/Header
// For this example, let's assume it might be moved to src/components/Header.tsx later or path adjusted
// For now, using the existing path, assuming it's accessible.
// If not, this import will need adjustment when Header is also migrated/moved.
// import Header from '../../components/Header'; // Path if Header is in root /components
// For now, I will remove the Header import as it's part of RootLayout.

export default function CoupleProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name1: '',
    name2: '',
    coupleImageURL: '',
    bio: '',
    interests: '', // Comma-separated string in the form
    location: '',
  });
  const [profileExists, setProfileExists] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // For form submission
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'loading') {
      setIsLoading(true); // Keep loading true while session is loading
      return;
    }
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && session?.user) {
      setIsLoading(true); // Start loading profile data
      setError('');
      setMessage('');
      fetch('/api/couple-profile') // This will hit src/app/api/couple-profile/route.ts
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            setFormData({
              name1: data.name1 || '',
              name2: data.name2 || '',
              coupleImageURL: data.coupleImageURL || '',
              bio: data.bio || '',
              interests: Array.isArray(data.interests) ? data.interests.join(', ') : '',
              location: data.location || '',
            });
            setProfileExists(true);
          } else if (res.status === 404) {
            setProfileExists(false);
            setFormData({ name1: '', name2: '', coupleImageURL: '', bio: '', interests: '', location: '' });
          } else {
            const errorData = await res.json();
            setError(errorData.message || 'Failed to fetch profile data.');
          }
        })
        .catch((err) => {
          console.error('Error fetching profile:', err);
          setError('An unexpected error occurred while fetching profile data.');
        })
        .finally(() => setIsLoading(false));
    }
  }, [session, status, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsSubmitting(true);

    const interestsArray = formData.interests.split(',').map(interest => interest.trim()).filter(interest => interest);
    const submissionData = {
      ...formData,
      interests: interestsArray,
    };

    const method = profileExists ? 'PUT' : 'POST';

    try {
      const res = await fetch('/api/couple-profile', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(profileExists ? 'Profile updated successfully!' : 'Profile created successfully!');
        setFormData({
            name1: data.name1 || '',
            name2: data.name2 || '',
            coupleImageURL: data.coupleImageURL || '',
            bio: data.bio || '',
            interests: Array.isArray(data.interests) ? data.interests.join(', ') : '',
            location: data.location || '',
        });
        setProfileExists(true);
      } else {
        setError(data.message || `Failed to ${profileExists ? 'update' : 'create'} profile.`);
      }
    } catch (err) {
      console.error(`Error ${profileExists ? 'updating' : 'creating'} profile:`, err);
      setError(`An unexpected error occurred while ${profileExists ? 'updating' : 'creating'} the profile.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || status === 'loading') {
    return (
      <main className="container homepage-main"> {/* Consistent loading style */}
        <div className="loading-container">
          <p>Loading page data...</p>
        </div>
      </main>
    );
  }

  if (status === 'unauthenticated') {
    // This should be handled by the useEffect redirect, but as a fallback:
    return (
      <main className="container homepage-main">
        <div className="loading-container">
          <p>Redirecting to login...</p>
        </div>
      </main>
    );
  }

  // Only render form if authenticated and not initial loading
  if (status === 'authenticated') {
    return (
      <main className="container" style={{ maxWidth: '600px', margin: '2rem auto' }}>
        <div style={{ padding: '2rem', border: '1px solid #eee', borderRadius: '8px', backgroundColor: '#fff' }}>
          <h1 style={{ textAlign: 'center' }}> {/* Removed marginBottom */}
            {profileExists ? 'Edit Your Couple Profile' : 'Create Your Couple Profile'}
          </h1>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="name1" style={{ display: 'block', marginBottom: '0.5rem' }}>Your Name:</label>
              <input type="text" id="name1" name="name1" value={formData.name1} onChange={handleChange} required />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="name2" style={{ display: 'block', marginBottom: '0.5rem' }}>Partner's Name:</label>
              <input type="text" id="name2" name="name2" value={formData.name2} onChange={handleChange} required />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="coupleImageURL" style={{ display: 'block', marginBottom: '0.5rem' }}>Couple Image URL:</label>
              <input type="url" id="coupleImageURL" name="coupleImageURL" value={formData.coupleImageURL} onChange={handleChange} placeholder="https://example.com/image.jpg" />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="bio" style={{ display: 'block', marginBottom: '0.5rem' }}>Our Bio:</label>
              <textarea id="bio" name="bio" value={formData.bio} onChange={handleChange} rows={4}></textarea>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="interests" style={{ display: 'block', marginBottom: '0.5rem' }}>Interests (comma-separated):</label>
              <input type="text" id="interests" name="interests" value={formData.interests} onChange={handleChange} placeholder="e.g., hiking, movies, cooking" />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="location" style={{ display: 'block', marginBottom: '0.5rem' }}>Location:</label>
              <input type="text" id="location" name="location" value={formData.location} onChange={handleChange} placeholder="e.g., City, Country" />
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-block-mobile" style={{ backgroundColor: '#0070f3', color: 'white' }}>
              {isSubmitting ? 'Saving...' : (profileExists ? 'Update Profile' : 'Create Profile')}
            </button>
          </form>

          {message && <p style={{ color: 'green', marginTop: '1rem', textAlign: 'center' }}>{message}</p>}
          {error && <p style={{ color: 'red', marginTop: '1rem', textAlign: 'center' }}>{error}</p>}

          {/* Display current profile info - this part can be enhanced or kept simple */}
          {profileExists && !isSubmitting && (
            <div style={{ marginTop: '2rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
              <h3>Current Profile:</h3>
              <p><strong>Name 1:</strong> {formData.name1}</p>
              <p><strong>Name 2:</strong> {formData.name2}</p>
              {formData.coupleImageURL && <img src={formData.coupleImageURL} alt="Couple" style={{maxWidth: '200px', maxHeight: '200px', objectFit: 'cover', borderRadius: '4px', margin: '0.5rem 0'}}/>}
              <p><strong>Bio:</strong> {formData.bio || 'Not set'}</p>
              <p><strong>Location:</strong> {formData.location || 'Not set'}</p>
              <p><strong>Interests:</strong> {formData.interests || 'Not set'}</p>
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="container homepage-main">
      <div className="loading-container">
         <p>Please login to manage your profile.</p> {/* Fallback if no other condition met */}
      </div>
    </main>
  );
}
