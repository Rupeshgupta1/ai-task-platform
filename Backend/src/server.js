require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/database');

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');

const {
  errorHandler,
  notFound,
} = require('./middleware/errorHandler');

const app = express();

const PORT = process.env.PORT || 5000;

// ── Security middleware ─────────────────────────────
app.use(helmet());

app.use(
  cors({
    origin:
      process.env.FRONTEND_URL ||
      'http://localhost:3000',
    credentials: true,
  })
);

// Global rate limiter
const limiter = rateLimit({
  windowMs:
    parseInt(process.env.RATE_LIMIT_WINDOW_MS) ||
    15 * 60 * 1000,

  max:
    parseInt(process.env.RATE_LIMIT_MAX) || 100,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    error:
      'Too many requests. Please try again later.',
  },
});

app.use(limiter);

// Stricter auth limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: 10,

  message: {
    error:
      'Too many auth attempts. Please try again in 15 minutes.',
  },
});

// ── General middleware ──────────────────────────────
app.use(express.json({ limit: '1mb' }));

app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ── Health route ────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// ── API routes ──────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);

app.use('/api/tasks', taskRoutes);

// ── Error handlers ──────────────────────────────────
app.use(notFound);

app.use(errorHandler);

// ── Start server ────────────────────────────────────
const start = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(
      `Server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`
    );
  });
};

start();

module.exports = app;