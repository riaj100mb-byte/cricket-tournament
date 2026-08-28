const express = require("express");
const Database = require("better-sqlite3");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const db = new Database("tournament.db");
const port = process.env.PORT || 3000;

// Upload folder
const dir = path.join(__dirname, "public", "uploads");
fs.mkdirSync(dir, { recursive: true });

// Multer setup
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const name = Date.now() + "-" +
        file.originalname.replace(/[^a-z0-9.]/gi, "_");
      cb(null, name);
    }
  })
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    captain TEXT,
    phone TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER,
    name TEXT,
    phone TEXT,
    age INTEGER,
    village TEXT,
    photo TEXT,
    created_at TEXT,
    FOREIGN KEY(team_id) REFERENCES teams(id)
  );
`);

// Get all teams
app.get("/api/teams", (req, res) => {
  const teams = db
    .prepare("SELECT * FROM teams ORDER BY id DESC")
    .all();

  res.json(teams);
});

// Get one team with players
app.get("/api/teams/:id", (req, res) => {
  const team = db
    .prepare("SELECT * FROM teams WHERE id = ?")
    .get(req.params.id);

  if (!team) {
    return res.status(404).json({
      error: "Team not found"
    });
  }

  team.players = db
    .prepare("SELECT * FROM players WHERE team_id = ? ORDER BY id")
    .all(team.id);

  res.json(team);
});

// Create team
app.post("/api/teams", (req, res) => {
  const { name, captain, phone } = req.body;

  if (!name || !captain || !phone) {
    return res.status(400).json({
      error: "Fill all fields"
    });
  }

  try {
    const result = db
      .prepare(`
        INSERT INTO teams(name, captain, phone, created_at)
        VALUES (?, ?, ?, ?)
      `)
      .run(
        name,
        captain,
        phone,
        new Date().toISOString()
      );

    res.json({
      id: result.lastInsertRowid
    });

  } catch (error) {
    res.status(409).json({
      error: "Team already exists"
    });
  }
});

// Delete team
app.delete("/api/teams/:id", (req, res) => {
  db.prepare(
    "DELETE FROM players WHERE team_id = ?"
  ).run(req.params.id);

  db.prepare(
    "DELETE FROM teams WHERE id = ?"
  ).run(req.params.id);

  res.json({ ok: true });
});

// Add player
app.post(
  "/api/players",
  upload.single("photo"),
  (req, res) => {

    const {
      team_id,
      name,
      phone,
      age,
      village
    } = req.body;

    const team = db
      .prepare("SELECT * FROM teams WHERE id = ?")
      .get(team_id);

    if (!team) {
      return res.status(404).json({
        error: "Team not found"
      });
    }

    const count = db
      .prepare(
        "SELECT COUNT(*) AS count FROM players WHERE team_id = ?"
      )
      .get(team_id).count;

    if (count >= 15) {
      return res.status(400).json({
        error: "Maximum 15 players reached"
      });
    }

    if (
      !name ||
      !phone ||
      !age ||
      !village ||
      !req.file
    ) {
      return res.status(400).json({
        error: "Fill all fields and choose a photo"
      });
    }

    const result = db
      .prepare(`
        INSERT INTO players
        (team_id, name, phone, age, village, photo, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        team_id,
        name,
        phone,
        age,
        village,
        "/uploads/" + req.file.filename,
        new Date().toISOString()
      );

    res.json({
      id: result.lastInsertRowid
    });
  }
);

// Edit player within 24 hours
app.patch(
  "/api/players/:id",
  upload.single("photo
