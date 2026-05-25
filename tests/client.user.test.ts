import { beforeEach, describe, expect, it, vi } from "vitest"

import { OpenElectricityClient } from "../src"

const mockFetch = vi.fn()
globalThis.fetch = mockFetch as unknown as typeof fetch

describe("getCurrentUser", () => {
  let client: OpenElectricityClient

  beforeEach(() => {
    client = new OpenElectricityClient({ apiKey: "test-key" })
    vi.clearAllMocks()
  })

  it("returns user with full envelope", async () => {
    const body = {
      version: "4.0.1",
      created_at: "2024-01-01T00:00:00",
      success: true,
      error: null,
      data: {
        id: "u_1",
        full_name: "Test User",
        email: "test@example.com",
        owner_id: "o_1",
        plan: "PRO",
        meta: { remaining: 1000 },
        rate_limit: 100,
        roles: ["user", "pro"],
      },
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(body),
    } as Response)

    const result = await client.getCurrentUser()
    expect(result.success).toBe(true)
    expect(result.data.id).toBe("u_1")
    expect(result.data.plan).toBe("PRO")
    expect(result.data.rate_limit).toBe(100)
    expect(result.data.roles).toEqual(["user", "pro"])
  })

  it("accepts envelope without version/created_at", async () => {
    const body = {
      success: true,
      error: null,
      data: {
        id: "u_2",
        full_name: "Community User",
        email: "c@example.com",
        owner_id: "o_2",
        plan: "COMMUNITY",
        meta: { remaining: 0 },
      },
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(body),
    } as Response)

    const result = await client.getCurrentUser()
    expect(result.data.plan).toBe("COMMUNITY")
    expect(result.version).toBeUndefined()
    expect(result.created_at).toBeUndefined()
  })
})
