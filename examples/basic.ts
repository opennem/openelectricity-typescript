/**
 * Basic example showing how to use the OpenElectricity client
 * This example demonstrates:
 * - Setting up the client
 * - Making a simple data request
 * - Accessing the response data
 */

import { OpenElectricityClient } from "../src"

async function main() {
  // Initialize client
  const client = new OpenElectricityClient()

  try {
    // Get energy data for the NEM network
    const { response, datatable } = await client.getNetworkData("NEM", ["energy"], {
      interval: "1h",
      dateStart: "2024-01-01T00:00:00",
      dateEnd: "2024-01-02T00:00:00",
      primaryGrouping: "network_region",
    })

    // Print the raw API response
    console.log("API Response:")
    console.log("------------")
    console.log("Version:", response.version)
    console.log("Success:", response.success)
    console.log("Number of metrics:", response.data.length)

    // Print the data as a table
    if (datatable) {
      console.log("\nHourly Energy Data (MWh):")
      console.log("------------------------")
      console.table(datatable.toConsole())
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("API Error:", error.message)
    } else {
      console.error("Unknown error occurred")
    }
    process.exit(1)
  }
}

main()
