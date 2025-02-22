# OpenElectricity TypeScript Client

![logo](https://platform.openelectricity.org.au/oe_logo_full.png)

> [!WARNING]
> This project and the v4 API are currently under active development.

A TypeScript client for the [OpenElectricity](https://openelectricity.org.au) API, providing access to electricity network data and metrics.

> [!NOTE]
> API key signups are currently waitlisted and will be released gradually.

To obtain an API key visit [platform.openelectricity.org.au](https://platfrom.openelectricity.org.au)

For documentation visit [docs.openelectricity.org.au](https://docs.openelectricity.org.au/introduction)

The alternative Python client is available at [github.com/openelectricity/openelectricity-python](https://github.com/openelectricity/openelectricity-python)

## Features

- Full TypeScript support with comprehensive type definitions
- Browser and Node.js compatible
- Built-in data analysis tools with DataTable interface
- Modern ESM and CommonJS module support
- Timezone-aware datetime utilities for handling network-specific times

## Installation

```bash
npm install openelectricity
# or
yarn add openelectricity
# or
bun add openelectricity
```

## Usage

### Basic Usage

Setup your API key in the environment variable `OPENELECTRICITY_API_KEY`.

```bash
export OPENELECTRICITY_API_KEY=<your-api-key>
```

```typescript
import { OpenElectricityClient } from "openelectricity"

// Initialize client
const client = new OpenElectricityClient({
  // apiKey will be read from OPENELECTRICITY_API_KEY environment variable
  // baseUrl defaults to https://api.openelectricity.org.au/v4
})

// Get per-interval energy data for each fueltech for each region (returns DataTable)
const { response, datatable } = await client.getNetworkData("NEM", ["energy"], {
  interval: "5m",
  dateStart: "2024-01-01T00:00:00",
  dateEnd: "2024-01-02T00:00:00",
  primaryGrouping: "network_region",
  secondaryGroupings: ['fueltech_group']
})

// Get hourly price and demand data for each network region (returns DataTable)
const { response, datatable } = await client.getMarket("NEM", ["price", "demand"], {
  interval: "1h",
  dateStart: "2024-01-01T00:00:00",
  dateEnd: "2024-01-02T00:00:00",
  primaryGrouping: "network_region"
})

// Get facility-specific data (returns DataTable)
const { response, datatable } = await client.getFacilityData("NEM", "BANGOWF", ["energy", "market_value"], {
  interval: "1d",
  dateStart: "2024-01-01T00:00:00",
  dateEnd: "2024-01-02T00:00:00"
})

// Get all facilities and their units (returns RecordTable)
const { response, table } = await client.getFacilities({
  status_id: ["operating"],
  fueltech_id: ["coal_black", "coal_brown"]
})
```

### Datetime Utilities

The client provides utilities for handling network-specific timezones and datetime operations:

```typescript
import {
  isAware,
  makeAware,
  stripTimezone,
  getLastCompleteInterval,
  getNetworkTimezone,
} from "openelectricity"

// Check if a date string has timezone information
isAware("2024-01-01T00:00:00+10:00") // true
isAware("2024-01-01T00:00:00") // false

// Add network timezone information to a date
makeAware("2024-01-01T00:00:00", "NEM") // "2024-01-01T00:00:00+10:00"
makeAware("2024-01-01T00:00:00", "WEM") // "2024-01-01T00:00:00+08:00"

// Remove timezone information from a date string
stripTimezone("2024-01-01T00:00:00+10:00") // "2024-01-01T00:00:00"

// Get the last complete 5-minute interval for a network
getLastCompleteInterval("NEM") // Returns the last complete 5-minute interval in AEST

// Get timezone offset for a network (in hours)
getNetworkTimezone("NEM") // Returns 10 (AEST/UTC+10)
getNetworkTimezone("WEM") // Returns 8 (AWST/UTC+8)
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

### Data Tables

The client provides two types of data tables for different use cases:

1. **DataTable** - For time series data (returned by `getNetworkData`, `getMarket`, and `getFacilityData`)
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

2. **RecordTable** - For record-style data like facilities (returned by `getFacilities`)
   ```typescript
   // Get all records
   const records = table.getRecords()

   // Filter records
   const coalUnits = table.filter(record => record.unit_fueltech?.includes("coal"))

   // Select specific columns
   const summary = table.select(["facility_name", "unit_code", "unit_capacity"])

   // Sort by capacity
   const largest = table.sortBy(["unit_capacity"], false)

   // Get unique values
   const regions = table.unique("facility_region")
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