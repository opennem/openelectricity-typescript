/**
 * Example: Facility Pollution Data
 * Shows pollution emissions per year for Loy Yang A power station
 * Uses the new /pollution/facilities endpoint
 */

import OpenElectricityClient from "../src"

async function main() {
  const client = new OpenElectricityClient()
  const facilityCode = "LOYYANGA"

  // Display facility info
  console.log("\n=== Loy Yang A Power Station ===")
  console.log("Code: LOYYANGA")
  console.log("Location: Victoria, NEM")
  console.log("Fuel Type: Brown Coal")
  console.log("Capacity: ~2,210 MW")

  // Get pollution data - defaults to air pollutants category
  // The endpoint is now at /pollution/facilities
  const pollution = await client.getFacilityPollution({
    facility_code: [facilityCode],
    // No category specified - defaults to air_pollutant
  })

  if (!pollution.response.data.length) {
    console.log("\nNo pollution data available")
    return
  }

  // Aggregate pollution by year
  const pollutionByYear: Record<number, Record<string, number>> = {}
  const pollutantCodeToLabel: Record<string, string> = {}
  
  for (const timeseries of pollution.response.data) {
    for (const result of timeseries.results) {
      const pollutantCode = (result.columns.pollutant_code) as string
      const pollutantLabel = (result.columns.pollutant_label || result.columns.pollutant_name) as string
      
      // Store mapping for later reference
      pollutantCodeToLabel[pollutantCode] = pollutantLabel
      
      for (const [dateStr, value] of result.data) {
        if (value !== null) {
          const year = new Date(dateStr).getFullYear()
          if (!pollutionByYear[year]) pollutionByYear[year] = {}
          // Convert kg to tonnes and use code as key
          pollutionByYear[year][pollutantCode] = value / 1000
        }
      }
    }
  }

  // Display pollution table
  console.log("\n=== Annual Air Pollution Emissions (tonnes) ===")
  
  const years = Object.keys(pollutionByYear).sort().reverse()
  const pollutants = [...new Set(Object.values(pollutionByYear).flatMap(Object.keys))].sort()
  
  // Show top 5 pollutants by total emissions
  const pollutantTotals = pollutants.map(p => ({
    code: p,
    label: pollutantCodeToLabel[p] || p,
    total: Object.values(pollutionByYear).reduce((sum, year) => sum + (year[p] || 0), 0)
  })).sort((a, b) => b.total - a.total)
  
  const topPollutants = pollutantTotals.slice(0, 5)
  const topPollutantCodes = topPollutants.map(p => p.code)
  
  // Create table header with pollutant codes
  const yearWidth = 6
  const colWidth = 12
  console.log("\n" + "Year".padEnd(yearWidth) + topPollutantCodes.map(code => {
    // Use uppercase codes for headers
    return code.toUpperCase().padStart(colWidth)
  }).join(""))
  console.log("-".repeat(yearWidth + colWidth * topPollutantCodes.length))
  
  // Display data rows for recent years
  for (const year of years.slice(0, 5)) {
    const row = [year.padEnd(yearWidth)]
    for (const code of topPollutantCodes) {
      const value = pollutionByYear[+year][code]
      let formatted: string
      if (value) {
        // Format based on magnitude
        if (value >= 1000000) {
          formatted = `${(value / 1000000).toFixed(1)}M`
        } else if (value >= 1000) {
          formatted = `${(value / 1000).toFixed(1)}k`
        } else if (value >= 100) {
          formatted = value.toFixed(0)
        } else if (value >= 10) {
          formatted = value.toFixed(1)
        } else {
          formatted = value.toFixed(2)
        }
      } else {
        formatted = "-"
      }
      row.push(formatted.padStart(colWidth))
    }
    console.log(row.join(""))
  }
  
  // Summary statistics
  console.log(`\nSummary:`)
  console.log(`- Showing top ${topPollutants.length} air pollutants by total emissions`)
  console.log(`- Total pollutants tracked: ${pollutants.length}`)
  console.log(`- Data available: ${years[years.length - 1]}-${years[0]}`)
  
  // Show totals for top pollutants with both code and label
  console.log(`\nTotal Emissions (${years[years.length - 1]}-${years[0]}):`)
  for (const p of topPollutants) {
    const totalFormatted = p.total >= 1000000 
      ? `${(p.total / 1000000).toFixed(1)}M tonnes`
      : p.total >= 1000
      ? `${(p.total / 1000).toFixed(1)}k tonnes`
      : `${p.total.toFixed(0)} tonnes`
    console.log(`- ${p.code.toUpperCase()} (${p.label}): ${totalFormatted}`)
  }
}

main().catch(console.error)