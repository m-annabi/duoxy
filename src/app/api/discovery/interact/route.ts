import { NextResponse } from 'next/server';
import prisma from '../../../../../../lib/prisma'; // Adjusted path
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route'; // Import authOptions

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const swiperUserId = (session.user as any).id;

  try {
    const { targetCoupleProfileId, action } = await request.json();

    if (!targetCoupleProfileId || !action) {
      return NextResponse.json({ message: 'targetCoupleProfileId and action are required.' }, { status: 400 });
    }

    if (action !== 'LIKE' && action !== 'PASS') {
      return NextResponse.json({ message: "Action must be 'LIKE' or 'PASS'." }, { status: 400 });
    }

    const interaction = await prisma.swipeInteraction.create({
      data: {
        swiperUserId,
        targetCoupleProfileId,
        action,
      },
    });

    let matchMade = false;
    let newMatchId = null;
    let matchedCoupleNames = null; // For returning names if a match occurs

    if (action === 'LIKE') {
      const swiperCoupleProfile = await prisma.coupleProfile.findUnique({
        where: { userId: swiperUserId },
        select: { id: true, name1: true, name2: true }, // Include names for potential notification
      });

      if (!swiperCoupleProfile) {
        console.log(`User ${swiperUserId} does not have a CoupleProfile. Cannot form a match.`);
        return NextResponse.json({
          message: 'Interaction recorded successfully, but swiper has no couple profile for matching.',
          interactionId: interaction.id,
          matchMade: false,
        }, { status: 201 });
      }
      const swiperCoupleProfileId = swiperCoupleProfile.id;

      if (swiperCoupleProfileId === targetCoupleProfileId) {
        console.log(`User ${swiperUserId} tried to like their own profile ${swiperCoupleProfileId}. No match check needed.`);
        return NextResponse.json({
          message: 'Interaction recorded (self-like).',
          interactionId: interaction.id,
          matchMade: false,
        }, { status: 201 });
      }

      const targetCoupleProfileData = await prisma.coupleProfile.findUnique({
          where: { id: targetCoupleProfileId },
          select: { userId: true, name1: true, name2: true } // Include names for potential notification
      });
      
      if (!targetCoupleProfileData) {
          console.log(`Target couple profile ${targetCoupleProfileId} not found or has no owner.`);
          return NextResponse.json({
            message: 'Interaction recorded, but target profile is invalid for match checking.',
            interactionId: interaction.id,
            matchMade: false,
          }, { status: 201 });
      }
      const targetCoupleProfileOwnerId = targetCoupleProfileData.userId;

      const reciprocalLike = await prisma.swipeInteraction.findFirst({
        where: {
          swiperUserId: targetCoupleProfileOwnerId,
          targetCoupleProfileId: swiperCoupleProfileId,
          action: 'LIKE',
        },
      });

      if (reciprocalLike) {
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
          // Store names for the response
          matchedCoupleNames = `${targetCoupleProfileData.name1} & ${targetCoupleProfileData.name2}`;
          console.log(`Match created: ${newMatch.id} between ${profile1Id} and ${profile2Id}`);
        } catch (e: any) {
          if (e.code === 'P2002') {
            console.log(`Match between ${profile1Id} and ${profile2Id} already exists.`);
            matchMade = true;
            const existingMatch = await prisma.match.findUnique({
              where: { MatchPairUnique: { coupleProfileAId: profile1Id, coupleProfileBId: profile2Id } },
              select: { id: true }
            });
            if (existingMatch) newMatchId = existingMatch.id;
            matchedCoupleNames = `${targetCoupleProfileData.name1} & ${targetCoupleProfileData.name2}`;
          } else {
            throw e;
          }
        }
      }
    }

    return NextResponse.json({
      message: 'Interaction recorded successfully',
      interactionId: interaction.id,
      matchMade,
      matchId: newMatchId,
      matchedCoupleNames: matchMade ? matchedCoupleNames : null, // Send names if match
    }, { status: 201 });

  } catch (error) {
    console.error('Error recording swipe interaction or checking match:', error);
    return NextResponse.json({ message: 'Internal Server Error while recording interaction or checking match.' }, { status: 500 });
  }
}
