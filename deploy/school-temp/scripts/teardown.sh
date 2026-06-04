#!/bin/bash

set -euo pipefail

WORKSPACE="/opt/nops-labs/school-temp"

if [ "$WORKSPACE" != "/opt/nops-labs/school-temp" ]; then
  echo "Safety check failed: unexpected workspace path."
  exit 1
fi

if [ ! -d "$WORKSPACE" ]; then
  echo "Workspace does not exist: $WORKSPACE"
  exit 0
fi

cd "$WORKSPACE"

echo "Stopping and removing containers and named volumes..."

docker-compose down -v --remove-orphans || true

echo "Deleting workspace..."

rm -rf "$WORKSPACE"

echo "Done. Workspace removed."
