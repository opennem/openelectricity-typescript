/**
 * OpenElectricity API Client
 *
 * A TypeScript client for the OpenElectricity API v4.
 * Provides access to electricity network data and metrics.
 */

/// <reference lib="dom" />

import { createDataTable } from "./datatable"
import { isAware, stripTimezone } from "./datetime"
import { type IRecord, RecordTable } from "./recordtable"
import type {
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
    public response?: IAPIErrorResponse,
    public statusCode?: number,
    public details?: any,
  ) {
    super(message)
    this.name = "OpenElectricityError"
  }
}

export class NoDataFound extends Error {
  constructor(message: string) {
    super(message)
    this.name = "NoDataFound"
  }
}

/**
 * Convert a date string to timezone naive format and warn if timezone information is present
 *
 * @param date The date string to process
 * @param paramName The name of the parameter (for warning message)
 * @returns The timezone naive date string
 */
function toTimezoneNaiveDate(
  date: string | undefined,
  paramName: string,
): string | undefined {
  if (!date) return undefined

  if (isAware(date)) {
    debug(
      `Warning: ${paramName} contains timezone information which will be stripped. The API requires timezone naive dates in network time.`,
      {
        original: date,
        stripped: stripTimezone(date),
      },
    )
    return stripTimezone(date)
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
    } = {},
  ) {
    // eslint-disable-next-line no-undef
    this.apiKey = options.apiKey || process?.env?.OPENELECTRICITY_API_KEY || ""
    if (!this.apiKey) {
      throw new Error("API key is required")
    }
    // eslint-disable-next-line no-undef
    this.baseUrl =
      options.baseUrl ||
      process?.env?.OPENELECTRICITY_API_URL ||
      "https://api.openelectricity.org.au/v4"

    debug("Initializing client", { baseUrl: this.baseUrl })
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<IAPIResponse<T>> {
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
      throw new NoDataFound("No data found for the requested parameters")
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

    // Handle API error responses
    if (!response.ok) {
      debug("Request failed", {
        status: response.status,
        statusText: response.statusText,
        data,
      })
      
      // Parse different error response formats
      let errorMessage = `API request failed: ${response.statusText}`
      let errorDetails = null
      
      // Check for standard error response format
      if (this.isAPIErrorResponse(data)) {
        errorMessage = data.error
      } 
      // Check for validation error format with details
      else if (data && typeof data === "object" && "detail" in data) {
        const detail = data.detail
        if (typeof detail === "string") {
          errorMessage = detail
        } else if (typeof detail === "object" && detail !== null) {
          // Handle structured error details (from improved validation)
          if ("error" in detail) {
            errorMessage = detail.error as string
          }
          if ("hint" in detail) {
            errorMessage += ` (${detail.hint})`
          }
          errorDetails = detail
        }
      }
      // Check for simple error message
      else if (data && typeof data === "object" && "error" in data) {
        errorMessage = data.error as string
      }
      
      throw new OpenElectricityError(
        errorMessage,
        this.isAPIErrorResponse(data) ? data : undefined,
        response.status,
        errorDetails || data
      )
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
   * Get available metrics and their metadata
   * Useful for discovering what metrics are supported by the API
   */
  async getAvailableMetrics(): Promise<{
    metrics: Record<string, {
      name: string
      unit: string
      description: string
      default_aggregation: string
      precision: number
    }>
    total: number
    endpoints: {
      market: string[]
      data: string[]
    }
  }> {
    debug("Getting available metrics")
    const url = `${this.baseUrl}/metrics`
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      }
    })
    
    if (!response.ok) {
      throw new Error(`Failed to get metrics: ${response.statusText}`)
    }
    
    return await response.json()
  }

  /**
   * Get data from the /data/network endpoint
   * Supports power, energy, emissions and market_value metrics
   *
   * @remarks
   * dateStart and dateEnd should be timezone naive dates in network time.
   * If timezone information is provided, it will be stripped and a warning will be logged.
   */
  async getNetworkData(
    networkCode: NetworkCode,
    metrics: DataMetric[],
    params: INetworkTimeSeriesParams = {},
  ): Promise<ITimeSeriesResponse> {
    debug("Getting network data", { networkCode, metrics, params })

    const queryParams = new URLSearchParams()
    metrics.forEach((metric) => queryParams.append("metrics", metric))
    if (params.interval) queryParams.set("interval", params.interval)
    const dateStart = toTimezoneNaiveDate(params.dateStart, "dateStart")
    const dateEnd = toTimezoneNaiveDate(params.dateEnd, "dateEnd")
    if (dateStart) queryParams.set("date_start", dateStart)
    if (dateEnd) queryParams.set("date_end", dateEnd)
    if (params.primaryGrouping)
      queryParams.set("primary_grouping", params.primaryGrouping)
    if (params.secondaryGrouping)
      params.secondaryGrouping.forEach((secondaryGrouping) =>
        queryParams.append("secondary_grouping", secondaryGrouping),
      )
    if (params.network_region)
      queryParams.set("network_region", params.network_region)
    if (params.fueltech)
      params.fueltech.forEach((fueltech) =>
        queryParams.append("fueltech", fueltech),
      )
    if (params.fueltech_group)
      params.fueltech_group.forEach((fueltech_group) =>
        queryParams.append("fueltech_group", fueltech_group),
      )

    const query = queryParams.toString() ? `?${queryParams.toString()}` : ""
    const response = await this.request<INetworkTimeSeries[]>(
      `/data/network/${networkCode}${query}`,
    )

    return {
      response,
      datatable: createDataTable(response.data),
    }
  }

  /**
   * Get data from the /facility endpoint
   * Supports power, energy, emissions and market_value metrics
   *
   * @remarks
   * dateStart and dateEnd should be timezone naive dates in network time.
   * If timezone information is provided, it will be stripped and a warning will be logged.
   */
  async getFacilityData(
    networkCode: NetworkCode,
    facilityCodes: string | string[],
    metrics: DataMetric[],
    params: IFacilityTimeSeriesParams = {},
  ): Promise<ITimeSeriesResponse> {
    debug("Getting facility data", {
      networkCode,
      facilityCodes,
      metrics,
      params,
    })

    const queryParams = new URLSearchParams()
    metrics.forEach((metric) => queryParams.append("metrics", metric))
    if (params.interval) queryParams.set("interval", params.interval)
    const dateStart = toTimezoneNaiveDate(params.dateStart, "dateStart")
    const dateEnd = toTimezoneNaiveDate(params.dateEnd, "dateEnd")
    if (dateStart) queryParams.set("date_start", dateStart)
    if (dateEnd) queryParams.set("date_end", dateEnd)

    // Handle single or multiple facility codes
    if (Array.isArray(facilityCodes)) {
      facilityCodes.forEach((code) => queryParams.append("facility_code", code))
    } else {
      queryParams.append("facility_code", facilityCodes)
    }

    const query = queryParams.toString() ? `?${queryParams.toString()}` : ""
    const response = await this.request<INetworkTimeSeries[]>(
      `/data/facilities/${networkCode}${query}`,
    )
    return {
      response,
      datatable: createDataTable(response.data),
    }
  }

  /**
   * Get data from the /market/network endpoint
   * Supports price, demand and demand_energy metrics
   *
   * @remarks
   * dateStart and dateEnd should be timezone naive dates in network time.
   * If timezone information is provided, it will be stripped and a warning will be logged.
   */
  async getMarket(
    networkCode: NetworkCode,
    metrics: MarketMetric[],
    params: IMarketTimeSeriesParams = {},
  ): Promise<ITimeSeriesResponse> {
    debug("Getting market data", { networkCode, metrics, params })

    const queryParams = new URLSearchParams()
    metrics.forEach((metric) => queryParams.append("metrics", metric))
    if (params.interval) queryParams.set("interval", params.interval)
    const dateStart = toTimezoneNaiveDate(params.dateStart, "dateStart")
    const dateEnd = toTimezoneNaiveDate(params.dateEnd, "dateEnd")
    if (dateStart) queryParams.set("date_start", dateStart)
    if (dateEnd) queryParams.set("date_end", dateEnd)
    if (params.primaryGrouping)
      queryParams.set("primary_grouping", params.primaryGrouping)
    if (params.network_region)
      queryParams.set("network_region", params.network_region)

    const query = queryParams.toString() ? `?${queryParams.toString()}` : ""
    const response = await this.request<INetworkTimeSeries[]>(
      `/market/network/${networkCode}${query}`,
    )

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
      params.status_id.forEach((status) =>
        queryParams.append("status_id", status),
      )
    }
    if (params.fueltech_id) {
      params.fueltech_id.forEach((fueltech) =>
        queryParams.append("fueltech_id", fueltech),
      )
    }
    if (params.network_id) {
      if (Array.isArray(params.network_id)) {
        params.network_id.forEach((network) =>
          queryParams.append("network_id", network),
        )
      } else {
        queryParams.append("network_id", params.network_id)
      }
    }
    if (params.network_region)
      queryParams.set("network_region", params.network_region)

    const query = queryParams.toString() ? `?${queryParams.toString()}` : ""
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
      })),
    )

    return {
      response,
      table: new RecordTable<IFacilityRecord>(records),
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
