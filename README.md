# intmax2-function

This document provides instructions for setting up, running, building with Docker, and deploying the `intmax2-function` project.

## Installing Dependencies

First, install the project dependencies, build the project, and set up the environment.

```bash
# install
yarn

# build:shared
yarn build:shared

# build
yarn build

# setup env
cp .env.example .env
```

## Running the Project

To start the development mode for each workspace, use the following commands:

**API**

```bash
yarn workspace <package-name> dev

# ex.
yarn workspace indexer dev
```

**JOB**

```bash
yarn workspace <package-name> dev

# ex.
yarn workspace block-sync-monitor dev
```

## Packages Structure

The project is divided into the following workspaces:

```sh
packages
├── block-sync-monitor
├── deposit-analyzer
├── indexer
├── indexer-event-watcher
├── indexer-monitor
├── messenger-relayer
├── mint-executor
├── mock-l1-to-l2-relayer
├── mock-l2-to-l1-relayer
├── predicate
├── referral
├── shared
├── token
├── token-map-register
├── token-metadata-sync
├── tx-map
├── tx-map-cleaner
└── wallet-observer
```

## Local Emulator

If your development workflow involves Firestore, you can start a local emulator:

```sh
gcloud emulators firestore start
export FIRESTORE_EMULATOR_HOST="HOST:PORT" # We will use what is displayed in the console.
```

## Docker

Build and run the project in a Docker container:

```sh
docker build -f docker/Dockerfile -t intmax2-function .
docker run --rm -p 3000:3000 --env-file .env intmax2-function workspace token start
```

## Redis

```sh
docker run -d --rm \
  --name redis \
  -p 6379:6379 \
  -v redis-data:/data \
  redis redis-server --appendonly yes
```

## Bootstrap Tasks

```sh
# Bootstrap token map configuration
yarn token-map-bootstrap

# Bootstrap token image assets
yarn token-image-bootstrap
```