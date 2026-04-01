# PushMyCV Monorepo Setup Guide

## Overview

This guide explains the optimal setup for managing the PushMyCV project with three codebases:
1. **Backend API** - Fastify + TypeScript + Supabase
2. **Mobile App** - Flutter + Riverpod + Clean Architecture
3. **Admin Panel** - React + TypeScript

## Recommended Folder Structure

```
pushmycv/                           # Root monorepo
├── .vscode/
│   └── pushmycv.code-workspace     # Multi-root workspace config
├── backend/                        # Fastify API (current pushmycv-fastify)
│   ├── src/
│   ├── database/
│   ├── docs/
│   ├── tests/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── package.json
│   └── tsconfig.json
├── mobile/                         # Flutter mobile app
│   ├── lib/
│   │   ├── core/                  # Clean Architecture - Core
│   │   │   ├── constants/
│   │   │   ├── errors/
│   │   │   ├── network/
│   │   │   ├── usecases/
│   │   │   └── utils/
│   │   ├── features/              # Clean Architecture - Features
│   │   │   ├── auth/
│   │   │   │   ├── data/
│   │   │   │   │   ├── datasources/
│   │   │   │   │   ├── models/
│   │   │   │   │   └── repositories/
│   │   │   │   ├── domain/
│   │   │   │   │   ├── entities/
│   │   │   │   │   ├── repositories/
│   │   │   │   │   └── usecases/
│   │   │   │   └── presentation/
│   │   │   │       ├── providers/      # Riverpod providers
│   │   │   │       ├── pages/
│   │   │   │       └── widgets/
│   │   │   ├── profile/
│   │   │   ├── resume/
│   │   │   ├── jobs/
│   │   │   └── applications/
│   │   ├── shared/                # Shared widgets & providers
│   │   └── main.dart
│   ├── test/
│   ├── android/
│   ├── ios/
│   ├── pubspec.yaml
│   └── README.md
├── admin/                          # React admin panel
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── contexts/
│   │   ├── types/
│   │   └── App.tsx
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── shared/                         # Shared resources
│   ├── docs/                      # Shared documentation
│   ├── types/                     # Shared TypeScript types
│   └── scripts/                   # Shared scripts
├── docker/                         # Docker configurations
│   ├── docker-compose.yml         # All services
│   ├── docker-compose.dev.yml     # Development override
│   └── docker-compose.prod.yml    # Production override
├── .gitignore
├── Makefile                        # Root-level commands
├── README.md                       # Main project README
└── package.json                    # Root package.json (optional)
```

## Setup Instructions

### Option 1: Monorepo (Recommended)

**Advantages:**
- ✅ Single workspace in Windsurf
- ✅ Unified version control
- ✅ Shared documentation and scripts
- ✅ Easier cross-project refactoring
- ✅ Consistent tooling and CI/CD

**Steps:**

1. **Create the monorepo structure:**
```bash
# Navigate to parent directory
cd c:/Users/firmcloud/Documents/projects

# Create new monorepo root
mkdir pushmycv
cd pushmycv

# Move existing backend
mv ../Fastify/pushmycv-fastify ./backend

# Create mobile and admin directories
mkdir mobile admin shared docker
```

2. **Initialize Flutter mobile app:**
```bash
cd mobile
flutter create . --org com.pushmycv --project-name pushmycv_mobile
```

3. **Initialize React admin panel:**
```bash
cd ../admin
npm create vite@latest . -- --template react-ts
npm install
```

4. **Create workspace configuration** (see below)

### Option 2: Multi-Repo with Workspace

**Advantages:**
- ✅ Independent repositories
- ✅ Separate deployment cycles
- ✅ Team-specific permissions
- ✅ Still accessible in single Windsurf workspace

**Steps:**

1. **Keep separate repositories:**
```
c:/Users/firmcloud/Documents/projects/
├── pushmycv-backend/      # Existing Fastify
├── pushmycv-mobile/       # New Flutter app
└── pushmycv-admin/        # New React app
```

2. **Create workspace file** (see below)

## Windsurf Workspace Configuration

### For Monorepo (Option 1)

Create `.vscode/pushmycv.code-workspace`:

