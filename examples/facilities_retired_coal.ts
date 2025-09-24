/**
 * Example showing retired coal capacity grouped by year
 *
 * This example demonstrates:
 * 1. Fetching retired coal facilities (black and brown coal)
 * 2. Grouping retired capacity by closure year
 * 3. Displaying results as a table
 *
 * will output:
 *

┌────┬───────┬────────┐
│    │ Year  │ MW     │
├────┼───────┼────────┤
│  0 │ 1999  │ 240.0  │
│  1 │ 2000  │ 0.0    │
│  2 │ 2001  │ 90.0   │
│  3 │ 2002  │ 0.0    │
│  4 │ 2003  │ 0.0    │
│  5 │ 2004  │ 0.0    │
│  6 │ 2005  │ 0.0    │
│  7 │ 2006  │ 0.0    │
│  8 │ 2007  │ 0.0    │
│  9 │ 2008  │ 0.0    │
│ 10 │ 2009  │ 0.0    │
│ 11 │ 2010  │ 250.0  │
│ 12 │ 2011  │ 125.0  │
│ 13 │ 2012  │ 911.0  │
│ 14 │ 2013  │ 0.0    │
│ 15 │ 2014  │ 1345.0 │
│ 16 │ 2015  │ 595.0  │
│ 17 │ 2016  │ 970.0  │
│ 18 │ 2017  │ 1880.0 │
│ 19 │ 2018  │ 0.0    │
│ 20 │ 2019  │ 0.0    │
│ 21 │ 2020  │ 0.0    │
│ 22 │ 2021  │ 0.0    │
│ 23 │ 2022  │ 695.8  │
│ 24 │ 2023  │ 1500.0 │
│ 25 │ 2024  │ 0.0    │
│ 26 │ 2025  │ 0.0    │
│ 27 │ TOTAL │ 8601.8 │
└────┴───────┴────────┘

 */

/* global console, process */

import { OpenElectricityClient } from "../src"

async function main(): Promise<void> {
  const client = new OpenElectricityClient()

  // Get retired coal facilities
  const { response } = await client.getFacilities({
    status_id: ["retired"],
    fueltech_id: ["coal_black", "coal_brown"],
  })

  // Group by closure year
  const byYear = response.data
    .flatMap((facility) =>
      facility.units
        .filter((unit) => unit.closure_date)
        .map((unit) => ({
          year: new Date(unit.closure_date as string).getFullYear(),
          mw: unit.capacity_registered || 0,
        })),
    )
    .reduce((acc: Record<number, number>, unit) => {
      acc[unit.year] = (acc[unit.year] || 0) + unit.mw
      return acc
    }, {})

  // Get year range up to current year
  const years = Object.keys(byYear).map(Number)
  const minYear = Math.min(...years)
  const maxYear = new Date().getFullYear()

  // Create table data with all years filled in
  const rows = []
  for (let year = minYear; year <= maxYear; year++) {
    rows.push({
      Year: year.toString(),
      MW: (byYear[year] || 0).toFixed(1),
    })
  }

  // Add total row
  const total = Object.values(byYear).reduce((sum, mw) => sum + mw, 0)
  rows.push({ Year: "TOTAL", MW: total.toFixed(1) })

  console.table(rows)
}

main().catch((error: Error) => {
  console.error(`Error: ${error.message}`)
  process.exit(1)
})
