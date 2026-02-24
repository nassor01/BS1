require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
const { dbPromise, db } = require('./config/db');
const startReminderCron = require('./cron/reminderCron');
const { apiLimiter } = require('./middleware/rateLimiter');
const { sanitizeInput, validateContentType, validateRequestSize } = require('./middleware/sanitization');
const { getCsrfToken } = require('./middleware/csrf');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const sessionManager = require('./services/sessionManager');

const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const faqRoutes = require('./routes/faqRoutes');

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

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://www.google.com", "https://www.gstatic.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https://www.google.com", "https://www.gstatic.com"],
            frameSrc: ["https://www.google.com"],
            connectSrc: ["'self'", "https://www.google.com", "https://www.recaptcha.net"],
        },
    },
}));

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
        const { dbPromise } = require('./config/db');
        await dbPromise.query('SELECT 1');
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
app.use('/super-admin', superAdminRoutes);
app.use('/', faqRoutes);

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

// Only use clustering in production
if (process.env.NODE_ENV === 'production') {
    const cluster = require('cluster');
    const os = require('os');
    const numCPUs = os.cpus().length;

    if (cluster.isMaster) {
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
        startServer();
    }
} else {
    // Development mode - single process
    startServer();
}

function startServer() {
    server.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📍 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    });

    const gracefulShutdown = () => {
        console.log(`\nSIGTERM/SIGINT received. Shutting down...`);

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
