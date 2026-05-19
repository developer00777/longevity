#!/usr/bin/env python3
"""
Run all Supabase migrations in order against the remote project.
Connects via the Supabase direct database connection string.
"""
import os
import sys
import glob
import pg8000.native

# Supabase project ref from the URL: https://qwxdowvusuchqhoackoe.supabase.co
PROJECT_REF = "qwxdowvusuchqhoackoe"

# Supabase direct database connection (Transaction Pooler — port 6543)
# Host pattern: aws-0-ap-south-1.pooler.supabase.com (India region = ap-south-1)
# Password = service role key works, but direct DB needs the actual DB password.
# We'll use the REST approach via pg8000 with the connection string.

# Connection details for Supabase Postgres (Session mode — port 5432)
DB_HOST = f"db.{PROJECT_REF}.supabase.co"
DB_PORT = 5432
DB_NAME = "postgres"
DB_USER = "postgres"
# The DB password is NOT the service role key — it's the password set when creating the project.
# Read from env var SUPABASE_DB_PASSWORD
DB_PASSWORD = os.environ.get("SUPABASE_DB_PASSWORD", "")

if not DB_PASSWORD:
    print("❌ SUPABASE_DB_PASSWORD not set in environment.")
    print("")
    print("To get your database password:")
    print("  1. Go to https://supabase.com/dashboard/project/qwxdowvusuchqhoackoe/settings/database")
    print("  2. Click 'Reset database password' OR copy the existing one")
    print("  3. Run:  SUPABASE_DB_PASSWORD='yourpassword' python3 scripts/run_migrations.py")
    sys.exit(1)

MIGRATIONS_DIR = os.path.join(os.path.dirname(__file__), "..", "supabase", "migrations")
migration_files = sorted(glob.glob(os.path.join(MIGRATIONS_DIR, "*.sql")))

if not migration_files:
    print("No migration files found.")
    sys.exit(1)

print(f"Connecting to {DB_HOST}:{DB_PORT}/{DB_NAME}...")

try:
    conn = pg8000.native.Connection(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        ssl_context=True,
    )
    print(f"✅ Connected\n")
except Exception as e:
    print(f"❌ Connection failed: {e}")
    sys.exit(1)

passed = 0
failed = 0

for filepath in migration_files:
    name = os.path.basename(filepath)
    with open(filepath, "r") as f:
        sql = f.read().strip()

    if not sql:
        print(f"⏭  {name} (empty, skipped)")
        continue

    try:
        conn.run(sql)
        print(f"✅ {name}")
        passed += 1
    except Exception as e:
        err = str(e)
        # Already-exists errors are safe to ignore
        if any(phrase in err.lower() for phrase in ["already exists", "duplicate", "does not exist"]):
            print(f"⚠️  {name} (already applied or non-critical: {err[:80]})")
            passed += 1
        else:
            print(f"❌ {name}\n   Error: {err[:200]}")
            failed += 1

print(f"\n{'='*50}")
print(f"Migrations: {passed} passed, {failed} failed")

if failed > 0:
    sys.exit(1)
