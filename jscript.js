const BACKEND_URL = "https://test-7j0h.onrender.com";

const signupForm = document.getElementById('signupForm');
const loginForm = document.getElementById('loginForm');

const fname = document.getElementById('name-input');
const emaili = document.getElementById('email-input');
const passwordi = document.getElementById('password-input');
const repass = document.getElementById('repassword-input');
const error_message = document.getElementById("error-message");

// ---------------- SIGNUP ----------------
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = fname.value.trim();
    const email = emaili.value.trim().toLowerCase()
    const password = passwordi.value;
    const passwordcheck = repass.value;

    let errors = getSignupFormErrors(name, email, password, passwordcheck);
    if (errors.length > 0) {
      error_message.innerText = errors.join(". ");
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();

      if (data.userId) {
        // Redirect with userId, email, AND name
        window.location.href = `home.html?userId=${encodeURIComponent(data.userId)}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`;
      } else {
        error_message.innerText = data.message || "Signup failed";
      }
    } catch (err) {
      console.error("Signup error:", err);
      error_message.innerText = "Server error. Try again.";
    }
  });
}

// ---------------- LOGIN ----------------
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emaili.value.trim().toLowerCase()
    const password = passwordi.value;

    let errors = getLoginFormErrors(email, password);
    if (errors.length > 0) {
      error_message.innerText = errors.join(". ");
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (data.success && data.userId) {
        // Redirect with userId, email, AND name
        window.location.href = `home.html?userId=${encodeURIComponent(data.userId)}&email=${encodeURIComponent(data.email)}&name=${encodeURIComponent(data.name)}`;
      } else {
        error_message.innerText = data.message || "Invalid email or password";
      }
    } catch (err) {
      console.error("Login error:", err);
      error_message.innerText = "Server error. Try again.";
    }
  });
}

// ---------------- ERROR HELPERS ----------------
function getSignupFormErrors(name, email, password, passwordcheck) {
  const errors = [];
  if (!name) { errors.push('Name is required'); fname.parentElement.classList.add('incorrect'); }
  if (!email) { errors.push('Email is required'); emaili.parentElement.classList.add('incorrect'); }
  if (!password) { errors.push('Password is required'); passwordi.parentElement.classList.add('incorrect'); }
  if (password && password.length < 8) { errors.push('Password must have at least 8 characters'); passwordi.parentElement.classList.add('incorrect'); }
  if (password !== passwordcheck) { errors.push('Passwords do not match'); repass.parentElement.classList.add('incorrect'); }
  return errors;
}

function getLoginFormErrors(email, password) {
  const errors = [];
  if (!email) { errors.push('Email is required'); emaili.parentElement.classList.add('incorrect'); }
  if (!password) { errors.push('Password is required'); passwordi.parentElement.classList.add('incorrect'); }
  return errors;
}

// Clear errors on input
const allInputs = [fname, emaili, passwordi, repass].filter(i => i != null);
allInputs.forEach(input => {
  input.addEventListener('input', () => {
    input.parentElement.classList.remove('incorrect');
    error_message.innerText = '';
  });
});

// ------------------ FORM NAVIGATION ------------------
function goToForm() {
  const params = new URLSearchParams(window.location.search);
  const userId = params.get("userId");

  if (!userId) {
    alert("User not logged in");
    return;
  }

  window.location.href = `form.html?userId=${encodeURIComponent(userId)}`;
}

// ------------------ WAGER FORM ------------------
const wagerForm = document.getElementById("wagerForm");
const addMemberBtn = document.getElementById("addMemberBtn");
const membersContainer = document.getElementById("membersContainer");

// Set default start date to today
const startDateInput = document.getElementById("startDate");
if (startDateInput) {
  const today = new Date().toISOString().split('T')[0];
  startDateInput.value = today;
}

