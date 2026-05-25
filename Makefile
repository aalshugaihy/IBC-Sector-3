# IBC — Investment & Business Services Sector Work Tracker — Full-Stack Docker Deployment
# Usage: make help

APP_NAME := ibc
PORT := 8080

# Load .env if it exists
-include .env
export

.PHONY: help build run stop restart logs clean dev lint shell push deploy

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-18s\033[0m %s\n", $$1, $$2}'

# ─── Development ──────────────────────────────────────────

dev: ## Run frontend dev server (with API proxy)
	npm run dev

dev-server: ## Run backend dev server
	cd server && npm run dev

install: ## Install all dependencies
	npm install && cd server && npm install

# ─── Docker Compose (Full Stack) ─────────────────────────

up: ## Start full stack (PostgreSQL + API + Frontend)
	docker compose up -d --build

down: ## Stop all services
	docker compose down

down-v: ## Stop all services and remove volumes
	docker compose down -v

logs: ## Tail all logs
	docker compose logs -f

logs-server: ## Tail server logs only
	docker compose logs -f server

logs-db: ## Tail database logs only
	docker compose logs -f db

restart: down up ## Restart all services

ps: ## Show running services
	docker compose ps

shell-server: ## Open shell in server container
	docker compose exec server sh

shell-db: ## Open psql in database container
	docker compose exec db psql -U ibc -d ibc_tasks

# ─── Build Only ───────────────────────────────────────────

build: ## Build all Docker images
	docker compose build

build-client: ## Build frontend image only
	docker build -t $(APP_NAME)-client .

build-server: ## Build server image only
	docker build -t $(APP_NAME)-server ./server

clean: down ## Remove containers, images, and volumes
	docker compose down -v --rmi local 2>/dev/null || true

# ─── Server Deployment ────────────────────────────────────

deploy: ## One-command deploy: pull + build + start (generates .env if missing)
	./deploy.sh

deploy-fresh: ## Wipe database and redeploy from scratch
	./deploy.sh fresh

deploy-status: ## Show deployment status and URL
	./deploy.sh status
