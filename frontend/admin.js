const pendingContainer = document.getElementById("pending-items");

// Get admin token
const token = localStorage.getItem("adminToken");
if (!token) {
  alert("Admin login required");
  window.location.href = "admin_login.html";
}

// Fetch pending items and claims
async function fetchPending() {
  try {
    pendingContainer.innerHTML = "";

    const headers = { Authorization: `Bearer ${token}` };

    // Fetch pending items
    const resItems = await fetch("http://localhost:4000/api/pending", { headers });
    if (!resItems.ok) throw new Error("Failed to fetch pending items");
    const items = await resItems.json();

    // Fetch pending claims
    const resClaims = await fetch("http://localhost:4000/api/claims/pending", { headers });
    if (!resClaims.ok) throw new Error("Failed to fetch pending claims");
    const claims = await resClaims.json();

    if (items.length === 0 && claims.length === 0) {
      pendingContainer.innerHTML = "<p>No pending items or claims.</p>";
      return;
    }

    // Render pending items
    items.forEach(item => {
      const div = document.createElement("div");
      div.className = "item-card";
      div.innerHTML = `
        <h3>${item.title}</h3>
        <p>${item.description}</p>
        <p><strong>Location:</strong> ${item.location}</p>
        ${item.photo ? `<img src="http://localhost:4000${item.photo}" alt="${item.title}" />` : ""}
        <button onclick="approveItem(${item.id})">Approve Item</button>
        <button onclick="declineItem(${item.id})">Decline Item</button>
      `;
      pendingContainer.appendChild(div);
    });

    // Render pending claims
    claims.forEach(claim => {
      const div = document.createElement("div");
      div.className = "claim-card";
      div.innerHTML = `
        <h3>Claim by ${claim.name}</h3>
        <p>Reason: ${claim.reason}</p>
        <p>Teacher: ${claim.teacher}</p>
        <p>User: ${claim.username}</p>
        <button onclick="approveClaim(${claim.id})">Approve Claim</button>
        <button onclick="declineClaim(${claim.id})">Decline Claim</button>
      `;
      pendingContainer.appendChild(div);
    });

  } catch (err) {
    console.error(err);
    pendingContainer.innerHTML = "<p>Error loading pending items or claims.</p>";
  }
}

// Approve item
async function approveItem(id) {
  try {
    const res = await fetch(`http://localhost:4000/api/approve/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to approve item");
    fetchPending();
  } catch (err) {
    console.error(err);
    alert("Could not approve item");
  }
}

// Decline item (DELETE)
async function declineItem(id) {
  try {
    const res = await fetch(`http://localhost:4000/api/decline/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to decline item");
    fetchPending();
  } catch (err) {
    console.error(err);
    alert("Could not decline item");
  }
}

// Approve claim
async function approveClaim(id) {
  try {
    const res = await fetch(`http://localhost:4000/api/claims/approve/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to approve claim");
    fetchPending();
  } catch (err) {
    console.error(err);
    alert("Could not approve claim");
  }
}

// Decline claim (DELETE)
async function declineClaim(id) {
  try {
    const res = await fetch(`http://localhost:4000/api/claims/decline/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to decline claim");
    fetchPending();
  } catch (err) {
    console.error(err);
    alert("Could not decline claim");
  }
}

// Load pending items on page load
fetchPending();
