import prisma from '../../../lib/prisma'; // Adjust path as needed
import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  const session = await getSession({ req });

  if (!session || !session.user || !session.user.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const swiperUserId = session.user.id;
  const { targetCoupleProfileId, action } = req.body;

  if (!targetCoupleProfileId || !action) {
    return res.status(400).json({ message: 'targetCoupleProfileId and action are required.' });
  }

  if (action !== 'LIKE' && action !== 'PASS') {
    return res.status(400).json({ message: "Action must be 'LIKE' or 'PASS'." });
  }

  try {
    // Optional: Check if the targetCoupleProfileId is valid and not the user's own profile.
    // For now, we assume valid inputs based on what's shown in the discovery feed.

    const interaction = await prisma.swipeInteraction.create({
      data: {
        swiperUserId,
        targetCoupleProfileId,
        action,
      },
    });

    let matchMade = false;
    let newMatchId = null;

    if (action === 'LIKE') {
      // Get the swiper's CoupleProfile ID
      const swiperCoupleProfile = await prisma.coupleProfile.findUnique({
        where: { userId: swiperUserId },
        select: { id: true },
      });

      if (!swiperCoupleProfile) {
        // This user doesn't have a couple profile, so they can't match.
        // Log this, but the interaction is still recorded.
        console.log(`User ${swiperUserId} does not have a CoupleProfile. Cannot form a match.`);
        return res.status(201).json({
          message: 'Interaction recorded successfully, but swiper has no couple profile for matching.',
          interactionId: interaction.id,
          matchMade: false,
        });
      }
      const swiperCoupleProfileId = swiperCoupleProfile.id;

      // Prevent self-matching if by some chance targetCoupleProfileId is own profile
      if (swiperCoupleProfileId === targetCoupleProfileId) {
         console.log(`User ${swiperUserId} tried to like their own profile ${swiperCoupleProfileId}. No match check needed.`);
         return res.status(201).json({
          message: 'Interaction recorded (self-like).',
          interactionId: interaction.id,
          matchMade: false,
        });
      }

      // Check if the targetCoupleProfile has also 'LIKED' the swiperCoupleProfile
      // First, get the userId of the user who owns targetCoupleProfileId
      const targetCoupleProfileOwner = await prisma.coupleProfile.findUnique({
          where: { id: targetCoupleProfileId },
          select: { userId: true }
      });

      if (!targetCoupleProfileOwner) {
          console.log(`Target couple profile ${targetCoupleProfileId} not found or has no owner.`);
          // Interaction recorded, but cannot check for match if target profile is invalid
          return res.status(201).json({
            message: 'Interaction recorded, but target profile is invalid for match checking.',
            interactionId: interaction.id,
            matchMade: false,
          });
      }

      const reciprocalLike = await prisma.swipeInteraction.findFirst({
        where: {
          swiperUserId: targetCoupleProfileOwner.userId,
          targetCoupleProfileId: swiperCoupleProfileId,
          action: 'LIKE',
        },
      });

      if (reciprocalLike) {
        // A match is formed!
        // Determine profile1Id and profile2Id for consistent ordering
        const profile1Id = swiperCoupleProfileId < targetCoupleProfileId ? swiperCoupleProfileId : targetCoupleProfileId;
        const profile2Id = swiperCoupleProfileId < targetCoupleProfileId ? targetCoupleProfileId : swiperCoupleProfileId;

        try {
          const newMatch = await prisma.match.create({
            data: {
              coupleProfileAId: profile1Id,
              coupleProfileBId: profile2Id,
            },
          });
          matchMade = true;
          newMatchId = newMatch.id;
          console.log(`Match created: ${newMatch.id} between ${profile1Id} and ${profile2Id}`);
        } catch (e) {
          if (e.code === 'P2002') { // Unique constraint violation
            console.log(`Match between ${profile1Id} and ${profile2Id} already exists.`);
            // Match already exists, which is fine. Consider it "matchMade: true" in terms of outcome.
            matchMade = true; 
            // Optionally, you could fetch the existing match ID if needed by the client.
            const existingMatch = await prisma.match.findUnique({
              where: {
                MatchPairUnique: { coupleProfileAId: profile1Id, coupleProfileBId: profile2Id }
              },
              select: { id: true }
            });
            if (existingMatch) newMatchId = existingMatch.id;

          } else {
            throw e; // Re-throw other errors
          }
        }
      }
    }

    return res.status(201).json({
      message: 'Interaction recorded successfully',
      interactionId: interaction.id,
      matchMade,
      matchId: newMatchId, // Can be null if no match or match already existed (and we don't fetch ID then)
    });

  } catch (error) {
    console.error('Error recording swipe interaction or checking match:', error);
    return res.status(500).json({ message: 'Internal Server Error while recording interaction or checking match.' });
  }
}
