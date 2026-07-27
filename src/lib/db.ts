/**
 * Dual-driver data layer.
 * - With DATABASE_URL set (e.g. Supabase Postgres): uses node-postgres.
 * - Without it: falls back to Node's built-in SQLite at data/eaccess.db (zero-setup local dev).
 *
 * Query API (async, dialect-neutral):
 *   q(sql, params)  -> all rows
 *   q1(sql, params) -> first row or null
 *   run(sql, params)-> void (INSERT/UPDATE/DELETE); use `RETURNING id` + q1 to get new ids
 * SQL uses $1..$n placeholders. Timestamps are passed in from JS (nowIso()) so both dialects agree.
 */
import bcrypt from "bcryptjs";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import { Pool } from "pg";

export function nowIso(): string {
  return new Date().toISOString();
}
export function daysFromNowIso(days: number): string {
  return new Date(Date.now() + days * 86400000).toISOString();
}

type Row = Record<string, unknown>;

interface Driver {
  q(sql: string, params?: unknown[]): Promise<Row[]>;
  run(sql: string, params?: unknown[]): Promise<void>;
}

/* ---------------------------------- Postgres ---------------------------------- */

function pgDriver(url: string): Driver {
  const pool = new Pool({
    connectionString: url,
    ssl: url.includes("localhost") || url.includes("127.0.0.1") ? undefined : { rejectUnauthorized: false },
    max: 5,
  });
  // Case-insensitive search parity with SQLite's LIKE
  const fix = (sql: string) => sql.replace(/\bLIKE\b/g, "ILIKE");
  return {
    async q(sql, params = []) {
      const res = await pool.query(fix(sql), params);
      return res.rows as Row[];
    },
    async run(sql, params = []) {
      await pool.query(fix(sql), params);
    },
  };
}

/* ----------------------------------- SQLite ----------------------------------- */

function sqliteDriver(): Driver {
  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  const db = new DatabaseSync(path.join(dir, "eaccess.db"));
  db.exec("PRAGMA journal_mode = WAL;");
  const toQmark = (sql: string) => sql.replace(/\$\d+/g, "?");
  const reorder = (sql: string, params: unknown[]) => {
    // map $n occurrences (in order of appearance) to positional list
    const order: number[] = [];
    sql.replace(/\$(\d+)/g, (_, n) => { order.push(Number(n) - 1); return ""; });
    return order.map((i) => params[i]);
  };
  return {
    async q(sql, params = []) {
      const rows = db.prepare(toQmark(sql)).all(...(reorder(sql, params) as never[]));
      return rows.map((r) => ({ ...r })) as Row[];
    },
    async run(sql, params = []) {
      db.prepare(toQmark(sql)).run(...(reorder(sql, params) as never[]));
    },
  };
}

/* --------------------------------- Bootstrap ----------------------------------- */

const IS_PG = !!process.env.DATABASE_URL;

let _driver: Driver | null = null;
let _ready: Promise<void> | null = null;

function driver(): Driver {
  if (!_driver) _driver = IS_PG ? pgDriver(process.env.DATABASE_URL!) : sqliteDriver();
  return _driver;
}

async function ensureReady(): Promise<void> {
  if (!_ready) {
    _ready = migrate().then(seed).then(seedActivity).then(ensureAdmin);
    // Don't cache failures — allow retry on the next request (e.g. transient DB outage at boot)
    _ready.catch(() => { _ready = null; });
  }
  return _ready;
}

export async function q<T = Row>(sql: string, params: unknown[] = []): Promise<T[]> {
  await ensureReady();
  return driver().q(sql, params) as Promise<T[]>;
}
export async function q1<T = Row>(sql: string, params: unknown[] = []): Promise<T | null> {
  const rows = await q<T>(sql, params);
  return rows[0] ?? null;
}
export async function run(sql: string, params: unknown[] = []): Promise<void> {
  await ensureReady();
  return driver().run(sql, params);
}

/* ----------------------------------- Schema ------------------------------------ */

const ID = IS_PG ? "id SERIAL PRIMARY KEY" : "id INTEGER PRIMARY KEY AUTOINCREMENT";
const NOW = IS_PG ? "now()" : "(datetime('now'))";

