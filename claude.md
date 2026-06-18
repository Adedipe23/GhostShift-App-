# GhostShift Developer Documentation

This document is the authoritative developer reference for the **GhostShift** workforce management platform — architecture, directory layout, local dev setup, Docker setup, and seeding.

---

## 🗂 Project Structure

```
ghostshift/
├── docker-compose.yml       ← Wires all 4 containers together
├── .env.docker              ← Environment variables for Docker (committed, dev only)
├── .env.example             ← Template for local .env file
├── backend/                 ← Django REST API (Python 3.12)
│   ├── Dockerfile
│   ├── entrypoint.sh        ← Waits for DB → migrate → collectstatic → gunicorn
│   ├── requirements.txt
│   └── apps/
│       ├── users/           ← Custom user model + JWT auth
│       ├── shifts/          ← Shift creation + business rules
│       ├── swaps/           ← Swap requests + approvals
│       ├── attendance/      ← Clock-in/out + emergency checkout
│       ├── availability/    ← Employee availability windows
│       ├── departments/     ← Department management
│       ├── notifications/   ← In-app notifications
│       ├── burnout/         ← Burnout score snapshots
│       ├── analytics/       ← Aggregated KPI views
│       └── audit/           ← System audit trail (auto-logged middleware)
├── ai-service/              ← FastAPI AI microservice (Python 3.12)
│   ├── Dockerfile
│   ├── main.py
│   └── services/
│       ├── burnout_calculator.py
│       └── replacement_recommender.py
└── frontend/                ← React 18 + Vite + Tailwind
    ├── Dockerfile           ← Multi-stage: Node builder → Nginx runtime
    ├── nginx.conf           ← Serves SPA + proxies /api/ and /admin/
    └── src/
        ├── api/             ← Axios client modules per resource
        ├── hooks/           ← React Query hooks
        ├── pages/           ← Role-based dashboards (Admin, Manager, HR, Employee)
        ├── components/      ← Shared UI components + layout
        └── store/           ← Zustand stores (auth, theme)
```

---

## 🐳 Running with Docker (Recommended)

This is the fastest way to get everything running. One command starts all 4 services.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### First-time setup & start
```powershell
# From the project root:
docker compose up --build
```

Docker will:
1. Pull `postgres:16-alpine`, `python:3.12-slim`, `node:20-alpine`, `nginx:1.27-alpine`
2. Build the backend, AI service, and frontend images
3. Wait for PostgreSQL to be healthy
4. Automatically run `manage.py migrate`
5. Collect static files
6. Start all servers

### Access the app
| Service        | URL                          |
|----------------|------------------------------|
| Frontend (React) | http://localhost             |
| Backend API    | http://localhost/api/        |
| Django Admin   | http://localhost/admin/      |
| AI Microservice | http://localhost:8001        |
| API Docs (Swagger) | http://localhost/api/docs/ |

### Subsequent starts (no rebuild needed)
```powershell
docker compose up
```

### Stop everything
```powershell
docker compose down
```

### Stop and wipe the database volume (full reset)
```powershell
docker compose down -v
```

### View logs for a specific service
```powershell
docker compose logs -f backend
docker compose logs -f ai-service
docker compose logs -f frontend
```

### Run Django management commands inside Docker
```powershell
# Seed the audit log test data
docker compose exec backend python manage.py seed_audit_logs

# Create a superuser/admin account
docker compose exec backend python manage.py createsuperuser

# Open a Django shell
docker compose exec backend python manage.py shell
```

---

## 💻 Running Locally (Without Docker)

Use this for fast iteration when you don't want to rebuild Docker images.

### 1. Backend (Django)
```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
.venv\Scripts\python.exe manage.py migrate
.venv\Scripts\python.exe manage.py runserver
# → http://localhost:8000
```

### 2. AI Microservice (FastAPI)
```powershell
cd ai-service
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
# → http://localhost:8001
```

### 3. Frontend (React)
```powershell
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## 🌱 Seeding Test Data

### Seed the Audit Logs (for testing the Admin System Logs modal)

**With Docker:**
```powershell
docker compose exec backend python manage.py seed_audit_logs
```

**Without Docker (local):**
```powershell
cd backend
.venv\Scripts\python.exe manage.py seed_audit_logs
```

This populates 15 realistic log entries across all categories (`AUTH`, `USERS`, `SHIFTS`, `SWAPS`, `SYSTEM`, `ATTENDANCE`, etc.) with staggered timestamps so you can immediately test search, filtering, and pagination.

---

## 🧪 Running Tests

### Backend
```powershell
# Local
cd backend && .venv\Scripts\python.exe -m pytest

# Docker
docker compose exec backend python -m pytest
```

### AI Service
```powershell
# Local
cd ai-service && .venv\Scripts\python.exe -m pytest

# Docker
docker compose exec ai-service python -m pytest
```

---

## 🔑 Environment Variables

| Variable | Used By | Description |
|---|---|---|
| `SECRET_KEY` | Backend | Django secret key |
| `DEBUG` | Backend | `True` for dev, `False` for prod |
| `DB_HOST` | Backend | If set, uses PostgreSQL; if empty, uses SQLite |
| `DB_NAME` | Backend | PostgreSQL database name |
| `DB_USER` | Backend | PostgreSQL username |
| `DB_PASSWORD` | Backend | PostgreSQL password |
| `CORS_ALLOWED_ORIGINS` | Backend | Comma-separated frontend origins |
| `AI_SERVICE_URL` | Backend | URL backend uses to reach AI service |
| `VITE_API_URL` | Frontend | API base URL baked into the JS bundle at build time |
| `VITE_AI_SERVICE_URL` | Frontend | AI service URL baked into the bundle |
