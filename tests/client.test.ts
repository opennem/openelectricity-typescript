import { beforeEach, describe, expect, test, vi } from "vitest"

import { OpenElectricityClient } from "../src"
import { INetworkTimeSeries } from "../src/types"

// Mock fetch
const mockFetch = vi.fn()
globalThis.fetch = mockFetch

function mockFetchResponse(data: unknown): Promise<Response> {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data),
  } as Response)
}

describe("OpenElectricityClient", () => {
  let client: OpenElectricityClient

  beforeEach(() => {
    client = new OpenElectricityClient({ apiKey: "test-key" })
    vi.clearAllMocks()
  })

  test("getData should fetch and return network data", async () => {
    const mockResponse = {
      version: "4.0.1",
      created_at: "2024-01-01T00:00:00",
      success: true,
      error: null,
      data: [
        {
          network_code: "NEM",
          metric: "energy",
          unit: "MWh",
          interval: "1h",
          start: "2024-01-01T00:00:00",
          end: "2024-01-02T00:00:00",
          groupings: ["network_region"],
          results: [
            {
              name: "nem_nsw1_energy",
              date_start: "2024-01-01T00:00:00",
              date_end: "2024-01-02T00:00:00",
              columns: {
                network: "NEM",
                network_region: "NSW1",
              },
              data: [["2024-01-01T00:00:00", 8000]],
            },
          ],
          network_timezone_offset: "+10:00",
        } as INetworkTimeSeries,
      ],
    }

    mockFetch.mockImplementationOnce(() => mockFetchResponse(mockResponse))

    const result = await client.getData("NEM", ["energy"], {
      interval: "1h",
      dateStart: "2024-01-01T00:00:00",
      dateEnd: "2024-01-02T00:00:00",
      primaryGrouping: "network_region",
    })

    expect(result.response.success).toBe(true)
    expect(result.response.data).toHaveLength(1)
    expect(result.datatable).toBeDefined()
    expect(result.datatable?.getRows()).toHaveLength(1)
  })

  test("getMarket should fetch and return market data", async () => {
    const mockResponse = {
      version: "4.0.1",
      created_at: "2024-01-01T00:00:00",
      success: true,
      error: null,
      data: [
        {
          network_code: "NEM",
          metric: "price",
          unit: "$/MWh",
          interval: "1h",
          start: "2024-01-01T00:00:00",
          end: "2024-01-02T00:00:00",
          groupings: ["network_region"],
          results: [
            {
              name: "nem_nsw1_price",
              date_start: "2024-01-01T00:00:00",
              date_end: "2024-01-02T00:00:00",
              columns: {
                network: "NEM",
                network_region: "NSW1",
              },
              data: [["2024-01-01T00:00:00", 100]],
            },
          ],
          network_timezone_offset: "+10:00",
        } as INetworkTimeSeries,
      ],
    }

    mockFetch.mockImplementationOnce(() => mockFetchResponse(mockResponse))

    const result = await client.getMarket("NEM", ["price"], {
      interval: "1h",
      dateStart: "2024-01-01T00:00:00",
      dateEnd: "2024-01-02T00:00:00",
      primaryGrouping: "network_region",
    })

    expect(result.response.success).toBe(true)
    expect(result.response.data).toHaveLength(1)
    expect(result.datatable).toBeDefined()
    expect(result.datatable?.getRows()).toHaveLength(1)
  })

  test("should throw error when API key is missing", () => {
    // Clear environment variables
    const env = globalThis as { process?: { env?: { [key: string]: string | undefined } } }
    const originalApiKey = env.process?.env?.OPENELECTRICITY_API_KEY
    const originalApiUrl = env.process?.env?.OPENELECTRICITY_API_URL
    if (env.process?.env) {
      delete env.process.env.OPENELECTRICITY_API_KEY
      delete env.process.env.OPENELECTRICITY_API_URL
    }

    expect(() => new OpenElectricityClient()).toThrow("API key is required")

    // Restore environment variables
    if (env.process?.env) {
      env.process.env.OPENELECTRICITY_API_KEY = originalApiKey
      env.process.env.OPENELECTRICITY_API_URL = originalApiUrl
    }
  })

  test("should throw error when API request fails", async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        statusText: "Bad Request",
      })
    )

    await expect(
      client.getData("NEM", ["energy"], {
        interval: "1h",
      })
    ).rejects.toThrow("API request failed: Bad Request")
  })
})
