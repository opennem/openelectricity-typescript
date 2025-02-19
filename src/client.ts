/**
 * OpenElectricity API Client
 *
 * A TypeScript client for the OpenElectricity API v4.
 * Provides access to electricity network data and metrics.
 */

/// <reference lib="dom" />

import { createDataTable } from "./datatable"
import { IRecord, RecordTable } from "./recordtable"
import {
  DataMetric,
  FacilityResponse,
  IAPIErrorResponse,
  IAPIResponse,
  IFacility,
  IFacilityParams,
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

export interface IFacilityRecord extends IRecord {
  facility_code: string
  facility_name: string
  facility_network: string
  facility_region: string
  facility_description: string | null
  unit_code: string
  unit_fueltech: string | null
  unit_status: string | null
  unit_capacity: number | null
  unit_emissions_factor: number | null
  unit_first_seen: string | null
  unit_last_seen: string | null
  unit_dispatch_type: string
  [key: string]: string | number | boolean | null
}

export class OpenElectricityError extends Error {
  constructor(
    message: string,
    public response?: IAPIErrorResponse
  ) {
    super(message)
    this.name = "OpenElectricityError"
  }
}

/**
 * Convert a date string to timezone naive format and warn if timezone information is present
 */
function toTimezoneNaiveDate(date: string | undefined, paramName: string): string | undefined {
  if (!date) return undefined

  // Check if the date has timezone information
  const hasTimezone = date.includes("Z") || /[+-]\d{2}:?\d{2}$/.test(date)
  if (hasTimezone) {
    debug(
      `Warning: ${paramName} contains timezone information which will be stripped. The API requires timezone naive dates.`,
      {
        original: date,
        stripped: date.split(/[Z+-]/)[0],
      }
    )
    return date.split(/[Z+-]/)[0]
  }

  return date
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

    // Special handling for 416 (no results)
    if (response.status === 416) {
      throw new Error("416")
    }

    // Special handling for 403 (permission denied)
    if (response.status === 403) {
      debug("Permission denied", {
        status: response.status,
        statusText: response.statusText,
      })
      throw new Error("Permission denied. Check API key or your access level")
    }

    const data = await response.json()

    // Handle API error responses (4xx errors)
    if (!response.ok && response.status < 500) {
      debug("Request failed with API error", {
        status: response.status,
        data,
      })
      if (this.isAPIErrorResponse(data)) {
        throw new OpenElectricityError(data.error, data)
      }
    }

    // Handle other non-OK responses
    if (!response.ok) {
      debug("Request failed", {
        status: response.status,
        statusText: response.statusText,
      })
      throw new Error(`API request failed: ${response.statusText}`)
    }

    return data as IAPIResponse<T>
  }

  private isAPIErrorResponse(data: unknown): data is IAPIErrorResponse {
    return (
      typeof data === "object" &&
      data !== null &&
      "response_status" in data &&
      data.response_status === "ERROR" &&
      "error" in data &&
      typeof data.error === "string"
    )
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
    const dateStart = toTimezoneNaiveDate(params.dateStart, "dateStart")
    const dateEnd = toTimezoneNaiveDate(params.dateEnd, "dateEnd")
    if (dateStart) queryParams.set("date_start", dateStart)
    if (dateEnd) queryParams.set("date_end", dateEnd)
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
    const dateStart = toTimezoneNaiveDate(params.dateStart, "dateStart")
    const dateEnd = toTimezoneNaiveDate(params.dateEnd, "dateEnd")
    if (dateStart) queryParams.set("date_start", dateStart)
    if (dateEnd) queryParams.set("date_end", dateEnd)

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
    const dateStart = toTimezoneNaiveDate(params.dateStart, "dateStart")
    const dateEnd = toTimezoneNaiveDate(params.dateEnd, "dateEnd")
    if (dateStart) queryParams.set("date_start", dateStart)
    if (dateEnd) queryParams.set("date_end", dateEnd)
    if (params.primaryGrouping) queryParams.set("primary_grouping", params.primaryGrouping)

    const query = queryParams.toString() ? `?${queryParams.toString()}` : ""
    const response = await this.request<INetworkTimeSeries[]>(`/market/network/${networkCode}${query}`)

    return {
      response,
      datatable: createDataTable(response.data),
    }
  }

  /**
   * Get facilities and their units from the /facilities endpoint
   * Optionally filter by status, fueltech, network and region
   * Returns empty result if no facilities match the filters (416 status code)
   */
  async getFacilities(params: IFacilityParams = {}): Promise<FacilityResponse> {
    debug("Getting facilities", { params })

    const queryParams = new URLSearchParams()
    if (params.status_id) {
      params.status_id.forEach((status) => queryParams.append("status_id", status))
    }
    if (params.fueltech_id) {
      params.fueltech_id.forEach((fueltech) => queryParams.append("fueltech_id", fueltech))
    }
    if (params.network_id) {
      if (Array.isArray(params.network_id)) {
        params.network_id.forEach((network) => queryParams.append("network_id", network))
      } else {
        queryParams.append("network_id", params.network_id)
      }
    }
    if (params.network_region) queryParams.set("network_region", params.network_region)

    const query = queryParams.toString() ? `?${queryParams.toString()}` : ""
    try {
      const response = await this.request<IFacility[]>(`/facilities/${query}`)

      // Create a record table with units as rows, including facility information
      const records: IFacilityRecord[] = response.data.flatMap((facility) =>
        facility.units.map((unit) => ({
          facility_code: facility.code,
          facility_name: facility.name,
          facility_network: facility.network_id,
          facility_region: facility.network_region,
          facility_description: facility.description,
          unit_code: unit.code,
          unit_fueltech: unit.fueltech_id,
          unit_status: unit.status_id,
          unit_capacity: unit.capacity_registered,
          unit_emissions_factor: unit.emissions_factor_co2,
          unit_first_seen: unit.data_first_seen,
          unit_last_seen: unit.data_last_seen,
          unit_dispatch_type: unit.dispatch_type,
        }))
      )

      return {
        response,
        table: new RecordTable<IFacilityRecord>(records),
      }
    } catch (error) {
      // Handle 416 status code (no results)
      if (error instanceof Error && error.message.includes("416")) {
        return {
          response: {
            version: "4.0.1",
            created_at: new Date().toISOString(),
            success: true,
            error: null,
            data: [],
          },
          table: new RecordTable<IFacilityRecord>([]),
        }
      }
      throw error
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
