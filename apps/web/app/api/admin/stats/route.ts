import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import Scan from '@/lib/db/models/Scan';
import Alert from '@/lib/db/models/Alert';
import Policy from '@/lib/db/models/Policy';
import { withBasicAuth } from '@/lib/auth/basicAuth';

export const GET = withBasicAuth(async (_request: NextRequest) => {
  try {
    await connectToDatabase();

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalScans = await Scan.countDocuments();
    const totalAlerts = await Alert.countDocuments();
    const openAlerts = await Alert.countDocuments({ status: 'open' });
    const totalPolicies = await Policy.countDocuments();
    const activePolicies = await Policy.countDocuments({ isActive: true });

    const recentScans = await Scan.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'email name')
      .lean();

    const criticalAlerts = await Alert.find({
      severity: 'critical',
      status: 'open',
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'email name')
      .lean();

    return NextResponse.json({
      statistics: {
        users: {
          total: totalUsers,
          active: activeUsers,
        },
        scans: {
          total: totalScans,
        },
        alerts: {
          total: totalAlerts,
          open: openAlerts,
        },
        policies: {
          total: totalPolicies,
          active: activePolicies,
        },
      },
      recentActivity: {
        scans: recentScans,
        criticalAlerts,
      },
    });
  } catch (error: any) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
