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

1. **Docker & Docker Compose:** Installed and running on your development machine.
2. **Expo Go App:** Downloaded on your iOS or Android device from the App Store or Google Play Store.
3. **Shared Network:** Your mobile device and your development computer **must** be connected to the exact same Wi-Fi network.

---

### 1: Environment Setup

Create a `.env` file in the root of your project directory (the same folder as your `docker-compose.yml`).

#### Find Your Local IP Address

- **Windows:** Open Command Prompt and run `ipconfig` (look for "IPv4 Address").
- **Mac/Linux:** Open Terminal and run `ifconfig` or `ip a`.

#### Configure the `.env` File

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

### 2: Build and Run the Application

```bash
# Run this from root path where docker-compose.yml is
docker-compose up --build
```

#### What happens behind the scenes?

A large QR code should appear in your terminal output.

### 3: Connect Your Device

1. Scan the QR code from the terminal:

- **Android:** Use the "Scan QR Code" button directly inside the Expo Go app.
- **iOS:** Use the native Apple Camera app to scan the QR code, which will prompt you to open Expo Go.

2. The app should launch on your screen
