/**
 * Example showing how to fetch daily energy data grouped by renewable sources
 * This example demonstrates:
 * - Setting up the client
 * - Fetching energy data for a specific month
 * - Grouping data by renewable/non-renewable sources
 * - Processing and displaying the results
 */

import { NetworkCode, OpenElectricityClient } from '@openelectricity/client';
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

  // Specify the network we want to query
  const network: NetworkCode = 'NEM';

  try {
    // Fetch energy data with renewable grouping
    const response = await client.getNetworkEnergy(network, {
      dateStart: startDate.toISOString(),
      dateEnd: endDate.toISOString(),
      interval: '1d',
      secondaryGrouping: 'renewable'  // Remove primaryGrouping to get renewable split directly
    });

    // Process and display the results
    console.log(`Daily Energy Production by Renewable Status (${network})`);
    console.log('==========================================');

    // Transform the data with network-specific timezone
    const table = transformTimeSeriesTable(response.data, network);

    // Create a more readable version of the table for display
    const displayTable = {
      ...table,
      columns: table.columns.map(col => ({
        ...col,
        // Rename columns based on renewable status
        name: col.labels.renewable === 'true' ? 'Renewable' : 'Non-renewable',
        // Convert MWh to GWh for readability
        values: col.values.map(v => v !== null ? Number((v / 1000).toFixed(2)) : null)
      }))
    };

    // Print the data as a table
    console.log('\nDaily Energy Generation by Source (GWh):');
    console.table(createConsoleTable(displayTable));

    // Print summary statistics
    console.log('\nSummary by Source:');
    console.log('==================');

    displayTable.columns.forEach(column => {
      const nonNullValues = column.values.filter((v): v is number => v !== null);
      const total = nonNullValues.reduce((sum, value) => sum + value, 0);
      const average = nonNullValues.length > 0 ? total / nonNullValues.length : 0;

      console.log(`\n${column.name}:`);
      console.log(`Total: ${total.toFixed(2)} GWh`);
      console.log(`Average: ${average.toFixed(2)} GWh/day`);
    });

  } catch (error) {
    console.error('Error fetching energy data:', error);
  }
}

// Run the example
main().catch(console.error);