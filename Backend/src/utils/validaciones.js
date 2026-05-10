const esEmailValido = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const esFechaFutura = (fecha) => new Date(fecha) > new Date();

module.exports = { esEmailValido, esFechaFutura };
