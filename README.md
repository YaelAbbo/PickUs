# PickUs Project

Created by Natan Sinai, Shira Magrafta, Yael Abbo and Yishai Chen (2026).

## Description

TODO

## Project setup

```bash
npm install
```

## Local Deployment Guide

### Prerequisites

1. **Docker & Docker Compose:** Installed and running.
2. **Expo Go App:** Downloaded on your phone.
3. **Shared Network:** Your phone and development computer **must** be connected to the same Wi-Fi network.

---

### 1: Environment Setup

#### Find Your Local IP Address

- **Windows:** Run `ipconfig` in CMD (look for "IPv4 Address").
- **Mac/Linux:** Open Terminal and run `ip a`.

#### Configure the `.env` File

Create a `.env` file in the root of your project directory (the same folder as your `docker-compose.yml`).
Copy the values from the [.env.example](.env.example) file.

### Pay attention!

Ensure these lines are present under the frontend service in your docker-compose.yml if you want a QR code to appear:

    stdin_open: true
    tty: true

### 2: Build and Run

```bash
# Run this from root path where docker-compose.yml is
docker-compose up --build
```

#### What should happen?

A large QR code should appear in your terminal output for you to scan.

### 3: Connect Your Device

1. Scan the QR code:

- **Android:** Use the "Scan QR Code" button directly inside the Expo Go app.
- **iOS:** Use the native Apple Camera app to scan the QR code, which will prompt you to open Expo Go.

2. The app should now launch on your screen

## Database

The DB and the PgAdmin both run as containers. For more information about migrating with typeorm and connecting to the PgAdmin **[Click here](./backend/src/database/Migrations.md)**.
