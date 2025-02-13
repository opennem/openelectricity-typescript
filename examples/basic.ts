import OpenElectricityClient from '@openelectricity/client';
import { createConsoleTable, transformTimeSeriesTable } from '@openelectricity/client/datatable';

async function main() {
  // Initialize client
  const client = new OpenElectricityClient({
    // apiKey will be read from OPENELECTRICITY_API_KEY environment variable
  });

  try {
    // Get energy data for the NEM network
    const energyData = await client.getNetworkEnergy('NEM', {
      interval: '1h',
      dateStart: '2024-01-01T00:00:00',
      dateEnd: '2024-01-02T00:00:00',
      primaryGrouping: 'network_region',
    });

    // Print the results
    console.log('Energy Data Response:');
    console.log('-------------------');
    console.log(energyData);
    console.log('Version:', energyData.version);
    console.log('Success:', energyData.success);
    console.log('Number of results:', energyData.data.results.length);

    // Transform data into tabular format
    const table = transformTimeSeriesTable(energyData.data);


    // Print the data as a table
    console.log('\nHourly Energy Data (MWh):');
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
