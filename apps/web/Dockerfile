# Build context must be the repository root:  docker build -f apps/web/Dockerfile .
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/fit-engine/package.json packages/fit-engine/
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
RUN npm install --workspaces --include-workspace-root
COPY packages ./packages
COPY apps/web ./apps/web
RUN npm run build -w @fitwerx/fit-engine \
  && npm run build -w @fitwerx/shared \
  && npm run build -w @fitwerx/web

FROM nginx:1.27-alpine AS runtime
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
