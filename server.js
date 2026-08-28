const express = require("express");
const Database = require("better-sqlite3");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const db = new Database("tournament.db");
const port = process.env.PORT || 3000;

const dir = path.join(__dirname, "public", "uploads");
fs.mkdirSync(dir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname.replace(/[^a-zA-Z0-9.]/g, "_"));
  }
});

const upload = multer({ storage: storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

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
    created_at TEXT
  );
`);

app.get("/api/teams", function (req, res) {
  const teams = db.prepare(
    "SELECT * FROM teams ORDER BY id DESC"
  ).all();

  res.json(teams);
});

app.get("/api/teams/:id", function (req, res) {
  const team = db.prepare(
    "SELECT * FROM teams WHERE id = ?"
  ).get(req.params.id);

  if (!team) {
    return res.status(404).json({
      error: "Team not found"
    });
  }

  team.players = db.prepare(
    "SELECT * FROM players WHERE team_id = ? ORDER BY id"
  ).all(team.id);

  res.json(team);
});

app.post("/api/teams", function (req, res) {
  const name = req.body.name;
  const captain = req.body.captain;
  const phone = req.body.phone;

  if (!name || !captain || !phone) {
    return res.status(400).json({
      error: "Fill all fields"
    });
  }

  try {
    const result = db.prepare(
      "INSERT INTO teams (name, captain, phone, created_at) VALUES (?, ?, ?, ?)"
    ).run(
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

app.delete("/api/teams/:id", function (req, res) {
  db.prepare(
    "DELETE FROM players WHERE team_id = ?"
  ).run(req.params.id);

  db.prepare(
    "DELETE FROM teams WHERE id = ?"
  ).run(req.params.id);

  res.json({ ok: true });
});

app.post(
  "/api/players",
  upload.single("photo"),
  function (req, res) {
    const teamId = req.body.team_id;
    const name = req.body.name;
    const phone = req.body.phone;
    const age = req.body.age;
    const village = req.body.village;

    const team = db.prepare(
      "SELECT * FROM teams WHERE id = ?"
    ).get(teamId);

    if (!team) {
      return res.status(404).json({
        error: "Team not found"
      });
    }

    const result = db.prepare(
      "SELECT COUNT(*) AS count FROM players WHERE team_id = ?"
    ).get(teamId);

    if (result.count >= 15) {
      return res.status(400).json({
        error: "Maximum 15 players reached"
      });
    }

    if (!name || !phone || !age || !village || !req.file) {
      return res.status(400).json({
        error: "Fill all fields and choose a photo"
      });
    }

    const photo = "/uploads/" + req.file.filename;

    const insert = db.prepare(
      "INSERT INTO players (team_id, name, phone, age, village, photo, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(
      teamId,
      name,
      phone,
      age,
      village,
      photo,
      new Date().toISOString()
    );

    res.json({
      id: insert.lastInsertRowid
    });
  }
);

app.patch(
  "/api/players/:id",
  upload.single("photo"),
  function (req, res) {
    const player = db.prepare(
      "SELECT * FROM players WHERE id = ?"
    ).get(req.params.id);

    if (!player) {
      return res.status(404).json({
        error: "Player not found"
      });
    }

    const createdTime = new Date(player.created_at).getTime();

    if (Date.now() - createdTime > 86400000) {
      return res.status(403).json({
        error: "Edit locked after 24 hours"
      });
    }

    const photo = req.file
      ? "/uploads/" + req.file.filename
      : player.photo;

    db.prepare(
      "UPDATE players SET name = ?, phone = ?, age = ?, village = ?, photo = ? WHERE id = ?"
    ).run(
      req.body.name,
      req.body.phone,
      req.body.age,
      req.body.village,
      photo,
      req.params.id
    );

    res.json({ ok: true });
  }
);

app.delete("/api/players/:id", function (req, res) {
  db.prepare(
    "DELETE FROM players WHERE id = ?"
  ).run(req.params.id);

  res.json({ ok: true });
});

app.listen(port, function () {
  console.log("Server running on port " + port);
});
