function toggleAvail(rowId) {
  const row = document.getElementById(rowId);
  row.classList.toggle('checked');
  row.querySelector('.check-circle').innerHTML =
    row.classList.contains('checked') ? '<i class="bi bi-check"></i>' : '';
}

async function submitAvail() {
  const rows = document.querySelectorAll('#avail-list .avail-row');
  const btn  = document.getElementById('btn-submit-avail');

  const respuestas = Array.from(rows).map(row => ({
    opcionHorarioId: row.dataset.opcion,
    disponible: row.classList.contains('checked'),
  }));

  if (!respuestas.length) {
    showToast('No hay opciones de horario para responder.', 'warning');
    return;
  }

  setLoading(btn, true);
  try {
    await apiFetch(`/reuniones/${currentMeetingId}/disponibilidades/bulk`, {
      method: 'PUT',
      body: JSON.stringify({ respuestas }),
    });
    showToast('Disponibilidad enviada.', 'success');
    setTimeout(() => goTo('dashboard'), 500);
  } catch (e) {
    if (e.status !== 401) showToast(e.message, 'danger');
  } finally {
    setLoading(btn, false);
  }
}
