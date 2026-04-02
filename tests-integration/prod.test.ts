/**
 * End-to-end tests against prod API
 * Run with: OPENELECTRICITY_API_KEY=oe_xxx bun run vitest run tests-e2e/
 */
import { describe, expect, it } from "vitest"
import { OpenElectricityClient, OpenElectricityError } from "../src/client"
import type {
  DataMetric,
  MarketMetric,
} from "../src/types"

const API_KEY = process.env.OPENELECTRICITY_API_KEY || ""
const client = new OpenElectricityClient({ apiKey: API_KEY })

describe("E2E: getCurrentUser", () => {
  it("returns user info", async () => {
    const result = await client.getCurrentUser()
    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
    console.log(`  User: ${(result.data as any).full_name}, Plan: ${(result.data as any).plan}`)
  })
})

describe("E2E: getFacilities", () => {
  it("returns all facilities", async () => {
    const result = await client.getFacilities()
    expect(result.response.success).toBe(true)
    expect(result.response.data.length).toBeGreaterThan(0)
    console.log(`  Total facilities: ${result.response.data.length}`)
  })

  it("filters by network_id NEM", async () => {
    const result = await client.getFacilities({ network_id: ["NEM"] })
    expect(result.response.data.length).toBeGreaterThan(0)
  })

  it("filters by network_id WEM", async () => {
    const result = await client.getFacilities({ network_id: ["WEM"] })
    expect(result.response.data.length).toBeGreaterThan(0)
  })

  it("filters by fueltech_id wind", async () => {
    const result = await client.getFacilities({ fueltech_id: ["wind"] })
    expect(result.response.data.length).toBeGreaterThan(0)
  })

  it("filters by status_id operating", async () => {
    const result = await client.getFacilities({ status_id: ["operating"] })
    expect(result.response.data.length).toBeGreaterThan(0)
  })

  it("filters by network_region NSW1", async () => {
    const result = await client.getFacilities({ network_region: "NSW1" })
    expect(result.response.data.length).toBeGreaterThan(0)
  })

  it("filters by facility_code", async () => {
    const result = await client.getFacilities({ network_id: "NEM" })
    const firstCode = result.response.data[0].code
    // Can't filter by facility_code in params — verify data has the code
    expect(firstCode).toBeDefined()
  })

  it("returns table with unit records", async () => {
    const result = await client.getFacilities({ network_id: ["NEM"], fueltech_id: ["wind"] })
    expect(result.table).toBeDefined()
    expect(result.table.getRecords().length).toBeGreaterThan(0)
    const row = result.table.getRecords()[0]
    expect(row.facility_code).toBeDefined()
    expect(row.unit_code).toBeDefined()
    expect(row.unit_fueltech).toBe("wind")
  })
})

