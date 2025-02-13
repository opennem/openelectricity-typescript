import OpenElectricityClient from '@openelectricity/client';
import { createConsoleTable, transformTimeSeriesTable } from '@openelectricity/client/datatable';

async function main() {
  // Initialize client
  const client = new OpenElectricityClient({
    // apiKey will be read from OPENELECTRICITY_API_KEY environment variable
  });

  try {
    // Get latest power data for the NEM network
    const powerData = await client.getNetworkPower('NEM', {
      interval: '5m', // Use 5-minute intervals for most recent data
      primaryGrouping: 'network',
      secondaryGrouping: 'fueltech'
    });

    // Print the results
    console.log('Power Data Response:');
    console.log('-------------------');
    console.log('Version:', powerData.version);
    console.log('Success:', powerData.success);
    console.log('Number of results:', powerData.data.results.length);
    console.log('Time range:', powerData.data.start, 'to', powerData.data.end);
    console.log('Unit:', powerData.data.unit);

    // Transform data into tabular format
    const table = transformTimeSeriesTable(powerData.data);

    // Print the data as a table
    console.log('\nCurrent Power Generation by Fuel Type (MW):');
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