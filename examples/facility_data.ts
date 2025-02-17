/**
 * Example showing how to fetch and analyze facility data
 * This example demonstrates:
 * - Fetching data for a specific facility
 * - Analyzing energy and market value metrics
 * - Working with daily aggregations
 * - Handling multiple units within a facility
 */

import { OpenElectricityClient } from "../src"

/* eslint-disable no-console */

async function main(): Promise<void> {
  // Initialize client
  const client = new OpenElectricityClient()

  // Set the date range for the last week
  const endDate = new Date()
  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - 7)

  try {
    // Get energy and market value data for BANGOWF facility
    const { datatable } = await client.getFacilityData("NEM", "BANGOWF", ["energy", "market_value"], {
      interval: "1d",
      dateStart: startDate.toISOString(),
      dateEnd: endDate.toISOString(),
    })

    if (!datatable) {
      throw new Error("No data returned")
    }

    // Display the daily data by unit
    console.log("\nDaily Energy and Market Value for Bango Wind Farm Units:")
    console.log("=================================================")

    const formattedData = datatable.getRows().map((row) => ({
      date: (row.interval as Date).toISOString().split("T")[0],
      unit: row.unit_code as string,
      energy: (row.energy as number).toFixed(2) + " MWh",
      market_value: "$" + (row.market_value as number).toFixed(2),
      avg_price: "$" + ((row.market_value as number) / (row.energy as number)).toFixed(2) + "/MWh",
    }))

    console.table(formattedData)

    // Calculate and display totals by unit
    const totalsByUnit = datatable.getRows().reduce(
      (acc, row) => {
        const unit = row.unit_code as string
        if (!acc[unit]) {
          acc[unit] = { energy: 0, market_value: 0 }
        }
        acc[unit].energy += row.energy as number
        acc[unit].market_value += row.market_value as number
        return acc
      },
      {} as Record<string, { energy: number; market_value: number }>
    )

    console.log("\nWeekly Totals by Unit:")
    console.log("====================")
    Object.entries(totalsByUnit).forEach(([unit, totals]) => {
      console.log(`\nUnit: ${unit}`)
      console.log(`Total Energy: ${totals.energy.toFixed(2)} MWh`)
      console.log(`Total Market Value: $${totals.market_value.toFixed(2)}`)
      console.log(`Average Price: $${(totals.market_value / totals.energy).toFixed(2)}/MWh`)
    })

    // Calculate facility totals
    const facilityTotals = Object.values(totalsByUnit).reduce(
      (acc, totals) => ({
        energy: acc.energy + totals.energy,
        market_value: acc.market_value + totals.market_value,
      }),
      { energy: 0, market_value: 0 }
    )

    console.log("\nFacility Totals:")
    console.log("================")
    console.log(`Total Energy: ${facilityTotals.energy.toFixed(2)} MWh`)
    console.log(`Total Market Value: $${facilityTotals.market_value.toFixed(2)}`)
    console.log(`Average Price: $${(facilityTotals.market_value / facilityTotals.energy).toFixed(2)}/MWh`)
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