```json
{
  "folders": [
    {
      "name": "🚀 PushMyCV (Root)",
      "path": "."
    },
    {
      "name": "⚙️ Backend (Fastify)",
      "path": "./backend"
    },
    {
      "name": "📱 Mobile (Flutter)",
      "path": "./mobile"
    },
    {
      "name": "🖥️ Admin (React)",
      "path": "./admin"
    }
  ],
  "settings": {
    "files.exclude": {
      "**/node_modules": true,
      "**/build": true,
      "**/dist": true,
      "**/.dart_tool": true
    },
    "search.exclude": {
      "**/node_modules": true,
      "**/build": true,
      "**/dist": true,
      "**/.dart_tool": true,
      "**/pubspec.lock": true,
      "**/package-lock.json": true
    },
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.fixAll": true
    },
    "[dart]": {
      "editor.formatOnSave": true,
      "editor.selectionHighlight": false,
      "editor.suggest.snippetsPreventQuickSuggestions": false,
      "editor.suggestSelection": "first",
      "editor.tabCompletion": "onlySnippets",
      "editor.wordBasedSuggestions": false
    },
    "[typescript]": {
      "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
    "[typescriptreact]": {
      "editor.defaultFormatter": "esbenp.prettier-vscode"
    }
  },
  "extensions": {
    "recommendations": [
      "Dart-Code.dart-code",
      "Dart-Code.flutter",
      "dbaeumer.vscode-eslint",
      "esbenp.prettier-vscode",
      "ms-vscode.vscode-typescript-next",
      "bradlc.vscode-tailwindcss",
      "usernamehw.errorlens"
    ]
  },
  "launch": {
    "version": "0.2.0",
    "configurations": [
      {
        "name": "Flutter: Debug",
        "type": "dart",
        "request": "launch",
        "program": "mobile/lib/main.dart",
        "cwd": "${workspaceFolder}/mobile"
      },
      {
        "name": "Backend: Debug",
        "type": "node",
        "request": "launch",
        "name": "Launch Backend",
        "skipFiles": ["<node_internals>/**"],
        "program": "${workspaceFolder}/backend/src/server.ts",
        "preLaunchTask": "npm: dev",
        "outFiles": ["${workspaceFolder}/backend/dist/**/*.js"]
      },
      {
        "name": "Admin: Debug",
        "type": "chrome",
        "request": "launch",
        "url": "http://localhost:5173",
        "webRoot": "${workspaceFolder}/admin/src"
      }
    ],
    "compounds": [
      {
        "name": "Full Stack Debug",
        "configurations": ["Backend: Debug", "Flutter: Debug", "Admin: Debug"]
      }
    ]
  }
}
```

### For Multi-Repo (Option 2)

Create `pushmycv.code-workspace` in a shared location:

```json
{
  "folders": [
    {
      "name": "⚙️ Backend (Fastify)",
      "path": "c:/Users/firmcloud/Documents/projects/pushmycv-backend"
    },
    {
      "name": "📱 Mobile (Flutter)",
      "path": "c:/Users/firmcloud/Documents/projects/pushmycv-mobile"
    },
    {
      "name": "🖥️ Admin (React)",
      "path": "c:/Users/firmcloud/Documents/projects/pushmycv-admin"
    }
  ],
  "settings": {
    // Same as above
  },
  "extensions": {
    // Same as above
  }
}
```

## Unified Docker Compose

### Root `docker/docker-compose.yml`

```yaml
version: '3.8'

services:
  # Backend API
  backend:
    build:
      context: ../backend
      dockerfile: Dockerfile.dev
    container_name: pushmycv-backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - PORT=3000
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - SUPABASE_JWT_SECRET=${SUPABASE_JWT_SECRET}
    volumes:
      - ../backend/src:/app/src
      - ../backend/database:/app/database
    networks:
      - pushmycv-network
    restart: unless-stopped

  # Redis
  redis:
    image: redis:7-alpine
    container_name: pushmycv-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - pushmycv-network
    restart: unless-stopped
    command: redis-server --appendonly yes

  # Redis Commander UI
  redis-commander:
    image: rediscommander/redis-commander:latest
    container_name: pushmycv-redis-ui
    ports:
      - "8081:8081"
    environment:
      - REDIS_HOSTS=local:redis:6379
      - HTTP_USER=admin
      - HTTP_PASSWORD=admin
    networks:
      - pushmycv-network
    depends_on:
      - redis
    restart: unless-stopped

  # Admin Panel (React)
  admin:
    build:
      context: ../admin
      dockerfile: Dockerfile.dev
    container_name: pushmycv-admin
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://localhost:3000
    volumes:
      - ../admin/src:/app/src
      - ../admin/public:/app/public
    networks:
      - pushmycv-network
    restart: unless-stopped

networks:
  pushmycv-network:
    driver: bridge

volumes:
  redis-data:
    driver: local
```

