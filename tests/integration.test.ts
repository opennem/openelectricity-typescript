import { beforeAll, describe, expect, it, test, vi } from "vitest"
import { OpenElectricityClient, OpenElectricityError } from "../src"

// Integration tests that run against the actual API
// Skip these tests if not running against local dev server
const RUN_INTEGRATION_TESTS = process.env.OPENELECTRICITY_API_URL?.includes("localhost") ?? false

describe.skipIf(!RUN_INTEGRATION_TESTS)("Integration Tests", () => {
  let client: OpenElectricityClient

  beforeAll(() => {
    // Restore real fetch for integration tests
    vi.restoreAllMocks()
    if (typeof globalThis.fetch === "undefined") {
      // If fetch is not available, skip these tests
      throw new Error("fetch is not available for integration tests")
    }
    
    client = new OpenElectricityClient({
      apiKey: process.env.OPENELECTRICITY_API_KEY || "test-key",
      baseUrl: process.env.OPENELECTRICITY_API_URL || "http://localhost:8000/v4"
    })
  })

  describe("Metrics Discovery", () => {
    test("should fetch available metrics", async () => {
      const metrics = await client.getAvailableMetrics()
      
      expect(metrics).toBeDefined()
      expect(metrics.total).toBeGreaterThan(0)
      expect(metrics.endpoints).toBeDefined()
      expect(metrics.endpoints.market).toContain("price")
      expect(metrics.endpoints.market).toContain("demand")
      expect(metrics.endpoints.market).toContain("curtailment_solar")
      expect(metrics.endpoints.market).toContain("curtailment_wind")
      expect(metrics.endpoints.data).toContain("power")
      expect(metrics.endpoints.data).toContain("energy")
    })

    test("should include metric metadata", async () => {
      const metrics = await client.getAvailableMetrics()
      
      const priceMetric = metrics.metrics.price
      expect(priceMetric).toBeDefined()
      expect(priceMetric.unit).toBe("$/MWh")
      expect(priceMetric.description).toContain("Price")
      
      const curtailmentSolar = metrics.metrics.curtailment_solar
      expect(curtailmentSolar).toBeDefined()
      expect(curtailmentSolar.unit).toBe("MW")
      expect(curtailmentSolar.description).toContain("Solar")
    })
  })

  describe("Error Handling", () => {
    test("should handle invalid metric gracefully", async () => {
      await expect(
        // @ts-expect-error - Intentionally using invalid metric
        client.getMarket("NEM", ["invalid_metric"], {
          interval: "1h",
          network_region: "NSW1"
        })
      ).rejects.toThrow()
    })

    test("should provide helpful error for wrong metric on endpoint", async () => {
      try {
        // @ts-expect-error - Intentionally using wrong metric type
        await client.getMarket("NEM", ["power"], {
          interval: "1h", 
          network_region: "NSW1"
        })
        expect.fail("Should have thrown an error")
      } catch (error) {
        if (error instanceof OpenElectricityError) {
          // Check that we get a meaningful error, not just "500 Internal Server Error"
          expect(error.statusCode).not.toBe(500)
        }
      }
    })

    test("should handle invalid network code", async () => {
      await expect(
        // @ts-expect-error - Intentionally using invalid network
        client.getMarket("INVALID", ["price"], {
          interval: "1h"
        })
      ).rejects.toThrow()
    })
  })

  describe("Curtailment Metrics", () => {
    test("should fetch curtailment data successfully", async () => {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setHours(startDate.getHours() - 24)

      const formatDate = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, "0")
        const day = String(date.getDate()).padStart(2, "0")
        const hours = String(date.getHours()).padStart(2, "0")
        const minutes = String(date.getMinutes()).padStart(2, "0")
        const seconds = String(date.getSeconds()).padStart(2, "0")
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
      }

      const response = await client.getMarket("NEM", ["curtailment_solar", "curtailment_wind"], {
        interval: "1h",
        dateStart: formatDate(startDate),
        dateEnd: formatDate(endDate),
        network_region: "NSW1",
        primaryGrouping: "network_region"
      })

      expect(response).toBeDefined()
      expect(response.response).toBeDefined()
      expect(response.response.data).toBeInstanceOf(Array)
      
      // Check we got data for both metrics
      const metrics = response.response.data.map(d => d.metric)
      expect(metrics).toContain("curtailment_solar")
      expect(metrics).toContain("curtailment_wind")
    })
  })

  describe("Market Data", () => {
    test("should fetch price and demand data", async () => {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setHours(startDate.getHours() - 1)

      const formatDate = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, "0")
        const day = String(date.getDate()).padStart(2, "0")
        const hours = String(date.getHours()).padStart(2, "0")
        const minutes = String(date.getMinutes()).padStart(2, "0")
        const seconds = String(date.getSeconds()).padStart(2, "0")
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
      }

      const response = await client.getMarket("NEM", ["price", "demand"], {
        interval: "5m",
        dateStart: formatDate(startDate),
        dateEnd: formatDate(endDate),
        network_region: "NSW1"
      })

      expect(response).toBeDefined()
      expect(response.response.data).toBeInstanceOf(Array)
      expect(response.response.data.length).toBe(2) // One for price, one for demand
      
      const priceData = response.response.data.find(d => d.metric === "price")
      expect(priceData).toBeDefined()
      expect(priceData?.unit).toBe("$/MWh")
      
      const demandData = response.response.data.find(d => d.metric === "demand")
      expect(demandData).toBeDefined()
      expect(demandData?.unit).toBe("MW")
    })
  })
})