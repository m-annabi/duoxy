import prisma from '../../../lib/prisma'; // Adjust path as needed
import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  const session = await getSession({ req });

  if (!session || !session.user || !session.user.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const userId = session.user.id;

  try {
    // Fetch the logged-in user's own CoupleProfile ID to ensure it's excluded.
    // While `NOT: { userId: userId }` already handles this,
    // this check can be useful if we had other reasons to fetch own profile.
    // For this specific query, it's somewhat redundant but doesn't harm.
    const ownProfile = await prisma.coupleProfile.findUnique({
      where: { userId },
      select: { id: true }, // Only select id, as we just need to know if it exists / its id.
    });

    // Fetch a list of CoupleProfiles, excluding the user's own.
    // We don't strictly need ownProfile.id here if we use userId in NOT clause.
    const profilesToDiscover = await prisma.coupleProfile.findMany({
      where: {
        NOT: {
          userId: userId, // Exclude the current user's profile
        },
        // Potentially add other filters here in the future, e.g., based on preferences,
        // or profiles that the user hasn't interacted with yet.
      },
      take: 10, // Limit to 10 profiles for now
      // Optionally include related user data if needed for display,
      // but for basic card display, CoupleProfile fields might be enough.
      // include: {
      //   user: {
      //     select: { email: true } // Example: if you wanted to show user's email, though not typical for discovery
      //   }
      // }
    });

    return res.status(200).json(profilesToDiscover);

  } catch (error) {
    console.error('Error fetching discovery profiles:', error);
    return res.status(500).json({ message: 'Internal Server Error while fetching profiles.' });
  }
}
