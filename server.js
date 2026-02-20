const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "admin";
const ADMIN_COOKIE = "admin_auth";

function parseCookies(req) {
  const header = req.headers.cookie || "";
  return header.split(";").reduce((acc, part) => {
    const [k, ...v] = part.trim().split("=");
    if (!k) return acc;
    acc[k] = decodeURIComponent(v.join("="));
    return acc;
  }, {});
}

function isAdmin(req) {
  const cookies = parseCookies(req);
  return cookies[ADMIN_COOKIE] === "1";
}

function requireAdmin(req, res, next) {
  if (isAdmin(req)) return next();
  return res.redirect("/admin/login");
}

function requireAdminApi(req, res, next) {
  if (isAdmin(req)) return next();
  return res.status(401).json({ error: "Admin girisi gerekli." });
}

const db = new sqlite3.Database("database.db");

db.run(`
CREATE TABLE IF NOT EXISTS ships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  price TEXT,
  year TEXT,
  image TEXT,
  length TEXT DEFAULT '',
  type TEXT DEFAULT '',
  flag TEXT DEFAULT '',
  location TEXT DEFAULT '',
  engine TEXT DEFAULT '',
  condition TEXT DEFAULT '',
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'active'
)
`);

const migrationStatements = [
  "ALTER TABLE ships ADD COLUMN length TEXT DEFAULT ''",
  "ALTER TABLE ships ADD COLUMN type TEXT DEFAULT ''",
  "ALTER TABLE ships ADD COLUMN flag TEXT DEFAULT ''",
  "ALTER TABLE ships ADD COLUMN location TEXT DEFAULT ''",
  "ALTER TABLE ships ADD COLUMN engine TEXT DEFAULT ''",
  "ALTER TABLE ships ADD COLUMN condition TEXT DEFAULT ''",
  "ALTER TABLE ships ADD COLUMN description TEXT DEFAULT ''",
  "ALTER TABLE ships ADD COLUMN status TEXT DEFAULT 'active'"
];

migrationStatements.forEach((sql) => {
  db.run(sql, (err) => {
    if (err && !String(err.message).includes("duplicate column name")) {
      console.error("Migration error:", err.message);
    }
  });
});

db.run("UPDATE ships SET status = 'active' WHERE status IS NULL OR status = ''");

const seedShips = [
  {
    title: "Yuk Gemisi",
    price: "2M$",
    year: "2018",
    image: "images/ship1.JPG",
    length: "50 metre",
    type: "Kuru Yuk Gemisi",
    flag: "Malta",
    location: "Istanbul",
    engine: "Cift Dizel",
    condition: "Hazir Teslim",
    description: "Kisa ve orta mesafe ticari operasyonlar icin optimize edilmistir.",
    status: "active"
  },
  {
    title: "Tanker",
    price: "3M$",
    year: "2020",
    image: "images/ship2.JPG",
    length: "70 metre",
    type: "Petrol Tankeri",
    flag: "Liberia",
    location: "Izmir",
    engine: "Turbo Dizel",
    condition: "Operasyona Hazir",
    description: "Uzun menzilli sivi yuk tasimaciligi icin guclu performans sunar.",
    status: "active"
  },
  {
    title: "Kargo Gemisi",
    price: "2.5M$",
    year: "2019",
    image: "images/ship3.JPG",
    length: "65 metre",
    type: "Konteyner Gemisi",
    flag: "Panama",
    location: "Mersin",
    engine: "Dizel Elektrik",
    condition: "Hazir Teslim",
    description: "Orta olcekli operasyonlar icin verimli kargo kapasitesi sunar.",
    status: "active"
  }
];

