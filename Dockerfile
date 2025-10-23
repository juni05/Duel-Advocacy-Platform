FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci && \
    npm cache clean --force

COPY tsconfig.json ./
COPY src ./src

RUN npm install -g typescript && \
    tsc && \
    npm uninstall -g typescript

# Frontend Build
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/duel-dashboard/package*.json ./

RUN npm ci && \
    npm cache clean --force

COPY frontend/duel-dashboard/ ./

# Build frontend
RUN npm run build -- --configuration=production

# Production
FROM node:20-alpine

RUN apk add --no-cache dumb-init

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

COPY --from=builder /app/dist ./dist

COPY --from=frontend-builder /app/frontend/dist/duel-dashboard ./frontend

RUN mkdir -p logs && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "dist/api/server.js"]


