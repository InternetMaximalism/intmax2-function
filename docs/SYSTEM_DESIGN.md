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
Client Request → API Service → Shared Components → Database/Cache → Response
```

#### Background Service Flow

```txt
Blockchain Events → Event Watcher → Data Processing → Database Update → Notifications
```

#### Cross-Service Communication

```txt
Service A → Shared Database/Cache → Service B
Service A → Direct API Call → Service B (where needed)
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

- **Purpose**: Manages token prices and token mappings
- **Endpoints**:
  - `/v1/token-prices/list` - Fetch token prices with filtering capabilities
  - `/v1/token-maps/list` - Fetch token mappings with filtering capabilities
- **Features**: Supports filtering by contract addresses, token indexes, and pagination
- **Dependencies**: External price feeds, database storage

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

- **Purpose**: Analyzes and processes deposit transactions on blockchain networks
- **Functions**:
  - Monitors deposit events from smart contracts
  - Batches deposits for efficient processing
  - Calculates gas optimization strategies
  - Manages deposit state transitions
- **Dependencies**: Blockchain RPC, PostgreSQL database

#### Messenger Relayer

- **Purpose**: Relays messages using Scroll API for cross-layer communication
- **Functions**:
  - Handles L1 to L2 and L2 to L1 message relaying
  - Manages message queue and retry logic
  - Processes withdrawal and claimable transactions
  - Integrates with Scroll Messenger contracts
- **Dependencies**: Scroll API, Ethereum/Scroll RPC providers

#### Block Sync Monitor

- **Purpose**: Monitors and validates block synchronization between validity prover and rollup contract
- **Functions**:
  - Tracks block synchronization status
  - Validates block consistency across layers
  - Alerts on synchronization issues
  - Maintains synchronization metrics
- **Dependencies**: Multiple RPC providers, monitoring systems

#### Indexer Event Watcher

- **Purpose**: Retrieves and processes information from blockchain nodes
- **Functions**:
  - Continuously monitors blockchain events
  - Filters and processes relevant events
  - Updates indexer state and metadata
  - Maintains event logs for audit trails
- **Dependencies**: Blockchain RPC providers, PostgreSQL

#### Wallet Observer

- **Purpose**: Monitors wallet balances and sends notifications
- **Functions**:
  - Tracks wallet balance changes
  - Sends notifications for significant changes
  - Maintains balance history
  - Supports multiple wallet types
- **Dependencies**: Blockchain RPC, notification services

#### Token Metadata Sync

- **Purpose**: Synchronizes token metadata across networks
- **Functions**:
  - Fetches token metadata from various sources
  - Synchronizes metadata across L1/L2
  - Validates metadata consistency
  - Updates token registries
- **Dependencies**: Multiple blockchain networks, IPFS

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

- **Purpose**: Monitors indexer service health and performance
- **Functions**:
  - Health checks for indexer services
  - Performance metrics collection
  - Alert generation for service issues
  - Service availability tracking

#### Indexer Cache Validator

