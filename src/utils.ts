/**
 * Utility functions for OpenElectricity client
 */

// eslint-disable-next-line no-undef
const isDevelopment = process?.env?.NODE_ENV === "development"

/**
 * Debug logging function
 * Only logs in development mode
 */
export function debug(message: string, data?: unknown): void {
  if (isDevelopment) {
    // eslint-disable-next-line no-undef, no-console
    console.log(`[OpenElectricity] ${message}`, data ? data : "")
  }
}
