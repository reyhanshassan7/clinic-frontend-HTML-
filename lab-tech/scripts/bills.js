const billFilters = { q: '', from: '', to: '' };
function calculateBillTotal(orderId) {
  const o = findOrder(orderId); if (!o) return 0;
  return (o.tests || []).reduce((s, i) => s + (Number(i.cost ?? (findTest(i.testId) || {}).cost) || 0), 0);
}
function generateBill(orderId) {
  const o = findOrder(orderId);
  if (!o) { toast('Cannot generate a bill: order not found.', 'error'); return null; }
  const existing = getBills().find(b => b.orderId === orderId);
  if (existing) { toast(`Bill ${existing.id} already exists for this order.`); location.hash = '#/bill/' + existing.id; return existing; }
  if (o.status !== 'Completed') { toast('Bills can only be generated for completed orders.', 'error'); return null; }
  if (!o.tests || !o.tests.length) { toast('This order has no tests to bill.', 'error'); return null; }
  const items = o.tests.map(i => {
    const t = findTest(i.testId);
    return { testId: i.testId, testName: t ? t.name : `Test #${i.testId}`, cost: Number(i.cost ?? (t && t.cost) ?? 0) };
  });
  const bills = getBills();
  const bill = { id: generateId('LB-', bills), orderId, patientId: o.patientId, patientName: o.patientName, items, totalAmount: calculateBillTotal(orderId), generatedAt: new Date().toISOString() };
  bills.push(bill);
  if (!saveData(KEYS.bills, bills)) return null;
  toast(`Bill ${bill.id} generated.`, 'success'); location.hash = '#/bill/' + bill.id;
  return bill;
}
function loadBills() {
  document.getElementById('view').innerHTML = `<section class="panel"><div class="panel-h"><h2>Lab bills</h2></div><div class="panel-b">
    <div class="toolbar"><input id="b-q" type="search" aria-label="Search bills" placeholder="Search bill, order, patient" value="${esc(billFilters.q)}" size="30">
    <label for="b-from" style="margin:0">From</label><input id="b-from" type="date" value="${billFilters.from}"><label for="b-to" style="margin:0">To</label><input id="b-to" type="date" value="${billFilters.to}"></div><div id="bills-table"></div></div></section>`;
  const paint = () => {
    const q = billFilters.q.trim().toLowerCase();
    const list = getBills().filter(b => (!q || [b.id, b.orderId, b.patientName, b.patientId].some(x => String(x).toLowerCase().includes(q))) &&
      (!billFilters.from || b.generatedAt.slice(0, 10) >= billFilters.from) && (!billFilters.to || b.generatedAt.slice(0, 10) <= billFilters.to)).sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
    document.getElementById('bills-table').innerHTML = list.length ? `<div class="table-wrap"><table><thead><tr><th>Bill ID</th><th>Order ID</th><th>Patient</th><th>Date</th><th class="num">Total</th><th>Action</th></tr></thead><tbody>${list.map(b => `<tr><td>${esc(b.id)}</td><td>${esc(b.orderId)}</td><td>${esc(b.patientName)}<br><small>${esc(b.patientId)}</small></td><td>${fmtDate(b.generatedAt)}</td><td class="num">${money(b.totalAmount)}</td>
      <td><span class="actions"><a class="btn sm" href="#/bill/${esc(b.id)}">View</a><button class="btn ghost sm" data-action="print-bill" data-id="${esc(b.id)}">Print</button></span></td></tr>`).join('')}</tbody></table></div>` : emptyState('No bills found', 'Bills appear here after you generate them from completed orders.');
  };
  paint();
  [['b-q', 'q'], ['b-from', 'from'], ['b-to', 'to']].forEach(([id, k]) => document.getElementById(id).addEventListener('input', e => { billFilters[k] = e.target.value; paint(); }));
}
function viewBill(billId) {
  const b = findBill(billId); if (!b) return renderNotFound('Bill', billId);
  const line = (n, c) => `<tr><td>${esc(n)}</td><td class="num">${money(c)}</td></tr>`;
  document.getElementById('page-title').textContent = 'Bill ' + b.id;
  document.getElementById('view').innerHTML = `<a class="back no-print" href="#/bills">← Back to bills</a>
  <div class="actions no-print" style="margin-bottom:14px"><button class="btn" data-action="print-bill" data-id="${esc(b.id)}">Print bill</button><a class="btn ghost" href="#/order/${esc(b.orderId)}">View order</a></div>
  <article class="bill-sheet"><h2>LAB BILL</h2><div class="sub">Campus Clinic · Laboratory</div>
    <div class="meta">Bill ID: ${esc(b.id)}<br>Order ID: ${esc(b.orderId)}<br>Date: ${fmtDate(b.generatedAt)}<br><br>Patient: ${esc(b.patientName)}<br>Patient ID: ${esc(b.patientId)}</div>
    <table><thead><tr><th>Test</th><th class="num">Cost</th></tr></thead><tbody>${b.items.map(i => line(i.testName, i.cost)).join('')}</tbody></table>
    <div class="total"><span>TOTAL</span><span>${money(b.totalAmount)}</span></div></article>`;
}
function printBill(billId) {
  if (!findBill(billId)) return toast('Bill not found.', 'error');
  if (location.hash !== '#/bill/' + billId) { location.hash = '#/bill/' + billId; route(); }
  setTimeout(() => window.print(), 100);
}
