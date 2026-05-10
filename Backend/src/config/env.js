require('dotenv').config();

const required = ['MONGO_URI', 'JWT_SECRET'];
const missing = required.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`[env] Variables de entorno faltantes: ${missing.join(', ')}`);
  process.exit(1);
}

module.exports = {
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  PORT: process.env.PORT || 3000,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5501',
};
