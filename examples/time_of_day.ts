/**
 * Example showing generation patterns by time of day
 * This example demonstrates:
 * - Fetching hourly power data
 * - Analyzing generation patterns by hour
 * - Calculating percentage contribution by fuel technology group
 */

import { DataTable, OpenElectricityClient } from "openelectricity"

async function main(): Promise<void> {
  // Initialize client
  const client = new OpenElectricityClient()

  // Set the date range for the last week, ending at midnight yesterday
  const today = new Date()
  const endDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  ) // midnight today
  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - 7) // midnight 7 days ago
  endDate.setDate(endDate.getDate() - 1) // midnight yesterday

  try {
    // Fetch power data with fuel technology grouping
    const { datatable } = await client.getNetworkData("NEM", ["power"], {
      dateStart: startDate.toISOString(),
      dateEnd: endDate.toISOString(),
      interval: "5m",
      secondaryGrouping: ["fueltech_group"],
    })

    if (!datatable) {
      throw new Error("No data returned")
    }

    // Add hour of day column to each row
    const withHourOfDay = datatable.getRows().map((row) => ({
      ...row,
      hour: row.interval.getHours(),
    }))

    // Create new DataTable with hour column
    const hourlyTable = new DataTable(
      withHourOfDay,
      [...datatable.getGroupings(), "hour"],
      datatable.getMetrics(),
    )

    // Group by fuel technology group and hour, calculate mean power
    const byFueltechAndHour = hourlyTable
      .groupBy(["fueltech_group", "hour"], "mean")
      .sortBy(["fueltech_group", "hour"])

    // Get unique fuel technology groups and sort them
    const fueltechGroups = Array.from(
      new Set(
        byFueltechAndHour.getRows().map((row) => row.fueltech_group as string),
      ),
    ).sort()

    // Create a table showing percentage contribution by fuel technology group for each hour
    const hourlyContributions = Array.from({ length: 24 }, (_, hour) => {
      // Get all rows for this hour
      const hourRows = byFueltechAndHour
        .filter((row) => row.hour === hour)
        .getRows()

      // Calculate total power for this hour
      const totalPower = hourRows.reduce(
        (sum, row) => sum + ((row.power as number) || 0),
        0,
      )

      // Calculate percentages for each fuel technology group
      const hourData = hourRows.reduce(
        (acc, row) => {
          const percentage =
            totalPower > 0
              ? (((row.power as number) || 0) / totalPower) * 100
              : 0
          acc[row.fueltech_group as string] = percentage.toFixed(1)
          return acc
        },
        {} as Record<string, string>,
      )

      // Verify total percentage
      const totalPercentage = Object.values(hourData).reduce(
        (sum, val) => sum + Number.parseFloat(val),
        0,
      )
      if (Math.abs(totalPercentage - 100) > 0.1) {
        console.warn(
          `Hour ${hour}: Total percentage is ${totalPercentage.toFixed(1)}%`,
        )
      }

      return {
        Hour: `${hour.toString().padStart(2, "0")}:00`,
        ...Object.fromEntries(
          fueltechGroups.map((group) => [
            group,
            hourData[group] ? `${hourData[group]}%` : "0.0%",
          ]),
        ),
      }
    })

    // Display the table
    console.log(
      "\nPercentage Contribution by Fuel Technology Group and Hour of Day",
    )
    console.log("==========================================================")
    console.table(hourlyContributions)

    // Find peak and minimum demand hours
    const totalByHour = new Map<number, number>()
    for (let hour = 0; hour < 24; hour++) {
      const hourRows = byFueltechAndHour
        .filter((row) => row.hour === hour)
        .getRows()
      const totalPower = hourRows.reduce(
        (sum, row) => sum + ((row.power as number) || 0),
        0,
      )
      totalByHour.set(hour, totalPower)
    }

    const peak = Array.from(totalByHour.entries()).reduce(
      (max, [hour, power]) => (power > max.power ? { hour, power } : max),
      { hour: 0, power: 0 },
    )
    const min = Array.from(totalByHour.entries()).reduce(
      (min, [hour, power]) => (power < min.power ? { hour, power } : min),
      { hour: 0, power: totalByHour.get(0) || Number.POSITIVE_INFINITY },
    )

    console.log("\nDemand Patterns:")
    console.log("================")
    console.log(
      `Peak Demand Hour: ${peak.hour.toString().padStart(2, "0")}:00 (${peak.power.toFixed(0)} MW)`,
    )
    console.log(
      `Minimum Demand Hour: ${min.hour.toString().padStart(2, "0")}:00 (${min.power.toFixed(0)} MW)`,
    )
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error analyzing time of day patterns:", error.message)
    } else {
      console.error("Unknown error occurred")
    }
    process.exit(1)
  }
}

main()
