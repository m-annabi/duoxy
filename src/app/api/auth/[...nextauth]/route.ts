import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '../../../../../lib/prisma'; // Adjusted path
import bcrypt from 'bcryptjs';

// Define authOptions object
// Export authOptions to be used in other API routes for getServerSession
export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'jsmith@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials: any) { // Added type any to credentials for now
        if (!credentials || !credentials.email || !credentials.password) {
          throw new Error('Please provide email and password');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          console.log('No user found with email:', credentials.email);
          throw new Error('No user found with this email.');
        }

        const isValidPassword = bcrypt.compareSync(credentials.password, user.password);

        if (!isValidPassword) {
          console.log('Invalid password for user:', credentials.email);
          throw new Error('Incorrect password.');
        }
        // Return user object if everything is fine
        return { id: user.id, email: user.email, name: (user as any).name || user.email }; // Added type any to user for name property
      },
    }),
  ],
  session: {
    strategy: 'jwt' as const, // Added 'as const' for type safety
  },
  callbacks: {
    async jwt({ token, user }: { token: any, user: any }) { // Added types for token and user
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: { session: any, token: any }) { // Added types for session and token
      if (session.user) {
        session.user.id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-here',
};

const handler = NextAuth(authOptions as any); // Added 'as any' to authOptions for now

export { handler as GET, handler as POST };
