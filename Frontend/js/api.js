async function apiFetch(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json' };

  let res;
  try {
    res = await fetch(API + path, {
      ...opts,
      headers: { ...headers, ...(opts.headers || {}) },
      credentials: 'include',
    });
  } catch {
    throw { status: 0, message: 'No se pudo conectar con el servidor. Verifica tu conexión.' };
  }

  const json = await res.json().catch(() => ({}));

  if (res.status === 401) {
    const wasLoggedIn = !!currentUser;
    currentUser = null;
    localStorage.removeItem('sm_user');
    updateNav();
    showView('login');
    if (wasLoggedIn && window._appReady) {
      showToast('Tu sesión expiró. Por favor inicia sesión nuevamente.', 'warning');
    }
    throw { status: 401, message: json.error || 'Sesión expirada' };
  }

  if (!res.ok) throw { status: res.status, message: json.error || 'Error desconocido' };
  return json.data;
}
