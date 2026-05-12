const iconoNotif = {
  invitacion:   'bi-envelope-open text-success',
  confirmacion: 'bi-check-circle text-success',
  cancelacion:  'bi-x-circle text-danger',
  recordatorio: 'bi-alarm text-warning',
};

async function loadNotifications() {
  if (!currentUser) return;
  try {
    const notifs = (await apiFetch('/notificaciones')).docs || [];
    const unread = notifs.filter(n => !n.leida).length;
    const badge  = document.getElementById('notif-badge');
    badge.textContent = unread;
    badge.classList.toggle('d-none', unread === 0);

    const countText = document.getElementById('notif-count-text');
    if (countText) countText.textContent = `${unread} sin leer`;

    const list = document.getElementById('notif-list');
    if (!list) return;

    if (!notifs.length) {
      list.innerHTML = `
        <div class="text-center py-5">
          <i class="bi bi-bell-slash text-muted" style="font-size:2.5rem"></i>
          <p class="text-muted mt-3 mb-0">No tienes notificaciones.</p>
        </div>`;
      return;
    }

    list.innerHTML = notifs.map(n => `
      <div class="notif-item${n.leida ? '' : ' unread'}" data-id="${n._id}" onclick="markRead(this)">
        <div class="d-flex gap-3 align-items-start">
          <i class="bi ${iconoNotif[n.tipo] || 'bi-bell'} fs-5 mt-1"></i>
          <div>
            <div class="fw-semibold small">${escHtml(n.tipo.charAt(0).toUpperCase() + n.tipo.slice(1))}</div>
            <div class="text-muted small">${escHtml(n.mensaje)}</div>
            <div class="text-muted" style="font-size:12px">${formatDate(n.createdAt)}</div>
          </div>
        </div>
      </div>`).join('');
  } catch (e) {
    if (e.status !== 401) showToast(e.message, 'danger');
  }
}

async function markRead(el) {
  if (!el.classList.contains('unread')) return;
  const id = el.dataset.id;
  try {
    await apiFetch(`/notificaciones/${id}/leida`, { method: 'PUT' });
    el.classList.remove('unread');
    await loadNotifications();
  } catch {}
}

async function markAllRead() {
  const btn = document.getElementById('btn-mark-all');
  setLoading(btn, true);
  try {
    await apiFetch('/notificaciones/leer-todas', { method: 'PUT' });
    await loadNotifications();
    showToast('Todas las notificaciones marcadas como leídas.', 'secondary');
  } catch (e) {
    if (e.status !== 401) showToast(e.message, 'danger');
  } finally {
    setLoading(btn, false);
  }
}
