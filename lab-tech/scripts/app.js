const TITLES = { 
  dashboard: 'Dashboard', 
  orders: 'Lab Orders', 
  pending: 'Pending Orders', 
  completed: 'Completed Orders', 
  tests: 'Lab Tests', 
  bills: 'Bills', 
  order: 'Order Details', 
  bill: 'Bill Details' 
};

const NAV_OF = { 
  order: 'orders', 
  bill: 'bills' 
};

function route() {
  if (sessionStorage.getItem('labSignedOut')) return showSignedOut();
  const [path, query] = (location.hash.replace(/^#\/?/, '') || 'dashboard').split('?');
  const [name, rawId] = path.split('/'), id = rawId ? decodeURIComponent(rawId) : '';
  const known = TITLES[name] ? name : 'dashboard';
  document.getElementById('page-title').textContent = TITLES[known];
  document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === (NAV_OF[known] || known)));
  document.getElementById('sidebar').classList.remove('open');
  try {
    switch (known) {
      case 'orders': loadOrders(null, new URLSearchParams(query || '').get('status') || ''); break;
      case 'pending': loadOrders('Pending'); break;
      case 'completed': loadOrders('Completed'); break;
      case 'tests': loadLabTests(); break;
      case 'bills': loadBills(); break;
      case 'order': viewOrder(id); break;
      case 'bill': viewBill(id); break;
      default: loadDashboard();
    }
  } 
  catch (e) {
    console.error(e);
    document.getElementById('view').innerHTML = `
    <div class="panel">
      ${emptyState('Something went wrong', 'This page could not be displayed. Go back to the dashboard and try again.')}
    </div>`;
  }
  window.scrollTo(0, 0);
}

function showSignedOut() {
  document.getElementById('view').innerHTML = `
  <div class="panel signedout">
    <div class="panel-b">
      <h2>You have signed out</h2>
      <p>Your lab data stays saved in this browser.</p>
      <button class="btn" data-action="login">Sign in again</button>
    </div>
  </div>`;
  document.getElementById('page-title').textContent = 'Signed out';
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-action]'); if (!b) return;
  const id = b.dataset.id, a = b.dataset.action;
  switch (a) {
    case 'toggle-menu': document.getElementById('sidebar').classList.toggle('open'); break;
    case 'close-modal': closeModal(); break;
    case 'confirm-yes': { const cb = confirmCb; confirmCb = null; if (cb) cb(); break; }
    case 'new-order': openNewOrderModal(); break;
    case 'save-result': { const t = document.getElementById('res-' + b.dataset.tid); saveTestResult(location.hash.split('/')[2] && decodeURIComponent(location.hash.split('/')[2]), b.dataset.tid, t ? t.value : ''); break; }
    case 'save-all': saveAllResults(id); break;
    case 'in-progress': setOrderStatus(id, 'In Progress'); break;
    case 'complete': completeOrder(id); break;
    case 'cancel-order': confirmDialog('Cancel order', `Cancel order ${id}? Cancelled orders are read-only.`, 'Cancel order', () => { closeModal(); setOrderStatus(id, 'Cancelled'); }); break;
    case 'gen-bill': generateBill(id); break;
    case 'print-bill': printBill(id); break;
    case 'add-test': openTestModal(); break;
    case 'edit-test': openTestModal(id); break;
    case 'toggle-test': toggleLabTestStatus(id); break;
    case 'delete-test': deleteLabTest(id); break;
    case 'logout': confirmDialog('Log out', 'Sign out of the lab module?', 'Log out', () => { closeModal(); sessionStorage.setItem('labSignedOut', '1'); showSignedOut(); }); break;
    case 'login': sessionStorage.removeItem('labSignedOut'); location.hash = '#/dashboard'; route(); break;
  }
});
document.addEventListener('submit', e => {
  const f = e.target.closest('[data-form]'); if (!f) return;
  e.preventDefault();
  if (f.dataset.form === 'order') createOrder(f);
  else if (f.dataset.form === 'test') f.dataset.id ? updateLabTest(f.dataset.id, f) : addLabTest(f);
});
window.addEventListener('hashchange', route);
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('today').textContent = fmtDate(todayISO());
  if (seedIfNeeded()) toast('Some saved lab data was unreadable and has been reset to demo data.', 'error');
  route();
});
