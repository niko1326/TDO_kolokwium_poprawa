# Multi-stage Dockerfile

FROM node:20 AS builder
WORKDIR /usr/src/app

# Install dependencies early to maximize layer caching
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source and build artifact
COPY . .
RUN npm run build

# Remove dev dependencies so node_modules contains only production deps
RUN npm prune --production

FROM node:20-alpine AS runner
WORKDIR /usr/src/app

# Set production env
ENV NODE_ENV=production

# Copy built artifact and production dependencies from builder
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./package.json

# Use non-root user
USER node

# Expose the application port (documented default 3000)
EXPOSE 3000

# Exec form so Docker can forward signals correctly
CMD ["node", "dist/server.js"]
