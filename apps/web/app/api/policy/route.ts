import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import Policy from '@/lib/db/models/Policy';
import { withAuth } from '@/lib/auth/middleware';

export const GET = withAuth(async (request, _user) => {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const cloudProvider = searchParams.get('cloudProvider');
    const isActive = searchParams.get('isActive');

    const query: any = {};

    if (category) {
      query.category = category;
    }
    if (cloudProvider) {
      query.cloudProvider = cloudProvider;
    }
    if (isActive !== null && isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const policies = await Policy.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ policies });
  } catch (error: any) {
    console.error('Get policies error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const POST = withAuth(async (request, user) => {
  try {
    await connectToDatabase();

    const body = await request.json();

    const policy = await Policy.create({
      ...body,
      userId: user.userId,
      isCustom: true,
    });

    return NextResponse.json(
      {
        message: 'Policy created successfully',
        policy,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create policy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
