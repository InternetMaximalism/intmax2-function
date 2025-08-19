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

#### Request Common Parameters

| Parameter | Type   | Required | Description                                                           |
| --------- | ------ | -------- | --------------------------------------------------------------------- |
| `pageSize` | number | No       | Number of items per page (1–250). Defaults to **100** if not provided. |
| `cursor`  | string | No       | Cursor for pagination (for cursor-based endpoints).                   |

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

| Field     | Type   | Description                        |
| --------- | ------ | ---------------------------------- |
| `address` | string | Block builder address (hex string) |
| `url`     | string | Block builder endpoint URL         |


### GET /v1/indexer/builders/meta

Get block builder metadata and configuration.

**Response:**

```json
{
  "total": 4
}
```

**Response Fields**

| Field   | Type   | Description                               |
| ------- | ------ | ----------------------------------------- |
| `total` | number | Total number of registered block builders |

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

| Field        | Type    | Description                       |
| ------------ | ------- | --------------------------------- |
| `ready`      | boolean | Whether the builder is ready      |
| `registered` | boolean | Whether the builder is registered |

### GET /v1/proxy/meta

Get proxy metadata and configuration.

**Response:**

```json
{
    "targetNetwork": "mainnet",
    "domain": "proxy.builder.intmax.io",
    "maxFee": "2500000000000",
    "minVersion": "0.1.34",
    "token": "vAm8VaOgz3jzOT9aA18hxquLKhsQSccFoM3MXn",
    "version": "v0.1.34"
}
```

**Response Fields**

| Field           | Type   | Description                               |
| --------------- | ------ | ----------------------------------------- |
| `targetNetwork` | string | Target blockchain network (e.g., mainnet) |
| `domain`        | string | Proxy domain configuration                |
| `maxFee`        | string | Maximum fee amount allowed (wei)          |
| `minVersion`    | string | Minimum supported client version          |
| `token`         | string | Authentication token for proxy access     |
| `version`       | string | Proxy service version                     |

## Token Service

### GET /v1/token-prices/list

List token prices with optional filtering.

**Query Parameters:**
- `contractAddresses` (optional): Filter by contract addresses (can be multiple)
- `pageSize` (optional): Items per page (1-250, default: 100)
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
      "image": "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png",
      "price": "1.000000",
      "symbol": "USDC"
    },
    {
      "contractAddress": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      "decimals": 6,
      "id": "USDT",
      "image": "https://assets.coingecko.com/coins/images/325/large/Tether-logo.png",
      "price": "0.999800",
      "symbol": "USDT"
    }
  ],
  "totalCount": 100,
  "hasMore": true,
  "nextCursor": "next_token"
}
```

**Response Fields**

| Field             | Type    | Description                                   |
| ----------------- | ------- | --------------------------------------------- |
| `contractAddress` | string  | Token contract address (hex string)           |
| `decimals`        | number  | Number of decimal places                      |
| `id`              | string  | Token identifier (e.g., USDC, USDT)           |
| `image`           | string  | URL of the token logo image                   |
| `price`           | string  | Token price in USD (string for precision)     |
| `symbol`          | string  | Token symbol (short ticker, e.g., USDC, USDT) |

### GET /v1/token-maps/list

List token mappings with INTMAX2 tokenIndex associations.

**Query Parameters:**
- `tokenIndexes` (optional): Filter by token indexes (can be multiple)
- `perPage` (optional): Items per page (1-250, default: 100)
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
      "image": "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png",
      "price": "1.000000",
      "symbol": "USDC",
      "tokenIndex": 10,
      "tokenType": 2
    },
    {
      "contractAddress": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      "decimals": 6,
      "image": "https://assets.coingecko.com/coins/images/325/large/Tether-logo.png",
      "price": "0.999800",
      "symbol": "USDT",
      "tokenIndex": 11,
      "tokenType": 2
    }
  ],
  "totalCount": 50,
  "hasMore": true,
  "nextCursor": "next_token"
}
```

**Response Fields**

