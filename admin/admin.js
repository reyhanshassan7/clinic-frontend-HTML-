
/* =====================================================
   ADMIN FRONTEND
   Data is stored only in LocalStorage.
   Django / Backend is NOT used.
===================================================== */


/* =====================================================
   DEFAULT DATA
===================================================== */

const defaultRoles = [
    {
        id: 1,
        name: "Admin",
        active: true
    },
    {
        id: 2,
        name: "Doctor",
        active: true
    },
    {
        id: 3,
        name: "Receptionist",
        active: true
    },
    {
        id: 4,
        name: "Pharmacist",
        active: true
    },
    {
        id: 5,
        name: "LabTech",
        active: true
    }
];


const defaultDepartments = [
    {
        id: 1,
        name: "Cardiology"
    },
    {
        id: 2,
        name: "Dermatology"
    },
    {
        id: 3,
        name: "Orthopedics"
    },
    {
        id: 4,
        name: "General Medicine"
    }
];

const LOW_STOCK_THRESHOLD = 10;


/* =====================================================
   LOCAL STORAGE
===================================================== */

function getData(key, defaultValue) {

    const data = localStorage.getItem(key);

    if (data) {

        try {

            return JSON.parse(data);

        } catch (error) {

            console.error(
                "Invalid localStorage data for:",
                key
            );

            localStorage.removeItem(key);
        }
    }


    localStorage.setItem(
        key,
        JSON.stringify(defaultValue)
    );

    return defaultValue;
}


function saveData(key, data) {

    localStorage.setItem(
        key,
        JSON.stringify(data)
    );
}


function getMedicines() {

    const medicines = getData("medicines", []);
    const normalized = medicines.map(function (medicine) {
        return {
            ...medicine,
            manufacturer: medicine.manufacturer || "",
            stock: Number.isInteger(Number(medicine.stock)) ? Number(medicine.stock) : 0,
            price: Number(medicine.price ?? medicine.mrp ?? medicine.cost ?? 0),
            expiry_date: medicine.expiry_date || "",
            is_active: medicine.is_active ?? medicine.active ?? true
        };
    });

    if (JSON.stringify(normalized) !== JSON.stringify(medicines)) {
        saveData("medicines", normalized);
    }

    return normalized;
}


let pendingDeleteAction = null;


function showMessage(message, title = "Notice") {

    document.getElementById("messageTitle").textContent = title;
    document.getElementById("messageText").textContent = message;
    document.getElementById("messageDialog").showModal();
}


function closeMessageDialog() {

    document.getElementById("messageDialog").close();
}


function requestDeleteConfirmation(message, action, title = "Confirm Delete", buttonLabel = "Delete") {

    pendingDeleteAction = action;
    document.getElementById("deleteTitle").textContent = title;
    document.getElementById("deleteMessage").textContent = message;
    document.getElementById("deleteActionButton").textContent = buttonLabel;
    document.getElementById("deleteDialog").showModal();
}


function closeDeleteDialog() {

    pendingDeleteAction = null;
    document.getElementById("deleteDialog").close();
}


function confirmDelete() {

    const action = pendingDeleteAction;
    pendingDeleteAction = null;
    document.getElementById("deleteDialog").close();

    if (action) {
        action();
    }
}


/* =====================================================
   ADMIN LOGIN SETUP
===================================================== */

function setupAdmin() {

    if (!localStorage.getItem("adminAccount")) {
        localStorage.setItem(
            "adminAccount",
            JSON.stringify({
                username: "admin",
                password: "admin123",
                name: "Clinic Admin"
            })
        );
    }

    document
        .getElementById("adminLogin")
        .classList.remove("hidden");
}


setupAdmin();


/* =====================================================
   LOGIN
===================================================== */

function login() {

    const usernameElement =
        document.getElementById("loginUsername");

    const passwordElement =
        document.getElementById("loginPassword");

    const errorElement =
        document.getElementById("loginError");


    if (
        !usernameElement ||
        !passwordElement ||
        !errorElement
    ) {

        console.error(
            "Login HTML elements are missing."
        );

        return;
    }


    const username =
        usernameElement.value.trim();

    const password =
        passwordElement.value;


    const adminData =
        localStorage.getItem("adminAccount");


    if (!adminData) {

        errorElement.textContent =
            "Admin account not found.";

        return;
    }


    let admin;


    try {

        admin = JSON.parse(adminData);

    } catch (error) {

        errorElement.textContent =
            "Admin account data is invalid.";

        return;
    }


    if (
        username === admin.username &&
        password === admin.password
    ) {

        localStorage.setItem(
            "adminLoggedIn",
            "true"
        );


        document
            .getElementById("loginPage")
            .classList.add("hidden");


        document
            .getElementById("portal")
            .classList.remove("hidden");


        document
            .getElementById("adminName")
            .textContent = admin.name;


        errorElement.textContent = "";


        loadAll();

        showTab("dashboard");

    } else {

        errorElement.textContent =
            "Invalid username or password.";
    }
}