## Root Makefile

Create `Makefile` at monorepo root:

```makefile
.PHONY: help dev stop logs clean install

help:
	@echo "PushMyCV Development Commands:"
	@echo "  make dev          - Start all services"
	@echo "  make stop         - Stop all services"
	@echo "  make logs         - View all logs"
	@echo "  make clean        - Clean all containers and volumes"
	@echo "  make install      - Install all dependencies"
	@echo "  make backend      - Start backend only"
	@echo "  make mobile       - Run Flutter mobile app"
	@echo "  make admin        - Start admin panel only"
	@echo "  make test         - Run all tests"

# Start all services
dev:
	docker-compose -f docker/docker-compose.yml up -d
	@echo "✅ All services started"
	@echo "📍 Backend: http://localhost:3000"
	@echo "📍 Admin: http://localhost:5173"
	@echo "📍 Redis UI: http://localhost:8081"
	@echo "📍 Swagger: http://localhost:3000/docs"

# Stop all services
stop:
	docker-compose -f docker/docker-compose.yml down

# View logs
logs:
	docker-compose -f docker/docker-compose.yml logs -f

# Clean everything
clean:
	docker-compose -f docker/docker-compose.yml down -v
	cd backend && rm -rf node_modules dist
	cd admin && rm -rf node_modules dist
	cd mobile && flutter clean

# Install dependencies
install:
	@echo "Installing backend dependencies..."
	cd backend && npm install
	@echo "Installing admin dependencies..."
	cd admin && npm install
	@echo "Getting Flutter packages..."
	cd mobile && flutter pub get
	@echo "✅ All dependencies installed"

# Backend only
backend:
	cd backend && npm run dev

# Mobile app
mobile:
	cd mobile && flutter run

# Admin only
admin:
	cd admin && npm run dev

# Run tests
test:
	@echo "Running backend tests..."
	cd backend && npm test
	@echo "Running mobile tests..."
	cd mobile && flutter test
	@echo "Running admin tests..."
	cd admin && npm test
```

## Flutter Project Structure (Clean Architecture + Riverpod)

### Core Directory Structure

```
mobile/lib/
├── core/
│   ├── constants/
│   │   ├── api_constants.dart
│   │   ├── app_constants.dart
│   │   └── storage_constants.dart
│   ├── errors/
│   │   ├── exceptions.dart
│   │   └── failures.dart
│   ├── network/
│   │   ├── api_client.dart
│   │   └── network_info.dart
│   ├── usecases/
│   │   └── usecase.dart
│   └── utils/
│       ├── logger.dart
│       └── validators.dart
├── features/
│   ├── auth/
│   │   ├── data/
│   │   │   ├── datasources/
│   │   │   │   ├── auth_local_datasource.dart
│   │   │   │   └── auth_remote_datasource.dart
│   │   │   ├── models/
│   │   │   │   ├── user_model.dart
│   │   │   │   └── auth_response_model.dart
│   │   │   └── repositories/
│   │   │       └── auth_repository_impl.dart
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── user.dart
│   │   │   ├── repositories/
│   │   │   │   └── auth_repository.dart
│   │   │   └── usecases/
│   │   │       ├── login_usecase.dart
│   │   │       ├── register_usecase.dart
│   │   │       └── logout_usecase.dart
│   │   └── presentation/
│   │       ├── providers/
│   │       │   ├── auth_provider.dart
│   │       │   └── auth_state_provider.dart
│   │       ├── pages/
│   │       │   ├── login_page.dart
│   │       │   ├── register_page.dart
│   │       │   └── otp_verification_page.dart
│   │       └── widgets/
│   │           ├── login_form.dart
│   │           └── otp_input.dart
│   ├── profile/
│   ├── resume/
│   ├── jobs/
│   └── applications/
├── shared/
│   ├── widgets/
│   │   ├── custom_button.dart
│   │   ├── custom_text_field.dart
│   │   └── loading_indicator.dart
│   └── providers/
│       └── theme_provider.dart
└── main.dart
```

### Key Dependencies (pubspec.yaml)

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # State Management
  flutter_riverpod: ^2.4.9
  riverpod_annotation: ^2.3.3
  
  # Networking
  dio: ^5.4.0
  retrofit: ^4.0.3
  
  # Local Storage
  shared_preferences: ^2.2.2
  flutter_secure_storage: ^9.0.0
  
  # Functional Programming
  dartz: ^0.10.1
  
  # Dependency Injection
  get_it: ^7.6.4
  injectable: ^2.3.2
  
  # Navigation
  go_router: ^13.0.0
  
  # UI
  flutter_svg: ^2.0.9
  cached_network_image: ^3.3.0
  
  # Utils
  equatable: ^2.0.5
  intl: ^0.18.1
  logger: ^2.0.2

