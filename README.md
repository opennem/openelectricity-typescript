# OpenElectricity Typescript Client

![logo](https://platform.openelectricity.org.au/oe_logo_full.png)

The [OpenElectricity](https://openelectricity.org.au) project (formerly OpenNEM) aims to make the wealth of public Australian energy data more accessible to a wider audience.

This is the OpenElectricity API Typescript/Javascript client.

To obtain an API key visit [platform.openelectricity.org.au](https://platfrom.openelectricity.org.au)

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
├── basic.ts         # Basic usage of network energy endpoints
```

To run an example:

```bash
# Set your API key
export OPENELECTRICITY_API_KEY=your-api-key

# Run an example with bun (recommended)
bun run examples/basic.ts

# Or with ts-node (for ESM support)
npx ts-node --esm --experimentalSpecifierResolution=node examples/basic.ts
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
