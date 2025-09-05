/**
 * Type definitions for OpenElectricity API
 */

import type { IFacilityRecord } from "./client"
import type { DataTable } from "./datatable"
import type { RecordTable } from "./recordtable"

// Network and Data Types
export type NetworkCode = "NEM" | "WEM" | "AU"
export type DataInterval =
  | "5m"
  | "1h"
  | "1d"
  | "7d"
  | "1M"
  | "3M"
  | "season"
  | "1y"
  | "fy"
export type DataPrimaryGrouping = "network" | "network_region"
export type DataSecondaryGrouping = "fueltech" | "fueltech_group" | "renewable"

// Metric Types
export type DataMetric =
  | "power"
  | "energy"
  | "emissions"
  | "market_value"
  | "pollution"
  | "storage_battery"
export type MarketMetric =
  | "price"
  | "demand"
  | "demand_energy"
  | "curtailment"
  | "curtailment_energy"
  | "curtailment_solar_utility"
  | "curtailment_solar_utility_energy"
  | "curtailment_wind"
  | "curtailment_wind_energy"
export type Metric = DataMetric | MarketMetric

// Facility Types
export type UnitStatusType = "committed" | "operating" | "retired"
export type UnitFueltechType =
  | "battery_charging"
  | "battery_discharging"
  | "bioenergy_biogas"
  | "bioenergy_biomass"
  | "coal_black"
  | "coal_brown"
  | "distillate"
  | "gas_ccgt"
  | "gas_ocgt"
  | "gas_recip"
  | "gas_steam"
  | "gas_wcmg"
  | "hydro"
  | "pumps"
  | "solar_rooftop"
  | "solar_thermal"
  | "solar_utility"
  | "nuclear"
  | "wind"
  | "wind_offshore"
  | "interconnector"

export type UnitFueltechGroupType =
  | "coal"
  | "gas"
  | "wind"
  | "solar"
  | "battery_charging"
  | "battery_discharging"
  | "hydro"
  | "distillate"
  | "bioenergy"
  | "pumps"

export type UnitDispatchType =
  | "GENERATOR"
  | "LOAD"
  | "NETWORK"
  | "INTERCONNECTOR"

export interface IUnit {
  code: string
  fueltech_id: UnitFueltechType | null
  status_id: UnitStatusType | null
  capacity_registered: number | null
  emissions_factor_co2: number | null
  data_first_seen: string | null
  data_last_seen: string | null
  dispatch_type: UnitDispatchType
}

export interface IFacility {
  code: string
  name: string
  network_id: string
  network_region: string
  description: string | null
  units: IUnit[]
}

// Base API Response
export interface IAPIErrorResponse {
  version: string
  response_status: "ERROR"
  error: string
  success: false
}

export interface IValidationErrorDetail {
  error?: string
  supported_metrics?: string[]
  requested_metrics?: string[]
  invalid_metrics?: string[]
  hint?: string
  [key: string]: unknown
}

export interface IMetricMetadata {
  name: string
  unit: string
  description: string
  default_aggregation: string
  precision: number
}

export interface IMetricsResponse {
  metrics: Record<string, IMetricMetadata>
  total: number
  endpoints: {
    market: string[]
    data: string[]
  }
}

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

// Facility Data Types
export interface IFacilityDataRow {
  time: string
  value: number
  facility_code: string
  facility_name: string
  facility_network: string
  facility_region: string
  unit_code: string
  unit_fueltech: UnitFueltechType | null
  unit_status: UnitStatusType | null
  unit_capacity: number | null
  unit_emissions_factor: number | null
  unit_first_seen: string | null
  unit_last_seen: string | null
  unit_dispatch_type: UnitDispatchType
}

export interface IFacilityDataSeries {
  name: string
  date_start: string
  date_end: string
  columns: Record<string, string>
  data: [string, number][]
}

// Request Parameters
export interface IFacilityTimeSeriesParams {
  interval?: DataInterval
  dateStart?: string
  dateEnd?: string
}

export interface IMarketTimeSeriesParams extends IFacilityTimeSeriesParams {
  primaryGrouping?: DataPrimaryGrouping
  network_region?: string
}

export interface INetworkTimeSeriesParams extends IMarketTimeSeriesParams {
  secondaryGrouping?: DataSecondaryGrouping[]
  fueltech?: UnitFueltechType[]
  fueltech_group?: UnitFueltechGroupType[]
}

export interface IFacilityParams {
  status_id?: UnitStatusType[]
  fueltech_id?: UnitFueltechType[]
  network_id?: NetworkCode | NetworkCode[]
  network_region?: string
}

export type PollutantCategory =
  | "air_pollutant"
  | "water_pollutant"
  | "heavy_metal"
  | "organic"

export type PollutantCode =
  // Air pollutants
  | "nox"
  | "so2"
  | "co"
  | "pm10"
  | "pm2_5"
  | "voc"
  | "ammonia"
  | "hcl"
  // Heavy metals
  | "as"
  | "cd"
  | "cr3"
  | "cr6"
  | "cu"
  | "hg"
  | "ni"
  | "pb"
  | "zn"
  // Organic compounds
  | "benzene"
  | "formaldehyde"
  | "pah"
  | "dioxins"
  // Other
  | "fluoride"

export interface IFacilityPollutionParams {
  facility_code?: string[]
  pollutant_code?: PollutantCode[]
  pollutant_category?: PollutantCategory[]
  dateStart?: string
  dateEnd?: string
}

// Response Types
export interface ITimeSeriesResponse {
  response: IAPIResponse<INetworkTimeSeries[]>
  datatable?: DataTable
}

export interface IEmptyFacilityResponse {
  response: {
    version: string
    created_at: string
    success: true
    error: null
    data: []
  }
  table: RecordTable<IFacilityRecord>
}

export interface IFacilityResponse {
  response: IAPIResponse<IFacility[]>
  table: RecordTable<IFacilityRecord>
}

export type FacilityResponse = IFacilityResponse | IEmptyFacilityResponse

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
