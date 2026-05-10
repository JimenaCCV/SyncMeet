const app = require('./src/app');
const conectarDB = require('./src/config/db');
const { PORT } = require('./src/config/env');

const iniciar = async () => {
  await conectarDB();
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
  });
};

iniciar();
