import OpenElectricityClient from '@openelectricity/client';
import { createConsoleTable, transformTimeSeriesTable } from '@openelectricity/client/datatable';

async function main() {
  const client = new OpenElectricityClient();

  try {
    // Get yearly emissions data for the NEM network from 2014-2024
    const emissionsData = await client.getNetworkEmissions('NEM', {
      interval: '1y',
      dateStart: '2019-01-01',
      dateEnd: '2024-01-01',
      primaryGrouping: 'network'  // Show total network emissions
    });

    // Print the results
    console.log('Yearly Emissions Data Response:');
    console.log('------------------------------');
    console.log('Version:', emissionsData.version);
    console.log('Success:', emissionsData.success);
    console.log('Time range:', emissionsData.data.start, 'to', emissionsData.data.end);
    console.log('Unit:', emissionsData.data.unit);

    // Transform data into tabular format
    const table = transformTimeSeriesTable(emissionsData.data);

    // Print the data as a table
    console.log('\nYearly Network Emissions (tCO2e):');
    console.table(createConsoleTable(table));

    // Calculate some statistics
    const values = table.columns[0].values.filter(v => v !== null) as number[];
    const total = values.reduce((sum, val) => sum + val, 0);
    const average = total / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const latest = values[0];
    const reduction = ((max - latest) / max) * 100;

    console.log('\nEmissions Statistics:');
    console.log(`Total Emissions: ${total.toLocaleString()} tCO2e`);
    console.log(`Average Annual Emissions: ${average.toLocaleString()} tCO2e`);
    console.log(`Peak Annual Emissions: ${max.toLocaleString()} tCO2e`);
    console.log(`Lowest Annual Emissions: ${min.toLocaleString()} tCO2e`);
    console.log(`Latest Annual Emissions: ${latest.toLocaleString()} tCO2e`);
    console.log(`Reduction from Peak: ${reduction.toFixed(1)}%`);

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