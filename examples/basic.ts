import OpenElectricityClient from '../src';

async function main() {
  // Initialize client
  const client = new OpenElectricityClient({
    // apiKey will be read from OPENELECTRICITY_API_KEY environment variable
  });

  try {
    // Get energy data for the NEM network
    const energyData = await client.getNetworkEnergy('NEM', {
      interval: '1h',
      dateStart: '2024-01-01T00:00:00Z',
      dateEnd: '2024-01-02T00:00:00Z',
      primaryGrouping: 'network_region',
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

    // Get current user info
    const user = await client.getCurrentUser();
    console.log('\nCurrent User:');
    console.log('ID:', user.id);
    console.log('Roles:', user.roles);

  } catch (error) {
    console.error('Error:', error);
  }
}

main();
