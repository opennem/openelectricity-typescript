/**
 * OpenElectricity API Client
 *
 * A TypeScript client for the OpenElectricity API v4.
 * Provides access to electricity network data and metrics.
 */

import { debug } from "./utils"

// Type definitions
export type NetworkCode = "NEM" | "WEM" | "AU"
export type DataInterval = "5m" | "1h" | "1d" | "7d" | "1M" | "3M" | "season" | "1y" | "fy"
export type DataPrimaryGrouping = "network" | "network_region"
export type DataSecondaryGrouping = "fueltech" | "fueltech_group" | "renewable"
export type Metric = "power" | "energy" | "price" | "market_value" | "emissions" | "demand" | "demand_power"
export type UserPlan = "BASIC" | "PRO" | "ENTERPRISE"

// Base API Response
export interface APIResponse<T> {
  version: string
  created_at: string
  success: boolean
  error: string | null
  data: T
  total_records?: number
}

// Time Series Types
export interface TimeSeriesResult {
  name: string
  date_start: string
  date_end: string
  columns: Record<string, string | boolean>
  data: [string, number | null][]
}

export interface NetworkTimeSeries {
  network_code: string
  metric: Metric
  unit: string
  interval: DataInterval
  start: string
  end: string
  groupings: DataPrimaryGrouping[] | DataSecondaryGrouping[]
  results: TimeSeriesResult[]
  network_timezone_offset: string
}

// User Types
export interface UserMeta {
  remaining: number
}

export interface User {
  id: string
  full_name: string
  email: string
  owner_id: string
  plan: UserPlan
  meta: UserMeta
}

export class OpenElectricityClient {
  private baseUrl: string
  private apiKey: string

  private static apiVersion: string = "v4"

  constructor(
    options: {
      apiKey?: string
      baseUrl?: string
    } = {}
  ) {
    this.apiKey = options.apiKey || process.env.OPENELECTRICITY_API_KEY || ""
    this.baseUrl = options.baseUrl || process.env.OPENELECTRICITY_API_URL || "https://api.openelectricity.org.au/v4"

    debug("Initializing client", { baseUrl: this.baseUrl })

    if (!this.apiKey) {
      throw new Error(
        "API key is required. Set OPENELECTRICITY_API_KEY environment variable or pass apiKey in options."
      )
    }
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<APIResponse<T>> {
    const url = `${this.baseUrl}${path}`
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      ...options.headers,
    }

    debug("Making request", {
      url,
      method: options.method || "GET",
      headers: { ...headers, Authorization: "***" },
    })

    const startTime = Date.now()
    const response = await fetch(url, {
      ...options,
      headers,
    })

    const duration = Date.now() - startTime
    debug(`Request completed in ${duration}ms`, {
      status: response.status,
      statusText: response.statusText,
    })

    if (!response.ok) {
      debug("Request failed", {
        status: response.status,
        statusText: response.statusText,
      })
      throw new Error(`API request failed: ${response.statusText}`)
    }

    const data = (await response.json()) as APIResponse<T>
    return data
  }

  async getNetworkEnergy(
    networkCode: NetworkCode,
    params: {
      interval?: DataInterval
      dateStart?: string
      dateEnd?: string
      primaryGrouping?: DataPrimaryGrouping
      secondaryGrouping?: DataSecondaryGrouping
    } = {}
  ): Promise<APIResponse<NetworkTimeSeries>> {
    debug("Getting network energy", { networkCode, params })

    const queryParams = new URLSearchParams()
    if (params.interval) queryParams.set("interval", params.interval)
    if (params.dateStart) queryParams.set("date_start", params.dateStart)
    if (params.dateEnd) queryParams.set("date_end", params.dateEnd)
    if (params.primaryGrouping) queryParams.set("primary_grouping", params.primaryGrouping)
    if (params.secondaryGrouping) queryParams.set("secondary_grouping", params.secondaryGrouping)

    const query = queryParams.toString() ? `?${queryParams.toString()}` : ""
    return this.request<NetworkTimeSeries>(`/data/network/${networkCode}/energy${query}`)
  }

  async getFacilityEnergy(networkCode: NetworkCode, facilityCode: string): Promise<APIResponse<any>> {
    debug("Getting facility energy", { networkCode, facilityCode })
    return this.request(`/data/energy/network/${networkCode}/${facilityCode}`)
  }

  async getCurrentUser(): Promise<APIResponse<User>> {
    debug("Getting current user")
    return this.request("/me")
  }

