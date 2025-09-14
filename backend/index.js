const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173', 
      'http://localhost:5174',
      process.env.CLIENT_URL
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const testDatabaseConnection = async () => {
  try {
    await db.execute('SELECT 1');
    console.log('Database connected successfully');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
};

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const storesRoutes = require('./routes/stores');
const ownerRoutes = require('./routes/owner');
const usersRoutes = require('./routes/users');

app.get('/', (req, res) => {
  res.json({ 
    message: 'Backend server is running!',
    status: 'success',
    timestamp: new Date().toISOString()
  });
});


app.use('/api/auth', authRoutes);

app.use('/api/admin', adminRoutes);

app.use('/api/stores', storesRoutes);

app.use('/api/owner', ownerRoutes);

app.use('/api/users', usersRoutes);

app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await db.execute('SELECT 1');
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl
  });
});

const startServer = async () => {
  try {
    const dbConnected = await testDatabaseConnection();
    
    if (!dbConnected) {
      console.log('Starting server without database connection...');
    }
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Server URL: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
