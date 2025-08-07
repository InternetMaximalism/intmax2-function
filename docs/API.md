# API

Here are example commands for accessing the INTMAX2 Function APIs using curl.
These services provide various functionalities including indexer services, token management, predicate evaluation, and transaction mapping.

## Services Overview

- **Indexer**: Provides block builder node information and proxy metadata
- **Token**: Manages token prices and token mappings
- **Predicate**: Evaluates anti-money laundering (AML) policies
- **TX-Map**: Temporarily stores and retrieves transaction-related key-value mappings

## API Usage

### Indexer Service

```sh
export INDEXER_ENDPOINT='http://localhost:3000'

# health check
curl "$INDEXER_ENDPOINT/v1/health" | jq

# fetch block builder nodes
curl "$INDEXER_ENDPOINT/v1/indexer/builders" | jq

# fetch block builder metadata
curl "$INDEXER_ENDPOINT/v1/indexer/builders/meta" | jq

# check indexer registration for specific address
curl "$INDEXER_ENDPOINT/v1/indexer/builders/registration/0x..." | jq

# fetch proxy metadata
curl "$INDEXER_ENDPOINT/v1/proxy/meta" | jq
```

### Token Service

```sh
export TOKEN_ENDPOINT='http://localhost:3000'

# health check
curl "$TOKEN_ENDPOINT/v1/health" | jq

# fetch token prices
curl "$TOKEN_ENDPOINT/v1/token-prices/list" | jq

# fetch token prices with filters
curl "$TOKEN_ENDPOINT/v1/token-prices/list?contractAddresses=0x92d6c1e31e14520e676a687f0a93788b716beff5&contractAddresses=0x6e2a43be0b1d33b726f0ca3b8de60b3482b8b050&perPage=2" | jq

# fetch token maps
curl "$TOKEN_ENDPOINT/v1/token-maps/list" | jq

# fetch token maps with filters
curl "$TOKEN_ENDPOINT/v1/token-maps/list?tokenIndexes=1&tokenIndexes=2&perPage=2" | jq
```

### Predicate Service

```sh
export PREDICATE_ENDPOINT='http://localhost:3000'

# health check
curl "$PREDICATE_ENDPOINT/v1/health" | jq

# evaluate policy (AML)
curl -X POST "$PREDICATE_ENDPOINT/v1/predicate/evaluate-policy" \
  -H "Content-Type: application/json" \
  -d '{
    "policy": "sample_policy_data"
  }' | jq
```

### TX-Map Service

```sh
export TX_MAP_ENDPOINT='http://localhost:3000'

# health check
curl "$TX_MAP_ENDPOINT/v1/health" | jq

# store a mapping
curl -X POST "$TX_MAP_ENDPOINT/v1/map" \
  -H "Content-Type: application/json" \
  -d '{
    "digest": "sampledigest123",
    "data": "sampledata456",
    "expiresIn": 300
  }' | jq

# retrieve a mapping
curl "$TX_MAP_ENDPOINT/v1/map/sampledigest123" | jq
```
