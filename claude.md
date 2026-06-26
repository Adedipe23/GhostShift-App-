# GhostShift Developer Documentation (`claude.md`)

This documentation outlines the developer reference, architectural design, directory structures, and workflows implemented for the **GhostShift** workforce management platform.

---

## 🚀 Getting Started

### Prerequisites
- Python 3.12+
- Node.js 18+

### Running the Services Locally

Always start the backend, frontend, and AI microservices in separate terminals.

#### 1. Backend Service (Django)
Navigate to the `backend` folder, set up your virtual environment, install dependencies, run migrations, and start the development server:
```powershell
cd backend
# Create virtual environment if missing
python -m venv .venv
# Activate virtual environment
.venv\Scripts\Activate.ps1
# Install dependencies
pip install -r requirements.txt
# Run database migrations
.venv\Scripts\python.exe manage.py migrate
# Start backend on default http://localhost:8000
.venv\Scripts\python.exe manage.exe runserver
```

#### 2. AI Microservice (FastAPI)
Navigate to the `ai-service` folder and run the calculator server:
```powershell
cd ai-service
# Start FastAPI on port 8001
uvicorn main:app --reload --port 8001
```

#### 3. Frontend App (React + Vite)
Navigate to the `frontend` folder, install packages, and start the dev server:
```powershell
cd frontend
# Install dependencies
npm install
# Start dev server on http://localhost:5173
npm run dev
```

---

## 🛠️ Tech Stack & Architecture

### Backend (`/backend`)
- **Framework**: Django & Django REST Framework (DRF)
- **Database**: SQLite (local development `db.sqlite3` file)
- **Features**:
  - `apps.users`: Custom user model with role-based policies (`EMPLOYEE`, `MANAGER`, `HR`, `ADMIN`).
  - `apps.attendance`: Real-time clock-in/out window validation, emergency checkout reports, and automated `NO_SHOW` cron checks.
  - `apps.audit`: Write-request intercepting middleware (`AuditLogMiddleware`) that records database changes (POST, PUT, PATCH, DELETE) to an admin audit log.
- **Task Queue**: Django Q2 using ORM broker to manage asynchronous notification and cron recalculations.

### AI Service (`/ai-service`)
- **Framework**: FastAPI + Uvicorn
- **Features**:
  - Burnout risk scoring based on work intensity rules (weekly hours, consecutive shifts, night patterns, rest intervals).
  - AI-based replacement candidates recommendation engine that ranks replacement coverage based on department, availability, work hours, and fairness metrics.

### Frontend (`/frontend`)
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS (dark mode toggling supported via `.dark` selector on `<html>`).
- **State Management**: Zustand (stores for theme, authentication, and notification counters).
- **Server Cache**: TanStack React Query (automatic refetching, pagination page-retention, and search query synchronization).

---

## 📝 Backend Audit Log Testing & Seed Script

The System Audit Logs are recorded dynamically on write requests. To test these logs out in the UI without waiting for natural usage, you can run the database seed script to populate realistic logs:

### How to Run the Seed Script
From the `backend` directory, run the custom Django command:
```powershell
.venv\Scripts\python.exe manage.py seed_audit_logs
```

This will populate 15 realistic historical logs spanning various categories (`AUTH`, `USERS`, `SHIFTS`, `SWAPS`, `SYSTEM`) and actors, allowing you to immediately search, page, and filter inside the Admin System Logs modal.
