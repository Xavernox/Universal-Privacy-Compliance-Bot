import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import Alert from '@/lib/db/models/Alert';
import { withAuth } from '@/lib/auth/middleware';

export const POST = withAuth(async (request, user) => {
  try {
    await connectToDatabase();

    const id = request.nextUrl.pathname.split('/')[4];

    const alert = await Alert.findOneAndUpdate(
      { _id: id, userId: user.userId },
      {
        status: 'acknowledged',
        acknowledgedBy: user.userId,
        acknowledgedAt: new Date(),
      },
      { new: true }
    );

    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Alert acknowledged successfully',
      alert,
    });
  } catch (error: any) {
    console.error('Acknowledge alert error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
