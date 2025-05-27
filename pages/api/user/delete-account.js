import prisma from '../../../lib/prisma'; // Adjust path as needed
import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  // Allow both POST and DELETE methods, as some clients might be restricted to POST
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    res.setHeader('Allow', ['POST', 'DELETE']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  const session = await getSession({ req });

  if (!session || !session.user || !session.user.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const userId = session.user.id;

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Delete the associated CoupleProfile (if it exists)
      // We need to check if it exists first, or delete will throw an error if not found.
      const coupleProfile = await tx.coupleProfile.findUnique({
        where: { userId },
      });

      if (coupleProfile) {
        await tx.coupleProfile.delete({
          where: { userId },
        });
      }

      // 2. Delete the User
      // This will also fail if the user is not found, but given the session check, it should exist.
      await tx.user.delete({
        where: { id: userId },
      });
    });

    // If transaction is successful
    return res.status(200).json({ message: 'Account deleted successfully.' });

  } catch (error) {
    console.error('Delete account API error:', error);
    // Check if the error is because the user or profile was already deleted or not found.
    // Prisma's P2025 error code indicates "Record to delete does not exist."
    if (error.code === 'P2025') {
        // This could happen if, for instance, the couple profile was already deleted manually
        // or if there's a race condition. We can consider this as "not an error" for deletion.
        // Or, if the user was somehow deleted between the session check and this point.
        // For simplicity, we'll log it and return a generic error, but this could be refined.
        console.warn(`Attempted to delete records that might not exist for user ${userId}: ${error.message}`);
    }
    return res.status(500).json({ message: 'Internal Server Error while deleting account.' });
  }
}
