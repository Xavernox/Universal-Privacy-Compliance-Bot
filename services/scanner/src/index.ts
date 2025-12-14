import express, { Request, Response } from 'express';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 3001;
const ALERT_SERVICE_URL = process.env.ALERT_SERVICE_URL || 'http://localhost:3000';
const ADMIN_TOKEN = process.env.ADMIN_BASIC_TOKEN || 'admin-token';

app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'scanner' });
});

app.post('/scan', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, scanId, cloudProvider } = req.body;

    if (!userId || !scanId || !cloudProvider) {
      res.status(400).json({
        error: 'Missing required fields: userId, scanId, cloudProvider',
      });
      return;
    }

    res.json({
      message: 'Scan initiated',
      scanId,
      status: 'running',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/scan/validate', async (_req: Request, res: Response) => {
  res.status(501).json({ message: 'Scan validation endpoint - implementation pending' });
});

app.post('/scan/failure', async (req: Request, res: Response): Promise<void> => {
  try {
    const { scanId, userId, errorMessage, cloudProvider, scanType } = req.body;

    if (!scanId || !userId || !errorMessage) {
      res.status(400).json({
        error: 'Missing required fields: scanId, userId, errorMessage',
      });
      return;
    }

    console.log(`[Scanner] Reporting failure for scan ${scanId}: ${errorMessage}`);

    try {
      const response = await axios.post(
        `${ALERT_SERVICE_URL}/api/admin/scanner-failures`,
        {
          scanId,
          userId,
          errorMessage,
          cloudProvider: cloudProvider || 'unknown',
          scanType: scanType || 'full',
        },
        {
          headers: {
            Authorization: `Bearer ${ADMIN_TOKEN}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        }
      );

      console.log(`[Scanner] Alert created successfully for scan failure: ${scanId}`);

      res.json({
        message: 'Scan failure reported',
        alertId: response.data.alert?._id,
      });
    } catch (alertError: any) {
      console.error('[Scanner] Failed to create alert for scan failure:', alertError.message);

      res.status(202).json({
        message: 'Scan failure logged locally, alert service unavailable',
        scanId,
        errorMessage,
      });
    }
  } catch (error: any) {
    console.error('[Scanner] Scan failure reporting error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Scanner service running on port ${PORT}`);
  console.log(`Alert service URL: ${ALERT_SERVICE_URL}`);
});
