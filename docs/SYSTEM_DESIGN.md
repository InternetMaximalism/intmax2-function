# INTMAX2 Function Services - System Design

## 1. Overview

The INTMAX2 Function Services is a comprehensive suite of blockchain infrastructure services that support the INTMAX2 ecosystem. It comprises modular services for indexing, token management, deposit analysis, message relaying, monitoring, and various specialized functions to ensure efficient and secure blockchain operations.

### 1.1 Project Structure

```txt
packages/
├── block-sync-monitor/
│   ├── src/
│   │   └── service/
│   └── package.json
├── deposit-analyzer/
│   ├── src/
│   │   └── service/
│   └── package.json
├── indexer/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── lib/
│   └── package.json
├── indexer-cache-validator/
│   ├── src/
│   │   └── service/
│   └── package.json
├── indexer-event-watcher/
│   ├── src/
│   │   └── service/
│   └── package.json
├── indexer-monitor/
│   ├── src/
│   │   └── service/
│   └── package.json
├── messenger-relayer/
│   ├── src/
│   │   └── service/
│   └── package.json
├── mint-executor/
│   ├── src/
│   │   └── service/
│   └── package.json
├── mock-l1-to-l2-relayer/
│   ├── src/
│   │   └── service/
│   └── package.json
├── mock-l2-to-l1-relayer/
│   ├── src/
│   │   └── service/
│   └── package.json
├── predicate/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── services/
│   └── package.json
├── shared/
│   ├── src/
│   │   ├── api/
│   │   ├── blockchain/
│   │   ├── bootstrap/
│   │   ├── config/
│   │   ├── constants/
│   │   ├── controllers/
│   │   ├── db/
│   │   ├── lib/
│   │   ├── middlewares/
│   │   ├── monitor/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── typeChainTypes/
│   │   ├── types/
│   │   └── validations/
│   └── package.json
├── token/
│   ├── src/
│   │   ├── controllers/
│   │   └── routes/
│   └── package.json
├── token-map-register/
│   ├── src/
│   │   └── service/
│   └── package.json
├── token-metadata-sync/
│   ├── src/
│   │   └── service/
│   └── package.json
├── tx-map/
│   ├── src/
│   │   ├── controllers/
│   │   └── routes/
│   └── package.json
├── tx-map-cleaner/
│   ├── src/
│   │   └── service/
│   └── package.json
└── wallet-observer/
    ├── src/
    │   └── service/
    └── package.json
```

This mono-repo is organized under the `packages/` directory, with each package focusing on a distinct role:

**API Services:**
- **indexer**: Provides block builder node information and proxy metadata via REST API
- **token**: Manages token prices and token mappings through REST endpoints
- **predicate**: Evaluates anti-money laundering (AML) policies via API
- **tx-map**: Temporarily stores and retrieves transaction-related key-value mappings

**Background Services:**
- **deposit-analyzer**: Analyzes and processes deposit transactions on blockchain networks
- **messenger-relayer**: Relays messages using Scroll API for cross-layer communication
- **block-sync-monitor**: Monitors and validates block synchronization between validity prover and rollup contract
- **indexer-event-watcher**: Retrieves and processes information from blockchain nodes
- **indexer-monitor**: Monitors indexer service health and performance
- **indexer-cache-validator**: Validates and maintains indexer cache integrity
- **mint-executor**: Executes minting operations
- **wallet-observer**: Monitors wallet balances and sends notifications
- **token-map-register**: Registers and manages token mappings
- **token-metadata-sync**: Synchronizes token metadata across networks
- **tx-map-cleaner**: Periodically cleans up expired entries in tx-map storage

**Development Tools:**
- **mock-l1-to-l2-relayer**: Development-only service for L1 to L2 message relay simulation
- **mock-l2-to-l1-relayer**: Development-only service for L2 to L1 message relay simulation

**Shared Infrastructure:**
- **shared**: Common constants, types, utilities, blockchain interfaces, and configuration shared across all packages

## 2. High-Level Architecture

### 2.1 Service Architecture Overview

