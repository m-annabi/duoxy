"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation'; // Correct import for App Router
// Header is part of RootLayout
// import Head from 'next/head'; // Metadata can be exported if needed

export default function DiscoverPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [profiles, setProfiles] = useState<any[]>([]); // Consider defining a Profile type
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [matchNotification, setMatchNotification] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      setIsLoading(true);
      setError('');
      setMatchNotification(''); // Clear notification on new fetch
      fetch('/api/discovery/profiles') // Hits new App Router endpoint
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            setProfiles(data);
          } else {
            const errorData = await res.json();
            setError(errorData.message || 'Failed to fetch profiles.');
            setProfiles([]);
          }
        })
        .catch((err) => {
          console.error('Error fetching discovery profiles:', err);
          setError('An unexpected error occurred while fetching profiles.');
          setProfiles([]);
        })
        .finally(() => {
          setIsLoading(false);
          setCurrentIndex(0);
        });
    }
  }, [status, router]);

  const currentProfile = profiles && profiles.length > 0 && currentIndex < profiles.length ? profiles[currentIndex] : null;

  const handleNextProfile = () => {
    setCurrentIndex((prevIndex) => prevIndex + 1);
    setMatchNotification(''); // Clear match notification when moving to next profile
    setError(''); // Clear error when moving to next profile
  };

  const handleInteraction = async (action: 'LIKE' | 'PASS') => {
    if (!currentProfile) {
      setError('No profile selected to interact with.');
      return;
    }
    setMatchNotification(''); // Clear previous match notification
    setError(''); // Clear previous error

    try {
      const res = await fetch('/api/discovery/interact', { // Hits new App Router endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetCoupleProfileId: currentProfile.id,
          action: action,
        }),
      });

      const responseData = await res.json();

      if (!res.ok) {
        console.error('Interaction API error:', responseData.message || 'Failed to record interaction.');
        setError(responseData.message || 'Failed to record interaction.');
      } else {
        console.log(`Interaction (${action}) recorded for profile ${currentProfile.id}`);
        if (responseData.matchMade) {
          const names = responseData.matchedCoupleNames || "the couple"; // Use names from API response
          setMatchNotification(`It's a Match with ${names}!`);
        }
      }
    } catch (err) {
      console.error('Failed to send interaction to API:', err);
      setError('An unexpected error occurred while recording interaction.');
    }
    // Advance to next profile only after processing (and potential match notification display)
    // If it's a match, user might want to see the notification before auto-advancing.
    // For this version, we advance immediately as per previous logic.
    handleNextProfile(); 
  };
  
  // Styles - can be moved to a CSS file or a style object at the top
  const styles: { [key: string]: React.CSSProperties } = { // Added type for styles object
    container: {
      padding: '1rem',
      maxWidth: '500px',
      margin: '20px auto',
      textAlign: 'center',
    },
    card: {
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      background: '#fff',
      minHeight: '400px', // Adjusted minHeight for better content fit
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    },
    profileImage: {
      width: '100%',
      height: '300px', // Adjusted height
      objectFit: 'cover',
      borderRadius: '4px',
      marginBottom: '15px',
    },
    names: { fontSize: '1.5em', fontWeight: 'bold', marginBottom: '10px' },
    bio: { fontStyle: 'italic', marginBottom: '10px', color: '#333', fontSize: '0.95rem' },
    interestsContainer: { marginBottom: '10px' },
    interestTag: { display: 'inline-block', background: '#eee', color: '#333', padding: '5px 10px', borderRadius: '15px', margin: '2px', fontSize: '0.9em' },
    location: { fontSize: '0.9em', color: '#555', marginBottom: '15px' },
    actions: { marginTop: 'auto', paddingTop: '15px' },
    passButton: { backgroundColor: '#ff4d4d', color: 'white', marginRight: '10px' }, // Added margin
    likeButton: { backgroundColor: '#4CAF50', color: 'white' },
    notification: { padding: '10px', margin: '10px 0', backgroundColor: '#d4edda', color: '#155724', borderRadius: '5px', border: '1px solid #c3e6cb' },
  };


  if (status === 'loading') {
    return (
      <main className="container homepage-main">
        <div className="loading-container"><p>Loading...</p></div>
      </main>
    );
  }
  
  if (status === 'unauthenticated') {
    return (
      <main className="container homepage-main">
        <div className="loading-container"><p>Redirecting to login...</p></div>
      </main>
    );
  }

  return (
    <>
      {/* <Head><title>Discover Profiles</title></Head> */} {/* Metadata can be exported */}
      <main style={styles.container}>
        <h1 style={{ textAlign: 'center' }}>Discover New Couples</h1> {/* Removed marginBottom, added textAlign from styles.container */}

        {isLoading && <p>Loading profiles...</p>}
        
        {matchNotification && (
          <div style={styles.notification}>
            {matchNotification}
          </div>
        )}
        {error && !matchNotification && <p style={{ color: 'red' }}>Error: {error}</p>}

        {!isLoading && !error && !currentProfile && !matchNotification && (
          <p>No more profiles to show for now. Check back later!</p>
        )}
        
        {!isLoading && currentProfile && (
          <div style={styles.card}>
            <div>
              {currentProfile.coupleImageURL ? (
                <img src={currentProfile.coupleImageURL} alt={`${currentProfile.name1} & ${currentProfile.name2}`} style={styles.profileImage} />
              ) : (
                <div style={{...styles.profileImage, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '1.2rem'}}>
                  No Image Available
                </div>
              )}
              <h2 style={styles.names}>{currentProfile.name1} &amp; {currentProfile.name2}</h2>
              {currentProfile.bio && <p style={styles.bio}>{currentProfile.bio}</p>}
              {currentProfile.location && <p style={styles.location}>Location: {currentProfile.location}</p>}
              {currentProfile.interests && currentProfile.interests.length > 0 && (
                <div style={styles.interestsContainer}>
                  <strong style={{display: 'block', marginBottom: '5px'}}>Interests:</strong>
                  <div>
                    {currentProfile.interests.map((interest: string, index: number) => (
                      <span key={index} style={styles.interestTag}>{interest}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={styles.actions}>
              <button
                onClick={() => handleInteraction('PASS')}
                style={styles.passButton}
                className="btn-block-mobile"
                disabled={!currentProfile || isLoading} // Disable while loading next profile
              >
                Pass (Nope)
              </button>
              <button
                onClick={() => handleInteraction('LIKE')}
                style={styles.likeButton}
                className="btn-block-mobile"
                disabled={!currentProfile || isLoading} // Disable while loading next profile
              >
                Like (Yep)
              </button>
            </div>
          </div>
        )}
        {!isLoading && !error && profiles.length > 0 && currentIndex >= profiles.length && !matchNotification && (
            <p>You've seen all available profiles for now!</p>
        )}
      </main>
    </>
  );
}
