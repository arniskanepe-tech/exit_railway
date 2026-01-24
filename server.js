const path = require("path");
const express = require("express");
const fs = require("fs");
const db = require("./db");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

/* ================= STATIC ================= */
app.use(express.static(path.join(__dirname)));

app.get("/admin", (_req, res) => {
  res.sendFile(path.join(__dirname, "admin", "index.html"));
});

app.get("/admin/panel", (_req, res) => {
  res.sendFile(path.join(__dirname, "admin", "panel.html"));
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

/* ================= ADMIN AUTH ================= */
function requireAdmin(req, res, next) {
  const expected = process.env.ADMIN_TOKEN;

  // DEV režīms (lokāli vai bez tokena ENV)
  if (!expected) return next();

  const got = req.headers["x-admin-token"];
  if (got && String(got) === String(expected)) return next();

  return res.status(401).json({ ok: false, error: "Unauthorized" });
}

/* ================= DB INIT ================= */
async function runMigrations() {
  const sql = fs.readFileSync(
    path.join(__dirname, "migrations", "001_init.sql"),
    "utf8"
  );
  await db.query(sql);
}

async function seedIfEmpty() {
  const { rows } = await db.query("SELECT COUNT(*)::int AS c FROM levels");
  if (rows[0].c > 0) return;

  const seed = JSON.parse(
    fs.readFileSync(path.join(__dirname, "seed", "levels.json"), "utf8")
  );

  for (const l of seed) {
    await db.query(
      `INSERT INTO levels
       (title, background, target_slot, answer, card_html,
        hint1, hint2, hint3, active, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        l.title ?? "Uzdevums",
        l.background ?? "bg/bg.jpg",
        Number(l.targetSlot ?? 1),
        String(l.answer ?? ""),
        String(l.cardHtml ?? ""),
        l.hint1 ?? null,
        l.hint2 ?? null,
        l.hint3 ?? null,
        l.active !== false,
        Number(l.sortOrder ?? 100),
      ]
    );
  }
}

/* ================= GAME API ================= */
app.get("/api/levels/active", async (_req, res) => {
  const { rows } = await db.query(
    `SELECT id, title, background,
            target_slot AS "targetSlot",
            answer, card_html AS "cardHtml",
            hint1, hint2, hint3
     FROM levels
     WHERE active = true
     ORDER BY sort_order ASC, id ASC`
  );
  res.json({ ok: true, levels: rows });
});

/* ================= ADMIN API ================= */
app.get("/api/admin/levels", requireAdmin, async (_req, res) => {
  const { rows } = await db.query(
    `SELECT id, title, background,
            target_slot AS "targetSlot",
            answer, card_html AS "cardHtml",
            hint1, hint2, hint3,
            active, sort_order AS "sortOrder"
     FROM levels
     ORDER BY sort_order ASC, id ASC`
  );
  res.json({ ok: true, levels: rows });
});

app.post("/api/admin/levels", requireAdmin, async (req, res) => {
  const b = req.body;

  if (!b.title || !b.answer) {
    return res.status(400).json({ ok: false, error: "Invalid payload" });
  }

  const { rows } = await db.query(
    `INSERT INTO levels
     (title, background, target_slot, answer, card_html,
      hint1, hint2, hint3, active, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING id`,
    [
      b.title,
      b.background ?? null,
      Number(b.targetSlot),
      b.answer,
      b.cardHtml ?? "",
      b.hint1 ?? null,
      b.hint2 ?? null,
      b.hint3 ?? null,
      !!b.active,
      Number(b.sortOrder ?? 100),
    ]
  );

  res.json({ ok: true, id: rows[0].id });
});

app.put("/api/admin/levels/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const b = req.body;

  // toggle-only režīms
  if (Object.keys(b).length === 1 && typeof b.active === "boolean") {
    await db.query(
      `UPDATE levels SET active=$1 WHERE id=$2`,
      [b.active, id]
    );
    return res.json({ ok: true });
  }

  // full update
  await db.query(
    `UPDATE levels SET
       title=$1,
       background=$2,
       target_slot=$3,
       answer=$4,
       card_html=$5,
       hint1=$6,
       hint2=$7,
       hint3=$8,
       active=$9,
       sort_order=$10
     WHERE id=$11`,
    [
      b.title,
      b.background ?? null,
      Number(b.targetSlot),
      b.answer,
      b.cardHtml ?? "",
      b.hint1 ?? null,
      b.hint2 ?? null,
      b.hint3 ?? null,
      !!b.active,
      Number(b.sortOrder ?? 100),
      id,
    ]
  );

  res.json({ ok: true });
});

/* ================= START ================= */
(async () => {
  await runMigrations();
  await seedIfEmpty();

  app.listen(PORT, () => {
    console.log(`Serveris darbojas uz :${PORT}`);
  });
})();