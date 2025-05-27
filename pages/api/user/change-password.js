import prisma from '../../../lib/prisma'; // Adjust path as needed
import { getSession } from 'next-auth/react';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  const session = await getSession({ req });

  if (!session || !session.user || !session.user.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const userId = session.user.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current password and new password are required.' });
  }

  // Validate new password strength (e.g., at least 6 characters)
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      // This case should ideally not happen if session is valid
      return res.status(404).json({ message: 'User not found.' });
    }

    // Verify current password
    const isCurrentPasswordValid = bcrypt.compareSync(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      return res.status(401).json({ message: 'Invalid current password.' }); // 401 or 400 can be used
    }

    // Hash the new password
    const hashedNewPassword = bcrypt.hashSync(newPassword, 10); // 10 is salt rounds

    // Update user's password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return res.status(200).json({ message: 'Password changed successfully.' });

  } catch (error) {
    console.error('Change password API error:', error);
    return res.status(500).json({ message: 'Internal Server Error while changing password.' });
  }
}
