FROM node:20-alpine
WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json ./
RUN npm install

# Copy source code
COPY . .

# Build the application  
RUN npm run build

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose the port
EXPOSE 3000

# Run the built server
CMD ["node", "dist/server.cjs"]
