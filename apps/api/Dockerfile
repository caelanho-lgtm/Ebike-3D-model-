FROM node:22-alpine AS build
WORKDIR /app

COPY package.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/ai-engine/package.json packages/ai-engine/package.json

RUN npm install

COPY apps/api apps/api
COPY packages/ai-engine packages/ai-engine

RUN npm run build --workspace @bikefit/ai-engine && \
    npm run prisma:generate --workspace @bikefit/api && \
    npm run build --workspace @bikefit/api

FROM node:22-alpine
WORKDIR /app

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma

EXPOSE 8080
CMD ["node", "apps/api/dist/index.js"]
