# PickUs Project

Created by Natan Sinai, Shira Magrafta, Yael Abbo and Yishai Chen (2026).

## Description

TODO

## Project setup

```bash
npm install
```

## 🚀 Pickus - Local Deployment Guide (LAN Mode)

This guide explains how to spin up the Pickus backend and frontend locally using Docker Compose.

The backend uses a multi-stage Docker build for an optimized production-ready container, while the frontend runs an Expo development server. This setup uses **LAN Mode**, meaning your physical mobile device will connect directly to your computer over your local Wi-Fi network—no third-party tunneling services required!

## 📋 Prerequisites

Before you begin, ensure you have the following ready:

1. **Docker & Docker Compose:** Installed and running on your development machine.
2. **Expo Go App:** Downloaded on your iOS or Android device from the App Store or Google Play Store.
3. **Shared Network:** Your mobile device and your development computer **must** be connected to the exact same Wi-Fi network.

---

## ⚙️ Step 1: Environment Setup

Create a `.env` file in the root of your project directory (the same folder as your `docker-compose.yml`).

Because we are connecting locally, Expo needs to know your computer's internal network IP address so it can tell your phone where to route the connection.

### Find Your Local IP Address

- **Windows:** Open Command Prompt and run `ipconfig` (look for "IPv4 Address").
- **Mac/Linux:** Open Terminal and run `ifconfig` or `ip a`.

### Configure the `.env` File

Add the following variables to your `.env` file, replacing the `X` with your actual IP address:

```env
# Backend Configuration
PORT=3000
NODE_ENV=production

# Frontend Configuration
# Replace 192.168.1.X with your computer's actual local IP address
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.X
EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
API_URL=[http://192.168.1.](http://192.168.1.)X:3000
```

## 🐳 Step 2: Build and Run the Application

Open your terminal in the root directory where your `docker-compose.yml` is located and start the services:

```bash
docker-compose up --build
```

### What happens behind the scenes?

1. Docker compiles the backend TypeScript code into a `/dist` folder and starts the Node.js server on port `3000`.
2. Docker installs the frontend dependencies and launches the Expo Metro Bundler on port `8081`.
3. A large QR code will print directly in your terminal output.

---

## 📱 Step 3: Connect Your Device

1. Open the **Expo Go** app on your phone.
2. Scan the QR code from the terminal:

- **Android:** Use the "Scan QR Code" button directly inside the Expo Go app.
- **iOS:** Use the native Apple Camera app to scan the QR code, which will prompt you to open Expo Go.

3. The app will bundle the JavaScript and launch on your screen!

---

## 🛠️ Troubleshooting

### ❌ The app loads forever and says "Network Response Timed Out"

This means your phone cannot reach your computer over the local network.

- **Verify the IP:** Double-check that `REACT_NATIVE_PACKAGER_HOSTNAME` in your `.env` perfectly matches your computer's current Wi-Fi IP address. _(Note: IP addresses can change if your router restarts)._
- **Check your Firewall:** Windows Defender or macOS Firewall might be blocking incoming connections on ports `8081` and `3000`. You may need to temporarily disable your firewall or add inbound rules allowing traffic on those ports.
- **Network Isolation:** Some public or corporate Wi-Fi networks (like cafes or universities) block device-to-device communication. If this is the case, you will need to switch to a private home network or use a mobile hotspot.

### ❌ The QR code doesn't show up in the terminal

Expo requires an interactive terminal to render the QR code. Ensure these two lines are present and uncommented under the `frontend` service in your `docker-compose.yml`:

```yaml
stdin_open: true
tty: true
```

### ❌ Backend changes aren't reflecting

If you are making live code changes to the backend, remember that the backend `Dockerfile` uses a multi-stage build that compiles a static snapshot of your code into a `/dist` folder. If you change your backend code, you must rebuild the container:

```bash
docker-compose up --build backend
```
