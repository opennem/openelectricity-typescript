import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  NoDataFound,
  OpenElectricityClient,
  OpenElectricityError,
} from "../src"

const mockFetch = vi.fn()
globalThis.fetch = mockFetch as unknown as typeof fetch

describe("getAvailableMetrics", () => {
  let client: OpenElectricityClient

  beforeEach(() => {
    client = new OpenElectricityClient({ apiKey: "test-key" })
    vi.clearAllMocks()
  })

  it("returns metrics on 200", async () => {
    const body = {
      metrics: {
        power: {
          name: "power",
          unit: "MW",
          description: "Power output",
          default_aggregation: "mean",
          precision: 2,
        },
      },
      total: 1,
      endpoints: { market: [], data: ["power"] },
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(body),
    } as Response)

    const result = await client.getAvailableMetrics()
    expect(result.total).toBe(1)
    expect(result.metrics.power.unit).toBe("MW")
  })

  it("throws NoDataFound on 404", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: () => Promise.resolve({}),
    } as Response)

    await expect(client.getAvailableMetrics()).rejects.toBeInstanceOf(
      NoDataFound,
    )
  })

  it("throws permission error on 403", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: "Forbidden",
      json: () => Promise.resolve({}),
    } as Response)

    await expect(client.getAvailableMetrics()).rejects.toThrow(
      /Permission denied/,
    )
  })

  it("throws OpenElectricityError on 500 with non-JSON body", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: () => Promise.reject(new Error("not json")),
    } as Response)

    await expect(client.getAvailableMetrics()).rejects.toBeInstanceOf(
      OpenElectricityError,
    )
  })
})
