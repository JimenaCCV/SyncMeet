async function loadDashboard() {
  if (!currentUser) return;
  const list = document.getElementById('meetings-list');
  list.innerHTML = '<div class="text-muted small"><span class="spinner-border spinner-border-sm me-2"></span>Cargando reuniones...</div>';
  try {
    allMeetings = (await apiFetch('/reuniones?limit=100')).reuniones || [];
    updateGreetings();
    filterMeetings(currentFilter);
  } catch (e) {
    if (e.status !== 401) {
      list.innerHTML = `<div class="alert alert-danger small">${escHtml(e.message)}</div>`;
    }
  }
}

function filterMeetings(filter) {
  currentFilter = filter;
  dashPage = 1;

  ['all', 'organizador', 'participante'].forEach(f => {
    const btn = document.getElementById('filter-' + f);
    if (!btn) return;
    const active = f === filter;
    btn.classList.toggle('btn-success', active);
    btn.classList.toggle('btn-outline-secondary', !active);
  });

  const filtered = filter === 'all'
    ? allMeetings
    : allMeetings.filter(r => r.miRol === filter);

  renderMeetings(filtered);
}

function renderMeetings(reuniones) {
  const list = document.getElementById('meetings-list');
  const pag  = document.getElementById('meetings-pagination');

  if (!reuniones.length) {
    const esPart = currentFilter === 'participante';
    const msg = currentFilter === 'all'
      ? '¡Aún no tienes reuniones!'
      : currentFilter === 'organizador' ? 'No estás organizando ninguna reunión aún.'
      : 'No tienes invitaciones pendientes.';
    list.innerHTML = `
      <div class="text-center py-5">
        <i class="bi bi-calendar-x text-muted" style="font-size:2.5rem"></i>
        <p class="text-muted mt-3 mb-2">${escHtml(msg)}</p>
        ${!esPart ? '<button class="btn btn-success btn-sm" onclick="goTo(\'create-meeting\')"><i class="bi bi-plus me-1"></i>Crear reunión</button>' : ''}
      </div>`;
    pag.innerHTML = '';
    return;
  }

  const totalPages = Math.ceil(reuniones.length / ITEMS_PER_PAGE);
  if (dashPage > totalPages) dashPage = totalPages;
  const start  = (dashPage - 1) * ITEMS_PER_PAGE;
  const pagina = reuniones.slice(start, start + ITEMS_PER_PAGE);

  renderPagination(totalPages, reuniones.length);

  list.innerHTML = pagina.map(r => {
    const rolBadge = r.miRol === 'organizador'
      ? '<span class="badge small" style="background:rgba(91,79,207,.12);color:#5b4fcf;border:1px solid rgba(91,79,207,.3)">Organizador</span>'
      : '<span class="badge small bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25">Invitado</span>';

    const statusText = r.miRol === 'organizador'
      ? (r.estado === 'confirmada' ? 'Reunión confirmada' : r.estado === 'cancelada' ? 'Reunión cancelada' : 'Pendiente de respuestas')
      : (r.estado === 'confirmada' ? 'Reunión confirmada' : r.estado === 'cancelada' ? 'Reunión cancelada' : 'Pendiente tu respuesta');

    const onclick = r.miRol === 'organizador'
      ? `openMeetingOrg('${r._id}')`
      : `openMeetingPart('${r._id}')`;

    const deleteBtn = r.miRol === 'organizador'
      ? `<button class="btn btn-sm btn-outline-danger" onclick="event.stopPropagation(); deleteReunion('${r._id}', '${escHtml(r.titulo).replace(/'/g, "\\'")}')"><i class="bi bi-trash"></i></button>`
      : '';

    return `
      <div class="meeting-row" onclick="${onclick}">
        <div class="d-flex justify-content-between align-items-center gap-2">
          <div class="flex-grow-1 min-w-0">
            <div class="d-flex align-items-center gap-2 flex-wrap mb-1">
              <span class="fw-semibold small">${escHtml(r.titulo)}</span>
              ${rolBadge}
            </div>
            <div class="text-muted" style="font-size:13px">${escHtml(statusText)}</div>
          </div>
          <div class="d-flex gap-1 align-items-center flex-shrink-0">
            <span class="badge ${badgeFor(r.estado)}">${r.estado.charAt(0).toUpperCase() + r.estado.slice(1)}</span>
            ${deleteBtn}
          </div>
        </div>
      </div>`;
  }).join('');
}

function renderPagination(totalPages, total) {
  const pag = document.getElementById('meetings-pagination');
  if (totalPages <= 1) { pag.innerHTML = ''; return; }

  const prev = dashPage > 1
    ? `<button class="btn btn-sm btn-outline-secondary" onclick="goPage(${dashPage - 1})"><i class="bi bi-chevron-left"></i></button>`
    : `<button class="btn btn-sm btn-outline-secondary" disabled><i class="bi bi-chevron-left"></i></button>`;

  const next = dashPage < totalPages
    ? `<button class="btn btn-sm btn-outline-secondary" onclick="goPage(${dashPage + 1})"><i class="bi bi-chevron-right"></i></button>`
    : `<button class="btn btn-sm btn-outline-secondary" disabled><i class="bi bi-chevron-right"></i></button>`;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - dashPage) <= 1) {
      pages.push(`<button class="btn btn-sm ${i === dashPage ? 'btn-success' : 'btn-outline-secondary'}" onclick="goPage(${i})">${i}</button>`);
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…');
    }
  }

  pag.innerHTML = prev + pages.join('') + next;
}

function goPage(n) {
  dashPage = n;
  const filtered = currentFilter === 'all'
    ? allMeetings
    : allMeetings.filter(r => r.miRol === currentFilter);
  renderMeetings(filtered);
  document.getElementById('meetings-list').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
