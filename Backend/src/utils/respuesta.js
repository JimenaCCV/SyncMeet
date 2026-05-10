const ok = (data) => ({ success: true, data });
const err = (error, code = 500) => ({ success: false, error, code });

module.exports = { ok, err };
