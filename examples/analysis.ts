import OpenElectricityClient from '@openelectricity/client';
import { createConsoleTable, TimeSeriesData, transformTimeSeriesTable } from '@openelectricity/client/datatable';

async function main() {
  const client = new OpenElectricityClient();

  try {
    // Get energy data for the NEM network
    const energyData = await client.getNetworkEnergy('NEM', {
      interval: '1h',
      dateStart: '2024-01-01T00:00:00',
      dateEnd: '2024-01-02T00:00:00',
      primaryGrouping: 'network',
      secondaryGrouping: 'fueltech_group'
    });

    // Transform data into our table format
    const table = transformTimeSeriesTable(energyData.data);
    const timeSeriesData = new TimeSeriesData(table);

    // Example 1: Calculate mean values for each fuel type
    console.log('\nAverage Generation by Fuel Type:');
    const means = timeSeriesData.mean();
    means.forEach(({ name, value, labels }) => {
      console.log(`${name}: ${value.toFixed(2)} MW (${labels.fueltech})`);
    });

    // Example 2: Find peak coal periods
    console.log('\nPeak Coal Generation Periods:');
    const peakCoal = timeSeriesData.filter('coal_black', 20000, '>');
    console.table(createConsoleTable(peakCoal.table));

    // Example 3: Calculate 3-hour rolling average for wind
    console.log('\n3-Hour Rolling Average Wind Generation:');
    const rollingWind = timeSeriesData.rollingAverage(3);
    console.table(createConsoleTable(rollingWind.table));

    // Example 4: Sum all renewable sources
    const renewableSources = ['wind', 'solar_utility', 'hydro'];
    const totalRenewables = timeSeriesData.sumColumns(renewableSources);
    console.log('\nTotal Renewable Generation:');
    console.log(`Peak: ${Math.max(...totalRenewables.values)} MW`);
    console.log(`Average: ${totalRenewables.values.reduce((a, b) => a + b) / totalRenewables.values.length} MW`);

  } catch (error) {
    if (error instanceof Error) {
      console.error('Analysis Error:', error.message);
    } else {
      console.error('Unknown error occurred');
    }
    process.exit(1);
  }
}

main();