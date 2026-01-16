# SupplierCheck UK

Monorepo for the SupplierCheck UK application.

## Structure

```
├── apps/
│   ├── api/       # Fastify API server
│   └── web/       # Vite React client
├── packages/
│   ├── config/    # Shared TypeScript configs
│   ├── core/      # Shared utilities and types
│   └── db/        # Database package (placeholder)
└── tests/         # Vitest integration tests
```

## Requirements

- Node.js >= 20.0.0
- pnpm >= 9.15.0

## Getting Started

```bash
# Install dependencies
pnpm i

# Build all packages
pnpm -r build

# Run API server (http://localhost:3001)
pnpm --filter @app/api dev

# Run web client (http://localhost:5173)
pnpm --filter @app/web dev

# Run both in parallel
pnpm dev
```

## Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

## API Endpoints

- `GET /api/healthz` - Health check endpoint

## Environment Variables

Copy `.env.example` to `.env` and configure as needed.
