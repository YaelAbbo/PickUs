FROM node:22-slim
WORKDIR /app

# Ensure devtools are reachable from other devices
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0

COPY package*.json ./
RUN npm install

COPY . .

# Expo Metro and devtools ports
EXPOSE 19000 19001 19002 19006

# Start the Expo Metro dev server using Tunnel by default so devices can connect
# even when LAN is blocked or networks isolate clients.
CMD ["npx", "expo", "start", "--tunnel"]
