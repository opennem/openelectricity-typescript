/**
 * Example: Curtailment Power Data Analysis (5-minute intervals)
 *
 * This example demonstrates how to fetch and analyze curtailment POWER data (MW)
 * for renewable energy sources at 5-minute intervals across all NEM regions.
 * 
 * Use this for real-time monitoring of curtailment generation.
 */

import { OpenElectricityClient } from "../src/client"
import type { MarketMetric } from "../src/types"

async function main() {
  const client = new OpenElectricityClient({
    apiKey: process.env.OPENELECTRICITY_API_KEY,
  })

  // Calculate date range (last 3 days for 5-minute data)
  // If we don't specify dateEnd, the API returns the latest available data
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 3)

  // Format dates as ISO strings
  const formatDate = (date: Date): string => {
    return date.toISOString()
  }

  try {
    console.log("OpenElectricity Curtailment Power Analysis (5-minute intervals)")
    console.log("=".repeat(60))
    console.log(`\nFetching curtailment power data for the last 3 days (latest available)`)
    console.log("")

    // Fetch 5-minute curtailment power data for all NEM regions
    // By omitting dateEnd, we get the latest available data
    const metrics: MarketMetric[] = ["curtailment_solar", "curtailment_wind", "curtailment"]

    const response = await client.getMarket("NEM", metrics, {
      interval: "5m",
      dateStart: formatDate(startDate),
      // dateEnd omitted to get latest data
      primaryGrouping: "network_region",
    })

    if (!response.response.data || response.response.data.length === 0) {
      console.log("No curtailment data retrieved")
      return
    }

    // Process and display the data
    console.log(`Retrieved ${response.response.data.length} time series datasets\n`)

    // Organize data by region and metric
    const curtailmentByRegion: Record<string, Record<string, Array<[string, number]>>> = {}
    const latestValues: Record<string, Record<string, number>> = {}

    for (const timeseries of response.response.data) {
      const metric = timeseries.metric

      for (const result of timeseries.results) {
        // Extract region from result name (e.g., "curtailment_solar_NSW1" -> "NSW1")
        const nameParts = result.name.split("_")
        const region = nameParts[nameParts.length - 1]

        if (!curtailmentByRegion[region]) {
          curtailmentByRegion[region] = {}
        }
        if (!curtailmentByRegion[region][metric]) {
          curtailmentByRegion[region][metric] = []
        }
        if (!latestValues[region]) {
          latestValues[region] = {}
        }

        // Extract data points
        curtailmentByRegion[region][metric] = result.data
        
        // Store latest value
        if (result.data.length > 0) {
          const lastPoint = result.data[result.data.length - 1]
          if (lastPoint[1] !== null) {
            latestValues[region][metric] = lastPoint[1]
          }
        }
      }
    }

    // Display latest curtailment values
    console.log("=".repeat(60))
    console.log("LATEST CURTAILMENT VALUES (MW)")
    console.log("=".repeat(60))

    const regions = Object.keys(latestValues).sort()

    for (const region of regions) {
      console.log(`\n${region}:`)
      console.log("-".repeat(40))

      const solar = latestValues[region]["curtailment_solar"] || 0
      const wind = latestValues[region]["curtailment_wind"] || 0
      const total = latestValues[region]["curtailment"] || solar + wind

      console.log(`  Solar:  ${solar.toFixed(2)} MW`)
      console.log(`  Wind:   ${wind.toFixed(2)} MW`)
      console.log(`  Total:  ${total.toFixed(2)} MW`)
    }

    // Display summary statistics for the period
    console.log("\n" + "=".repeat(60))
    console.log("PERIOD SUMMARY (Last 3 Days)")
    console.log("=".repeat(60))

    for (const region of regions) {
      console.log(`\n${region}:`)
      console.log("-".repeat(40))

      const solarData = curtailmentByRegion[region]["curtailment_solar"] || []
      const windData = curtailmentByRegion[region]["curtailment_wind"] || []

      if (solarData.length > 0) {
        const solarValues = solarData.map(d => d[1]).filter(v => v !== null) as number[]
        if (solarValues.length > 0) {
          const solarAvg = solarValues.reduce((a, b) => a + b, 0) / solarValues.length
          const solarMax = Math.max(...solarValues)
          const solarMin = Math.min(...solarValues)

          console.log("  Solar Curtailment:")
          console.log(`    Average: ${solarAvg.toFixed(2)} MW`)
          console.log(`    Maximum: ${solarMax.toFixed(2)} MW`)
          console.log(`    Minimum: ${solarMin.toFixed(2)} MW`)
        }
      }

      if (windData.length > 0) {
        const windValues = windData.map(d => d[1]).filter(v => v !== null) as number[]
        if (windValues.length > 0) {
          const windAvg = windValues.reduce((a, b) => a + b, 0) / windValues.length
          const windMax = Math.max(...windValues)
          const windMin = Math.min(...windValues)

          console.log("  Wind Curtailment:")
          console.log(`    Average: ${windAvg.toFixed(2)} MW`)
          console.log(`    Maximum: ${windMax.toFixed(2)} MW`)
          console.log(`    Minimum: ${windMin.toFixed(2)} MW`)
        }
      }
    }

    // Overall NEM summary
    console.log("\n" + "=".repeat(60))
    console.log("OVERALL NEM CURTAILMENT (Current)")
    console.log("=".repeat(60))

    let totalSolar = 0
    let totalWind = 0
    let totalCurtailment = 0

    for (const region of regions) {
      totalSolar += latestValues[region]["curtailment_solar"] || 0
      totalWind += latestValues[region]["curtailment_wind"] || 0
      totalCurtailment += latestValues[region]["curtailment"] || 0
    }

    console.log(`\nCurrent Solar Curtailment: ${totalSolar.toFixed(2)} MW`)
    console.log(`Current Wind Curtailment:  ${totalWind.toFixed(2)} MW`)
    console.log(`Current Total Curtailment: ${totalCurtailment.toFixed(2)} MW`)

    if (totalCurtailment > 0) {
      const solarPercentage = (totalSolar / totalCurtailment) * 100
      const windPercentage = (totalWind / totalCurtailment) * 100

      console.log(`\nCurtailment Breakdown:`)
      console.log(`  Solar: ${solarPercentage.toFixed(1)}%`)
      console.log(`  Wind:  ${windPercentage.toFixed(1)}%`)
    }

    // Show time series trend for NSW1 as example
    console.log("\n" + "=".repeat(60))
    console.log("TIME SERIES SAMPLE (Last 5 intervals)")
    console.log("=".repeat(60))

    const nsw1Solar = curtailmentByRegion["NSW1"]?.["curtailment_solar"] || []
    if (nsw1Solar.length > 0) {
      console.log("\nNSW1 Solar Curtailment (Last 5 intervals):")
      const lastFive = nsw1Solar.slice(-5)
      for (const [timestamp, value] of lastFive) {
        if (value !== null) {
          const date = new Date(timestamp)
          console.log(`  ${date.toLocaleTimeString()}: ${value.toFixed(2)} MW`)
        }
      }
    }

  } catch (error) {
    console.error("Error fetching curtailment data:", error)
    if (error instanceof Error) {
      console.error("Details:", error.message)
    }
  }
}

// Run the example
main().catch(console.error)