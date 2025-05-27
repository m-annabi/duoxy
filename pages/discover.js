import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '../components/Header'; // Assuming Header component exists

export default function DiscoverPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [matchNotification, setMatchNotification] = useState(''); // For match notification

  useEffect(() => {
    if (status === 'authenticated') {
      setIsLoading(true);
      setError('');
      fetch('/api/discovery/profiles')
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            setProfiles(data);
          } else {
            const errorData = await res.json();
            setError(errorData.message || 'Failed to fetch profiles.');
            setProfiles([]); // Clear profiles on error
          }
        })
        .catch((err) => {
          console.error('Error fetching discovery profiles:', err);
          setError('An unexpected error occurred while fetching profiles.');
          setProfiles([]);
        })
        .finally(() => {
          setIsLoading(false);
          setCurrentIndex(0); // Reset index when new profiles are fetched
        });
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]); // Re-fetch if status changes (e.g., after login)

  const handleNextProfile = () => {
    setCurrentIndex((prevIndex) => prevIndex + 1);
  };

  const handleInteraction = async (action) => {
    if (!currentProfile) {
      setError('No profile selected to interact with.');
      return;
    }
    setMatchNotification(''); // Clear previous match notification

    try {
      const res = await fetch('/api/discovery/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetCoupleProfileId: currentProfile.id,
          action: action,
        }),
      });

      const responseData = await res.json(); // Always try to parse JSON

      if (!res.ok) {
        // Display a subtle error, or log it. For now, console log.
        console.error('Interaction API error:', responseData.message || 'Failed to record interaction.');
        setError(responseData.message || 'Failed to record interaction.'); // Show error in UI
      } else {
        console.log(`Interaction (${action}) recorded for profile ${currentProfile.id}`);
        if (responseData.matchMade) {
          // Find names for notification
          const targetProfileForNotification = profiles.find(p => p.id === currentProfile.id);
          const targetNames = targetProfileForNotification ? `${targetProfileForNotification.name1} & ${targetProfileForNotification.name2}` : "the couple";
          setMatchNotification(`It's a Match with ${targetNames}!`);
          // Notification will disappear when next profile loads or on next interaction
        }
      }
    } catch (err) {
      console.error('Failed to send interaction to API:', err);
      setError('An unexpected error occurred while recording interaction.'); // Show error in UI
      // Optionally set an error state: setError('An unexpected error occurred while recording interaction.');
    }

    // Move to the next profile regardless of interaction success for now
    // In a real app, you might want to handle API errors more gracefully,
    // e.g., retry, or not advance if the interaction failed critically.
    handleNextProfile();
  };

  // Styles - can be moved to a CSS file
  const styles = {
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
      minHeight: '300px', // Ensure card has some height
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    },
    profileImage: {
      width: '100%',
      maxHeight: '300px',
      objectFit: 'cover',
      borderRadius: '4px',
      marginBottom: '15px',
    },
    names: {
      fontSize: '1.5em',
      fontWeight: 'bold',
      marginBottom: '10px',
    },
    bio: {
      fontStyle: 'italic',
      marginBottom: '10px',
    },
    interestsContainer: {
      marginBottom: '10px',
    },
    interestTag: {
      display: 'inline-block',
      background: '#eee',
      color: '#333',
      padding: '5px 10px',
      borderRadius: '15px',
      margin: '2px',
      fontSize: '0.9em',
    },
    location: {
      fontSize: '0.9em',
      color: '#555',
      marginBottom: '15px',
    },
    actions: {
      marginTop: 'auto', // Push actions to the bottom of the card
      paddingTop: '15px', // Add some space above the buttons
    },
    // Button styles are now primarily from globals.css
    // Specific button styling (colors) can remain or be moved to classes
    passButton: {
      backgroundColor: '#ff4d4d', // Reddish
      color: 'white',
    },
    likeButton: {
      backgroundColor: '#4CAF50', // Greenish
      color: 'white',
    },
  };

  if (status === 'loading') {
    return (
      <>
        <Head><title>Discover Profiles</title></Head>
        <Header />
        <main style={styles.container}><p>Loading...</p></main>
      </>
    );
  }

  if (status === 'unauthenticated') {
    return ( // Minimal content during redirect
      <>
        <Head><title>Discover Profiles</title></Head>
        <Header />
        <main style={styles.container}><p>Redirecting to login...</p></main>
      </>
    );
  }

  const currentProfile = profiles && profiles.length > 0 && currentIndex < profiles.length ? profiles[currentIndex] : null;

  return (
    <>
      <Head>
        <title>Discover Profiles</title>
      </Head>
      <Header />
      <main style={styles.container}>
        <h1>Discover New Couples</h1>

        {isLoading && <p>Loading profiles...</p>}
        
        {/* Display Match Notification */}
        {matchNotification && (
          <div style={{ padding: '10px', margin: '10px 0', backgroundColor: '#d4edda', color: '#155724', borderRadius: '5px', border: '1px solid #c3e6cb' }}>
            {matchNotification}
          </div>
        )}
        {/* Display General Error */}
        {error && !matchNotification && <p style={{ color: 'red' }}>Error: {error}</p>}


        {!isLoading && !error && !currentProfile && !matchNotification && (
          <p>No more profiles to show for now. Check back later!</p>
        )}
        
        {/* Only show profile card if there's a current profile and no match notification taking precedence */}
        {!isLoading && currentProfile && (
          <div style={styles.card}>
            <div> {/* Content part of the card */}
              {currentProfile.coupleImageURL ? (
                <img src={currentProfile.coupleImageURL} alt={`${currentProfile.name1} & ${currentProfile.name2}`} style={styles.profileImage} />
              ) : (
                <div style={{...styles.profileImage, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa'}}>
                  No Image
                </div>
              )}
              <h2 style={styles.names}>{currentProfile.name1} &amp; {currentProfile.name2}</h2>
              {currentProfile.bio && <p style={styles.bio}>{currentProfile.bio}</p>}
              {currentProfile.location && <p style={styles.location}>Location: {currentProfile.location}</p>}
              {currentProfile.interests && currentProfile.interests.length > 0 && (
                <div style={styles.interestsContainer}>
                  <strong>Interests:</strong>
                  <div>
                    {currentProfile.interests.map((interest, index) => (
                      <span key={index} style={styles.interestTag}>{interest}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={styles.actions}>
              <button
                onClick={() => handleInteraction('PASS')}
                style={styles.passButton} // Use specific style for color
                className="btn-block-mobile" // Global class for responsive width and base style
                disabled={!currentProfile || (currentIndex >= profiles.length -1 && !isLoading)}
              >
                Pass (Nope)
              </button>
              <button
                onClick={() => handleInteraction('LIKE')}
                style={styles.likeButton} // Use specific style for color
                className="btn-block-mobile" // Global class for responsive width and base style
                disabled={!currentProfile || (currentIndex >= profiles.length -1 && !isLoading)}
              >
                Like (Yep)
              </button>
            </div>
          </div>
        )}
         {/* Show a message if all profiles have been viewed and no error occurred */}
        {!isLoading && !error && profiles.length > 0 && currentIndex >= profiles.length && (
            <p>You've seen all available profiles for now!</p>
        )}
      </main>
    </>
  );
}
