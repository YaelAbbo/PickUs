FROM node:22-slim

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8081 19000 19001 19002

# The --lan flag tells Expo to use the IP address we provided in docker-compose
CMD ["npx", "expo", "start", "--lan", "--clear"] 
