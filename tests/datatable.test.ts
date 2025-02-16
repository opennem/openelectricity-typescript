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

const TEST_FIXTURE: INetworkTimeSeries[] = [
  {
    network_code: "NEM" as NetworkCode,
    metric: "energy" as Metric,
    unit: "MWh",
    interval: "1d" as DataInterval,
    start: "2025-01-15T00:00:00",
    end: "2025-01-16T00:00:00",
    groupings: [
      "network_region" as DataPrimaryGrouping,
      "renewable" as DataSecondaryGrouping,
    ] as DataSecondaryGrouping[],
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
  },
]

describe("DataTable", () => {
  test("should create table from network time series", () => {
    const table = createDataTable(TEST_FIXTURE)
    expect(table).toBeDefined()
    expect(table.getRows()).toHaveLength(20) // 10 regions × 2 days
    expect(table.getGroupings()).toEqual(["network_region", "renewable"])
    expect(table.getMetrics().size).toBe(1)
  })

  test("should filter rows by condition", () => {
    const table = createDataTable(TEST_FIXTURE)
    const filtered = table.filter((row) => row.renewable === true)
    expect(filtered.getRows()).toHaveLength(10) // 5 regions × 2 days
    expect(filtered.getRows().every((row) => row.renewable === true)).toBe(true)
  })

  test("should group by columns", () => {
    const table = createDataTable(TEST_FIXTURE)
    const grouped = table.groupBy(["renewable"], "sum")
    expect(grouped.getRows()).toHaveLength(2) // renewable and non-renewable
    expect(grouped.getGroupings()).toEqual(["renewable"])
  })

  test("should sort by columns", () => {
    const table = createDataTable(TEST_FIXTURE)
    const sorted = table.sortBy(["energy"], false)
    expect(sorted.getRows()[0].energy).toBeGreaterThan(sorted.getRows()[1].energy as number)
  })

  test("should calculate statistics", () => {
    const table = createDataTable(TEST_FIXTURE)
    const stats = table.describe()
    expect(stats.energy).toBeDefined()
    expect(stats.energy.mean).toBeGreaterThan(0)
  })

  test("should handle multiple metrics", () => {
    const table = createDataTable(TEST_FIXTURE)
    const rows = table.getRows()
    expect(rows[0].energy).toBeDefined()
    expect(table.getMetrics().get("energy")).toBe("MWh")
  })
})
