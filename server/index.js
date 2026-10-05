require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');

if (process.env.DNS_FIX === 'true' && !process.env.VERCEL) {
  require('node:dns').setServers(['8.8.8.8', '1.1.1.1']);
}

const app = express();
const configuredOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = new Set(configuredOrigins);

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    const error = new Error('Origin not allowed by CORS');
    error.status = 403;
    return callback(error);
  },
  credentials: true,
}));
app.use(express.json({ limit: '10kb', strict: true }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

app.get('/api/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    status: connected ? 'ok' : 'unavailable',
    database: connected ? 'connected' : 'disconnected',
  });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/budgets', require('./routes/budgetRoutes'));
app.use('/api/recurring', require('./routes/recurringRoutes'));
app.use('/api/summary', require('./routes/summaryRoutes'));

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use(require('./middleware/error'));

const start = async () => {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not configured');
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
  console.log('MongoDB connected');

  const port = Number(process.env.PORT || 5000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid TCP port');
  }
  return app.listen(port, () => console.log(`Server is running on port ${port}`));
};

if (require.main === module) {
  start().catch((err) => {
    console.error('Server startup failed:', err.message);
    process.exitCode = 1;
  });
}

module.exports = { app, start };
