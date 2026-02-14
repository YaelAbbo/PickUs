FROM node:22-slim
WORKDIR /app

# Ensure devtools are reachable from other devices
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0

COPY package*.json ./
RUN npm install

COPY . .

# Expo web defaults to port 19006
EXPOSE 19006

# Start Expo web on LAN so devices on the same network can connect.
# The `--tunnel` flag can be added in environments where LAN is blocked.
CMD ["npx", "expo", "start", "--web", "--host", "lan"]
