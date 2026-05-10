const mongoose = require('mongoose');
const { MONGO_URI } = require('./env');

const conectarDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB conectado');
  } catch (error) {
    console.error('Error al conectar MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = conectarDB;
