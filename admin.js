const pendingContainer = document.getElementById("pending-items");

// Get admin token from localStorage
const token = localStorage.getItem("adminToken");
if (!token) {
  alert("Admin login required");
  window.location.href = "admin_login.html";
}
// Fetch and display pending items and claims
async function fetchPending() {
  try {
    pendingContainer.innerHTML = "";

    const headers = {
      Authorization: `Bearer ${token}`
    };

    // Fetch pending items
    const resItems = await fetch("http://localhost:4000/api/pending", {
      headers
    });

    if (!resItems.ok) {
      throw new Error("Pending items request failed");
    }

    const items = await resItems.json();

    // Fetch pending claims
    const resClaims = await fetch("http://localhost:4000/api/claims/pending", {
      headers
    });

    if (!resClaims.ok) {
      throw new Error("Pending claims request failed");
    }

    const claims = await resClaims.json();

    if (items.length === 0 && claims.length === 0) {
      pendingContainer.innerHTML = "<p>No pending items or claims.</p>";
      return;
    }

    // Render items
    items.forEach(item => {
      const div = document.createElement("div");
      div.className = "item-card";
      div.innerHTML = `
        <h3>${item.title}</h3>
        <p>${item.description}</p>
        <p>Location: ${item.location}</p>
        ${item.photo ? `<img src="http://localhost:4000${item.photo}" />` : ""}
        <button onclick="approveItem(${item.id})">Approve Item</button>
      `;
      pendingContainer.appendChild(div);
    });

    // Render claims
    claims.forEach(claim => {
      const div = document.createElement("div");
      div.className = "claim-card";
      div.innerHTML = `
        <h3>Claim by ${claim.name}</h3>
        <p>Reason: ${claim.reason}</p>
        <p>Teacher: ${claim.teacher}</p>
        <p>User: ${claim.username}</p>
        <button onclick="approveClaim(${claim.id})">Approve Claim</button>
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
  await fetch(`http://localhost:4000/api/approve/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` }
  });
  fetchPending();
}

// Approve claim
async function approveClaim(id) {
  await fetch(`http://localhost:4000/api/claims/approve/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` }
  });
  fetchPending();
}

// Load on page open
fetchPending();