describe("E2E: getNetworkData", () => {
  it("NEM power 5m 1 day", async () => {
    const result = await client.getNetworkData("NEM", ["power"] as DataMetric[], {
      interval: "5m",
      dateStart: "2026-03-01T00:00:00",
      dateEnd: "2026-03-02T00:00:00",
    })
    expect(result.response.success).toBe(true)
    expect(result.response.data.length).toBeGreaterThan(0)
    expect(result.response.data[0].results[0].data.length).toBe(288)
  })

  it("NEM energy 1d 7 days", async () => {
    const result = await client.getNetworkData("NEM", ["energy"] as DataMetric[], {
      interval: "1d",
      dateStart: "2026-03-01T00:00:00",
      dateEnd: "2026-03-08T00:00:00",
    })
    expect(result.response.success).toBe(true)
    expect(result.response.data[0].results[0].data.length).toBe(7)
  })

  it("WEM power 1h 1 day", async () => {
    const result = await client.getNetworkData("WEM", ["power"] as DataMetric[], {
      interval: "1h",
      dateStart: "2026-03-01T00:00:00",
      dateEnd: "2026-03-02T00:00:00",
    })
    expect(result.response.success).toBe(true)
    expect(result.response.data.length).toBeGreaterThan(0)
  })

  it("AU power 1d", async () => {
    const result = await client.getNetworkData("AU", ["power"] as DataMetric[], {
      interval: "1d",
      dateStart: "2026-03-01T00:00:00",
      dateEnd: "2026-03-08T00:00:00",
    })
    expect(result.response.success).toBe(true)
  })

  it("NEM power 1d with network_region NSW1", async () => {
    const result = await client.getNetworkData("NEM", ["power"] as DataMetric[], {
      interval: "1d",
      dateStart: "2026-03-01T00:00:00",
      dateEnd: "2026-03-08T00:00:00",
      network_region: "NSW1",
    })
    expect(result.response.success).toBe(true)
  })

  it("NEM energy 1d grouped by fueltech", async () => {
    const result = await client.getNetworkData("NEM", ["energy"] as DataMetric[], {
      interval: "1d",
      dateStart: "2026-03-01T00:00:00",
      dateEnd: "2026-03-08T00:00:00",
      secondaryGrouping: ["fueltech"],
    })
    expect(result.response.success).toBe(true)
    expect(result.response.data[0].results.length).toBeGreaterThan(1)
  })

  it("NEM energy 1d grouped by fueltech_group", async () => {
    const result = await client.getNetworkData("NEM", ["energy"] as DataMetric[], {
      interval: "1d",
      dateStart: "2026-03-01T00:00:00",
      dateEnd: "2026-03-08T00:00:00",
      secondaryGrouping: ["fueltech_group"],
    })
    expect(result.response.success).toBe(true)
    expect(result.response.data[0].results.length).toBeGreaterThan(1)
  })

  it("NEM power+energy multi-metric 1d", async () => {
    const result = await client.getNetworkData("NEM", ["power", "energy"] as DataMetric[], {
      interval: "1d",
      dateStart: "2026-03-01T00:00:00",
      dateEnd: "2026-03-08T00:00:00",
    })
    expect(result.response.success).toBe(true)
    expect(result.response.data.length).toBe(2)
  })

  it("NEM emissions 1d", async () => {
    const result = await client.getNetworkData("NEM", ["emissions"] as DataMetric[], {
      interval: "1d",
      dateStart: "2026-03-01T00:00:00",
      dateEnd: "2026-03-08T00:00:00",
    })
    expect(result.response.success).toBe(true)
  })

  it("NEM market_value 1d", async () => {
    const result = await client.getNetworkData("NEM", ["market_value"] as DataMetric[], {
      interval: "1d",
      dateStart: "2026-03-01T00:00:00",
      dateEnd: "2026-03-08T00:00:00",
    })
    expect(result.response.success).toBe(true)
  })

  it("NEM with fueltech filter", async () => {
    const result = await client.getNetworkData("NEM", ["power"] as DataMetric[], {
      interval: "1d",
      dateStart: "2026-03-01T00:00:00",
      dateEnd: "2026-03-08T00:00:00",
      fueltech: ["wind", "solar_utility"],
    })
    expect(result.response.success).toBe(true)
  })

  it("NEM with fueltech_group filter", async () => {
    const result = await client.getNetworkData("NEM", ["power"] as DataMetric[], {
      interval: "1d",
      dateStart: "2026-03-01T00:00:00",
      dateEnd: "2026-03-08T00:00:00",
      fueltech_group: ["coal", "gas"],
    })
    expect(result.response.success).toBe(true)
  })

  it("returns datatable", async () => {
    const result = await client.getNetworkData("NEM", ["power"] as DataMetric[], {
      interval: "1d",
      dateStart: "2026-03-01T00:00:00",
      dateEnd: "2026-03-08T00:00:00",
    })
    expect(result.datatable).toBeDefined()
    expect(result.datatable?.getRows().length).toBeGreaterThan(0)
  })
})

describe("E2E: getFacilityData", () => {
  it("WEM by facility_code 1d", async () => {
    const result = await client.getFacilityData("WEM", "INVESTEC_COLLGAR", ["power"] as DataMetric[], {
      interval: "1d",
      dateStart: "2026-03-01T00:00:00",
      dateEnd: "2026-03-08T00:00:00",
    })
    expect(result.response.success).toBe(true)
    expect(result.response.data.length).toBeGreaterThan(0)
  })

  it("WEM by unit_code 1d", async () => {
    const result = await client.getFacilityData("WEM", undefined, ["power"] as DataMetric[], {
      interval: "1d",
      dateStart: "2026-03-01T00:00:00",
      dateEnd: "2026-03-08T00:00:00",
      unitCodes: "INVESTEC_COLLGAR_WF1",
    })
    expect(result.response.success).toBe(true)
    expect(result.response.data[0].results.length).toBe(1)
  })

  it("WEM facility+unit combined", async () => {
    const result = await client.getFacilityData("WEM", "INVESTEC_COLLGAR", ["power"] as DataMetric[], {
      interval: "1d",
      dateStart: "2026-03-01T00:00:00",
      dateEnd: "2026-03-08T00:00:00",
      unitCodes: "INVESTEC_COLLGAR_WF1",
    })
    expect(result.response.success).toBe(true)
  })

  it("NEM facility power 5m", async () => {
    const result = await client.getFacilityData("NEM", "BANGOWF", ["power"] as DataMetric[], {
      interval: "5m",
      dateStart: "2026-03-01T00:00:00",
      dateEnd: "2026-03-02T00:00:00",
    })
    expect(result.response.success).toBe(true)
    expect(result.response.data[0].results.length).toBeGreaterThan(0)
  })

  it("NEM facility power+energy multi-metric 1d", async () => {
    const result = await client.getFacilityData("NEM", "BANGOWF", ["power", "energy"] as DataMetric[], {
      interval: "1d",
      dateStart: "2026-03-01T00:00:00",
      dateEnd: "2026-03-08T00:00:00",
    })
    expect(result.response.success).toBe(true)
    expect(result.response.data.length).toBe(2)
  })

  it("NEM multiple facility codes", async () => {
    const result = await client.getFacilityData("NEM", ["BANGOWF", "LIDDELL"], ["power"] as DataMetric[], {
      interval: "1d",
      dateStart: "2026-03-01T00:00:00",
      dateEnd: "2026-03-08T00:00:00",
    })
    expect(result.response.success).toBe(true)
  })

  it("nonexistent unit_code returns 404 error", async () => {
    await expect(
      client.getFacilityData("WEM", undefined, ["power"] as DataMetric[], {
        interval: "1d",
        dateStart: "2026-03-01T00:00:00",
        dateEnd: "2026-03-02T00:00:00",
        unitCodes: "FAKE_UNIT",
      }),
    ).rejects.toThrow()
  })
})

