// ============================================================
// UTILS - small tools used by all the other files
// ============================================================

// Short name for document.getElementById
const $ = id => document.getElementById(id);

// Today's date as text, like 2026-09-29 (uses the computer's own date).
function today() {
  let d = new Date();

  return d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0");
}

// Make text safe to show inside HTML.
function safe(text) {
  let div = document.createElement("div");
  div.textContent = text == null ? "" : text;
  return div.innerHTML.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// Name of a patient / doctor / medicine, already made safe.
// table is "patients", "users" or "meds".
function nameOf(table, id) {
  let row = findRow(table, id);
  return row.name ? safe(row.name) : "Unknown";
}

// Money text like ₹25.00
function money(value) {
  return "₹" + Number(value || 0).toFixed(2);
}

// Round to 2 decimals, so money totals never show 0.1 + 0.2 = 0.30000000000000004
function round2(number) {
  return Math.round(number * 100) / 100;
}

// A coloured piece of text, e.g. tag("status-good", "Valid")
function tag(style, text) {
  return `<span class="${style}">${text}</span>`;
}

// Show an error message and return null (so we can write: return fail("..."))
function fail(message) {
  alert(message);
  return null;
}

function closeDialog(id) {
  $(id).close();
}

// Create a simple HTML table.
function makeTable(titles, rows, emptyMessage) {

  if (rows.length === 0) {
    return `<div class="empty">${emptyMessage}</div>`;
  }

  let head = "<tr><th>" + titles.join("</th><th>") + "</th></tr>";
  let body = rows.map(row => "<tr><td>" + row.join("</td><td>") + "</td></tr>").join("");

  return `<div class="table-wrap"><table>${head}${body}</table></div>`;
}

// Used by the search boxes: draw the page again with the typed text,
// then put the cursor back into the search box.
function runSearch(boxId, drawFunction) {

  let text = $(boxId).value;

  drawFunction(text);

  let box = $(boxId);   // the page was redrawn, so find the box again
  box.focus();
  box.setSelectionRange(text.length, text.length);
}
