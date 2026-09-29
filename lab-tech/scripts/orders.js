const orderFilters = { q: '', status: '' };
const STATUSES = ['Pending', 'In Progress', 'Completed', 'Cancelled'];

function filterOrders(list) {
  const q = orderFilters.q.trim().toLowerCase();
  return list.filter(o => (!orderFilters.status || o.status === orderFilters.status) &&
    (!q || o.patientName.toLowerCase().includes(q) || o.id.toLowerCase().includes(q)));
}
function loadOrders(fixedStatus, presetStatus) {
  if (fixedStatus) orderFilters.status = fixedStatus;
  else if (presetStatus !== undefined) orderFilters.status = presetStatus;
  const opts = STATUSES.map(s => `<option ${s === orderFilters.status ? 'selected' : ''}>${s}</option>`).join('');
  document.getElementById('view').innerHTML = `<section class="panel"><div class="panel-h"><h2>${fixedStatus ? fixedStatus + ' orders' : 'All lab orders'}</h2><button class="btn" data-action="new-order">New lab order</button></div><div class="panel-b">
    <div class="toolbar"><div><label for="o-q" class="sr">Search</label><input id="o-q" type="search" placeholder="Search patient name or order ID" value="${esc(orderFilters.q)}" size="32"></div>
    ${fixedStatus ? '' : `<div><label for="o-s" class="sr">Status</label><select id="o-s"><option value="">All statuses</option>${opts}</select></div>`}</div>
    <div id="orders-table"></div></div></section>`;
  document.querySelectorAll('.sr').forEach(l => l.style.cssText = 'position:absolute;left:-9999px');
  const paint = () => document.getElementById('orders-table').innerHTML = ordersTableHtml(filterOrders(getOrders()).sort((a, b) => b.id.localeCompare(a.id)));
  paint();
  document.getElementById('o-q').addEventListener('input', e => { orderFilters.q = e.target.value; paint(); });
  const s = document.getElementById('o-s'); if (s) s.addEventListener('change', e => { orderFilters.status = e.target.value; paint(); });
}

