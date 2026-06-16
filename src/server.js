const express = require("express");
const { Pool } = require("pg");
const { createClient } = require("redis");
const { validateName } = require("./validate");

const PORT = process.env.PORT || 3000;
const CACHE_TTL = Number(process.env.CACHE_TTL || 30); // sekundy
const ITEMS_CACHE_KEY = "items:all";

const pool = new Pool({
  host: process.env.PGHOST || "db",
  port: process.env.PGPORT || 5432,
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD || "postgres",
  database: process.env.PGDATABASE || "items",
});

const redis = createClient({
  url:
    process.env.REDIS_URL ||
    `redis://${process.env.REDISHOST || "cache"}:${process.env.REDISPORT || 6379}`,
});
redis.on("error", (e) => console.error("redis error:", e.message));

async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Cache-aside: najpierw Redis (HIT), w razie pudła baza + zapis do cache (MISS).
app.get("/items", async (_req, res) => {
  try {
    const cached = await redis.get(ITEMS_CACHE_KEY);
    if (cached) {
      res.set("X-Cache", "HIT");
      return res.json(JSON.parse(cached));
    }
    const r = await pool.query("SELECT id, name, created_at FROM items ORDER BY id");
    await redis.set(ITEMS_CACHE_KEY, JSON.stringify(r.rows), { EX: CACHE_TTL });
    res.set("X-Cache", "MISS");
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/items", async (req, res) => {
  const v = validateName(req.body && req.body.name);
  if (!v.ok) return res.status(400).json({ error: v.error });
  try {
    const r = await pool.query(
      "INSERT INTO items(name) VALUES($1) RETURNING id, name, created_at",
      [v.value]
    );
    await redis.del(ITEMS_CACHE_KEY); // unieważnij cache po zapisie
    res.status(201).json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

async function main() {
  await redis.connect();
  await initSchema();
  app.listen(PORT, () => console.log(`items-cache-api listening on ${PORT}`));
}

main().catch((e) => {
  console.error("startup failed:", e.message);
  process.exit(1);
});
