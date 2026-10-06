FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace package.json
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

RUN npm install

COPY apps/api ./apps/api
COPY db ./db

WORKDIR /app/apps/api
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

RUN npm install --omit=dev

COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/src/docs ./apps/api/dist/docs
COPY db ./db

WORKDIR /app/apps/api

EXPOSE 4000
CMD ["node", "dist/index.js"]
