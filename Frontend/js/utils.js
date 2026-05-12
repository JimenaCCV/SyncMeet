const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('es-MX', {
    dateStyle: 'long', timeStyle: 'short', timeZone: userTimeZone,
  });
}

function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = String(str ?? '');
  return d.innerHTML;
}

function badgeFor(estado) {
  return { pendiente: 'bg-warning text-dark', confirmada: 'bg-success', cancelada: 'bg-secondary' }[estado] || 'bg-secondary';
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function markInvalid(el, msg) {
  el.classList.add('is-invalid');
  el.classList.remove('is-valid');
  const fb = el.parentElement.querySelector('.invalid-feedback');
  if (fb && msg) fb.textContent = msg;
}

function markValid(el) {
  el.classList.remove('is-invalid');
  el.classList.add('is-valid');
}

function clearField(el) {
  el.classList.remove('is-invalid', 'is-valid');
}

function setLoading(btn, isLoading) {
  if (!btn) return;
  if (isLoading) {
    btn.dataset.originalHtml = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Procesando...';
    btn.disabled = true;
  } else {
    btn.innerHTML = btn.dataset.originalHtml || btn.innerHTML;
    btn.disabled = false;
  }
}

function showToast(msg, type = 'success') {
  const box = document.getElementById('toastBox');
  const div = document.createElement('div');
  div.className = `toast show align-items-center text-bg-${type} border-0 mb-2`;
  const body = document.createElement('div');
  body.className = 'd-flex';
  const text = document.createElement('div');
  text.className = 'toast-body small';
  text.textContent = msg;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn-close btn-close-white me-2 m-auto';
  btn.onclick = () => div.remove();
  body.append(text, btn);
  div.appendChild(body);
  box.appendChild(div);
  setTimeout(() => { if (div.parentNode) div.remove(); }, 3500);
}
