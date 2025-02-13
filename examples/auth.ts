import OpenElectricityClient from '@openelectricity/client';

async function main() {
  // Initialize client
  const client = new OpenElectricityClient({
    // apiKey will be read from OPENELECTRICITY_API_KEY environment variable
  });

  try {
    // Get current user info
    const user = await client.getCurrentUser();

    console.log('Current User Information:');
    console.log('------------------------');
    console.log('Name:', user.data.full_name);
    console.log('Email:', user.data.email);
    console.log('Plan:', user.data.plan);
    console.log('API Calls Remaining:', user.data.meta.remaining);
    console.log('User ID:', user.data.id);
    console.log('Owner ID:', user.data.owner_id);

  } catch (error) {
    if (error instanceof Error) {
      console.error('Authentication Error:', error.message);
    } else {
      console.error('Unknown error occurred');
    }
    process.exit(1);
  }
}

main();