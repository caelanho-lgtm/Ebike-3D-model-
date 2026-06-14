FROM node:22-alpine AS build
WORKDIR /app

COPY package.json tsconfig.base.json ./
COPY apps/widget/package.json apps/widget/package.json

RUN npm install

COPY apps/widget apps/widget

RUN npm run build --workspace @bikefit/widget

FROM node:22-alpine
WORKDIR /app

RUN npm install -g serve

COPY --from=build /app/apps/widget/dist ./dist

EXPOSE 4173
CMD ["serve", "-s", "dist", "-l", "4173"]
