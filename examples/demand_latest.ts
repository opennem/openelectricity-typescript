import OpenElectricityClient from '@openelectricity/client';
import { createConsoleTable, transformTimeSeriesTable } from '@openelectricity/client/datatable';

async function main() {
  const client = new OpenElectricityClient();

  try {
    // Get latest demand data for the NEM network
    const demandData = await client.getNetworkDemand('NEM', {
      interval: '5m',
      primaryGrouping: 'network_region'  // Show demand by region
    });

    // Print the results
    console.log('Demand Data Response:');
    console.log('-------------------');
    console.log('Version:', demandData.version);
    console.log('Success:', demandData.success);
    console.log('Time range:', demandData.data.start, 'to', demandData.data.end);
    console.log('Unit:', demandData.data.unit);

    // Transform data into tabular format
    const table = transformTimeSeriesTable(demandData.data);

    // Print the data as a table
    console.log('\nCurrent Regional Demand (MW):');
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