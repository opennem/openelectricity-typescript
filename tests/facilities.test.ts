import { beforeEach, describe, expect, it, vi } from "vitest"

import { OpenElectricityClient } from "../src/client"
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
