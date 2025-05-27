import { NextResponse } from 'next/server';
import prisma from '../../../../../../lib/prisma'; // Adjusted path
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route'; // Import authOptions

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as any).id;

  try {
    // Fetch profiles to discover, excluding the user's own and those they've already interacted with.
    // First, get IDs of profiles the user has already swiped on.
    const swipedProfileInteractions = await prisma.swipeInteraction.findMany({
      where: { swiperUserId: userId },
      select: { targetCoupleProfileId: true },
    });
    const swipedProfileIds = swipedProfileInteractions.map(
      (interaction) => interaction.targetCoupleProfileId
    );

    // Fetch the logged-in user's own CoupleProfile ID to also exclude it.
    const ownCoupleProfile = await prisma.coupleProfile.findUnique({
        where: { userId: userId },
        select: { id: true },
    });
    const ownCoupleProfileId = ownCoupleProfile ? ownCoupleProfile.id : null;

    const exclusionIds = [...swipedProfileIds];
    if (ownCoupleProfileId) {
        exclusionIds.push(ownCoupleProfileId);
    }
    
    // Remove duplicates from exclusionIds, though swipedProfileIds should ideally not contain ownCoupleProfileId
    const uniqueExclusionIds = [...new Set(exclusionIds)];


    const profilesToDiscover = await prisma.coupleProfile.findMany({
      where: {
        id: {
          notIn: uniqueExclusionIds, // Exclude profiles already swiped on and user's own profile
        },
        // Optionally, ensure the profile is complete enough to be shown
        // name1: { not: null }, 
        // name2: { not: null },
      },
      take: 10, // Limit to 10 profiles for now
    });

    return NextResponse.json(profilesToDiscover, { status: 200 });

  } catch (error) {
    console.error('Error fetching discovery profiles:', error);
    return NextResponse.json({ message: 'Internal Server Error while fetching profiles.' }, { status: 500 });
  }
}
