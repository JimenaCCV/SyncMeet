// ── detalle organizador ───────────────────────────────────────────────────

async function openMeetingOrg(reunionId) {
  currentMeetingId = reunionId;
  try {
    const [reunion, opciones] = await Promise.all([
      apiFetch(`/reuniones/${reunionId}`),
      apiFetch(`/reuniones/${reunionId}/opciones`),
    ]);

    currentMeetingTitle = reunion.titulo;

    if (reunion.estado === 'confirmada') {
      document.getElementById('confirmed-title').textContent = reunion.titulo;
      const opConf = opciones.find(o => String(o._id) === String(reunion.opcionConfirmadaId));
      document.getElementById('confirmed-date').textContent = opConf ? formatDate(opConf.fechaHora) : '';
      showView('detail-confirmed');
      return;
    }
    if (reunion.estado === 'cancelada') {
      showToast('Esta reunión está cancelada.', 'secondary');
      return;
    }

    const coincidencias = await apiFetch(`/reuniones/${reunionId}/disponibilidades/coincidencias`);
    renderDetailOrg(reunion, opciones, coincidencias);
    showView('detail-org');
  } catch (e) {
    if (e.status !== 401) showToast(e.message, 'danger');
  }
}

function renderDetailOrg(reunion, opciones, coincidencias) {
  document.getElementById('detail-org-title').textContent = reunion.titulo;

  const progreso = document.getElementById('detail-org-progress');
  if (coincidencias.length > 0) {
    const { totalParticipantes, pendientes } = coincidencias[0];
    const respondieron = totalParticipantes - pendientes.length;
    const pendientesNombres = pendientes.map(p => escHtml(p.nombre)).join(', ');
    progreso.innerHTML = `
      <div class="alert alert-secondary small py-2 mb-2">
        <i class="bi bi-people me-1"></i>
        <strong>${respondieron} de ${totalParticipantes}</strong> participante(s) han respondido.
        ${pendientes.length > 0 ? `<br><span class="text-muted">Sin responder: ${pendientesNombres}</span>` : ''}
      </div>`;
  } else {
    progreso.innerHTML = '<div class="alert alert-secondary small py-2 mb-2"><i class="bi bi-people me-1"></i>Ningún participante ha respondido aún.</div>';
  }

  const countMap = {};
  const maxCount = coincidencias.length > 0 ? coincidencias[0].cantidad : 0;
  for (const c of coincidencias) countMap[String(c.opcion._id)] = c.cantidad;

  const list = document.getElementById('slots-list-org');
  if (!opciones.length) {
    list.innerHTML = '<p class="text-muted small">No hay opciones de horario.</p>';
    return;
  }

  list.innerHTML = opciones.map(op => {
    const count  = countMap[String(op._id)] || 0;
    const pct    = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
    const isBest = coincidencias.length > 0 && String(coincidencias[0].opcion._id) === String(op._id) && count > 0;
    return `
      <div class="slot-option${isBest ? ' best' : ''}" id="slot-${op._id}" onclick="selectSlot('${op._id}', '${escHtml(formatDate(op.fechaHora))}')">
        <div class="d-flex justify-content-between align-items-center mb-1">
          <span class="small fw-semibold">${escHtml(formatDate(op.fechaHora))}${isBest ? ' <span class="badge bg-success ms-1">Mejor opción</span>' : ''}</span>
          <span class="${count > 0 ? 'text-success' : 'text-muted'} small fw-bold">${count} disponible${count !== 1 ? 's' : ''}</span>
        </div>
        <div class="slot-bar"><div class="slot-bar-fill" style="width:${pct}%${!isBest ? ';background:#adb5bd' : ''}"></div></div>
      </div>`;
  }).join('');
}

// ── detalle participante ──────────────────────────────────────────────────

async function openMeetingPart(reunionId) {
  currentMeetingId = reunionId;
  try {
    const [reunion, opciones, disponibilidades] = await Promise.all([
      apiFetch(`/reuniones/${reunionId}`),
      apiFetch(`/reuniones/${reunionId}/opciones`),
      apiFetch(`/reuniones/${reunionId}/disponibilidades`),
    ]);

    currentMeetingTitle = reunion.titulo;

    if (reunion.estado === 'confirmada') {
      document.getElementById('part-confirmed-title').textContent = reunion.titulo;
      const opConf = opciones.find(o => String(o._id) === String(reunion.opcionConfirmadaId));
      document.getElementById('part-confirmed-date').textContent = opConf ? formatDate(opConf.fechaHora) : '';
      showView('detail-part-confirmed');
      return;
    }

    document.getElementById('detail-part-title').textContent = reunion.titulo;
    document.getElementById('detail-part-org').textContent =
      reunion.estado === 'cancelada' ? 'Esta reunión fue cancelada.' : '';

    const myId   = currentUser._id;
    const myDisp = {};
    for (const d of disponibilidades) {
      const pid = d.participanteId?._id || d.participanteId;
      if (String(pid) === String(myId)) {
        myDisp[String(d.opcionHorarioId?._id || d.opcionHorarioId)] = d;
      }
    }

    const list = document.getElementById('avail-list');
    if (!opciones.length) {
      list.innerHTML = '<p class="text-muted small">El organizador aún no ha agregado opciones de horario.</p>';
      showView('detail-part');
      return;
    }

    list.innerHTML = opciones.map(op => {
      const disp    = myDisp[String(op._id)];
      const checked = disp ? disp.disponible : false;
      return `
        <div class="avail-row${checked ? ' checked' : ''}"
             id="avail-${op._id}"
             data-opcion="${op._id}"
             data-disp="${disp ? disp._id : ''}"
             onclick="toggleAvail('avail-${op._id}')">
          <div class="check-circle">${checked ? '<i class="bi bi-check"></i>' : ''}</div>
          <div><div class="fw-semibold small">${escHtml(formatDate(op.fechaHora))}</div></div>
        </div>`;
    }).join('');

    showView('detail-part');
  } catch (e) {
    if (e.status !== 401) showToast(e.message, 'danger');
  }
}

