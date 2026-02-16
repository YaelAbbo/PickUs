FROM node:22-slim AS builder
WORKDIR /app

# install all deps (including dev) for build
COPY package*.json ./
RUN npm install

# copy source and build
COPY . .
RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app

# install only production deps
COPY package*.json ./
RUN npm install --omit=dev

# copy built output from builder
COPY --from=builder /app/dist ./dist

CMD ["node", "dist/main"]

# To build, run locally the following command: docker buildx build --load -t pickus-backend:latest .
# To run the container locally, use: docker run -it --rm -p 3000:3000 --env-file .env --name pickus-backend pickus-backend:latest 
