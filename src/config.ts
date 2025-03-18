/**
 * OpenElectricity configuration constants
 */

import type { NetworkCode } from "./types"

/**
 * Network timezone offsets in hours
 * NEM (National Electricity Market): AEST/UTC+10
 * WEM (Western Australia): AWST/UTC+8
 * AU (Australia): AEST/UTC+10
 */
export const NETWORK_TIMEZONE_OFFSETS: Record<NetworkCode, number> = {
  NEM: 10, // AEST
  WEM: 8, // AWST
  AU: 10, // Default to AEST
}

/**
 * Get timezone offset in milliseconds for a network
 * @param network The network code
 * @returns Timezone offset in milliseconds
 */
export function getNetworkTimezoneOffset(network: NetworkCode): number {
  return NETWORK_TIMEZONE_OFFSETS[network] * 60 * 60 * 1000 // Convert hours to milliseconds
}
