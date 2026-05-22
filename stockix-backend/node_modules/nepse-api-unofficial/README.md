# NEPSE Unofficial API

[![npm version](https://img.shields.io/npm/v/nepse-api-unofficial.svg)](https://www.npmjs.com/package/nepse-api-unofficial)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/nepse-api-unofficial.svg)](https://nodejs.org)

A client for fetching data from Nepal Stock Exchange (NEPSE). This is an **unofficial** API client built with **Bun** in mind, featuring an **auto-scaling worker pool** for high-performance concurrent requests.

> **Note:** This project utilizes Bun workers. If you want to use this in Node.js, a PR is more than welcome!

## ⚠️ Disclaimer

This is an **unofficial** API client. It is not affiliated with, endorsed by, or connected to the Nepal Stock Exchange (NEPSE) in any way. Use at your own risk. The API endpoints may change without notice.

## Features

- 🚀 **Auto-scaling worker pool** - Dynamically scales workers based on load
- 📊 **Full TypeScript support** with comprehensive type definitions
- � **Zod schemas** for runtime type validation
- 📈 **Market Data**: Live market status, summary, supply/demand
- 🏢 **Companies**: List all companies, detailed security information
- 📉 **Stock Data**: Intraday charts, historical prices, market depth
- 🏆 **Top Lists**: Top gainers, losers, trade scrips, transactions, turnover
- 📰 **Disclosures**: Recent company disclosures
- ⚡ **High Performance** - Worker pool handles concurrent requests efficiently
- 🔄 **Automatic retries** - Built-in retry logic for failed requests

## Installation

```bash
bun add nepse-api-unofficial
```

```bash
npm install nepse-api-unofficial
```

```bash
yarn add nepse-api-unofficial
```

```bash
pnpm add nepse-api-unofficial
```

## Requirements

- [Bun](https://bun.sh) runtime (Tested with v1.3.5)
- Node.js support is experimental/community-driven (PRs welcome)
- ESM module support

## Quick Start

```typescript
import {
  get_market_status,
  getSummary,
  getTopGainers,
  getWorkerPoolStats,
  shutdownWorkerPool,
} from 'nepse-api-unofficial';

// Get market status
const status = await get_market_status();
console.log('Market is:', status?.isOpen);

// Get market summary
const summary = await getSummary();
console.log('Total Turnover:', summary?.['Total Turnover Rs:']);

// Get top gainers
const gainers = await getTopGainers();
console.log('Top Gainer:', gainers?.[0]?.symbol);

// Check worker pool statistics
const stats = getWorkerPoolStats();
console.log('Active workers:', stats?.totalWorkers);

// Graceful shutdown when done
await shutdownWorkerPool();
```

## API Reference

### Worker Pool Management

| Function | Description |
|----------|-------------|
| `getWorkerPool()` | Get the worker pool instance |
| `getWorkerPoolStats()` | Get current worker pool statistics |
| `shutdownWorkerPool()` | Gracefully shutdown all workers |

### Market Data

| Function | Description | Return Type |
|----------|-------------|-------------|
| `get_market_status()` | Get current market open/close status | `Promise<MarketStatus \| null>` |
| `getSummary()` | Get today's market summary | `Promise<Summary \| null>` |
| `getPriceVolume()` | Get price/volume for all securities | `Promise<PriceVolume \| null>` |
| `getSupplyDemand()` | Get supply and demand data | `Promise<SupplyDemandData \| null>` |
| `liveMarketData()` | Get live market data for all securities | `Promise<LiveMarket \| null>` |

### Top Lists

| Function | Description | Return Type |
|----------|-------------|-------------|
| `getTopGainers()` | Get top gaining stocks | `Promise<TopGainerLoosers \| null>` |
| `getTopLoosers()` | Get top losing stocks | `Promise<TopGainerLoosers \| null>` |
| `getTopTenTradeScrips()` | Get top traded by volume | `Promise<TopTradeScrips \| null>` |
| `getTopTenTransactions()` | Get top by transaction count | `Promise<TopTransaction \| null>` |
| `getTopTenTurnover()` | Get top by turnover | `Promise<TopTurnover \| null>` |

### Index Data

| Function | Description | Return Type |
|----------|-------------|-------------|
| `getNepseIndex()` | Get all NEPSE indices | `Promise<NepseIndex \| null>` |
| `getNepseIndexIntraday(index)` | Get intraday data for an index | `Promise<IndexIntradayData \| null>` |
| `getIndexPriceVolumeHistory(index, size)` | Get historical data for an index | `Promise<IndexHistoricalDataArray \| null>` |

### Securities & Companies

| Function | Description | Return Type |
|----------|-------------|-------------|
| `getSecurityList()` | Get list of all securities | `Promise<SecurityList \| null>` |
| `getCompaniesList()` | Get list of all companies | `Promise<CompanyList \| null>` |
| `get_security_detail(symbol)` | Get detailed security info | `Promise<SecurityDetailResponse \| null>` |

### Stock Data

| Function | Description | Return Type |
|----------|-------------|-------------|
| `stockIntraday(symbol)` | Get intraday chart data | `Promise<SecurityDailyChart \| null>` |
| `getStockDailyPrice(symbol)` | Get daily price data | `Promise<StockDailyPriceArray \| null>` |
| `getPriceVolumeHistory(symbol, size)` | Get historical price/volume | `Promise<PriceVolumeHistory \| null>` |
| `getMarket_depth(symbol)` | Get market depth | `Promise<MarketDepthResponse \| null>` |

### Disclosures

| Function | Description | Return Type |
|----------|-------------|-------------|
| `disclosure()` | Get recent company disclosures | `Promise<DisclosureResponse \| null>` |

## Worker Pool Configuration

The worker pool automatically manages workers with the following defaults:

| Option | Default | Description |
|--------|---------|-------------|
| `minWorkers` | 1 | Minimum number of workers to maintain |
| `maxWorkers` | 10 | Maximum number of workers |
| `idleTimeout` | 30,000ms | Time before idle workers are terminated |
| `taskTimeout` | 60,000ms | Timeout for individual tasks |
| `maxRetries` | 3 | Number of retries for failed tasks |
| `scalingThreshold` | 0.8 | Scale up when 80% of workers are busy |

For advanced configuration, you can create a custom worker pool:

```typescript
import { WorkerPool } from 'nepse-api-unofficial';

const pool = new WorkerPool({
  minWorkers: 2,
  maxWorkers: 20,
  idleTimeout: 60_000,
  taskTimeout: 30_000,
  maxRetries: 5,
  scalingThreshold: 0.6,
  logger: {
    log: (msg) => console.log(msg),
    warn: (msg) => console.warn(msg),
    error: (msg, err) => console.error(msg, err),
  },
});
```

## Examples

### High-Concurrency Usage

```typescript
import {
  get_market_status,
  getSummary,
  getTopGainers,
  getTopLoosers,
  getNepseIndex,
  getWorkerPoolStats,
  shutdownWorkerPool,
} from 'nepse-api-unofficial';

// Fire multiple requests concurrently
const [status, summary, gainers, losers, indices] = await Promise.all([
  get_market_status(),
  getSummary(),
  getTopGainers(),
  getTopLoosers(),
  getNepseIndex(),
]);

console.log('Market:', status?.isOpen);
console.log('Summary:', summary);
console.log('Top Gainer:', gainers?.[0]);
console.log('Top Loser:', losers?.[0]);
console.log('NEPSE Index:', indices?.['NEPSE Index']);

// Check how the worker pool handled the load
console.log('Pool Stats:', getWorkerPoolStats());

// Always shutdown gracefully
await shutdownWorkerPool();
```

### Get Stock Information

```typescript
import { get_security_detail, getMarket_depth } from 'nepse-api-unofficial';

// Get detailed information about NABIL bank
const nabil = await get_security_detail('NABIL');
console.log({
  symbol: nabil?.security.symbol,
  name: nabil?.security.securityName,
  ltp: nabil?.securityDailyTradeDto?.lastTradedPrice,
});

// Get market depth
const depth = await getMarket_depth('NABIL');
console.log('Buy orders:', depth?.totalBuyQty);
console.log('Sell orders:', depth?.totalSellQty);
```

## TypeScript

This package is written in TypeScript and provides full type definitions:

```typescript
import type {
  MarketStatus,
  Summary,
  SecurityDetailResponse,
  TopGainerLoosers,
  IndexKey,
  WorkerPoolOptions,
  // ... and many more
} from 'nepse-api-unofficial';
```

### Zod Schemas

The package exports Zod schemas for runtime validation:

```typescript
import {
  StockDailyPriceSchema,
  marketDepthResponse,
  SupplyDemandSchema,
} from 'nepse-api-unofficial';

// Validate data at runtime
const validated = StockDailyPriceSchema.parse(data);
```

## Error Handling

All methods return `null` on failure instead of throwing exceptions:

```typescript
const status = await get_market_status();
if (!status) {
  console.log('Failed to fetch market status');
  return;
}

// Safe to use status here
console.log('Market:', status.isOpen);
```

## SSL/TLS Note

NEPSE's API server sometimes has SSL certificate issues. This library temporarily disables SSL verification for API calls. While this is necessary for the API to work, be aware of this security consideration.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Type check
npm run typecheck

# Lint
npm run lint
```

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Suraj Rimal** - [GitHub](https://github.com/surajrimal07)

## Acknowledgments

- Nepal Stock Exchange for providing the data
- The open-source community for inspiration

---

**⭐ Star this repo if you find it useful!**