/* =====================================================
   LOGOUT
===================================================== */

function logout() {

    requestDeleteConfirmation(
        "Are you sure you want to log out?",
        function () {
            localStorage.removeItem("adminLoggedIn");
            location.reload();
        },
        "Confirm Logout",
        "Logout"
    );
}


/* =====================================================
   DOCTOR FIELD SETUP
===================================================== */

function updateStaffRoleFields() {
    const staffRole =
        document.getElementById("staffRole");

    const doctorFields =
        document.getElementById("doctorFields");

    const departmentField =
        document.getElementById("departmentField");


    if (
        !staffRole ||
        !doctorFields ||
        !departmentField
    ) {
        return;
    }

    const isDoctor =
        staffRole.value === "Doctor";

    doctorFields.classList.toggle("hidden", !isDoctor);
    departmentField.classList.toggle("hidden", !isDoctor);

    if (!isDoctor) {
        document.getElementById("staffDepartment").value = "";

        doctorFields
            .querySelectorAll("input")
            .forEach(function (field) {
                field.value = "";
            });
    }
}


function setupDoctorFields() {

    const staffRole =
        document.getElementById("staffRole");

    if (!staffRole) {
        return;
    }

    staffRole.addEventListener("change", updateStaffRoleFields);
    updateStaffRoleFields();
}


/* =====================================================
   PAGE LOAD
===================================================== */

window.onload = function () {

    setupDoctorFields();


    if (
        localStorage.getItem(
            "adminLoggedIn"
        ) === "true"
    ) {

        document
            .getElementById("loginPage")
            .classList.add("hidden");


        document
            .getElementById("portal")
            .classList.remove("hidden");


        const adminData =
            localStorage.getItem(
                "adminAccount"
            );


        if (adminData) {

            const admin =
                JSON.parse(adminData);


            document
                .getElementById("adminName")
                .textContent = admin.name;
        }


        loadAll();

        showTab("dashboard");
    }
};


/* =====================================================
   TAB NAVIGATION
===================================================== */

function showTab(tab) {

    const pages = [
        "dashboard",
        "staff",
        "roles",
        "departments",
        "medicines",
        "labs"
    ];


    pages.forEach(function (page) {

        const pageElement =
            document.getElementById(
                "page-" + page
            );

        const tabElement =
            document.getElementById(
                "tab-" + page
            );


        if (pageElement) {

            pageElement
                .classList
                .add("hidden");
        }


        if (tabElement) {

            tabElement
                .classList
                .remove("active");
        }
    });


    const currentPage =
        document.getElementById(
            "page-" + tab
        );

    const currentTab =
        document.getElementById(
            "tab-" + tab
        );


    if (currentPage) {

        currentPage
            .classList
            .remove("hidden");
    }


    if (currentTab) {

        currentTab
            .classList
            .add("active");
    }


    if (tab === "dashboard") {
        updateDashboard();
    }


    if (tab === "staff") {
        loadStaff();
    }


    if (tab === "roles") {
        loadRoles();
    }


    if (tab === "departments") {
        loadDepartments();
    }


    if (tab === "medicines") {
        loadMedicines();
    }


    if (tab === "labs") {
        loadLabs();
    }
}


/* =====================================================
   LOAD ALL
===================================================== */

function loadAll() {

    getData(
        "roles",
        defaultRoles
    );


    getData(
        "departments",
        defaultDepartments
    );


    getData(
        "staff",
        []
    );


    getMedicines();


    getData(
        "labs",
        []
    );


    loadRoles();

    loadDepartments();

    loadStaff();

    loadMedicines();

    loadLabs();

    updateDashboard();
}


/* =====================================================
   DASHBOARD
===================================================== */

