function ordersTableHtml(orders) {
  if (!orders.length) return emptyState('No lab orders to show', 'Orders that match will appear here.');
  return `<div class="table-wrap"><table><thead><tr><th>Order ID</th><th>Patient</th><th>Doctor</th><th class="num">Tests</th><th>Order date</th><th>Status</th><th>Action</th></tr></thead><tbody>${orders.map(o => `<tr><td>${esc(o.id)}</td><td>${esc(o.patientName)}<br><small>${esc(o.patientId)}</small></td><td>${esc(o.doctorName)}</td><td class="num">${(o.tests || []).length}</td><td>${fmtDate(o.createdAt)}</td><td>${badge(o.status)}</td><td><a class="btn sm" href="#/order/${encodeURIComponent(o.id)}" aria-label="View order ${esc(o.id)}">View</a></td></tr>`).join('')
    }</tbody></table></div>`;
}
function loadDashboard() {
  const orders = getOrders(), bills = getBills(), tests = getTests();
  const n = s => orders.filter(o => o.status === s).length;
  const billed = bills.reduce((s, b) => s + b.totalAmount, 0);
  const recent = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id)).slice(0, 6);
  document.getElementById('view').innerHTML = `
  <div class="cards">
    <a class="stat s-pending" href="#/pending"><b>${n('Pending')}</b><span>Pending orders</span></a>
    <a class="stat s-progress" href="#/orders?status=In%20Progress"><b>${n('In Progress')}</b><span>In progress orders</span></a>
    <a class="stat s-done" href="#/completed"><b>${n('Completed')}</b><span>Completed orders</span></a>
    <a class="stat" href="#/tests"><b>${tests.length}</b><span>Total lab tests (${tests.filter(t => t.isActive).length} active)</span></a>
    <a class="stat" href="#/bills"><b>${bills.length}</b><span>Recent bills · ${money(billed)} billed</span></a>
  </div>
  <section class="panel"><div class="panel-h"><h2>Recent lab orders</h2><span class="actions"><button class="btn" data-action="new-order">New lab order</button><a class="btn ghost" href="#/orders">All orders</a></span></div>${ordersTableHtml(recent)}</section>`;
}
