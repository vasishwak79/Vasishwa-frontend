const API_URL = "http://localhost:4000/api";

/* ===================== CLAIM HANDLER ===================== */
function claimItem() {
  const userToken = localStorage.getItem("userToken");
  if (!userToken) {
    alert("You must log in to claim an item.");
    window.location.href = "login.html";
    return;
  }
  window.location.href = "claim.html";
}

/* ===================== LOAD RECENT ITEMS ===================== */
if (document.getElementById("recent-items")) {
  fetch(`${API_URL}/items?recent=true`)
    .then(res => res.json())
    .then(items => {
      const container = document.getElementById("recent-items");
      container.innerHTML = items.map(item => `
        <div class="item">
          ${item.photo ? `<img src="${item.photo}" alt="${item.title}">` : ""}
          <h3>${item.title}</h3>
          <p>${item.description}</p>
          <small>Location: ${item.location}</small><br>
          <button onclick="claimItem()">Claim</button>
        </div>
      `).join("");
    });
}

/* ===================== LOAD ALL ITEMS + SEARCH ===================== */
if (document.getElementById("items-list")) {
  fetch(`${API_URL}/items`)
    .then(res => res.json())
    .then(items => renderItems(items));

  document.getElementById("search-bar")
    .addEventListener("input", e => {
      const term = e.target.value.toLowerCase();
      fetch(`${API_URL}/items`)
        .then(res => res.json())
        .then(items => {
          const filtered = items.filter(i =>
            i.title.toLowerCase().includes(term) ||
            i.description.toLowerCase().includes(term) ||
            i.location.toLowerCase().includes(term)
          );
          renderItems(filtered);
        });
    });
}

function renderItems(items) {
  const container = document.getElementById("items-list");
  container.innerHTML = items.map(item => `
    <div class="item">
      ${item.photo ? `<img src="${item.photo}" alt="${item.title}">` : ""}
      <h3>${item.title}</h3>
      <p>${item.description}</p>
      <small>Location: ${item.location}</small><br>
      <button onclick="claimItem()">Claim</button>
    </div>
  `).join("");
}

/* ===================== UPLOAD ITEM ===================== */
if (document.getElementById("upload-form")) {
  document.getElementById("upload-form").addEventListener("submit", e => {
    e.preventDefault();

    const formData = new FormData(e.target);

    fetch(`${API_URL}/items`, {
      method: "POST",
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        document.getElementById("upload-message").innerText =
          data.success ? " Item submitted for review!" : "❌ Upload failed";
        e.target.reset();
      });
  });
}

/* ===================== ADMIN PENDING ITEMS ===================== */
if (document.getElementById("pending-items")) {
  fetch(`${API_URL}/pending`)
    .then(res => res.json())
    .then(items => {
      const container = document.getElementById("pending-items");
      container.innerHTML = items.map(item => `
        <div class="item">
          ${item.photo ? `<img src="${item.photo}" alt="${item.title}">` : ""}
          <h3>${item.title}</h3>
          <p>${item.description}</p>
          <button onclick="approveItem(${item.id})">Approve</button>
        </div>
      `).join("");
    });
}

function approveItem(id) {
  fetch(`${API_URL}/approve/${id}`, {
    method: "PUT"
  }).then(() => location.reload());
}

/* ===================== USER DISPLAY + LOGOUT ===================== */
const userToken = localStorage.getItem("userToken");
const username = localStorage.getItem("username");

document.querySelectorAll("#username-display").forEach(el => {
  if (username) el.textContent = username;
});

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("username");
    window.location.href = "login.html";
  });
}

/* ===================== PAGE PROTECTION ===================== */
if (
  (document.getElementById("upload-form") ||
   document.getElementById("items-list")) &&
  !userToken
) {
  alert("You must log in to access this page.");
  window.location.href = "login.html";
}
