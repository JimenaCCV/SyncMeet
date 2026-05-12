(async function init() {
  try {
    currentUser = await apiFetch('/auth/perfil');
    localStorage.setItem('sm_user', JSON.stringify(currentUser));
    updateNav();
    updateGreetings();
    await goTo('dashboard');
    await loadNotifications();
  } catch {
    if (!currentUser) showView('landing');
  }
})();