function updateDashboard() {

    const roles =
        getData(
            "roles",
            defaultRoles
        );


    const staff =
        getData(
            "staff",
            []
        );


    const departments =
        getData(
            "departments",
            defaultDepartments
        );


    const medicines = getMedicines();


    const labs =
        getData(
            "labs",
            []
        );


    const staffCount =
        document.getElementById(
            "staffCount"
        );

    const roleCount =
        document.getElementById(
            "roleCount"
        );

    const departmentCount =
        document.getElementById(
            "departmentCount"
        );

    const medicineCount =
        document.getElementById(
            "medicineCount"
        );

    const labCount =
        document.getElementById(
            "labCount"
        );


    if (staffCount) {
        staffCount.textContent =
            staff.length;
    }


    if (roleCount) {
        roleCount.textContent =
            roles.length;
    }


    if (departmentCount) {
        departmentCount.textContent =
            departments.length;
    }


    if (medicineCount) {
        medicineCount.textContent =
            medicines.length;
    }


    updateMedicineStockAlert(medicines);


    if (labCount) {
        labCount.textContent =
            labs.length;
    }
}


function updateMedicineStockAlert(medicines) {

    const alertContainer =
        document.getElementById("medicineStockAlert");

    if (!alertContainer) {
        return;
    }

    const activeMedicines = medicines.filter(medicine => medicine.is_active);
    const outOfStock = activeMedicines.filter(medicine => medicine.stock === 0);
    const lowStock = activeMedicines.filter(
        medicine => medicine.stock > 0 && medicine.stock <= LOW_STOCK_THRESHOLD
    );

    alertContainer.replaceChildren();
    alertContainer.classList.toggle(
        "hidden",
        outOfStock.length === 0 && lowStock.length === 0
    );

    if (alertContainer.classList.contains("hidden")) {
        return;
    }

    const heading = document.createElement("strong");
    heading.textContent = `Medicine stock alert (low stock: ${LOW_STOCK_THRESHOLD} or less)`;

    const list = document.createElement("ul");
    [...outOfStock, ...lowStock].forEach(function (medicine) {
        const item = document.createElement("li");
        item.textContent = medicine.stock === 0
            ? `${medicine.name}: Out of stock`
            : `${medicine.name}: Low stock (${medicine.stock} left)`;
        list.appendChild(item);
    });

    alertContainer.append(heading, list);
}


/* =====================================================
   ROLES
===================================================== */

function loadRoles() {

    const roles =
        getData(
            "roles",
            defaultRoles
        );


    const table =
        document.getElementById(
            "roleTable"
        );


    if (!table) {
        return;
    }


    table.innerHTML = "";


    if (roles.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="4">
                    No roles found.
                </td>
            </tr>
        `;

        return;
    }


    roles.forEach(function (role) {

        table.innerHTML += `
            <tr>

                <td>${role.id}</td>

                <td>${role.name}</td>

                <td>
                    ${role.active ? "Active" : "Inactive"}
                </td>

                <td>

                    <button
                        onclick="editRole(${role.id})">
                        Edit
                    </button>

                    <button
                        class="light"
                        onclick="deleteRole(${role.id})">
                        Delete
                    </button>

                </td>

            </tr>
        `;
    });


    updateDashboard();
}


function openRoleForm() {

    document.getElementById(
        "roleId"
    ).value = "";


    document.getElementById(
        "roleName"
    ).value = "";


    document.getElementById(
        "roleActive"
    ).checked = true;


    document.getElementById(
        "roleFormTitle"
    ).textContent = "Add Role";


    document
        .getElementById("roleDialog")
        .showModal();
}


function closeRoleForm() {

    document
        .getElementById("roleDialog")
        .close();
}


function saveRole() {

    const name =
        document
            .getElementById("roleName")
            .value
            .trim();


    const active =
        document
            .getElementById("roleActive")
            .checked;


    const id =
        document
            .getElementById("roleId")
            .value;


    if (!name) {

        showMessage("Please enter role name.", "Check details");

        return;
    }


    let roles =
        getData(
            "roles",
            defaultRoles
        );


    if (id) {

        const role =
            roles.find(
                r => r.id == id
            );


        if (role) {

            role.name = name;

            role.active = active;
        }

    } else {

        const newId =
            roles.length
                ? Math.max(
                    ...roles.map(
                        r => r.id
                    )
                ) + 1
                : 1;


        roles.push({

            id: newId,

            name: name,

            active: active
        });
    }


    saveData(
        "roles",
        roles
    );


    closeRoleForm();

    loadRoles();
}


function editRole(id) {

    const roles =
        getData(
            "roles",
            defaultRoles
        );


    const role =
        roles.find(
            r => r.id === id
        );


    if (!role) {
        return;
    }


    document.getElementById(
        "roleId"
    ).value = role.id;


    document.getElementById(
        "roleName"
    ).value = role.name;


    document.getElementById(
        "roleActive"
    ).checked = role.active;


    document.getElementById(
        "roleFormTitle"
    ).textContent = "Edit Role";


    document
        .getElementById("roleDialog")
        .showModal();
}


function deleteRole(id) {

    const roles =
        getData(
            "roles",
            defaultRoles
        );


    const role = roles.find(item => item.id === id);

    if (!role) {
        return;
    }

    requestDeleteConfirmation(`Delete ${role.name}?`, function () {
        saveData(
            "roles",
            roles.filter(item => item.id !== id)
        );

        loadRoles();
    });
}


/* =====================================================
   STAFF
===================================================== */

function loadStaff() {

    const staff =
        getData(
            "staff",
            []
        );


    const table =
        document.getElementById(
            "staffTable"
        );


    if (!table) {
        return;
    }


    table.innerHTML = "";


    if (staff.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="8">
                    No staff found.
                </td>
            </tr>
        `;

        return;
    }


    staff.forEach(function (person) {

        table.innerHTML += `
            <tr>

                <td>${person.id}</td>

                <td>${person.name}</td>

                <td>${person.username}</td>

                <td>${person.role}</td>

                <td>${person.department || "-"}</td>

                <td>${person.phone || "-"}</td>

                <td>
                    ${person.active ? "Active" : "Inactive"}
                </td>

                <td>

                    <button
                        onclick="editStaff(${person.id})">
                        Edit
                    </button>

                    <button
                        class="light"
                        onclick="deleteStaff(${person.id})">
                        Delete
                    </button>

                </td>

            </tr>
        `;
    });


    updateDashboard();
}