```txt
┌─────────────────────────────────────────────────────────────────────────┐
│                          API Layer                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Indexer    │  │    Token     │  │  Predicate   │  │   TX-Map     │ │
│  │   Service    │  │   Service    │  │   Service    │  │   Service    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                       Background Services                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Deposit      │  │ Messenger    │  │ Block Sync   │  │ Indexer      │ │
│  │ Analyzer     │  │ Relayer      │  │ Monitor      │  │ Event        │ │
│  │              │  │              │  │              │  │ Watcher      │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Wallet       │  │ Token        │  │ TX-Map       │  │ Mint         │ │
│  │ Observer     │  │ Metadata     │  │ Cleaner      │  │ Executor     │ │
│  │              │  │ Sync         │  │              │  │              │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                      Infrastructure Layer                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐             │
│  │ FireStore   │  │    Redis    │  │   RPC Provider      │             │
│  │  Database   │  │   Cache     │  │   (Ethereum/Scroll) │             │
│  └─────────────┘  └─────────────┘  └─────────────────────┘             │
└─────────────────────────────────────────────────────────────────────────┘
```

The INTMAX2 Function Services architecture is organized into three main layers:

1. **API Layer**: HTTP REST services that provide external interfaces for indexing, token management, AML evaluation, and transaction mapping
2. **Background Services**: Worker services that handle blockchain monitoring, data processing, cross-layer communication, and maintenance tasks
3. **Infrastructure Layer**: Shared data storage, caching, and blockchain connectivity components

### 2.2 Data Flow Patterns

#### API Service Flow

```txt
Client Request → API Service → Database/Cache → Response
```

#### Background Service Flow

```txt
Start Background Service → Process Data → (Submit Transaction / Send Notification / Update Database)
```

## 3. Service Components

### 3.1 API Services

#### Indexer Service

- **Purpose**: Provides block builder node information and proxy metadata
- **Endpoints**:
  - `/v1/indexer/builders` - List all block builder nodes
  - `/v1/indexer/builders/meta` - Fetch block builder metadata
  - `/v1/indexer/builders/registration/{address}` - Check indexer registration
  - `/v1/proxy/meta` - Fetch proxy metadata
- **Caching**: Implements intelligent caching with configurable TTL for different endpoint types
- **Dependencies**: Blockchain RPC provider, Redis cache

#### Token Service

- **Purpose**: Provides comprehensive token information including prices and mappings for INTMAX2 network
- **Endpoints**:
  - `/v1/token-prices/list` - Fetch token prices with filtering capabilities
  - `/v1/token-maps/list` - Fetch token mappings with filtering capabilities
- **Features**:
  - Supports filtering by contract addresses, token indexes, and pagination
  - Returns token metadata including prices, symbols, decimals, and INTMAX2 tokenIndex mappings
  - Provides real-time token information for bridged assets
- **Data Sources**: FireStore database containing token mappings and metadata synchronized by background services
- **Dependencies**: FireStore database, token-metadata-sync service, token-map-register service

#### Predicate Service

- **Purpose**: Evaluates anti-money laundering (AML) policies
- **Endpoints**:
  - `/v1/predicate/evaluate-policy` - Evaluate AML policies for transactions
- **Security**: Implements strict input validation and policy verification
- **Dependencies**: AML policy engine, compliance databases

#### TX-Map Service

- **Purpose**: Temporarily stores and retrieves transaction-related key-value mappings
- **Endpoints**:
  - `POST /v1/map` - Store a key-value mapping with expiration
  - `GET /v1/map/{digest}` - Retrieve a mapping by digest
- **Features**: TTL-based expiration, digest-based key lookup
- **Dependencies**: Redis for temporary storage

### 3.2 Background Services

#### Deposit Analyzer

- **Purpose**: Analyzes and processes deposit transactions on blockchain networks with gas optimization through intelligent batching
- **Functions**:
  - Monitors deposit events from Liquidity smart contracts
  - Collects and analyzes deposit transaction data from blockchain events
  - Implements intelligent batching mechanism to optimize gas costs for relay operations
  - Groups multiple deposits together for efficient batch processing and relay to reduce per-transaction gas fees
  - Calculates optimal batch sizes based on gas limits and transaction costs
  - Manages deposit state transitions and relay scheduling
  - Ensures reliable delivery of batched deposit data to target networks
- **Gas Optimization Strategy**:
  - Batches multiple deposit events into single relay transactions
  - Reduces overall gas consumption compared to individual deposit relays
  - Implements configurable thresholds for batch size and timing optimization
