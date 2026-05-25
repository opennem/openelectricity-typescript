import { beforeEach, describe, expect, it, vi } from "vitest"

import { OpenElectricityClient } from "../src"

const mockFetch = vi.fn()
globalThis.fetch = mockFetch as unknown as typeof fetch

function emptyTimeseries() {
  return {
    version: "4.0.1",
    created_at: "2024-01-01T00:00:00",
    success: true,
    error: null,
    data: [],
  }
}

describe("tz-aware date stripping", () => {
  let client: OpenElectricityClient

  beforeEach(() => {
    client = new OpenElectricityClient({ apiKey: "test-key" })
    vi.clearAllMocks()
  })

  it("strips trailing Z from dateStart and dateEnd", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(emptyTimeseries()),
    } as Response)

    await client.getNetworkData("NEM", ["energy"], {
      dateStart: "2024-01-01T00:00:00Z",
      dateEnd: "2024-01-02T00:00:00Z",
    })

    const url = String(mockFetch.mock.calls[0][0])
    expect(url).toContain("date_start=2024-01-01T00%3A00%3A00")
    expect(url).toContain("date_end=2024-01-02T00%3A00%3A00")
    expect(url).not.toContain("Z&")
    expect(url).not.toMatch(/Z$/)
  })

  it("strips +HH:MM offsets", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(emptyTimeseries()),
    } as Response)

    await client.getNetworkData("NEM", ["energy"], {
      dateStart: "2024-01-01T00:00:00+10:00",
    })

    const url = String(mockFetch.mock.calls[0][0])
    expect(url).toContain("date_start=2024-01-01T00%3A00%3A00")
    expect(url).not.toContain("%2B10")
  })

  it("passes naive dates through unchanged", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(emptyTimeseries()),
    } as Response)

    await client.getNetworkData("NEM", ["energy"], {
      dateStart: "2024-01-01T00:00:00",
    })

    const url = String(mockFetch.mock.calls[0][0])
    expect(url).toContain("date_start=2024-01-01T00%3A00%3A00")
  })
})
