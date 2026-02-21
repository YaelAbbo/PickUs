# PickUs Project

Created by Natan Sinai, Shira Magrafta, Yael Abbo and Yishai Chen (2026).

## Description

TODO

## Project setup

```bash
npm install
```

## Compile and run the project

```bash
# Development

# To build, run locally the following commands:
# Backend
docker buildx build --load -t pickus-backend:latest backend/
# Frontend
docker buildx build --load -t pickus-frontend:latest frontend/

# To run the container locally / separately, run the following commandsuse:
# Backend
docker run -it --rm -p 3000:3000 --env-file backend/.env --name pickus-backend pickus-backend:latest
# Frontend
docker run -it --rm -p 19000:19000 -p 19001:19001 -p 19002:19002 --env-file frontend/.env --name pickus-frontend pickus-frontend:latest

# Production mode
TODO
```
