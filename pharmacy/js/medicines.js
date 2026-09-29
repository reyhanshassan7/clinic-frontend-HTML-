// ============================================================
// MEDICINES - stock view, receive stock and batches
// ============================================================

let medicineForStock = null;


// ---------- Stock page ----------

function drawStock(searchText = "") {

  let medicines = getTable("meds").filter(med =>
    med.name.toLowerCase().includes(searchText.toLowerCase())
  );

  let rows = medicines.map(med => {

    let usable = getUsableStock(med.id);
    let expired = getExpiredStock(med.id);

    let batchInfo = getMedicineBatches(med.id).filter(b => !isExpired(b) && b.strips > 0);
    let totalBoxes = batchInfo.reduce((sum, b) => sum + Math.floor(b.strips / b.stripsPerBox), 0);
    let looseStrips = batchInfo.reduce((sum, b) => sum + (b.strips % b.stripsPerBox), 0);
    let stockText = totalBoxes + " box" + (totalBoxes === 1 ? "" : "es");
    if (looseStrips > 0) stockText += " + " + looseStrips + " loose strip" + (looseStrips === 1 ? "" : "s");
    stockText += " <small>(" + usable + " strips)</small>";
    if (expired > 0) {
      stockText += ` <small class="status-expired">(+${expired} expired)</small>`;
    }

    return [
      safe(med.name),
      money(med.price) + " / strip",
      stockText,
      med.min + " strips",
      getStockStatus(usable, med.min),
      getExpiryStatus(med.id),
      `<div class="action-buttons">
        <button class="light small-button" onclick="openStockDialog(${med.id})">Receive stock</button>
        <button class="light small-button" onclick="viewBatches(${med.id})">View batches</button>
      </div>`
    ];
  });

  $("page-stock").innerHTML =
    `<h2>Medicine stock</h2>
     <div class="search-row">
       <input id="medicineSearch" placeholder="Search medicine" value="${safe(searchText)}"
              oninput="runSearch('medicineSearch', drawStock)">
     </div>
     <p class="small-note">Medicines are maintained by Admin. Pharmacy can view stock and receive new batches.
       Stock is received in boxes and dispensed in strips.</p>` +
    makeTable(["Medicine", "Price", "In stock", "Minimum", "Stock status", "Expiry status", "Action"],
      rows, "No medicines found.");
}


// ---------- Receive stock (new batch) ----------

function openStockDialog(medicineId) {

  medicineForStock = findRow("meds", medicineId);

  $("stockTitle").textContent = "Receive stock - " + medicineForStock.name;
  ["batchNumber", "boxCount", "stripsPerBox", "expiryDate"].forEach(id => $(id).value = "");
  $("stockDialog").showModal();
}

function saveStock() {

  if (medicineForStock === null) return;

  let batchNumber = $("batchNumber").value.trim();
  let boxes = Number($("boxCount").value);
  let stripsPerBox = Number($("stripsPerBox").value);
  let expiryDate = $("expiryDate").value;

  let batchExists = getMedicineBatches(medicineForStock.id).some(b =>
    b.batchNumber.toLowerCase() === batchNumber.toLowerCase()
  );

  if (batchNumber === "") return fail("Enter the batch number.");
  if (batchExists) return fail("This batch number already exists for this medicine.");
  if (!Number.isInteger(boxes) || boxes < 1) return fail("Enter at least 1 box.");
  if (!Number.isInteger(stripsPerBox) || stripsPerBox < 1) return fail("Enter the number of strips in one box.");
  if (expiryDate === "") return fail("Select the expiry date.");
  if (expiryDate < today()) return fail("Expiry date cannot be in the past.");

  addBatch(medicineForStock.id, batchNumber, boxes, stripsPerBox, expiryDate);

  medicineForStock = null;
  closeDialog("stockDialog");
  drawStock();
}


// ---------- View batches ----------

function viewBatches(medicineId) {

  let medicine = findRow("meds", medicineId);
  let batches = getMedicineBatches(medicineId);

  // Earliest expiry first so the pharmacist can see FEFO order.
  batches.sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));

  let html = batches.length === 0 ? '<div class="empty">No stock batches added.</div>' : "";

  for (let batch of batches) {

    let label = "";
    if (isExpired(batch)) label = " " + tag("status-expired", "EXPIRED - DO NOT DISPENSE");
    else if (daysToExpiry(batch) <= 30) label = " " + tag("status-soon", "Expiring soon");

    let fullBoxes = Math.floor(batch.strips / batch.stripsPerBox);
    let looseStrips = batch.strips % batch.stripsPerBox;
    let availableText = fullBoxes + " box" + (fullBoxes === 1 ? "" : "es");
    if (looseStrips > 0) availableText += " + " + looseStrips + " loose strip" + (looseStrips === 1 ? "" : "s");

    html += `<div class="batch-list">
      <b>Batch:</b> ${safe(batch.batchNumber)}${label}<br>
      <b>Boxes received:</b> ${batch.boxes}<br>
      <b>Strips per box:</b> ${batch.stripsPerBox}<br>
      <b>Available:</b> ${availableText} (${batch.strips} strips)<br>
      <b>Expiry:</b> ${batch.expiryDate}
    </div>`;
  }

  $("batchTitle").textContent = medicine.name + " - Batches";
  $("batchContent").innerHTML = html;
  $("batchDialog").showModal();
}
