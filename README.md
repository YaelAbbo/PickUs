# PickUs Project

Created by Natan Sinai, Shira Magrafta, Yael Abbo and Yishai Chen (2026).

## Description

TODO

---

## Architecture Overview

PickUs uses a split-terminal setup:

- **Docker Compose** runs the backend (NestJS), Nginx gateway, PostgreSQL, and pgAdmin as containers.
- **Expo / React Native frontend** runs natively on your machine in a separate terminal — it is **not** containerized.
- **Nginx** acts as the single entry point on port `80`, routing `/api` to the backend and `/` to the Expo dev server (`host.docker.internal:8081`).

```
Your Phone (Expo Go)
        │
        ▼
  Nginx Gateway :80
   ├── /api     ──────► Backend :3000
   ├── /pgadmin ──────► pgAdmin :8080
   └── /        ──────► Expo Dev Server :8081  (runs on host machine)
```

---

## Prerequisites

1. **Docker & Docker Compose** — installed and running.
2. **Node.js & npm** — required to run the Expo frontend.
3. **Expo Go app** — downloaded on your phone ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779)).
4. **Shared Wi-Fi** — your phone and development machine must be on the **same network**.

---

## Local Deployment Guide

### Step 1 — Find Your Local IP Address

You'll need your machine's local IP to let the phone reach the Expo dev server.

- **Windows:** Run `ipconfig` in CMD and look for "IPv4 Address".
- **Mac/Linux:** Run `ip a` or `ifconfig` in Terminal.

### Step 2 — Configure Environment Files

#### Root `.env` (same folder as `docker-compose.yml`)

Copy `.env.example` to `.env` and update the two lines that reference your local IP:

```env
# Replace 10.100.102.8 with YOUR machine's local IP address
REACT_NATIVE_PACKAGER_HOSTNAME=10.100.102.8
EXPO_PUBLIC_API_URL=http://10.100.102.8/api
```

All other values can remain as the defaults from `.env.example`.

#### Frontend `.env` (`/frontend/.env`)

This file is used when the Expo bundler itself needs to know the API URL:

```env
EXPO_PUBLIC_API_URL=http://<YOUR_LOCAL_IP>/api
```

> **Why two `.env` files?** The root `.env` is consumed by Docker and the backend. The frontend `.env` is loaded directly by the Expo bundler running on the host machine.

---

### Step 3 — Start the Docker Stack

Run from the project root (where `docker-compose.yml` lives):

```bash
docker compose up --build
```

This starts:

| Container        | Port   | Description              |
| ---------------- | ------ | ------------------------ |
| `postgres_db`    | `5432` | PostgreSQL (TimescaleDB) |
| `pgadmin`        | `8080` | pgAdmin UI               |
| `pickus_backend` | `3000` | NestJS API               |
| `pickus_gateway` | `80`   | Nginx reverse proxy      |

Wait until the backend healthcheck passes before proceeding — you'll see the backend logs stabilize.

---

### Step 4 — Start the Expo Frontend (separate terminal)

Open a **new terminal**, navigate to the frontend directory, and start the Expo dev server:

```bash
cd frontend
npm install       # first time only
npm start         # or: npx expo start
```

Expo will start a bundler on port `8081`. Nginx (running in Docker) proxies `/` through to this port via `host.docker.internal:8081`, so the gateway and the phone can both reach the dev server.

---

### Step 5 — Connect Your Device

Once both the Docker stack and Expo are running, scan the QR code printed in the Expo terminal:

- **Android:** Use the **Scan QR Code** button inside the Expo Go app.
- **iOS:** Use the native **Camera app** to scan — it will prompt you to open Expo Go.

The app should now load on your device. 🎉

---

## Useful URLs (from your browser)

| URL                           | What it is           |
| ----------------------------- | -------------------- |
| `http://localhost/api/health` | Backend health check |
| `http://localhost/pgadmin`    | pgAdmin database UI  |
| `http://localhost/`           | Expo web preview     |

---

## Database

PostgreSQL and pgAdmin both run as containers in the Compose stack.

For information on running TypeORM migrations and connecting to pgAdmin, see the **[Database & Migrations Guide](./backend/src/database/Migrations.md)**.

---

## Troubleshooting

**App shows "Network request failed" or can't reach the API**
→ Double-check that `REACT_NATIVE_PACKAGER_HOSTNAME` and `EXPO_PUBLIC_API_URL` in the root `.env` both contain your machine's **current** local IP (it can change when you reconnect to Wi-Fi).

**Expo bundler starts but Nginx can't reach it**
→ Confirm the Expo dev server is running on port `8081`. Nginx uses `host.docker.internal:8081` to reach the host machine — this is pre-configured via the `extra_hosts` entry in `docker-compose.yml` and works on Docker Desktop (Mac/Windows) and Linux.

**pgAdmin is blank or returns 502**
→ Wait a few seconds after `docker compose up` for pgAdmin to fully initialize, then refresh.

**Changes to `.env` not picked up**
→ Restart the stack: `docker compose down && docker compose up --build`.
