# INTMAX2 Function Services API Documentation

## Overview

The INTMAX2 Function Services API provides RESTful endpoints for blockchain infrastructure services including indexer management, token information, anti-money laundering (AML) policy evaluation, and transaction mapping. All endpoints return JSON responses and support pagination where applicable.

## Base URL

```
Local: http://localhost:3000
```

## Services Overview

- **Indexer Service**: Provides block builder node information and proxy metadata
- **Token Service**: Manages token prices and token mappings for INTMAX2 network
- **Predicate Service**: Evaluates anti-money laundering (AML) policies
- **TX-Map Service**: Temporarily stores and retrieves transaction-related key-value mappings

## Example Usage

```bash
export ENDPOINT='http://localhost:3000'

# Indexer Service
curl "$ENDPOINT/v1/health" | jq
curl "$ENDPOINT/v1/indexer/builders" | jq
curl "$ENDPOINT/v1/indexer/builders/meta" | jq
curl "$ENDPOINT/v1/indexer/builders/registration/0x..." | jq
curl "$ENDPOINT/v1/proxy/meta" | jq

# Token Service
curl "$ENDPOINT/v1/health" | jq
curl "$ENDPOINT/v1/token-prices/list" | jq
curl "$ENDPOINT/v1/token-prices/list?contractAddresses=0x92d6c1e31e14520e676a687f0a93788b716beff5&perPage=2" | jq
curl "$ENDPOINT/v1/token-maps/list" | jq
curl "$ENDPOINT/v1/token-maps/list?tokenIndexes=1&tokenIndexes=2&perPage=2" | jq

# Predicate Service
curl "$ENDPOINT/v1/health" | jq
curl -X POST "$ENDPOINT/v1/predicate/evaluate-policy" \
  -H "Content-Type: application/json" \
  -d '{"policy": "sample_policy_data"}' | jq

# TX-Map Service
curl "$ENDPOINT/v1/health" | jq
curl -X POST "$ENDPOINT/v1/map" \
  -H "Content-Type: application/json" \
  -d '{"digest": "sampledigest123", "data": "sampledata456", "expiresIn": 300}' | jq
curl "$ENDPOINT/v1/map/sampledigest123" | jq
```

## Common Response Format

### Pagination

List endpoints support **cursor-based pagination**

#### Request Parameters

| Parameter | Type   | Required | Description                                                           |
| --------- | ------ | -------- | --------------------------------------------------------------------- |
| `perPage` | number | No       | Number of items per page (1–250). Defaults to **50** if not provided. |
| `cursor`  | string | No       | Cursor for pagination (for cursor-based endpoints).                   |
| `page`    | number | No       | Page number for standard pagination (for some endpoints).             |

#### Success Response

List responses typically follow this structure:

```json
{
  "items": [...],
  "totalCount": 1234,
  "hasMore": true,
  "nextCursor": "next_page_token"
}
```

**Response Fields**

| Field        | Type    | Description                                                      |
| ------------ | ------- | ---------------------------------------------------------------- |
| `items`      | array   | Array of returned data objects.                                  |
| `totalCount` | number  | Total number of items matching the query.                       |
| `hasMore`    | boolean | Indicates whether additional pages are available.               |
| `nextCursor` | string  | Cursor for fetching the next page (if cursor-based pagination). |

### Error Response

