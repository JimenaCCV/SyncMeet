function openModal(id)  { document.getElementById('modal-' + id).classList.add('open'); }
function closeModal(id) { document.getElementById('modal-' + id).classList.remove('open'); }

function selectSlot(opcionId, fechaLabel) {
  document.querySelectorAll('.slot-option').forEach(s => s.classList.remove('selected'));
  const el = document.getElementById('slot-' + opcionId);
  if (el) el.classList.add('selected');
  selectedOpcionId = opcionId;
}

function tryConfirm() {
  if (!selectedOpcionId) { showToast('Selecciona un horario primero.', 'warning'); return; }
  const el    = document.getElementById('slot-' + selectedOpcionId);
  const label = el ? el.querySelector('.fw-semibold')?.textContent?.trim() : '';
  document.getElementById('modal-confirm-date').textContent = label;
  openModal('confirm');
}

function openCancelModal() {
  document.getElementById('modal-cancel-title').textContent = currentMeetingTitle || 'esta reunión';
  openModal('cancel');
}

async function confirmCancel() {
  const btn = document.getElementById('btn-do-cancel');
  closeModal('cancel');
  setLoading(btn, true);
  try {
    await apiFetch(`/reuniones/${currentMeetingId}/cancelar`, { method: 'PUT' });
    showToast('Reunión cancelada.', 'danger');
    setTimeout(() => goTo('dashboard'), 600);
  } catch (e) {
    if (e.status !== 401) showToast(e.message, 'danger');
  } finally {
    setLoading(btn, false);
  }
}

async function confirmMeeting() {
  const btn = document.getElementById('btn-do-confirm');
  closeModal('confirm');
  setLoading(btn, true);
  try {
    await apiFetch(`/reuniones/${currentMeetingId}/confirmar`, {
      method: 'PUT',
      body: JSON.stringify({ opcionId: selectedOpcionId }),
    });
    showToast('¡Reunión confirmada!', 'success');
    await openMeetingOrg(currentMeetingId);
  } catch (e) {
    if (e.status !== 401) showToast(e.message, 'danger');
  } finally {
    setLoading(btn, false);
  }
}

async function recordarPendientes() {
  const btn = document.getElementById('btn-recordar');
  setLoading(btn, true);
  try {
    const result = await apiFetch(`/reuniones/${currentMeetingId}/recordar`, { method: 'POST' });
    showToast(result?.mensaje || 'Recordatorio enviado.', 'success');
  } catch (e) {
    if (e.status !== 401) showToast(e.message, 'danger');
  } finally {
    setLoading(btn, false);
  }
}

// ── eliminar reunión ──────────────────────────────────────────────────────

function deleteReunion(reunionId, titulo) {
  currentMeetingId    = reunionId;
  currentMeetingTitle = titulo;
  openDeleteModal();
}

function openDeleteModal() {
  document.getElementById('modal-delete-title').textContent = currentMeetingTitle || 'esta reunión';
  openModal('delete');
}

async function confirmDelete() {
  const btn = document.getElementById('btn-do-delete');
  closeModal('delete');
  setLoading(btn, true);
  try {
    await apiFetch(`/reuniones/${currentMeetingId}`, { method: 'DELETE' });
    showToast('Reunión eliminada correctamente.', 'success');
    setTimeout(() => goTo('dashboard'), 600);
  } catch (e) {
    if (e.status !== 401) showToast(e.message, 'danger');
  } finally {
    setLoading(btn, false);
  }
}
