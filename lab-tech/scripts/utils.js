const inr = new Intl.NumberFormat('en-IN');
const money = n => '₹' + inr.format(Number(n) || 0);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const orDash = v => (v === undefined || v === null || v === '') ? '—' : esc(v);
const todayISO = () => new Date().toISOString().slice(0, 10);
function fmtDate(v) {
  if (!v) return '—';
  const d = /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(v + 'T00:00:00') : new Date(v);
  return isNaN(d) ? '—' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
const STATUS_CLASS = { 'Pending': 'pending', 'In Progress': 'progress', 'Completed': 'completed', 'Cancelled': 'cancelled' };
const badge = s => `<span class="badge ${STATUS_CLASS[s] || 'cancelled'}">${esc(s)}</span>`;
const emptyState = (title, hint) => `<div class="empty"><strong>${esc(title)}</strong>${esc(hint || '')}</div>`;

function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = 'toast ' + type; el.textContent = msg;
  document.getElementById('toasts').appendChild(el);
  setTimeout(() => el.remove(), 3800);
}
function openModal(title, body, footer) {
  document.getElementById('dlg-body').innerHTML =
    `<div class="dlg-h" id="dlg-title">${esc(title)}</div><div class="dlg-b">${body}</div><div class="dlg-f">${footer || ''}</div>`;
  const d = document.getElementById('dlg'); if (!d.open) d.showModal();
}
const closeModal = () => { const d = document.getElementById('dlg'); if (d.open) d.close(); };
let confirmCb = null;
function confirmDialog(title, message, yesLabel, cb) {
  confirmCb = cb;
  openModal(title, `<p>${esc(message)}</p>`,
    `<button type="button" class="btn ghost" data-action="close-modal">Cancel</button><button type="button" class="btn danger" data-action="confirm-yes">${esc(yesLabel)}</button>`);
}
function renderNotFound(what, id) {
  document.getElementById('view').innerHTML = `<div class="panel">${emptyState(what + ' not found', `No ${what.toLowerCase()} matches “${id}”. It may have been removed or the link is wrong.`)}<p class="empty"><a class="btn" href="#/dashboard">Back to dashboard</a></p></div>`;
}