dev_dependencies:
  flutter_test:
    sdk: flutter
  
  # Code Generation
  build_runner: ^2.4.7
  riverpod_generator: ^2.3.9
  retrofit_generator: ^8.0.6
  injectable_generator: ^2.4.1
  
  # Testing
  mockito: ^5.4.4
  flutter_lints: ^3.0.1
```

## Development Workflow

### 1. Open Workspace in Windsurf

```bash
# For monorepo
code pushmycv.code-workspace

# Or open the root folder
code pushmycv/
```

### 2. Start Development

```bash
# Start all backend services
make dev

# In separate terminal - Run Flutter app
make mobile

# In separate terminal - Run admin panel (if not using Docker)
make admin
```

### 3. Windsurf AI Access

With the workspace setup, Windsurf AI can:
- ✅ Access all three codebases simultaneously
- ✅ Understand cross-project dependencies
- ✅ Suggest changes across backend, mobile, and admin
- ✅ Generate consistent types and models
- ✅ Help with API integration
- ✅ Debug full-stack issues

## Git Strategy

### Monorepo Approach

```bash
# Single repository
git init
git add .
git commit -m "Initial monorepo setup"

# .gitignore
node_modules/
dist/
build/
.dart_tool/
*.lock
.env
.env.local
```

### Multi-Repo Approach

```bash
# Separate repositories
pushmycv-backend/.git
pushmycv-mobile/.git
pushmycv-admin/.git

# Optional: Use git submodules or meta-repo
```

## API Integration Example

### Backend Endpoint (Fastify)
```typescript
// backend/src/routes/profiles.ts
app.get('/api/profiles/:id', async (request, reply) => {
  const { id } = request.params;
  const profile = await getProfile(id);
  return profile;
});
```

### Flutter Data Layer (Mobile)
```dart
// mobile/lib/features/profile/data/datasources/profile_remote_datasource.dart
abstract class ProfileRemoteDataSource {
  Future<ProfileModel> getProfile(String id);
}

class ProfileRemoteDataSourceImpl implements ProfileRemoteDataSource {
  final Dio dio;
  
  ProfileRemoteDataSourceImpl(this.dio);
  
  @override
  Future<ProfileModel> getProfile(String id) async {
    final response = await dio.get('/api/profiles/$id');
    return ProfileModel.fromJson(response.data);
  }
}
```

### React Admin (Admin Panel)
```typescript
// admin/src/services/profileService.ts
export const getProfile = async (id: string) => {
  const response = await fetch(`http://localhost:3000/api/profiles/${id}`);
  return response.json();
};
```

## Shared Types (Optional)

Create shared TypeScript types that can be referenced:

```typescript
// shared/types/profile.ts
export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  location?: string;
  created_at: string;
  updated_at: string;
}
```

Generate Dart models from TypeScript:
```bash
# Use quicktype or similar tool
quicktype shared/types/profile.ts -o mobile/lib/features/profile/data/models/profile_model.dart
```

## Benefits of This Setup

### For Development
- ✅ Single workspace for all code
- ✅ Unified search across projects
- ✅ Consistent code style and linting
- ✅ Shared documentation
- ✅ Easy cross-project refactoring

### For Windsurf AI
- ✅ Full context of entire system
- ✅ Better code suggestions
- ✅ Consistent API contracts
- ✅ Cross-platform debugging
- ✅ Unified documentation access

### For Team
- ✅ Single source of truth
- ✅ Consistent development environment
- ✅ Easier onboarding
- ✅ Unified CI/CD pipeline
- ✅ Better collaboration

## Next Steps

1. **Choose your approach** (Monorepo vs Multi-Repo)
2. **Create the folder structure**
3. **Set up the workspace file**
4. **Initialize Flutter project with Clean Architecture**
5. **Initialize React admin project**
6. **Configure unified Docker Compose**
7. **Test Windsurf AI access to all codebases**

## Recommended: Monorepo

I strongly recommend **Option 1 (Monorepo)** because:
- Better for Windsurf AI context
- Easier dependency management
- Unified version control
- Simpler deployment
- Better for small to medium teams

Would you like me to help you migrate to this structure?
