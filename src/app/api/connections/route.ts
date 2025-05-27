import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma'; // Adjusted path
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route'; // Import authOptions

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as any).id;

  try {
    // Fetch the logged-in user's CoupleProfile ID
    const ownCoupleProfile = await prisma.coupleProfile.findUnique({
      where: { userId: userId },
      select: { id: true },
    });

    if (!ownCoupleProfile) {
      // User does not have a couple profile, so they cannot have matches.
      return NextResponse.json([], { status: 200 }); // Return empty list
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
    });

    // Extract the IDs of the other couple profiles from the matches
    const matchedProfileIds = matches
      .map((match) => {
        return match.coupleProfileAId === ownCoupleProfileId
          ? match.coupleProfileBId
          : match.coupleProfileAId;
      })
      .filter((id) => id !== ownCoupleProfileId); // Ensure no self-references

    if (matchedProfileIds.length === 0) {
      return NextResponse.json([], { status: 200 }); // No matches found
    }

    // Fetch the details of these matched CoupleProfiles
    const matchedProfiles = await prisma.coupleProfile.findMany({
      where: {
        id: { in: matchedProfileIds },
      },
    });

    return NextResponse.json(matchedProfiles, { status: 200 });

  } catch (error) {
    console.error('Error fetching connections:', error);
    return NextResponse.json({ message: 'Internal Server Error while fetching connections.' }, { status: 500 });
  }
}
