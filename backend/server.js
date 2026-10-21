const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const { testConnection } = require('./config/db');
const { initDatabase } = require('./database/initDb');

// Routes
const authRoutes = require('./routes/authRoutes');
const datasetRoutes = require('./routes/datasetRoutes');
const queryRoutes = require('./routes/queryRoutes');
const reportRoutes = require('./routes/reportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const connectorRoutes = require('./routes/connectorRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        process.env.NODE_ENV === 'development'
      ) {
        callback(null, true);
      } else {
        callback(new Error('CORS origin not allowed'));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/datasets', datasetRoutes);
app.use('/api/queries', queryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboards', dashboardRoutes);
app.use('/api/connectors', connectorRoutes);

// Health Check
app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = await testConnection();

    res.json({
      status: 'online',
      appName: 'Abhii Karke Deta Hu — Analytics Engine',
      version: '1.0.0',
      database: dbStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check error:', error);

    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
    });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);

  const status = err.status || 500;

  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error occurred.',
  });
});

// Start Server
async function startServer() {
  try {
    // Verify & Initialize DB tables
    await initDatabase();

    app.listen(PORT, () => {
      console.log('=================================================');
      console.log(
        `"Abhii Karke Deta Hu" Server running on http://localhost:${PORT}`
      );
      console.log('Multi-Source Analytics Engine Active');
      console.log('=================================================');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Process Resilience Handlers
process.on('uncaughtException', (err) => {
  console.error('CRITICAL: Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer();