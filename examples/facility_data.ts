/**
 * Example showing how to fetch and analyze facility data
 * This example demonstrates:
 * - Fetching data for a specific facility
 * - Analyzing energy and market value metrics
 * - Working with daily aggregations
 * - Handling multiple units within a facility
 */

/* global console, process */

import { OpenElectricityClient } from "../src"

async function main(): Promise<void> {
  // Initialize client
  const client = new OpenElectricityClient()

  // Set the date range for the last week
  const endDate = new Date()
  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - 7)

  // Format dates as timezone-naive (YYYY-MM-DDTHH:mm:ss)
  const formatDate = (date: Date): string => {
    return date.toISOString().split(".")[0] // Remove milliseconds and timezone
  }

  try {
    // Get energy and market value data for BANGOWF facility
    const { datatable } = await client.getFacilityData("NEM", ["BANGOWF"], ["energy", "market_value"], {
      interval: "1d",
      dateStart: formatDate(startDate),
      dateEnd: formatDate(endDate),
    })

    if (!datatable) {
      throw new Error("No data returned")
    }

    // Display the daily data by unit
    console.warn("\nDaily Energy and Market Value for Bango Wind Farm Units:")
    console.warn("=================================================")

    const formattedData = datatable.getRows().map((row) => ({
      date: (row.interval as Date).toISOString().split("T")[0],
      unit: row.unit_code as string,
      energy: (row.energy as number).toFixed(2) + " MWh",
      market_value: "$" + (row.market_value as number).toFixed(2),
      avg_price: "$" + ((row.market_value as number) / (row.energy as number)).toFixed(2) + "/MWh",
    }))

    console.warn(JSON.stringify(formattedData, null, 2))

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

    console.warn("\nWeekly Totals by Unit:")
    console.warn("====================")
    Object.entries(totalsByUnit).forEach(([unit, totals]) => {
      console.warn(`\nUnit: ${unit}`)
      console.warn(`Total Energy: ${totals.energy.toFixed(2)} MWh`)
      console.warn(`Total Market Value: $${totals.market_value.toFixed(2)}`)
      console.warn(`Average Price: $${(totals.market_value / totals.energy).toFixed(2)}/MWh`)
    })

    // Calculate facility totals
    const facilityTotals = Object.values(totalsByUnit).reduce(
      (acc, totals) => ({
        energy: acc.energy + totals.energy,
        market_value: acc.market_value + totals.market_value,
      }),
      { energy: 0, market_value: 0 }
    )

    console.warn("\nFacility Totals:")
    console.warn("================")
    console.warn(`Total Energy: ${facilityTotals.energy.toFixed(2)} MWh`)
    console.warn(`Total Market Value: $${facilityTotals.market_value.toFixed(2)}`)
    console.warn(`Average Price: $${(facilityTotals.market_value / facilityTotals.energy).toFixed(2)}/MWh`)
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
