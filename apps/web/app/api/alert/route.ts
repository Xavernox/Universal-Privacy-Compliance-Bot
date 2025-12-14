import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import Alert from '@/lib/db/models/Alert';
import { withAuth } from '@/lib/auth/middleware';
import { queueAlert, realtimeAlertService } from '@/lib/alerting';

export const GET = withAuth(async (request, user) => {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');

    const query: any = { userId: user.userId };
    if (status) {
      query.status = status;
    }
    if (severity) {
      query.severity = severity;
    }

    const alerts = await Alert.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .populate('scanId', 'scanType cloudProvider')
      .populate('policyId', 'name category')
      .lean();

    const total = await Alert.countDocuments(query);

    return NextResponse.json({
      alerts,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error: any) {
    console.error('Get alerts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const POST = withAuth(async (request, user) => {
  try {
    await connectToDatabase();

    const body = await request.json();

    const alert = await Alert.create({
      ...body,
      userId: user.userId,
      status: 'open',
    });

    realtimeAlertService.publishAlert(alert);

    try {
      await queueAlert(alert._id.toString(), user.userId);
    } catch (queueError: any) {
      console.warn('Failed to queue alert for delivery:', queueError.message);
    }

    return NextResponse.json(
      {
        message: 'Alert created successfully',
        alert,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create alert error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
