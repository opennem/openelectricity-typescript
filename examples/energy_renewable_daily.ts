/**
 * Example showing how to analyze renewable energy share by region
 * This example demonstrates:
 * - Fetching daily energy data
 * - Grouping by renewable status
 * - Calculating renewable percentage by region
 */

import { OpenElectricityClient } from "../src"

async function main() {
  // Initialize the client
  const client = new OpenElectricityClient()

  // Set the date range for the last week
  const endDate = new Date()
  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - 7)

  try {
    // Fetch energy data with renewable grouping
    const { datatable } = await client.getNetworkData("NEM", ["energy"], {
      dateStart: startDate.toISOString(),
      dateEnd: endDate.toISOString(),
      interval: "1d",
      primaryGrouping: "network_region",
      secondaryGrouping: ["renewable"],
    })

    if (!datatable) {
      throw new Error("No data returned")
    }

    // Display all data
    console.log("\nDaily Energy Generation Data:")
    console.log("===========================")
    console.table(datatable.toConsole())

    // Group by network_region and renewable status in a single operation
    const groupedTable = datatable
      .groupBy(["network_region", "renewable"], "sum")
      .sortBy(["network_region", "renewable"])

    console.log("\nTotal Energy by Region and Renewable Status:")
    console.log("=========================================")
    console.table(groupedTable.toConsole())

    // Calculate renewable percentage for each region in a single pass
    console.log("\nRenewable Energy Share by Region:")
    console.log("================================")

    // Create a map for efficient lookups
    const energyByRegion = new Map()

    // First pass: collect totals
    for (const row of groupedTable.getRows()) {
      const region = row.network_region as string
      if (!energyByRegion.has(region)) {
        energyByRegion.set(region, {
          total: 0,
          renewable: 0,
        })
      }
      const data = energyByRegion.get(region)
      const energy = row.energy as number
      data.total += energy
      if (row.renewable === true) {
        data.renewable += energy
      }
    }

    // Second pass: calculate and display percentages
    for (const [region, data] of energyByRegion) {
      const renewablePercentage = (data.renewable / data.total) * 100
      console.log(`\n${region}:`)
      console.log(`Total Energy: ${data.total.toFixed(2)} MWh`)
      console.log(`Renewable: ${renewablePercentage.toFixed(1)}%`)
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error fetching energy data:", error.message)
    } else {
      console.error("Unknown error occurred")
    }
    process.exit(1)
  }
}

main()
