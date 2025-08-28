/**
 * Example: Curtailment Energy Data Analysis (Daily buckets)
 *
 * This example demonstrates how to fetch and analyze curtailment ENERGY data (MWh)
 * for renewable energy sources at daily intervals across all NEM regions.
 * 
 * Use this for energy accounting and longer-term analysis of curtailed energy.
 */

import { OpenElectricityClient } from "../src/client"
import type { MarketMetric } from "../src/types"

async function main() {
  const client = new OpenElectricityClient({
    apiKey: process.env.OPENELECTRICITY_API_KEY,
  })

  // Calculate date range (last 7 days for daily data)
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 7)

  // Format dates as YYYY-MM-DD
  const formatDate = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  try {
    console.log("OpenElectricity Curtailment Energy Analysis (Daily buckets)")
    console.log("=".repeat(60))
    console.log(`\nFetching curtailment energy data from ${formatDate(startDate)} to ${formatDate(endDate)}`)
    console.log("")

    // Fetch daily curtailment energy data for all NEM regions
    const metrics: MarketMetric[] = [
      "curtailment_solar_utility_energy", 
      "curtailment_wind_energy", 
      "curtailment_energy"
    ]

    const response = await client.getMarket("NEM", metrics, {
      interval: "1d",
      dateStart: formatDate(startDate),
      dateEnd: formatDate(endDate),
      primaryGrouping: "network_region",
    })

    if (!response.response.data || response.response.data.length === 0) {
      console.log("No curtailment data retrieved")
      return
    }

    // Process and display the data
    console.log(`Retrieved ${response.response.data.length} time series datasets\n`)

    // Organize data by date, region and metric
    const curtailmentByDate: Record<string, Record<string, Record<string, number>>> = {}
    const totalsByRegion: Record<string, Record<string, number>> = {}

    for (const timeseries of response.response.data) {
      const metric = timeseries.metric

      for (const result of timeseries.results) {
        // Extract region from result name
        const nameParts = result.name.split("_")
        const region = nameParts[nameParts.length - 1]

        if (!totalsByRegion[region]) {
          totalsByRegion[region] = {
            solar: 0,
            wind: 0,
            total: 0
          }
        }

        // Process each data point
        for (const [dateStr, value] of result.data) {
          if (value !== null) {
            const date = new Date(dateStr).toLocaleDateString()
            
            if (!curtailmentByDate[date]) {
              curtailmentByDate[date] = {}
            }
            if (!curtailmentByDate[date][region]) {
              curtailmentByDate[date][region] = {}
            }

            curtailmentByDate[date][region][metric] = value

            // Update totals
            if (metric === "curtailment_solar_utility_energy") {
              totalsByRegion[region].solar += value
            } else if (metric === "curtailment_wind_energy") {
              totalsByRegion[region].wind += value
            } else if (metric === "curtailment_energy") {
              totalsByRegion[region].total += value
            }
          }
        }
      }
    }

    // Display daily curtailment by region
    console.log("=".repeat(60))
    console.log("DAILY CURTAILMENT ENERGY BY REGION (MWh)")
    console.log("=".repeat(60))

    const sortedDates = Object.keys(curtailmentByDate).sort()
    
    for (const date of sortedDates) {
      console.log(`\n${date}:`)
      console.log("-".repeat(40))
      
      let dailyTotalSolar = 0
      let dailyTotalWind = 0
      let dailyTotal = 0

      const regions = Object.keys(curtailmentByDate[date]).sort()
      
      for (const region of regions) {
        const regionData = curtailmentByDate[date][region]
        const solar = regionData["curtailment_solar_utility_energy"] || 0
        const wind = regionData["curtailment_wind_energy"] || 0
        const total = regionData["curtailment_energy"] || solar + wind

        console.log(`  ${region}:`)
        console.log(`    Solar: ${solar.toFixed(1)} MWh`)
        console.log(`    Wind:  ${wind.toFixed(1)} MWh`)
        console.log(`    Total: ${total.toFixed(1)} MWh`)

        dailyTotalSolar += solar
        dailyTotalWind += wind
        dailyTotal += total
      }

      console.log(`  NEM Total:`)
      console.log(`    Solar: ${dailyTotalSolar.toFixed(1)} MWh`)
      console.log(`    Wind:  ${dailyTotalWind.toFixed(1)} MWh`)
      console.log(`    Total: ${dailyTotal.toFixed(1)} MWh`)
    }

    // Display regional totals for the period
    console.log("\n" + "=".repeat(60))
    console.log("REGIONAL TOTALS (7 Days)")
    console.log("=".repeat(60))

    const sortedRegions = Object.keys(totalsByRegion).sort()
    let grandTotalSolar = 0
    let grandTotalWind = 0
    let grandTotal = 0

    for (const region of sortedRegions) {
      const totals = totalsByRegion[region]
      console.log(`\n${region}:`)
      console.log(`  Solar Energy: ${totals.solar.toFixed(1)} MWh`)
      console.log(`  Wind Energy:  ${totals.wind.toFixed(1)} MWh`)
      console.log(`  Total Energy: ${totals.total.toFixed(1)} MWh`)
      
      if (totals.total > 0) {
        const solarPercent = (totals.solar / totals.total * 100).toFixed(1)
        const windPercent = (totals.wind / totals.total * 100).toFixed(1)
        console.log(`  Breakdown: Solar ${solarPercent}%, Wind ${windPercent}%`)
      }

      grandTotalSolar += totals.solar
      grandTotalWind += totals.wind
      grandTotal += totals.total
    }

    // Overall NEM summary
    console.log("\n" + "=".repeat(60))
    console.log("OVERALL NEM CURTAILMENT ENERGY (7 Days)")
    console.log("=".repeat(60))

    console.log(`\nTotal Solar Energy Curtailed: ${grandTotalSolar.toFixed(1)} MWh`)
    console.log(`Total Wind Energy Curtailed:  ${grandTotalWind.toFixed(1)} MWh`)
    console.log(`Total Energy Curtailed:       ${grandTotal.toFixed(1)} MWh`)

    // Daily averages
    const numDays = sortedDates.length
    if (numDays > 0) {
      console.log(`\nDaily Averages:`)
      console.log(`  Solar: ${(grandTotalSolar / numDays).toFixed(1)} MWh/day`)
      console.log(`  Wind:  ${(grandTotalWind / numDays).toFixed(1)} MWh/day`)
      console.log(`  Total: ${(grandTotal / numDays).toFixed(1)} MWh/day`)
    }

    if (grandTotal > 0) {
      const solarPercentage = (grandTotalSolar / grandTotal) * 100
      const windPercentage = (grandTotalWind / grandTotal) * 100

      console.log(`\nEnergy Curtailment Breakdown:`)
      console.log(`  Solar: ${solarPercentage.toFixed(1)}% (${grandTotalSolar.toFixed(0)} MWh)`)
      console.log(`  Wind:  ${windPercentage.toFixed(1)}% (${grandTotalWind.toFixed(0)} MWh)`)
    }

    // Find peak curtailment day
    let peakDate = ""
    let peakValue = 0
    
    for (const date of sortedDates) {
      let dailyTotal = 0
      for (const region of Object.keys(curtailmentByDate[date])) {
        dailyTotal += curtailmentByDate[date][region]["curtailment_energy"] || 0
      }
      if (dailyTotal > peakValue) {
        peakValue = dailyTotal
        peakDate = date
      }
    }

    if (peakDate) {
      console.log(`\nPeak Curtailment Day: ${peakDate} with ${peakValue.toFixed(1)} MWh`)
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