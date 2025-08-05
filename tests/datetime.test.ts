/**
 * Tests for datetime utilities
 */

import dayjs from "dayjs"
import timezone from "dayjs/plugin/timezone"
import utc from "dayjs/plugin/utc"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  createNetworkDate,
  getLastCompleteInterval,
  getNetworkTimezone,
  getNetworkTimezoneOffset,
  isAware,
  makeAware,
  stripTimezone,
} from "../src/datetime"

dayjs.extend(utc)
dayjs.extend(timezone)

describe("datetime utilities", () => {
  it("getNetworkTimezone returns correct offsets", () => {
    expect(getNetworkTimezone("NEM")).toBe(10)
    expect(getNetworkTimezone("WEM")).toBe(8)
    expect(getNetworkTimezone("AU")).toBe(10)
  })

  it("getNetworkTimezoneOffset converts hours to milliseconds", () => {
    expect(getNetworkTimezoneOffset("NEM")).toBe(10 * 60 * 60 * 1000)
    expect(getNetworkTimezoneOffset("WEM")).toBe(8 * 60 * 60 * 1000)
  })

  it("isAware detects timezone information", () => {
    expect(isAware("2024-01-01T00:00:00Z")).toBe(true)
    expect(isAware("2024-01-01T00:00:00+10:00")).toBe(true)
    expect(isAware("2024-01-01T00:00:00-08:00")).toBe(true)
    expect(isAware("2024-01-01T00:00:00")).toBe(false)
    expect(isAware(new Date())).toBe(false)
  })

  it("makeAware adds network timezone", () => {
    const date = "2024-01-01T00:00:00"
    expect(makeAware(date, "NEM")).toBe("2024-01-01T00:00:00+10:00")
    expect(makeAware(date, "WEM")).toBe("2024-01-01T00:00:00+08:00")

    const dateObj = new Date("2024-01-01T00:00:00")
    expect(makeAware(dateObj, "NEM")).toBe("2024-01-01T00:00:00+10:00")
  })

  it("stripTimezone removes timezone information", () => {
    expect(stripTimezone("2024-01-01T00:00:00Z")).toBe("2024-01-01T00:00:00")
    expect(stripTimezone("2024-01-01T00:00:00+10:00")).toBe("2024-01-01T00:00:00")
    expect(stripTimezone("2024-01-01T00:00:00-08:00")).toBe("2024-01-01T00:00:00")
    expect(stripTimezone("2024-01-01T00:00:00")).toBe("2024-01-01T00:00:00")
  })

  describe("getLastCompleteInterval", () => {
    const mockNow = "2024-01-01T10:17:00Z" // 20:17 in AEST (UTC+10)
    const mockDayjs = dayjs(mockNow)

    beforeEach(() => {
      // Mock dayjs.utc() to return our fixed time
      vi.spyOn(dayjs, "utc").mockImplementation(() => mockDayjs)
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it("returns correct interval for NEM (UTC+10)", () => {
      const result = getLastCompleteInterval("NEM")
      // At 20:17 AEST, the last complete 5-min interval should be 20:10
      expect(result).toBe("2024-01-01T20:10:00")
    })

    it("returns correct interval for WEM (UTC+8)", () => {
      const result = getLastCompleteInterval("WEM")
      // At 18:17 AWST, the last complete 5-min interval should be 18:10
      expect(result).toBe("2024-01-01T18:10:00")
    })

    it("returns interval aligned to 5 minutes", () => {
      const result = getLastCompleteInterval("NEM")
      const minutes = parseInt(result.split(":")[1])
      expect(minutes % 5).toBe(0)
    })

    it("returns time in network timezone", () => {
      const result = getLastCompleteInterval("NEM")
      const hour = parseInt(result.split("T")[1].split(":")[0])
      // Should be 20:xx AEST when UTC is 10:xx
      expect(hour).toBe(20)
    })
  })

  describe("createNetworkDate", () => {
    it("correctly parses timezone-aware ISO strings", () => {
      // Test standard case
      const date1 = createNetworkDate("2024-01-01T00:00:00+10:00")
      expect(date1.toISOString()).toBe("2023-12-31T14:00:00.000Z")

      // Test with different timezone
      const date2 = createNetworkDate("2024-01-01T00:00:00+08:00")
      expect(date2.toISOString()).toBe("2023-12-31T16:00:00.000Z")
    })

    it("handles DST transition dates correctly", () => {
      // Australian DST ends (first Sunday in April)
      const dstEndDate = createNetworkDate("2024-04-07T00:00:00+10:00")
      expect(dstEndDate.toISOString()).toBe("2024-04-06T14:00:00.000Z")

      // Australian DST begins (first Sunday in October)
      const dstStartDate = createNetworkDate("2024-10-06T00:00:00+11:00")
      expect(dstStartDate.toISOString()).toBe("2024-10-05T13:00:00.000Z")
    })

    it("produces consistent results regardless of local timezone", () => {
      // These should always produce the same UTC time, regardless of where the test runs
      const testCases = [
        { input: "2024-04-07T00:00:00+10:00", expected: "2024-04-06T14:00:00.000Z" },
        { input: "2024-04-07T00:00:00+11:00", expected: "2024-04-06T13:00:00.000Z" },
        { input: "2024-12-31T00:00:00+11:00", expected: "2024-12-30T13:00:00.000Z" },
        { input: "2024-01-01T00:00:00+10:00", expected: "2023-12-31T14:00:00.000Z" },
      ]

      testCases.forEach(({ input, expected }) => {
        const date = createNetworkDate(input)
        expect(date.toISOString()).toBe(expected)
      })
    })

    it("handles edge cases", () => {
      // Midnight on DST transition
      const midnight = createNetworkDate("2024-04-07T00:00:00+10:00")
      expect(midnight.getUTCHours()).toBe(14) // Should be 2 PM UTC

      // Noon on DST transition
      const noon = createNetworkDate("2024-04-07T12:00:00+10:00")
      expect(noon.getUTCHours()).toBe(2) // Should be 2 AM UTC
    })

    it("preserves the exact time specified in the ISO string", () => {
      // The function should not shift dates based on local timezone
      const date = createNetworkDate("2024-04-07T00:00:00+10:00")
      
      // Convert back to AEST to verify
      const aestHours = (date.getUTCHours() + 10) % 24
      const aestDate = date.getUTCDate() + Math.floor((date.getUTCHours() + 10) / 24)
      
      expect(aestHours).toBe(0) // Midnight
      expect(aestDate).toBe(7) // April 7
    })
  })
})