- **Dependencies**: Blockchain RPC, Liquidity contract events, FireStore database

#### Messenger Relayer

- **Purpose**: Facilitates cross-layer communication by relaying messages from L2 to L1 using Scroll API and Messenger contracts
- **Functions**:
  - Monitors withdrawal and claim contract events for `submitWithdrawalProof` transactions
  - Retrieves L2-to-L1 message data from Scroll Messenger API when proof submissions are detected
  - Processes and formats message data for L1 submission
  - Submits `relayMessageWithProof` transactions to L1 Scroll Messenger contract
  - Triggers Liquidity contract state changes on L1 based on relayed message data
  - Implements retry logic with gas optimization for failed transactions
  - Handles message verification and proof validation
- **Message Flow**:
  1. **Event Detection**: Monitors L2 withdrawal/claim contracts for `submitWithdrawalProof` events
  2. **Data Retrieval**: Fetches corresponding message data from L2 Scroll Messenger API
  3. **Message Relay**: Submits `relayMessageWithProof` to L1 Scroll Messenger contract
  4. **Contract Update**: L1 Scroll Messenger triggers Liquidity contract state changes
- **Error Handling**: Comprehensive retry mechanism with exponential backoff and gas fee adjustment
- **Dependencies**: Scroll API, Ethereum/Scroll RPC providers, L1/L2 Scroll Messenger contracts, Liquidity contract

#### Block Sync Monitor

- **Purpose**: Monitors and validates block synchronization between validity prover and rollup contract
- **Functions**:
  - Tracks block synchronization status
  - Validates block consistency across layers
  - Alerts on synchronization issues
  - Maintains synchronization metrics
- **Dependencies**: Multiple RPC providers, monitoring systems

#### Indexer Event Watcher

- **Purpose**: Monitors block builder activity and maintains registry information through blockchain event processing
- **Functions**:
  - Continuously monitors Block Builder Registry contract for `blockBuilderHeartbeatEvent` events
  - Processes heartbeat events from active block builders to track their operational status
  - Updates FireStore database with latest block builder information and activity timestamps
  - Maintains event logs and audit trails for block builder activities
  - Implements automatic inactive status assignment for builders without 24-hour heartbeat updates
- **Activity Monitoring**: Tracks block builder heartbeats and marks inactive builders (>24h without updates) as `active: false`
- **Dependencies**: Blockchain RPC providers (Scroll), Block Builder Registry contract, FireStore database

#### Wallet Observer

- **Purpose**: Monitors wallet balances and sends notifications
- **Functions**:
  - Tracks wallet balance changes
  - Sends notifications for significant changes
  - Maintains balance history
  - Supports multiple wallet types
- **Dependencies**: Blockchain RPC, notification services

#### Token Metadata Sync

- **Purpose**: Periodically synchronizes token metadata and pricing information across networks
- **Functions**:
  - Fetches up-to-date token metadata from multiple blockchain networks (L1/L2)
  - Retrieves real-time pricing information from external price feeds and market data providers
  - Validates and normalizes token metadata (name, symbol, decimals, contract addresses)
  - Updates FireStore database with the latest token information
  - Ensures data consistency across different network environments
- **Schedule**: Runs periodically to maintain current token information
- **Dependencies**: Multiple blockchain networks (Ethereum, Scroll), external price APIs, FireStore database

#### Token Map Register

- **Purpose**: Monitors blockchain events and registers new token mappings for INTMAX2 network bridged assets
- **Functions**:
  - Continuously monitors Liquidity contract events for newly bridged tokens
  - Detects bridge deposit events when tokens are first introduced to INTMAX2 network
  - Creates tokenIndex mappings for newly bridged assets in INTMAX2 system
  - Associates L1/L2 token contract addresses with their corresponding INTMAX2 tokenIndex
  - Updates FireStore database with new token mapping relationships
  - Maintains the authoritative registry of all supported tokens in the INTMAX2 ecosystem
- **Event Sources**: Liquidity contract bridge events, token registration events
- **Dependencies**: Blockchain RPC providers, Liquidity contract, FireStore database

#### TX-Map Cleaner

