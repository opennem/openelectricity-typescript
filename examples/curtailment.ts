/**
 * Curtailment Example
 *
 * This example demonstrates how to retrieve and analyze renewable energy curtailment data
 * from the OpenElectricity API. It fetches curtailment data for solar and wind in NSW1
 * for the last week and aggregates it by day.
 */

import { OpenElectricityClient } from "../src/client"
import type { MarketMetric } from "../src/types"

async function main() {
  const client = new OpenElectricityClient({
    apiKey: process.env.OPENELECTRICITY_API_KEY,
  })

  // Calculate date range for last 7 days
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(endDate.getDate() - 7)

  // Format dates as YYYY-MM-DD
  const formatDate = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  try {
    console.log(
      `Date range: ${formatDate(startDate)} to ${formatDate(endDate)}`,
    )
    console.log("")

    // Fetch curtailment data for solar and wind
    const metrics: MarketMetric[] = ["curtailment_solar", "curtailment_wind"]

    // Enable debug mode to see the request
    process.env.DEBUG = "openelectricity:*"

    const response = await client.getMarket("NEM", metrics, {
      interval: "1d", // Daily aggregation
      dateStart: formatDate(startDate),
      dateEnd: formatDate(endDate),
      network_region: "NSW1",
      primaryGrouping: "network_region",
    })

    // Process and display results
    if (response.datatable) {
      const table = response.datatable

      console.log("Curtailment by Day for NSW1:")
      console.log("=".repeat(60))
      console.log("")

      // Get unique dates from the data
      const dates = new Set<string>()
      response.response.data.forEach((series) => {
        series.results.forEach((result) => {
          result.data.forEach(([date]) => dates.add(date))
        })
      })

      // Sort dates
      const sortedDates = Array.from(dates).sort()

      // Initialize totals
      let totalSolarCurtailment = 0
      let totalWindCurtailment = 0
      let totalCurtailment = 0

      // Process each date
      sortedDates.forEach((date) => {
        // Get curtailment values for this date
        let solarCurtailment = 0
        let windCurtailment = 0

        response.response.data.forEach((series) => {
          if (series.metric === "curtailment_solar") {
            series.results.forEach((result) => {
              const dataPoint = result.data.find(([d]) => d === date)
              if (dataPoint && dataPoint[1] !== null) {
                solarCurtailment += dataPoint[1]
              }
            })
          } else if (series.metric === "curtailment_wind") {
            series.results.forEach((result) => {
              const dataPoint = result.data.find(([d]) => d === date)
              if (dataPoint && dataPoint[1] !== null) {
                windCurtailment += dataPoint[1]
              }
            })
          }
        })

        const dailyTotal = solarCurtailment + windCurtailment

        // Update totals
        totalSolarCurtailment += solarCurtailment
        totalWindCurtailment += windCurtailment
        totalCurtailment += dailyTotal

        // Display daily data
        const dateObj = new Date(date)
        const dayName = dateObj.toLocaleDateString("en-US", {
          weekday: "short",
        })
        const dateStr = dateObj.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })

        console.log(`${dayName}, ${dateStr}:`)
        console.log(`  Solar curtailment: ${solarCurtailment.toFixed(2)} MW`)
        console.log(`  Wind curtailment:  ${windCurtailment.toFixed(2)} MW`)
        console.log(`  Total curtailment: ${dailyTotal.toFixed(2)} MW`)
        console.log("")
      })

      // Display summary
      console.log("=".repeat(60))
      console.log("Summary for the week:")
      console.log(
        `  Total solar curtailment: ${totalSolarCurtailment.toFixed(2)} MW`,
      )
      console.log(
        `  Total wind curtailment:  ${totalWindCurtailment.toFixed(2)} MW`,
      )
      console.log(
        `  Total curtailment:       ${totalCurtailment.toFixed(2)} MW`,
      )
      console.log("")

      // Calculate averages
      const numDays = sortedDates.length
      if (numDays > 0) {
        console.log("Daily averages:")
        console.log(
          `  Avg solar curtailment: ${(totalSolarCurtailment / numDays).toFixed(2)} MW`,
        )
        console.log(
          `  Avg wind curtailment:  ${(totalWindCurtailment / numDays).toFixed(2)} MW`,
        )
        console.log(
          `  Avg total curtailment: ${(totalCurtailment / numDays).toFixed(2)} MW`,
        )
      }

      // Show percentage breakdown
      if (totalCurtailment > 0) {
        const solarPercent = (
          (totalSolarCurtailment / totalCurtailment) *
          100
        ).toFixed(1)
        const windPercent = (
          (totalWindCurtailment / totalCurtailment) *
          100
        ).toFixed(1)
        console.log("")
        console.log("Curtailment breakdown:")
        console.log(`  Solar: ${solarPercent}%`)
        console.log(`  Wind:  ${windPercent}%`)
      }
    } else {
      console.log("No data available for the specified parameters")
    }
  } catch (error) {
    console.error("Error fetching curtailment data:", error)
    if (error instanceof Error) {
      console.error("Error details:", error.message)
    }
  }
}

// Run the example
main().catch(console.error)