function openStaffForm() {

    clearStaffForm();

    loadRoleOptions();

    loadDepartmentOptions();

    updateStaffRoleFields();


    document.getElementById(
        "staffFormTitle"
    ).textContent = "Add Staff";


    document
        .getElementById("staffDialog")
        .showModal();
}


function closeStaffForm() {

    document
        .getElementById("staffDialog")
        .close();
}


function clearStaffForm() {

    document.getElementById(
        "staffId"
    ).value = "";


    document.getElementById(
        "staffName"
    ).value = "";


    document.getElementById(
        "staffUsername"
    ).value = "";


    document.getElementById(
        "staffPassword"
    ).value = "";

    document.getElementById(
        "staffPassword"
    ).type = "password";

    document.getElementById("staffPasswordEye").classList.remove("hidden");
    document.getElementById("staffPasswordEyeOff").classList.add("hidden");

    const passwordToggle =
        document.getElementById("staffPasswordToggle");

    passwordToggle.setAttribute("aria-pressed", "false");
    passwordToggle.setAttribute("aria-label", "Show password");
    passwordToggle.title = "Show password";


    document.getElementById(
        "staffGender"
    ).value = "";


    document.getElementById(
        "staffDob"
    ).value = "";


    document.getElementById(
        "staffPhone"
    ).value = "";


    document.getElementById(
        "staffEmail"
    ).value = "";


    document.getElementById(
        "staffRole"
    ).value = "";


    document.getElementById(
        "staffDepartment"
    ).value = "";


    document.getElementById(
        "specialization"
    ).value = "";


    document.getElementById(
        "consultationFee"
    ).value = "";


    document.getElementById(
        "qualification"
    ).value = "";


    document.getElementById(
        "experienceYears"
    ).value = "";


    document.getElementById(
        "licenseNumber"
    ).value = "";


    document.getElementById(
        "staffActive"
    ).checked = true;


    document
        .getElementById("doctorFields")
        .classList
        .add("hidden");
}


function toggleStaffPasswordVisibility() {

    const passwordField =
        document.getElementById("staffPassword");

    const toggleButton =
        document.getElementById("staffPasswordToggle");

    const shouldShow =
        passwordField.type === "password";

    passwordField.type = shouldShow ? "text" : "password";
    document.getElementById("staffPasswordEye")
        .classList.toggle("hidden", shouldShow);
    document.getElementById("staffPasswordEyeOff")
        .classList.toggle("hidden", !shouldShow);

    const actionLabel = shouldShow ? "Hide password" : "Show password";
    toggleButton.setAttribute("aria-label", actionLabel);
    toggleButton.title = actionLabel;
    toggleButton.setAttribute("aria-pressed", String(shouldShow));
}


