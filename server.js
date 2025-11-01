require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

// Import configurations
const { testConnection } = require('./config/database');
const { sessionConfig, sessionStore } = require('./config/session');

// Import models
const { syncDatabase } = require('./models');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const teamRoutes = require('./routes/teamRoutes');
const collaborationRoutes = require('./routes/collaborationRoutes');

// Import middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Import utilities
const { initializeSocket } = require('./utils/socketManager');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  }
});

// Initialize socket manager
initializeSocket(io);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

app.use(morgan('dev')); // HTTP request logger
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Session middleware
app.use(sessionConfig);

// Ensure uploads directory exists
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`✓ Created uploads directory: ${uploadDir}`);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api', collaborationRoutes);

// Welcome route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Task Tracking API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      tasks: '/api/tasks',
      teams: '/api/teams',
      collaboration: '/api/tasks/:taskId/comments and /api/tasks/:taskId/attachments'
    }
  });
});

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Test database connection
    await testConnection();

    // Sync session store
    await sessionStore.sync();
    console.log('✓ Session store synchronized');

    // Sync database models
    await syncDatabase(false); // Set to true to drop and recreate tables (WARNING: deletes data)
    
    // Start listening
    server.listen(PORT, () => {
      console.log('\n' + '='.repeat(50));
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 API Base URL: http://localhost:${PORT}`);
      console.log(`🔌 WebSocket URL: ws://localhost:${PORT}`);
      console.log('='.repeat(50) + '\n');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// Start the server
startServer();

module.exports = { app, server };

