# Build context must be the repository root:  docker build -f apps/api/Dockerfile .
FROM node:22-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Install workspace deps (leverage layer caching with manifests first).
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/fit-engine/package.json packages/fit-engine/
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN npm install --workspaces --include-workspace-root

# Build engine -> shared -> api.
COPY packages ./packages
COPY apps/api ./apps/api
RUN npm run build -w @fitwerx/fit-engine \
  && npm run build -w @fitwerx/shared \
  && npm run build -w @fitwerx/api

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY --from=build /app /app
WORKDIR /app/apps/api
EXPOSE 4000
# Apply schema then start. Use `prisma migrate deploy` once migrations exist.
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/index.js"]
