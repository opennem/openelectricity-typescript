# OpenElectricity TypeScript Client

![logo](https://platform.openelectricity.org.au/oe_logo_full.png)

> [!WARNING]
> This project and the v4 API are currently under active development.

A TypeScript client for the [OpenElectricity](https://openelectricity.org.au) API, providing access to electricity network data and metrics.

## Features

- Full TypeScript support with comprehensive type definitions
- Browser and Node.js compatible
- Built-in data analysis tools with DataTable interface
- Modern ESM and CommonJS module support

This is the OpenElectricity API Typescript/Javascript client.

> [!NOTE]
> API key signups are currently waitlisted and will be released gradually.

To obtain an API key visit [platform.openelectricity.org.au](https://platfrom.openelectricity.org.au)

For documentation visit [docs.openelectricity.org.au](https://docs.openelectricity.org.au/introduction)

## Features

- Full TypeScript support with comprehensive type definitions
- Browser and Node.js compatible
- Built-in data analysis tools with DataTable interface
- Modern ESM and CommonJS module support

## Installation

```bash
npm install @openelectricity/client
# or
yarn add @openelectricity/client
# or
bun add @openelectricity/client
```

## Quick Start

```typescript
import { OpenElectricityClient } from '@openelectricity/client';

// Initialize client
const client = new OpenElectricityClient({
  apiKey: process.env.OPENELECTRICITY_API_KEY
});

// Fetch power data
const { datatable } = await client.getNetworkPower('NEM', {
  interval: '5m',
  primaryGrouping: 'network_region',
  secondaryGrouping: 'fueltech'
});

// Use DataTable features to analyze the data
const byRegion = datatable
  .groupBy(['network_region'], 'sum')
  .sortBy(['power'], false);

console.table(byRegion.toConsole());
```

## DataTable Interface

The client includes a powerful DataTable interface for analyzing time series data. Here's an example analyzing power generation:

```typescript
// Get latest power data
const { datatable } = await client.getNetworkPower('NEM', {
  interval: '5m',
  primaryGrouping: 'network_region',
  secondaryGrouping: 'fueltech'
});

// Filter to latest timestamp
const latestTime = Math.max(...datatable.getRows().map(r => r.interval.getTime()));
const latest = datatable.filter(row => row.interval.getTime() === latestTime);

// Group by region
const byRegion = latest
  .groupBy(['network_region'], 'sum')
  .sortBy(['power']);

// Calculate renewable percentage
const renewableFueltechs = ['solar', 'wind', 'hydro', 'battery'];
const currentGen = latest.getRows();
const renewable = currentGen
  .filter(row => renewableFueltechs.includes(row.fueltech))
  .reduce((sum, row) => sum + row.power, 0);
const total = currentGen.reduce((sum, row) => sum + row.power, 0);
const renewablePercentage = (renewable / total) * 100;

// Get summary statistics
const stats = datatable.describe();
```

## Development

This project uses a Makefile for common development tasks:

```bash
# Install dependencies
make install

# Run tests
make test
make test-watch

# Lint and format code
make lint
make format
make format-check

# Build the package
make build
```

## Running Examples

The `examples/` directory contains several example scripts demonstrating common use cases. You can run these examples using either Bun or ts-node:

```bash
# Using Bun (recommended)
bun run examples/power_latest.ts

# Using ts-node
npx ts-node --esm examples/power_latest.ts
```

Available examples:
- `power_latest.ts`: Analyze current power generation by region and fuel type
- `energy_renewable_daily.ts`: Calculate daily renewable energy percentages
- `demand_latest.ts`: Track current electricity demand

Before running examples, make sure to set your API key:
```bash
export OPENELECTRICITY_API_KEY=your-api-key
```

## Configuration

The client can be configured with the following environment variables:

- `OPENELECTRICITY_API_KEY`: Your API key (required)
- `OPENELECTRICITY_API_URL`: Override the API endpoint (optional)

## License

MIT
