import { describe, expect, test } from "vitest"

import { createDataTable } from "../src/datatable"
import {
  DataInterval,
  DataPrimaryGrouping,
  DataSecondaryGrouping,
  INetworkTimeSeries,
  ITimeSeriesResult,
  Metric,
  NetworkCode,
} from "../src/types"

const TEST_FIXTURE: INetworkTimeSeries = {
  network_code: "NEM" as NetworkCode,
  metric: "energy" as Metric,
  unit: "MWh",
  interval: "1d" as DataInterval,
  start: "2025-01-15T00:00:00",
  end: "2025-01-16T00:00:00",
  groupings: ["network_region" as DataPrimaryGrouping, "renewable" as DataSecondaryGrouping] as DataSecondaryGrouping[],
  results: [
    {
      name: "NSW1_carbon",
      date_start: "2025-01-15T00:00:00",
      date_end: "2025-01-16T00:00:00",
      columns: {
        network_region: "NSW1",
        renewable: false,
      },
      data: [
        ["2025-01-15T00:00:00", 152436.55],
        ["2025-01-16T00:00:00", 133951.58],
      ],
    },
    {
      name: "NSW1_renewable",
      date_start: "2025-01-15T00:00:00",
      date_end: "2025-01-16T00:00:00",
      columns: {
        network_region: "NSW1",
        renewable: true,
      },
      data: [
        ["2025-01-15T00:00:00", 56561.254],
        ["2025-01-16T00:00:00", 49907.071],
      ],
    },
    {
      name: "QLD1_carbon",
      date_start: "2025-01-15T00:00:00",
      date_end: "2025-01-16T00:00:00",
      columns: {
        network_region: "QLD1",
        renewable: false,
      },
      data: [
        ["2025-01-15T00:00:00", 143924.26],
        ["2025-01-16T00:00:00", 147318.35],
      ],
    },
    {
      name: "QLD1_renewable",
      date_start: "2025-01-15T00:00:00",
      date_end: "2025-01-16T00:00:00",
      columns: {
        network_region: "QLD1",
        renewable: true,
      },
      data: [
        ["2025-01-15T00:00:00", 35555.221],
        ["2025-01-16T00:00:00", 36847.945],
      ],
    },
    {
      name: "SA1_carbon",
      date_start: "2025-01-15T00:00:00",
      date_end: "2025-01-16T00:00:00",
      columns: {
        network_region: "SA1",
        renewable: false,
      },
      data: [
        ["2025-01-15T00:00:00", 5248.0695],
        ["2025-01-16T00:00:00", 4837.0315],
      ],
    },
    {
      name: "SA1_renewable",
      date_start: "2025-01-15T00:00:00",
      date_end: "2025-01-16T00:00:00",
      columns: {
        network_region: "SA1",
        renewable: true,
      },
      data: [
        ["2025-01-15T00:00:00", 24352.991],
        ["2025-01-16T00:00:00", 19040.688],
      ],
    },
    {
      name: "TAS1_carbon",
      date_start: "2025-01-15T00:00:00",
      date_end: "2025-01-16T00:00:00",
      columns: {
        network_region: "TAS1",
        renewable: false,
      },
      data: [
        ["2025-01-15T00:00:00", 2.1677],
        ["2025-01-16T00:00:00", 0],
      ],
    },
    {
      name: "TAS1_renewable",
      date_start: "2025-01-15T00:00:00",
      date_end: "2025-01-16T00:00:00",
      columns: {
        network_region: "TAS1",
        renewable: true,
      },
      data: [
        ["2025-01-15T00:00:00", 16603.804],
        ["2025-01-16T00:00:00", 14673.167],
      ],
    },
    {
      name: "VIC1_carbon",
      date_start: "2025-01-15T00:00:00",
      date_end: "2025-01-16T00:00:00",
      columns: {
        network_region: "VIC1",
        renewable: false,
      },
      data: [
        ["2025-01-15T00:00:00", 73474.457],
        ["2025-01-16T00:00:00", 78333.169],
      ],
    },
    {
      name: "VIC1_renewable",
      date_start: "2025-01-15T00:00:00",
      date_end: "2025-01-16T00:00:00",
      columns: {
        network_region: "VIC1",
        renewable: true,
      },
      data: [
        ["2025-01-15T00:00:00", 63888.87],
        ["2025-01-16T00:00:00", 43028.263],
      ],
    },
  ] as ITimeSeriesResult[],
  network_timezone_offset: "+10:00",
}

