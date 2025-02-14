/**
 * Example showing how to fetch daily energy data grouped by renewable sources
 * This example demonstrates:
 * - Setting up the client
 * - Fetching energy data for a specific month
 * - Grouping data by renewable/non-renewable sources
 * - Processing and displaying the results
 */

import { OpenElectricityClient } from '@openelectricity/client';
import { createConsoleTable, transformTimeSeriesTable } from '@openelectricity/client/datatable';

async function main() {
  // Initialize the client
  const client = new OpenElectricityClient({
    apiKey: process.env.OPENELECTRICITY_API_KEY
  });

  // Set the date range for the last 30 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  try {
    // Fetch energy data with renewable grouping
    const response = await client.getNetworkEnergy('NEM', {
      dateStart: startDate.toISOString(),
      dateEnd: endDate.toISOString(),
      interval: '1d',
      primaryGrouping: 'network',
      secondaryGrouping: 'renewable'
    });

    // Process and display the results
    console.log('Daily Energy Production by Renewable Status:');
    console.log('==========================================');

    const table = transformTimeSeriesTable(response.data);

    // Print the data as a table
    console.log('\nEnergy Generation by Source (MWh):');
    console.table(createConsoleTable(table));

    // Print summary statistics
    console.log('\nSummary by Source:');
    console.log('==================');

    table.columns.forEach(column => {
      const nonNullValues = column.values.filter((v): v is number => v !== null);
      const total = nonNullValues.reduce((sum, value) => sum + value, 0);
      const average = nonNullValues.length > 0 ? total / nonNullValues.length : 0;

      console.log(`\n${column.name}:`);
      console.log(`Total: ${total.toFixed(2)} MWh`);
      console.log(`Average: ${average.toFixed(2)} MWh/day`);
      console.log(`Renewable: ${column.labels.renewable === 'true' ? 'Yes' : 'No'}`);
    });

  } catch (error) {
    console.error('Error fetching energy data:', error);
  }
}

// Run the example
main().catch(console.error);