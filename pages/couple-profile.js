import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Header from '../components/Header'; // Assuming you have a Header component

export default function CoupleProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name1: '',
    name2: '',
    coupleImageURL: '',
    bio: '',
    interests: '', // Will be a comma-separated string in the form
    location: '',
  });
  const [profileExists, setProfileExists] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // For page-level loading state
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Effect to fetch profile data when component mounts or session changes
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      setIsLoading(true);
      setError('');
      setMessage('');
      fetch('/api/couple-profile')
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
            // Reset form if no profile exists for a new creation
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
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
    // For status 'loading', we'll show a global loading message
  }, [session, status, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true); // For submission loading

    // Prepare data for API (convert interests string to array)
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
        setFormData({ // Update form with potentially new/formatted data from server
            name1: data.name1 || '',
            name2: data.name2 || '',
            coupleImageURL: data.coupleImageURL || '',
            bio: data.bio || '',
            interests: Array.isArray(data.interests) ? data.interests.join(', ') : '',
            location: data.location || '',
        });
        setProfileExists(true); // Profile now exists
      } else {
        setError(data.message || `Failed to ${profileExists ? 'update' : 'create'} profile.`);
      }
    } catch (err) {
      console.error(`Error ${profileExists ? 'updating' : 'creating'} profile:`, err);
      setError(`An unexpected error occurred while ${profileExists ? 'updating' : 'creating'} the profile.`);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || (isLoading && status === 'authenticated')) {
    return (
      <>
        <Header />
        <main style={{ padding: '1rem' }}><p>Loading page data...</p></main>
      </>
    );
  }

  if (status === 'unauthenticated') {
    // This should be handled by the useEffect redirect, but as a fallback:
    return (
      <>
        <Header />
        <main style={{ padding: '1rem' }}><p>Redirecting to login...</p></main>
      </>
    );
  }

  // Only render form if authenticated
  if (status === 'authenticated') {
    return (
      <>
        <Header />
        <main className="container" style={{ maxWidth: '600px', margin: 'auto' }}> {/* Used .container and kept specific maxWidth */}
          <h2>{profileExists ? 'Edit Your Couple Profile' : 'Create Your Couple Profile'}</h2>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}> {/* Added margin for spacing */}
              <label htmlFor="name1">Your Name:</label>
              <input type="text" id="name1" name="name1" value={formData.name1} onChange={handleChange} required />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="name2">Partner's Name:</label>
              <input type="text" id="name2" name="name2" value={formData.name2} onChange={handleChange} required />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="coupleImageURL">Couple Image URL:</label>
              <input type="url" id="coupleImageURL" name="coupleImageURL" value={formData.coupleImageURL} onChange={handleChange} placeholder="https://example.com/image.jpg" />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="bio">Our Bio:</label>
              <textarea id="bio" name="bio" value={formData.bio} onChange={handleChange} rows="4"></textarea>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="interests">Interests (comma-separated):</label>
              <input type="text" id="interests" name="interests" value={formData.interests} onChange={handleChange} placeholder="e.g., hiking, movies, cooking" />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="location">Location:</label>
              <input type="text" id="location" name="location" value={formData.location} onChange={handleChange} placeholder="e.g., City, Country" />
            </div>
            <button type="submit" disabled={isLoading} className="btn-block-mobile">
              {isLoading ? 'Saving...' : (profileExists ? 'Update Profile' : 'Create Profile')}
            </button>
          </form>

          {message && <p style={{ color: 'green', marginTop: '1rem' }}>{message}</p>}
          {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}

          <hr style={{ margin: '2rem 0' }} />

          <h3>Current Profile Information:</h3>
          {profileExists && !isLoading ? (
            <div>
              <p><strong>Name 1:</strong> {formData.name1}</p>
              <p><strong>Name 2:</strong> {formData.name2}</p>
              <p><strong>Image URL:</strong> {formData.coupleImageURL || 'Not set'}</p>
              {formData.coupleImageURL && <img src={formData.coupleImageURL} alt="Couple" style={{maxWidth: '200px', maxHeight: '200px', objectFit: 'cover'}}/>}
              <p><strong>Bio:</strong> {formData.bio || 'Not set'}</p>
              <p><strong>Location:</strong> {formData.location || 'Not set'}</p>
              <p><strong>Interests:</strong></p>
              {formData.interests ? (
                <ul>
                  {formData.interests.split(',').map(interest => interest.trim()).filter(i => i).map((interest, index) => (
                    <li key={index}>{interest}</li>
                  ))}
                </ul>
              ) : <p>No interests listed.</p>}
            </div>
          ) : (
            <p>{isLoading ? 'Loading profile...' : 'No profile created yet. Fill out the form above!'}</p>
          )}
        </main>
      </>
    );
  }

  // Fallback for any other state, though ideally handled above.
  return <p>Something went wrong.</p>;
}