All error responses follow a consistent structure:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Validation Error",
  "errors": [
    {
      "message": "Invalid parameter value",
      "path": "parameterName"
    }
  ]
}
```

**Response Fields**

| Field     | Type        | Description                                                   |
| --------- | ----------- | ------------------------------------------------------------- |
| `code`    | string      | Machine-readable error code.                                  |
| `message` | string      | Human-readable error message.                                 |
| `errors`  | array\|null | Optional detailed validation errors with message and path.   |

## API Endpoints

### Health Check

#### GET /v1/health

Check API service health status.

**Response:**

```json
{
  "application": {
    "version": "1.0.0"
  },
  "status": "OK",
  "timestamp": "2025-08-19T10:00:00.000Z"
}
```

**Response Fields**

| Field         | Type   | Description                           |
| ------------- | ------ | ------------------------------------- |
| `application` | object | Application information               |
| `version`     | string | Current version of the service        |
| `status`      | string | Health status ("OK" when healthy)     |
| `timestamp`   | string | ISO 8601 timestamp of the health check |

## Indexer Service

### GET /v1/indexer/builders

List all active block builder nodes.

**Response:**

```json
[
  {
    "address": "0x1234567890123456789012345678901234567890",
    "url": "https://builder1.example.com",
  }
]
```

**Response Fields**

| Field           | Type   | Description                                    |
| --------------- | ------ | ---------------------------------------------- |
| `address`       | string | Block builder address (hex string)            |
| `url`           | string | Block builder endpoint URL                     |
| `status`        | string | Builder status (`active`, `inactive`)         |
| `lastHeartbeat` | string | ISO 8601 timestamp of last heartbeat          |
| `version`       | string | Block builder version                          |

### GET /v1/indexer/builders/meta

Get block builder metadata and configuration.

**Response:**

```json
{
  "total": 4
}
```

**Response Fields**

| Field             | Type   | Description                                    |
| ----------------- | ------ | ---------------------------------------------- |
| `totalBuilders`   | number | Total number of registered builders            |
| `activeBuilders`  | number | Number of currently active builders            |
| `networkInfo`     | object | Network configuration information              |
| `chainId`         | number | Blockchain network chain ID                    |
| `network`         | string | Network name                                   |
| `registryContract`| string | Block builder registry contract address       |

### GET /v1/indexer/builders/registration/{address}

Check registration status for a specific block builder address.

**Path Parameters:**
- `address`: Block builder address (hex string starting with 0x)

**Response:**

```json
{
    "ready": true,
    "registered": true
}
```

**Response Fields**

| Field                    | Type    | Description                                  |
| ------------------------ | ------- | -------------------------------------------- |
| `address`                | string  | Block builder address                        |
| `isRegistered`           | boolean | Whether the builder is registered            |
| `registrationTimestamp`  | string  | ISO 8601 timestamp of registration          |
| `status`                 | string  | Current registration status                  |

### GET /v1/proxy/meta

Get proxy metadata and configuration.

**Response:**

```json
{
    "domain": "proxy.builder.intmax.io",
    "maxFee": "2500000000000",
    "minVersion": "0.1.34",
    "token": "vAm8VaOgz3jzOT9aA18hxquLKhsQSccFoM3MXn",
    "version": "v0.1.34"
}
```

**Response Fields**

| Field               | Type   | Description                           |
| ------------------- | ------ | ------------------------------------- |
| `version`           | string | Proxy service version                 |
| `domain`            | string | Proxy domain configuration            |
| `supportedNetworks` | array  | List of supported blockchain networks |
| `endpoints`         | object | Available proxy endpoints             |

## Token Service

### GET /v1/token-prices/list

List token prices with optional filtering.

**Query Parameters:**
- `contractAddresses` (optional): Filter by contract addresses (can be multiple)
- `perPage` (optional): Items per page (1-250, default: 50)
- `cursor` (optional): Pagination cursor

**Examples:**
```bash
# Get all token prices
curl "$ENDPOINT/v1/token-prices/list" | jq

# Filter by specific contract addresses
curl "$ENDPOINT/v1/token-prices/list?contractAddresses=0x92d6c1e31e14520e676a687f0a93788b716beff5&contractAddresses=0x6e2a43be0b1d33b726f0ca3b8de60b3482b8b050&perPage=2" | jq
```

**Response:**

```json
{
  "items": [
    {
      "contractAddress": "0x92d6c1e31e14520e676a687f0a93788b716beff5",
      "decimals": 6,
      "id": "USDC",
      "image": "https://...",
      "price": ,
      "symbol": "USDC",
    }
  ],
  "totalCount": 100,
  "hasMore": true,
  "nextCursor": "next_token"
}
```

**Response Fields**

| Field             | Type   | Description                                    |
| ----------------- | ------ | ---------------------------------------------- |
| `contractAddress` | string | Token contract address (hex string)           |
| `tokenSymbol`     | string | Token symbol (e.g., USDC, ETH)                |
| `tokenName`       | string | Token full name                                |
| `decimals`        | number | Number of decimal places                       |
| `priceUsd`        | string | Token price in USD (string for precision)     |
| `priceEth`        | string | Token price in ETH (string for precision)     |
| `lastUpdated`     | string | ISO 8601 timestamp of last price update       |
| `volume24h`       | string | 24-hour trading volume in USD                 |
| `marketCap`       | string | Market capitalization in USD                  |

### GET /v1/token-maps/list

List token mappings with INTMAX2 tokenIndex associations.

**Query Parameters:**
- `tokenIndexes` (optional): Filter by token indexes (can be multiple)
- `perPage` (optional): Items per page (1-250, default: 50)
- `cursor` (optional): Pagination cursor

**Examples:**
```bash
# Get all token mappings
curl "$ENDPOINT/v1/token-maps/list" | jq

