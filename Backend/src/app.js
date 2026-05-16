const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const errorHandler = require('./middlewares/errorHandler');
const { FRONTEND_URL } = require('./config/env');

const authRoutes = require('./routes/auth.routes');
const reunionesRoutes = require('./routes/reuniones.routes');
const participantesRoutes = require('./routes/participantes.routes');
const opcionesRoutes = require('./routes/opciones.routes');
const disponibilidadesRoutes = require('./routes/disponibilidades.routes');
const notificacionesRoutes = require('./routes/notificaciones.routes');

const app = express();

// Requerido detrás del reverse proxy de Railway/Render
app.set('trust proxy', 1);

// Health check antes de cualquier middleware para que Railway
// pueda verificar que el servidor está vivo sin interferencia
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.get('/debug-env', (req, res) => {
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
});

const allowedOrigins = new Set(
  [
    FRONTEND_URL,
    FRONTEND_URL.replace('localhost', '127.0.0.1'),
    FRONTEND_URL.replace('127.0.0.1', 'localhost'),
  ].filter(Boolean)
);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS: origen no permitido'));
    }
  },
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json({ limit: '20kb' }));

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Demasiados intentos. Espera 15 minutos.', code: 'RATE_LIMIT' },
});

const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Demasiadas solicitudes. Intenta de nuevo en un momento.', code: 'RATE_LIMIT' },
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/registro', authLimiter);
app.use('/api/reuniones', writeLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/reuniones', reunionesRoutes);
app.use('/api/reuniones/:reunionId/participantes', participantesRoutes);
app.use('/api/reuniones/:reunionId/opciones', opcionesRoutes);
app.use('/api/reuniones/:reunionId/disponibilidades', disponibilidadesRoutes);
app.use('/api/notificaciones', notificacionesRoutes);

app.use(errorHandler);

module.exports = app;
