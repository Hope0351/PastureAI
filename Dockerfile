# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage  
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
