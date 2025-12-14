import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import { withAuth } from '@/lib/auth/middleware';

export const GET = withAuth(async (_request, user) => {
  try {
    await connectToDatabase();

    const dbUser = await User.findById(user.userId).select('-password');

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: dbUser._id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        isActive: dbUser.isActive,
        lastLogin: dbUser.lastLogin,
        createdAt: dbUser.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
