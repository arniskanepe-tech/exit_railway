// server.js
// Disku spēle + Admin v1 (serveris)
//
// ŠIS SERVERIS (tagad):
// 1) Servē statiskos failus (spēle un admin lapas)
// 2) Dod stabilus URL /admin un /admin/panel
// 3) Inicializē Postgres (migrācija + seed)
// 4) API spēlei:   GET  /api/levels/active
// 5) API adminam:  GET  /api/admin/levels   (jauns)
//                 PUT  /api/admin/levels/:id
// 6) Healthcheck:  GET  /health

const path = require("path");
const express = require("express");
const fs = require("fs");

// DB (PostgreSQL)
const db = require("./db");

// ================== DB INIT ==================
async function runMigrations() {
  const sqlPath = path.join(__dirname, "migrations", "001_init.sql");
  const sql = fs.readFileSync(sqlPath, "utf-8");
  await db.query(sql);
  console.log("DB migrācijas izpildītas (001_init.sql)");
}

async function seedIfEmpty() {
  const { rows } = await db.query("SELECT COUNT(*)::int AS count FROM levels");
  const count = rows?.[0]?.count ?? 0;

  if (count > 0) {
    console.log(`Seed nav vajadzīgs (levels ieraksti: ${count})`);
    return;
  }

  const seedPath = path.join(__dirname, "seed", "levels.json");
  const raw = fs.readFileSync(seedPath, "utf-8");
  const seedLevels = JSON.parse(raw);

  console.log(`Seed: ielieku ${seedLevels.length} līmeņus...`);

  for (const lvl of seedLevels) {
    await db.query(
      `INSERT INTO levels
       (title, background, target_slot, answer, card_html, hint1, hint2, hint3, active, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        lvl.title ?? "Uzdevums",
        lvl.background ?? "bg.jpg",
        Number(lvl.targetSlot ?? 1),
        String(lvl.answer ?? ""),
        String(lvl.cardHtml ?? ""),
        lvl.hint1 ?? null,
        lvl.hint2 ?? null,
        lvl.hint3 ?? null,
        (lvl.active !== undefined ? !!lvl.active : true),
        Number(lvl.sortOrder ?? 100),
      ]
    );
  }

  console.log("Seed pabeigts.");
}

// ================== APP ==================
const app = express();
app.use(express.json());

// Railway dod PORT. Lokāli var būt 3000.
const PORT = process.env.PORT || 3000;

// 1) Statiskie faili (index.html, assets, admin, utt.)
app.use(express.static(path.join(__dirname)));

// 2) /admin -> admin login lapa
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin", "index.html"));
});

// 3) /admin/panel -> ērtāks URL (bez .html)
app.get("/admin/panel", (req, res) => {
  res.sendFile(path.join(__dirname, "admin", "panel.html"));
});

// 4) Healthcheck
app.get("/health", (req, res) => {
  res.status(200).json({ ok: true });
});

// ================== ADMIN AUTH ==================
// Klients (admin panelis) sūta header: x-admin-token: <atslēga>
// Serveris salīdzina ar ENV: ADMIN_TOKEN
function requireAdmin(req, res, next) {
  const expected = process.env.ADMIN_TOKEN;

  // Ja ADMIN_TOKEN nav uzstādīts -> dev režīms (atvērts),
  // bet Railway vidē ieteicams uzlikt.
  if (!expected) {
    console.warn("BRĪDINĀJUMS: ADMIN_TOKEN nav uzstādīts. Admin API ir atvērts (dev režīms).");
    return next();
  }

  const got = req.headers["x-admin-token"];
  if (got && String(got) === String(expected)) return next();

  return res.status(401).json({ ok: false, error: "Unauthorized" });
}

// ===== Admin: vienreizējs imports no seed/levels.json =====
// ŠIS ENDPOINTS:
// - ielasa seed/levels.json
// - pievieno DB trūkstošos līmeņus (droši: nepārraksta esošos)
// - ideāli vienreizējai “pārcelšanai” uz Railway
app.post("/api/admin/import-seed", requireAdmin, async (req, res) => {
  try {
    const seedPath = path.join(__dirname, "seed", "levels.json");
    const raw = fs.readFileSync(seedPath, "utf-8");
    const seedLevels = JSON.parse(raw);

    if (!Array.isArray(seedLevels) || seedLevels.length === 0) {
      return res.status(400).json({ ok: false, error: "seed/levels.json ir tukšs vai nav masīvs" });
    }

    // Paņemam esošos līmeņus, lai varam noteikt "trūkstošos".
    // Drošais variants: salīdzinām pēc (background + targetSlot + answer).
    // (Ja tev vēlāk būs "slug" vai "externalId", tad salīdzināsim pēc tā.)
    const { rows: existing } = await db.query(
      `SELECT id, background, target_slot AS "targetSlot", answer
       FROM levels`
    );

    const keyOf = (lvl) => {
      const bg = String(lvl.background ?? "");
      const ts = String(lvl.targetSlot ?? "");
      const ans = String(lvl.answer ?? "");
      return `${bg}__${ts}__${ans}`;
    };

    const existingKeys = new Set(existing.map(r => `${r.background}__${r.targetSlot}__${r.answer}`));

    let inserted = 0;
    let skipped = 0;

    for (const lvl of seedLevels) {
      const key = keyOf(lvl);
      if (existingKeys.has(key)) {
        skipped++;
        continue;
      }

      await db.query(
        `INSERT INTO levels
         (title, background, target_slot, answer, card_html, hint1, hint2, hint3, active, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          lvl.title ?? "Uzdevums",
          lvl.background ?? "bg.jpg",
          Number(lvl.targetSlot ?? 1),
          String(lvl.answer ?? ""),
          String(lvl.cardHtml ?? ""),
          lvl.hint1 ?? null,
          lvl.hint2 ?? null,
          lvl.hint3 ?? null,
          (lvl.active !== undefined ? !!lvl.active : true),
          Number(lvl.sortOrder ?? 100),
        ]
      );

      inserted++;
      existingKeys.add(key);
    }

    return res.json({
      ok: true,
      summary: {
        totalInSeed: seedLevels.length,
        inserted,
        skipped,
      }
    });
  } catch (err) {
    console.error("Kļūda POST /api/admin/import-seed:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});




// ================== API (GAME) ==================
// Atgriež tikai aktīvos līmeņus pareizā secībā
app.get("/api/levels/active", async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id,
              title,
              background,
              target_slot AS "targetSlot",
              answer,
              card_html AS "cardHtml",
              hint1, hint2, hint3
       FROM levels
       WHERE active = TRUE
       ORDER BY sort_order ASC, id ASC`
    );
    res.json({ ok: true, levels: rows });
  } catch (err) {
    console.error("Kļūda GET /api/levels/active:", err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

// ================== API (ADMIN) ==================
// ✅ JAUNAIS: atgriež VISUS līmeņus admin panelim (ar active + sortOrder)
app.get("/api/admin/levels", requireAdmin, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id,
              title,
              background,
              target_slot AS "targetSlot",
              answer,
              card_html AS "cardHtml",
              hint1, hint2, hint3,
              active,
              sort_order AS "sortOrder",
              created_at AS "createdAt",
              updated_at AS "updatedAt"
       FROM levels
       ORDER BY sort_order ASC, id ASC`
    );

    res.json({ ok: true, levels: rows });
  } catch (err) {
    console.error("Kļūda GET /api/admin/levels:", err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

// Atjaunina līmeni (v1: tikai active ieslēgšana/izslēgšana)
app.put("/api/admin/levels/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ ok: false, error: "Bad id" });
    }

    const { active } = req.body || {};
    if (typeof active !== "boolean") {
      return res.status(400).json({ ok: false, error: "Body must contain boolean 'active'" });
    }

    const { rows } = await db.query(
      `UPDATE levels
       SET active = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, active, updated_at AS "updatedAt"`,
      [active, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: "Not found" });
    }

    res.json({ ok: true, level: rows[0] });
  } catch (err) {
    console.error("Kļūda PUT /api/admin/levels/:id:", err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

// ================== STARTUP ==================
(async () => {
  try {
    await runMigrations();
    await seedIfEmpty();
  } catch (err) {
    console.error("Kļūda migrācijās/seed:", err);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Serveris darbojas: http://localhost:${PORT}`);
  });
})();