- **Purpose**: Periodically cleans up expired entries in tx-map storage
- **Functions**:
  - Scans for expired mappings
  - Removes outdated entries
  - Optimizes storage usage
  - Maintains cleanup logs
- **Dependencies**: Redis, scheduled job system

### 3.3 Development and Testing Services

#### Mock L1-to-L2 Relayer

- **Purpose**: Development-only service for simulating L1 to L2 message relay
- **Scope**: Development environment only
- **Functions**: Simulates cross-layer message relay for testing

#### Mock L2-to-L1 Relayer

- **Purpose**: Development-only service for simulating L2 to L1 message relay
- **Scope**: Development environment only
- **Functions**: Simulates reverse cross-layer message relay for testing

### 3.4 Monitoring and Maintenance Services

#### Indexer Monitor

- **Purpose**: Validates and monitors active block builders to ensure service quality and availability
- **Functions**:
  - Periodically performs health checks on block builders with recent data updates
  - Validates ETH balance sufficiency for continued block builder operations
  - Verifies block builder service availability and response times
  - Updates block builder status to `active: true` for validated builders
  - Monitors service degradation and performance issues
  - Maintains operational metrics for block builder performance analysis
- **Validation Criteria**: Health check success, sufficient ETH balance, service responsiveness
- **Dependencies**: Block builder endpoints, blockchain RPC providers, FireStore database

#### Indexer Cache Validator

- **Purpose**: Continuously validates cached block builder information to ensure service reliability
- **Functions**:
  - Monitors health status of cached block builders during their cache lifetime
  - Performs real-time validation of ETH balance for cached builders
  - Conducts ongoing health checks to verify service availability
  - Removes invalidated builders from cache when issues are detected
  - Maintains cache integrity and prevents serving of unreliable block builders
  - Implements automated cache refresh for validated builders
- **Monitoring Scope**: Cached block builders only, real-time validation during cache period
- **Dependencies**: Block builder endpoints, blockchain RPC providers, Redis cache, FireStore database

### 3.5 Shared Infrastructure

#### Shared Library (`@intmax2-function/shared`)

- **Components**:
  - **Configuration Management**: Environment-based configuration with validation
  - **Blockchain Interfaces**: Standardized blockchain interaction utilities
  - **Database Schemas**: Shared data models and migration utilities
  - **Logging**: Structured logging with centralized configuration
  - **Middleware**: Common HTTP middleware for CORS, security, rate limiting
  - **Utilities**: Helper functions for common operations
  - **Type Definitions**: Shared TypeScript types and interfaces
- **Features**:
  - Health check endpoints for all services
  - Error handling and reporting utilities
  - Caching abstractions with Redis integration
  - Blockchain event processing utilities

## 4. Data Flow and Integration Patterns

### 4.1 API Service Data Flow

```txt
1. Client Request → API Gateway/Load Balancer
2. API Service (Indexer/Token/Predicate/TX-Map)
3. Input Validation & Authentication
4. Business Logic Processing
5. Data Layer Access (FireStore/Redis/External APIs)
6. Response Formatting & Caching
7. Client Response
```

### 4.2 Background Service Data Flow

```txt
Start Background Service
    ↓
Process Data
    └─→ Event Detection
    └─→ Processing & Validation
    └─→ Business Logic Execution
    └─→ Status Updates & Logging
    ↓
Trigger Action
    └─→ Submit Transaction
    └─→ Send Notification / Alert
    └─→ Database Operations (CRUD)
```

### 4.3 Deposit Processing System Data Flow

The deposit processing system optimizes gas costs through intelligent batching and relay operations:

```txt
┌─────────────────────────────────────────────────────────────────────────┐
│                    Deposit Processing System Flow                      │
└─────────────────────────────────────────────────────────────────────────┘

1. Event Monitoring (Deposit Analyzer)
   Liquidity Contract Events → Deposit Analyzer → Event Collection

2. Batch Optimization (Deposit Analyzer)
   Individual Deposits → Batching Algorithm → Optimized Batches

3. Relay Execution (Deposit Analyzer)
   Batched Deposits → Gas-Optimized Relay → Target Network
```

#### Detailed Process Flow:

1. **Event Detection and Collection**:
   - Continuously monitors Liquidity contract for deposit events
   - Captures deposit transaction details (amount, token, recipient, etc.)
   - Validates and stores deposit event data in FireStore

