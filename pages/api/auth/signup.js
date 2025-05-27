import prisma from '../../../lib/prisma'; // Adjust path as needed
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  // Validate email format (basic)
  if (!/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  // Validate password strength (example: at least 6 characters)
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    // Hash the password
    const hashedPassword = bcrypt.hashSync(password, 10); // 10 is the salt rounds

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    // Return success response (excluding password)
    // It's good practice to not send the password back, even if hashed.
    const { password: _, ...userWithoutPassword } = newUser;
    return res.status(201).json({ message: 'User created successfully', user: userWithoutPassword });

  } catch (error) {
    console.error('Signup API error:', error);
    // Check for Prisma-specific errors if needed, e.g., P2002 for unique constraint violation
    // Though the check for existingUser should catch most email uniqueness issues.
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        return res.status(409).json({ message: 'User with this email already exists (database constraint).' });
    }
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
