import { NextResponse } from 'next/server';
import prisma from '../../../../../../lib/prisma'; // Adjusted path
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route'; // Import authOptions
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as any).id;

  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ message: 'Current password and new password are required.' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ message: 'New password must be at least 6 characters long.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    const isCurrentPasswordValid = bcrypt.compareSync(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      return NextResponse.json({ message: 'Invalid current password.' }, { status: 401 });
    }

    const hashedNewPassword = bcrypt.hashSync(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return NextResponse.json({ message: 'Password changed successfully.' }, { status: 200 });

  } catch (error) {
    console.error('Change password API error:', error);
    return NextResponse.json({ message: 'Internal Server Error while changing password.' }, { status: 500 });
  }
}
