import { beforeEach, describe, expect, it, test, vi } from "vitest"

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

  test("getNetworkData should fetch and return network data", async () => {
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

    const result = await client.getNetworkData("NEM", ["energy"], {
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

  test("getFacilityData should fetch and return facility data", async () => {
    const mockResponse = {
      version: "4.0.3.dev0",
      created_at: "2025-02-18T07:27:28+11:00",
      success: true,
      data: [
        {
          network_code: "NEM",
          metric: "energy",
          unit: "MWh",
          interval: "1d",
          start: "2025-02-13T00:00:00",
          end: "2025-02-15T00:00:00",
          groupings: [],
          results: [
            {
              name: "energy_BANGOWF1",
              date_start: "2025-02-13T00:00:00",
              date_end: "2025-02-15T00:00:00",
              columns: {
                unit_code: "BANGOWF1",
              },
              data: [
                ["2025-02-12T13:00:00Z", 931.4554],
                ["2025-02-13T13:00:00Z", 1198.4969],
                ["2025-02-14T13:00:00Z", 4610.3691],
              ],
            },
            {
              name: "energy_BANGOWF2",
              date_start: "2025-02-13T00:00:00",
              date_end: "2025-02-15T00:00:00",
              columns: {
                unit_code: "BANGOWF2",
              },
              data: [
                ["2025-02-12T13:00:00Z", 555.5546],
                ["2025-02-13T13:00:00Z", 790.281],
                ["2025-02-14T13:00:00Z", 1745.9334],
              ],
            },
          ],
          network_timezone_offset: "+10:00",
        },
        {
          network_code: "NEM",
          metric: "market_value",
          unit: "$",
          interval: "1d",
          start: "2025-02-13T00:00:00",
          end: "2025-02-15T00:00:00",
          groupings: [],
          results: [
            {
              name: "market_value_BANGOWF1",
              date_start: "2025-02-13T00:00:00",
              date_end: "2025-02-15T00:00:00",
              columns: {
                unit_code: "BANGOWF1",
              },
              data: [
                ["2025-02-12T13:00:00Z", 80408.191],
                ["2025-02-13T13:00:00Z", 127704.6],
                ["2025-02-14T13:00:00Z", 168568.15],
              ],
            },
            {
              name: "market_value_BANGOWF2",
              date_start: "2025-02-13T00:00:00",
              date_end: "2025-02-15T00:00:00",
              columns: {
                unit_code: "BANGOWF2",
              },
              data: [
                ["2025-02-12T13:00:00Z", 46632.327],
                ["2025-02-13T13:00:00Z", 89052.421],
                ["2025-02-14T13:00:00Z", 136116.71],
              ],
            },
          ],
          network_timezone_offset: "+10:00",
        },
      ],
    }

    mockFetch.mockImplementationOnce(() => mockFetchResponse(mockResponse))

    const result = await client.getFacilityData("NEM", "BANGOWF", ["energy", "market_value"], {
      interval: "1d",
      dateStart: "2025-02-13T00:00:00",
      dateEnd: "2025-02-15T00:00:00",
    })

    expect(result.response.success).toBe(true)
    expect(result.response.data).toHaveLength(2) // One for each metric
    expect(result.datatable).toBeDefined()
    expect(result.datatable?.getRows()).toHaveLength(6) // 3 days × 2 units

    // Check first row data
    const firstRow = result.datatable?.getRows()[0]
    expect(firstRow?.unit_code).toBe("BANGOWF1")
    expect(firstRow?.energy).toBe(931.4554)
    expect(firstRow?.market_value).toBe(80408.191)
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
        status: 400,
        statusText: "Bad Request",
        json: () =>
          Promise.resolve({
            version: "4.0.1",
            response_status: "ERROR",
            error: "Bad Request",
            success: false,
          }),
      })
    )

    await expect(
      client.getNetworkData("NEM", ["energy"], {
        interval: "1h",
      })
    ).rejects.toThrow("Bad Request")
  })

  describe("getFacilities", () => {
    it("should get facilities with no filters", async () => {
      const mockData = {
        version: "4.0.1",
        created_at: "2024-01-01T00:00:00",
        success: true,
        error: null,
        data: [
          {
            code: "FACILITY1",
            name: "Test Facility 1",
            network_id: "NEM",
            network_region: "NSW1",
            description: null,
            units: [
              {
                code: "UNIT1",
                fueltech_id: "coal_black",
                status_id: "operating",
                capacity_registered: 500,
                emissions_factor_co2: 0.9,
                data_first_seen: "2020-01-01",
                data_last_seen: "2024-01-01",
                dispatch_type: "GENERATOR",
              },
            ],
          },
        ],
      }

      mockFetch.mockImplementationOnce(() => mockFetchResponse(mockData))

      const result = await client.getFacilities()
      expect(result.response.success).toBe(true)
      expect(Array.isArray(result.response.data)).toBe(true)
      expect(result.table).toBeDefined()
    })

    it("should get facilities filtered by status", async () => {
      const mockData = {
        version: "4.0.1",
        created_at: "2024-01-01T00:00:00",
        success: true,
        error: null,
        data: [
          {
            code: "FACILITY1",
            name: "Test Facility 1",
            network_id: "NEM",
            network_region: "NSW1",
            description: null,
            units: [
              {
                code: "UNIT1",
                fueltech_id: "coal_black",
                status_id: "operating",
                capacity_registered: 500,
                emissions_factor_co2: 0.9,
                data_first_seen: "2020-01-01",
                data_last_seen: "2024-01-01",
                dispatch_type: "GENERATOR",
              },
            ],
          },
        ],
      }

      mockFetch.mockImplementationOnce(() => mockFetchResponse(mockData))

      const result = await client.getFacilities({
        status_id: ["operating"],
      })
      expect(result.response.success).toBe(true)
      expect(Array.isArray(result.response.data)).toBe(true)
      expect(result.table).toBeDefined()
    })

    it("should get facilities filtered by fueltech", async () => {
      const mockData = {
        version: "4.0.1",
        created_at: "2024-01-01T00:00:00",
        success: true,
        error: null,
        data: [
          {
            code: "FACILITY1",
            name: "Test Facility 1",
            network_id: "NEM",
            network_region: "NSW1",
            description: null,
            units: [
              {
                code: "UNIT1",
                fueltech_id: "coal_black",
                status_id: "operating",
                capacity_registered: 500,
                emissions_factor_co2: 0.9,
                data_first_seen: "2020-01-01",
                data_last_seen: "2024-01-01",
                dispatch_type: "GENERATOR",
              },
            ],
          },
        ],
      }

      mockFetch.mockImplementationOnce(() => mockFetchResponse(mockData))

      const result = await client.getFacilities({
        fueltech_id: ["coal_black", "coal_brown"],
      })
      expect(result.response.success).toBe(true)
      expect(Array.isArray(result.response.data)).toBe(true)
      expect(result.table).toBeDefined()
    })

    it("should get facilities filtered by network", async () => {
      const mockData = {
        version: "4.0.1",
        created_at: "2024-01-01T00:00:00",
        success: true,
        error: null,
        data: [
          {
            code: "FACILITY1",
            name: "Test Facility 1",
            network_id: "NEM",
            network_region: "NSW1",
            description: null,
            units: [
              {
                code: "UNIT1",
                fueltech_id: "coal_black",
                status_id: "operating",
                capacity_registered: 500,
                emissions_factor_co2: 0.9,
                data_first_seen: "2020-01-01",
                data_last_seen: "2024-01-01",
                dispatch_type: "GENERATOR",
              },
            ],
          },
        ],
      }

      mockFetch.mockImplementationOnce(() => mockFetchResponse(mockData))

      const result = await client.getFacilities({
        network_id: "NEM",
      })
      expect(result.response.success).toBe(true)
      expect(Array.isArray(result.response.data)).toBe(true)
      expect(result.table).toBeDefined()
    })

    it("should get facilities filtered by region", async () => {
      const mockData = {
        version: "4.0.1",
        created_at: "2024-01-01T00:00:00",
        success: true,
        error: null,
        data: [
          {
            code: "FACILITY1",
            name: "Test Facility 1",
            network_id: "NEM",
            network_region: "NSW1",
            description: null,
            units: [
              {
                code: "UNIT1",
                fueltech_id: "coal_black",
                status_id: "operating",
                capacity_registered: 500,
                emissions_factor_co2: 0.9,
                data_first_seen: "2020-01-01",
                data_last_seen: "2024-01-01",
                dispatch_type: "GENERATOR",
              },
            ],
          },
        ],
      }

      mockFetch.mockImplementationOnce(() => mockFetchResponse(mockData))

      const result = await client.getFacilities({
        network_region: "NSW1",
      })
      expect(result.response.success).toBe(true)
      expect(Array.isArray(result.response.data)).toBe(true)
      expect(result.table).toBeDefined()
    })
  })
})
