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

## Deploying the API to Fly.io

The API service ships with a `fly.toml` at the repo root configured for the Fastify server in
`apps/api`. The runtime expects a persistent SQLite cache database path via `CACHE_DB_PATH`, which
is mounted at `/data/cache.sqlite` in Fly. Make sure to create and attach a volume before deploying.

```bash
# Create the Fly app (adjust name/region as needed)
fly apps create suppliercheck-api --region lhr

# Create the volume that backs /data in fly.toml
fly volumes create cache_data --region lhr --size 1

# Set required secrets
fly secrets set COMPANIES_HOUSE_API_KEY=your_api_key_here

# Deploy the API
fly deploy
```

If you already have the app, skip the `fly apps create` step. The volume name (`cache_data`) and
mount path (`/data`) must match `fly.toml` for the cache database to persist across deploys.
