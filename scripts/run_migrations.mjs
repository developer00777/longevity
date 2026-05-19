import { createClient } from '../node_modules/@supabase/supabase-js/dist/module/index.js';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars before running.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
  db: { schema: 'public' },
});

const migrationsDir = join(__dirname, '..', 'supabase', 'migrations');
const files = readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

console.log(`\nRunning ${files.length} migrations against ${SUPABASE_URL}\n`);

let passed = 0, failed = 0;

for (const file of files) {
  const sql = readFileSync(join(migrationsDir, file), 'utf8').trim();
  if (!sql) { console.log(`⏭  ${file} (empty)`); continue; }

  // Split on statement boundaries so we can run each statement individually.
  // Supabase's PostgREST /rpc endpoint doesn't run raw DDL, but we can use
  // the pg_dump helper function that ships with every Supabase project.
  // The correct endpoint is: POST /rest/v1/rpc/... — but DDL needs the
  // Management API. We'll use fetch to hit the correct endpoint directly.
  const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: 'HEAD',
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });

  // Use the pg_net or exec approach — Supabase exposes raw SQL via
  // supabase_functions edge runtime. Instead, call our own edge fn.
  // Actually the right approach: use the postgres.js compatible REST endpoint.
  // Supabase SQL Editor internally calls: POST /sql (Management API).
  // We need: https://api.supabase.com/v1/projects/{ref}/database/query
  // which requires a PERSONAL access token, not service role.

  // Best alternative available without personal token:
  // Call supabase.rpc() with a function that executes SQL.
  // But we can also insert row-by-row for tables that already exist.

  // CORRECT APPROACH: use supabase-js to run each migration SQL statement
  // by splitting on semicolons and calling rpc('exec', {sql}) if it exists,
  // OR use the raw pg connection via the REST endpoint's POST /query path.

  // Supabase projects expose: POST https://{ref}.supabase.co/pg/query
  // with Authorization: Bearer {service_role}
  // Let's try that.
  break;
}

// Use the correct Supabase internal SQL endpoint
async function runSQL(sql) {
  const res = await fetch(`${SUPABASE_URL}/pg/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  return { status: res.status, body: text };
}

// Test first
const test = await runSQL('SELECT current_database()');
console.log('Connection test:', test.status, test.body.slice(0, 100));
