# Trading Journal

A personal trading journal for tracking trades, calculating risk-reward ratios, and visualizing P&L on a calendar. Built with SvelteKit 5, Payload CMS 3, PostgreSQL, and Capacitor for mobile.

## Prerequisites

- [Node.js 22+](https://nodejs.org/)
- [pnpm](https://pnpm.io/) (`corepack enable && corepack prepare pnpm@latest --activate`)
- [Docker & Docker Compose](https://docs.docker.com/get-docker/) (for containerized setup)
- PostgreSQL 16 (if running without Docker)

## Quick Start (Docker)

The fastest way to get everything running:

```bash
# 1. Copy environment file and edit the values
cp .env.example .env

# 2. Set a strong password and secret in .env
#    - POSTGRES_PASSWORD: any strong password
#    - PAYLOAD_SECRET: a random 32+ character string

# 3. Start all services
docker compose up --build
```

This starts:

- **PostgreSQL** on port `5432`
- **Backend** (Payload CMS + API) on port `3000`
- **Frontend** (SvelteKit via nginx) on port `8080`

Open [http://localhost:8080](http://localhost:8080) in your browser.

The Payload admin panel is at [http://localhost:3000/admin](http://localhost:3000/admin).

## Quick Start (Local Development)

If you prefer running services directly for development with hot reload:

### 1. Start PostgreSQL

Either use Docker for just the database:

```bash
docker compose up postgres -d
```

Or use a local PostgreSQL instance and make sure it's running on port 5432.

### 2. Set up environment

```bash
cp .env.example .env
# Edit .env with your database credentials and a PAYLOAD_SECRET
```

### 3. Install dependencies and start the backend

```bash
cd backend
pnpm install
pnpm dev
```

The backend starts on [http://localhost:3000](http://localhost:3000). On first run, Payload will create the database tables automatically.

### 4. (Optional) Seed ticker data

```bash
cd backend
pnpm seed:tickers
```

This populates the tickers collection with ~110 stocks, forex pairs, and crypto symbols for the autocomplete search.

### 5. Start the frontend

In a separate terminal:

```bash
cd frontend
pnpm install
pnpm dev
```

The frontend starts on [http://localhost:5173](http://localhost:5173).

## Production (Docker)

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

This runs optimized production builds with:

- No source bind mounts
- `NODE_ENV=production`
- Memory limits and `restart: always`
- Frontend served on port `80`

## Running Tests

```bash
cd frontend

# Unit tests
pnpm test:unit

# Unit tests with coverage
pnpm test:coverage

# Type checking
pnpm check

# Linting
pnpm lint

# E2E tests (requires running dev server)
pnpm test:e2e
```

## Mobile (Capacitor)

The app runs fully offline on mobile using SQLite for local storage. The frontend is bundled as a native app via Capacitor.

### Prerequisites

- **Android**: JDK 21 (required by Capacitor 8.x plugins). If only JDK 17 is installed, download Temurin JDK 21:
  ```bash
  curl -sL "https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.6%2B7/OpenJDK21U-jdk_x64_linux_hotspot_21.0.6_7.tar.gz" -o /tmp/jdk21.tar.gz
  mkdir -p ~/.jdks && tar -xzf /tmp/jdk21.tar.gz -C ~/.jdks
  ```
- **Android**: Android SDK (via Android Studio or `ANDROID_HOME` environment variable)
- **iOS**: macOS with Xcode 15+ and CocoaPods (`sudo gem install cocoapods`)

### First-time setup

```bash
cd frontend
pnpm install

# Add platforms (only needed once)
npx cap add android
npx cap add ios
```

### Building for Android

There are two build types: **debug** (for testing) and **release** (for distribution).

#### Debug Build

For development and testing. No signing setup required — Gradle uses an auto-generated debug keystore.

```bash
cd frontend

# 1. Build the SvelteKit static SPA
pnpm build

# 2. Sync web assets and plugins to the Android project
npx cap sync android

# 3. Build the debug APK (set JAVA_HOME to JDK 21)
cd android
JAVA_HOME=~/.jdks/jdk-21.0.6+7 ./gradlew assembleDebug
```

The debug APK will be at:

```
frontend/android/app/build/outputs/apk/debug/talaan-v<version>-debug.apk
```

Transfer the APK to your Android device and install it (enable "Install from unknown sources" in Android settings).

Alternatively, open in Android Studio for on-device debugging:

```bash
npx cap open android
```

#### Release Build

For Play Store distribution or sharing a production-ready APK. Requires a signing keystore.

**1. Generate a signing keystore (one-time):**

```bash
keytool -genkey -v -keystore ~/talaan-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias talaan
```

Keep the keystore file and password safe — you need the same key for all future updates.

**2. Configure signing** by adding a `signingConfigs` block in `frontend/android/app/build.gradle` and referencing it in the `release` build type.

**3. Build the release APK:**

```bash
cd frontend

# 1. Build the SvelteKit static SPA
pnpm build

# 2. Sync web assets and plugins to the Android project
npx cap sync android

# 3. Build the release APK (set JAVA_HOME to JDK 21)
cd android
JAVA_HOME=~/.jdks/jdk-21.0.6+7 ./gradlew assembleRelease
```

The release APK will be at:

```
frontend/android/app/build/outputs/apk/release/talaan-v<version>-release.apk
```

#### Debug vs Release

|                | Debug                  | Release                   |
| -------------- | ---------------------- | ------------------------- |
| **Command**    | `assembleDebug`        | `assembleRelease`         |
| **Signing**    | Auto (debug keystore)  | Your release keystore     |
| **Debuggable** | Yes                    | No                        |
| **Optimized**  | No                     | Yes (if ProGuard enabled) |
| **Play Store** | No                     | Yes                       |
| **Use case**   | Testing on your device | Distribution              |

### Building for iOS

```bash
cd frontend

# 1. Build the SvelteKit static SPA
pnpm build

# 2. Sync web assets and plugins to the iOS project
npx cap sync ios

# 3. Install CocoaPods dependencies
cd ios/App
pod install
cd ../..

# 4. Open in Xcode to build and run
npx cap open ios
```

In Xcode:

1. Select your development team under **Signing & Capabilities**
2. Select a simulator or connected device
3. Press **Cmd+R** to build and run

To build an IPA for distribution, use **Product > Archive** in Xcode.

## Desktop (Electron)

The app also runs as a standalone desktop application via Electron, using SQLite for offline data storage (same as mobile).

### Prerequisites

- Node.js 22+
- pnpm (for the frontend build step)
- npm (used inside `frontend/electron/` — installed with Node.js)

### First-time setup

```bash
cd frontend
pnpm install

# Add Electron platform (only needed once)
npx cap add @capacitor-community/electron

# Install Electron-specific dependencies (SQLite native modules, etc.)
cd electron
npm install
cd ..
```

### Development

Build the web app, sync to Electron, and launch:

```bash
cd frontend
pnpm run dev:electron
```

This runs `vite build` + `cap sync` + opens the Electron window with DevTools enabled.

## Building Distributable Packages

#### Linux (AppImage + .deb)

**Step 1.** Navigate to the frontend directory and install dependencies:

```bash
cd frontend
pnpm install
```

**Step 2.** Add the Electron platform (first time only):

```bash
npx cap add @capacitor-community/electron
```

**Step 3.** Install Electron-specific dependencies (first time, or after adding new packages):

```bash
cd electron
npm install
cd ..
```

**Step 4.** Build the SvelteKit web app and sync to Electron:

```bash
pnpm run build:electron
```

> **Important:** Always use `build:electron` instead of running `build` and `cap sync` separately. The `cap sync` command resets `electron-plugins.js` to a format that breaks SQLite plugin registration. The `build:electron` script automatically runs `scripts/fix-electron-plugins.js` after syncing to restore the correct plugin configuration.

**Step 5.** Build the distributable packages:

```bash
pnpm run dist:electron
```

**Step 6.** Output files will be in:

```
frontend/electron/dist/
├── Talaan-<version>.AppImage    # Portable — no install needed
└── talaan_<version>_amd64.deb   # Debian/Ubuntu package
```

**To run the AppImage:**

```bash
chmod +x frontend/electron/dist/Talaan-<version>.AppImage
./frontend/electron/dist/Talaan-<version>.AppImage
```

**To install the .deb:**

```bash
sudo dpkg -i frontend/electron/dist/talaan_<version>_amd64.deb
```

##### Manual build (alternative)

If you need to run steps individually instead of using `build:electron`:

```bash
cd frontend

# 1. Build the SvelteKit static SPA
pnpm build

# 2. Sync web assets to Electron
npx cap sync @capacitor-community/electron

# 3. Fix the SQLite plugin registration (REQUIRED after every cap sync)
node scripts/fix-electron-plugins.js

# 4. Build and package
cd electron
npm install
npm run electron:make
```

#### Windows (NSIS installer)

Windows builds **must be done on Windows** — cross-compiling from Linux is not supported because the SQLite native module (`better-sqlite3-multiple-ciphers`) requires platform-specific compilation.

If you're using WSL2, build from a **Windows terminal** (PowerShell or cmd, not WSL).

**Step 1.** Clone or navigate to the repo from Windows:

```powershell
cd C:\path\to\claytradingjournal\frontend
```

**Step 2.** Install frontend dependencies:

```powershell
npm install
```

**Step 3.** Build the SvelteKit web app and sync to Electron (this also runs the plugin fix script automatically):

```powershell
npm run build:electron
```

> **Important:** Always use `build:electron` instead of running `build` and `cap sync` separately. The `cap sync` command resets `electron-plugins.js` to a format that breaks SQLite plugin registration. The `build:electron` script automatically runs `scripts/fix-electron-plugins.js` after syncing to restore the correct plugin configuration.

**Step 4.** Install Electron dependencies (first time, or after adding new packages):

```powershell
cd electron
npm install
```

**Step 5.** Build the Windows installer:

```powershell
npm run electron:make
```

**Step 6.** Run the installer:

```
frontend\electron\dist\Talaan Setup 1.0.0.exe
```

##### Manual build (alternative)

If you need to run steps individually instead of using `build:electron`:

```powershell
cd C:\path\to\claytradingjournal\frontend

# 1. Build the SvelteKit static SPA
npm run build

# 2. Sync web assets to Electron
npx cap sync @capacitor-community/electron

# 3. Fix the SQLite plugin registration (REQUIRED after every cap sync)
node scripts/fix-electron-plugins.js

# 4. Build and package
cd electron
npm install
npm run electron:make
```

#### macOS (.dmg)

On a Mac:

```bash
cd frontend/electron
npm install
npm run electron:make
```

Output: `frontend/electron/dist/Talaan-1.0.0.dmg`

### Data Storage Locations

| Platform | Path                                    |
| -------- | --------------------------------------- |
| Linux    | `~/.config/Talaan/`                     |
| macOS    | `~/Library/Application Support/Talaan/` |
| Windows  | `%APPDATA%/Talaan/`                     |

### Build Commands Summary

| Command                   | Description                                       |
| ------------------------- | ------------------------------------------------- |
| `pnpm run dev:electron`   | Build + sync + open Electron (dev mode)           |
| `pnpm run build:electron` | Build + sync only (no launch)                     |
| `pnpm run dist:electron`  | Build + sync + package for Linux (AppImage + deb) |

## Project Structure

```
backend/                  # Payload CMS 3.x (Next.js)
  src/
    collections/          # Payload collection configs
    endpoints/            # Custom API endpoints (export/import)
    hooks/                # Payload hooks (trade validation)
    seed/                 # Ticker seed script + data

frontend/                 # SvelteKit 5 (adapter-static)
  src/
    lib/
      components/         # Svelte components (ui, trade, calendar, account)
      services/           # DataService abstraction (Payload REST, SQLite stub)
      stores/             # Svelte 5 rune-based stores
      types/              # TypeScript interfaces
      utils/              # Calculations, formatters, validators, P&L, export
    routes/               # SvelteKit pages
  tests/                  # Vitest unit + Playwright E2E
  static/data/            # Bundled ticker catalog for mobile

docker-compose.yml        # Development compose
docker-compose.prod.yml   # Production compose
Dockerfile.backend        # Multi-stage backend build
Dockerfile.frontend       # Multi-stage frontend build (nginx)
```

## Environment Variables

| Variable                 | Description                     | Default                     |
| ------------------------ | ------------------------------- | --------------------------- |
| `POSTGRES_DB`            | Database name                   | `payload`                   |
| `POSTGRES_USER`          | Database user                   | `payload`                   |
| `POSTGRES_PASSWORD`      | Database password               | _(required)_                |
| `DATABASE_URI`           | Full Postgres connection string | _(derived from above)_      |
| `PAYLOAD_SECRET`         | Payload CMS encryption secret   | _(required)_                |
| `NEXT_PUBLIC_SERVER_URL` | Backend URL                     | `http://localhost:3000`     |
| `PUBLIC_API_URL`         | API URL for frontend            | `http://localhost:3000/api` |