describe("DataTable Renewable", () => {
  test("transforms API response into DataTable", () => {
    const table = createDataTable([TEST_FIXTURE])

    const metrics = table.getMetrics()
    expect(metrics.get("energy")).toBe("MWh")
    expect(table.getGroupings()).toEqual(["network_region", "renewable"])

    const rows = table.getRows()
    expect(rows.length).toBe(20) // 10 regions × 2 days

    // Check first row structure
    const firstRow = rows[0]
    expect(firstRow.interval).toBeInstanceOf(Date)
    expect(firstRow.network_region).toBe("NSW1")
    expect(firstRow.renewable).toBe(false)
    expect(firstRow.energy).toBe(152436.55)
  })

  test("filters rows by condition", () => {
    const table = createDataTable([TEST_FIXTURE])
    const renewableOnly = table.filter((row) => row.renewable === true)

    expect(renewableOnly.getRows().length).toBe(10) // 5 regions × 2 days
    expect(renewableOnly.getRows().every((row) => row.renewable === true)).toBe(true)
  })

  test("groups by network_region", () => {
    const table = createDataTable([TEST_FIXTURE])
    const byRegion = table.groupBy(["network_region"], "sum")

    const rows = byRegion.getRows()
    expect(rows.length).toBe(5) // 5 regions

    // Check NSW1 total
    const nsw = rows.find((r) => r.network_region === "NSW1")
    expect(nsw?.energy).toBeCloseTo(392856.455, 3) // Sum of all NSW1 values
  })

  test("groups by renewable status", () => {
    const table = createDataTable([TEST_FIXTURE])
    const byRenewable = table.groupBy(["renewable"], "sum")

    const rows = byRenewable.getRows()
    expect(rows.length).toBe(2) // renewable and non-renewable

    const renewable = rows.find((r) => r.renewable === true)
    const nonRenewable = rows.find((r) => r.renewable === false)

    expect(renewable).toBeDefined()
    expect(nonRenewable).toBeDefined()
  })

  test("sorts rows by multiple columns", () => {
    const table = createDataTable([TEST_FIXTURE])
    const sorted = table.sortBy(["network_region", "renewable"])
    const rows = sorted.getRows()

    expect(rows[0].network_region).toBe("NSW1")
    expect(rows[0].renewable).toBe(false)
  })

  test("selects specific columns", () => {
    const table = createDataTable([TEST_FIXTURE])
    const selected = table.select(["interval", "network_region", "energy"])
    const row = selected.getRows()[0]

    expect(Object.keys(row)).toEqual(["interval", "network_region", "energy"])
    expect(row.renewable).toBeUndefined()
  })

  test("calculates renewable percentage by region", () => {
    const table = createDataTable([TEST_FIXTURE])

    // Group by region and renewable status
    const grouped = table.groupBy(["network_region", "renewable"], "sum")
    const rows = grouped.getRows()

    // Calculate TAS1 renewable percentage
    const tasTotal = rows.filter((r) => r.network_region === "TAS1").reduce((sum, r) => sum + (r.energy as number), 0)

    const tasRenewable = rows.find((r) => r.network_region === "TAS1" && r.renewable === true)?.energy as number

    const tasRenewablePercentage = (tasRenewable / tasTotal) * 100
    expect(tasRenewablePercentage).toBeCloseTo(99.993, 3) // Tasmania is almost 100% renewable
  })
})
