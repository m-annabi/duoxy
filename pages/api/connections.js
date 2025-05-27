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
    // Fetch the logged-in user's CoupleProfile ID
    const ownCoupleProfile = await prisma.coupleProfile.findUnique({
      where: { userId: userId },
      select: { id: true },
    });

    if (!ownCoupleProfile) {
      // User does not have a couple profile, so they cannot have matches.
      return res.status(200).json([]); // Return empty list, or 404 if preferred
    }

    const ownCoupleProfileId = ownCoupleProfile.id;

    // Fetch matches where the user's couple profile ID is either A or B
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { coupleProfileAId: ownCoupleProfileId },
          { coupleProfileBId: ownCoupleProfileId },
        ],
      },
      // We don't need to include the related profiles here,
      // as we'll fetch them in a separate step based on the extracted IDs.
    });

    // Extract the IDs of the other couple profiles from the matches
    const matchedProfileIds = matches
      .map((match) => {
        return match.coupleProfileAId === ownCoupleProfileId
          ? match.coupleProfileBId
          : match.coupleProfileAId;
      })
      .filter((id) => id !== ownCoupleProfileId); // Ensure no self-references (shouldn't happen with proper match logic)

    if (matchedProfileIds.length === 0) {
      return res.status(200).json([]); // No matches found
    }

    // Fetch the details of these matched CoupleProfiles
    const matchedProfiles = await prisma.coupleProfile.findMany({
      where: {
        id: { in: matchedProfileIds },
      },
      // Select specific fields if needed, or fetch all for now
      // select: { id: true, name1: true, name2: true, coupleImageURL: true, bio: true, interests: true }
    });

    return res.status(200).json(matchedProfiles);

  } catch (error) {
    console.error('Error fetching connections:', error);
    return res.status(500).json({ message: 'Internal Server Error while fetching connections.' });
  }
}
