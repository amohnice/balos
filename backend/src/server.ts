import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes.js';
import businessRoutes from './routes/business.routes.js';
import supplierRoutes from './routes/supplier.routes.js';
import baleRoutes from './routes/bale.routes.js';
import categoryRoutes from './routes/category.routes.js';
import categoryItemRoutes from './routes/categoryItem.routes.js';
import salesRoutes from './routes/sales.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import activityRoutes from './routes/activity.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Health Check Route
app.get('/health', (req, res) => {
  res.json({ status: 'Balos Backend is running!' });
});

// Register Routes
app.use('/api/auth', authRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/businesses/:businessId/suppliers', supplierRoutes);
app.use('/api/businesses/:businessId/bales', baleRoutes);
app.use('/api/businesses/:businessId/sales', salesRoutes);
app.use('/api/businesses/:businessId/dashboard', dashboardRoutes);
app.use('/api/businesses/:businessId/activity-logs', activityRoutes);
app.use('/api/bales/:baleId/categories', categoryRoutes);
app.use('/api/categories', categoryItemRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Unhandled Error]:', err);
  res.status(500).json({
    success: false,
    error: 'An unexpected error occurred on the server.',
    details: err?.message || String(err),
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
