FROM node:22-slim AS builder
WORKDIR /app

# install all deps (including dev) for build
COPY package*.json ./
RUN npm install --legacy-peer-deps

# copy source and build
COPY . .
RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app

# install only production deps
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

# copy built output from builder
COPY --from=builder /app/dist ./dist

CMD ["node", "dist/main"]
