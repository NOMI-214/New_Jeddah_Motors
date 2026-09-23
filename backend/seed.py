"""
Utility script: wipes ALL data (users, cars, sales, etc.) and recreates
empty tables. There is no demo/seed account any more — the first person
to open the app creates the admin account themselves via the Sign Up
page, verified by an OTP sent to their real email address.

Run this only if you want to reset the database to a clean slate:
    python3 seed.py
"""
from database import SessionLocal, engine, Base
import models

Base.metadata.create_all(bind=engine)

db = SessionLocal()

db.query(models.AuditLog).delete()
db.query(models.EmailOTP).delete()
db.query(models.InstallmentPayment).delete()
db.query(models.Installment).delete()
db.query(models.Sale).delete()
db.query(models.Transaction).delete()
db.query(models.Expense).delete()
db.query(models.Car).delete()
db.query(models.Customer).delete()
db.query(models.User).delete()
db.commit()
db.close()

print("✅ Database reset. All data cleared.")
print("Open the app and use 'Create Admin Account' to sign up with your real email — you'll receive an OTP to verify it.")
