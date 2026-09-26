from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


# ─── Auth ────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


# ─── Admin Setup / Signup (OTP-verified) ─────────────────────────────────────

class SetupStatus(BaseModel):
    needs_setup: bool


class SignupRequest(BaseModel):
    name: str
    email: str
    phone: str = ""
    branch: str
    password: str


class OTPVerify(BaseModel):
    email: str
    otp: str


class ResendOTP(BaseModel):
    email: str


# ─── User ────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    name: str
    email: str
    phone: str = ""
    password: str
    role: str
    branch: str
    address: str = ""


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    branch: Optional[str] = None
    address: Optional[str] = None
    status: Optional[str] = None
    password: Optional[str] = None


class UserStatusUpdate(BaseModel):
    status: str  # active | inactive


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    role: str
    branch: str
    status: str
    address: str
    join_date: str
    cars_sold: int
    revenue_generated: float
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Car ─────────────────────────────────────────────────────────────────────

class CarCreate(BaseModel):
    name: str
    brand: str = ""
    model: str = ""
    year: str = ""
    registration_number: str = ""
    chassis_number: str = ""
    engine_number: str = ""
    color: str = ""
    purchase_price: float = 0.0
    sale_price: float = 0.0
    status: str = "available"
    branch: str = "Islamabad"


class CarStatusUpdate(BaseModel):
    status: str


class CarUpdate(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[str] = None
    registration_number: Optional[str] = None
    chassis_number: Optional[str] = None
    engine_number: Optional[str] = None
    color: Optional[str] = None
    purchase_price: Optional[float] = None
    sale_price: Optional[float] = None
    status: Optional[str] = None


class CarOut(BaseModel):
    id: int
    name: str
    brand: str
    model: str
    year: str
    registration_number: str
    chassis_number: str
    engine_number: str
    color: str
    purchase_price: float
    sale_price: float
    status: str
    branch: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Customer ────────────────────────────────────────────────────────────────

class CustomerCreate(BaseModel):
    name: str
    phone: str = ""
    cnic: str = ""
    email: str = ""
    address: str = ""
    branch: str = "Islamabad"


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    cnic: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None


class CustomerOut(BaseModel):
    id: int
    name: str
    phone: str
    cnic: str
    email: str
    address: str
    branch: str
    created_at: datetime
    cars_purchased: int = 0
    outstanding_amount: float = 0.0

    model_config = {"from_attributes": True}


# ─── Customer Accounts ───────────────────────────────────────────────────────

class CustomerAccountCreate(BaseModel):
    customer_id: int
    direction: str  # receivable | payable
    amount: float
    description: str = ""
    date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    payment_method: str = "cash"
    branch: str = "Islamabad"


class CustomerAccountUpdate(BaseModel):
    direction: Optional[str] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    payment_method: Optional[str] = None


class CustomerAccountPaymentCreate(BaseModel):
    amount: float
    payment_method: str = "cash"
    payment_date: Optional[datetime] = None
    notes: str = ""


class CustomerAccountPaymentOut(BaseModel):
    id: int
    amount: float
    payment_method: str
    payment_date: datetime
    notes: str
    recorded_by: Optional[int] = None
    recorded_by_name: str = ""

    model_config = {"from_attributes": True}


class CustomerAccountOut(BaseModel):
    id: int
    customer_id: int
    customer_name: str = ""
    direction: str
    amount: float
    paid_amount: float
    remaining_amount: float = 0.0
    description: str
    date: datetime
    due_date: Optional[datetime]
    payment_method: str
    status: str = "unpaid"
    branch: str
    created_by: Optional[int] = None
    created_by_name: str = ""
    payments: List[CustomerAccountPaymentOut] = []

    model_config = {"from_attributes": True}


# ─── Transaction ─────────────────────────────────────────────────────────────

class TransactionCreate(BaseModel):
    type: str  # cashIn | cashOut
    amount: float
    party: str = ""
    category: str = ""
    notes: str = ""
    customer_id: Optional[int] = None
    car_id: Optional[int] = None
    branch: str = "Islamabad"


class TransactionOut(BaseModel):
    id: int
    type: str
    amount: float
    party: str
    category: str
    notes: str
    date: datetime
    customer_id: Optional[int]
    car_id: Optional[int]
    created_by: Optional[int]
    branch: str
    creator_name: str = ""

    model_config = {"from_attributes": True}


# ─── Expense ─────────────────────────────────────────────────────────────────

class ExpenseCreate(BaseModel):
    category: str
    amount: float
    description: str = ""
    branch: str = "Islamabad"


class ExpenseOut(BaseModel):
    id: int
    category: str
    amount: float
    description: str
    date: datetime
    created_by: Optional[int]
    branch: str
    creator_name: str = ""

    model_config = {"from_attributes": True}


# ─── Sale ────────────────────────────────────────────────────────────────────

class SaleCreate(BaseModel):
    car_id: int
    customer_id: int
    sale_price: float
    payment_type: str = "cash"
    notes: str = ""
    branch: str = "Islamabad"
    installment_data: Optional[dict] = None  # {down_payment, monthly_amount, next_due_date}


class SaleOut(BaseModel):
    id: int
    car_id: Optional[int]
    customer_id: Optional[int]
    sale_price: float
    purchase_price: float
    profit: float
    payment_type: str
    status: str
    notes: str
    salesperson_id: Optional[int]
    date: datetime
    branch: str
    car_name: str = ""
    customer_name: str = ""
    salesperson_name: str = ""

    model_config = {"from_attributes": True}


# ─── Installment ─────────────────────────────────────────────────────────────

class InstallmentPaymentCreate(BaseModel):
    amount: float
    payment_date: Optional[datetime] = None
    next_due_date: Optional[datetime] = None
    next_installment_amount: Optional[float] = None


class InstallmentPaymentOut(BaseModel):
    id: int
    amount: float
    payment_date: datetime

    model_config = {"from_attributes": True}


class InstallmentUpdate(BaseModel):
    next_due_date: Optional[datetime] = None
    next_installment_amount: Optional[float] = None
    status: Optional[str] = None


class InstallmentOut(BaseModel):
    id: int
    sale_id: Optional[int]
    customer_id: Optional[int]
    total_amount: float
    paid_amount: float
    remaining_amount: float = 0.0
    next_due_date: Optional[datetime]
    next_installment_amount: float
    status: str
    created_at: datetime
    customer_name: str = ""
    car_name: str = ""
    payments: List[InstallmentPaymentOut] = []

    model_config = {"from_attributes": True}


# ─── Audit Log ───────────────────────────────────────────────────────────────

class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int]
    action: str
    module: str
    description: str
    type: str
    created_at: datetime
    user_name: str = ""

    model_config = {"from_attributes": True}


# ─── Reports ─────────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_cars: int
    available_cars: int
    reserved_cars: int
    sold_cars: int
    total_customers: int
    total_sales: int
    total_revenue: float
    total_profit: float
    total_expenses: float
    cash_in: float
    cash_out: float
    pending_installments: int
    outstanding_amount: float
    net_balance: float
    net_position: float = 0.0
    accounts_receivable: float = 0.0
    accounts_payable: float = 0.0
    overdue_accounts: int = 0


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str


class ResetPasswordRequest(BaseModel):
    new_password: str


TokenResponse.model_rebuild()
