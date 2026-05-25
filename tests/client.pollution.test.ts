import { beforeEach, describe, expect, it, vi } from "vitest"

import { NoDataFound, OpenElectricityClient } from "../src"

const mockFetch = vi.fn()
globalThis.fetch = mockFetch as unknown as typeof fetch

describe("getFacilityPollution", () => {
  let client: OpenElectricityClient

  beforeEach(() => {
    client = new OpenElectricityClient({ apiKey: "test-key" })
    vi.clearAllMocks()
  })

  it("returns datatable for populated response", async () => {
    const body = {
      version: "4.0.1",
      created_at: "2024-01-01T00:00:00",
      success: true,
      error: null,
      data: [
        {
          network_code: "NEM",
          metric: "pollution",
          unit: "kg",
          interval: "1y",
          start: "2023-01-01T00:00:00",
          end: "2024-01-01T00:00:00",
          groupings: [],
          results: [
            {
              name: "ERARING_nox",
              date_start: "2023-01-01T00:00:00",
              date_end: "2024-01-01T00:00:00",
              columns: { facility_code: "ERARING", pollutant_code: "nox" },
              data: [["2023-01-01T00:00:00", 12345]],
            },
          ],
          network_timezone_offset: "+10:00",
        },
      ],
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(body),
    } as Response)

    const result = await client.getFacilityPollution({
      facility_code: ["ERARING"],
      pollutant_code: ["nox"],
    })

    expect(result.response.success).toBe(true)
    expect(result.datatable).toBeDefined()
  })

  it("omits datatable when response.data is empty", async () => {
    const body = {
      version: "4.0.1",
      created_at: "2024-01-01T00:00:00",
      success: true,
      error: null,
      data: [],
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(body),
    } as Response)

    const result = await client.getFacilityPollution()
    expect(result.response.data).toEqual([])
    expect(result.datatable).toBeUndefined()
  })

  it("throws NoDataFound on 404", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: () => Promise.resolve({}),
    } as Response)

    await expect(
      client.getFacilityPollution({ facility_code: ["DOES_NOT_EXIST"] }),
    ).rejects.toBeInstanceOf(NoDataFound)
  })
})