const isEditable = o => o.status === 'Pending' || o.status === 'In Progress';
function viewOrder(orderId, drafts = {}) {
  const o = findOrder(orderId);
  if (!o) return renderNotFound('Order', orderId);
  const edit = isEditable(o), tests = getTests(), bill = getBills().find(b => b.orderId === o.id);
  const items = o.tests || [];
  const rows = items.map(it => {
    const t = tests.find(x => String(x.id) === String(it.testId));
    const name = t ? t.name : `Unknown test (#${it.testId})`;
    const val = drafts[it.testId] ?? it.result ?? '';
    const done = (it.result || '').trim() !== '';
    return `<tr data-row="${esc(it.testId)}"><td><strong>${esc(name)}</strong>${t ? `<br><small>${esc(t.description)}</small>` : ''}</td><td class="num">${money(it.cost ?? (t && t.cost))}</td>
      <td style="min-width:260px">${edit ? `<label class="sr" for="res-${it.testId}" style="position:absolute;left:-9999px">Result for ${esc(name)}</label><textarea id="res-${it.testId}" data-tid="${esc(it.testId)}" placeholder="e.g. Hemoglobin: 13.5 g/dL">${esc(val)}</textarea>
      <button type="button" class="btn ghost sm" data-action="save-result" data-tid="${esc(it.testId)}" style="margin-top:6px">Save result</button>` : `<div class="result">${done ? esc(it.result) : '—'}</div>`}</td>
      <td>${done ? '<span class="badge completed">Result saved</span>' : '<span class="badge pending">Awaiting result</span>'}</td></tr>`;
  }).join('');
  const total = items.reduce((s, i) => s + (Number(i.cost) || 0), 0);
  document.getElementById('page-title').textContent = 'Order ' + o.id;
  document.getElementById('view').innerHTML = `
  <a class="back" href="#/orders">← Back to lab orders</a>
  <div class="info">
    <section class="panel"><div class="panel-h"><h2>Patient</h2></div><div class="panel-b"><dl><dt>Patient ID</dt><dd>${orDash(o.patientId)}</dd><dt>Name</dt><dd>${orDash(o.patientName)}</dd><dt>Age</dt><dd>${orDash(o.patientAge)}</dd><dt>Gender</dt><dd>${orDash(o.patientGender)}</dd><dt>Phone</dt><dd>${orDash(o.patientPhone)}</dd></dl></div></section>
    <section class="panel"><div class="panel-h"><h2>Doctor</h2></div><div class="panel-b"><dl><dt>Name</dt><dd>${orDash(o.doctorName)}</dd><dt>Department</dt><dd>${orDash(o.doctorDepartment)}</dd></dl></div></section>
    <section class="panel"><div class="panel-h"><h2>Order</h2></div><div class="panel-b"><dl><dt>Order ID</dt><dd>${esc(o.id)}</dd><dt>Order date</dt><dd>${fmtDate(o.createdAt)}</dd><dt>Status</dt><dd>${badge(o.status)}</dd></dl></div></section>
  </div>
  <section class="panel"><div class="panel-h"><h2>Ordered tests</h2><span class="actions no-print">
    ${edit ? `<button class="btn ghost" data-action="save-all" data-id="${esc(o.id)}">Save all results</button>
      ${o.status === 'Pending' ? `<button class="btn ghost" data-action="in-progress" data-id="${esc(o.id)}">Mark In Progress</button>` : ''}
      <button class="btn" data-action="complete" data-id="${esc(o.id)}">Mark Completed</button>
      <button class="btn danger" data-action="cancel-order" data-id="${esc(o.id)}">Cancel order</button>` : ''}
    ${o.status === 'Completed' ? (bill ? `<a class="btn" href="#/bill/${esc(bill.id)}">View bill</a>` : `<button class="btn" data-action="gen-bill" data-id="${esc(o.id)}">Generate bill</button>`) : ''}</span></div>
    ${items.length ? `<div class="table-wrap"><table><thead><tr><th>Test</th><th class="num">Cost</th><th>Result</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div><p class="panel-b" style="text-align:right;margin:0"><strong>Order total: ${money(total)}</strong></p>` : emptyState('This order has no tests', 'Nothing to process or bill.')}
  </section>`;
}
function collectDrafts() {
  const d = {}; document.querySelectorAll('textarea[data-tid]').forEach(t => d[t.dataset.tid] = t.value); return d;
}
function applyResult(o, testId, text) {
  const it = o.tests.find(t => String(t.testId) === String(testId)); if (it) it.result = text.trim();
}
function saveTestResult(orderId, testId, result) {
  const orders = getOrders(), o = orders.find(x => x.id === orderId);
  if (!o || !isEditable(o)) return toast('This order can no longer be edited.', 'error');
  if (!o.tests.some(t => String(t.testId) === String(testId))) return toast('Test not found in this order.', 'error');
  if (!result.trim()) return toast('Enter a result before saving.', 'error');
  applyResult(o, testId, result);
  if (o.status === 'Pending') o.status = 'In Progress';
  if (saveData(KEYS.orders, orders)) { toast('Result saved.', 'success'); const d = collectDrafts(); delete d[testId]; viewOrder(orderId, d); }
}
function saveAllResults(orderId, quiet) {
  const orders = getOrders(), o = orders.find(x => x.id === orderId);
  if (!o || !isEditable(o)) { toast('This order can no longer be edited.', 'error'); return false; }
  const d = collectDrafts(); let n = 0;
  Object.entries(d).forEach(([tid, v]) => { if (v.trim()) { applyResult(o, tid, v); n++; } else applyResult(o, tid, ''); });
  if (n && o.status === 'Pending') o.status = 'In Progress';
  if (!saveData(KEYS.orders, orders)) return false;
  if (!quiet) { toast(n ? `Saved ${n} result${n > 1 ? 's' : ''}.` : 'No results entered yet.', n ? 'success' : 'error'); viewOrder(orderId); }
  return true;
}
function setOrderStatus(orderId, status) {
  const orders = getOrders(), o = orders.find(x => x.id === orderId);
  if (!o) return toast('Order not found.', 'error');
  o.status = status;
  if (saveData(KEYS.orders, orders)) { toast(`Order marked ${status}.`, 'success'); viewOrder(orderId); }
}
function completeOrder(orderId) {
  if (!saveAllResults(orderId, true)) return;
  const o = findOrder(orderId);
  if (!o.tests.length) return toast('An order with no tests cannot be completed.', 'error');
  const missing = o.tests.filter(t => !(t.result || '').trim()).map(t => t.testId);
  if (missing.length) {
    viewOrder(orderId, collectDrafts());
    missing.forEach(id => { const r = document.querySelector(`[data-row="${id}"]`); if (r) r.classList.add('missing'); });
    return toast(`Enter results for ${missing.length} remaining test${missing.length > 1 ? 's' : ''} before completing.`, 'error');
  }
  setOrderStatus(orderId, 'Completed');
}
function openNewOrderModal() {
  const active = getTests().filter(t => t.isActive);
  const nextPid = generateId('P', [...getOrders().map(o => ({ id: o.patientId || '' }))], 3);
  const checks = active.length ? active.map(t => `<label><input type="checkbox" name="tests" value="${t.id}"> ${esc(t.name)} (${money(t.cost)})</label>`).join('') : '<em>No active tests. Activate a test in Lab Tests first.</em>';
  openModal('New lab order', `<form id="order-form" data-form="order" novalidate>
    <div class="grid2"><div class="field"><label for="f-pn">Patient name *</label><input id="f-pn" name="patientName" required style="width:100%"></div>
    <div class="field"><label for="f-pid">Patient ID</label><input id="f-pid" name="patientId" value="${nextPid}" style="width:100%"></div>
    <div class="field"><label for="f-age">Age</label><input id="f-age" name="patientAge" type="number" min="0" max="120" style="width:100%"></div>
    <div class="field"><label for="f-g">Gender</label><select id="f-g" name="patientGender" style="width:100%"><option value="">—</option><option>Female</option><option>Male</option><option>Other</option></select></div>
    <div class="field"><label for="f-ph">Phone</label><input id="f-ph" name="patientPhone" inputmode="tel" style="width:100%"></div><div></div>
    <div class="field"><label for="f-dn">Doctor name *</label><input id="f-dn" name="doctorName" required style="width:100%"></div>
    <div class="field"><label for="f-dd">Department</label><input id="f-dd" name="doctorDepartment" style="width:100%"></div></div>
    <label>Tests * (active only)</label><div class="checks">${checks}</div><div class="err" id="order-err" role="alert" style="color:var(--danger);margin-top:8px"></div></form>`,
    `<button type="button" class="btn ghost" data-action="close-modal">Cancel</button><button type="submit" form="order-form" class="btn">Create order</button>`);
}
function createOrder(form) {
  const f = new FormData(form), v = k => (f.get(k) || '').toString().trim(), err = m => { document.getElementById('order-err').textContent = m; };
  const ids = f.getAll('tests'), active = getTests().filter(t => t.isActive && ids.includes(String(t.id)));
  if (!v('patientName')) return err('Patient name cannot be empty.');
  if (!v('doctorName')) return err('Doctor name cannot be empty.');
  if (v('patientAge') && (isNaN(v('patientAge')) || v('patientAge') < 0 || v('patientAge') > 120)) return err('Age must be between 0 and 120.');
  if (v('patientPhone') && !/^[+\d][\d\s-]{6,14}$/.test(v('patientPhone'))) return err('Enter a valid phone number.');
  if (!active.length) return err('Select at least one active test.');
  const orders = getOrders();
  const o = { id: generateId('ORD-', orders), patientId: v('patientId') || 'P---', patientName: v('patientName'), patientAge: v('patientAge') ? Number(v('patientAge')) : '', patientGender: v('patientGender'), patientPhone: v('patientPhone'),
    doctorId: '', doctorName: v('doctorName'), doctorDepartment: v('doctorDepartment'), tests: active.map(t => ({ testId: t.id, cost: t.cost, result: '' })), status: 'Pending', createdAt: todayISO() };
  orders.push(o);
  if (saveData(KEYS.orders, orders)) { closeModal(); toast(`Order ${o.id} created.`, 'success'); location.hash = '#/order/' + o.id; route(); }
}
