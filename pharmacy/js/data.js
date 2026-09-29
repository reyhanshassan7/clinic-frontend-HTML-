// ============================================================
// DATA - saves and reads data in the browser (localStorage)
// Every "table" is a list of objects saved as text under "cms_<name>".
// ============================================================

// Read a table. Gives an empty list if nothing is saved (or the data is damaged).
function getTable(name) {
  try {
    return JSON.parse(localStorage.getItem("cms_" + name)) || [];
  } catch (error) {
    return [];
  }
}

// Save a table.
function saveTable(name, rows) {
  localStorage.setItem("cms_" + name, JSON.stringify(rows));
}

// Give every new row its own number: 1, 2, 3 ...
function nextId() {
  let id = Number(localStorage.getItem("cms_lastId")) + 1;
  localStorage.setItem("cms_lastId", id);
  return id;
}

// Add one new object to a table and return it.
function addRow(name, row) {
  let rows = getTable(name);

  row.id = nextId();
  row.created = new Date().toISOString();

  rows.push(row);
  saveTable(name, rows);
  return row;
}

// Find one object by its id (empty object if not found).
function findRow(name, id) {
  return getTable(name).find(row => row.id === Number(id)) || {};
}

// Change some fields of one object.
function updateRow(name, id, changes) {
  let rows = getTable(name);
  let row = rows.find(r => r.id === Number(id));

  if (row) {
    Object.assign(row, changes);
    saveTable(name, rows);
  }
}


// ============================================================
// SAMPLE DATA (created only the first time the app opens)
// NOTE: plain-text passwords are fine for a practice project only.
// A real system needs a server and hashed passwords.
// ============================================================

function createSampleData() {

  if (localStorage.getItem("cms_seeded") === "1") {
    return;
  }

  // Users
  addRow("users", { name: "Arjun Das", username: "pharma", password: "pharma123", role: "pharmacist" });
  let doctor = addRow("users", { name: "Dr. Meera Nair", username: "doctor", password: "doctor123", role: "doctor" });

  // Patients
  let arun = addRow("patients", {
    code: "P-1001", name: "Arun Menon", age: 34, gender: "Male", phone: "9847000001", address: "Kowdiar"
  });
  addRow("patients", {
    code: "P-1002", name: "Latha S", age: 52, gender: "Female", phone: "9847000002", address: "Pattom"
  });

  // Medicine list (stock itself is kept separately as batches)
  let paracetamol = addRow("meds", { name: "Paracetamol 500mg", min: 30, price: 25 });
  let amoxicillin = addRow("meds", { name: "Amoxicillin 250mg", min: 20, price: 80 });
  let metformin = addRow("meds", { name: "Metformin 500mg", min: 20, price: 35 });
  addRow("meds", { name: "Aspirin 75mg", min: 20, price: 18 });

  // Starting stock: medicine, batch no, boxes, strips per box, expiry
  addBatch(paracetamol.id, "PCM001", 14, 10, "2027-05-20");
  addBatch(amoxicillin.id, "AMX001", 6, 10, "2027-02-15");
  addBatch(metformin.id, "MET001", 4, 10, "2026-12-10");

  // One appointment and one test prescription
  addRow("appts", {
    pid: arun.id, did: doctor.id, date: today(), time: "10:00",
    reason: "Fever for 3 days", status: "checkedin"
  });

  addRow("rx", {
    pid: arun.id,
    did: doctor.id,
    status: "pending",
    items: [{
      mid: paracetamol.id,
      dose: "1 strip three times a day for 3 days",
      prescribedQty: 3,
      givenQty: 0
    }]
  });

  localStorage.setItem("cms_seeded", "1");
}


// Add a larger set of sample medicines for demonstrations/testing.
// This runs once, so existing browser data gets the extra medicines too.
function addMoreSampleMedicineData() {
  if (localStorage.getItem("cms_extra_meds_v1") === "1") return;

  const samples = [
    { name: "Ibuprofen 400mg", min: 20, price: 32, batches: [["IBU001", 8, 10, "2027-08-15"]] },
    { name: "Cetirizine 10mg", min: 25, price: 22, batches: [["CET001", 3, 10, "2027-04-20"]] },
    { name: "Azithromycin 500mg", min: 15, price: 48, batches: [["AZI001", 5, 6, "2027-06-30"]] },
    { name: "Pantoprazole 40mg", min: 25, price: 35, batches: [["PAN001", 10, 10, "2028-01-15"]] },
    { name: "Omeprazole 20mg", min: 20, price: 28, batches: [["OME001", 7, 10, "2027-11-10"]] },
    { name: "Amlodipine 5mg", min: 20, price: 18, batches: [["AML001", 12, 10, "2028-03-25"]] },
    { name: "Telmisartan 40mg", min: 20, price: 42, batches: [["TEL001", 9, 10, "2028-02-18"]] },
    { name: "Atorvastatin 10mg", min: 20, price: 30, batches: [["ATO001", 6, 10, "2027-12-05"]] },
    { name: "Metformin 500mg", min: 20, price: 35, batches: [["MET002", 5, 10, "2028-05-12"]] },
    { name: "Levothyroxine 50mcg", min: 15, price: 24, batches: [["LEV001", 4, 10, "2027-10-22"]] },
    { name: "Montelukast 10mg", min: 15, price: 40, batches: [["MON001", 6, 10, "2027-09-18"]] },
    { name: "Loratadine 10mg", min: 15, price: 26, batches: [["LOR001", 4, 10, "2028-01-30"]] },
    { name: "Calcium + Vitamin D", min: 20, price: 45, batches: [["CAL001", 8, 10, "2027-07-14"]] },
    { name: "Folic Acid 5mg", min: 15, price: 16, batches: [["FOL001", 2, 10, "2026-10-20"]] },
    { name: "Diclofenac 50mg", min: 20, price: 27, batches: [["DIC001", 1, 10, "2027-03-15"], ["DIC002", 2, 10, "2028-02-10"]] },
    { name: "Aspirin 75mg", min: 20, price: 18, batches: [["ASP002", 2, 10, "2027-09-30"], ["ASP003", 4, 10, "2028-06-20"]] },
    { name: "Amoxicillin-Clavulanate 625mg", min: 15, price: 95, batches: [["AMC001", 4, 6, "2027-05-05"]] },
    { name: "Cefixime 200mg", min: 15, price: 72, batches: [["CEF001", 3, 10, "2027-08-28"]] },
    { name: "Salbutamol 4mg", min: 10, price: 20, batches: [["SAL001", 2, 10, "2027-12-12"]] },
    { name: "Clotrimazole 100mg", min: 10, price: 38, batches: [["CLO001", 3, 6, "2028-04-10"]] },
    { name: "Ranitidine 150mg", min: 10, price: 15, batches: [["RAN001", 2, 10, "2026-08-15"]] }
  ];

  for (let sample of samples) {
    let existing = getTable("meds").find(m =>
      m.name.toLowerCase() === sample.name.toLowerCase()
    );

    let medicine = existing || addRow("meds", {
      name: sample.name,
      min: sample.min,
      price: sample.price
    });

    for (let batch of sample.batches) {
      let [batchNumber, boxes, stripsPerBox, expiryDate] = batch;
      let exists = getMedicineBatches(medicine.id).some(b =>
        b.batchNumber.toLowerCase() === batchNumber.toLowerCase()
      );

      if (!exists) {
        addBatch(medicine.id, batchNumber, boxes, stripsPerBox, expiryDate);
      }
    }
  }

  localStorage.setItem("cms_extra_meds_v1", "1");
}
