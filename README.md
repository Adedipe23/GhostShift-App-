<div align="center">

# 👻 GhostShift

### AI-Powered Workforce Management Platform

*Intelligent shift scheduling, burnout prevention, and workforce analytics for shift-based organizations*

[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python)](https://python.org)
[![Django](https://img.shields.io/badge/Django-5.0-092E20?style=flat-square&logo=django)](https://djangoproject.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://reactjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql)](https://postgresql.org)

</div>

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Architecture](#-architecture)
- [Technology Stack](#-technology-stack)
- [Local Setup](#-local-setup-no-docker)
- [GitHub Codespaces Setup](#-github-codespaces-setup)
- [Environment Variables](#-environment-variables)
- [Database Migrations](#-database-migrations)
- [Creating a Superuser](#-creating-a-superuser)
- [Starting Django Q2 Worker](#-starting-the-django-q2-worker)
- [Running Tests](#-running-tests)
- [API Documentation](#-api-documentation)
- [Future Improvements](#-future-improvements)

---

## 🎯 Project Overview

GhostShift is a production-ready, AI-augmented workforce management platform built for hospitals, clinics, warehouses, logistics companies, and manufacturing facilities. It solves three core problems:

| Problem | GhostShift Solution |
|---|---|
| Manual shift scheduling | AI-assisted schedule creation with conflict detection |
| Employee burnout | Real-time burnout score tracking with risk alerts |
| Workforce fairness | Analytics dashboard showing shift distribution equity |

**Key Features:**
- 🧠 AI burnout risk scoring (rule-based + ML-ready architecture)
- 📅 Smart shift scheduling with overlap/hour-limit enforcement
- 🔄 Shift swap workflow with manager approval
- 📊 Role-based dashboards (Employee / Manager / HR / Admin)
- 🌙 Dark & Light mode
- 🔔 Real-time notifications via async background tasks (Django Q2)
- 🔐 JWT authentication with token refresh

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         GhostShift Platform                         │
│                                                                     │
│  ┌─────────────────┐    ┌───────────────────┐    ┌───────────────┐ │
│  │   React + Vite  │    │   Django + DRF    │    │   FastAPI     │ │
│  │   (Port 5173)   │───▶│   (Port 8000)     │───▶│  AI Service   │ │
│  │                 │    │                   │    │  (Port 8001)  │ │
│  │  - Auth Pages   │    │  - REST API       │    │               │ │
│  │  - Dashboards   │    │  - JWT Auth       │    │  - Burnout    │ │
│  │  - Dark Mode    │    │  - Django Q2      │    │    Scoring    │ │
│  │  - React Query  │    │  - Swagger Docs   │    │  - Risk Level │ │
│  │  - Zustand      │    │                   │    │               │ │
│  └─────────────────┘    └─────────┬─────────┘    └───────────────┘ │
│                                   │                                 │
│                          ┌────────▼────────┐                        │
│                          │   PostgreSQL 16  │                        │
│                          │   (Port 5432)    │                        │
│                          │                 │                        │
│                          │  - App Data     │                        │
│                          │  - Django Q2    │                        │
│                          │    Queue Tables │                        │
│                          └─────────────────┘                        │
└─────────────────────────────────────────────────────────────────────┘

Django Apps:
┌──────────┐ ┌─────────────┐ ┌──────────┐ ┌──────────────┐
│  users   │ │ departments │ │  shifts  │ │ availability │
└──────────┘ └─────────────┘ └──────────┘ └──────────────┘
┌──────────┐ ┌─────────────┐ ┌──────────┐ ┌──────────────┐
│  swaps   │ │   burnout   │ │  notifs  │ │  analytics   │
└──────────┘ └─────────────┘ └──────────┘ └──────────────┘
```

---

## 🛠 Technology Stack

### Backend
| Layer | Technology |
|---|---|
| Framework | Django 5 + Django REST Framework |
| Auth | Simple JWT |
| Background Tasks | Django Q2 (PostgreSQL broker) |
| API Docs | drf-spectacular (Swagger/OpenAPI) |
| Package Manager | uv |
| Linting | Ruff |
| Testing | Pytest + Factory Boy |

### AI Service
| Layer | Technology |
|---|---|
| Framework | FastAPI |
| Data | Pandas, NumPy |
| ML | Scikit-Learn (ML-ready) |
| Validation | Pydantic v2 |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 18 + Vite 5 |
| Language | JSX |
| Styling | Tailwind CSS v3 |
| State | Zustand |
| Server State | React Query v5 |
| HTTP | Axios |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Icons | Lucide React |

### Database & Infrastructure
| Layer | Technology |
|---|---|
| Database | PostgreSQL 16 |
| Codespaces | .devcontainer (Node 20 + Python 3.12 + PostgreSQL) |

---

## 💻 Local Setup (No Docker)

### Prerequisites

- Python 3.12+
- Node.js 20+
- PostgreSQL 16+
- [uv](https://docs.astral.sh/uv/) (`pip install uv` or `curl -LsSf https://astral.sh/uv/install.sh | sh`)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/ghostshift.git
cd ghostshift
```

### 2. Set up environment variables

```bash
cp .env.example .env
# Edit .env with your PostgreSQL credentials and secret key
```

### 3. Set up PostgreSQL

```sql
-- In psql as postgres superuser:
CREATE USER ghostshift WITH PASSWORD 'ghostshift_dev';
CREATE DATABASE ghostshift_db OWNER ghostshift;
GRANT ALL PRIVILEGES ON DATABASE ghostshift_db TO ghostshift;
```

### 4. Backend Setup

```bash
cd backend

# Create virtual environment and install dependencies
uv venv .venv
source .venv/bin/activate        # Linux/Mac
# .venv\Scripts\activate         # Windows PowerShell

uv pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start the development server
python manage.py runserver 8000
```

### 5. AI Service Setup

```bash
cd ai-service

uv venv .venv
source .venv/bin/activate        # Linux/Mac
# .venv\Scripts\activate         # Windows

uv pip install -r requirements.txt

# Start the AI service
uvicorn main:app --reload --port 8001
```

### 6. Django Q2 Worker (Background Tasks)

Open a **new terminal** and run:

```bash
cd backend
source .venv/bin/activate        # Linux/Mac
# .venv\Scripts\activate         # Windows

python manage.py qcluster
```

### 7. Frontend Setup

```bash
cd frontend

npm install

npm run dev
# Frontend available at http://localhost:5173
```

### All Services Running

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000/api/ |
| Swagger Docs | http://localhost:8000/api/docs/ |
| AI Service | http://localhost:8001 |
| AI Service Docs | http://localhost:8001/docs |
| Django Admin | http://localhost:8000/admin/ |

---

## 🚀 GitHub Codespaces Setup

GhostShift is fully configured for GitHub Codespaces with zero manual setup.

### Steps

1. Go to your GitHub repository
2. Click the green **`< > Code`** button
3. Select **`Codespaces`** tab
4. Click **`Create codespace on main`**

The `.devcontainer/post-create.sh` script will automatically:
- Start PostgreSQL and create the database
- Install Python dependencies via `uv` for backend and AI service
- Run Django migrations
- Install Node.js dependencies for the frontend

### Starting services in Codespaces

```bash
# Terminal 1 — Backend
cd backend && source .venv/bin/activate && python manage.py runserver 0.0.0.0:8000

# Terminal 2 — Django Q2 Worker
cd backend && source .venv/bin/activate && python manage.py qcluster

# Terminal 3 — AI Service
cd ai-service && source .venv/bin/activate && uvicorn main:app --reload --host 0.0.0.0 --port 8001

# Terminal 4 — Frontend
cd frontend && npm run dev -- --host 0.0.0.0
```

Port forwarding is configured automatically for 5173, 8000, 8001, and 5432.

---

## 🔧 Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description | Default |
|---|---|---|
| `SECRET_KEY` | Django secret key | *(required)* |
| `DEBUG` | Debug mode | `True` |
| `ALLOWED_HOSTS` | Comma-separated hosts | `localhost,127.0.0.1` |
| `DB_NAME` | PostgreSQL database name | `ghostshift_db` |
| `DB_USER` | PostgreSQL username | `ghostshift` |
| `DB_PASSWORD` | PostgreSQL password | *(required)* |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `JWT_ACCESS_TOKEN_LIFETIME_MINUTES` | Access token lifetime | `60` |
| `JWT_REFRESH_TOKEN_LIFETIME_DAYS` | Refresh token lifetime | `7` |
| `CORS_ALLOWED_ORIGINS` | Frontend origin(s) | `http://localhost:5173` |
| `AI_SERVICE_URL` | FastAPI AI service URL | `http://localhost:8001` |
| `VITE_API_BASE_URL` | Backend API URL (frontend) | `http://localhost:8000/api` |

---

## 🗄 Database Migrations

```bash
cd backend
source .venv/bin/activate

# Create new migrations (after model changes)
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Check migration status
python manage.py showmigrations
```

---

## 👤 Creating a Superuser

```bash
cd backend
source .venv/bin/activate

python manage.py createsuperuser
# Enter email, first name, last name, and password
```

Access the Django admin at: http://localhost:8000/admin/

---

## ⚙️ Starting the Django Q2 Worker

Django Q2 handles background tasks (burnout recalculation, notifications) using PostgreSQL as the message broker.

```bash
cd backend
source .venv/bin/activate

# Start the cluster worker
python manage.py qcluster

# Monitor queue status
python manage.py qmonitor

# Check scheduled tasks
python manage.py qinfo
```

To schedule the burnout recalculation task (run once to register):

```bash
python manage.py shell
>>> from django_q.models import Schedule
>>> Schedule.objects.create(
...     func='apps.burnout.tasks.recalculate_burnout_scores',
...     schedule_type='H',  # Hourly
...     name='Burnout Recalculation'
... )
```

---

## 🧪 Running Tests

### Backend Tests (Pytest)

```bash
cd backend
source .venv/bin/activate

# Run all tests
pytest

# Run with coverage
pytest --cov=apps --cov-report=html

# Run specific test file
pytest tests/test_auth.py -v

# Run with output
pytest -s -v
```

### AI Service Tests

```bash
cd ai-service
source .venv/bin/activate

pytest tests/ -v
```

### Frontend Tests (Vitest)

```bash
cd frontend

npm test               # watch mode
npm run test:run       # single run
npm run test:coverage  # with coverage
```

---

## 📚 API Documentation

Interactive Swagger UI is available at:
- **Local**: http://localhost:8000/api/docs/
- **OpenAPI Schema**: http://localhost:8000/api/schema/

### Key Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register/` | Register new user |
| POST | `/api/auth/login/` | Login (returns JWT) |
| POST | `/api/auth/refresh/` | Refresh access token |
| GET | `/api/auth/me/` | Current user profile |
| GET | `/api/shifts/` | List shifts |
| POST | `/api/shifts/` | Create shift |
| POST | `/api/swaps/` | Request shift swap |
| PUT | `/api/swaps/{id}/approve/` | Approve swap (Manager) |
| PUT | `/api/swaps/{id}/reject/` | Reject swap (Manager) |
| GET | `/api/burnout/` | Burnout scores |
| POST | `/api/burnout/calculate/` | Trigger calculation |
| GET | `/api/analytics/dashboard/` | Dashboard metrics |
| POST | `/calculate-burnout` | AI burnout score (port 8001) |

---

## 🔮 Future Improvements

### Short-Term (v1.1)
- [ ] WebSocket support for real-time notifications
- [ ] Email notifications (SMTP integration)
- [ ] Shift template library
- [ ] CSV/Excel schedule export
- [ ] Mobile PWA support

### Medium-Term (v2.0)
- [ ] ML-based shift recommendation engine (Scikit-Learn)
- [ ] Integration with HRIS systems (Workday, BambooHR)
- [ ] Multi-tenant organization support
- [ ] Advanced analytics with predictive staffing
- [ ] Calendar view with drag-and-drop scheduling

### Long-Term (v3.0)
- [ ] Native mobile apps (React Native)
- [ ] LLM-powered scheduling assistant
- [ ] Compliance engine (labor law rules by jurisdiction)
- [ ] Advanced workforce forecasting
- [ ] Payroll integration

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">
Built with ❤️ by the GhostShift Team
</div>