// ── crear reunión ─────────────────────────────────────────────────────────

function resetCreateMeeting() {
  pendingSlots = [];
  document.getElementById('meeting-title').value = '';
  document.getElementById('meeting-desc').value  = '';
  document.getElementById('slot-datetime').value = '';
  document.getElementById('chipsContainer').innerHTML = '';
  renderPendingSlots();
  ['meeting-title', 'slot-datetime', 'emailInput'].forEach(id => {
    const el = document.getElementById(id);
    if (el) clearField(el);
  });
}

function addSlot() {
  const input = document.getElementById('slot-datetime');
  if (!input.value) { showToast('Selecciona una fecha y hora.', 'danger'); return; }
  const fecha  = new Date(input.value);
  const ahora  = new Date();
  const MS_1H  = 60 * 60 * 1000;
  const MS_1A  = 365 * 24 * MS_1H;

  if (fecha.getTime() <= ahora.getTime() + MS_1H) {
    showToast('La fecha debe ser al menos 1 hora en el futuro.', 'danger'); return;
  }
  if (fecha.getTime() > ahora.getTime() + MS_1A) {
    showToast('La fecha no puede ser mayor a 1 año en el futuro.', 'danger'); return;
  }

  const iso = fecha.toISOString();
  if (pendingSlots.includes(iso)) { showToast('Ya agregaste ese horario.', 'warning'); return; }
  pendingSlots.push(iso);
  renderPendingSlots();
  input.value = '';
  showToast('Horario añadido.', 'success');
}

function removeSlot(iso) {
  pendingSlots = pendingSlots.filter(s => s !== iso);
  renderPendingSlots();
}

function renderPendingSlots() {
  const container = document.getElementById('slotsContainer');
  if (!pendingSlots.length) { container.innerHTML = ''; return; }
  container.innerHTML = pendingSlots.map(iso => `
    <div class="d-flex align-items-center gap-2 mb-2 p-2 rounded border bg-light small">
      <i class="bi bi-clock text-muted"></i>
      <span class="flex-grow-1">${escHtml(formatDate(iso))}</span>
      <button class="btn btn-sm btn-link text-danger p-0" onclick="removeSlot('${iso.replace(/'/g, '')}')"><i class="bi bi-x-lg"></i></button>
    </div>`).join('');
}

function addParticipant() {
  const input = document.getElementById('emailInput');
  const email = input.value.trim().toLowerCase();
  clearField(input);
  if (!email)                { markInvalid(input, 'Escribe un correo antes de añadir.'); return; }
  if (!validateEmail(email)) { markInvalid(input, 'Ingresa un correo electrónico válido.'); return; }

  const existing = [...document.querySelectorAll('#chipsContainer .chip')].map(c => c.dataset.email);
  if (existing.includes(email)) { showToast('Ya añadiste ese correo.', 'warning'); return; }

  const span = document.createElement('span');
  span.className = 'chip';
  span.dataset.email = email;
  const txt = document.createTextNode(email);
  const rm  = document.createElement('span');
  rm.className = 'rm';
  rm.textContent = ' ×';
  rm.onclick = () => span.remove();
  span.append(txt, rm);
  document.getElementById('chipsContainer').appendChild(span);
  input.value = '';
  showToast(email + ' añadido.', 'success');
}

async function createMeeting() {
  const titleEl = document.getElementById('meeting-title');
  const descEl  = document.getElementById('meeting-desc');
  const btn     = document.getElementById('btn-create-meeting');
  clearField(titleEl);

  if (!titleEl.value.trim()) { markInvalid(titleEl, 'El título de la reunión es requerido.'); return; }
  markValid(titleEl);
  if (pendingSlots.length === 0) { showToast('Agrega al menos un horario.', 'danger'); return; }

  setLoading(btn, true);
  try {
    const reunion = await apiFetch('/reuniones', {
      method: 'POST',
      body: JSON.stringify({ titulo: titleEl.value.trim(), descripcion: descEl.value.trim() }),
    });

    for (const fechaHora of pendingSlots) {
      await apiFetch(`/reuniones/${reunion._id}/opciones`, {
        method: 'POST',
        body: JSON.stringify({ fechaHora }),
      });
    }

    const chips  = document.querySelectorAll('#chipsContainer .chip');
    let   fallos = 0;
    for (const chip of chips) {
      try {
        await apiFetch(`/reuniones/${reunion._id}/participantes`, {
          method: 'POST',
          body: JSON.stringify({ email: chip.dataset.email }),
        });
      } catch (e) {
        fallos++;
        showToast(`No se pudo agregar ${chip.dataset.email}: ${e.message}`, 'warning');
      }
    }

    showToast(fallos === 0 ? 'Reunión creada. Invitaciones enviadas.' : 'Reunión creada con algunos errores.', 'success');
    setTimeout(() => goTo('dashboard'), 500);
  } catch (e) {
    if (e.status !== 401) showToast(e.message, 'danger');
  } finally {
    setLoading(btn, false);
  }
}
