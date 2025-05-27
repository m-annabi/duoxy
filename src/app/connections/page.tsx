"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation'; // Correct import for App Router
// Header is part of RootLayout
// import Head from 'next/head'; // Metadata can be exported if needed

export default function ConnectionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [connections, setConnections] = useState<any[]>([]); // Consider defining a Profile type
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      setIsLoading(true);
      setError('');
      fetch('/api/connections') // Hits new App Router endpoint
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
    }
  }, [status, router]);

  // Styles - can be moved to a CSS file or a style object at the top
  const styles: { [key: string]: React.CSSProperties } = { // Added type for styles object
    container: {
      padding: '1rem',
      maxWidth: '900px',
      margin: '20px auto',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
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
      minHeight: '350px', // Ensure a consistent card height
    },
    profileImage: {
      width: '100%',
      height: '200px',
      objectFit: 'cover',
      borderRadius: '4px',
      marginBottom: '10px',
    },
    names: { fontSize: '1.3em', fontWeight: 'bold', marginBottom: '8px' },
    bio: { 
      fontSize: '0.9em', 
      color: '#555', 
      marginBottom: '10px', 
      flexGrow: 1,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 3, // Fallback for browsers not supporting -webkit-line-clamp
      maxHeight: '3.6em', // Fallback: approx 3 lines (0.9em * 1.33 line-height * 3)
      lineHeight: '1.33', // Ensure consistent line height for maxHeight calculation
    },
    interestsContainer: { marginTop: 'auto', paddingTop: '10px' },
    interestTag: { display: 'inline-block', background: '#eee', color: '#333', padding: '4px 8px', borderRadius: '12px', margin: '2px', fontSize: '0.8em' },
    noConnectionsText: { textAlign: 'center', fontSize: '1.1em', color: '#777', marginTop: '50px' },
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
      {/* <Head><title>My Connections</title></Head> */} {/* Metadata can be exported */}
      <main style={styles.container}> {/* Using local styles for container here */}
        <h1 style={{ textAlign: 'center' }}>My Connections</h1> {/* Removed marginBottom */}

        {isLoading && <p style={{textAlign: 'center'}}>Loading connections...</p>}
        {error && <p style={{ color: 'red', textAlign: 'center' }}>Error: {error}</p>}

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
                  <div style={{...styles.profileImage, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '1.2rem'}}>
                    No Image Available
                  </div>
                )}
                <h2 style={styles.names}>{profile.name1} &amp; {profile.name2}</h2>
                {profile.bio && <p style={styles.bio} title={profile.bio}>{profile.bio}</p>}
                
                {profile.interests && profile.interests.length > 0 && (
                  <div style={styles.interestsContainer}>
                    <strong style={{display: 'block', marginBottom: '5px'}}>Interests:</strong>
                    <div>
                      {profile.interests.slice(0, 5).map((interest: string, index: number) => (
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
