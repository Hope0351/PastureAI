FROM node:20-slim

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Build application  
RUN npm run build

# Set production environment
ENV NODE_ENV=production ENV PORT=3000

# Expose port
EXPOSE 3000

# Start command
CMD ["node", "dist/server.cjs"]
