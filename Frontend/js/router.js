function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const el = document.getElementById('view-' + name);
  if (el) { el.classList.add('active'); window.scrollTo(0, 0); }
  updateNav();
}

async function goTo(name) {
  if (name === 'dashboard-part') name = 'dashboard';

  showView(name);
  if (name === 'dashboard')     await loadDashboard();
  else if (name === 'notifications') await loadNotifications();
  else if (name === 'create-meeting') resetCreateMeeting();
}

function updateNav() {
  document.getElementById('nav-guest').classList.toggle('d-none', !!currentUser);
  document.getElementById('nav-auth').classList.toggle('d-none', !currentUser);
  if (currentUser) {
    const parts = currentUser.nombre.split(' ');
    document.getElementById('nav-username').textContent =
      parts[0] + (parts[1] ? ' ' + parts[1][0] + '.' : '');
  }
}

function updateGreetings() {
  if (!currentUser) return;
  const name = currentUser.nombre.split(' ')[0];
  document.getElementById('greeting-dashboard').textContent = `Hola, ${name} 👋`;
}
