import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';
import connectToDatabase from '@/lib/db/mongodb';
import { realtimeAlertService } from '@/lib/alerting';

export const GET = withAdmin(async (request: any) => {
  await connectToDatabase();

  const encoder = new TextEncoder();
  let isConnected = true;

  return new NextResponse(
    new ReadableStream({
      async start(controller) {
        const sendEvent = (data: any) => {
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

        const unsubscribe = realtimeAlertService.subscribe('__admin__', (alert: any) => {
          if (!isConnected) return;

          sendEvent({
            type: 'alert',
            alert: {
              id: alert._id,
              title: alert.title,
              description: alert.description,
              severity: alert.severity,
              status: alert.status,
              resourceType: alert.resourceType,
              resourceId: alert.resourceId,
              cloudProvider: alert.cloudProvider,
              userId: alert.userId,
              createdAt: alert.createdAt,
            },
          });
        });

        const heartbeat = setInterval(() => {
          if (!isConnected) {
            clearInterval(heartbeat);
            return;
          }
          sendEvent({ type: 'heartbeat', timestamp: new Date().toISOString() });
        }, 30000);

        request.signal.addEventListener('abort', () => {
          isConnected = false;
          clearInterval(heartbeat);
          unsubscribe();
          controller.close();
        });
      },
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    }
  );
});
