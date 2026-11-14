const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const { init } = require('./db');

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  }
});

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Make io accessible to routes
app.set('io', io);

// Initialize database
init();

// Mount routes
const authRoutes = require('./routes/auth');
const maintenanceRoutes = require('./routes/maintenance');
const amenitiesRoutes = require('./routes/amenities');
const bookingsRoutes = require('./routes/bookings');
const communityRoutes = require('./routes/community');

app.use('/api/auth', authRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/amenities', amenitiesRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/community', communityRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io };
