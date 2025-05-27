import { NextResponse } from 'next/server';
import prisma from '../../../../../../lib/prisma'; // Adjusted path
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route'; // Import authOptions

export async function POST(request: Request) { // Changed to only POST for simplicity as per instruction
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as any).id;

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Delete the associated CoupleProfile (if it exists)
      const coupleProfile = await tx.coupleProfile.findUnique({
        where: { userId },
      });

      if (coupleProfile) {
        await tx.coupleProfile.delete({
          where: { userId },
        });
      }

      // 2. Delete the User
      await tx.user.delete({
        where: { id: userId },
      });
    });

    // If transaction is successful
    return NextResponse.json({ message: 'Account deleted successfully.' }, { status: 200 });

  } catch (error: any) {
    console.error('Delete account API error:', error);
    // Prisma's P2025 error code indicates "Record to delete does not exist."
    // This can be treated as a successful deletion if the goal is to ensure the records are gone.
    if (error.code === 'P2025') {
        console.warn(`Attempted to delete records that might not exist for user ${userId}: ${error.message}`);
        // Optionally return success if records not being found is acceptable for deletion.
        // For now, let's return success as the state is "deleted".
        return NextResponse.json({ message: 'Account already deleted or associated records not found.' }, { status: 200 });
    }
    return NextResponse.json({ message: 'Internal Server Error while deleting account.' }, { status: 500 });
  }
}

// If you want to explicitly support DELETE method as well:
// export async function DELETE(request: Request) {
//   return POST(request); // Just call the POST handler
// }
