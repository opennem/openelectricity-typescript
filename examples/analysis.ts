/**
 * Example showing data analysis capabilities
 * This example demonstrates:
 * - Fetching multiple metrics
 * - Using DataTable features for analysis
 * - Calculating statistics and aggregations
 */

import { OpenElectricityClient } from "../src"

async function main() {
  const client = new OpenElectricityClient()

  try {
    // Get energy and power data for the NEM network
    const { datatable } = await client.getData("NEM", ["energy", "power"], {
      interval: "1h",
      dateStart: "2024-01-01T00:00:00",
      dateEnd: "2024-01-02T00:00:00",
      primaryGrouping: "network_region",
      secondaryGrouping: "fueltech_group",
    })

    if (!datatable) {
      throw new Error("No data returned")
    }

    // Example 1: Calculate mean values for each region
    console.log("\nAverage Generation by Region:")
    console.log("============================")
    const byRegion = datatable
      .groupBy(["network_region"], "mean")
      .sortBy(["network_region"])

    console.table(byRegion.toConsole())

    // Example 2: Find peak periods
    console.log("\nPeak Generation Periods:")
    console.log("=======================")
    const peakPeriods = datatable
      .filter((row) => (row.power as number) > 25000)
      .sortBy(["power"], false)

    console.table(peakPeriods.toConsole())

    // Example 3: Calculate statistics
    console.log("\nSummary Statistics:")
    console.log("==================")
    console.table(datatable.describe())

    // Example 4: Compare energy vs power
    console.log("\nEnergy vs Power Correlation:")
    console.log("===========================")
    const correlation = datatable
      .groupBy(["network_region"], "mean")
      .getRows()
      .map((row) => ({
        region: row.network_region,
        energy: row.energy,
        power: row.power,
        ratio: (row.energy as number) / (row.power as number),
      }))

    console.table(correlation)

  } catch (error) {
    if (error instanceof Error) {
      console.error("Analysis Error:", error.message)
    } else {
      console.error("Unknown error occurred")
    }
    process.exit(1)
  }
}

main()