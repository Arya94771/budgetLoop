# BudgetLoop

Full-stack expense tracker with budgets, recurring expenses, analytics and AI-powered expense entry.

**Live app:** https://budget-loop.vercel.app
**API health:** https://budgetloop.onrender.com/api/health

> The backend runs on a free plan and sleeps when idle, so the first request can take up to a minute.

## Features
- JWT authentication (bcrypt), rate limiting, Helmet, input validation
- Expense CRUD with search, category/date filters, sorting and pagination
- Monthly budgets with warning/exceeded alerts
- Recurring expenses (weekly/monthly) with idempotent processing
- Dashboard with category chart and 6-month trend (MongoDB aggregation)
- CSV export with CSV-injection protection
- AI quick-add ("pizza 250 yesterday") using Gemini, with model fallback and a local parser backup

## Tech Stack
- **Frontend:** React (Vite), Tailwind CSS, Recharts
- **Backend:** Node.js, Express 5, MongoDB (Mongoose)
- **AI:** Gemini API
- **Hosting:** Vercel (frontend), Render (backend), MongoDB Atlas (database)

## Run locally
1. `cd server && npm install`, copy `.env.example` to `.env`, fill in the values, then `npm run dev`
2. `cd client && npm install`, create `.env` with `VITE_API_URL=http://localhost:5000/api`, then `npm run dev`

## API overview
| Route | Description |
|---|---|
| POST /api/auth/register, /login, GET /me | Authentication |
| GET/POST /api/expenses, PUT/DELETE /api/expenses/:id | Expenses |
| GET /api/expenses/export, POST /api/expenses/parse | CSV export, AI parse |
| GET/POST /api/budgets, DELETE /api/budgets/:id | Budgets |
| GET /api/summary | Dashboard analytics |
| GET/POST /api/recurring, PATCH/DELETE /api/recurring/:id, POST /api/recurring/process | Recurring expenses |

## Screenshots
Coming soon.