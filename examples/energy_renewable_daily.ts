/**
 * Example showing how to fetch daily energy data grouped by renewable sources
 * This example demonstrates:
 * - Setting up the client
 * - Fetching energy data for a specific month
 * - Grouping data by renewable/non-renewable sources
 * - Processing and displaying the results
 */

import { NetworkCode, OpenElectricityClient } from '../src';
import { transformTimeSeriesTable } from '../src/datatable';

async function main() {
  // Initialize the client
  const client = new OpenElectricityClient({
    apiKey: process.env.OPENELECTRICITY_API_KEY
  });

  // Set the date range for Jan 15-16 2025
  const startDate = new Date('2025-01-15');
  const endDate = new Date('2025-01-16');

  // Specify the network we want to query
  const network: NetworkCode = 'NEM';

  try {
    // Fetch energy data with renewable grouping
    const response = await client.getNetworkEnergy(network, {
      dateStart: startDate.toISOString(),
      dateEnd: endDate.toISOString(),
      interval: '1d',
      primaryGrouping: 'network_region',
      secondaryGrouping: 'renewable'
    });

    // Transform the API response into a DataTable
    const table = transformTimeSeriesTable(response.data[0], network);

    // Display all data
    console.log('\nAll Energy Generation Data:');
    console.table(table.toConsole());

    // Group by network_region and renewable status
    const groupedTable = table
      .groupBy(['network_region', 'renewable'], 'sum')
      .sortBy(['network_region', 'renewable']);

    console.log('\nTotal Energy by Region and Renewable Status:');
    console.table(groupedTable.toConsole());

    // Calculate renewable percentage for each region
    const regionTotals = table
      .groupBy(['network_region'], 'sum')
      .getRows();

    const renewableByRegion = table
      .filter(row => row.renewable === true)
      .groupBy(['network_region'], 'sum')
      .getRows();

    console.log('\nRenewable Energy Share by Region:');
    console.log('================================');

    regionTotals.forEach(region => {
      const renewable = renewableByRegion.find(r => r.network_region === region.network_region);
      const energyValue = region[table.getMetric()] as number;
      const renewableValue = renewable ? (renewable[table.getMetric()] as number) : 0;
      const renewablePercentage = (renewableValue / energyValue) * 100;

      console.log(`\n${region.network_region}:`);
      console.log(`Total Energy: ${energyValue.toFixed(2)} MWh`);
      console.log(`Renewable: ${renewablePercentage.toFixed(1)}%`);
    });

  } catch (error) {
    console.error('Error fetching energy data:', error);
  }
}

// Run the example
main().catch(console.error);