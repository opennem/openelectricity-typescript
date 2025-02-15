/**
 * Example showing how to fetch and analyze power generation data
 * This example demonstrates:
 * - Fetching recent power data with fuel tech grouping
 * - Using DataTable features to analyze the data
 * - Calculating summaries and statistics
 */

import { NetworkCode, OpenElectricityClient } from '../src';
import { transformTimeSeriesTable } from '../src/datatable';

async function main() {
  // Initialize client
  const client = new OpenElectricityClient({
    apiKey: process.env.OPENELECTRICITY_API_KEY
  });

  // Specify the network
  const network: NetworkCode = 'NEM';

  try {
    // Get power data for the last 7 days
    const response = await client.getNetworkPower(network, {
      interval: '5m',
      primaryGrouping: 'network_region',
      secondaryGrouping: 'fueltech'
    });

    // Transform data into a DataTable
    const table = transformTimeSeriesTable(response.data[0], network);

    // Get the latest timestamp
    const latestTime = Math.max(...table.getRows().map(r => r.interval.getTime()));
    const latestData = table.filter(row => row.interval.getTime() === latestTime);

    // Display current power generation by region
    console.log('\nCurrent Power Generation by Region (MW):');
    console.log('=======================================');
    const byRegion = latestData
      .groupBy(['network_region'], 'sum')
      .sortBy(['network_region']);

    console.table(byRegion.toConsole());

    // Display current renewable vs non-renewable generation
    console.log('\nCurrent Generation Mix:');
    console.log('=====================');

    const renewableFueltechs = ['solar', 'wind', 'hydro', 'battery'];
    const currentGen = latestData.getRows();

    const renewable = currentGen
      .filter(row => renewableFueltechs.includes(row.fueltech as string))
      .reduce((sum, row) => sum + (row[table.getMetric()] as number), 0);

    const total = currentGen
      .reduce((sum, row) => sum + (row[table.getMetric()] as number), 0);

    const renewablePercentage = (renewable / total) * 100;

    console.log(`Total Generation: ${total.toFixed(0)} MW`);
    console.log(`Renewable Generation: ${renewable.toFixed(0)} MW (${renewablePercentage.toFixed(1)}%)`);
    console.log(`Non-Renewable Generation: ${(total - renewable).toFixed(0)} MW (${(100 - renewablePercentage).toFixed(1)}%)`);

    // Show top generating fuel types
    console.log('\nCurrent Generation by Fuel Type (Top 5):');
    console.log('=====================================');
    const byFueltech = latestData
      .groupBy(['fueltech'], 'sum')
      .sortBy([table.getMetric()], false)
      .select(['fueltech', table.getMetric()]);

    console.table(byFueltech.getRows().slice(0, 5).map(row => ({
      fueltech: row.fueltech,
      [table.getMetric()]: (row[table.getMetric()] as number).toFixed(0) + ' MW'
    })));

    // Calculate average generation for the last 24 hours
    const oneDayAgo = new Date(latestTime - 24 * 60 * 60 * 1000);
    const last24h = table
      .filter(row => row.interval >= oneDayAgo)
      .groupBy(['network_region'], 'mean');

    console.log('\nAverage Generation Last 24 Hours by Region:');
    console.log('=========================================');
    console.table(last24h.toConsole());

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