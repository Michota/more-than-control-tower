#!/usr/bin/env bash
set -e

LOG=/tmp/mtct-bootstrap.log

export HOST_UID=$(id -u)
export HOST_GID=$(id -g)

setsid -f bash -c "pnpm docker:dev:bootstrap > $LOG 2>&1"
echo "Kubb sync started in background. Monitor: tail -f $LOG"
echo

exec docker compose -f docker-compose.dev.yml up --build
