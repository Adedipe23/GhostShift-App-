#!/bin/bash
set -e

echo "==> Setting up GhostShift development environment..."

# ── PostgreSQL ──────────────────────────────────────────────────────────────
echo "==> Configuring PostgreSQL..."
sudo service postgresql start
sudo -u postgres psql -c "CREATE USER ghostshift WITH PASSWORD 'ghostshift_dev';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE ghostshift_db OWNER ghostshift;" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ghostshift_db TO ghostshift;" 2>/dev/null || true

# ── Python / uv ─────────────────────────────────────────────────────────────
echo "==> Installing uv..."
curl -LsSf https://astral.sh/uv/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"

# ── Backend ─────────────────────────────────────────────────────────────────
echo "==> Setting up Django backend..."
cd /workspaces/ghostshift/backend
uv venv .venv
source .venv/bin/activate
uv pip install -r requirements.txt
cp ../.env.example ../.env
python manage.py migrate
python manage.py collectstatic --noinput 2>/dev/null || true

# ── Frontend ─────────────────────────────────────────────────────────────────
echo "==> Setting up React frontend..."
cd /workspaces/ghostshift/frontend
npm install

echo ""
echo "✅  GhostShift environment ready!"
echo "   Start backend:    cd backend && python manage.py runserver 8000"
echo "   Start Q2 worker:  cd backend && python manage.py qcluster"
echo "   Start AI service: cd ai-service && uvicorn main:app --reload --port 8001"
echo "   Start frontend:   cd frontend && npm run dev"
