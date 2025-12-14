import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';
import connectToDatabase from '@/lib/db/mongodb';
import Alert from '@/lib/db/models/Alert';
import Scan from '@/lib/db/models/Scan';
import User from '@/lib/db/models/User';
import { realtimeAlertService, queueAlert } from '@/lib/alerting';

interface ScannerFailureReport {
  scanId: string;
  userId: string;
  errorMessage: string;
  cloudProvider: string;
  scanType?: string;
}

export const POST = withAdmin(async (request: any) => {
  try {
    await connectToDatabase();

    const body: ScannerFailureReport = await request.json();

    const scan = await Scan.findById(body.scanId).exec();
    if (scan) {
      scan.status = 'failed';
      scan.errorMessage = body.errorMessage;
      scan.completedAt = new Date();
      if (scan.startedAt) {
        scan.duration = scan.completedAt.getTime() - scan.startedAt.getTime();
      }
      await scan.save();
    }

    const user = await User.findById(body.userId).exec();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const scannerAlert = await Alert.create({
      userId: body.userId,
      scanId: body.scanId,
      title: `Scanner Failure - ${body.scanType || 'Scan'} on ${body.cloudProvider.toUpperCase()}`,
      description: `The cloud resource scanner encountered an error during the ${body.scanType || 'full'} scan: ${body.errorMessage}`,
      severity: 'critical',
      status: 'open',
      resourceType: 'Scanner',
      resourceId: body.scanId,
      cloudProvider: body.cloudProvider as any,
      affectedResources: [],
      recommendedActions: [
        'Review scanner logs for detailed error information',
        'Verify cloud provider credentials and permissions',
        'Retry the scan after addressing any configuration issues',
        'Contact support if the issue persists',
      ],
      metadata: {
        scanFailureAlert: true,
        originalError: body.errorMessage,
      },
    });

    realtimeAlertService.publishAlert(scannerAlert);

    try {
      await queueAlert(scannerAlert._id.toString(), body.userId);
    } catch (queueError: any) {
      console.warn('Failed to queue scanner failure alert:', queueError.message);
    }

    return NextResponse.json(
      {
        message: 'Scanner failure alert created successfully',
        alert: scannerAlert,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Scanner failure reporting error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