2. **Intelligent Batching Algorithm**:
   - Analyzes accumulated deposit events for batching opportunities
   - Calculates optimal batch sizes based on gas limits and cost efficiency
   - Groups compatible deposits together (same target network, token type, etc.)
   - Implements configurable thresholds for batch timing and size

3. **Gas-Optimized Relay Execution**:
   - Executes batched deposits as single relay transactions
   - Significantly reduces gas costs compared to individual deposit processing
   - Ensures reliable delivery and proper state management
   - Updates deposit status and maintains audit trails

### 4.4 Cross-Layer Message Relay System Data Flow

The cross-layer message relay system enables secure communication between L2 and L1 networks:

```txt
┌────────────────────────────────────────────────────────────────────────────┐
│                   Cross-Layer Message Relay System Flow                   │
└────────────────────────────────────────────────────────────────────────────┘

1. Proof Submission Detection (Withdrawal / Claim Aggregator)
  withdrawal aggregator / claim aggregator → submitWithdrawalProof / submitClaimProof → L2 Withdrawal / Claim Contracts

2. Message Data Retrieval (Messenger Relayer)
  L2 Scroll Messenger API → Message & Proof Data

3. L1 Message Relay (Messenger Relayer)
   Message & Proof Data → relayMessageWithProof → L1 Scroll Messenger Contract

4. State Update Execution (L1 Scroll Messenger)
  L1 Scroll Messenger Contract → Liquidity Contract → State Changes
```

#### Detailed Process Flow:

1. **Event Monitoring and Detection**:
   - Continuously monitors L2 withdrawal and claim contracts
   - Detects `submitWithdrawalProof` transaction events
   - Extracts transaction details and proof submission information
   - Validates event authenticity and completeness

2. **Message Data Retrieval from L2**:
   - Queries L2 Scroll Messenger API with detected event data
   - Retrieves complete message payload including:
     - Source and destination addresses (from, to)
     - Transaction value and nonce
     - Message data and proof information
     - Merkle proof and batch index for verification
   - Validates retrieved data integrity and format

3. **L1 Message Relay Execution**:
   - Formats retrieved data for L1 Scroll Messenger contract
   - Submits `relayMessageWithProof` transaction to L1 network
   - Implements retry logic with exponential gas fee increases
   - Handles transaction failures and replacement scenarios
   - Monitors transaction confirmation and finality

4. **Liquidity Contract State Updates**:
   - L1 Scroll Messenger contract validates message proof
   - Executes state changes on Liquidity contract based on message data
   - Updates withdrawal/claim statuses and balances
   - Maintains audit trail of cross-layer operations

### 4.5 Token Mapping System Data Flow

The token mapping system is a comprehensive pipeline that maintains accurate token information for the INTMAX2 network:

```txt
┌─────────────────────────────────────────────────────────────────────────┐
│                    Token Mapping System Flow                           │
└─────────────────────────────────────────────────────────────────────────┘

1. Token Metadata Collection (Token Metadata Sync)
   External Price APIs → Token Metadata Sync → FireStore Database

2. Bridge Event Monitoring (Token Map Register)
   Liquidity Contract Events → Token Map Register → FireStore Database

3. API Data Retrieval (Token Service)
   Client Request → Token API → FireStore Database → Formatted Response
```

#### Detailed Process Flow:

1. **Token Metadata Sync Service**:
   - Periodically fetches token pricing data from external APIs
   - Retrieves token metadata (name, symbol, decimals) from blockchain networks
   - Validates and normalizes token information
   - Updates FireStore with the latest token data

2. **Token Map Register Service**:
   - Monitors Liquidity contract for new bridge deposit events
   - Detects when tokens are first bridged to INTMAX2 network
   - Creates tokenIndex mappings for newly bridged assets
   - Associates L1/L2 contract addresses with INTMAX2 tokenIndex
   - Stores complete token mapping relationships in FireStore

3. **Token API Service**:
   - Receives client requests for token information
   - Queries FireStore database for token mappings and metadata
   - Returns comprehensive token data including prices, metadata, and tokenIndex mappings
   - Supports filtering by contract addresses, token indexes, and pagination

### 4.6 Cross-Service Communication

