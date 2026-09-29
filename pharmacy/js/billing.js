// ============================================================
// BILLING - one bill per prescription, built from what was really given
// ============================================================

// Find the bill of one prescription (null if there is none).
function getBillForPrescription(prescriptionId) {
  return getTable("bills").find(bill => bill.prescriptionId === prescriptionId) || null;
}

// Add the strips given in THIS visit to the bill.
// The first visit creates the bill. Each line keeps the price of the day it was given,
// so changing a medicine's price later never changes an old line.
function addToBill(rx, quantities) {

  let bill = getBillForPrescription(rx.id) || addRow("bills", {
    billNumber: "PHB-" + Date.now(),
    prescriptionId: rx.id,
    pid: rx.pid,
    did: rx.did,
    phid: pharmacist.id,
    items: [],
    total: 0
  });

  rx.items.forEach((item, i) => {

    if (quantities[i] <= 0) return;

    let price = Number(findRow("meds", item.mid).price || 0);

    // same medicine + same price = same line, a new price = a new line
    let line = bill.items.find(l => l.mid === item.mid && l.unitPrice === price);

    if (line) {
      line.quantity += quantities[i];
    } else {
      bill.items.push({ mid: item.mid, quantity: quantities[i], unitPrice: price, amount: 0 });
    }
  });

  bill.items.forEach(line => line.amount = round2(line.quantity * line.unitPrice));

  updateRow("bills", bill.id, {
    items: bill.items,
    total: round2(bill.items.reduce((sum, line) => sum + line.amount, 0)),
    phid: pharmacist.id
  });
}


// ---------- Bills page ----------

function drawBills() {

  let rows = getTable("bills").reverse().map(bill => [
    safe(bill.billNumber),
    nameOf("patients", bill.pid),
    new Date(bill.created).toLocaleString(),
    money(bill.total),
    `<button class="light small-button" onclick="printBill(${bill.prescriptionId})">Print Bill</button>`
  ]);

  $("page-bills").innerHTML =
    `<h2>Bills</h2>
     <p class="small-note">Pharmacy bills are generated from medicines actually dispensed.</p>` +
    makeTable(["Bill No.", "Patient", "Date", "Total", ""], rows, "No pharmacy bills generated yet.");
}


// ---------- Print bill ----------

function printBill(prescriptionId) {

  let rx = findRow("rx", prescriptionId);
  let bill = getBillForPrescription(prescriptionId);

  if (bill === null) {
    return fail("No bill found for this prescription.");
  }

  let lines = bill.items.map(item =>
    `<tr>
       <td>${nameOf("meds", item.mid)}</td>
       <td>${item.quantity} strips</td>
       <td class="right">${money(item.amount)}</td>
     </tr>`
  ).join("");

  let html = `<html><head><title>Pharmacy Bill</title><style>
      body { font-family: sans-serif; padding: 24px; max-width: 800px; margin: auto; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      th, td { border-bottom: 1px solid #999; padding: 8px; text-align: left; }
      .right { text-align: right; }
    </style></head><body>
      <h2>Pharmacy Bill</h2>
      <p>Bill No: ${safe(bill.billNumber)}<br>
         Date: ${new Date(bill.created).toLocaleString()}<br>
         Patient: ${nameOf("patients", rx.pid)}<br>
         Prescription: RX-${String(rx.id).padStart(4, "0")}<br>
         Doctor: ${nameOf("users", rx.did)}</p>
      <table>
        <tr><th>Medicine</th><th>Qty</th><th class="right">Amount</th></tr>
        ${lines}
        <tr><td colspan="2"><b>Total</b></td><td class="right"><b>${money(bill.total)}</b></td></tr>
      </table>
          </body></html>`;

  // Print from a hidden frame. Browsers can block pop-up windows, but not this.
  let frame = document.createElement("iframe");
  frame.style.cssText = "position:fixed; width:0; height:0; border:0;";

  frame.onload = () => {
    frame.contentWindow.onafterprint = () => frame.remove();
    frame.contentWindow.print();
  };

  frame.srcdoc = html;
  document.body.appendChild(frame);
}
