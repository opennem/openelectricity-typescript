/**
 * Simple example: NEM renewable proportion for each region (daily)
 */

import { OpenElectricityClient } from "../src"

// For local testing - update these values
const client = new OpenElectricityClient()

// Get renewable proportion for NEM on 2025-10-05 (daily by region)
client
  .getMarket("NEM", ["renewable_proportion"], {
    interval: "1d",
    dateStart: "2025-10-05T00:00:00",
    dateEnd: "2025-10-06T00:00:00",
    primaryGrouping: "network_region",
  })
  .then((response) => {
    const metric = response.response.data[0]

    console.log("\nNEM Renewable Proportion - 2025-10-05")
    console.log("=".repeat(40))
    console.log("Region".padEnd(15), "Proportion (%)")
    console.log("-".repeat(40))

    metric.results.forEach((result) => {
      const region = result.columns.network_region || result.name
      const proportion = result.data[0]?.[1] || 0
      console.log(
        region?.toString().padEnd(25).toLowerCase(),
        proportion.toFixed(2),
      )
    })
    console.log("=".repeat(40))
  })
  .catch(console.error)
