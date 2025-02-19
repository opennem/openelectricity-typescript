import { fail } from "assert"

import { beforeEach, describe, expect, it, vi } from "vitest"

import { NoDataFound, OpenElectricityClient, OpenElectricityError } from "../src/client"
import { UnitFueltechType } from "../src/types"

// Mock fetch
const mockFetch = vi.fn()
globalThis.fetch = mockFetch

function mockFetchResponse(data: unknown): Promise<Response> {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data),
  } as Response)
}

describe("Facilities", () => {
  let client: OpenElectricityClient

  beforeEach(() => {
    client = new OpenElectricityClient({ apiKey: "test-key" })
    vi.clearAllMocks()
  })

  it("should get all facilities", async () => {
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

  it("should filter facilities by status", async () => {
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

    // Check that all units have the correct status
    result.response.data.forEach((facility) => {
      facility.units.forEach((unit) => {
        expect(unit.status_id).toBe("operating")
      })
    })
  })

  it("should filter facilities by fueltech", async () => {
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

    const fueltechs: UnitFueltechType[] = ["coal_black", "coal_brown"]
    const result = await client.getFacilities({
      fueltech_id: fueltechs,
    })
    expect(result.response.success).toBe(true)
    expect(Array.isArray(result.response.data)).toBe(true)
    expect(result.table).toBeDefined()

    // Check that all units have the correct fueltech
    result.response.data.forEach((facility) => {
      facility.units.forEach((unit) => {
        expect(fueltechs).toContain(unit.fueltech_id)
      })
    })
  })

  it("should filter facilities by network", async () => {
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

    // Check that all facilities are in the correct network
    result.response.data.forEach((facility) => {
      expect(facility.network_id).toBe("NEM")
    })
  })

  it("should filter facilities by multiple networks", async () => {
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
        {
          code: "FACILITY2",
          name: "Test Facility 2",
          network_id: "WEM",
          network_region: "WEM",
          description: null,
          units: [
            {
              code: "UNIT2",
              fueltech_id: "coal_black",
              status_id: "operating",
              capacity_registered: 300,
              emissions_factor_co2: 0.8,
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
      network_id: ["NEM", "WEM"],
    })
    expect(result.response.success).toBe(true)
    expect(Array.isArray(result.response.data)).toBe(true)
    expect(result.table).toBeDefined()

    // Check that all facilities are in one of the specified networks
    result.response.data.forEach((facility) => {
      expect(["NEM", "WEM"]).toContain(facility.network_id)
    })
  })

  it("should filter facilities by region", async () => {
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

    // Check that all facilities are in the correct region
    result.response.data.forEach((facility) => {
      expect(facility.network_region).toBe("NSW1")
    })
  })

  it("should handle no results (416 status code)", async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 416,
        statusText: "Requested Range Not Satisfiable",
      })
    )

    try {
      await client.getFacilities({
        network_id: ["NEM"],
        fueltech_id: ["nuclear"], // No nuclear facilities in NEM
      })
      fail("Expected NoDataFound error to be thrown")
    } catch (error) {
      expect(error).toBeInstanceOf(NoDataFound)
      expect((error as Error).message).toBe("No data found for the requested parameters")
    }
  })

  it("should handle API error responses", async () => {
    const errorResponse = {
      version: "4.0.4.dev2",
      response_status: "ERROR",
      error: "Date start must be timezone naive and in network time",
      success: false,
    }

    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve(errorResponse),
      })
    )

    try {
      await client.getFacilities()
      fail("Expected error to be thrown")
    } catch (error) {
      expect(error).toBeInstanceOf(OpenElectricityError)
      const apiError = error as OpenElectricityError
      expect(apiError.message).toBe("Date start must be timezone naive and in network time")
      expect(apiError.response).toEqual(errorResponse)
    }
  })

  it("should handle 403 permission denied errors", async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 403,
        statusText: "Forbidden",
      })
    )

    try {
      await client.getFacilities()
      fail("Expected error to be thrown")
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).toBe("Permission denied. Check API key or your access level")
      } else {
        fail("Expected error to be an instance of Error")
      }
    }
  })

  it("should create a table with facility and unit information", async () => {
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
    expect(result.table).toBeDefined()

    const rows = result.table.getRecords()
    expect(rows?.length).toBeGreaterThan(0)

    // Check that the table has all required columns
    const firstRow = rows?.[0]
    expect(firstRow).toBeDefined()
    expect(firstRow).toHaveProperty("facility_code")
    expect(firstRow).toHaveProperty("facility_name")
    expect(firstRow).toHaveProperty("facility_network")
    expect(firstRow).toHaveProperty("facility_region")
    expect(firstRow).toHaveProperty("unit_code")
    expect(firstRow).toHaveProperty("unit_fueltech")
    expect(firstRow).toHaveProperty("unit_status")
    expect(firstRow).toHaveProperty("unit_capacity")
    expect(firstRow).toHaveProperty("unit_emissions_factor")
    expect(firstRow).toHaveProperty("unit_first_seen")
    expect(firstRow).toHaveProperty("unit_last_seen")
    expect(firstRow).toHaveProperty("unit_dispatch_type")
  })
})
