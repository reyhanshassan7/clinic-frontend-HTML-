// ============================================================
// STOCK - batches, expiry checks and FEFO
// Stock is counted in strips and kept as batches (each with an expiry date).
// ============================================================

// All batches of one medicine.
function getMedicineBatches(medicineId) {
  return getTable("batches").filter(batch => batch.medicineId === medicineId);
}

// Add up the strips of a list of batches.
function addStrips(batches) {
  return batches.reduce((total, batch) => total + batch.strips, 0);
}

// Is this batch past its expiry date?
function isExpired(batch) {
  return batch.expiryDate < today();
}

// Days left until a batch expires (negative = already expired).
function daysToExpiry(batch) {
  let ms = new Date(batch.expiryDate) - new Date(today());
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

// Strips that can really be given (expired batches are not counted).
function getUsableStock(medicineId) {
  return addStrips(getMedicineBatches(medicineId).filter(batch => !isExpired(batch)));
}

// Strips sitting in expired batches (displayed for awareness; not dispensable).
function getExpiredStock(medicineId) {
  return addStrips(getMedicineBatches(medicineId).filter(batch => isExpired(batch)));
}

function getStockStatus(stock, minimum) {
  if (stock === 0) return tag("status-out", "Out of Stock");
  if (stock <= minimum) return tag("status-low", "Low Stock");
  return tag("status-good", "Good Stock");
}

function getExpiryStatus(medicineId) {

  let batches = getMedicineBatches(medicineId);

  if (batches.length === 0) {
    return tag("status-none", "Expiry Not Added");
  }

  let valid = batches.filter(batch => batch.strips > 0 && !isExpired(batch));
  let expired = batches.filter(batch => batch.strips > 0 && isExpired(batch));

  if (valid.length === 0) {
    return expired.length > 0 ? tag("status-expired", "Expired") : tag("status-none", "No stock");
  }
  if (valid.some(batch => daysToExpiry(batch) <= 30)) {
    return tag("status-soon", "Expiring Soon");
  }
  if (expired.length > 0) {
    return tag("status-soon", "Valid (some expired)");
  }
  return tag("status-valid", "Valid");
}


// ============================================================
// ADD BATCH, LOG, FEFO
// ============================================================

// Keep an internal audit entry for stock changes.
function addLog(medicineId, batchNumber, type, qty, note) {
  addRow("log", {
    medicineId, batchNumber, type, qty, note,
    by: pharmacist ? pharmacist.name : "System"
  });
}

// Add a new stock batch.
function addBatch(medicineId, batchNumber, boxes, stripsPerBox, expiryDate) {

  let totalStrips = boxes * stripsPerBox;

  addLog(medicineId, batchNumber, "STOCK IN", totalStrips, boxes + " boxes x " + stripsPerBox + " strips");

  addRow("batches", {
    medicineId, batchNumber, boxes, stripsPerBox, expiryDate,
    strips: totalStrips
  });
}

// Take strips out using FEFO: First Expiry, First Out.
// Returns true if it worked, false if there was not enough stock (nothing is saved then).
function removeStockUsingFEFO(medicineId, quantity, note) {

  let batches = getTable("batches");

  // usable batches of this medicine, earliest expiry first
  let usable = batches
    .filter(b => b.medicineId === medicineId && b.strips > 0 && !isExpired(b))
    .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));

  let remaining = quantity;
  let used = [];   // which batches were used, for the log

  for (let batch of usable) {
    if (remaining === 0) break;

    let take = Math.min(batch.strips, remaining);
    batch.strips -= take;
    remaining -= take;
    used.push({ batchNumber: batch.batchNumber, qty: take });
  }

  if (remaining > 0) {
    return false;
  }

  saveTable("batches", batches);
  used.forEach(u => addLog(medicineId, u.batchNumber, "DISPENSED", u.qty, note));
  return true;
}
