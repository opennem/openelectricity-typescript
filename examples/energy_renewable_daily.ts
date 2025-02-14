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
    console.log('\nCurrent Power Generation by Fuel Type (MW):');
    console.table(createConsoleTable(table));

  } catch (error) {
    console.error('Error fetching energy data:', error);
  }
}

// Run the example
main().catch(console.error);