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

  // USERS
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    );
  `);

  // ADMINS
  await db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    );
  `);

  // ITEMS
  await db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      description TEXT,
      location TEXT,
      photo TEXT,
      status TEXT DEFAULT 'pending',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // CLAIMS
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

  // DEFAULT ADMIN
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
        "SELECT * FROM items WHERE status='approved' ORDER BY createdAt DESC LIMIT 3"
      )
    : await db.all("SELECT * FROM items WHERE status='approved'");
  res.json(items);
});

app.post("/api/items", upload.single("photo"), (req, res) => {
  const { title, description, location } = req.body;
  const photo = req.file ? `/uploads/${req.file.filename}` : null;

  if (!title || !description || !location) {
    return res.json({ success: false, message: "All fields are required" });
  }

  const sql = `
    INSERT INTO items (title, description, location, photo, status, createdAt)
    VALUES (?, ?, ?, ?, 'pending', datetime('now'))
  `;

  db.run(sql, [title, description, location, photo], function (err) {
    if (err) {
      console.error("Insert error:", err);
      return res.status(500).json({ success: false, message: "Insert failed" });
    }

    console.log(`Item inserted with ID: ${this.lastID}`);
    res.json({ success: true, message: "Item submitted for review!" });
  });
});

// ------------------- ADMIN LOGIN -------------------
app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body;

  const admin = await db.get(
    "SELECT * FROM admins WHERE username = ?",
    username
  );

  if (!admin)
    return res.json({ success: false, message: "Admin not found" });

  const valid = await bcrypt.compare(password, admin.password);
  if (!valid)
    return res.json({ success: false, message: "Invalid password" });

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

  if (!user)
    return res.json({ success: false, message: "User not found" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid)
    return res.json({ success: false, message: "Invalid password" });

  const token = jwt.sign({ username }, SECRET, { expiresIn: "1h" });

  res.json({
    success: true,
    token,
    username: user.username
  });
});

// ------------------- USER SIGNUP -------------------
app.post("/api/user/signup", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.json({ success: false, message: "Missing fields" });
    }

    const existing = await db.get(
      "SELECT * FROM users WHERE username = ?",
      username
    );

    if (existing) {
      return res.json({ success: false, message: "Username already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    await db.run(
      "INSERT INTO users (username, password) VALUES (?, ?)",
      username,
      hashed
    );

    res.json({ success: true });

  } catch (err) {
    console.error("SIGNUP ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ------------------- ADMIN ITEMS (NO AUTH YET) -------------------
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
