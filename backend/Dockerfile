FROM node:20-alpine AS base
WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm ci

# Build TypeScript
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Runtime image
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=base /app/package*.json ./
RUN npm ci --omit=dev
COPY --from=base /app/dist ./dist

EXPOSE 4000
CMD ["node", "dist/index.js"]

