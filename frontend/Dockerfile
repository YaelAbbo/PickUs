FROM node:22-slim
WORKDIR /app

# Ensure devtools are reachable from other devices
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8081

CMD ["npx", "expo", "start"]
