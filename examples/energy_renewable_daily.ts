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
    const { datatable } = await client.getData("NEM", ["energy"], {
      dateStart: startDate.toISOString(),
      dateEnd: endDate.toISOString(),
      interval: "1d",
      primaryGrouping: "network_region",
      secondaryGrouping: "renewable",
    })

    if (!datatable) {
      throw new Error("No data returned")
    }

    // Display all data
    console.log("\nDaily Energy Generation Data:")
    console.log("===========================")
    console.table(datatable.toConsole())

    // Group by network_region and renewable status
    const groupedTable = datatable
      .groupBy(["network_region", "renewable"], "sum")
      .sortBy(["network_region", "renewable"])

    console.log("\nTotal Energy by Region and Renewable Status:")
    console.log("=========================================")
    console.table(groupedTable.toConsole())

    // Calculate renewable percentage for each region
    const regionTotals = datatable.groupBy(["network_region"], "sum").getRows()
    const renewableByRegion = datatable
      .filter((row) => row.renewable === true)
      .groupBy(["network_region"], "sum")
      .getRows()

    console.log("\nRenewable Energy Share by Region:")
    console.log("================================")

    regionTotals.forEach((region) => {
      const renewable = renewableByRegion.find((r) => r.network_region === region.network_region)
      const energyValue = region.energy as number
      const renewableValue = renewable ? (renewable.energy as number) : 0
      const renewablePercentage = (renewableValue / energyValue) * 100

      console.log(`\n${region.network_region}:`)
      console.log(`Total Energy: ${energyValue.toFixed(2)} MWh`)
      console.log(`Renewable: ${renewablePercentage.toFixed(1)}%`)
    })
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