async function migrate() {
  const d = driver();
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      ${ID},
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      email_verified INTEGER NOT NULL DEFAULT 0,
      verify_code TEXT,
      reset_token TEXT,
      preferences_json TEXT,
      avatar_color TEXT NOT NULL DEFAULT '#0D06A7',
      created_at TEXT NOT NULL DEFAULT ${NOW}
    )`,
    `CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT ${NOW},
      expires_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS listings (
      ${ID},
      owner_id INTEGER,
      title TEXT NOT NULL,
      purpose TEXT NOT NULL DEFAULT 'sale',
      property_type TEXT NOT NULL,
      price BIGINT NOT NULL,
      location_area TEXT NOT NULL,
      location_city TEXT NOT NULL,
      estate_name TEXT,
      bedrooms INTEGER,
      bathrooms INTEGER,
      toilets INTEGER,
      land_size_sqm INTEGER,
      description TEXT,
      verification_status TEXT NOT NULL DEFAULT 'unverified',
      inspection_available INTEGER NOT NULL DEFAULT 1,
      documents_approved INTEGER NOT NULL DEFAULT 0,
      featured INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      views INTEGER NOT NULL DEFAULT 0,
      saves INTEGER NOT NULL DEFAULT 0,
      image_seed INTEGER NOT NULL DEFAULT 1,
      amenities_json TEXT,
      created_at TEXT NOT NULL DEFAULT ${NOW}
    )`,
    `CREATE TABLE IF NOT EXISTS listing_media (
      ${ID},
      listing_id INTEGER NOT NULL,
      kind TEXT NOT NULL DEFAULT 'photo',
      url TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS listing_documents (
      ${ID},
      listing_id INTEGER NOT NULL,
      doc_type TEXT NOT NULL,
      file_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      uploaded_at TEXT NOT NULL DEFAULT ${NOW}
    )`,
    `CREATE TABLE IF NOT EXISTS saved_listings (
      user_id INTEGER NOT NULL,
      listing_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT ${NOW},
      PRIMARY KEY (user_id, listing_id)
    )`,
    `CREATE TABLE IF NOT EXISTS inspections (
      ${ID},
      listing_id INTEGER NOT NULL,
      requester_id INTEGER NOT NULL,
      mode TEXT NOT NULL DEFAULT 'physical',
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT ${NOW}
    )`,
    `CREATE TABLE IF NOT EXISTS inquiries (
      ${ID},
      listing_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL DEFAULT ${NOW}
    )`,
    `CREATE TABLE IF NOT EXISTS threads (
      ${ID},
      user_id INTEGER NOT NULL,
      counterpart_name TEXT NOT NULL,
      counterpart_role TEXT NOT NULL DEFAULT 'consultant',
      created_at TEXT NOT NULL DEFAULT ${NOW}
    )`,
    `CREATE TABLE IF NOT EXISTS notifications (
      ${ID},
      user_id INTEGER NOT NULL,
      kind TEXT NOT NULL DEFAULT 'info',
      title TEXT NOT NULL,
      body TEXT,
      href TEXT,
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT ${NOW}
    )`,
    `CREATE TABLE IF NOT EXISTS messages (
      ${ID},
      thread_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT ${NOW}
    )`,
  ];
  for (const t of tables) await d.run(t);
  // additive migrations (ignore "already exists")
  try { await d.run("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'"); } catch { /* exists */ }
  // migrate legacy demo account name
  await d.run("UPDATE users SET email = 'wale@eaccess.demo', full_name = 'Wale Adeyemi' WHERE email = 'daniel@eaccess.demo'");
  // Wale's account gets admin so the Admin Panel link is visible in the sidebar
  await d.run("UPDATE users SET role = 'admin' WHERE email = 'wale@eaccess.demo'");
}

async function ensureAdmin() {
  const d = driver();
  const admin = await d.q("SELECT id FROM users WHERE email = 'admin@eaccess.demo'");
  if (!admin.length) {
    await d.run(
      "INSERT INTO users (full_name, email, password_hash, email_verified, avatar_color, role) VALUES ($1,$2,$3,1,$4,'admin')",
      ["E-Access Admin", "admin@eaccess.demo", bcrypt.hashSync("password123", 10), "#B45309"]
    );
  }
}

/* ------------------------------------ Seed ------------------------------------- */

const AREAS: [string, string][] = [
  ["Lekki Free Trade Zone", "Lagos"], ["Choba", "Port Harcourt"], ["Gwarinpa", "Abuja"],
  ["Ikate, Lekki", "Lagos"], ["Ajah", "Lagos"], ["Epe", "Lagos"], ["Asokoro", "Abuja"],
  ["GRA Phase 2", "Port Harcourt"], ["Ibeju-Lekki", "Lagos"], ["Wuse 2", "Abuja"],
  ["Sangotedo", "Lagos"], ["Katampe Extension", "Abuja"],
];
const ESTATES = [
  "Emerald Garden Estate", "Amen Estate", "Pearl Gardens", "Royal County Estate",
  "Greenfield Acres", "Cedarwood Park", "Bluebell Court", "Horizon Heights",
];

async function seed() {
  const d = driver();
  const c = await d.q("SELECT COUNT(*) AS c FROM listings");
  if (Number((c[0] as { c: number | string }).c) > 0) return;

  const demoHash = bcrypt.hashSync("password123", 10);
  const owner = await d.q(
    "INSERT INTO users (full_name, email, password_hash, email_verified, preferences_json) VALUES ($1,$2,$3,1,$4) RETURNING id",
    ["Wale Adeyemi", "wale@eaccess.demo", demoHash,
      JSON.stringify({ purpose: "buy", types: ["land", "apartment"], budget: "10m-50m", locations: ["Lagos"] })]
  );
  const ownerId = Number((owner[0] as { id: number }).id);

  const types = ["land", "apartment", "duplex", "commercial"] as const;
  const titles: Record<(typeof types)[number], string[]> = {
    land: ["Residential land", "Fenced dry land", "Corner-piece plot", "Commercial plot"],
    apartment: ["2 bedroom flat", "3 bedroom apartment", "Luxury 1 bed mini flat", "Serviced 2 bed apartment"],
    duplex: ["4 bedroom semi-detached duplex", "5 bedroom fully detached duplex", "3 bedroom terrace duplex"],
    commercial: ["Open-plan office space", "Retail complex", "Warehouse facility"],
  };

  // Build all 36 listings, then insert in ONE statement (serverless-timeout safe)
  const rows: unknown[][] = [];
  const verifications: string[] = [];
  for (let i = 0; i < 36; i++) {
    const type = types[i % types.length];
    const tlist = titles[type];
    const [area, city] = AREAS[i % AREAS.length];
    const estate = ESTATES[i % ESTATES.length];
    const purpose = i % 5 === 0 ? "rent" : "sale";
    const beds = type === "land" ? null : type === "commercial" ? null : (i % 4) + 1;
    const base =
      type === "land" ? 4_500_000 + (i % 12) * 3_250_000 :
      type === "apartment" ? (purpose === "rent" ? 1_200_000 + (i % 8) * 450_000 : 18_500_000 + (i % 10) * 6_500_000) :
      type === "duplex" ? 85_000_000 + (i % 8) * 32_500_000 :
      45_000_000 + (i % 6) * 27_000_000;
    const title =
      type === "land"
        ? `${tlist[i % tlist.length]} in ${area.split(",")[0]} for ${purpose === "rent" ? "lease" : "sale"}`
        : `${beds ?? ""} ${tlist[i % tlist.length].replace(/^\d+ bedroom /, "")} in ${area.split(",")[0]} for ${purpose === "rent" ? "rent" : "sale"}`.trim();
    const verification = ["verified", "verified", "verified", "under_review", "unverified"][i % 5];
    verifications.push(verification);
    rows.push([
      ownerId, title, purpose, type, base, area, city, estate,
      beds, beds, beds ? beds + 1 : null,
      type === "land" ? 300 + (i % 6) * 150 : type === "commercial" ? 800 + (i % 4) * 400 : null,
      `This ${type === "land" ? "plot" : type} sits inside ${estate}, ${area}, ${city}. Backed by document verification, developer credibility checks and inspection support from the E-Access team. Titled, surveyed and ready for a secure transaction.`,
      verification, 1, verification === "verified" ? 1 : 0,
      i % 6 === 0 ? 1 : 0, "active",
      140 + ((i * 37) % 900), 6 + ((i * 13) % 90), (i % 12) + 1,
      JSON.stringify(["24/7 Security", "Gated Estate", "Good Road Network", "Electricity", "Water Supply"].slice(0, 3 + (i % 3))),
    ]);
  }
  const COLS = 22;
  const valuesSql = rows
    .map((_, r) => `(${Array.from({ length: COLS }, (_, c) => `$${r * COLS + c + 1}`).join(",")})`)
    .join(",");
  const inserted = await d.q(
    `INSERT INTO listings (owner_id, title, purpose, property_type, price, location_area, location_city, estate_name,
      bedrooms, bathrooms, toilets, land_size_sqm, description, verification_status,
      inspection_available, documents_approved, featured, status, views, saves, image_seed, amenities_json)
     VALUES ${valuesSql} RETURNING id`,
    rows.flat()
  );
  // Documents: one batched insert for all listings
  const docRows: unknown[][] = [];
  const docNames = ["Certificate of Occupancy", "Survey Plan", "Deed of Assignment"];
  inserted.forEach((row, i) => {
    const listingId = Number((row as { id: number }).id);
    docNames.forEach((doc, j) => {
      docRows.push([
        listingId, doc, `${doc.toLowerCase().replace(/ /g, "_")}.pdf`,
        verifications[i] === "verified" ? "approved" : j === 0 ? "under_review" : "pending",
      ]);
    });
  });
  const docValuesSql = docRows
    .map((_, r) => `($${r * 4 + 1},$${r * 4 + 2},$${r * 4 + 3},$${r * 4 + 4})`)
    .join(",");
  await d.run(
    `INSERT INTO listing_documents (listing_id, doc_type, file_name, status) VALUES ${docValuesSql}`,
    docRows.flat()
  );
}

async function seedActivity() {
  const d = driver();
  const exists = await d.q("SELECT id FROM users WHERE email = 'buyer@eaccess.demo'");
  if (exists.length) return;
  const has = await d.q("SELECT COUNT(*) AS c FROM listings");
  if (!Number((has[0] as { c: number | string }).c)) return;
  const buyer = await d.q(
    "INSERT INTO users (full_name, email, password_hash, email_verified, avatar_color) VALUES ($1,$2,$3,1,$4) RETURNING id",
    ["Daniel Okafor", "buyer@eaccess.demo", bcrypt.hashSync("password123", 10), "#0E7490"]
  );
  const buyerId = Number((buyer[0] as { id: number }).id);
  const listings = await d.q("SELECT id FROM listings ORDER BY id LIMIT 4");
  const ids = listings.map((r) => Number((r as { id: number }).id));
  const day = (offset: number) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
  const insp = [
    [ids[0], "physical", day(3), "12:00", "I'd like to check the drainage and road access.", "pending"],
    [ids[1], "physical", day(1), "14:00", null, "confirmed"],
    [ids[2], "remote", day(-6), "10:30", null, "completed"],
    [ids[3], "physical", day(-2), "09:00", null, "cancelled"],
  ] as const;
  for (const [lid, mode, date, time, notes, status] of insp) {
    await d.run(
      "INSERT INTO inspections (listing_id, requester_id, mode, date, time, notes, status) VALUES ($1,$2,$3,$4,$5,$6,$7)",
      [lid, buyerId, mode, date, time, notes, status]
    );
  }
  await d.run("INSERT INTO inquiries (listing_id, sender_id, message, status) VALUES ($1,$2,$3,$4)",
    [ids[0], buyerId, "Good day, is this property still available? I'm interested in a physical inspection and would also like to see the survey plan.", "new"]);
  await d.run("INSERT INTO inquiries (listing_id, sender_id, message, status) VALUES ($1,$2,$3,$4)",
    [ids[1], buyerId, "Can you share the payment structure? Is an instalment plan possible over 6 months?", "new"]);
}
