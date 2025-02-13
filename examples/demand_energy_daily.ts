import OpenElectricityClient from '@openelectricity/client';
import { createConsoleTable, transformTimeSeriesTable } from '@openelectricity/client/datatable';

async function main() {
  const client = new OpenElectricityClient();

  try {
    // Get daily demand energy for the last month
    const date = new Date();
    const endDate = date.toISOString().split('T')[0];
    date.setMonth(date.getMonth() - 1);
    const startDate = date.toISOString().split('T')[0];

    const demandData = await client.getNetworkDemandEnergy('NEM', {
      interval: '1d',
      dateStart: startDate,
      dateEnd: endDate,
      primaryGrouping: 'network_region'
    });

    // Print the results
    console.log('Daily Demand Energy Response:');
    console.log('----------------------------');
    console.log('Version:', demandData.version);
    console.log('Success:', demandData.success);
    console.log('Time range:', demandData.data.start, 'to', demandData.data.end);
    console.log('Unit:', demandData.data.unit);

    // Transform data into tabular format
    const table = transformTimeSeriesTable(demandData.data);

    // Print the data as a table
    console.log('\nDaily Regional Demand Energy (MWh):');
    console.table(createConsoleTable(table));

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