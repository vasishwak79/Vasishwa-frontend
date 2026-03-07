/* ===================== CHECK FOR LOGOUT MESSAGE ===================== */
// This runs immediately when the Home page loads
if (localStorage.getItem("logoutMessage") === "true") {
  alert("You've been logged out due to inactivity");
  
  // Clear the flag so the message doesn't appear again on refresh
  localStorage.removeItem("logoutMessage");
}

const API_URL = "http://localhost:4000/api";

let allItems = []; 
let currentPage = 1;
const itemsPerPage = 7;

/* ===================== TEMP MESSAGES ===================== */
function showTemporaryMessage(element, text, isError = false) {
  if (!element) return;
  element.style.color = isError ? "red" : "green";
  element.innerText = text;
  element.style.display = "block";

  // Clear message after 5 seconds
  setTimeout(() => {
    element.innerText = "";
    element.style.display = "none";
  }, 5000);
}

/* ===================== CLAIM HANDLER ===================== */
function claimItem(id) {
  const userToken = localStorage.getItem("userToken");
  if (!userToken) {
    alert("You must log in to claim an item.");
    window.location.href = "login.html";
    return;
  }
  // Save ID and redirect
  localStorage.setItem("selectedItemId", id);
  window.location.href = "claim.html";
}

/* ===================== LOAD RECENT ITEMS ===================== */
const recentContainer = document.getElementById("recent-items");
if (recentContainer) {
  fetch(`${API_URL}/items?recent=true`)
    .then(res => res.json())
    .then(items => {
      recentContainer.innerHTML = items.map(item => `
        <div class="item">
          ${item.photo ? `<img src="http://localhost:4000${item.photo}" alt="${item.title}" />` : ""}
          <h3>${item.title}</h3>
          <p>${item.description}</p>
          <small>Location: ${item.location}</small><br>
          <button onclick="claimItem(${item.id})">Claim</button>
        </div>
      `).join("");
    })
    .catch(err => console.error("Recent items error:", err));
}

/* ================= FAQ ACCORDION ================= */
document.querySelectorAll(".faq-question").forEach(btn => {
  btn.addEventListener("click", e => {
    e.preventDefault();

    const item = btn.parentElement;
    const isOpen = item.classList.contains("active");

    // Close all
    document.querySelectorAll(".faq-item").forEach(i => {
      i.classList.remove("active");
    });

    // Reopen if it was closed
    if (!isOpen) item.classList.add("active");
  });
});

/* ===================== LOAD ALL ITEMS + SEARCH ===================== */
const itemsListContainer = document.getElementById("items-list");
let selectedValue = "all"; // Track custom dropdown state

if (itemsListContainer) {
    fetch(`${API_URL}/items`)
        .then(res => res.json())
        .then(items => {
            allItems = items;
            renderItems(allItems);
        })
        .catch(err => console.error("Load items error:", err));

    const searchBar = document.getElementById("search-bar");
    const customSelect = document.getElementById('category-dropdown');

    // --- Custom Dropdown Logic ---
    if (customSelect) {
        const trigger = customSelect.querySelector('.select-trigger');
        const options = customSelect.querySelectorAll('.option');

        trigger.addEventListener('click', () => {
            customSelect.classList.toggle('open');
        });

        options.forEach(option => {
            option.addEventListener('click', () => {
                // Update UI state
                options.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                trigger.querySelector('span').innerText = option.innerText;
                
                // Update filter value and close
                selectedValue = option.getAttribute('data-value');
                customSelect.classList.remove('open');
                
                performFilter();
            });
        });

        // Close when clicking outside
        window.addEventListener('click', (e) => {
            if (!customSelect.contains(e.target)) {
                customSelect.classList.remove('open');
            }
        });
    }

    function performFilter() {
        const searchTerm = searchBar ? searchBar.value.toLowerCase() : "";

        const filtered = allItems.filter(item => {
            const matchesSearch = 
                item.title.toLowerCase().includes(searchTerm) ||
                item.description.toLowerCase().includes(searchTerm) ||
                item.location.toLowerCase().includes(searchTerm);

            const matchesCategory = 
                selectedValue === "all" || 
                item.category === selectedValue;

            return matchesSearch && matchesCategory;
        });

        currentPage = 1;
        renderItems(filtered);
    }

    if (searchBar) {
        searchBar.addEventListener("input", performFilter);
    }
}

/* ===================== RENDER FUNCTIONS ===================== */
function renderItems(itemsToRender) {
    const container = document.getElementById("items-list");
    if (!container) return;
    
    container.innerHTML = "";
    
    // Add "No items found" message if empty
    if (itemsToRender.length === 0) {
        container.innerHTML = `<p style="text-align:center; width:100%; font-size:1.2rem; color:#555;">No items match your search.</p>`;
        return;
    }

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedItems = itemsToRender.slice(start, end);

    container.innerHTML = paginatedItems.map(item => `
        <div class="item">
            <div class="item-text-content"> 
                <h1>${item.title}</h1>
                <p><strong>Category:</strong> ${item.category || 'Other'}</p> 
                <h3>${item.description}</h3>
                <h3>Location: ${item.location}</h3>
                <small>Found on: ${item.dateFound || 'N/A'}</small><br> 
            </div>
            ${item.photo ? `<img src="http://localhost:4000${item.photo}" alt="${item.title}" />` : ""}
            <button onclick="claimItem(${item.id})">Claim</button>
        </div>
    `).join("");

    renderPaginationControls(itemsToRender);
}

