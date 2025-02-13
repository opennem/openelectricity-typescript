import OpenElectricityClient from '@openelectricity/client';

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
      primaryGrouping: 'network',
      secondaryGrouping: 'fueltech'
    });

    // Print the results
    console.log('Energy Data Response:');
    console.log('Version:', energyData.version);
    console.log('Success:', energyData.success);
    console.log('Number of results:', energyData.data.results.length);

    // Print first result
    if (energyData.data.results.length > 0) {
      const firstResult = energyData.data.results[0];
      console.log('\nFirst Result:');
      console.log('Name:', firstResult.name);
      console.log('Start:', firstResult.date_start);
      console.log('End:', firstResult.date_end);
      console.log('Labels:', firstResult.labels);
      console.log('First data point:', firstResult.data[0]);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

main();