| Field             | Type    | Description                                         |
| ----------------- | ------- | --------------------------------------------------- |
| `contractAddress` | string  | Token contract address (hex string)                 |
| `decimals`        | number  | Number of decimal places                            |
| `image`           | string  | URL of the token logo image                         |
| `price`           | string  | Token price in USD (string for precision)           |
| `symbol`          | string  | Token symbol (e.g., USDC, USDT)                     |
| `tokenIndex`      | number  | INTMAX2 token index identifier                      |
| `tokenType`       | number  | Token type identifier (e.g., 1 = native, 2 = ERC20) |

## Predicate Service

### POST /v1/predicate/evaluate-policy

Evaluate anti-money laundering (AML) policies for transaction validation.

**Request Body:**

```json
{
  "from": "0x1234567890123456789012345678901234567890",
  "to": "0x9876543210987654321098765432109876543210",
  "data": "0xa9059cbb00000000000000000000000092d6c1e31e14520e676a687f0a93788b716beff50000000000000000000000000000000000000000000000000de0b6b3a7640000",
  "msg_value": "0"
}
```

**Request Fields**

| Field       | Type   | Description                                                             |
| ----------- | ------ | ----------------------------------------------------------------------- |
| `from`      | string | Sender address (hex string)                                             |
| `to`        | string | Recipient address (hex string)                                          |
| `data`      | string | Encoded transaction calldata (e.g., ERC20 transfer function call)       |
| `msg_value` | string | Transaction value in wei (for native currency transfers, usually `"0"`) |

**Response:**

```json
{
  "is_compliant": true,
  "task_id": "task_1234567890abcdef",
  "expiry_block": 19500000,
  "signers": [
    "0x1234567890abcdef1234567890abcdef12345678",
    "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
  ],
  "signature": [
    "0xa1b2c3d4e5f600112233445566778899aabbccddeeff00112233445566778899",
    "0xb1c2d3e4f5a600112233445566778899aabbccddeeff001122334455667788aa"
  ]
}
```

**Response Fields**

| Field          | Type      | Description                                                   |
| -------------- | --------- | ------------------------------------------------------------- |
| `is_compliant` | boolean   | Whether the transaction complies with the policy              |
| `task_id`      | string    | Unique identifier of the evaluation/signing task              |
| `expiry_block` | number    | Block height until which the result/signature remains valid   |
| `signers`      | string[] | Addresses of signers who approved/signed the predicate        |
| `signature`    | string[] | Signatures (hex strings) corresponding to the `signers` array |

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
  "digest": "sampledigest123"
}
```

**Response Fields**

| Field       | Type    | Description                                  |
| ----------- | ------- | -------------------------------------------- |
| `digest`    | string  | The stored key/digest                        |

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
}
```

**Response Fields**

| Field       | Type   | Description                               |
| ----------- | ------ | ----------------------------------------- |
| `digest`    | string | The key/digest                            |
| `data`      | string | The stored data                           |
| `expiresAt` | string | ISO 8601 timestamp when data expires     |

## Data Types

### Builder Flags

- ready: Builder is active as an indexer and fully prepared to operate
- registered: Builder is registered on-chain in the registry contract

### Network Types
- `ethereum`: Ethereum mainnet
- `scroll`: Scroll L2 network

## Rate Limiting

The API enforces rate limiting to ensure fair usage.
Rate limits may vary depending on:

- Endpoint type
- Authentication status
- API key tier

### Rate Limit Header

Rate limit information is provided in a **single `ratelimit` header** with three key-value pairs:

| Field       | Type   | Description                                                                 |
| ----------- | ------ | --------------------------------------------------------------------------- |
| `limit`     | number | Maximum number of requests allowed in the current time window.              |
| `remaining` | number | Number of requests still available in the current window.                   |
| `reset`     | number | Time (in seconds) until the current rate limit window resets.               |

## Error Codes

**Common HTTP status codes:**
- `200`: Success
- `400`: Bad Request (invalid parameters)
- `404`: Not Found (resource doesn't exist)
- `429`: Too Many Requests (rate limit exceeded)
- `500`: Internal Server Error

**ErrorCode values:**
* `BAD_REQUEST`: Bad Request (invalid parameters) — HTTP 400
* `NOT_FOUND`: Not Found (resource doesn't exist) — HTTP 404
* `INTERNAL_SERVER_ERROR`: Internal Server Error — HTTP 500
* `VALIDATION_ERROR`: Validation Error (schema/business rule failed) — HTTP 400
