(async function init() {
  currentUser = null;
  localStorage.removeItem('sm_user');

  try {
    currentUser = await apiFetch('/auth/perfil');
    localStorage.setItem('sm_user', JSON.stringify(currentUser));
    updateNav();
    updateGreetings();
    await goTo('dashboard');
    await loadNotifications();
  } catch {
    showView('landing');
  } finally {
    window._appReady = true;
  }
})();