if (wagerForm) {
  wagerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const validation = validateMembers();
    if (!validation.valid) {
      alert(validation.message);
      return;
    }
    const members = validation.emails;

    const params = new URLSearchParams(window.location.search);
    const userId = params.get("userId");
    if (!userId) {
      alert("User not logged in");
      return;
    }

    const wagerData = {
      userId,
      groupName: document.getElementById("groupName").value,
      description: document.getElementById("description").value,
      amount: document.getElementById("amount").value,
      startDate: document.getElementById("startDate").value,
      endDate: document.getElementById("endDate").value,
      payout: document.getElementById("payout").value,
      members
    };

    try {
      const res = await fetch(`${BACKEND_URL}/wagers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wagerData)
      });

      const data = await res.json();

      if (data.success) {
        window.location.href = `home.html?userId=${userId}`;
      } else {
        alert(data.message || "Failed to create wager");
      }
    } catch (err) {
      console.error("Error creating wager:", err);
      alert("Server error creating wager");
    }
  });
}

// ------------------ LOAD WAGERS ------------------
async function loadWagers() {
  const params = new URLSearchParams(window.location.search);
  const userId = params.get("userId");
  if (!userId) return;

  try {
    const res = await fetch(`${BACKEND_URL}/wagers/${userId}`);
    const data = await res.json();

    if (!Array.isArray(data)) {
      console.error("Invalid wagers data:", data);
      return;
    }

    const table = document.getElementById("wagerTable");
    if (!table) return;

    // Clear previous rows but keep the header
    const rows = table.querySelectorAll('tr:not(:first-child)');
    rows.forEach(row => row.remove());

    // Add wager rows with description field included
    data.forEach(wager => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${wager.group_name}</td>
        <td>${wager.description}</td>
        <td>$${wager.amount}</td>
        <td>${wager.start_date}</td>
        <td>${wager.end_date}</td>
        <td>${wager.payout}</td>
      `;
      table.appendChild(row);
    });

  } catch (err) {
    console.error("Failed to load wagers:", err);
  }
}

// Only load wagers if we're on a page with the wagerTable
if (document.getElementById("wagerTable")) {
  loadWagers();
}

// ------------------ ADD/REMOVE MEMBERS ------------------
if (addMemberBtn && membersContainer) {
  addMemberBtn.addEventListener("click", () => {
    const row = document.createElement("div");
    row.className = "member-row";

    const input = document.createElement("input");
    input.type = "email";
    input.placeholder = "Enter member email";
    input.className = "member-email";
    input.required = true;

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.innerText = "✖";
    deleteBtn.className = "delete-member";

    deleteBtn.addEventListener("click", () => row.remove());

    row.appendChild(input);
    row.appendChild(deleteBtn);
    membersContainer.appendChild(row);
  });
}

// ------------------ VALIDATION ------------------
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateMembers() {
  const inputs = document.querySelectorAll(".member-email");
  const emails = [];
  const seen = new Set();

  if (inputs.length === 0) return { valid: false, message: "Add at least one group member." };

  for (let input of inputs) {
    const email = input.value.trim().toLowerCase();
    input.classList.remove("input-error");

    if (!email) {
      input.classList.add("input-error");
      return { valid: false, message: "All member email fields must be filled." };
    }

    if (!isValidEmail(email)) {
      input.classList.add("input-error");
      return { valid: false, message: `Invalid email: ${email}` };
    }

    if (seen.has(email)) {
      input.classList.add("input-error");
      return { valid: false, message: `Duplicate email: ${email}` };
    }

    seen.add(email);
    emails.push(email);
  }

  return { valid: true, emails };
}
// Expand function
const nameexpand = document.getElementById("nameexpand")
const memberexpand = document.getElementById("addmemberform")
const descriptionexpand = document.getElementById("descriptionexpand")
const amountexpand = document.getElementById("amountexpand")
const payoutexpand = document.getElementById("payoutexpand")
const sdateexpand = document.getElementById("sdateexpand")
const edateexpand = document.getElementById("edateexpand")

nameexpand.addEventListener('dblclick', ( )=> {
    nameexpand.classList.toggle('collapse');
});
memberexpand.addEventListener('dblclick', ( )=> {
    memberexpand.classList.toggle('collapse');
});
descriptionexpand.addEventListener('dblclick', ( )=> {
    descriptionexpand.classList.toggle('collapse');
});
amountexpand.addEventListener('dblclick', ( )=> {
    amountexpand.classList.toggle('collapse');
});
payoutexpand.addEventListener('dblclick', ( )=> {
    payoutexpand.classList.toggle('collapse');
});
sdateexpand.addEventListener('dblclick', ( )=> {
    sdateexpand.classList.toggle('collapse');
});
edateexpand.addEventListener('dblclick', () => {
  edateexpand.classList.toggle('collapse')
});