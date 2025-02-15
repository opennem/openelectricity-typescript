/* eslint-disable @typescript-eslint/no-explicit-any */

const isDevelopment = (): boolean => {
  try {
    return typeof process !== "undefined" && process.env.NODE_ENV === "development"
  } catch {
    return false // Fallback for environments where process is not available
  }
}

export const debug = (message: string, data?: any): void => {
  if (isDevelopment()) {
    console.debug(`[OpenElectricity] ${message}`, data ?? "")
  }
}
