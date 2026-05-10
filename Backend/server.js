const app = require('./src/app');
const conectarDB = require('./src/config/db');
const { PORT } = require('./src/config/env');

const iniciar = async () => {
  await conectarDB();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en 0.0.0.0:${PORT}`);
  });
};

iniciar();
