import smtplib
from email.mime.text import MIMEText
from database import settings


def send_otp_email(to_email: str, otp: str, name: str = "") -> None:
    """Sends a 6-digit OTP code to the given email.

    Falls back to printing the code to the server console when no SMTP
    host is configured, so local development works without real email
    credentials.
    """
    subject = "Your New Jeddah Motors verification code"
    greeting = f"Hi {name}," if name else "Hi,"
    body = f"""{greeting}

Your one-time verification code is:

    {otp}

This code expires in {settings.otp_expire_minutes} minutes. If you didn't
request this, you can safely ignore this email.

— New Jeddah Motors
"""

    if not settings.smtp_host:
        print(f"\n[DEV EMAIL FALLBACK — no SMTP configured]\nTo: {to_email}\nOTP: {otp}\n")
        return

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = settings.from_email
    msg["To"] = to_email

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as server:
        if settings.smtp_use_tls:
            server.starttls()
        if settings.smtp_user:
            server.login(settings.smtp_user, settings.smtp_password)
        server.sendmail(settings.from_email, [to_email], msg.as_string())
