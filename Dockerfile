# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN npm install

FROM deps AS build
COPY . .
RUN npx prisma generate --schema database/schema/schema.prisma
RUN npm run build:web
RUN npm run build:api

FROM node:22-alpine AS api
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist-server ./dist-server
COPY --from=build /app/database ./database
COPY --from=build /app/uploads ./uploads
EXPOSE 3001
CMD ["node", "--env-file=.env", "dist-server/src/backend/server.js"]

FROM nginx:alpine AS web
COPY --from=build /app/dist /usr/share/nginx/html
COPY scripts/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
