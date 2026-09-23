# New Jeddah Motors — Showroom Management System

Full-stack car showroom management app: **React (Vite)** frontend + **FastAPI** backend + **SQL database** (SQLite locally, Postgres in production).

```
showroom/
├── backend/     FastAPI API (auth, cars, customers, sales, installments, transactions, expenses, users, audit logs, reports)
└── frontend/    React app (Vite + Tailwind) — deploys to Vercel
```

## Why not put the backend on Vercel too?

Vercel's serverless functions have a **read-only, ephemeral filesystem** — every request can spin up a fresh instance, so SQLite (`showroom.db`) would silently reset/corrupt. FastAPI *can* run on Vercel as serverless functions, but for a real business app with persistent data, the standard and far more reliable setup is:

- **Frontend → Vercel** (what Vercel is built for — static build + CDN)
- **Backend → Render / Railway / Fly.io** (a normal always-on Python process)
- **Database → a managed Postgres** (Render Postgres, Neon, or Supabase all have free tiers)

This backend already supports both SQLite (dev) and Postgres (prod) via one `DATABASE_URL` env var — no code changes needed to switch.

---

## 1. Local development

### Backend
```bash
cd backend
python3 -m venv venv && source venv/bin/activate      # optional but recommended
pip install -r requirements.txt
./start.sh                 # http://localhost:8000
```

There is **no demo account** anymore. The first time you open the app, use
**"Create the admin account"** on the login screen — you'll enter your real
name, email, and password, then confirm it with a 6-digit OTP code emailed
to that address. That account becomes the `owner`. After that, signup is
locked (only the owner/manager can add more staff from the Users page).

If `SMTP_HOST` isn't set in `.env`, the OTP is printed to the backend
terminal instead of emailed — handy for local testing. See `.env.example`
for how to plug in Gmail, SendGrid, Mailgun, etc.

API docs: `http://localhost:8000/docs`

### Frontend
```bash
cd frontend
npm install
cp .env.example .env       # VITE_API_URL=http://localhost:8000
npm run dev                # http://localhost:5173
```

---

## 2. Deploying the backend (Render — free tier works)

1. Push this monorepo to GitHub.
2. On [render.com](https://render.com), create a **Web Service** from the repository and set the root directory to `backend`.
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add a **Render Postgres** database (or use Neon/Supabase), copy its connection string.
6. Set environment variables on the service:
   - `DATABASE_URL` = your Postgres URL
   - `SECRET_KEY` = a long random string
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `FROM_EMAIL` = your real email provider's credentials (Gmail App Password, SendGrid, Mailgun, Resend, etc.) — required so the admin OTP actually gets emailed in production
7. Note the live URL, e.g. `https://showroom-api.onrender.com`. Open the deployed site and use **"Create the admin account"** to set up your login with OTP verification — no manual seeding step needed.

(Railway or Fly.io work the same way — same `Procfile` is included for Railway.)

## 3. Deploying the frontend to Netlify

1. Push this monorepo to GitHub.
2. On [netlify.com](https://netlify.com), choose **Add new site → Import an existing project** and select the repository.
3. Netlify reads `netlify.toml` and builds from `frontend` automatically.
4. Add this environment variable in **Site configuration → Environment variables**:
   - `VITE_API_URL` = your backend URL from step 2 (e.g. `https://showroom-api.onrender.com`)
5. Add the deployed Netlify URL to the backend's `CORS_ORIGINS` variable, then redeploy the backend.
6. Deploy. Netlify will rebuild automatically on every git push.

`netlify.toml` is included so client-side routing (React Router) works correctly on refresh/direct links.

The FastAPI backend cannot run as a native Netlify Function because Netlify Functions do not support Python. Keep the backend on Render while both services live in this same GitHub repository.

---

## Features included

- **Auth**: OTP-verified admin signup (real email required, locked after the first account exists), JWT login, role-based access (owner, manager, accountant, salesperson, admin), change password
- **Cars**: full inventory CRUD, status (available/reserved/sold), search & filter
- **Customers**: CRUD, auto-computed cars purchased & outstanding balance
- **Sales**: record a sale against a car + customer, auto profit calculation, auto-marks car sold, supports cash/bank transfer/cheque/installment
- **Installments**: auto-created from an installment sale, payment recording, auto overdue detection, remaining balance tracking
- **Transactions**: manual cash in/out ledger
- **Expenses**: operating expense tracking
- **Users**: staff management with roles, branches, activate/deactivate, password reset (owner/manager only)
- **Audit Logs**: every create/update/delete/login is logged (owner/manager only)
- **Dashboard**: live stats — inventory breakdown, revenue, profit, cash flow, outstanding installments

## Notes

- The database schema (`models.py`) and business rules were kept exactly as in your original app — I only added the missing `routers/` (referenced by your `main.py` but not included in your upload) and built the full React frontend on top of the existing API contract in `schemas.py`.
- Change `SECRET_KEY` before going live — it signs your login tokens.
- To add more branches, just create users/cars/customers with a different `branch` value; there's no hardcoded branch list.
