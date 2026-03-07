if (localStorage.getItem("userToken")) {
  window.location.href = "index.html";
}

document.getElementById("signupForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const username = e.target.username.value.trim();
  const email = e.target.email.value.trim();
  const password = e.target.password.value.trim();
  const msg = document.getElementById("msg");

  try {
    const res = await fetch("http://localhost:4000/api/user/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password })
    });

    const data = await res.json();

    if (data.success) {
      msg.textContent = "Account created! Redirecting...";
      msg.style.color = "black";
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1200);
    } else {
      msg.textContent = data.message || "Signup failed.";
      msg.style.color = "darkRed";
    }

  } catch (err) {
    console.error(err);
    msg.textContent = "Server error — try again.";
    msg.style.color = "darkRed";
  }
});

/* ===================== PASSWORD VALIDATION ================== */
document.addEventListener("DOMContentLoaded", function () {

  const passwordInput = document.getElementById("password");
  if (!passwordInput) return;

  const lengthCheck = document.getElementById("length-check");
  const letterCheck = document.getElementById("letter-check");
  const numberCheck = document.getElementById("number-check");
  const specialCheck = document.getElementById("special-check");

  passwordInput.addEventListener("input", function () {

    const password = passwordInput.value;

    updateCheck(lengthCheck, password.length >= 8);
    updateCheck(letterCheck, /[A-Za-z]/.test(password));
    updateCheck(numberCheck, /\d/.test(password));
    updateCheck(specialCheck, /[@$!%*?&]/.test(password));
  });

  function updateCheck(element, condition) {
    const icon = element.querySelector(".check-icon");

    if (condition) {
      element.classList.add("valid");
      icon.textContent = "✔";
    } else {
      element.classList.remove("valid");
      icon.textContent = "✖";
    }
  }

});


/* ====================== MOBILE NAVIGATION MENU ======================== */
const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector(".nav-right");

if (navToggle && navMenu) {
  navToggle.addEventListener("click", () => {
    navMenu.classList.toggle("open");
  });
}