#### Database-Mediated Communication

- Services share data through FireStore databases
- Event-driven updates through database triggers
- Shared caching layer using Redis

#### Direct API Communication

- Service-to-service HTTP calls for real-time data
- Health check propagation between dependent services
- Configuration synchronization

### 4.8 Block Builder Indexer System Data Flow

The block builder indexer system ensures reliable and validated block builder service discovery:

```txt
┌─────────────────────────────────────────────────────────────────────────┐
│                    Block Builder Indexer System Flow                   │
└─────────────────────────────────────────────────────────────────────────┘

1. Heartbeat Monitoring (Indexer Event Watcher)
   Block Builder Registry Contract → blockBuilderHeartbeatEvent → FireStore Update

2. Activity Validation (Indexer Event Watcher)
   24-Hour Activity Check → Inactive Builder Detection → Status Update (active: false)

3. Health Validation (Indexer Monitor)
   Updated Builders → Health Check + ETH Balance → Validation → Status Update (active: true)

4. Client Response (Indexer Service)
   Client Request → Active Builders Query → Random Selection → Cached Response

5. Cache Validation (Indexer Cache Validator)
   Cached Builders → Real-time Health Check → Cache Update/Invalidation
```

#### Detailed Process Flow:

1. **Heartbeat Event Monitoring (Indexer Event Watcher)**:
   - Continuously monitors Block Builder Registry contract on Scroll network
   - Detects `blockBuilderHeartbeatEvent` events from active block builders
   - Extracts builder information and timestamp data from events
   - Updates FireStore database with latest builder activity information
   - Implements automatic marking of builders as inactive if no heartbeat received within 24 hours

2. **Health and Resource Validation (Indexer Monitor)**:
   - Periodically scans FireStore for block builders with recent data updates
   - Performs comprehensive health checks on each builder endpoint
   - Validates ETH balance sufficiency for continued operations
   - Verifies service availability and response time metrics
   - Updates builder status to `active: true` for successfully validated builders
   - Maintains performance metrics and operational analytics

3. **Client Service and Response (Indexer Service)**:
   - Receives client requests for block builder information
   - Queries FireStore for block builders with `active: true` status
   - Implements random selection algorithm for load distribution
   - Returns selected block builder information to clients
   - Caches responses for configurable time periods to reduce database load

4. **Cache Integrity Monitoring (Indexer Cache Validator)**:
   - Monitors cached block builders during their cache lifetime
   - Performs real-time health checks and ETH balance validation
   - Detects service degradation or resource insufficiency
   - Automatically removes invalidated builders from cache
   - Ensures clients receive only reliable and operational builder information

#### System Benefits:
- **High Availability**: Multiple validation layers ensure service reliability
- **Load Distribution**: Random selection provides balanced load across builders
- **Real-time Monitoring**: Continuous validation prevents serving of failed builders
- **Resource Efficiency**: Caching reduces database queries while maintaining data integrity

### 4.9 Monitoring and Observability Flow

```txt
1. Service Metrics Collection → Structured Logging
2. Health Status Aggregation → Centralized Monitoring
3. Alert Generation → Notification Systems
```

## 5. Scalability & Reliability

- **Stateless Services**: All services can scale horizontally behind a load balancer.
- **Eventual Consistency**: The jobs can be retried, idempotent.
- **Redis Caching**: Reduces read load on Firestore for popular queries.
- **Rate Limiting & API Keys**: Protects against abuse.
- **Health Checks & Monitoring**: `/health` endpoint and telemetry via structured logs.

## 6. Security

- **CORS**: Configurable whitelist of origins.
- **Input Validation**: Strict schema for query parameters; prevents injection.

## 7. CI/CD & Testing

- **Vitest** unit and integration tests coverage for services and middleware.
- **Tasks**: `yarn test`, `yarn check`, `yarn build` in CI pipeline.
- **Docker**: Containerized deployment using provided Dockerfile.

## 8. Observability

- **Structured Logging**: Centralized logs via `logger` utility.
- **Error Notifications**: Critical failures automatically trigger alerts through cloud-based monitoring services.
- **Metrics**: Tracks block processing latency and API performance. Statistics are regularly analyzed to identify trends, and slow queries or underperforming API endpoints are investigated for optimization.