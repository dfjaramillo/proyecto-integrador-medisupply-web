# Multi-stage Dockerfile for Medisupply frontend
# Builds the Angular app (requires dev deps) and then runs it using the existing Express server (server.js)

### Builder: install deps and produce production build
FROM node:20 AS builder
WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package.json package-lock.json* ./

# Install all deps (devDependencies needed for the Angular build)
RUN npm install --no-audit --no-fund

# Copy source and run build
COPY . .
RUN npm run build


### Runtime: minimal node image that runs server.js and serves dist/
FROM node:20-alpine AS runner
WORKDIR /app

# Only install production dependencies
COPY package.json package-lock.json* ./
ENV NODE_ENV=production
RUN npm install --omit=dev --no-audit --no-fund

# Copy built Angular files from builder
COPY --from=builder /app/dist ./dist

# Copy server that serves the static files
COPY server.js ./

# Expose the port (server.js uses PORT env or 3000)
EXPOSE 3000

CMD ["node", "server.js"]
