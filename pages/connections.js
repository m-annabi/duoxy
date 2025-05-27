import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '../components/Header'; // Assuming Header component exists

export default function ConnectionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [connections, setConnections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'authenticated') {
      setIsLoading(true);
      setError('');
      fetch('/api/connections')
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            setConnections(data);
          } else {
            const errorData = await res.json();
            setError(errorData.message || 'Failed to fetch connections.');
            setConnections([]);
          }
        })
        .catch((err) => {
          console.error('Error fetching connections:', err);
          setError('An unexpected error occurred while fetching connections.');
          setConnections([]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Styles - can be moved to a CSS file
  const styles = {
    container: {
      padding: '1rem',
      maxWidth: '900px', // Wider for grid/list view
      margin: '20px auto',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', // Responsive grid
      gap: '20px',
    },
    card: {
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '15px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      background: '#fff',
      display: 'flex',
      flexDirection: 'column',
    },
    profileImage: {
      width: '100%',
      height: '200px', // Fixed height for consistency
      objectFit: 'cover',
      borderRadius: '4px',
      marginBottom: '10px',
    },
    names: {
      fontSize: '1.3em',
      fontWeight: 'bold',
      marginBottom: '8px',
    },
    bio: {
      fontSize: '0.9em',
      color: '#555',
      marginBottom: '10px',
      flexGrow: 1, // Allow bio to take available space
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 3, // Limit to 3 lines
      WebkitBoxOrient: 'vertical',
    },
    interestsContainer: {
      marginTop: 'auto', // Push interests to the bottom if card height varies
      paddingTop: '10px',
    },
    interestTag: {
      display: 'inline-block',
      background: '#eee',
      color: '#333',
      padding: '4px 8px',
      borderRadius: '12px',
      margin: '2px',
      fontSize: '0.8em',
    },
    noConnectionsText: {
      textAlign: 'center',
      fontSize: '1.1em',
      color: '#777',
      marginTop: '50px',
    },
  };

  if (status === 'loading') {
    return (
      <>
        <Head><title>My Connections</title></Head>
        <Header />
        <main className="container"><p>Loading...</p></main> {/* Changed to className */}
      </>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <>
        <Head><title>My Connections</title></Head>
        <Header />
        <main className="container"><p>Redirecting to login...</p></main> {/* Changed to className */}
      </>
    );
  }

  return (
    <>
      <Head>
        <title>My Connections</title>
      </Head>
      <Header />
      {/* Applied .container class to main, removed inline style for it */}
      <main className="container" style={{ maxWidth: styles.container.maxWidth, margin: styles.container.margin }}>
        <h1>My Connections</h1>

        {isLoading && <p>Loading connections...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}

        {!isLoading && !error && connections.length === 0 && (
          <p style={styles.noConnectionsText}>You haven't made any connections yet.</p>
        )}

        {!isLoading && !error && connections.length > 0 && (
          <div style={styles.grid}>
            {connections.map((profile) => (
              <div key={profile.id} style={styles.card}>
                {profile.coupleImageURL ? (
                  <img src={profile.coupleImageURL} alt={`${profile.name1} & ${profile.name2}`} style={styles.profileImage} />
                ) : (
                  <div style={{...styles.profileImage, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa'}}>
                    No Image
                  </div>
                )}
                <h2 style={styles.names}>{profile.name1} &amp; {profile.name2}</h2>
                {profile.bio && <p style={styles.bio} title={profile.bio}>{profile.bio}</p>}
                
                {profile.interests && profile.interests.length > 0 && (
                  <div style={styles.interestsContainer}>
                    <strong>Interests:</strong>
                    <div>
                      {profile.interests.slice(0, 5).map((interest, index) => ( // Show up to 5 interests
                        <span key={index} style={styles.interestTag}>{interest}</span>
                      ))}
                      {profile.interests.length > 5 && <span style={styles.interestTag}>...</span>}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
