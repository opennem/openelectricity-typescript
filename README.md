# OpenElectricity Typescript Client

![logo](https://platform.openelectricity.org.au/oe_logo_full.png)

> [!WARNING]
> This project and the v4 API are currently under active development.

The [OpenElectricity](https://openelectricity.org.au) project (formerly OpenNEM) aims to make the wealth of public Australian energy data more accessible to a wider audience.

This is the OpenElectricity API Typescript/Javascript client.

> [!NOTE]
> API key signups are currently waitlisted and will be released gradually.

To obtain an API key visit [platform.openelectricity.org.au](https://platfrom.openelectricity.org.au)

For documentation visit [docs.openelectricity.org.au](https://docs.openelectricity.org.au/introduction)

## Installation

```bash
# Using npm
npm install @openelectricity/client

# Using yarn
yarn add @openelectricity/client

# Using bun
bun add @openelectricity/client
```

## Usage

### Basic Setup

```typescript
import OpenElectricityClient from '@openelectricity/client';

// Initialize the client
const client = new OpenElectricityClient({
  // Optional: Provide API key directly (recommended to use environment variable)
  apiKey: 'your-api-key',
  // Optional: Override API URL
  baseUrl: 'https://api.openelectricity.org.au/v4'
});

// Or use environment variables:
// OPENELECTRICITY_API_KEY=your-api-key
// OPENELECTRICITY_API_URL=https://api.openelectricity.org.au/v4
```

### Fetching Network Energy Data

```typescript
// Get energy data for the NEM network
const energyData = await client.getNetworkEnergy('NEM', {
  interval: '1h',                    // 5m, 1h, 1d, 7d, 1M, 3M, season, 1y, fy
  dateStart: '2024-01-01T00:00:00', // Start time (Network time)
  dateEnd: '2024-01-02T00:00:00',   // End time (Network time)
  primaryGrouping: 'network_region',  // 'network' or 'network_region'
  secondaryGrouping: 'fueltech'      // 'fueltech', 'fueltech_group', 'status', 'renewable'
});

// Access the results
console.log(energyData.data.results);
```

### Fetching Facility Energy Data

```typescript
// Get energy data for a specific facility
const facilityData = await client.getFacilityEnergy('NEM', 'FACILITY_CODE');
```

### Getting User Information

```typescript
// Get current user details
const user = await client.getCurrentUser();
console.log(user.roles); // ['user', 'pro', etc.]
```

### Error Handling

```typescript
try {
  const data = await client.getNetworkEnergy('NEM');
} catch (error) {
  console.error('API request failed:', error.message);
}
```

### Examples

The repository includes several example scripts in the `examples/` directory demonstrating common use cases:

```bash
examples/
├── auth.ts          # Authentication and user information
├── basic.ts         # Basic usage of network energy endpoints
└── analysis.ts      # Data analysis examples and alternatives
```

To run an example:

```bash
# Set your API key
export OPENELECTRICITY_API_KEY=your-api-key

# Run an example with bun (recommended)
bun run examples/basic.ts

# Or with ts-node (for ESM support)
npx ts-node examples/basic.ts
```

Each example is fully documented with comments explaining the code. You can use these as starting points for your own implementation.

### Development Mode

Set `NODE_ENV=development` to enable debug logging:

```typescript
// With NODE_ENV=development, you'll see detailed logs:
// [OpenElectricity] Making request { url: '...', method: 'GET', ... }
// [OpenElectricity] Request completed in 123ms { status: 200, ... }
```

## Development

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run src/index.ts
```

To run tests:

```bash
bun test
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## API Documentation

For full API documentation, visit [docs.openelectricity.org.au](https://docs.openelectricity.org.au)

## Data Analysis

The client includes basic utilities for analyzing time series data:

### Built-in Utilities

```typescript
// Using built-in utilities
const table = transformTimeSeriesTable(energyData.data);
const timeSeriesData = new TimeSeriesData(table);

// Calculate means
const means = timeSeriesData.mean();

// Filter by threshold
const peakPeriods = timeSeriesData.filter('coal_black', 20000, '>');

// Calculate rolling averages
const rollingAvg = timeSeriesData.rollingAverage(3);

// Sum multiple columns
const totalRenewables = timeSeriesData.sumColumns(['wind', 'solar_utility', 'hydro']);
```

### Alternative Analysis Tools

For more advanced analysis needs, here are some recommended libraries that work well with the OpenElectricity client:

#### Using Danfo.js

[Danfo.js](https://danfo.jsdata.org/) provides pandas-like data analysis tools:

```typescript
import { DataFrame } from "danfojs-node";

// Convert time series to DataFrame
const df = new DataFrame(createConsoleTable(table));

// Group by hour and calculate means
const hourlyMeans = df.groupby(['hour']).mean();

// Filter and sort
const peakPeriods = df
  .query(df['coal_black'].gt(20000))
  .sortValues('timestamp', { ascending: false });
```

#### Using Arquero

[Arquero](https://github.com/uwdata/arquero) provides a SQL-like interface for data manipulation:

```typescript
import * as aq from 'arquero';

// Convert time series to Arquero table
const aqTable = aq.from(createConsoleTable(table));

// Group by fuel type and calculate statistics
const summary = aqTable
  .groupby('fueltech')
  .rollup({
    avg: d => op.mean(d.value),
    max: d => op.max(d.value),
    min: d => op.min(d.value)
  });

// Filter and transform
const peakGeneration = aqTable
  .filter(d => d.coal_black > 20000)
  .select('timestamp', 'coal_black')
  .orderby(aq.desc('coal_black'));
```

Both libraries provide extensive data analysis capabilities and can be used depending on your specific needs:
- **Danfo.js**: Familiar pandas-like API, good for data scientists
- **Arquero**: SQL-like operations, good for database developers

See the [examples/analysis.ts](examples/analysis.ts) file for more examples using the built-in utilities.
