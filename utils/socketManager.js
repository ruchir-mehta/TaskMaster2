let io = null;

// Store user socket connections
const userSockets = new Map();

// Initialize Socket.io
const initializeSocket = (socketIO) => {
  io = socketIO;

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Register user socket
    socket.on('register', (userId) => {
      if (userId) {
        userSockets.set(userId, socket.id);
        console.log(`User ${userId} registered with socket ${socket.id}`);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      // Remove socket from userSockets map
      for (const [userId, socketId] of userSockets.entries()) {
        if (socketId === socket.id) {
          userSockets.delete(userId);
          console.log(`User ${userId} disconnected`);
          break;
        }
      }
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

// Emit notification to specific user
const emitNotification = (userId, notification) => {
  if (!io) {
    console.warn('Socket.io not initialized');
    return;
  }

  const socketId = userSockets.get(userId);
  if (socketId) {
    io.to(socketId).emit('notification', {
      ...notification,
      timestamp: new Date()
    });
    console.log(`Notification sent to user ${userId}:`, notification.type);
  }
};

// Emit notification to multiple users
const emitNotificationToMultiple = (userIds, notification) => {
  userIds.forEach(userId => {
    emitNotification(userId, notification);
  });
};

// Broadcast to all connected clients
const broadcastNotification = (notification) => {
  if (!io) {
    console.warn('Socket.io not initialized');
    return;
  }

  io.emit('notification', {
    ...notification,
    timestamp: new Date()
  });
  console.log('Notification broadcasted:', notification.type);
};

module.exports = {
  initializeSocket,
  emitNotification,
  emitNotificationToMultiple,
  broadcastNotification
};

