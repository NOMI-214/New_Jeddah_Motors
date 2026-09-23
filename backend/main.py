from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, settings
import models  # noqa: F401 — ensure models are registered before create_all

from routers import auth_router, cars, customers, transactions, expenses, sales, installments, users, audit_logs, reports

Base.metadata.create_all(bind=engine)

app = FastAPI(title="New Jeddah Motors API", version="1.0.0")

cors_origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
deployment_origin_regex = r"https://([a-z0-9-]+\.)?(vercel\.app|netlify\.app)$"

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=deployment_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(cars.router)
app.include_router(customers.router)
app.include_router(transactions.router)
app.include_router(expenses.router)
app.include_router(sales.router)
app.include_router(installments.router)
app.include_router(users.router)
app.include_router(audit_logs.router)
app.include_router(reports.router)


@app.get("/health")
def health():
    return {"status": "ok"}