db.get("SELECT COUNT(*) as total FROM ships", [], (err, row) => {
  if (err) {
    console.error("Seed check error:", err.message);
    return;
  }

  if (row.total === 0) {
    const stmt = db.prepare(`
      INSERT INTO ships
      (title, price, year, image, length, type, flag, location, engine, condition, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    seedShips.forEach((ship) => {
      stmt.run([
        ship.title,
        ship.price,
        ship.year,
        ship.image,
        ship.length,
        ship.type,
        ship.flag,
        ship.location,
        ship.engine,
        ship.condition,
        ship.description,
        ship.status
      ]);
    });

    stmt.finalize();
  }
});

app.get("/admin", (req, res) => {
  if (isAdmin(req)) {
    return res.redirect("/admin/dashboard");
  }
  return res.redirect("/admin/login");
});

app.get("/admin/login", (req, res) => {
  if (isAdmin(req)) {
    return res.redirect("/admin/dashboard");
  }
  res.sendFile(path.join(__dirname, "admin-login.html"));
});

app.get("/admin/panel", requireAdmin, (req, res) => {
  return res.redirect("/admin/dashboard");
});

function serveAdminPage(pageFile) {
  return (req, res) => res.sendFile(path.join(__dirname, pageFile));
}

app.get("/admin/dashboard", requireAdmin, serveAdminPage("admin-dashboard.html"));
app.get("/admin/home", requireAdmin, serveAdminPage("admin-home.html"));
app.get("/admin/listings", requireAdmin, serveAdminPage("admin-listings.html"));
app.get("/admin/about", requireAdmin, serveAdminPage("admin-about.html"));
app.get("/admin/contact", requireAdmin, serveAdminPage("admin-contact.html"));
app.get("/admin/ship", requireAdmin, serveAdminPage("admin-ship.html"));
app.get("/admin/index.html", requireAdmin, (req, res) => res.redirect("/admin/home"));
app.get("/admin/listings.html", requireAdmin, (req, res) => res.redirect("/admin/listings"));
app.get("/admin/about.html", requireAdmin, (req, res) => res.redirect("/admin/about"));
app.get("/admin/contact.html", requireAdmin, (req, res) => res.redirect("/admin/contact"));
app.get("/admin/ship.html", requireAdmin, (req, res) => res.redirect(`/admin/ship${req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : ""}`));

app.get("/api/admin/me", (req, res) => {
  res.json({ authenticated: isAdmin(req) });
});

app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body || {};
  if (username !== ADMIN_USER || password !== ADMIN_PASS) {
    return res.status(401).json({ error: "Kullanici adi veya sifre hatali." });
  }

  res.setHeader("Set-Cookie", `${ADMIN_COOKIE}=1; HttpOnly; Path=/; Max-Age=28800; SameSite=Lax`);
  return res.json({ success: true });
});

app.post("/admin/login", (req, res) => {
  const { username, password } = req.body || {};
  if (username !== ADMIN_USER || password !== ADMIN_PASS) {
    return res.redirect("/admin/login?error=1");
  }
  res.setHeader("Set-Cookie", `${ADMIN_COOKIE}=1; HttpOnly; Path=/; Max-Age=28800; SameSite=Lax`);
  return res.redirect("/admin/dashboard");
});

app.post("/api/admin/logout", (req, res) => {
  res.setHeader("Set-Cookie", `${ADMIN_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);
  return res.json({ success: true });
});

app.use(express.static("."));

app.get("/api/ships", (req, res) => {
  db.all("SELECT * FROM ships WHERE status = 'active' ORDER BY id DESC", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.get("/api/ships/trash", requireAdminApi, (req, res) => {
  db.all("SELECT * FROM ships WHERE status = 'trash' ORDER BY id DESC", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.get("/api/ships/:id", (req, res) => {
  db.get("SELECT * FROM ships WHERE id = ?", [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: "Ilan bulunamadi." });
    }
    res.json(row);
  });
});

app.post("/api/ships", requireAdminApi, (req, res) => {
  const {
    title,
    price,
    year,
    image,
    length = "",
    type = "",
    flag = "",
    location = "",
    engine = "",
    condition = "",
    description = ""
  } = req.body || {};

  if (!title || !price || !year || !image) {
    return res.status(400).json({ error: "Baslik, fiyat, yil ve resim zorunludur." });
  }

  db.run(
    `
      INSERT INTO ships
      (title, price, year, image, length, type, flag, location, engine, condition, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `,
    [title, price, year, image, length, type, flag, location, engine, condition, description],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID });
    }
  );
});

app.patch("/api/ships/:id/trash", requireAdminApi, (req, res) => {
  db.run("UPDATE ships SET status = 'trash' WHERE id = ?", [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: this.changes > 0 });
  });
});

app.patch("/api/ships/:id/restore", requireAdminApi, (req, res) => {
  db.run("UPDATE ships SET status = 'active' WHERE id = ?", [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: this.changes > 0 });
  });
});

app.delete("/api/ships/:id/permanent", requireAdminApi, (req, res) => {
  db.run("DELETE FROM ships WHERE id = ?", [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: this.changes > 0 });
  });
});

app.listen(3000, () => {
  console.log("Server calisiyor -> http://localhost:3000");
  console.log("Admin girisi -> http://localhost:3000/admin/login");
});
