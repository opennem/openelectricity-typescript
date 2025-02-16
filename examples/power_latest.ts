/**
 * Example showing how to analyze recent power generation
 * This example demonstrates:
 * - Fetching recent power data
 * - Analyzing generation mix
 * - Calculating regional statistics
 */

import { OpenElectricityClient } from "../src"

async function main() {
  // Initialize client
  const client = new OpenElectricityClient()

  // Set the date range for the last 3 days
  const endDate = new Date()
  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - 3)

  try {
    // Get power data for the last 3 days
    const { datatable } = await client.getData("NEM", ["power"], {
      interval: "5m",
      dateStart: startDate.toISOString(),
      dateEnd: endDate.toISOString(),
      primaryGrouping: "network_region",
      secondaryGrouping: "fueltech",
    })

    if (!datatable) {
      throw new Error("No data returned")
    }

    // Get the latest timestamp and data
    const latestTime = datatable.getLatestTimestamp()
    const latestData = datatable.filter((row) => row.interval.getTime() === latestTime)

    // Display current power generation by region
    console.log("\nCurrent Power Generation by Region (MW):")
    console.log("=======================================")
    const byRegion = latestData.groupBy(["network_region"], "sum")
    console.table(byRegion.toConsole())

    // Display current renewable vs non-renewable generation
    console.log("\nCurrent Generation Mix:")
    console.log("=====================")

    const renewableFueltechs = new Set(["solar", "wind", "hydro", "pumps", "bioenergy"])
    const currentGen = latestData.getRows()

    // Calculate renewable and total in a single pass
    let renewable = 0
    let total = 0
    for (const row of currentGen) {
      const power = row.power as number
      if (power !== null && !isNaN(power)) {
        total += power
        if (renewableFueltechs.has(row.fueltech as string)) {
          renewable += power
        }
      }
    }

    const renewablePercentage = (renewable / total) * 100

    console.log(`Total Generation: ${total.toFixed(0)} MW`)
    console.log(`Renewable Generation: ${renewable.toFixed(0)} MW (${renewablePercentage.toFixed(1)}%)`)
    console.log(
      `Non-Renewable Generation: ${(total - renewable).toFixed(0)} MW (${(100 - renewablePercentage).toFixed(1)}%)`
    )

    // Show top generating fuel types
    console.log("\nCurrent Generation by Fuel Type (Top 5):")
    console.log("=====================================")
    const byFueltech = latestData.groupBy(["fueltech"], "sum").sortBy(["power"], false).select(["fueltech", "power"])

    console.table(
      byFueltech
        .getRows()
        .slice(0, 5)
        .map((row) => ({
          fueltech: row.fueltech,
          power: (row.power as number).toFixed(0) + " MW",
        }))
    )

    // Calculate average generation for the last 24 hours
    const oneDayAgo = new Date(latestTime - 24 * 60 * 60 * 1000)
    const last24h = datatable.filter((row) => row.interval >= oneDayAgo).groupBy(["network_region"], "mean")

    console.log("\nAverage Generation Last 24 Hours by Region:")
    console.log("=========================================")
    console.table(last24h.toConsole())

    // Show summary statistics
    console.log("\nSummary Statistics:")
    console.log("==================")
    console.table(datatable.describe())
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
