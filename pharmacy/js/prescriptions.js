// ============================================================
// PRESCRIPTIONS - waiting list, dispense and history
// Simple prescription flow: pending -> dispensed.
// givenQty is kept internally when stock is limited.
// ============================================================

let prescriptionBeingDispensed = null;

// Strips of one prescription item still left to give.
function remainingOf(item) {
  return item.prescribedQty - item.givenQty;
}

// Is this prescription still waiting for the pharmacist?
function isWaiting(rx) {
  return rx.status === "pending";
}


// ---------- Waiting list ----------

function drawQueue() {

  let rows = getTable("rx").filter(isWaiting).map(rx => {

    let lines = rx.items.map(item => {
      let line = nameOf("meds", item.mid) + " - " + remainingOf(item) + " strips left";
      if (item.givenQty > 0) {
        line += " (given " + item.givenQty + " of " + item.prescribedQty + ")";
      }
      return line;
    });

    return [
      new Date(rx.created).toLocaleString(),
      nameOf("patients", rx.pid),
      nameOf("users", rx.did),
      lines.join("<br>"),
      tag("status-none", "Pending"),
      `<button onclick="openDispense(${rx.id})">Dispense</button>`
    ];
  });

  $("page-queue").innerHTML =
    "<h2>Prescriptions</h2>" +
    makeTable(["Received", "Patient", "Doctor", "Prescription", "Status", ""], rows, "No prescriptions waiting.");
}

// ---------- Dispense popup ----------

function openDispense(prescriptionId) {

  let rx = findRow("rx", prescriptionId);
  let patient = findRow("patients", rx.pid);

  prescriptionBeingDispensed = rx;

  $("dispenseTitle").textContent =
    `Dispense to ${patient.name} (${patient.code}, ${patient.age} ${patient.gender})`;

  let html = "";

  rx.items.forEach((item, i) => {

    let medicine = findRow("meds", item.mid);
    let usable = getUsableStock(item.mid);
    let remaining = remainingOf(item);
    let most = Math.min(remaining, usable);

    // The last part of the box: a message, or the quantity input.
    let bottom = `<label>Quantity to dispense now (strips)</label>
      <input id="qty${i}" type="number" min="0" max="${most}" placeholder="Enter quantity">
      <p class="small-note">Maximum: ${most} strips</p>`;

    if (remaining <= 0) {
      bottom = '<p class="status-good">Fully given</p>';
    } else if (usable === 0) {
      bottom = '<p class="status-out">No usable stock - this medicine will stay in the list</p>';
    }

    html += `<div class="item">
      <p><b>${safe(medicine.name)}</b></p>
      <p>Prescription: ${item.prescribedQty} strips</p>
      ${item.givenQty > 0 ? `<p>Dispensed: ${item.givenQty} strips</p>` : ""}
      <p>Remaining: ${remaining} strips</p>
      <p>Available stock: ${usable} strips</p>
      <p>Price: ${money(medicine.price)} per strip</p>
      <p>Doctor's instruction: ${safe(item.dose)}</p>
      ${bottom}
    </div>`;
  });

  $("dispenseItems").innerHTML = html;
  $("dispenseDialog").showModal();
}

// Save the dispensing. The pharmacist may give less than prescribed.
function saveDispense() {

  let rx = prescriptionBeingDispensed;
  if (rx === null) return;

  let quantities = [];   // strips to give now, one number per item
  let planned = {};      // total per medicine (in case it appears twice)
  let summary = [];      // lines shown in the confirm box

  // STEP 1: check every medicine before changing any stock.
  for (let i = 0; i < rx.items.length; i++) {

    let item = rx.items[i];
    let medicine = findRow("meds", item.mid);
    let box = $("qty" + i);

    // No input box means: fully given, or no stock. Give 0.
    let quantity = box === null ? 0 : Number(box.value);

    if (!Number.isInteger(quantity) || quantity < 0) {
      return fail("Enter a valid quantity (0 or more).");
    }
    if (quantity > remainingOf(item)) {
      return fail("You cannot give more than what is left to dispense for " + medicine.name + ".");
    }

    planned[item.mid] = (planned[item.mid] || 0) + quantity;

    if (planned[item.mid] > getUsableStock(item.mid)) {
      return fail("Only " + getUsableStock(item.mid) + " strips of " + medicine.name + " are available.");
    }

    if (quantity > 0) summary.push(medicine.name + " - " + quantity + " strips");
    quantities.push(quantity);
  }

  if (summary.length === 0) {
    return fail("Enter a quantity for at least one medicine.");
  }

  // Dispensing cannot be undone, so ask first.
  if (!confirm("Dispense these medicines?\n\n" + summary.join("\n"))) return;

  // STEP 2: reduce the stock and build the updated items list.
  let patient = findRow("patients", rx.pid);
  let allDone = true;
  let newItems = [];

  for (let i = 0; i < rx.items.length; i++) {

    let item = rx.items[i];

    if (quantities[i] > 0 && !removeStockUsingFEFO(item.mid, quantities[i], "Dispensed to " + patient.name)) {
      return fail("Unable to update stock.");
    }

    let newItem = { ...item, givenQty: item.givenQty + quantities[i] };

    if (remainingOf(newItem) > 0) allDone = false;
    newItems.push(newItem);
  }

  // A prescription stays Pending until all prescribed quantities are given.
  // This keeps the user-facing workflow simple; givenQty tracks any quantity already given.
  let newStatus = allDone ? "dispensed" : "pending";

  updateRow("rx", rx.id, {
    status: newStatus,
    items: newItems,
    phid: pharmacist.id,
    dispensedOn: new Date().toISOString()
  });

  addToBill(rx, quantities);

  closeDialog("dispenseDialog");
  prescriptionBeingDispensed = null;
  drawQueue();

  let message = newStatus === "pending"
    ? "Available stock was dispensed. The remaining quantity stays in the Prescriptions list."
    : "Medicine dispensed successfully.";

  if (confirm(message + "\n\nPrint the pharmacy bill?")) {
    printBill(rx.id);
  }
}


// ---------- History (completed dispensing) ----------

function drawHistory(searchText = "") {

  let search = searchText.toLowerCase();
  let rows = [];

  // Everything that is not "pending", newest first.
  let done = getTable("rx").filter(rx => rx.status === "dispensed").reverse();

  for (let rx of done) {

    let lines = rx.items.map(item =>
      nameOf("meds", item.mid) + " × " + item.givenQty + " of " + item.prescribedQty + " strips"
    );

    // Search in plain text only (no HTML), so typing "br" does not match <br>.
    let plainText = [
      findRow("patients", rx.pid).name,
      findRow("users", rx.did).name,
      ...rx.items.map(item => findRow("meds", item.mid).name),
      rx.status
    ].join(" ").toLowerCase();

    if (!plainText.includes(search)) continue;

    let statuses = {
      dispensed: tag("status-good", "Dispensed")
    };

    let billButton = `<button class="light small-button" onclick="printBill(${rx.id})">Print Bill</button>`;

    rows.push([
      new Date(rx.dispensedOn).toLocaleString(),
      nameOf("patients", rx.pid),
      nameOf("users", rx.did),
      lines.join("<br>"),
      statuses[rx.status],
      billButton
    ]);
  }

  $("page-history").innerHTML =
    `<h2>History</h2>
     <input id="historySearch" placeholder="Search patient, doctor, medicine or status"
            value="${safe(searchText)}" oninput="runSearch('historySearch', drawHistory)">` +
    makeTable(["Date", "Patient", "Doctor", "Medicine dispensed", "Status", ""], rows, "Nothing here yet.");
}
