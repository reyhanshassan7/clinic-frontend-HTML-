let testQuery = '';
function loadLabTests() {
  document.getElementById('view').innerHTML = `<section class="panel"><div class="panel-h"><h2>Lab test catalogue</h2><button class="btn" data-action="add-test">Add test</button></div><div class="panel-b">
    <div class="toolbar"><label for="t-q" style="position:absolute;left:-9999px">Search tests</label><input id="t-q" type="search" placeholder="Search tests" value="${esc(testQuery)}" size="30"></div><div id="tests-table"></div></div></section>`;
  const paint = () => {
    const q = testQuery.trim().toLowerCase(), list = getTests().filter(t => !q || t.name.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q));
    document.getElementById('tests-table').innerHTML = list.length ? `<div class="table-wrap"><table><thead><tr><th>Test</th><th>Description</th><th class="num">Cost</th><th>Status</th><th>Actions</th></tr></thead><tbody>${list.map(t => `<tr><td><strong>${esc(t.name)}</strong></td><td>${esc(t.description)}</td><td class="num">${money(t.cost)}</td><td><span class="badge ${t.isActive ? 'active' : 'inactive'}">${t.isActive ? 'Active' : 'Inactive'}</span></td>
      <td><span class="actions"><button class="btn ghost sm" data-action="edit-test" data-id="${t.id}">Edit</button><button class="btn ghost sm" data-action="toggle-test" data-id="${t.id}">${t.isActive ? 'Deactivate' : 'Activate'}</button><button class="btn danger sm" data-action="delete-test" data-id="${t.id}">Delete</button></span></td></tr>`).join('')}</tbody></table></div>` : emptyState('No tests found', testQuery ? 'Try a different search.' : 'Add your first test to start.');
  };
  paint();
  document.getElementById('t-q').addEventListener('input', e => { testQuery = e.target.value; paint(); });
}
function openTestModal(id) {
  const t = id ? findTest(id) : null;
  if (id && !t) return toast('Test not found.', 'error');
  openModal(t ? 'Edit test' : 'Add test', `<form id="test-form" data-form="test" data-id="${t ? t.id : ''}" novalidate>
    <div class="field"><label for="tf-n">Test name *</label><input id="tf-n" name="name" value="${esc(t ? t.name : '')}" style="width:100%"></div>
    <div class="field"><label for="tf-d">Description</label><input id="tf-d" name="description" value="${esc(t ? t.description : '')}" style="width:100%"></div>
    <div class="field"><label for="tf-c">Cost (₹) *</label><input id="tf-c" name="cost" type="number" min="0" step="1" value="${t ? t.cost : ''}" style="width:100%"></div>
    <div class="field"><label><input type="checkbox" name="isActive" ${!t || t.isActive ? 'checked' : ''}> Active (available for new orders)</label></div>
    <div id="test-err" role="alert" style="color:var(--danger)"></div></form>`,
    `<button type="button" class="btn ghost" data-action="close-modal">Cancel</button><button type="submit" form="test-form" class="btn">${t ? 'Save changes' : 'Add test'}</button>`);
}
function readTestForm(form, excludeId) {
  const f = new FormData(form), name = (f.get('name') || '').trim(), costRaw = (f.get('cost') || '').toString().trim(), cost = Number(costRaw), err = m => { document.getElementById('test-err').textContent = m; return null; };
  if (!name) return err('Test name cannot be empty.');
  if (costRaw === '' || isNaN(cost) || cost < 0) return err('Cost must be a number, 0 or more.');
  if (getTests().some(t => String(t.id) !== String(excludeId) && t.name.toLowerCase() === name.toLowerCase())) return err('A test with this name already exists.');
  return { name, description: (f.get('description') || '').trim(), cost, isActive: f.get('isActive') === 'on' };
}
function addLabTest(form) {
  const d = readTestForm(form); if (!d) return;
  const tests = getTests(); tests.push({ id: Number(generateId('', tests, 0)), ...d });
  if (saveData(KEYS.tests, tests)) { closeModal(); toast('Test added.', 'success'); loadLabTests(); }
}
function updateLabTest(id, form) {
  const d = readTestForm(form, id); if (!d) return;
  const tests = getTests(), t = tests.find(x => String(x.id) === String(id));
  if (!t) return toast('Test not found.', 'error');
  Object.assign(t, d);
  if (saveData(KEYS.tests, tests)) { closeModal(); toast('Test updated.', 'success'); loadLabTests(); }
}
function toggleLabTestStatus(id) {
  const tests = getTests(), t = tests.find(x => String(x.id) === String(id));
  if (!t) return toast('Test not found.', 'error');
  t.isActive = !t.isActive;
  if (saveData(KEYS.tests, tests)) { toast(`${t.name} ${t.isActive ? 'activated' : 'deactivated'}.`, 'success'); loadLabTests(); }
}
function deleteLabTest(id) {
  const t = findTest(id); if (!t) return toast('Test not found.', 'error');
  if (getOrders().some(o => (o.tests || []).some(i => String(i.testId) === String(id))))
    return toast(`${t.name} is used by existing orders and can't be deleted. Deactivate it instead.`, 'error');
  confirmDialog('Delete test', `Delete “${t.name}” permanently?`, 'Delete', () => {
    if (saveData(KEYS.tests, getTests().filter(x => String(x.id) !== String(id)))) { closeModal(); toast('Test deleted.', 'success'); loadLabTests(); }
  });
}
