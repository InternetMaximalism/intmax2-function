# indexer

The indexer returns a list of node URLs.

## Usage

To set up the development environment:

```bash
# install
yarn

# dev
yarn workspace indexer dev

# build
yarn build
```

## API Usage

```sh
# health check
curl http://localhost:3000/v1/health | jq

# fetch Indexer
curl -X GET 'http://localhost:3000/v1/indexer/builders' | jq
curl -X GET 'http://localhost:3000/v1/indexer/builders/meta' | jq
curl -X GET 'http://localhost:3000/v1/indexer/builders/registration/0x...' | jq

# for proxy
curl -X GET 'http://localhost:3000/v1/proxy/meta' | jq

# time
curl -X GET 'http://localhost:3000/v1/time' | jq
```