describe("E2E: getMarket", () => {
  it("NEM price 5m 1 day", async () => {
    const result = await client.getMarket("NEM", ["price"] as MarketMetric[], {
      interval: "5m",
      dateStart: "2026-03-01T00:00:00",
      dateEnd: "2026-03-02T00:00:00",
    })
    expect(result.response.success).toBe(true)
    expect(result.response.data.length).toBeGreaterThan(0)
  })

  it("NEM demand 1d 7 days", async () => {
    const result = await client.getMarket("NEM", ["demand"] as MarketMetric[], {
      interval: "1d",
      dateStart: "2026-03-01T00:00:00",
      dateEnd: "2026-03-08T00:00:00",
    })
    expect(result.response.success).toBe(true)
  })

  it("NEM demand_energy 1d", async () => {
    const result = await client.getMarket("NEM", ["demand_energy"] as MarketMetric[], {
      interval: "1d",
      dateStart: "2026-03-01T00:00:00",
      dateEnd: "2026-03-08T00:00:00",
    })
    expect(result.response.success).toBe(true)
  })

  it("NEM price 1h by network_region", async () => {
    const result = await client.getMarket("NEM", ["price"] as MarketMetric[], {
      interval: "1h",
      dateStart: "2026-03-01T00:00:00",
      dateEnd: "2026-03-02T00:00:00",
      primaryGrouping: "network_region",
    })
    expect(result.response.success).toBe(true)
    expect(result.response.data[0].results.length).toBeGreaterThan(1)
  })

  it("NEM price+demand multi-metric 1d", async () => {
    const result = await client.getMarket("NEM", ["price", "demand"] as MarketMetric[], {
      interval: "1d",
      dateStart: "2026-03-01T00:00:00",
      dateEnd: "2026-03-08T00:00:00",
    })
    expect(result.response.success).toBe(true)
    expect(result.response.data.length).toBe(2)
  })

  it("WEM price 1d", async () => {
    const result = await client.getMarket("WEM", ["price"] as MarketMetric[], {
      interval: "1d",
      dateStart: "2026-03-01T00:00:00",
      dateEnd: "2026-03-08T00:00:00",
    })
    expect(result.response.success).toBe(true)
  })

  it("NEM NSW1 price 1d", async () => {
    const result = await client.getMarket("NEM", ["price"] as MarketMetric[], {
      interval: "1d",
      dateStart: "2026-03-01T00:00:00",
      dateEnd: "2026-03-08T00:00:00",
      network_region: "NSW1",
    })
    expect(result.response.success).toBe(true)
  })
})

describe("E2E: getAvailableMetrics", () => {
  it("returns metrics metadata", async () => {
    const result = await client.getAvailableMetrics()
    expect(result).toBeDefined()
    console.log(`  Metrics: ${JSON.stringify(Object.keys(result)).substring(0, 100)}`)
  })
})

describe("E2E: getFacilityPollution", () => {
  it("returns pollution data for a coal facility", async () => {
    const result = await client.getFacilityPollution({
      facility_code: ["YALLOURN"],
    })
    expect(result.response.success).toBe(true)
    expect(result.response.data.length).toBeGreaterThan(0)
  })
})