/* =====================================================
   ROLE OPTIONS
===================================================== */

function loadRoleOptions() {

    const roles =
        getData(
            "roles",
            defaultRoles
        );


    const select =
        document.getElementById(
            "staffRole"
        );


    if (!select) {
        return;
    }


    select.innerHTML = `
        <option value="">
            Select Role
        </option>
    `;


    roles
        .filter(
            role => role.active
        )
        .forEach(function (role) {

            select.innerHTML += `
                <option value="${role.name}">
                    ${role.name}
                </option>
            `;
        });
}


/* =====================================================
   DEPARTMENT OPTIONS
===================================================== */

function loadDepartmentOptions() {

    const departments =
        getData(
            "departments",
            defaultDepartments
        );


    const select =
        document.getElementById(
            "staffDepartment"
        );


    if (!select) {
        return;
    }


    select.innerHTML = `
        <option value="">
            Select Department
        </option>
    `;


    departments.forEach(
        function (department) {

            select.innerHTML += `
                <option value="${department.name}">
                    ${department.name}
                </option>
            `;
        }
    );
}


/* =====================================================
   SAVE STAFF
===================================================== */

function saveStaff() {

    const id =
        document.getElementById(
            "staffId"
        ).value;


    const name =
        document.getElementById(
            "staffName"
        ).value.trim();


    const username =
        document.getElementById(
            "staffUsername"
        ).value.trim();


    const password =
        document.getElementById(
            "staffPassword"
        ).value;


    const gender =
        document.getElementById(
            "staffGender"
        ).value;


    const dob =
        document.getElementById(
            "staffDob"
        ).value;


    const phone =
        document.getElementById(
            "staffPhone"
        ).value.trim();


    const email =
        document.getElementById(
            "staffEmail"
        ).value.trim();


    const role =
        document.getElementById(
            "staffRole"
        ).value;


    const department =
        document.getElementById(
            "staffDepartment"
        ).value;


    const active =
        document.getElementById(
            "staffActive"
        ).checked;


    if (!name) {

        showMessage("Enter full name.", "Check details");

        return;
    }


    if (!username) {

        showMessage("Enter username.", "Check details");

        return;
    }


    if (username.length < 3) {
        showMessage("Username must be at least 3 characters.", "Check details");
        return;
    }


    if ((!id && !password) || (password && password.length < 8)) {

        showMessage("Password must be at least 8 characters.", "Check details");

        return;
    }


    if (!role) {

        showMessage("Select role.", "Check details");

        return;
    }


    if (role === "Doctor" && !department) {
        showMessage("Select a department for the doctor.", "Check details");
        return;
    }


    let staff =
        getData(
            "staff",
            []
        );


    const duplicate =
        staff.find(
            function (person) {

                return (
                    person.username
                        .toLowerCase() ===
                    username.toLowerCase() &&
                    person.id != id
                );
            }
        );


    if (duplicate) {

        showMessage("Username already exists.", "Check details");

        return;
    }


    const specialization =
        document.getElementById(
            "specialization"
        ).value;


    const consultationFee =
        document.getElementById(
            "consultationFee"
        ).value;


    const qualification =
        document.getElementById(
            "qualification"
        ).value;


    const experienceYears =
        document.getElementById(
            "experienceYears"
        ).value;


    const licenseNumber =
        document.getElementById(
            "licenseNumber"
        ).value;


    if (id) {

        const person =
            staff.find(
                p => p.id == id
            );


        if (!person) {
            return;
        }


        person.name = name;

        person.username = username;


        if (password) {

            person.password =
                password;
        }


        person.gender = gender;

        person.dob = dob;

        person.phone = phone;

        person.email = email;

        person.role = role;

        person.department =
            department;

        person.active = active;

        person.specialization =
            specialization;

        person.consultationFee =
            consultationFee;

        person.qualification =
            qualification;

        person.experienceYears =
            experienceYears;

        person.licenseNumber =
            licenseNumber;


    } else {

        const newId =
            staff.length
                ? Math.max(
                    ...staff.map(
                        p => p.id
                    )
                ) + 1
                : 1;


        staff.push({

            id: newId,

            name: name,

            username: username,

            password: password,

            gender: gender,

            dob: dob,

            phone: phone,

            email: email,

            role: role,

            department: department,

            active: active,

            specialization:
                specialization,

            consultationFee:
                consultationFee,

            qualification:
                qualification,

            experienceYears:
                experienceYears,

            licenseNumber:
                licenseNumber
        });
    }


    saveData(
        "staff",
        staff
    );


    closeStaffForm();

    loadStaff();

    updateDashboard();

    showMessage("Staff saved successfully.", "Success");
}


