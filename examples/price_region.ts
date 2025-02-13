import OpenElectricityClient from '@openelectricity/client';
import { createConsoleTable, transformTimeSeriesTable } from '@openelectricity/client/datatable';

async function main() {
  // Initialize client
  const client = new OpenElectricityClient();

  try {
    // Get price data for the NEM network during a volatile period in 2020
    const priceData = await client.getNetworkPrice('NEM', {
      interval: '1h',
      dateStart: '2020-07-15T00:00:00', // Winter 2020 - typically has some price volatility
      dateEnd: '2020-07-18T00:00:00',   // 3 day period
      primaryGrouping: 'network_region'  // Show prices by region
    });

    // Print the results
    console.log('Price Data Response:');
    console.log('-------------------');
    console.log('Version:', priceData.version);
    console.log('Success:', priceData.success);
    console.log('Number of regions:', priceData.data.results.length);
    console.log('Time range:', priceData.data.start, 'to', priceData.data.end);
    console.log('Unit:', priceData.data.unit);

    // Transform data into tabular format
    const table = transformTimeSeriesTable(priceData.data);

    // Print summary of regions
    console.log('\nRegions:');
    table.columns.forEach(col => {
      console.log(`- ${col.name}: ${Object.entries(col.labels).map(([k, v]) => `${k}=${v}`).join(', ')}`);
    });

    // Print the data as a table
    console.log('\nRegional Electricity Prices ($/MWh):');
    console.table(createConsoleTable(table));

    // Calculate some statistics
    const maxPrices = table.columns.map(col => {
      const maxPrice = Math.max(...col.values.filter(v => v !== null) as number[]);
      return `${col.name}: $${maxPrice.toFixed(2)}/MWh`;
    });

    console.log('\nMaximum Prices:');
    maxPrices.forEach(price => console.log(price));

  } catch (error) {
    if (error instanceof Error) {
      console.error('API Error:', error.message);
    } else {
      console.error('Unknown error occurred');
    }
    process.exit(1);
  }
}

main();