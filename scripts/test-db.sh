#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="$(dirname "$0")/../docker-compose.test.yml"
CONTAINER_NAME="mtct-postgres-test"

if [[ "${1:-}" == "--down" ]]; then
  docker compose -f "$COMPOSE_FILE" down
  echo "Test database stopped."
  exit 0
fi

if docker inspect "$CONTAINER_NAME" --format='{{.State.Status}}' 2>/dev/null | grep -q running; then
  echo "Test database already running."
  exit 0
fi

echo "Starting test database..."
docker compose -f "$COMPOSE_FILE" up -d --wait

echo "Test database ready on port 5433."
