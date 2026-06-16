# Multi-stage Dockerfile

FROM node:20-alpine AS builder
WORKDIR /usr/src/app

# Install dependencies early to maximize layer caching
COPY package*.json ./

# Install build deps and dependencies (cacheable), then copy source and build
RUN apk add --no-cache --virtual .build-deps build-base python3 git \
	&& npm install

# Copy source files and run build (needs source present)
COPY . .
RUN npm run build \
	&& npm prune --production \
	&& apk del .build-deps

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
