import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';
import connectToDatabase from '@/lib/db/mongodb';
import Alert from '@/lib/db/models/Alert';

export const GET = withAdmin(async (request: any) => {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    const timeRange = searchParams.get('timeRange'); // 1h, 24h, 7d, 30d, all

    const query: any = {};

    if (severity) {
      query.severity = severity;
    }

    if (status) {
      query.status = status;
    }

    if (timeRange && timeRange !== 'all') {
      const now = new Date();
      const startDate = new Date();

      switch (timeRange) {
        case '1h':
          startDate.setHours(now.getHours() - 1);
          break;
        case '24h':
          startDate.setDate(now.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
      }

      query.createdAt = { $gte: startDate };
    }

    const sortObj: any = {};
    sortObj[sortBy] = sortOrder;

    const alerts = await Alert.find(query)
      .sort(sortObj)
      .limit(limit)
      .skip(offset)
      .populate('userId', 'name email')
      .populate('scanId', 'scanType cloudProvider')
      .populate('policyId', 'name category')
      .lean();

    const total = await Alert.countDocuments(query);

    const severityCounts = await Alert.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 },
        },
      },
    ]);

    const statusCounts = await Alert.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    return NextResponse.json({
      alerts,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      statistics: {
        bySeverity: severityCounts.reduce((acc: any, item: any) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byStatus: statusCounts.reduce((acc: any, item: any) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      },
    });
  } catch (error: any) {
    console.error('Dashboard alerts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
