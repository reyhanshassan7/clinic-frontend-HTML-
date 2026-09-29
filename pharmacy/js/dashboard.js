// ============================================================
// DASHBOARD - number cards and the "needs attention" tables
// ============================================================

// One small number card.
function card(label, number) {
  return `<div class="card"><div class="label">${label}</div><div class="number">${number}</div></div>`;
}

function drawDashboard() {

  let medicines = getTable("meds");
  let prescriptions = getTable("rx");

  let pending = prescriptions.filter(isWaiting).length;
  let lowStock = medicines.filter(med => getUsableStock(med.id) <= med.min).length;

  let dispensedToday = prescriptions.filter(rx =>
    rx.status === "dispensed" &&
    rx.dispensedOn &&
    new Date(rx.dispensedOn).toLocaleDateString() === new Date().toLocaleDateString()
  ).length;

  $("page-dashboard").innerHTML =
    `<h2>Dashboard</h2>
     <div class="dashboard-cards">
       ${card("Pending prescriptions", pending)}
       ${card("Total medicines", medicines.length)}
       ${card("Low stock medicines", lowStock)}
       ${card("Dispensed today", dispensedToday)}
     </div>` +
    buildAlerts(medicines);
}

// Build the "needs attention" panel.
function buildAlerts(medicines) {

  let lowRows = [];
  let soonRows = [];
  let expiredRows = [];

  for (let med of medicines) {

    let usable = getUsableStock(med.id);

    if (usable <= med.min) {
      lowRows.push([safe(med.name), usable + " strips", med.min + " strips"]);
    }

    for (let batch of getMedicineBatches(med.id)) {

      if (batch.strips <= 0) continue;

      let info = [safe(med.name), safe(batch.batchNumber), batch.strips + " strips"];

      if (isExpired(batch)) {
        expiredRows.push(info.concat(batch.expiryDate));
      } else if (daysToExpiry(batch) <= 30) {
        soonRows.push(info.concat(batch.expiryDate + " (" + daysToExpiry(batch) + " days)"));
      }
    }
  }

  return `<h3>Needs attention</h3>
    <h4>Low or out of stock</h4>` +
    makeTable(["Medicine", "Usable stock", "Minimum"], lowRows, "Nothing running low.") +
    "<h4>Expiring within 30 days</h4>" +
    makeTable(["Medicine", "Batch", "Strips", "Expiry"], soonRows, "No batches expiring soon.") +
    "<h4>Expired batches still in stock</h4>" +
    makeTable(["Medicine", "Batch", "Strips", "Expired on"], expiredRows, "No expired stock.");
}
