/**
 * Example showing how to calculate emission factors
 * This example demonstrates:
 * - Fetching both emissions and energy data
 * - Calculating emission factors (tCO2e/MWh)
 * - Analyzing trends over time
 */

import { OpenElectricityClient } from "../src"

async function main() {
  // Initialize client
  const client = new OpenElectricityClient()

  // Set the date range for the last week
  const endDate = new Date()
  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - 7)

  try {
    // Get both emissions and energy data
    const { datatable } = await client.getData("NEM", ["emissions", "energy"], {
      interval: "1d",
      dateStart: startDate.toISOString(),
      dateEnd: endDate.toISOString(),
      primaryGrouping: "network_region",
    })

    if (!datatable) {
      throw new Error("No data returned")
    }

    // Calculate emission factors for each region and day
    const rows = datatable.getRows()
    const emissionFactors = rows.map((row) => ({
      interval: row.interval,
      network_region: row.network_region,
      energy: row.energy as number,
      emissions: row.emissions as number,
      emission_factor: ((row.emissions as number) / (row.energy as number)).toFixed(3),
    }))

    // Display daily emission factors by region
    console.log("\nDaily Emission Factors by Region (tCO2e/MWh):")
    console.log("==========================================")
    console.table(emissionFactors)

    // Calculate average emission factors by region
    const avgByRegion = datatable
      .groupBy(["network_region"], "mean")
      .getRows()
      .map((row) => ({
        network_region: row.network_region,
        avg_emission_factor: ((row.emissions as number) / (row.energy as number)).toFixed(3),
        total_emissions: (row.emissions as number).toFixed(0),
        total_energy: (row.energy as number).toFixed(0),
      }))

    console.log("\nAverage Emission Factors by Region:")
    console.log("=================================")
    console.table(avgByRegion)

    // Find highest and lowest emission periods
    const sorted = [...emissionFactors].sort((a, b) => Number(b.emission_factor) - Number(a.emission_factor))

    console.log("\nHighest Emission Periods:")
    console.log("========================")
    console.table(sorted.slice(0, 3))

    console.log("\nLowest Emission Periods:")
    console.log("=======================")
    console.table(sorted.slice(-3))

    // Calculate overall statistics
    const allFactors = emissionFactors.map((r) => Number(r.emission_factor))
    const avg = allFactors.reduce((a, b) => a + b) / allFactors.length
    const max = Math.max(...allFactors)
    const min = Math.min(...allFactors)

    console.log("\nEmission Factor Statistics:")
    console.log("=========================")
    console.log(`Average: ${avg.toFixed(3)} tCO2e/MWh`)
    console.log(`Maximum: ${max.toFixed(3)} tCO2e/MWh`)
    console.log(`Minimum: ${min.toFixed(3)} tCO2e/MWh`)
    console.log(`Range: ${(max - min).toFixed(3)} tCO2e/MWh`)
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error calculating emission factors:", error.message)
    } else {
      console.error("Unknown error occurred")
    }
    process.exit(1)
  }
}

main()