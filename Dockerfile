FROM node:20-bookworm-slim AS base

WORKDIR /app

ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

FROM base AS build

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/*/package.json apps/*/
COPY packages/*/package.json packages/*/
COPY tests/package.json tests/

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm -r build

FROM node:20-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3001
ENV LOG_LEVEL=info
ENV RATE_LIMIT_MAX=100
ENV RATE_LIMIT_WINDOW_MS=60000
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

RUN npx -y playwright@1.49.1 install --with-deps chromium

COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/web/dist ./apps/web/dist
COPY --from=build /app/packages ./packages
COPY --from=build /app/services ./services
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/web/package.json ./apps/web/package.json
COPY --from=build /app/packages/core/package.json ./packages/core/package.json
COPY --from=build /app/packages/config/package.json ./packages/config/package.json

EXPOSE 3001

CMD ["node", "apps/api/dist/server.js"]