/* =====================================================
   EDIT STAFF
===================================================== */

function editStaff(id) {

    const staff =
        getData(
            "staff",
            []
        );


    const person =
        staff.find(
            p => p.id === id
        );


    if (!person) {
        return;
    }


    loadRoleOptions();

    loadDepartmentOptions();


    document.getElementById(
        "staffId"
    ).value = person.id;


    document.getElementById(
        "staffName"
    ).value = person.name;


    document.getElementById(
        "staffUsername"
    ).value =
        person.username;


    document.getElementById(
        "staffPassword"
    ).value = person.password || "";

    document.getElementById(
        "staffPassword"
    ).type = "text";

    document.getElementById("staffPasswordEye").classList.add("hidden");
    document.getElementById("staffPasswordEyeOff").classList.remove("hidden");

    const passwordToggle =
        document.getElementById("staffPasswordToggle");

    passwordToggle.setAttribute("aria-pressed", "true");
    passwordToggle.setAttribute("aria-label", "Hide password");
    passwordToggle.title = "Hide password";


    document.getElementById(
        "staffGender"
    ).value =
        person.gender || "";


    document.getElementById(
        "staffDob"
    ).value =
        person.dob || "";


    document.getElementById(
        "staffPhone"
    ).value =
        person.phone || "";


    document.getElementById(
        "staffEmail"
    ).value =
        person.email || "";


    document.getElementById(
        "staffRole"
    ).value =
        person.role || "";


    document.getElementById(
        "staffDepartment"
    ).value =
        person.department || "";


    document.getElementById(
        "specialization"
    ).value =
        person.specialization || "";


    document.getElementById(
        "consultationFee"
    ).value =
        person.consultationFee || "";


    document.getElementById(
        "qualification"
    ).value =
        person.qualification || "";


    document.getElementById(
        "experienceYears"
    ).value =
        person.experienceYears || "";


    document.getElementById(
        "licenseNumber"
    ).value =
        person.licenseNumber || "";


    document.getElementById(
        "staffActive"
    ).checked =
        person.active;


    updateStaffRoleFields();


    document.getElementById(
        "staffFormTitle"
    ).textContent =
        "Edit Staff";


    document
        .getElementById("staffDialog")
        .showModal();
}


/* =====================================================
   DELETE STAFF
===================================================== */

function deleteStaff(id) {

    const staff =
        getData(
            "staff",
            []
        );


    const person =
        staff.find(
            p => p.id === id
        );


    if (!person) {
        return;
    }


    requestDeleteConfirmation(`Delete ${person.name}?`, function () {
        saveData(
            "staff",
            staff.filter(p => p.id !== id)
        );

        loadStaff();
        updateDashboard();
    });
}


/* =====================================================
   DEPARTMENTS
===================================================== */

