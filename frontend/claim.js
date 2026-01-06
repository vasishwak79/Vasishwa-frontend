// ------------------ DISPLAY LOGGED-IN USER ------------------
const usernameElems = document.querySelectorAll("#username-display");
const username = localStorage.getItem("username");
if (username && usernameElems.length > 0) {
  usernameElems.forEach(el => el.textContent = username);
}

// ------------------ LOGOUT BUTTON ------------------
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("username");
    window.location.href = "login.html";
  });
}

// ------------------ PROTECT CLAIM PAGE ------------------
const claimForm = document.getElementById("claim-form");
const userToken = localStorage.getItem("userToken");

if (claimForm && !userToken) {
  alert("You must log in to access this page.");
  window.location.href = "login.html";
}

// ------------------ HANDLE CLAIM FORM SUBMISSION ------------------
if (claimForm) {
  claimForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = document.getElementById("claim-message");

    const formData = {
      username,
      name: e.target.name.value.trim(),
      reason: e.target.reason.value.trim(),
      teacher: e.target.teacher.value.trim()
    };

    try {
      const res = await fetch("http://localhost:4000/api/claims", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userToken}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (data.success) {
        msg.style.color = "lightgreen";
        msg.textContent = "Claim submitted! Waiting for admin approval.";
        e.target.reset();
      } else {
        msg.style.color = "red";
        msg.textContent = data.message || "Failed to submit claim.";
      }
    } catch (err) {
      console.error(err);
      msg.style.color = "red";
      msg.textContent = "Server error — try again.";
    }
  });
}
