import express, { Request, Response } from 'express';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'policy' });
});

app.post('/policy/generate', async (_req: Request, res: Response) => {
  res.status(501).json({ message: 'Policy generation endpoint - implementation pending' });
});

app.post('/policy/validate', async (_req: Request, res: Response) => {
  res.status(501).json({ message: 'Policy validation endpoint - implementation pending' });
});

app.post('/policy/evaluate', async (_req: Request, res: Response) => {
  res.status(501).json({ message: 'Policy evaluation endpoint - implementation pending' });
});

app.listen(PORT, () => {
  console.log(`Policy service running on port ${PORT}`);
});