function loadDepartments() {

    const departments =
        getData(
            "departments",
            defaultDepartments
        );


    const table =
        document.getElementById(
            "departmentTable"
        );


    if (!table) {
        return;
    }


    table.innerHTML = "";


    if (departments.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="3">
                    No departments found.
                </td>
            </tr>
        `;

        return;
    }


    departments.forEach(
        function (department) {

            table.innerHTML += `
                <tr>

                    <td>
                        ${department.id}
                    </td>

                    <td>
                        ${department.name}
                    </td>

                    <td>

                        <button
                            class="light"
                            onclick="deleteDepartment(${department.id})">
                            Delete
                        </button>

                    </td>

                </tr>
            `;
        }
    );


    updateDashboard();
}


function addDepartment() {

    document.getElementById("departmentName").value = "";
    document.getElementById("departmentError").textContent = "";
    document.getElementById("departmentDialog").showModal();
}


function closeDepartmentForm() {

    document.getElementById("departmentDialog").close();
}


function saveDepartment() {

    const cleanName =
        document.getElementById("departmentName").value.trim();

    const errorElement =
        document.getElementById("departmentError");

    if (!cleanName) {
        errorElement.textContent = "Enter department name.";
        return;
    }


    let departments =
        getData(
            "departments",
            defaultDepartments
        );


    const exists =
        departments.some(
            department =>
                department.name
                    .toLowerCase() ===
                cleanName.toLowerCase()
        );


    if (exists) {
        errorElement.textContent = "Department already exists.";
        return;
    }


    const newId =
        departments.length
            ? Math.max(
                ...departments.map(
                    d => d.id
                )
            ) + 1
            : 1;


    departments.push({

        id: newId,

        name: cleanName
    });


    saveData(
        "departments",
        departments
    );


    closeDepartmentForm();
    loadDepartments();
    loadDepartmentOptions();
}


function deleteDepartment(id) {

    const departments =
        getData(
            "departments",
            defaultDepartments
        );


    requestDeleteConfirmation("Delete this department?", function () {
        saveData(
            "departments",
            departments.filter(department => department.id !== id)
        );

        loadDepartments();
        loadDepartmentOptions();
    });
}


/* =====================================================
   MEDICINES
===================================================== */

function loadMedicines() {

    const medicines = getMedicines();


    const table =
        document.getElementById(
            "medicineTable"
        );


    if (!table) {
        return;
    }


    table.innerHTML = "";


    if (medicines.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="8">
                    No medicines found.
                </td>
            </tr>
        `;

        return;
    }


    medicines.forEach(
        function (medicine) {

            table.innerHTML += `
                <tr>

                    <td>
                        ${medicine.id}
                    </td>

                    <td>
                        ${medicine.name}
                    </td>

                    <td>
                        ${medicine.manufacturer}
                    </td>

                    <td>
                        ${medicine.stock}
                    </td>

                    <td>
                        ${Number(medicine.price).toFixed(2)}
                    </td>

                    <td>
                        ${medicine.expiry_date || "-"}
                    </td>

                    <td>
                        ${medicine.is_active ? "Active" : "Inactive"}
                    </td>

                    <td>

                        <button
                            onclick="editMedicine(${medicine.id})">
                            Edit
                        </button>

                        <button
                            class="light"
                            onclick="deleteMedicine(${medicine.id})">
                            Delete
                        </button>

                    </td>

                </tr>
            `;
        }
    );


    updateDashboard();
}


function addMedicine() {

    ["medicineId", "medicineName", "medicineManufacturer", "medicineStock", "medicinePrice", "medicineExpiryDate"]
        .forEach(function (id) {
            document.getElementById(id).value = "";
        });

    document.getElementById("medicineIsActive").checked = true;
    document.getElementById("medicineFormTitle").textContent = "Add Medicine";
    document.getElementById("medicineError").textContent = "";
    document.getElementById("medicineDialog").showModal();
}


function closeMedicineForm() {

    document.getElementById("medicineDialog").close();
}


function saveMedicine() {

    const id =
        document.getElementById("medicineId").value;

    const name =
        document.getElementById("medicineName").value.trim();

    const manufacturer =
        document.getElementById("medicineManufacturer").value.trim();

    const stockValue =
        document.getElementById("medicineStock").value;

    const priceValue =
        document.getElementById("medicinePrice").value;

    const expiryDate =
        document.getElementById("medicineExpiryDate").value;

    const isActive =
        document.getElementById("medicineIsActive").checked;

    const errorElement =
        document.getElementById("medicineError");

    if (!name || stockValue === "" || priceValue === "") {
        errorElement.textContent = "Enter medicine name, stock, and price.";
        return;
    }

    const stock = Number(stockValue);
    const price = Number(priceValue);

    if (!Number.isInteger(stock) || stock < 0) {
        errorElement.textContent = "Stock must be a whole number of 0 or more.";
        return;
    }

    if (!Number.isFinite(price) || price < 0) {
        errorElement.textContent = "Enter a valid non-negative price.";
        return;
    }


    const medicines = getMedicines();
    const medicineData = {
        name: name,
        manufacturer: manufacturer || null,
        stock: stock,
        price: price,
        expiry_date: expiryDate || null,
        is_active: isActive
    };

    if (id) {
        const medicine = medicines.find(item => item.id == id);

        if (!medicine) {
            return;
        }

        Object.assign(medicine, medicineData);
    } else {
        const newId = medicines.length
            ? Math.max(...medicines.map(medicine => medicine.id)) + 1
            : 1;

        medicines.push({id: newId, ...medicineData});
    }


    saveData(
        "medicines",
        medicines
    );


    closeMedicineForm();
    loadMedicines();
    updateDashboard();
    showMessage("Medicine saved successfully.", "Success");
}


