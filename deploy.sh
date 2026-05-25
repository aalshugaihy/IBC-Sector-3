#!/usr/bin/env bash
# IBC — One-command deployment script.
# Usage:
#   ./deploy.sh            → pull latest, build, start
#   ./deploy.sh fresh      → wipe DB and redeploy
#   ./deploy.sh logs       → tail logs
#   ./deploy.sh status     → show status + URL

set -euo pipefail

cd "$(dirname "$0")"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()    { echo -e "${CYAN}▸${NC} $*"; }
ok()      { echo -e "${GREEN}✓${NC} $*"; }
warn()    { echo -e "${YELLOW}!${NC} $*"; }
die()     { echo -e "${RED}✗${NC} $*" >&2; exit 1; }

need() { command -v "$1" >/dev/null 2>&1 || die "'$1' not found. Install it first."; }

need docker
docker compose version >/dev/null 2>&1 || die "docker compose plugin not installed. Run: apt install -y docker-compose-plugin"

ensure_env() {
  if [ -f .env ]; then
    ok ".env already exists — using existing secrets"
    return
  fi
  info "Generating .env with random secrets..."
  DB_PASS=$(openssl rand -hex 16)
  JWT=$(openssl rand -hex 32)
  cat > .env <<EOF
DB_PASSWORD=${DB_PASS}
JWT_SECRET=${JWT}
WEB_PORT=80
EOF
  chmod 600 .env
  ok ".env created with random 128-bit DB password and 256-bit JWT secret"
  warn "A backup of these secrets is in .env — keep this file safe."
}

pull_latest() {
  if [ -d .git ]; then
    info "Pulling latest from git..."
    git pull --ff-only || warn "git pull failed (continuing with local code)"
  fi
}

deploy() {
  ensure_env
  pull_latest
  info "Building and starting containers..."
  docker compose up -d --build --remove-orphans
  info "Waiting for services to be healthy..."
  for i in {1..60}; do
    if docker compose ps --format json 2>/dev/null | grep -q '"Health":"healthy"' || \
       docker compose ps 2>/dev/null | grep -q 'healthy'; then
      break
    fi
    sleep 2
  done
  docker compose ps
  echo
  status
}

status() {
  local web_port
  web_port=$(grep -E '^WEB_PORT=' .env 2>/dev/null | cut -d= -f2 || echo "80")
  web_port=${web_port:-80}
  local ip
  ip=$(curl -s --max-time 5 https://api.ipify.org 2>/dev/null || hostname -I | awk '{print $1}')
  echo
  ok "${BOLD}IBC is deployed${NC}"
  if [ "$web_port" = "80" ]; then
    echo -e "   Open: ${BOLD}${CYAN}http://${ip}/${NC}"
  else
    echo -e "   Open: ${BOLD}${CYAN}http://${ip}:${web_port}/${NC}"
  fi
  echo
  echo "   Commands:"
  echo "     ./deploy.sh logs      — tail logs"
  echo "     ./deploy.sh status    — show this again"
  echo "     ./deploy.sh fresh     — wipe DB and redeploy"
  echo "     docker compose down   — stop everything"
  echo
}

case "${1:-deploy}" in
  deploy|"")     deploy ;;
  fresh)
    warn "This will DELETE all data in the database. Continue?"
    read -r -p "Type 'yes' to confirm: " ans
    [ "$ans" = "yes" ] || die "Aborted."
    docker compose down -v
    deploy
    ;;
  logs)          docker compose logs -f --tail=100 ;;
  status)        status ;;
  stop)          docker compose down ;;
  restart)      docker compose restart ;;
  *)             die "Unknown command: $1 (use: deploy | fresh | logs | status | stop | restart)" ;;
esac
