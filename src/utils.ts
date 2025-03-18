/**
 * Utility functions for OpenElectricity client
 */

// Declare global variables to avoid TypeScript errors
declare const process: { env?: { NODE_ENV?: string } } | undefined
declare const window: { location?: { hostname: string } } | undefined
declare const console: { log: (message: string, ...args: unknown[]) => void }

/**
 * Safely detect if we're in a development environment
 * Works in both Node.js, browser, and SSR environments
 */
const isDevelopment = ((): boolean => {
  // Check for Node.js environment
  try {
    // Check for SSR environment (Node.js but potentially missing some browser APIs)
    const isSSR =
      typeof process !== "undefined" &&
      typeof window === "undefined" &&
      process?.env?.NODE_ENV !== undefined

    // If in SSR, use the NODE_ENV value
    if (isSSR) {
      return process?.env?.NODE_ENV === "development"
    }

    // Regular Node.js environment check
    if (
      typeof process !== "undefined" &&
      process?.env?.NODE_ENV === "development"
    ) {
      return true
    }

    // Check for browser development environments
    if (typeof window !== "undefined" && window?.location?.hostname) {
      const hostname = window.location.hostname
      if (
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname.includes("dev.") ||
        hostname.includes(".local")
      ) {
        return true
      }
    }
  } catch {
    // Ignore any errors
  }

  return false
})()

/**
 * Debug logging function
 * Only logs in development mode
 */
export function debug(message: string, data?: unknown): void {
  if (isDevelopment) {
    console.log(`[OpenElectricity] ${message}`, data ? data : "")
  }
}
