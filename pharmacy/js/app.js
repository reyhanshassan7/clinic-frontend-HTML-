// ============================================================
// APP - login, logout, tab switching and start-up (loaded LAST)
// ============================================================

let pharmacist = null;   // the logged-in pharmacist

// ---------- Login / logout ----------

function login() {

  let username = $("username").value.trim();
  let password = $("password").value;

  let user = getTable("users").find(u =>
    u.role === "pharmacist" && u.username === username && u.password === password
  );

  if (!user) {
    $("loginError").textContent = "Wrong username or password.";
    return;
  }

  // sessionStorage: the login ends when the browser tab is closed.
  sessionStorage.setItem("cms_session", user.id);
  openPortal(user);
}

function logout() {
  sessionStorage.removeItem("cms_session");
  location.reload();
}

function openPortal(user) {

  pharmacist = user;

  $("loginPage").classList.add("hidden");
  $("portal").classList.remove("hidden");
  $("pharmacistName").textContent = user.name;

  showTab("dashboard");
}


// ---------- Tabs ----------

function showTab(name) {

  // Which function draws which page.
  let draw = {
    dashboard: drawDashboard,
    queue: drawQueue,
    stock: drawStock,
    history: drawHistory,
    bills: drawBills
  };

  // Show the chosen page, hide the others.
  for (let page in draw) {
    $("page-" + page).classList.toggle("hidden", page !== name);
    $("tab-" + page).classList.toggle("active", page === name);
  }

  draw[name]();
}


// ---------- Start ----------

// Pressing Enter in the login boxes signs in.
["username", "password"].forEach(id =>
  $(id).addEventListener("keydown", event => {
    if (event.key === "Enter") login();
  })
);

createSampleData();
addMoreSampleMedicineData();

const savedUser = findRow("users", sessionStorage.getItem("cms_session"));

if (savedUser && savedUser.role === "pharmacist") {
  openPortal(savedUser);
}
