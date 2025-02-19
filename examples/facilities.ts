/**
 * Example showing how to get facility data from the OpenElectricity API
 *
 * This example demonstrates:
 * 1. Getting all facilities
 * 2. Filtering facilities by status and fueltech
 * 3. Using RecordTable to analyze facility-level statistics
 */

/* global console, process */

import { OpenElectricityClient } from "@openelectricity/client"

async function main(): Promise<void> {
  // Initialize client
  const client = new OpenElectricityClient()

  // Get operating coal facilities
  console.warn("Getting operating coal facilities...")
  const { table } = await client.getFacilities({
    status_id: ["operating"],
    fueltech_id: ["coal_black", "coal_brown"],
  })

  // 1. Available columns
  console.warn("\nAvailable columns:")
  console.warn(table.getColumns())

  // 2. Unique networks and regions
  console.warn("\nNetworks:")
  console.warn(table.unique("facility_network"))
  console.warn("\nRegions:")
  console.warn(table.unique("facility_region"))

  // 3. Largest facilities by total capacity
  console.warn("\nLargest facilities by total capacity:")
  const facilityCapacities = table.getRecords().reduce((acc, record) => {
    const facility = record.facility_code
    const capacity = (record.unit_capacity as number) || 0
    acc.set(facility, (acc.get(facility) || 0) + capacity)
    return acc
  }, new Map<string, number>())

  const largestFacilities = table
    .getRecords()
    .filter(
      (record, index, self) =>
        // Only keep first occurrence of each facility
        index === self.findIndex((r) => r.facility_code === record.facility_code)
    )
    .map((record) => ({
      facility_name: record.facility_name,
      facility_code: record.facility_code,
      total_capacity: facilityCapacities.get(record.facility_code) || 0,
      network_region: record.facility_region,
    }))
    .sort((a, b) => b.total_capacity - a.total_capacity)
    .slice(0, 5)

  console.warn(JSON.stringify(largestFacilities, null, 2))

  // 4. Average emissions factor by facility
  console.warn("\nHighest emissions facilities (average CO2 factor):")
  const facilityEmissions = table.getRecords().reduce((acc, record) => {
    const facility = record.facility_code
    if (!acc.has(facility)) {
      acc.set(facility, {
        sum: 0,
        count: 0,
        name: record.facility_name,
        region: record.facility_region,
      })
    }
    const ef = record.unit_emissions_factor as number
    if (ef !== null) {
      const stats = acc.get(facility)
      if (stats) {
        stats.sum += ef
        stats.count++
      }
    }
    return acc
  }, new Map<string, { sum: number; count: number; name: string; region: string }>())

  const highEmissionsFacilities = Array.from(facilityEmissions.entries())
    .map(([code, stats]) => ({
      facility_name: stats.name,
      facility_code: code,
      average_emissions_factor: stats.count > 0 ? stats.sum / stats.count : null,
      network_region: stats.region,
    }))
    .filter((f) => f.average_emissions_factor !== null)
    .sort((a, b) => (b.average_emissions_factor || 0) - (a.average_emissions_factor || 0))
    .slice(0, 5)

  console.warn(JSON.stringify(highEmissionsFacilities, null, 2))

  // 5. Most recently active facilities
  console.warn("\nMost recently active facilities:")
  const facilityLastSeen = table.getRecords().reduce((acc, record) => {
    const facility = record.facility_code
    const lastSeen = record.unit_last_seen as string
    if (!acc.has(facility) || lastSeen > (acc.get(facility)?.last_seen || "")) {
      acc.set(facility, {
        name: record.facility_name,
        last_seen: lastSeen,
        region: record.facility_region,
      })
    }
    return acc
  }, new Map<string, { name: string; last_seen: string; region: string }>())

  const recentFacilities = Array.from(facilityLastSeen.entries())
    .map(([code, info]) => ({
      facility_name: info.name,
      facility_code: code,
      last_seen: info.last_seen,
      network_region: info.region,
    }))
    .sort((a, b) => b.last_seen.localeCompare(a.last_seen))
    .slice(0, 5)

  console.warn(JSON.stringify(recentFacilities, null, 2))
}

main().catch((error: Error) => {
  console.error(`Error: ${error.message}`)
  process.exit(1)
})