  async getNetworkPower(
    networkCode: NetworkCode,
    params: {
      interval?: DataInterval
      dateStart?: string
      dateEnd?: string
      primaryGrouping?: DataPrimaryGrouping
      secondaryGrouping?: DataSecondaryGrouping
    } = {}
  ): Promise<APIResponse<NetworkTimeSeries>> {
    debug("Getting network power", { networkCode, params })

    const queryParams = new URLSearchParams()
    if (params.interval) queryParams.set("interval", params.interval)
    if (params.dateStart) queryParams.set("date_start", params.dateStart)
    if (params.dateEnd) queryParams.set("date_end", params.dateEnd)
    if (params.primaryGrouping) queryParams.set("primary_grouping", params.primaryGrouping)
    if (params.secondaryGrouping) queryParams.set("secondary_grouping", params.secondaryGrouping)

    const query = queryParams.toString() ? `?${queryParams.toString()}` : ""
    return this.request<NetworkTimeSeries>(`/data/network/${networkCode}/power${query}`)
  }

  async getNetworkPrice(
    networkCode: NetworkCode,
    params: {
      interval?: DataInterval
      dateStart?: string
      dateEnd?: string
      primaryGrouping?: DataPrimaryGrouping
    } = {}
  ): Promise<APIResponse<NetworkTimeSeries>> {
    debug("Getting network price", { networkCode, params })

    const queryParams = new URLSearchParams()
    if (params.interval) queryParams.set("interval", params.interval)
    if (params.dateStart) queryParams.set("date_start", params.dateStart)
    if (params.dateEnd) queryParams.set("date_end", params.dateEnd)
    if (params.primaryGrouping) queryParams.set("primary_grouping", params.primaryGrouping)

    const query = queryParams.toString() ? `?${queryParams.toString()}` : ""
    return this.request<NetworkTimeSeries>(`/data/network/${networkCode}/price${query}`)
  }

  async getNetworkDemand(
    networkCode: NetworkCode,
    params: {
      interval?: DataInterval
      dateStart?: string
      dateEnd?: string
      primaryGrouping?: DataPrimaryGrouping
    } = {}
  ): Promise<APIResponse<NetworkTimeSeries>> {
    debug("Getting network demand", { networkCode, params })

    const queryParams = new URLSearchParams()
    if (params.interval) queryParams.set("interval", params.interval)
    if (params.dateStart) queryParams.set("date_start", params.dateStart)
    if (params.dateEnd) queryParams.set("date_end", params.dateEnd)
    if (params.primaryGrouping) queryParams.set("primary_grouping", params.primaryGrouping)

    const query = queryParams.toString() ? `?${queryParams.toString()}` : ""
    return this.request<NetworkTimeSeries>(`/data/network/${networkCode}/demand${query}`)
  }

  async getNetworkDemandEnergy(
    networkCode: NetworkCode,
    params: {
      interval?: DataInterval
      dateStart?: string
      dateEnd?: string
      primaryGrouping?: DataPrimaryGrouping
    } = {}
  ): Promise<APIResponse<NetworkTimeSeries>> {
    debug("Getting network demand energy", { networkCode, params })

    const queryParams = new URLSearchParams()
    if (params.interval) queryParams.set("interval", params.interval)
    if (params.dateStart) queryParams.set("date_start", params.dateStart)
    if (params.dateEnd) queryParams.set("date_end", params.dateEnd)
    if (params.primaryGrouping) queryParams.set("primary_grouping", params.primaryGrouping)

    const query = queryParams.toString() ? `?${queryParams.toString()}` : ""
    return this.request<NetworkTimeSeries>(`/data/network/${networkCode}/demand_energy${query}`)
  }

  async getNetworkMarketValue(
    networkCode: NetworkCode,
    params: {
      interval?: DataInterval
      dateStart?: string
      dateEnd?: string
      primaryGrouping?: DataPrimaryGrouping
    } = {}
  ): Promise<APIResponse<NetworkTimeSeries>> {
    debug("Getting network market value", { networkCode, params })

    const queryParams = new URLSearchParams()
    if (params.interval) queryParams.set("interval", params.interval)
    if (params.dateStart) queryParams.set("date_start", params.dateStart)
    if (params.dateEnd) queryParams.set("date_end", params.dateEnd)
    if (params.primaryGrouping) queryParams.set("primary_grouping", params.primaryGrouping)

    const query = queryParams.toString() ? `?${queryParams.toString()}` : ""
    return this.request<NetworkTimeSeries>(`/data/network/${networkCode}/market_value${query}`)
  }

  async getNetworkEmissions(
    networkCode: NetworkCode,
    params: {
      interval?: DataInterval
      dateStart?: string
      dateEnd?: string
      primaryGrouping?: DataPrimaryGrouping
    } = {}
  ): Promise<APIResponse<NetworkTimeSeries>> {
    debug("Getting network emissions", { networkCode, params })

    const queryParams = new URLSearchParams()
    if (params.interval) queryParams.set("interval", params.interval)
    if (params.dateStart) queryParams.set("date_start", params.dateStart)
    if (params.dateEnd) queryParams.set("date_end", params.dateEnd)
    if (params.primaryGrouping) queryParams.set("primary_grouping", params.primaryGrouping)

    const query = queryParams.toString() ? `?${queryParams.toString()}` : ""
    return this.request<NetworkTimeSeries>(`/data/network/${networkCode}/emissions${query}`)
  }
}