# Filter by specific token indexes
curl "$ENDPOINT/v1/token-maps/list?tokenIndexes=1&tokenIndexes=2&perPage=2" | jq
```

**Response:**

```json
{
  "items": [
    {
      "contractAddress": "0x92d6c1e31e14520e676a687f0a93788b716beff5",
      "decimals": 6,
      "image": "https://...",
      "price": ,
      "symbol": "USDC",
      "tokenIndex": 10,
      "tokenType": 2,
    }
  ],
  "totalCount": 50,
  "hasMore": true,
  "nextCursor": "next_token"
}
```

**Response Fields**

| Field             | Type    | Description                                    |
| ----------------- | ------- | ---------------------------------------------- |
| `tokenIndex`      | number  | INTMAX2 token index identifier                 |
| `contractAddress` | string  | Token contract address on origin network       |
| `tokenSymbol`     | string  | Token symbol                                   |
| `tokenName`       | string  | Token full name                                |
| `decimals`        | number  | Number of decimal places                       |
| `network`         | string  | Origin network (ethereum, scroll, etc.)       |
| `bridgedAt`       | string  | ISO 8601 timestamp when first bridged         |
| `totalBridged`    | string  | Total amount bridged to INTMAX2 network       |
| `isActive`        | boolean | Whether the token is currently active          |

## Predicate Service

### POST /v1/predicate/evaluate-policy

Evaluate anti-money laundering (AML) policies for transaction validation.

**Request Body:**

```json
{
  "policy": "sample_policy_data",
  "transactionData": {
    "from": "0x1234567890123456789012345678901234567890",
    "to": "0x9876543210987654321098765432109876543210",
    "amount": "1000000000000000000",
    "tokenAddress": "0x92d6c1e31e14520e676a687f0a93788b716beff5"
  }
}
```

**Request Fields**

| Field             | Type   | Description                          |
| ----------------- | ------ | ------------------------------------ |
| `policy`          | string | AML policy identifier or data        |
| `transactionData` | object | Transaction data to evaluate         |
| `from`            | string | Sender address                       |
| `to`              | string | Recipient address                    |
| `amount`          | string | Transaction amount in wei            |
| `tokenAddress`    | string | Token contract address (optional)    |

**Response:**

```json
{
  "policyResult": "approved",
  "riskScore": 0.15,
  "reasons": [
    "Low transaction amount",
    "Addresses not on watchlist"
  ],
  "requiresManualReview": false,
  "evaluatedAt": "2025-08-19T10:00:00.000Z"
}
```

**Response Fields**

| Field                  | Type     | Description                                         |
| ---------------------- | -------- | --------------------------------------------------- |
| `policyResult`         | string   | Evaluation result (`approved`, `rejected`, `review`) |
| `riskScore`            | number   | Risk score (0.0 - 1.0, lower is safer)             |
| `reasons`              | string[] | Array of evaluation reasons                         |
| `requiresManualReview` | boolean  | Whether manual review is required                   |
| `evaluatedAt`          | string   | ISO 8601 timestamp of evaluation                   |

## TX-Map Service

### POST /v1/map

Store a temporary key-value mapping with expiration.

**Request Body:**

```json
{
  "digest": "sampledigest123",
  "data": "sampledata456",
  "expiresIn": 300
}
```

**Request Fields**

| Field       | Type   | Description                              |
| ----------- | ------ | ---------------------------------------- |
| `digest`    | string | Unique key/digest for the mapping       |
| `data`      | string | Data to store                            |
| `expiresIn` | number | Expiration time in seconds (TTL)        |

**Response:**

```json
{
  "digest": "sampledigest123",
  "stored": true,
  "expiresAt": "2025-08-19T10:05:00.000Z"
}
```

**Response Fields**

| Field       | Type    | Description                                  |
| ----------- | ------- | -------------------------------------------- |
| `digest`    | string  | The stored key/digest                        |
| `stored`    | boolean | Whether the data was successfully stored     |
| `expiresAt` | string  | ISO 8601 timestamp when the data expires    |

### GET /v1/map/{digest}

Retrieve a stored mapping by its digest.

**Path Parameters:**
- `digest`: The key/digest used when storing the data

**Response:**

```json
{
  "digest": "sampledigest123",
  "data": "sampledata456",
  "expiresAt": "2025-08-19T10:05:00.000Z",
  "createdAt": "2025-08-19T10:00:00.000Z"
}
```

**Response Fields**

| Field       | Type   | Description                               |
| ----------- | ------ | ----------------------------------------- |
| `digest`    | string | The key/digest                            |
| `data`      | string | The stored data                           |
| `expiresAt` | string | ISO 8601 timestamp when data expires     |
| `createdAt` | string | ISO 8601 timestamp when data was created |

## Data Types

### Builder Status
- `active`: Builder is operational and responding to heartbeats
- `inactive`: Builder has not sent heartbeat within 24 hours or failed health checks

### Policy Results
- `approved`: Transaction passes all AML checks
- `rejected`: Transaction fails AML policy evaluation
- `review`: Transaction requires manual review

### Network Types
- `ethereum`: Ethereum mainnet
- `scroll`: Scroll L2 network

## Rate Limiting

The API enforces rate limiting to ensure fair usage. Rate limits may vary by:
- Endpoint type
- Service tier
- Authentication status

### Rate Limit Headers

Rate limit information is provided in response headers:

| Header              | Description                                      |
| ------------------- | ------------------------------------------------ |
| `X-RateLimit-Limit` | Maximum requests allowed in the time window     |
| `X-RateLimit-Remaining` | Remaining requests in the current window     |
| `X-RateLimit-Reset` | Time when the current window resets (Unix timestamp) |

## Error Codes

Common HTTP status codes:
- `200`: Success
- `400`: Bad Request (invalid parameters)
- `401`: Unauthorized (missing or invalid API key)
- `404`: Not Found (resource doesn't exist)
- `429`: Too Many Requests (rate limit exceeded)
- `500`: Internal Server Error
- `503`: Service Unavailable
