/**
 * Test script: Fetch COLLIE_ESR5 bidirectional battery power data (last 3 days)
 * Run: bun run examples/bidirectional_battery_test.ts
 */

import { OpenElectricityClient } from "../src"

const client = new OpenElectricityClient({
  baseUrl: "https://api.openelectricity.org.au/v4",
})

const now = new Date()
const start = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
const formatDate = (d: Date) => d.toISOString().slice(0, 19)

const { response } = await client.getFacilityData("NEM", "BALBESS", ["power"], {
  interval: "5m",
  dateStart: formatDate(start),
  dateEnd: formatDate(now),
})

const result = response.data[0].results.find((r) => r.columns?.unit_code === "BALB1")
if (!result) throw new Error("BALB1 not found")

const values = result.data.map((d: any) => d[1] ?? 0)
const positive = values.filter((v) => v > 0).length
const negative = values.filter((v) => v < 0).length

const firstTs = result.data[0][0]
const lastTs = result.data[result.data.length - 1][0]

console.log(`BALB1 - NEM (bidirectional battery):`)
console.log(`  Data points: ${values.length}`)
console.log(`  First: ${firstTs}`)
console.log(`  Last:  ${lastTs}`)
console.log(`  Now:   ${now.toISOString()}`)
console.log(`  Positive (discharge): ${positive}`)
console.log(`  Negative (charge): ${negative}`)
console.log(`  Range: ${Math.min(...values).toFixed(1)} to ${Math.max(...values).toFixed(1)} MW`)