function editMedicine(id) {

    const medicine = getMedicines().find(item => item.id === id);

    if (!medicine) {
        return;
    }

    document.getElementById("medicineId").value = medicine.id;
    document.getElementById("medicineName").value = medicine.name || "";
    document.getElementById("medicineManufacturer").value = medicine.manufacturer || "";
    document.getElementById("medicineStock").value = medicine.stock;
    document.getElementById("medicinePrice").value = medicine.price;
    document.getElementById("medicineExpiryDate").value = medicine.expiry_date || "";
    document.getElementById("medicineIsActive").checked = medicine.is_active;
    document.getElementById("medicineFormTitle").textContent = "Edit Medicine";
    document.getElementById("medicineError").textContent = "";
    document.getElementById("medicineDialog").showModal();
}


function deleteMedicine(id) {

    const medicines =
        getData(
            "medicines",
            []
        );


    requestDeleteConfirmation("Delete this medicine?", function () {
        saveData(
            "medicines",
            medicines.filter(medicine => medicine.id !== id)
        );

        loadMedicines();
        updateDashboard();
    });
}


/* =====================================================
   LAB TESTS
===================================================== */

function loadLabs() {

    const labs =
        getData(
            "labs",
            []
        );


    const table =
        document.getElementById(
            "labTable"
        );


    if (!table) {
        return;
    }


    table.innerHTML = "";


    if (labs.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="6">
                    No laboratory tests found.
                </td>
            </tr>
        `;

        return;
    }


    labs.forEach(
        function (lab) {

            table.innerHTML += `
                <tr>

                    <td>
                        ${lab.id}
                    </td>

                    <td>
                        ${lab.department}
                    </td>

                    <td>
                        ${lab.name}
                    </td>

                    <td>
                        ${lab.normalValues}
                    </td>

                    <td>
                        ${lab.cost}
                    </td>

                    <td>

                        <button
                            class="light"
                            onclick="deleteLabTest(${lab.id})">
                            Delete
                        </button>

                    </td>

                </tr>
            `;
        }
    );


    updateDashboard();
}


function addLabTest() {

    const departmentSelect =
        document.getElementById("labDepartment");

    const departments =
        getData("departments", defaultDepartments);

    departmentSelect.innerHTML = `
        <option value="">Select Department</option>
        ${departments.map(department => `
            <option value="${department.name}">${department.name}</option>
        `).join("")}
    `;

    document.getElementById("labName").value = "";
    document.getElementById("labNormalValues").value = "";
    document.getElementById("labCost").value = "";
    document.getElementById("labError").textContent = "";
    document.getElementById("labDialog").showModal();
}


function closeLabForm() {

    document.getElementById("labDialog").close();
}


function saveLabTest() {

    const department =
        document.getElementById("labDepartment").value;

    const name =
        document.getElementById("labName").value.trim();

    const normalValues =
        document.getElementById("labNormalValues").value.trim();

    const cost =
        document.getElementById("labCost").value;

    const errorElement =
        document.getElementById("labError");

    if (!department || !name || !normalValues || cost === "") {
        errorElement.textContent = "Enter all lab test details.";
        return;
    }

    if (!Number.isFinite(Number(cost)) || Number(cost) < 0) {
        errorElement.textContent = "Enter a valid non-negative cost.";
        return;
    }


    let labs =
        getData(
            "labs",
            []
        );


    const newId =
        labs.length
            ? Math.max(
                ...labs.map(
                    l => l.id
                )
            ) + 1
            : 1;


    labs.push({

        id: newId,

        department:
            department.trim(),

        name:
            name.trim(),

        normalValues:
            normalValues.trim(),

        cost: Number(cost)
    });


    saveData(
        "labs",
        labs
    );


    closeLabForm();
    loadLabs();

    updateDashboard();
}


function deleteLabTest(id) {

    const labs =
        getData(
            "labs",
            []
        );


    requestDeleteConfirmation("Delete this lab test?", function () {
        saveData(
            "labs",
            labs.filter(lab => lab.id !== id)
        );

        loadLabs();
        updateDashboard();
    });
}

