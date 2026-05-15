async function register() {
  const nameEl  = document.getElementById('reg-name');
  const emailEl = document.getElementById('reg-email');
  const passEl  = document.getElementById('reg-password');
  const btn     = document.getElementById('btn-register');
  let valid = true;

  [nameEl, emailEl, passEl].forEach(clearField);
  if (!nameEl.value.trim())                { markInvalid(nameEl, 'El nombre completo es requerido.'); valid = false; } else markValid(nameEl);
  if (!validateEmail(emailEl.value.trim())) { markInvalid(emailEl, 'Ingresa un correo electrónico válido.'); valid = false; } else markValid(emailEl);
  if (passEl.value.length < 8)             { markInvalid(passEl, 'La contraseña debe tener al menos 8 caracteres.'); valid = false; } else markValid(passEl);
  if (!valid) return;

  setLoading(btn, true);
  try {
    await apiFetch('/auth/registro', {
      method: 'POST',
      body: JSON.stringify({ nombre: nameEl.value.trim(), email: emailEl.value.trim(), password: passEl.value }),
    });
    showToast('¡Cuenta creada! Ahora inicia sesión.', 'success');
    nameEl.value = ''; emailEl.value = ''; passEl.value = '';
    [nameEl, emailEl, passEl].forEach(clearField);
    showView('login');
  } catch (e) {
    showToast(e.message, 'danger');
  } finally {
    setLoading(btn, false);
  }
}

async function login() {
  const emailEl = document.getElementById('login-email');
  const passEl  = document.getElementById('login-password');
  const btn     = document.getElementById('btn-login');
  let valid = true;

  [emailEl, passEl].forEach(clearField);
  if (!validateEmail(emailEl.value.trim())) { markInvalid(emailEl, 'Ingresa un correo válido.'); valid = false; }
  if (!passEl.value)                         { markInvalid(passEl, 'La contraseña es requerida.'); valid = false; }
  if (!valid) return;

  setLoading(btn, true);
  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: emailEl.value.trim(), password: passEl.value }),
    });
    currentUser = data.usuario;
    localStorage.setItem('sm_user', JSON.stringify(currentUser));
    passEl.value = '';
    updateNav();
    updateGreetings();
    await goTo('dashboard');
    await loadNotifications();
    if (currentUser) showToast('Sesión iniciada.', 'success');
  } catch (e) {
    if (e.status !== 401) showToast(e.message, 'danger');
  } finally {
    setLoading(btn, false);
  }
}

async function logout() {
  try { await apiFetch('/auth/logout', { method: 'POST' }); } catch {}
  currentUser = null;
  localStorage.removeItem('sm_user');
  updateNav();
  showToast('Sesión cerrada.', 'secondary');
  showView('landing');
}
