#!/bin/bash

set -euo pipefail

WORKSPACE="/opt/nops-labs/school-temp"

cd "$WORKSPACE"

echo "[1/5] Checking workspace..."

mkdir -p repo data/db data/uploads scripts

if [ ! -d repo/.git ] && [ -z "$(find repo -mindepth 1 -maxdepth 1 2>/dev/null)" ]; then
  echo "Warning: repo/ is empty. Clone or unzip the project into $WORKSPACE/repo before running the app."
fi

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example. Review VITE_API_URL and secrets before public access."
fi

echo "[2/5] Checking required ports..."

for port in 8000 5173 5432 6379; do
  if ss -tln | awk '{print $4}' | grep -Eq "[:.]${port}$"; then
    echo "Warning: port ${port} is already listening. docker-compose may fail if it is not this workspace."
  fi
done

echo "[3/5] Validating compose file..."

docker-compose config >/dev/null

echo "[4/5] Building and starting containers..."

docker-compose up --build -d

echo "[5/5] Containers running. Current status:"

docker-compose ps

HOST_IP="$(hostname -I | awk '{print $1}')"

echo ""
echo "Backend API:"
echo "http://${HOST_IP}:8000/docs"
echo ""
echo "Frontend:"
echo "http://${HOST_IP}:5173"
echo ""
echo "If opening from a browser outside the VPS, set VITE_API_URL in .env to:"
echo "VITE_API_URL=http://${HOST_IP}:8000/api/v1"
echo "Then run: docker-compose up --build -d frontend"
