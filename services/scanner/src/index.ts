import express, { Request, Response } from 'express';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'scanner' });
});

app.post('/scan', async (_req: Request, res: Response) => {
  res.status(501).json({ message: 'Scan endpoint - implementation pending' });
});

app.post('/scan/validate', async (_req: Request, res: Response) => {
  res.status(501).json({ message: 'Scan validation endpoint - implementation pending' });
});

app.listen(PORT, () => {
  console.log(`Scanner service running on port ${PORT}`);
});