- **Purpose**: Validates and maintains indexer cache integrity
- **Functions**:
  - Cache consistency validation
  - Cache refresh operations
  - Performance optimization
  - Cache health monitoring

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
5. Data Layer Access (PostgreSQL/Redis/External APIs)
6. Response Formatting & Caching
7. Client Response
```

### 4.2 Background Service Data Flow

```txt
1. Event Detection (Blockchain/Timer/Queue)
2. Event Processing & Validation
3. Business Logic Execution
4. Database Operations (CRUD)
5. Inter-Service Communication (if needed)
6. Status Updates & Logging
7. Notification/Alert Generation (if needed)
```

### 4.3 Cross-Service Communication

#### Database-Mediated Communication
- Services share data through PostgreSQL databases
- Event-driven updates through database triggers
- Shared caching layer using Redis

#### Direct API Communication
- Service-to-service HTTP calls for real-time data
- Health check propagation between dependent services
- Configuration synchronization

#### Message Queue Pattern
- Redis-based job queues for async processing
- Event broadcasting for status updates
- Background job scheduling and execution

### 4.4 Monitoring and Observability Flow

```txt
1. Service Metrics Collection → Structured Logging
2. Health Status Aggregation → Centralized Monitoring
3. Alert Generation → Notification Systems
4. Performance Analytics → Dashboard Updates
```

## 5. Data Storage and Persistence

### 5.1 Database Architecture

#### PostgreSQL Databases
- **Primary Database**: Core application data, user accounts, service configurations
- **Events Database**: Blockchain event logs, transaction histories, audit trails
- **Analytics Database**: Performance metrics, usage statistics, operational data

#### Redis Cache & Queues
- **Application Cache**: API response caching, session data, temporary computations
- **Job Queues**: Background task queues, message relay queues, cleanup jobs
- **Rate Limiting**: API rate limiting counters, abuse prevention

### 5.2 Data Models

#### Core Entities
- **Tokens**: Token metadata, pricing data, contract addresses
- **Transactions**: Deposit/withdrawal records, cross-layer messages
- **Users/Wallets**: Wallet addresses, balance histories, notification preferences
- **Indexer Data**: Block builder information, node metadata, registration status

#### Event Logs
- **Blockchain Events**: Contract events, transaction logs, block data
- **Service Events**: Internal service events, error logs, performance metrics
- **Audit Trails**: User actions, administrative operations, system changes

### 5.3 Data Synchronization

#### Cross-Layer Synchronization
- L1 ↔ L2 state synchronization via message relayers
- Token metadata consistency across networks
- Balance reconciliation and validation

#### Cache Invalidation
- TTL-based cache expiration
- Event-driven cache invalidation
- Manual cache refresh for critical data

## 6. Scalability & Reliability

### 6.1 Horizontal Scaling

- **Stateless API Services**: All API services (indexer, token, predicate, tx-map) can scale horizontally
- **Load Balancing**: Services support multiple instances behind load balancers
- **Database Sharding**: PostgreSQL databases can be sharded by service domain
- **Cache Distribution**: Redis clustering for distributed caching across instances

### 6.2 Reliability Patterns

- **Idempotent Operations**: All background services support safe operation retries
- **Circuit Breakers**: API services implement circuit breakers for external dependencies
- **Graceful Degradation**: Services continue operating with reduced functionality during outages
- **Database Replication**: Master-slave PostgreSQL setup for read scaling and failover

### 6.3 Performance Optimization

- **Intelligent Caching**: Multi-level caching with different TTL strategies per service
- **Connection Pooling**: Efficient database connection management
- **Background Processing**: Async processing for non-critical operations
- **Rate Limiting**: API rate limiting to prevent abuse and ensure fair usage

### 6.4 Health Monitoring

- **Health Endpoints**: All services expose standardized health check endpoints
- **Dependency Checks**: Health checks validate external service connectivity
- **Metrics Collection**: Structured logging and metrics for monitoring and alerting
- **Alert Systems**: Automated alerts for service failures and performance degradation

## 7. Security

### 7.1 API Security

- **Input Validation**: Strict validation for all API inputs and parameters
- **Rate Limiting**: Protection against DDoS and abuse attacks
- **CORS Configuration**: Proper cross-origin resource sharing controls
- **Security Headers**: Implementation of security headers (HSTS, CSP, etc.)

### 7.2 Blockchain Security

- **Contract Validation**: Smart contract interaction validation and verification
- **Transaction Security**: Secure transaction signing and submission processes
- **Event Verification**: Blockchain event authenticity verification
- **Private Key Management**: Secure storage and handling of cryptographic keys

### 7.3 Infrastructure Security

- **Database Access Control**: Role-based PostgreSQL access with minimal privileges
- **Environment Isolation**: Secure separation between development, staging, and production
- **Configuration Management**: Secure handling of sensitive configuration via environment variables
- **Network Security**: VPC isolation and secure inter-service communication

### 7.4 Data Protection

- **Data Encryption**: Encryption at rest for sensitive data
- **Audit Logging**: Comprehensive audit trails for all operations
- **Data Retention**: Policies for data lifecycle management and cleanup
- **Privacy Compliance**: GDPR and privacy regulation compliance measures

## 8. Development & Operations

### 8.1 Development Environment

- **Monorepo Structure**: Yarn workspaces for unified dependency management
- **Package Management**: Individual package configurations with shared dependencies
- **Development Servers**: Hot-reload development servers for each service
- **Mock Services**: L1/L2 relayer mocks for local development and testing

### 8.2 Testing Strategy

- **Unit Testing**: Vitest-based unit tests for individual service components
- **Integration Testing**: Service-to-service integration test suites
- **API Testing**: REST API endpoint testing with various scenarios
- **E2E Testing**: End-to-end workflow testing across multiple services

### 8.3 Build & Deployment

- **Build System**: TypeScript compilation with optimized production builds
- **Containerization**: Docker containers for consistent deployment environments
- **CI/CD Pipeline**: Automated testing, building, and deployment workflows
- **Environment Management**: Environment-specific configuration and secrets management

### 8.4 Database Management

- **Schema Migrations**: Version-controlled database schema migrations
- **Data Seeding**: Automated data seeding for development and testing
- **Backup & Recovery**: Automated database backup and recovery procedures
- **Performance Monitoring**: Database performance monitoring and optimization

## 9. Observability & Monitoring

### 9.1 Logging

- **Structured Logging**: JSON-formatted logs with consistent schema across all services
- **Log Aggregation**: Centralized log collection and analysis
- **Log Retention**: Configurable log retention policies by service and environment
- **Error Tracking**: Automatic error detection and alerting

### 9.2 Metrics & Analytics

- **Performance Metrics**: Service response times, throughput, and error rates
- **Business Metrics**: Transaction volumes, user activity, and service usage
- **Infrastructure Metrics**: System resource usage, database performance
- **Custom Dashboards**: Service-specific monitoring dashboards

### 9.3 Alerting

- **Health Monitoring**: Automated health checks with configurable thresholds
- **Performance Alerts**: Alerts for response time degradation and error spikes
- **Business Logic Alerts**: Domain-specific alerts for unusual patterns
- **Escalation Procedures**: Automated escalation for critical system failures

### 9.4 Debugging & Troubleshooting

- **Distributed Tracing**: Request tracing across multiple services
- **Debug Endpoints**: Development-only endpoints for service introspection
- **Log Correlation**: Request ID tracking across service boundaries
- **Performance Profiling**: Application performance profiling and optimization tools