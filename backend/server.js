require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
const { dbPromise, db } = require('./config/db');
const cluster = require('cluster');
const os = require('os');
const startReminderCron = require('./cron/reminderCron');
const { apiLimiter } = require('./middleware/rateLimiter');
const { sanitizeInput, validateContentType, validateRequestSize } = require('./middleware/sanitization');
const { getCsrfToken } = require('./middleware/csrf');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const sessionManager = require('./services/sessionManager');

const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();
const server = http.createServer(app);

const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:5173', 'http://localhost:3000'];

const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST']
    }
});

app.use(helmet({ crossOriginResourcePolicy: false }));

app.use(cookieParser());

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(sanitizeInput);
app.use(validateContentType);
app.use(validateRequestSize);

app.use(apiLimiter);

app.use((req, res, next) => {
    req.io = io;
    next();
});

app.get('/health', async (req, res) => {
    try {
        await db.query('SELECT 1');
        res.json({
            status: 'ok',
            database: 'connected',
            server_time: new Date().toISOString(),
            uptime: process.uptime()
        });
    } catch (error) {
        console.error('Health check failed:', error.message);
        res.status(503).json({
            status: 'error',
            database: 'disconnected',
            message: 'Database connection failed. Please ensure MySQL is running.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

app.get('/api/csrf-token', getCsrfToken);

app.get('/migrate', (req, res) => {
    res.json({
        message: 'Data migration endpoint reached.',
        status: 'ready',
        instruction: 'This endpoint will handle data migration from legacy storage in a future update.'
    });
});

app.use('/', authRoutes);
app.use('/rooms', roomRoutes);
app.use('/', bookingRoutes);

startReminderCron();

sessionManager.setSocketIO(io);

io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);
    
    socket.on('disconnect', () => {
        console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
});

app.use(notFoundHandler);
app.use(errorHandler);

app.set('io', io);

const PORT = process.env.PORT || 3000;
const numCPUs = os.cpus().length;

if (cluster.isMaster && process.env.NODE_ENV === 'production') {
    console.log(`Master ${process.pid} is running`);
    console.log(`Forking ${numCPUs} workers...`);

    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died. Forking a replacement...`);
        cluster.fork();
    });
} else {
    const server = app.listen(PORT, () => {
        console.log(`🚀 Worker ${process.pid} running on port ${PORT}`);
        console.log(`📊 Pool connections: ${process.env.DB_CONNECTION_LIMIT || 25}`);
        if (cluster.isMaster) {
            console.log(`📍 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
            console.log(`🔒 Security middleware loaded successfully`);
        }
    });

    server.timeout = 60000;
    server.keepAliveTimeout = 30000;
    server.headersTimeout = 31000;

    const gracefulShutdown = () => {
        console.log(`\nSIGTERM/SIGINT received. Shutting down worker ${process.pid}...`);

        server.close(() => {
            console.log('HTTP server closed.');

            db.end((err) => {
                if (err) {
                    console.error('Error closing database pool:', err.message);
                    process.exit(1);
                }
                console.log('Database pool closed.');
                process.exit(0);
            });
        });

        setTimeout(() => {
            console.error('Could not close connections in time, forcefully shutting down');
            process.exit(1);
        }, 10000);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
}
