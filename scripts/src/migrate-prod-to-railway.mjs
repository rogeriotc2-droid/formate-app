/**
 * migrate-prod-to-railway.mjs
 *
 * Copies specific user accounts from the Replit production database into the
 * Railway database.
 *
 * Usage (in Railway Console):
 *   SOURCE_DATABASE_URL="<replit-prod-url>" node scripts/src/migrate-prod-to-railway.mjs
 *
 * The script is fully idempotent — safe to run multiple times (uses ON CONFLICT DO NOTHING).
 * After inserting, it resets all serial sequences so new rows won't clash with migrated IDs.
 */

import pg from "pg";
const { Client } = pg;

const SOURCE_URL = process.env.SOURCE_DATABASE_URL;
const TARGET_URL = process.env.DATABASE_URL;

if (!SOURCE_URL) {
  console.error("ERROR: SOURCE_DATABASE_URL env var is required.");
  console.error("  Run: SOURCE_DATABASE_URL='...' node scripts/src/migrate-prod-to-railway.mjs");
  process.exit(1);
}
if (!TARGET_URL) {
  console.error("ERROR: DATABASE_URL env var is required (should already be set in Railway).");
  process.exit(1);
}

const USER_IDS = [
  "usr_a0ae35f7a97e46639d954d0db80f1236", // rogeriotc2@gmail.com — RTC owner
  "usr_10fda16b08ea4610b1a841e944b25a58", // appprss@gmail.com — Dawnacres
  "usr_1e6428b0d8884a51b951e8c5473c79c8", // hello@afterglowreviewapp.co.nz
  "usr_6ddbc92f513f474a8023859d4dbd4bc2", // joe@savillerowelectrical.co.nz
];
const COMPANY_IDS = [8, 9, 10, 11];

const src = new Client({ connectionString: SOURCE_URL, ssl: { rejectUnauthorized: false } });
const tgt = new Client({ connectionString: TARGET_URL, ssl: { rejectUnauthorized: false } });

await src.connect();
await tgt.connect();
console.log("Connected to both databases.\n");

/**
 * Insert rows into target table, skipping any that already exist (ON CONFLICT DO NOTHING).
 * Columns are derived dynamically from the first row so nothing gets missed.
 */
async function copyRows(tableName, rows, conflictCol = "id") {
  if (!rows.length) {
    console.log(`  ${tableName}: 0 rows — nothing to copy`);
    return;
  }
  const cols = Object.keys(rows[0]);
  const colList = cols.map((c) => `"${c}"`).join(", ");
  let inserted = 0;
  for (const row of rows) {
    const vals = cols.map((c) => row[c]);
    const placeholders = vals.map((_, i) => `$${i + 1}`).join(", ");
    const result = await tgt.query(
      `INSERT INTO "${tableName}" (${colList}) VALUES (${placeholders}) ON CONFLICT ("${conflictCol}") DO NOTHING`,
      vals
    );
    inserted += result.rowCount ?? 0;
  }
  console.log(`  ${tableName}: ${rows.length} fetched, ${inserted} inserted (${rows.length - inserted} already existed)`);
}

// ── 1. Users ──────────────────────────────────────────────────────────────────
console.log("1. Copying users...");
const { rows: users } = await src.query(
  "SELECT * FROM users WHERE id = ANY($1)",
  [USER_IDS]
);
await copyRows("users", users);

// ── 2. Companies ──────────────────────────────────────────────────────────────
console.log("2. Copying companies...");
const { rows: companies } = await src.query(
  "SELECT * FROM companies WHERE id = ANY($1)",
  [COMPANY_IDS]
);
await copyRows("companies", companies);

// ── 3. Sites ──────────────────────────────────────────────────────────────────
console.log("3. Copying sites...");
const { rows: sites } = await src.query(
  "SELECT * FROM sites WHERE user_id = ANY($1)",
  [USER_IDS]
);
await copyRows("sites", sites);

