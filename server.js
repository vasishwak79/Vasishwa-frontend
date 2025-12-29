const express = require("express");
const multer = require("multer");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const initDB = require("./db");

const app = express();
const upload = multer({ dest: "uploads/" });
const SECRET = "supersecretkey";

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

let db;

// ------------------- INIT DATABASE -------------------
(async () => {
  db = await initDB();
  console.log("Database connected");

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS claims (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT,
      name TEXT,
      reason TEXT,
      teacher TEXT,
      status TEXT DEFAULT 'pending',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const admin = await db.get(
    "SELECT * FROM admins WHERE username = ?",
    "admin"
  );

  if (!admin) {
    const hashed = await bcrypt.hash("password", 10);
    await db.run(
      "INSERT INTO admins (username, password) VALUES (?, ?)",
      "admin",
      hashed
    );
    console.log("Default admin created: admin / password");
  }
})();

// ------------------- ITEMS -------------------
app.get("/api/items", async (req, res) => {
  const recent = req.query.recent;
  const items = recent
    ? await db.all(
        "SELECT * FROM items WHERE status='approved' ORDER BY createdAt DESC LIMIT 6"
      )
    : await db.all("SELECT * FROM items WHERE status='approved'");
  res.json(items);
});

app.post("/api/items", upload.single("photo"), async (req, res) => {
  const { title, description, location } = req.body;
  const photo = req.file ? `/uploads/${req.file.filename}` : null;

  await db.run(
    "INSERT INTO items (title, description, location, photo) VALUES (?, ?, ?, ?)",
    title,
    description,
    location,
    photo
  );

  res.json({ success: true });
});

// ------------------- ADMIN LOGIN -------------------
app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body;

  const admin = await db.get(
    "SELECT * FROM admins WHERE username = ?",
    username
  );

  if (!admin) return res.json({ success: false, message: "Admin not found" });

  const valid = await bcrypt.compare(password, admin.password);
  if (!valid) return res.json({ success: false, message: "Invalid password" });

  const token = jwt.sign({ admin: username }, SECRET, { expiresIn: "1h" });
  res.json({ success: true, token });
});

// ------------------- USER LOGIN -------------------
app.post("/api/user/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await db.get(
    "SELECT * FROM users WHERE username = ?",
    username
  );

  if (!user) return res.json({ success: false, message: "User not found" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.json({ success: false, message: "Invalid password" });

  const token = jwt.sign({ username }, SECRET, { expiresIn: "1h" });
  res.json({ success: true, token, username: user.username });
});
  
// ------------------- ADMIN ITEMS (NO AUTH) -------------------
app.get("/api/pending", async (req, res) => {
  const items = await db.all(
    "SELECT * FROM items WHERE status='pending'"
  );
  res.json(items);
});

app.put("/api/approve/:id", async (req, res) => {
  await db.run(
    "UPDATE items SET status='approved' WHERE id=?",
    req.params.id
  );
  res.json({ success: true });
});

// ------------------- CLAIMS -------------------
app.post("/api/claims", async (req, res) => {
  const { username, name, reason, teacher } = req.body;

  if (!name || !reason || !teacher)
    return res.status(400).json({ success: false });

  await db.run(
    "INSERT INTO claims (username, name, reason, teacher) VALUES (?, ?, ?, ?)",
    username || "anonymous",
    name,
    reason,
    teacher
  );

  res.json({ success: true });
});

app.get("/api/claims/pending", async (req, res) => {
  const claims = await db.all(
    "SELECT * FROM claims WHERE status='pending'"
  );
  res.json(claims);
});

app.put("/api/claims/approve/:id", async (req, res) => {
  await db.run(
    "UPDATE claims SET status='approved' WHERE id=?",
    req.params.id
  );
  res.json({ success: true });
});

// ------------------- START SERVER -------------------
app.listen(4000, () => {
  console.log("Backend running at http://localhost:4000");
});
