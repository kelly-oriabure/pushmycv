# Makefile for PushMyCV Multi-Repository Workspace
# Manages frontend, fastify-api, and agentic services

.PHONY: help install dev dev-frontend dev-api dev-agentic dev-all stop clean

# Default target
help:
	@echo "PushMyCV Development Commands:"
	@echo ""
	@echo "Setup:"
	@echo "  make install         - Install dependencies for all projects"
	@echo "  make install-frontend - Install frontend dependencies"
	@echo "  make install-api     - Install fastify-api dependencies"
	@echo "  make install-agentic - Setup Python venv for agentic"
	@echo ""
	@echo "Development (run individually):"
	@echo "  make dev-frontend    - Start Next.js frontend (port 3000)"
	@echo "  make dev-api       - Start Fastify API (port 3001)"
	@echo "  make dev-agentic   - Start Python agentic worker"
	@echo ""
	@echo "Development (run all):"
	@echo "  make dev           - Start all services with tmux/pmux"
	@echo "  make dev-bg        - Start all services in background"
	@echo ""
	@echo "Other:"
	@echo "  make stop          - Stop all background services"
	@echo "  make clean         - Clean build artifacts"
	@echo "  make test          - Run tests in all projects"

# ============================================================================
# Installation
# ============================================================================

install: install-frontend install-api install-agentic
	@echo "✅ All dependencies installed"

install-frontend:
	@echo "📦 Installing frontend dependencies..."
	cd frontend && npm install

install-api:
	@echo "📦 Installing fastify-api dependencies..."
	cd fastify-api && npm install

install-agentic:
	@echo "📦 Setting up agentic Python environment..."
	cd agentic && \
	if [ ! -d "venv" ]; then python3 -m venv venv; fi && \
	source venv/bin/activate && pip install -r requirements.txt

# ============================================================================
# Individual Development Servers
# ============================================================================

dev-frontend:
	@echo "🚀 Starting frontend on http://localhost:3000"
	cd frontend && npm run dev

dev-api:
	@echo "🚀 Starting fastify-api on http://localhost:3001"
	cd fastify-api && npm run dev

dev-agentic:
	@echo "🚀 Starting agentic worker"
	cd agentic && source venv/bin/activate && python3 workers/queue_worker.py

# ============================================================================
# Run All Services
# ============================================================================

# Check if tmux is available and use it, otherwise fallback to background processes
dev:
	@if command -v tmux >/dev/null 2>&1; then \
		$(MAKE) dev-tmux; \
	else \
		$(MAKE) dev-bg; \
	fi

# Run all services in a tmux session with 3 panes
dev-tmux:
	@echo "🚀 Starting all services in tmux session 'pushmycv'..."
	@tmux new-session -d -s pushmycv -n dev "cd $(PWD)/frontend && npm run dev"
	@tmux split-window -h -t pushmycv "cd $(PWD)/fastify-api && npm run dev"
	@tmux split-window -v -t pushmycv "cd $(PWD)/agentic && source venv/bin/activate && python3 workers/queue_worker.py"
	@tmux select-layout -t pushmycv tiled
	@echo "✅ Tmux session 'pushmycv' created with 3 panes"
	@echo "   Frontend: http://localhost:3000"
	@echo "   API:      http://localhost:3001"
	@echo ""
	@echo "Attach with: tmux attach -t pushmycv"
	@echo "Detach with: Ctrl+B then D"

# Run all services in background (no tmux)
dev-bg:
	@echo "🚀 Starting all services in background..."
	@cd frontend && npm run dev > ../frontend.log 2>&1 &
	@echo $$! > .frontend.pid
	@cd fastify-api && npm run dev > ../fastify-api.log 2>&1 &
	@echo $$! > .fastify-api.pid
	@cd agentic && source venv/bin/activate && python3 workers/queue_worker.py > ../agentic.log 2>&1 &
	@echo $$! > .agentic.pid
	@echo "✅ All services started in background"
	@echo "   Frontend: http://localhost:3000 (log: frontend.log)"
	@echo "   API:      http://localhost:3001 (log: fastify-api.log)"
	@echo "   Agentic:  worker running     (log: agentic.log)"
	@echo ""
	@echo "Stop with: make stop"

# ============================================================================
# Stop Background Services
# ============================================================================

stop:
	@echo "🛑 Stopping all services..."
	@if [ -f .frontend.pid ]; then cat .frontend.pid | xargs kill 2>/dev/null || true; rm -f .frontend.pid; fi
	@if [ -f .fastify-api.pid ]; then cat .fastify-api.pid | xargs kill 2>/dev/null || true; rm -f .fastify-api.pid; fi
	@if [ -f .agentic.pid ]; then cat .agentic.pid | xargs kill 2>/dev/null || true; rm -f .agentic.pid; fi
	@tmux kill-session -t pushmycv 2>/dev/null || true
	@echo "✅ All services stopped"

# ============================================================================
# Clean
# ============================================================================

clean:
	@echo "🧹 Cleaning build artifacts..."
	@cd frontend && rm -rf .next node_modules
	@cd fastify-api && rm -rf dist node_modules
	@rm -f frontend.log fastify-api.log agentic.log
	@rm -f .frontend.pid .fastify-api.pid .agentic.pid
	@echo "✅ Clean complete"

# ============================================================================
# Testing
# ============================================================================

test:
	@echo "🧪 Running tests..."
	@cd frontend && npm test
	@cd fastify-api && npm test
	@cd agentic && source venv/bin/activate && pytest

# ============================================================================
# Logs
# ============================================================================

logs:
	@echo "📜 Recent logs:"
	@echo "--- Frontend ---"
	@tail -20 frontend.log 2>/dev/null || echo "No frontend.log"
	@echo ""
	@echo "--- Fastify API ---"
	@tail -20 fastify-api.log 2>/dev/null || echo "No fastify-api.log"
	@echo ""
	@echo "--- Agentic ---"
	@tail -20 agentic.log 2>/dev/null || echo "No agentic.log"

logs-frontend:
	@tail -f frontend.log 2>/dev/null || echo "No frontend.log (run make dev-bg first)"

logs-api:
	@tail -f fastify-api.log 2>/dev/null || echo "No fastify-api.log (run make dev-bg first)"

logs-agentic:
	@tail -f agentic.log 2>/dev/null || echo "No agentic.log (run make dev-bg first)"
