/**
 * OpenElectricity API Client
 *
 * A TypeScript client for the OpenElectricity API v4.
 * Provides access to electricity network data and metrics.
 */

/// <reference lib="dom" />

import { createDataTable } from "./datatable"
import {
  DataMetric,
  IAPIResponse,
  IFacilityTimeSeriesParams,
  IMarketTimeSeriesParams,
  INetworkTimeSeries,
  INetworkTimeSeriesParams,
  ITimeSeriesResponse,
  IUser,
  MarketMetric,
  NetworkCode,
} from "./types"
import { debug } from "./utils"

export interface IFacilityEnergy {
  facility_code: string
  network_code: NetworkCode
  energy: number
  interval: string
  start: string
  end: string
}

export class OpenElectricityClient {
  private baseUrl: string
  private apiKey: string

  // private static apiVersion: string = "v4"

  constructor(
    options: {
      apiKey?: string
      baseUrl?: string
    } = {}
  ) {
    // eslint-disable-next-line no-undef
    this.apiKey = options.apiKey || process?.env?.OPENELECTRICITY_API_KEY || ""
    if (!this.apiKey) {
      throw new Error("API key is required")
    }
    // eslint-disable-next-line no-undef
    this.baseUrl = options.baseUrl || process?.env?.OPENELECTRICITY_API_URL || "https://api.openelectricity.org.au/v4"

    debug("Initializing client", { baseUrl: this.baseUrl })
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<IAPIResponse<T>> {
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
    // eslint-disable-next-line no-undef
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

    const data = (await response.json()) as IAPIResponse<T>
    return data
  }

  /**
   * Get data from the /data/network endpoint
   * Supports power, energy, emissions and market_value metrics
   */
  async getNetworkData(
    networkCode: NetworkCode,
    metrics: DataMetric[],
    params: INetworkTimeSeriesParams = {}
  ): Promise<ITimeSeriesResponse> {
    debug("Getting network data", { networkCode, metrics, params })

    const queryParams = new URLSearchParams()
    metrics.forEach((metric) => queryParams.append("metrics", metric))
    if (params.interval) queryParams.set("interval", params.interval)
    if (params.dateStart) queryParams.set("date_start", params.dateStart)
    if (params.dateEnd) queryParams.set("date_end", params.dateEnd)
    if (params.primaryGrouping) queryParams.set("primary_grouping", params.primaryGrouping)
    if (params.secondaryGrouping) queryParams.set("secondary_grouping", params.secondaryGrouping)

    const query = queryParams.toString() ? `?${queryParams.toString()}` : ""
    const response = await this.request<INetworkTimeSeries[]>(`/data/network/${networkCode}${query}`)

    return {
      response,
      datatable: createDataTable(response.data),
    }
  }

  /**
   * Get data from the /facility endpoint
   * Supports power, energy, emissions and market_value metrics
   */
  async getFacilityData(
    networkCode: NetworkCode,
    facilityCode: string,
    metrics: DataMetric[],
    params: IFacilityTimeSeriesParams = {}
  ): Promise<ITimeSeriesResponse> {
    debug("Getting facility data", { networkCode, facilityCode, metrics, params })

    const queryParams = new URLSearchParams()
    metrics.forEach((metric) => queryParams.append("metrics", metric))
    if (params.interval) queryParams.set("interval", params.interval)
    if (params.dateStart) queryParams.set("date_start", params.dateStart)
    if (params.dateEnd) queryParams.set("date_end", params.dateEnd)

    const query = queryParams.toString() ? `?${queryParams.toString()}` : ""
    const response = await this.request<INetworkTimeSeries[]>(`/data/facility/${networkCode}/${facilityCode}${query}`)

    return {
      response,
      datatable: createDataTable(response.data),
    }
  }

  /**
   * Get data from the /market/network endpoint
   * Supports price, demand and demand_energy metrics
   */
  async getMarket(
    networkCode: NetworkCode,
    metrics: MarketMetric[],
    params: IMarketTimeSeriesParams = {}
  ): Promise<ITimeSeriesResponse> {
    debug("Getting market data", { networkCode, metrics, params })

    const queryParams = new URLSearchParams()
    metrics.forEach((metric) => queryParams.append("metrics", metric))
    if (params.interval) queryParams.set("interval", params.interval)
    if (params.dateStart) queryParams.set("date_start", params.dateStart)
    if (params.dateEnd) queryParams.set("date_end", params.dateEnd)
    if (params.primaryGrouping) queryParams.set("primary_grouping", params.primaryGrouping)

    const query = queryParams.toString() ? `?${queryParams.toString()}` : ""
    const response = await this.request<INetworkTimeSeries[]>(`/market/network/${networkCode}${query}`)

    return {
      response,
      datatable: createDataTable(response.data),
    }
  }

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<IAPIResponse<IUser>> {
    debug("Getting current user")
    return this.request<IUser>("/me")
  }
}
