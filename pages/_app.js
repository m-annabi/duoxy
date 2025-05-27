import { SessionProvider } from 'next-auth/react';
import '../styles/globals.css'; // Assuming you have a global stylesheet

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}

export default MyApp;
