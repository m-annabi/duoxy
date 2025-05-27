import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma'; // Adjusted path
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route'; // Import authOptions

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as any).id;

  try {
    const coupleProfile = await prisma.coupleProfile.findUnique({
      where: { userId },
    });

    if (!coupleProfile) {
      return NextResponse.json({ message: 'Couple profile not found' }, { status: 404 });
    }
    return NextResponse.json(coupleProfile, { status: 200 });
  } catch (error) {
    console.error('Error fetching couple profile:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as any).id;

  try {
    const existingProfile = await prisma.coupleProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      return NextResponse.json({ message: 'Couple profile already exists for this user. Use PUT to update.' }, { status: 409 });
    }

    const body = await request.json();
    const { name1, name2, coupleImageURL, bio, interests, location } = body;

    if (!name1 || !name2) {
      return NextResponse.json({ message: 'Name1 and Name2 are required fields.' }, { status: 400 });
    }

    let interestsArray = interests;
    if (typeof interests === 'string') {
      interestsArray = interests.split(',').map(interest => interest.trim()).filter(interest => interest);
    } else if (!Array.isArray(interests)) {
      interestsArray = [];
    }

    const newProfile = await prisma.coupleProfile.create({
      data: {
        name1,
        name2,
        coupleImageURL,
        bio,
        interests: interestsArray,
        location,
        userId,
      },
    });
    return NextResponse.json(newProfile, { status: 201 });
  } catch (error) {
    console.error('Error creating couple profile:', error);
    return NextResponse.json({ message: 'Internal Server Error while creating profile' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as any).id;

  try {
    const body = await request.json();
    const { name1, name2, coupleImageURL, bio, interests, location } = body;

    if (name1 === '' || name2 === '') {
      return NextResponse.json({ message: 'Name1 and Name2 cannot be empty.' }, { status: 400 });
    }

    let interestsArray = interests;
    if (typeof interests === 'string') {
      interestsArray = interests.split(',').map(interest => interest.trim()).filter(interest => interest);
    } else if (interests !== undefined && !Array.isArray(interests)) {
      interestsArray = [];
    }

    const dataToUpdate: any = {}; // Using any for flexibility here, can be more specific
    if (name1 !== undefined) dataToUpdate.name1 = name1;
    if (name2 !== undefined) dataToUpdate.name2 = name2;
    if (coupleImageURL !== undefined) dataToUpdate.coupleImageURL = coupleImageURL;
    if (bio !== undefined) dataToUpdate.bio = bio;
    if (interestsArray !== undefined) dataToUpdate.interests = interestsArray;
    if (location !== undefined) dataToUpdate.location = location;


    const updatedProfile = await prisma.coupleProfile.update({
      where: { userId },
      data: dataToUpdate,
    });
    return NextResponse.json(updatedProfile, { status: 200 });
  } catch (error: any) {
    console.error('Error updating couple profile:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Couple profile not found to update. Please create one first.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Internal Server Error while updating profile' }, { status: 500 });
  }
}
