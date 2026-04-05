import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { sessionMock } from './middleware/session-mock.js';
import authRoutes from './routes/auth.js';
import ordersRoutes from './routes/orders.js';
import materialsRoutes from './routes/materials.js';
import adminRoutes from './routes/admin.js';
import driverRoutes from './routes/driver.js';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173', credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(sessionMock);

app.use(authRoutes);
app.use('/orders', ordersRoutes);
app.use('/materials', materialsRoutes);
app.use('/admin', adminRoutes);
app.use('/driver', driverRoutes);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
