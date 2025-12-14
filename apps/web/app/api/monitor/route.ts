import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import Scan from '@/lib/db/models/Scan';
import Alert from '@/lib/db/models/Alert';
import { withAuth } from '@/lib/auth/middleware';

export const GET = withAuth(async (_request, user) => {
  try {
    await connectToDatabase();

    const recentScans = await Scan.find({ userId: user.userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const openAlerts = await Alert.find({
      userId: user.userId,
      status: 'open',
    })
      .sort({ severity: 1, createdAt: -1 })
      .limit(10)
      .lean();

    const alertStats = await Alert.aggregate([
      { $match: { userId: user.userId } },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 },
        },
      },
    ]);

    const scanStats = await Scan.aggregate([
      { $match: { userId: user.userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    return NextResponse.json({
      monitoring: {
        recentScans,
        openAlerts,
        statistics: {
          alerts: alertStats,
          scans: scanStats,
        },
      },
    });
  } catch (error: any) {
    console.error('Monitor error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
