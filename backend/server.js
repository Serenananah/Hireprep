// backend/server.js
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
app.use(cors());

// === 1. Initialize database ===
const db = new sqlite3.Database("./db.sqlite", (err) => {
  if (err) console.error(err);
  console.log("SQLite database connected.");
});

// === 2. Create users table ===
db.run(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT UNIQUE,
  password TEXT
)
`);

// === 3. Register API ===
app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  db.run(
    "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
    [name, email, hashed],
    function (err) {
      if (err) return res.status(400).json({ error: "Email already exists." });

      return res.json({
        id: this.lastID,
        name,
        email
      });
    }
  );
});

// === 4. Login API ===
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if (!user) return res.status(400).json({ error: "User not found." });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid password." });

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email
    });
  });
});

// === 5. Start server ===
app.listen(4000, () => {
  console.log("Backend running at http://localhost:4000");
});