function renderPaginationControls(originalItems) {
  const container = document.getElementById("items-list");
  if (!container) return;

  const totalPages = Math.ceil(originalItems.length / itemsPerPage);
  if (totalPages <= 1) return; 

  const nav = document.createElement("div");
  nav.className = "pagination-nav";
  nav.style.cssText = "width:100%; display:flex; justify-content:center; gap:20px; margin-top:20px;";

  nav.innerHTML = `
    <button id="prevBtn" class="nav-btn">Previous</button>
    <span style="color: black; font-weight: bold;">Page ${currentPage} of ${totalPages}</span>
    <button id="nextBtn" class="nav-btn">Next</button>
  `;

  container.appendChild(nav);

  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  if (currentPage === 1) prevBtn.disabled = true;
  if (currentPage === totalPages) nextBtn.disabled = true;

  prevBtn.onclick = () => {
    currentPage--;
    renderItems(originalItems);
    window.scrollTo(0, 0);
  };

  nextBtn.onclick = () => {
    currentPage++;
    renderItems(originalItems);
    window.scrollTo(0, 0);
  };
}

/* ===================== UPLOAD ITEM ===================== */
const uploadForm = document.getElementById("upload-form");
if (uploadForm) {
  uploadForm.addEventListener("submit", e => {
    e.preventDefault();

    const fileInput = document.getElementById("itemPhoto");
    const fileError = document.getElementById("file-error");
    const message = document.getElementById("upload-message"); // Get message box

    if (fileError) fileError.classList.add("hidden");

    if (!fileInput.files || fileInput.files.length === 0) {
      if (fileError) {
        fileError.textContent = "Please upload an image.";
        fileError.classList.remove("hidden");
      }
      return;
    }

    const formData = new FormData(e.target);

    fetch(`${API_URL}/items`, {
      method: "POST",
      body: formData
    })
      .then(res => res.json()) 
      .then(data => {
        const imagePreview = document.getElementById("imagePreview");

        if (data.success) {
          showTemporaryMessage(message, "Item submitted for review!", false);

          e.target.reset();
          if (imagePreview) {
            imagePreview.src = "";
            imagePreview.classList.add("hidden");
          }
          const fileName = document.getElementById("fileName");
          if (fileName) fileName.textContent = "No file selected";
        } else {

          showTemporaryMessage(message, "Upload failed", true);
        }
      })
      .catch(err => {
        console.error(err);
        showTemporaryMessage(message, "Server error", true);
      });
  });
}

// File Input Listeners
const fileInput = document.getElementById("itemPhoto");
const imagePreview = document.getElementById("imagePreview");
const fileNameDisplay = document.getElementById("fileName");

if (fileInput) {
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    const fileError = document.getElementById("file-error");
    if (fileError) fileError.classList.add("hidden");
    if (!file) return;

    if (fileNameDisplay) fileNameDisplay.textContent = file.name;

    const reader = new FileReader();
    reader.onload = () => {
      imagePreview.src = reader.result;
      imagePreview.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  });
}

/* ================= FADE IN ON SCROLL ================= */
const faders = document.querySelectorAll(".fade-section");

const appearOptions = {
  threshold: 0.15, 
  rootMargin: "0px 0px -50px 0px" 
};

const appearOnScroll = new IntersectionObserver(function(entries, observer) {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
    } else {
      entry.target.classList.remove("visible");
    }
  });
}, appearOptions);

faders.forEach(section => {
  appearOnScroll.observe(section);
});

/* ================= BACK TO TOP BUTTON ================= */
const backToTopBtn = document.getElementById("backToTop");

// Using addEventListener is safer than window.onscroll
window.addEventListener('scroll', () => {
  if (backToTopBtn) {
    // Check scroll position
    const scrollPos = window.scrollY || document.documentElement.scrollTop;
    
    if (scrollPos > 300) {
      backToTopBtn.classList.add("show");
    } else {
      backToTopBtn.classList.remove("show");
    }
  }
});

// Click Listener
if (backToTopBtn) {
  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
}

/* ===================== USER DISPLAY + LOGOUT ===================== */
const userToken = localStorage.getItem("userToken");
const username = localStorage.getItem("username");
const userMenu = document.getElementById("user-menu");

document.querySelectorAll("#username-display").forEach(el => {
  if (username) el.textContent = username;
});

if (username && userMenu) {
  userMenu.classList.remove("hidden");
}

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("username");
    window.location.href = "login.html";
  });
}

/* ===================== PAGE PROTECTION ===================== */
if ((document.getElementById("upload-form") || document.getElementById("items-list")) && !userToken) {
  alert("You must log in to access this page.");
  window.location.href = "login.html";
}

/* ====================== MOBILE NAVIGATION MENU ======================== */
const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector(".nav-right");

if (navToggle && navMenu) {
  navToggle.addEventListener("click", () => {
    navMenu.classList.toggle("open");
  });
}
