import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import { withBasicAuth } from '@/lib/auth/basicAuth';

export const GET = withBasicAuth(async (request: NextRequest) => {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean();

    const total = await User.countDocuments();

    return NextResponse.json({
      users,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error: any) {
    console.error('Admin get users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
