# Makefile for PushMyCV Docker operations

.PHONY: help dev prod build up down logs shell clean test

# Default target
help:
	@echo "PushMyCV Docker Commands:"
	@echo "  make dev          - Start development environment"
	@echo "  make prod         - Start production environment"
	@echo "  make build        - Build Docker images"
	@echo "  make up           - Start all services"
	@echo "  make down         - Stop all services"
	@echo "  make logs         - View logs"
	@echo "  make shell        - Open shell in API container"
	@echo "  make clean        - Remove all containers and volumes"
	@echo "  make test         - Run tests in container"
	@echo "  make restart      - Restart all services"
	@echo "  make redis-ui     - Open Redis Commander UI"

# Development
dev:
	docker-compose up -d
	@echo "✅ Development environment started"
	@echo "📍 API: http://localhost:3000"
	@echo "📚 Docs: http://localhost:3000/docs"

# Production
prod:
	docker-compose -f docker-compose.prod.yml up -d
	@echo "✅ Production environment started"

# Build images
build:
	docker-compose build --no-cache
	@echo "✅ Images built successfully"

# Start services
up:
	docker-compose up -d

# Stop services
down:
	docker-compose down

# View logs
logs:
	docker-compose logs -f

# API logs only
logs-api:
	docker-compose logs -f api

# Open shell in API container
shell:
	docker-compose exec api sh

# Clean everything
clean:
	docker-compose down -v --remove-orphans
	docker system prune -f
	@echo "✅ Cleaned up containers, volumes, and images"

# Run tests
test:
	docker-compose exec api npm test

# Restart services
restart:
	docker-compose restart

# Install dependencies
install:
	docker-compose exec api npm install

# Database migration
migrate:
	@echo "Run your database migrations in Supabase dashboard"

# Check health
health:
	@curl -s http://localhost:3000/health | jq .

# View stats
stats:
	docker stats --no-stream

# Backup Redis
backup-redis:
	docker-compose exec redis redis-cli BGSAVE
	docker cp pushmycv-redis:/data/dump.rdb ./backup/redis-$(shell date +%Y%m%d-%H%M%S).rdb
	@echo "✅ Redis backup created"

# Open Redis UI
redis-ui:
	@echo "🔍 Redis Commander UI: http://localhost:8081"
	@echo "👤 Username: admin"
	@echo "🔑 Password: admin"
