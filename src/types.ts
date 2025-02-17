/**
 * Type definitions for OpenElectricity API
 */

import { DataTable } from "./datatable"

// Network and Data Types
export type NetworkCode = "NEM" | "WEM" | "AU"
export type DataInterval = "5m" | "1h" | "1d" | "7d" | "1M" | "3M" | "season" | "1y" | "fy"
export type DataPrimaryGrouping = "network" | "network_region"
export type DataSecondaryGrouping = "fueltech" | "fueltech_group" | "renewable"

// Metric Types
export type DataMetric = "power" | "energy" | "emissions" | "market_value"
export type MarketMetric = "price" | "demand" | "demand_energy"
export type Metric = DataMetric | MarketMetric

// Base API Response
export interface IAPIResponse<T> {
  version: string
  created_at: string
  success: boolean
  error: string | null
  data: T
  total_records?: number
}

// Time Series Types
export interface ITimeSeriesResult {
  name: string
  date_start: string
  date_end: string
  columns: Record<string, string | boolean>
  data: [string, number | null][]
}

export interface INetworkTimeSeries {
  network_code: string
  metric: Metric
  unit: string
  interval: DataInterval
  start: string
  end: string
  groupings: DataPrimaryGrouping[] | DataSecondaryGrouping[]
  results: ITimeSeriesResult[]
  network_timezone_offset: string
}

// Request Parameters
export interface ITimeSeriesParams<G = never> {
  interval?: DataInterval
  dateStart?: string
  dateEnd?: string
  primaryGrouping?: DataPrimaryGrouping
  secondaryGrouping?: G
}

export type IMarketTimeSeriesParams = ITimeSeriesParams<never>
export type IDataTimeSeriesParams = ITimeSeriesParams<DataSecondaryGrouping>

// Response Types
export interface ITimeSeriesResponse {
  response: IAPIResponse<INetworkTimeSeries[]>
  datatable?: DataTable
}

// User Types
export type UserPlan = "BASIC" | "PRO" | "ENTERPRISE"

export interface IUserMeta {
  remaining: number
}

export interface IUser {
  id: string
  full_name: string
  email: string
  owner_id: string
  plan: UserPlan
  meta: IUserMeta
}
