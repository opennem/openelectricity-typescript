/**
 * Datetime utilities for OpenElectricity
 *
 * This module provides utilities for handling dates and times in the OpenElectricity API.
 * All functions are timezone-aware and handle network-specific timezone offsets.
 */

import dayjs from "dayjs"
import timezone from "dayjs/plugin/timezone"
import utc from "dayjs/plugin/utc"

import { NetworkCode } from "./types"

dayjs.extend(utc)
dayjs.extend(timezone)

/**
 * Network timezone offsets in hours
 * NEM (National Electricity Market): AEST/UTC+10
 * WEM (Western Australia): AWST/UTC+8
 * AU (Australia): AEST/UTC+10
 */
const NETWORK_TIMEZONE_OFFSETS: Record<NetworkCode, number> = {
  NEM: 10, // AEST
  WEM: 8, // AWST
  AU: 10, // Default to AEST
}

/**
 * Get the timezone offset in hours for a network
 *
 * @param network The network code
 * @returns Timezone offset in hours (e.g. 10 for AEST/UTC+10)
 *
 * @example
 * ```typescript
 * getNetworkTimezone("NEM") // Returns 10 (AEST/UTC+10)
 * getNetworkTimezone("WEM") // Returns 8 (AWST/UTC+8)
 * ```
 */
export function getNetworkTimezone(network: NetworkCode): number {
  return NETWORK_TIMEZONE_OFFSETS[network]
}

/**
 * Get timezone offset in milliseconds for a network
 *
 * @param network The network code
 * @returns Timezone offset in milliseconds
 */
export function getNetworkTimezoneOffset(network: NetworkCode): number {
  return NETWORK_TIMEZONE_OFFSETS[network] * 60 * 60 * 1000 // Convert hours to milliseconds
}

/**
 * Check if a date string is timezone aware (has timezone information)
 *
 * @param dateStr Date string to check
 * @returns true if the date string contains timezone information
 */
export function isAware(dateStr: string | Date): boolean {
  if (dateStr instanceof Date) {
    return false // JavaScript Date objects are always in local time
  }
  return dateStr.includes("Z") || /[+-]\d{2}:?\d{2}$/.test(dateStr)
}

/**
 * Make a date timezone aware by adding the network's timezone offset
 *
 * @param date Date string or Date object to make timezone aware
 * @param network Network code to get timezone from
 * @returns ISO string with timezone information
 */
export function makeAware(date: string | Date, network: NetworkCode): string {
  const offset = NETWORK_TIMEZONE_OFFSETS[network]
  const sign = offset >= 0 ? "+" : "-"
  const absOffset = Math.abs(offset)
  const hours = String(Math.floor(absOffset)).padStart(2, "0")
  const minutes = String((absOffset % 1) * 60).padStart(2, "0")

  const d = dayjs(date)
  return d.format(`YYYY-MM-DDTHH:mm:ss${sign}${hours}:${minutes}`)
}

/**
 * Strip timezone information from a date string
 *
 * @param dateStr Date string to strip timezone from
 * @returns Date string without timezone information
 */
export function stripTimezone(dateStr: string): string {
  // Match everything up to but not including Z, + or - followed by timezone offset
  const match = dateStr.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}/)
  return match ? match[0] : dateStr
}

/**
 * Get the last complete 5-minute interval for a network
 *
 * @param network Network code to get timezone from
 * @returns ISO string of the last complete 5-minute interval in network time
 */
export function getLastCompleteInterval(network: NetworkCode): string {
  const offset = NETWORK_TIMEZONE_OFFSETS[network]

  // Get current time in UTC
  const utcNow = dayjs.utc()

  // Convert to network timezone
  const networkTime = utcNow.utcOffset(offset * 60) // offset in minutes

  // Round down to nearest 5 minutes and subtract 5 minutes to get last complete interval
  const minutes = networkTime.minute()
  const lastInterval = networkTime
    .minute(Math.floor(minutes / 5) * 5)
    .second(0)
    .millisecond(0)
    .subtract(5, "minute")

  // Format without timezone information as required by API
  return lastInterval.format("YYYY-MM-DDTHH:mm:ss")
}
