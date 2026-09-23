#!/bin/bash
# Run from the backend/ directory
set -e
cd "$(dirname "$0")"

# Tables are created automatically on startup (see main.py).
# No demo account is seeded — open the app and use "Create Admin Account"
# to sign up with a real email address (verified via OTP).

echo "Starting API server at http://localhost:8000"
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
