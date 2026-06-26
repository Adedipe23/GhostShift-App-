#!/bin/sh
set -e

echo "──────────────────────────────────────────"
echo "  GhostShift Backend — Starting up"
echo "──────────────────────────────────────────"

echo "▶ Waiting for database to be ready..."
python << 'EOF'
import sys
import time
import psycopg2
import os

host = os.environ.get("DB_HOST", "db")
port = os.environ.get("DB_PORT", "5432")
dbname = os.environ.get("DB_NAME", "ghostshift_db")
user = os.environ.get("DB_USER", "ghostshift")
password = os.environ.get("DB_PASSWORD", "ghostshift_dev")

retries = 20
for i in range(retries):
    try:
        conn = psycopg2.connect(host=host, port=port, dbname=dbname, user=user, password=password)
        conn.close()
        print(f"  ✓ Database is ready (attempt {i+1})")
        sys.exit(0)
    except psycopg2.OperationalError:
        print(f"  · Attempt {i+1}/{retries} — database not ready, retrying in 2s...")
        time.sleep(2)

print("  ✗ Could not connect to database after multiple retries. Exiting.")
sys.exit(1)
EOF

echo "▶ Running database migrations..."
python manage.py migrate --noinput

echo "▶ Checking if database seeding is required..."
python -c "
import django
django.setup()
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.exists():
    print('  → No users found. Seeding initial development data...')
    from django.core.management import call_command
    call_command('seed')
    call_command('seed_audit_logs')
else:
    print('  ✓ Database already contains data. Skipping auto-seed.')
"

echo "▶ Collecting static files..."
python manage.py collectstatic --noinput --clear

echo "▶ Starting Gunicorn server on 0.0.0.0:8000..."
exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 3 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -
