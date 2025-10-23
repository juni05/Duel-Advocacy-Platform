# =============================================================================
# Duel Advocacy Platform - Complete Development Environment
# =============================================================================
#
# This Makefile provides all commands needed to run the ETL pipeline,
# backend API, and frontend dashboard.
#
# Quick Start:
#   make setup         # Install dependencies and load data
#   make dev           # Start development environment
#   make demo          # Run full demo (ETL + API + Frontend)
#   make demo-stop      # Stop demo services
#
# =============================================================================

.PHONY: help setup dev demo demo-stop clean test lint format build docker-up docker-down frontend backend etl

# Default target
help: ## Show this help message
	@echo "Duel Advocacy Platform - Complete Development Environment"
	@echo ""
	@echo "Available commands:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# =============================================================================
# SETUP & INSTALLATION
# =============================================================================

setup: ## Install all dependencies (backend + frontend) and run ETL pipeline
	@echo "📦 Installing backend dependencies..."
	npm install
	@echo "📦 Installing frontend dependencies..."
	cd frontend/duel-dashboard && npm install
	@echo "✅ Dependencies installed!"
	@echo ""
	@echo "🔄 Running ETL pipeline..."
	make etl
	@echo "✅ Setup complete!"

setup-backend: ## Install only backend dependencies
	@echo "📦 Installing backend dependencies..."
	npm install

setup-frontend: ## Install only frontend dependencies
	@echo "📦 Installing frontend dependencies..."
	cd frontend/duel-dashboard && npm install

# =============================================================================
# DEVELOPMENT ENVIRONMENT
# =============================================================================

dev: ## Start development environment (API + Frontend)
	@echo "🚀 Starting development environment..."
	@echo "📊 Starting API server on http://localhost:3000"
	@echo "🎨 Starting frontend on http://localhost:4200"
	@echo ""
	@echo "Press Ctrl+C to stop all services"
	@trap 'echo "🛑 Stopping services..."; kill 0' INT; \
	(npm run dev) & \
	(make frontend-dev) & \
	wait

backend: ## Start backend API in development mode
	@echo "📊 Starting API server on http://localhost:3000..."
	npm run dev

frontend: ## Start frontend dashboard
	@echo "🎨 Starting frontend dashboard..."
	cd frontend/duel-dashboard && npm start

frontend-dev: ## Start frontend in development mode (used internally)
	cd frontend/duel-dashboard && npm start

# =============================================================================
# PRODUCTION ENVIRONMENT
# =============================================================================

prod: ## Start production environment with Docker
	@echo "🐳 Starting production environment with Docker..."
	@echo "📊 API will be available on http://localhost:3000"
	docker-compose up -d
	@echo "✅ Services started! Check http://localhost:3000/api/health"

build: ## Build for production
	@echo "🔨 Building backend..."
	npm run build
	@echo "🔨 Building frontend..."
	cd frontend/duel-dashboard && npm run build
	@echo "✅ Build complete!"

docker-up: ## Start all services with Docker Compose
	@echo "🐳 Starting Docker services..."
	docker-compose up -d

docker-down: ## Stop all Docker services
	@echo "🛑 Stopping Docker services..."
	docker-compose down

docker-logs: ## View Docker logs
	docker-compose logs -f

# =============================================================================
# ETL PIPELINE
# =============================================================================

etl: ## Run ETL pipeline on existing data
	@echo "🔄 Running ETL pipeline..."
	npm run etl

data-etl: ## Run ETL pipeline on existing data (no data generation)
	@echo "🔄 Running ETL pipeline on existing data..."
	@if [ -d "./data" ] && [ "$$(ls -A data/*.json 2>/dev/null | wc -l)" -gt 0 ]; then \
		echo "✅ Found $$(ls data/*.json | wc -l) JSON files in ./data/"; \
		make etl; \
	else \
		echo "❌ No data files found in ./data/ directory"; \
		echo "   Please ensure your JSON files are in the ./data/ directory"; \
		exit 1; \
	fi

# =============================================================================
# DEMO & TESTING
# =============================================================================

demo: ## Run complete demo (setup + ETL + API + Frontend)
	@echo "🎬 Starting complete demo with existing data..."
	make setup
	make data-etl
	make prod
	@echo ""
	@echo "🎨 Starting frontend development server..."
	make frontend-dev

demo-stop: ## Stop all demo services (API + Frontend)
	@echo "🛑 Stopping demo services..."
	-docker-compose down
	-pkill -f "npm.*start" || true
	@echo "✅ Demo services stopped"

test: ## Run all tests
	@echo "🧪 Running tests..."
	npm test

test-watch: ## Run tests in watch mode
	@echo "🧪 Running tests in watch mode..."
	npm run test:watch

test-coverage: ## Run tests with coverage
	@echo "🧪 Running tests with coverage..."
	npm run test:coverage

# =============================================================================
# CODE QUALITY
# =============================================================================

lint: ## Run linting
	@echo "🔍 Running linter..."
	npm run lint

lint-fix: ## Run linting with auto-fix
	@echo "🔧 Running linter with auto-fix..."
	npm run lint:fix

format: ## Format code
	@echo "💅 Formatting code..."
	npm run format

type-check: ## Run TypeScript type checking
	@echo "🔍 Running TypeScript type check..."
	npm run type-check

quality: ## Run all code quality checks (lint + format + type-check + test)
	@echo "🔍 Running all code quality checks..."
	make lint
	make type-check
	make test

# =============================================================================
# UTILITY COMMANDS
# =============================================================================

health: ## Check API health
	@echo "🏥 Checking API health..."
	@curl -s http://localhost:3000/api/health | jq . || echo "API not running or curl/jq not available"

status: ## Show status of all services
	@echo "📊 Service Status:"
	@echo ""
	@echo "🐳 Docker Services:"
	@docker-compose ps || echo "  Docker services not running"
	@echo ""
	@echo "🔍 API Health:"
	@make health || echo "  API not responding"
	@echo ""
	@echo "📁 Data Directory:"
	@if [ -d "./data" ]; then \
		echo "  ✅ Data directory exists"; \
		echo "  📄 JSON files: $$(ls data/*.json 2>/dev/null | wc -l)"; \
		echo "  💾 Total size: $$(du -sh data/ 2>/dev/null | cut -f1)"; \
	else \
		echo "  ❌ No data directory found"; \
	fi

logs: ## Show application logs
	@echo "📋 Showing application logs..."
	npm run dev 2>&1 | head -50

clean: ## Clean up generated files and containers
	@echo "🧹 Cleaning up..."
	@echo "Removing Docker containers..."
	docker-compose down -v 2>/dev/null || true
	@echo "Removing generated data..."
	rm -rf data/ 2>/dev/null || true
	@echo "Removing build artifacts..."
	rm -rf dist/ 2>/dev/null || true
	rm -rf frontend/duel-dashboard/dist/ 2>/dev/null || true
	@echo "Removing node_modules..."
	rm -rf node_modules/ 2>/dev/null || true
	rm -rf frontend/duel-dashboard/node_modules/ 2>/dev/null || true
	@echo "✅ Cleanup complete!"

reset: ## Reset everything (clean + setup)
	@echo "🔄 Resetting environment..."
	make clean
	make setup

# =============================================================================
# ENVIRONMENT SETUP
# =============================================================================

env: ## Create .env file from example
	@echo "⚙️  Setting up environment variables..."
	@if [ -f .env.example ]; then \
		cp .env.example .env; \
		echo "✅ .env file created from .env.example"; \
		echo "⚠️  IMPORTANT: Please update MONGODB_URI with your actual MongoDB connection string"; \
	else \
		echo "❌ .env.example file not found!"; \
		exit 1; \
	fi

# =============================================================================
# DOCKER UTILITIES
# =============================================================================

docker-build: ## Build Docker images
	@echo "🔨 Building Docker images..."
	docker-compose build

docker-rebuild: ## Rebuild Docker images without cache
	@echo "🔨 Rebuilding Docker images (no cache)..."
	docker-compose build --no-cache

docker-clean: ## Clean up Docker resources
	@echo "🧹 Cleaning up Docker resources..."
	docker-compose down -v
	docker system prune -f
	docker volume prune -f

# =============================================================================
# HELPERS
# =============================================================================

# Variables for customization
COUNT ?= 1000  # Default data generation count

# Export variables for make
export COUNT
