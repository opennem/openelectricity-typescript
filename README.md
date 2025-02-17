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

## Usage

### Basic Usage

```typescript
import { OpenElectricityClient } from "@openelectricity/client"

// Initialize client
const client = new OpenElectricityClient({
  // apiKey will be read from OPENELECTRICITY_API_KEY environment variable
  // baseUrl defaults to https://api.openelectricity.org.au/v4
})

// Get per-interval energy data for each fueltech for each region
const { response, datatable } = await client.getNetworkData("NEM", ["energy"], {
  interval: "5m",
  dateStart: "2024-01-01T00:00:00",
  dateEnd: "2024-01-02T00:00:00",
  primaryGrouping: "network_region",
  secondaryGroupings: ['fueltech_group']
})

// Get hourly price and demand data for each network region
const { response, datatable } = await client.getMarket("NEM", ["price", "demand"], {
  interval: "1h",
  dateStart: "2024-01-01T00:00:00",
  dateEnd: "2024-01-02T00:00:00",
  primaryGrouping: "network_region"
})

// Get facility-specific data
const { response, datatable } = await client.getFacilityData("NEM", "BANGOWF", ["energy", "market_value"], {
  interval: "1d",
  dateStart: "2024-01-01T00:00:00",
  dateEnd: "2024-01-02T00:00:00"
})
```

### Available Metrics

The client supports three types of data:

1. Network Data (`getNetworkData`):
   - `power`: Instantaneous power output (MW)
   - `energy`: Energy generated (MWh)
   - `emissions`: CO2 equivalent emissions (tCO2e)
   - `market_value`: Market value ($)

2. Market Data (`getMarket`):
   - `price`: Spot price ($/MWh)
   - `demand`: Demand (MW)
   - `demand_energy`: Energy demand (MWh)

3. Facility Data (`getFacilityData`):
   - Supports the same metrics as Network Data
   - Data is specific to a single facility

### Available Groupings

Queries for network data and market data support groupings. These groupings are all returned as columns in the data table.

 1. Primary grouping (`primaryGrouping`)
    - `network` - Group by network (default)
    - `network_region` - Group by network region

Further, `getNetworkData` supports secondary groupings:

  1. Secondary groupings (`secondaryGroupings`)
    - `fueltech` - All the core fueltechs
    - `fueltech_group` - Simplified list of fueltechs
    - `renewable` - Group by renewable

### Using the DataTable

The client returns both the raw API response and a DataTable object that provides a pandas-like interface for data analysis:

```typescript
// Filter rows
const filtered = datatable.filter(row => row.network_region === "NSW1")

// Group by columns
const grouped = datatable.groupBy(["network_region"], "sum")

// Sort by values
const sorted = datatable.sortBy(["energy"], false)

// Get summary statistics
const stats = datatable.describe()
```

### Examples

Check out the `examples` directory for more detailed examples:

- `basic.ts`: Simple data fetching
- `analysis.ts`: Data analysis features
- `energy_renewable_daily.ts`: Renewable energy analysis
- `power_latest.ts`: Recent power generation analysis
- `emission_factor.ts`: Emission factor calculations
- `facility_data.ts`: Example querying a facility

## Development

```bash
# Install dependencies
bun install

# Run tests
bun test

# Build
bun run build

# Lint
bun run lint
```

## License

MIT