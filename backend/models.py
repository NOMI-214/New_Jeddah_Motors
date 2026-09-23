from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(50), default="")
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # owner | manager | accountant | salesperson | admin
    branch = Column(String(100), default="")
    status = Column(String(20), default="active")  # active | inactive
    address = Column(Text, default="")
    join_date = Column(String(50), default="")
    cars_sold = Column(Integer, default=0)
    revenue_generated = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_deleted = Column(Boolean, default=False)

    transactions = relationship("Transaction", back_populates="creator", foreign_keys="[Transaction.created_by]")
    expenses = relationship("Expense", back_populates="creator")
    sales = relationship("Sale", back_populates="salesperson")
    audit_logs = relationship("AuditLog", back_populates="user")


class Car(Base):
    __tablename__ = "cars"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    brand = Column(String(100), default="")
    model = Column(String(100), default="")
    year = Column(String(10), default="")
    registration_number = Column(String(50), default="")
    chassis_number = Column(String(100), default="")
    engine_number = Column(String(100), default="")
    color = Column(String(50), default="")
    purchase_price = Column(Float, default=0.0)
    sale_price = Column(Float, default=0.0)
    status = Column(String(20), default="available")  # available | reserved | sold
    branch = Column(String(100), default="Islamabad")
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_deleted = Column(Boolean, default=False)

    sales = relationship("Sale", back_populates="car")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    phone = Column(String(50), default="")
    cnic = Column(String(20), default="")
    email = Column(String(255), default="")
    address = Column(Text, default="")
    branch = Column(String(100), default="Islamabad")
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_deleted = Column(Boolean, default=False)

    sales = relationship("Sale", back_populates="customer")
    installments = relationship("Installment", back_populates="customer")
    accounts = relationship("CustomerAccount", back_populates="customer", cascade="all, delete-orphan")


class CustomerAccount(Base):
    __tablename__ = "customer_accounts"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    direction = Column(String(20), nullable=False)  # receivable | payable
    amount = Column(Float, nullable=False)
    paid_amount = Column(Float, default=0.0)
    description = Column(Text, default="")
    date = Column(DateTime, default=datetime.utcnow)
    due_date = Column(DateTime, nullable=True)
    payment_method = Column(String(50), default="cash")
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    branch = Column(String(100), default="Islamabad")
    is_deleted = Column(Boolean, default=False)

    customer = relationship("Customer", back_populates="accounts")
    payments = relationship("CustomerAccountPayment", back_populates="account", cascade="all, delete-orphan")


class CustomerAccountPayment(Base):
    __tablename__ = "customer_account_payments"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("customer_accounts.id"), nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(String(50), default="cash")
    payment_date = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, default="")
    recorded_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    account = relationship("CustomerAccount", back_populates="payments")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(20), nullable=False)  # cashIn | cashOut
    amount = Column(Float, nullable=False)
    party = Column(String(255), default="")
    category = Column(String(100), default="")
    notes = Column(Text, default="")
    date = Column(DateTime, default=datetime.utcnow)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    car_id = Column(Integer, ForeignKey("cars.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    branch = Column(String(100), default="Islamabad")

    creator = relationship("User", back_populates="transactions", foreign_keys=[created_by])


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(100), nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(Text, default="")
    date = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    branch = Column(String(100), default="Islamabad")
    is_deleted = Column(Boolean, default=False)

    creator = relationship("User", back_populates="expenses")


class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    car_id = Column(Integer, ForeignKey("cars.id"), nullable=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    sale_price = Column(Float, default=0.0)
    purchase_price = Column(Float, default=0.0)
    profit = Column(Float, default=0.0)
    payment_type = Column(String(50), default="cash")  # cash | bank_transfer | cheque | installment
    status = Column(String(20), default="completed")  # completed | pending
    notes = Column(Text, default="")
    salesperson_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    date = Column(DateTime, default=datetime.utcnow)
    branch = Column(String(100), default="Islamabad")

    car = relationship("Car", back_populates="sales")
    customer = relationship("Customer", back_populates="sales")
    salesperson = relationship("User", back_populates="sales")
    installment = relationship("Installment", back_populates="sale", uselist=False)


class Installment(Base):
    __tablename__ = "installments"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), unique=True, nullable=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    total_amount = Column(Float, default=0.0)
    paid_amount = Column(Float, default=0.0)
    next_due_date = Column(DateTime, nullable=True)
    next_installment_amount = Column(Float, default=0.0)
    status = Column(String(20), default="current")  # current | overdue | completed
    created_at = Column(DateTime, default=datetime.utcnow)

    sale = relationship("Sale", back_populates="installment")
    customer = relationship("Customer", back_populates="installments")
    payments = relationship("InstallmentPayment", back_populates="installment", cascade="all, delete-orphan")


class InstallmentPayment(Base):
    __tablename__ = "installment_payments"

    id = Column(Integer, primary_key=True, index=True)
    installment_id = Column(Integer, ForeignKey("installments.id"))
    amount = Column(Float, nullable=False)
    payment_date = Column(DateTime, default=datetime.utcnow)
    recorded_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    installment = relationship("Installment", back_populates="payments")


class EmailOTP(Base):
    __tablename__ = "email_otps"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False, index=True)
    otp_code = Column(String(10), nullable=False)
    purpose = Column(String(30), default="signup")  # signup | reset
    # Pending account details, held until the OTP is verified
    pending_name = Column(String(255), default="")
    pending_phone = Column(String(50), default="")
    pending_branch = Column(String(100), default="")
    pending_password_hash = Column(String(255), default="")
    is_used = Column(Boolean, default=False)
    attempts = Column(Integer, default=0)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(50), default="")
    module = Column(String(50), default="")
    description = Column(Text, default="")
    type = Column(String(20), default="create")  # create | update | delete | auth | view
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="audit_logs")
