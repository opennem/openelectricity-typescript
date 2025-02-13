import OpenElectricityClient from '@openelectricity/client';
import { createConsoleTable, transformTimeSeriesTable } from '@openelectricity/client/datatable';

async function main() {
  const client = new OpenElectricityClient();

  try {
    // Get monthly market value for 2023 by fuel type
    const marketData = await client.getNetworkMarketValue('NEM', {
      interval: '1M',
      dateStart: '2023-01-01',
      dateEnd: '2024-01-01',
      primaryGrouping: 'network_region'  // Show market value by region
    });

    // Print the results
    console.log('Monthly Market Value Response:');
    console.log('-----------------------------');
    console.log('Version:', marketData.version);
    console.log('Success:', marketData.success);
    console.log('Time range:', marketData.data.start, 'to', marketData.data.end);
    console.log('Unit:', marketData.data.unit);

    // Transform data into tabular format
    const table = transformTimeSeriesTable(marketData.data);

    // Print the data as a table
    console.log('\nMonthly Market Value by Fuel Type ($):');
    console.table(createConsoleTable(table));

    // Calculate total market value for each fuel type
    const totals = table.columns.map(col => {
      const total = col.values.reduce((sum, val) => sum + (val || 0), 0);
      return `${col.name}: $${total.toLocaleString()}`;
    });

    console.log('\nTotal Market Value for 2023:');
    totals.forEach(total => console.log(total));

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