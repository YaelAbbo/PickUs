FROM node:22-slim AS builder
WORKDIR /app
ENV NODE_ENV=development

# Install full dependencies (including devDeps needed for build)
COPY package*.json ./
RUN npm ci --silent

# Copy sources and build
COPY . .
RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund --silent

# Copy built app
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main"]
