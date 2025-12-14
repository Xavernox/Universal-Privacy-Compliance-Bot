import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import Scan from '@/lib/db/models/Scan';
import { withAuth } from '@/lib/auth/middleware';

export const GET = withAuth(async (request, user) => {
  try {
    await connectToDatabase();

    const id = request.nextUrl.pathname.split('/').pop();

    const scan = await Scan.findOne({ _id: id, userId: user.userId });

    if (!scan) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    return NextResponse.json({ scan });
  } catch (error: any) {
    console.error('Get scan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
