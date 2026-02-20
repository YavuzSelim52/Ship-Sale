const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(".")); // site dosyaları

// Database oluştur
const db = new sqlite3.Database("database.db");

// Tablo oluştur
db.run(`
CREATE TABLE IF NOT EXISTS ships (
id INTEGER PRIMARY KEY AUTOINCREMENT,
title TEXT,
price TEXT,
year TEXT,
image TEXT
)
`);

// Tüm gemileri getir
app.get("/api/ships", (req, res) => {
    db.all("SELECT * FROM ships", [], (err, rows) => {
        res.json(rows);
    });
});

// Yeni gemi ekle
app.post("/api/ships", (req, res) => {
    const { title, price, year, image } = req.body;

    db.run(
        "INSERT INTO ships (title, price, year, image) VALUES (?, ?, ?, ?)",
        [title, price, year, image],
        function(err) {
            res.json({ id: this.lastID });
        }
    );
});

// Gemi sil
app.delete("/api/ships/:id", (req, res) => {
    db.run("DELETE FROM ships WHERE id = ?", [req.params.id]);
    res.json({ success: true });
});

app.listen(3000, () => {
    console.log("Server çalışıyor → http://localhost:3000");
});