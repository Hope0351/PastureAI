FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npx vite build && npx esbuild server.ts --bundle --platform=node --format=cjs --packages=external --outfile=dist/server.cjs
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["node", "dist/server.cjs"]
