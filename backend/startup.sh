#!/bin/bash
set -e

echo "▶ Running database seed..."
python seed.py || echo "⚠  Seed already ran or encountered an error (safe to ignore on subsequent deploys)"

echo "▶ Starting Javaline API..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
