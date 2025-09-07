const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const socketIo = require('socket.io');
const http = require('http');
const cron = require('node-cron');
require('dotenv').config();

// Import Routes
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const analyticsRoutes = require('./routes/analytics');
const alertRoutes = require('./routes/alerts');
const dataRoutes = require('./routes/dataImport');
const predictionRoutes = require('./routes/predictions');
const userRoutes = require('./routes/users');

// Import Services
const PredictionService = require('./services/predictionService');
const AlertService = require('./services/alertService');
const DataProcessingService = require('./services/dataProcessingService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai_dropout_prediction', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('✅ Connected to MongoDB');
    // Initialize AI models after DB connection
    PredictionService.initializeModel();
})
.catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});

// Socket.io for real-time updates
io.on('connection', (socket) => {
    console.log('👤 User connected:', socket.id);

    socket.on('join_dashboard', (userData) => {
        socket.join(`user_${userData.userId}`);
        console.log(`User ${userData.userId} joined dashboard`);
    });

    socket.on('disconnect', () => {
        console.log('👤 User disconnected:', socket.id);
    });
});

// Make io available to routes
app.set('socketio', io);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/users', userRoutes);

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('🚨 Error:', err.stack);
    res.status(500).json({ 
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 Handler
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Scheduled Tasks
// Run daily at 8:00 AM to process overnight data and generate alerts
cron.schedule('0 8 * * *', async () => {
    console.log('🔄 Running daily data processing...');
    try {
        await DataProcessingService.processDailyData();
        await AlertService.generateDailyAlerts();
        console.log('✅ Daily processing completed');
    } catch (error) {
        console.error('❌ Daily processing failed:', error);
    }
});

// Run every hour to check for critical alerts
cron.schedule('0 * * * *', async () => {
    try {
        await AlertService.checkCriticalAlerts();
    } catch (error) {
        console.error('❌ Hourly alert check failed:', error);
    }
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, io };