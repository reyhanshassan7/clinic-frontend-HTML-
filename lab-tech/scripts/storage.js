/* Storage layer: the only file that touches localStorage. Swap for API calls later. */
const KEYS = { tests: 'labTests', orders: 'labOrders', bills: 'labBills' };

function getData(key) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : null;
  } catch (e) { return null; }
}
function saveData(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); return true; }
  catch (e) { toast('Could not save to browser storage. It may be full or blocked.', 'error'); return false; }
}
/* Sequential id: generateId('ORD-', orders) -> ORD-0007. Use pad 0 for plain numbers. */
function generateId(prefix, list, pad = 4) {
  const max = (list || []).reduce((m, x) => {
    const n = parseInt(String(x.id).replace(/\D/g, ''), 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return prefix + String(max + 1).padStart(pad, '0');
}
const getTests = () => getData(KEYS.tests) || [];
const getOrders = () => getData(KEYS.orders) || [];
const getBills = () => getData(KEYS.bills) || [];
const findTest = id => getTests().find(t => String(t.id) === String(id));
const findOrder = id => getOrders().find(o => o.id === id);
const findBill = id => getBills().find(b => b.id === id);

function seedIfNeeded() {
  const day = n => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
  let repaired = false;
  const need = k => {
    if (localStorage.getItem(k) === null) return true;
    if (getData(k) === null) { repaired = true; return true; } // corrupted
    return false;
  };
  if (need(KEYS.tests)) saveData(KEYS.tests, [
    { id: 1, name: 'CBC', description: 'Complete blood count', cost: 300, isActive: true },
    { id: 2, name: 'Blood Glucose', description: 'Fasting blood sugar', cost: 150, isActive: true },
    { id: 3, name: 'Lipid Profile', description: 'Cholesterol and triglycerides', cost: 500, isActive: true },
    { id: 4, name: 'Liver Function Test', description: 'Bilirubin, SGOT, SGPT, ALP', cost: 800, isActive: true },
    { id: 5, name: 'Kidney Function Test', description: 'Urea, creatinine, electrolytes', cost: 700, isActive: true },
    { id: 6, name: 'Urine Routine', description: 'Physical, chemical and microscopic exam', cost: 200, isActive: true }
  ]);
  const P = (id, name, age, gender, phone) => ({ patientId: id, patientName: name, patientAge: age, patientGender: gender, patientPhone: phone });
  const D = (id, name, dep) => ({ doctorId: id, doctorName: name, doctorDepartment: dep });
  const T = (id, cost, result = '') => ({ testId: id, cost, result });
  if (need(KEYS.orders)) saveData(KEYS.orders, [
    { id: 'ORD-0001', ...P('P001', 'Rahul Sharma', 34, 'Male', '9847012345'), ...D('D01', 'Dr. Meera Nair', 'General Medicine'),
      tests: [T(1, 300, 'Hemoglobin: 13.5 g/dL\nWBC: 7200 cells/uL\nPlatelets: 2.4 lakh/uL'), T(2, 150, '95 mg/dL'), T(3, 500, 'Total cholesterol: 182 mg/dL\nLDL: 104 mg/dL\nHDL: 48 mg/dL\nTriglycerides: 130 mg/dL')], status: 'Completed', createdAt: day(3) },
    { id: 'ORD-0002', ...P('P002', 'Anjali Das', 28, 'Female', '9946098765'), ...D('D02', 'Dr. Arun Menon', 'Pediatrics'),
      tests: [T(1, 300, 'Hemoglobin: 11.2 g/dL\nWBC: 8100 cells/uL'), T(6, 200, 'Clear, pale yellow. Protein: nil. Pus cells: 1-2/hpf')], status: 'Completed', createdAt: day(2) },
    { id: 'ORD-0003', ...P('P003', 'Vikram Rao', 52, 'Male', '9895123456'), ...D('D03', 'Dr. Sana Iqbal', 'Endocrinology'),
      tests: [T(2, 150, '142 mg/dL'), T(3, 500, 'Total cholesterol: 231 mg/dL'), T(5, 700, '')], status: 'In Progress', createdAt: day(1) },
    { id: 'ORD-0004', ...P('P004', 'Fatima Khan', 41, 'Female', '9744332211'), ...D('D01', 'Dr. Meera Nair', 'General Medicine'),
      tests: [T(4, 800), T(1, 300)], status: 'Pending', createdAt: day(1) },
    { id: 'ORD-0005', ...P('P005', 'Suresh Pillai', 60, 'Male', '9633445566'), ...D('D03', 'Dr. Sana Iqbal', 'Endocrinology'),
      tests: [T(2, 150), T(5, 700), T(6, 200)], status: 'Pending', createdAt: day(0) },
    { id: 'ORD-0006', ...P('P006', 'Neha Joseph', 22, 'Female', '9526778899'), ...D('D02', 'Dr. Arun Menon', 'Pediatrics'),
      tests: [T(1, 300)], status: 'Cancelled', createdAt: day(4) }
  ]);
  if (need(KEYS.bills)) saveData(KEYS.bills, [
    { id: 'LB-0001', orderId: 'ORD-0001', patientId: 'P001', patientName: 'Rahul Sharma',
      items: [{ testId: 1, testName: 'CBC', cost: 300 }, { testId: 2, testName: 'Blood Glucose', cost: 150 }, { testId: 3, testName: 'Lipid Profile', cost: 500 }],
      totalAmount: 950, generatedAt: new Date(Date.now() - 2 * 864e5).toISOString() }
  ]);
  return repaired;
}
