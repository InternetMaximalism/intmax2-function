# intmax2-function

This document provides instructions for setting up, running, building with Docker, and deploying the `intmax2-function` project.

## Setup

Before running any service, make sure to:

```sh
# Install dependencies
yarn

# Copy environment variables
cp .env.example .env

# Build shared packages
yarn build:shared
```

## Development

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
├── indexer-cache-validator
├── indexer-event-watcher
├── indexer-monitor
├── messenger-relayer
├── mint-executor
├── mock-l1-to-l2-relayer
├── mock-l2-to-l1-relayer
├── predicate
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

# Set the FIRESTORE_EMULATOR_HOST variable in the same terminal where you will run your application.
export FIRESTORE_EMULATOR_HOST="HOST:PORT"
export FIRESTORE_EMULATOR_HOST="HOST:PORT" # We will use what is displayed in the console.
```

## Docker

Build and run the project in a Docker container:

```sh
docker build -f docker/Dockerfile -t intmax2-function .
docker run --rm -p 3000:3000 --env-file .env intmax2-function workspace token start
```

## Redis

Run Redis in a Docker container with data persistence enabled.

```sh
docker run -d --rm \
  --name redis \
  -p 6379:6379 \
  -v redis-data:/data \
  redis redis-server --appendonly yes
```

## Testing

The project uses Vitest for testing. Run tests with the following commands:

```sh
# Run all tests
yarn test

# Run tests in watch mode
yarn test --watch

# Run tests with coverage report
yarn coverage
```

## Bootstrap Tasks

Run the following commands to initialize the token map configuration.

```sh
# Bootstrap token map configuration
yarn token-map-bootstrap

# Bootstrap token image assets
yarn token-image-bootstrap
```

## Docs

This document explains the overall system design of intmax2-function. It covers the architectural components, interactions between modules, data flow, and the process of generating and verifying ZKPs (Zero-Knowledge Proofs). It is intended to help developers and infrastructure engineers understand the technical foundation of the system.

- [SYSTEM Design](./docs/SYSTEM_DESIGN.md)
- [API Usage](./docs/API.md)
- [ENV](./packages/shared/src/config/index.ts)