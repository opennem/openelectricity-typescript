import { beforeEach, describe, expect, test, vi } from "vitest"

import { OpenElectricityClient } from "../src"

const mockFetch = vi.fn()
globalThis.fetch = mockFetch as unknown as typeof fetch

function mockFetchResponse(data: unknown): Promise<Response> {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data),
  } as Response)
}

// Trimmed from a live prod 4.5.16 /v4/market/network/NEM response: blocks
// carry date_start/date_end, columns carry `region`, timestamps are network
// local with an offset.
function liveBlock(metric: string, unit: string, values: [string, number][]) {
  return {
    network_code: "NEM",
    metric,
    unit,
    interval: "1h",
    date_start: "2026-10-05T00:00:00+10:00",
    date_end: "2026-10-05T01:00:00+10:00",
    groupings: [],
    network_timezone_offset: "+10:00",
    results: values.map(([region, value]) => ({
      name: `${metric}_${region}`,
      date_start: "2026-10-05T00:00:00+10:00",
      date_end: "2026-10-05T01:00:00+10:00",
      columns: { region },
      data: [["2026-10-05T00:00:00+10:00", value]],
    })),
  }
}

const liveResponse = {
  version: "4.5.16",
  created_at: "2026-10-06T13:07:20+11:00",
  success: true,
  error: null,
  data: [
    liveBlock("price", "$/MWh", [
      ["NSW1", 144.510833],
      ["VIC1", 98.2],
    ]),
    liveBlock("demand", "MW", [
      ["NSW1", 6685.229167],
      ["VIC1", 4511.0],
    ]),
  ],
}

describe("response field compatibility", () => {
  let client: OpenElectricityClient

  beforeEach(() => {
    client = new OpenElectricityClient({ apiKey: "test-key" })
    vi.clearAllMocks()
  })

  test("live date_start/date_end also fill the deprecated start/end", async () => {
    mockFetch.mockImplementationOnce(() => mockFetchResponse(liveResponse))

    const { response } = await client.getMarket("NEM", ["price", "demand"], {
      interval: "1h",
      primaryGrouping: "network_region",
    })

    const series = response.data[0]
    expect(series.date_start).toBe("2026-10-05T00:00:00+10:00")
    expect(series.date_end).toBe("2026-10-05T01:00:00+10:00")
    expect(series.start).toBe(series.date_start)
    expect(series.end).toBe(series.date_end)
  })

  test("older start/end responses also fill date_start/date_end", async () => {
    const legacy = structuredClone(liveResponse)
    for (const block of legacy.data as Record<string, unknown>[]) {
      block.start = block.date_start
      block.end = block.date_end
      delete block.date_start
      delete block.date_end
    }
    mockFetch.mockImplementationOnce(() => mockFetchResponse(legacy))

    const { response } = await client.getNetworkData("NEM", ["energy"], {
      interval: "1h",
    })

    expect(response.data[0].date_start).toBe("2026-10-05T00:00:00+10:00")
    expect(response.data[0].start).toBe("2026-10-05T00:00:00+10:00")
  })

  test("datatable keeps the instant of offset timestamps and the region column", async () => {
    mockFetch.mockImplementationOnce(() => mockFetchResponse(liveResponse))

    const { datatable } = await client.getMarket("NEM", ["price", "demand"], {
      interval: "1h",
      primaryGrouping: "network_region",
    })

    const rows = datatable?.getRows() ?? []
    expect(rows).toHaveLength(2)
    // 00:00 at +10:00 is 14:00 UTC the previous day, not shifted again
    expect(rows[0].interval.toISOString()).toBe("2026-10-04T14:00:00.000Z")
    const nsw = rows.find((row) => row.region === "NSW1")
    expect(nsw?.price).toBe(144.510833)
    expect(nsw?.demand).toBe(6685.229167)
  })

  test("README datatable patterns work on the live shape", async () => {
    mockFetch.mockImplementationOnce(() => mockFetchResponse(liveResponse))

    const { datatable } = await client.getMarket("NEM", ["price", "demand"], {
      interval: "1h",
      dateStart: "2026-10-05T00:00:00",
      dateEnd: "2026-10-05T01:00:00",
      primaryGrouping: "network_region",
    })
    if (!datatable) throw new Error("no datatable")

    expect(
      datatable.filter((row) => row.region === "NSW1").getRows(),
    ).toHaveLength(1)
    const grouped = datatable.groupBy(["region"], "sum").getRows()
    expect(grouped.map((row) => row.region).sort()).toEqual(["NSW1", "VIC1"])
    expect(datatable.sortBy(["price"], false).getRows()[0].region).toBe("NSW1")
    expect(datatable.describe().price.count).toBe(2)
    expect(datatable.toConsole()[0].interval).toBe("2026-10-04T14:00:00.000Z")
  })
})
