FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.xml ./
RUN npm install
COPY . .
RUN npx vite build
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["node", "dist/server.cjs"]
