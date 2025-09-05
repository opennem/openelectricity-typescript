#!/usr/bin/env bun

/**
 * Example showing daily battery storage levels for BALBESS for all of August 2025
 */

import { OpenElectricityClient } from "../src"
import type { DataInterval } from "../src/types"

// Use local API for testing
const client = new OpenElectricityClient({
  apiKey: process.env.OPENELECTRICITY_API_KEY,
  baseURL: "http://localhost:8000"
})

async function fetchAugustBatteryData() {
  console.log("Fetching daily battery storage data for BALBESS for August 2025...")
  
  // Set date range for all of August 2025
  const startDate = new Date('2025-08-01T00:00:00')
  const endDate = new Date('2025-08-31T23:59:59')
  
  try {
    // Fetch storage battery data for BALBESS facility with daily interval
    const response = await client.getFacilityData(
      "NEM",
      "BALBESS",  // facility code
      ["storage_battery"],  // metrics
      {
        interval: "1d" as DataInterval,  // Daily interval
        dateStart: startDate.toISOString(),
        dateEnd: endDate.toISOString()
      }
    )

    // The API returns data nested under response.response.data
    const apiData = (response as any).response?.data || response.data
    
    if (!apiData || apiData.length === 0) {
      console.log("No data available for BALBESS battery storage in August 2025")
      return
    }

    const storageData = apiData[0] // First (and only) metric is storage_battery
    
    console.log("\n=== Daily Battery Storage Levels for BALBESS - August 2025 ===")
    console.log(`Network: ${storageData.network_code}`)
    console.log(`Metric: ${storageData.metric}`)
    console.log(`Unit: ${storageData.unit}`)
    console.log(`Period: ${storageData.date_start || storageData.start} to ${storageData.date_end || storageData.end}`)
    console.log(`Interval: ${storageData.interval}`)
    
    // Display daily storage levels for each unit
    if (storageData.results && storageData.results.length > 0) {
      for (const result of storageData.results) {
        console.log(`\n--- ${result.name} ---`)
        console.log(`Unit Code: ${result.columns.unit_code || 'N/A'}`)
        
        if (result.data && result.data.length > 0) {
          // Calculate statistics for the month
          const values = result.data
            .map(([_, value]) => value)
            .filter((v): v is number => v !== null)
          
          if (values.length > 0) {
            const maxStorage = Math.max(...values)
            const minStorage = Math.min(...values)
            const avgStorage = values.reduce((sum, v) => sum + v, 0) / values.length
            
            console.log(`\nAugust 2025 Statistics:`)
            console.log(`  Maximum Daily Avg: ${maxStorage.toFixed(2)} MWh`)
            console.log(`  Minimum Daily Avg: ${minStorage.toFixed(2)} MWh`)
            console.log(`  Monthly Average: ${avgStorage.toFixed(2)} MWh`)
            console.log(`  Days with data: ${values.length}`)
            
            // Show daily values
            console.log(`\nDaily Storage Levels:`)
            console.log(`Date       | Storage (MWh) | Bar Chart`)
            console.log(`-----------|---------------|` + '-'.repeat(30))
            
            // Sort data by date
            const sortedData = [...result.data].sort((a, b) => {
              const dateA = new Date(a[0])
              const dateB = new Date(b[0])
              return dateA.getTime() - dateB.getTime()
            })
            
            for (const [timestamp, value] of sortedData) {
              const date = new Date(timestamp)
              const dateStr = date.toLocaleDateString('en-AU', {
                month: '2-digit',
                day: '2-digit'
              })
              
              if (value !== null) {
                // Create a simple bar chart
                const barLength = Math.round((value / maxStorage) * 25)
                const bar = '█'.repeat(barLength)
                console.log(`Aug ${dateStr} | ${value.toFixed(2).padStart(13)} | ${bar}`)
              } else {
                console.log(`Aug ${dateStr} | ${' '.repeat(13)} | No data`)
              }
            }
          }
        }
      }
    }
    
    // Create a combined chart for all units
    console.log("\n=== Combined Storage Level Chart - August 2025 ===")
    if (storageData.results && storageData.results.length > 0) {
      // Find the maximum value across all units
      let maxValue = 0
      const allData: Map<string, Map<string, number | null>> = new Map()
      
      for (const result of storageData.results) {
        const unitCode = result.columns.unit_code || result.name
        const unitData = new Map<string, number | null>()
        
        for (const [timestamp, value] of result.data) {
          const date = new Date(timestamp)
          const dateKey = date.toISOString().split('T')[0]
          unitData.set(dateKey, value)
          if (value !== null && value > maxValue) {
            maxValue = value
          }
        }
        allData.set(unitCode, unitData)
      }
      
      // Create chart
      const chartHeight = 15
      const dates = Array.from(new Set(
        Array.from(allData.values())
          .flatMap(unitData => Array.from(unitData.keys()))
      )).sort()
      
      console.log(`\nMax: ${maxValue.toFixed(0)} MWh`)
      
      for (let row = chartHeight; row >= 0; row--) {
        const threshold = (row / chartHeight) * maxValue
        let line = row === 0 ? '  0 |' : `${(threshold).toFixed(0).padStart(4)} |`
        
        for (const date of dates) {
          let hasBar = false
          for (const [_, unitData] of allData) {
            const value = unitData.get(date)
            if (value !== null && value !== undefined && value >= threshold) {
              hasBar = true
              break
            }
          }
          line += hasBar ? '█' : ' '
        }
        console.log(line)
      }
      
      // X-axis
      console.log('     └' + '─'.repeat(dates.length))
      console.log('      ' + dates.map((_, i) => {
        if (i === 0) return '1'
        if (i === dates.length - 1) return '31'
        if (i === 14) return '15'
        return ' '
      }).join(''))
      console.log('                    August 2025')
      
      // Legend
      console.log('\nUnits:')
      for (const [unitCode] of allData) {
        console.log(`  - ${unitCode}`)
      }
    }
    
  } catch (error) {
    console.error("Error fetching battery storage data:", error)
  }
}

// Run the example
fetchAugustBatteryData()