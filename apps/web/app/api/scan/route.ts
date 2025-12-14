import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import Scan from '@/lib/db/models/Scan';
import { withAuth } from '@/lib/auth/middleware';

export const GET = withAuth(async (request, user) => {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');

    const query: any = { userId: user.userId };
    if (status) {
      query.status = status;
    }

    const scans = await Scan.find(query).sort({ createdAt: -1 }).limit(limit).skip(offset).lean();

    const total = await Scan.countDocuments(query);

    return NextResponse.json({
      scans,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error: any) {
    console.error('Get scans error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const POST = withAuth(async (request, user) => {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { scanType, cloudProvider, region } = body;

    if (!cloudProvider) {
      return NextResponse.json({ error: 'Cloud provider is required' }, { status: 400 });
    }

    const scan = await Scan.create({
      userId: user.userId,
      scanType: scanType || 'full',
      cloudProvider,
      region,
      status: 'pending',
    });

    return NextResponse.json(
      {
        message: 'Scan created successfully',
        scan,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create scan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