// ── 4. Templates ──────────────────────────────────────────────────────────────
console.log("4. Copying templates...");
const { rows: templates } = await src.query(
  "SELECT * FROM templates WHERE user_id = ANY($1)",
  [USER_IDS]
);
await copyRows("templates", templates);

// ── 5. Submissions ────────────────────────────────────────────────────────────
console.log("5. Copying submissions...");
const { rows: submissions } = await src.query(
  "SELECT * FROM submissions WHERE user_id = ANY($1)",
  [USER_IDS]
);
await copyRows("submissions", submissions);

// ── 6. Sticky values (keyed by template_id) ───────────────────────────────────
console.log("6. Copying sticky_values...");
const templateIds = templates.map((t) => t.id);
let stickies = [];
if (templateIds.length) {
  const { rows } = await src.query(
    "SELECT * FROM sticky_values WHERE template_id = ANY($1)",
    [templateIds]
  );
  stickies = rows;
}
await copyRows("sticky_values", stickies);

// ── 7. SSSPs ──────────────────────────────────────────────────────────────────
console.log("7. Copying sssps...");
const { rows: sssps } = await src.query(
  "SELECT * FROM sssps WHERE user_id = ANY($1)",
  [USER_IDS]
);
await copyRows("sssps", sssps);

// ── 8. JSAs ───────────────────────────────────────────────────────────────────
console.log("8. Copying jsa...");
const { rows: jsas } = await src.query(
  "SELECT * FROM jsa WHERE user_id = ANY($1)",
  [USER_IDS]
);
await copyRows("jsa", jsas);

// ── 9. SWMS ───────────────────────────────────────────────────────────────────
console.log("9. Copying swms...");
const { rows: swmsRows } = await src.query(
  "SELECT * FROM swms WHERE user_id = ANY($1)",
  [USER_IDS]
);
await copyRows("swms", swmsRows);

// ── 10. Audit log (for all copied documents) ──────────────────────────────────
console.log("10. Copying audit_log...");
const sssp_ids = sssps.map((s) => s.id);
const jsa_ids = jsas.map((j) => j.id);
const swms_ids = swmsRows.map((s) => s.id);
// Use [-1] as a no-op placeholder when a list is empty so the query stays valid
const auditQuery = `
  SELECT * FROM audit_log WHERE
    (document_type = 'sssp' AND document_id = ANY($1)) OR
    (document_type = 'jsa'  AND document_id = ANY($2)) OR
    (document_type = 'swms' AND document_id = ANY($3))
`;
const { rows: auditRows } = await src.query(auditQuery, [
  sssp_ids.length ? sssp_ids : [-1],
  jsa_ids.length ? jsa_ids : [-1],
  swms_ids.length ? swms_ids : [-1],
]);
await copyRows("audit_log", auditRows);

// ── 11. Licences ──────────────────────────────────────────────────────────────
console.log("11. Copying licences...");
const { rows: licences } = await src.query(
  "SELECT * FROM licences WHERE user_id = ANY($1)",
  [USER_IDS]
);
await copyRows("licences", licences);

// ── 12. Activity ──────────────────────────────────────────────────────────────
console.log("12. Copying activity...");
const { rows: activity } = await src.query(
  "SELECT * FROM activity WHERE user_id = ANY($1)",
  [USER_IDS]
);
await copyRows("activity", activity);

// ── 13. Reset serial sequences ────────────────────────────────────────────────
console.log("\n13. Resetting sequences...");
const serialTables = [
  "companies",
  "sites",
  "templates",
  "submissions",
  "sticky_values",
  "sssps",
  "jsa",
  "swms",
  "audit_log",
  "licences",
  "activity",
];
for (const table of serialTables) {
  await tgt.query(
    `SELECT setval(pg_get_serial_sequence($1, 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 1))`,
    [table]
  );
  console.log(`  ${table} sequence reset`);
}

await src.end();
await tgt.end();
console.log("\n✅ Migration complete!");
