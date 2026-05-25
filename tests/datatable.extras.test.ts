import { describe, expect, it } from "vitest"

import { DataTable, createNetworkDate } from "../src"
import type { INetworkTimeSeries } from "../src/types"

const fixture: INetworkTimeSeries[] = [
  {
    network_code: "NEM",
    metric: "energy",
    unit: "MWh",
    interval: "1d",
    start: "2024-01-01T00:00:00",
    end: "2024-01-03T00:00:00",
    groupings: ["network_region"],
    results: [
      {
        name: "nsw1",
        date_start: "2024-01-01T00:00:00",
        date_end: "2024-01-03T00:00:00",
        columns: { network_region: "NSW1" },
        data: [
          ["2024-01-01T00:00:00", 100],
          ["2024-01-02T00:00:00", 200],
        ],
      },
      {
        name: "vic1",
        date_start: "2024-01-01T00:00:00",
        date_end: "2024-01-03T00:00:00",
        columns: { network_region: "VIC1" },
        data: [
          ["2024-01-01T00:00:00", 150],
          ["2024-01-02T00:00:00", 250],
        ],
      },
    ],
    network_timezone_offset: "+10:00",
  },
  {
    network_code: "NEM",
    metric: "power",
    unit: "MW",
    interval: "1d",
    start: "2024-01-01T00:00:00",
    end: "2024-01-03T00:00:00",
    groupings: ["network_region"],
    results: [
      {
        name: "nsw1_p",
        date_start: "2024-01-01T00:00:00",
        date_end: "2024-01-03T00:00:00",
        columns: { network_region: "NSW1" },
        data: [
          ["2024-01-01T00:00:00", 10],
          ["2024-01-02T00:00:00", 20],
        ],
      },
    ],
    network_timezone_offset: "+10:00",
  },
]

describe("DataTable.fromNetworkTimeSeries", () => {
  it("populates rows, metrics, and groupings", () => {
    const table = DataTable.fromNetworkTimeSeries(fixture)
    expect(table.getGroupings()).toEqual(["network_region"])
    expect(table.getMetrics().get("energy")).toBe("MWh")
    expect(table.getMetrics().get("power")).toBe("MW")
    expect(table.getRows().length).toBeGreaterThanOrEqual(3)
  })
})

describe("DataTable.getLatestTimestamp", () => {
  it("returns the max interval timestamp", () => {
    const table = DataTable.fromNetworkTimeSeries(fixture)
    const expected = createNetworkDate("2024-01-02T00:00:00").getTime()
    expect(table.getLatestTimestamp()).toBe(expected)
  })

  it("caches the result", () => {
    const table = DataTable.fromNetworkTimeSeries(fixture)
    const first = table.getLatestTimestamp()
    const second = table.getLatestTimestamp()
    expect(first).toBe(second)
  })
})

describe("DataTable.select", () => {
  it("keeps only requested columns and prunes metrics map", () => {
    const table = DataTable.fromNetworkTimeSeries(fixture)
    const projected = table.select(["network_region", "energy"])
    expect(projected.getMetrics().has("energy")).toBe(true)
    expect(projected.getMetrics().has("power")).toBe(false)
    expect(projected.getGroupings()).toEqual(["network_region"])
    const row = projected.getRows()[0]
    expect("energy" in row).toBe(true)
    expect("power" in row).toBe(false)
  })
})
