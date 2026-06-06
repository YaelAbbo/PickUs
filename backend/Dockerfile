# ── Development stage ──────────────────────────────────────────────────────────
FROM node:20-alpine AS development

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

# ── Build stage ────────────────────────────────────────────────────────────────
FROM development AS builder

RUN npm run build

# ── Production stage ───────────────────────────────────────────────────────────
FROM node:20-alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

# Copy only production dependencies
COPY package*.json ./

RUN npm install --omit=dev

# Copy the compiled output from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]
