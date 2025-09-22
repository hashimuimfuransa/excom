FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npx tsc -p tsconfig.json || true
RUN npm ci --only=production && npm cache clean --force
EXPOSE 4000
CMD ["node", "dist/index.js"]