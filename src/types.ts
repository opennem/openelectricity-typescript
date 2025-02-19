/**
 * Type definitions for OpenElectricity API
 */

import { IFacilityRecord } from "./client"
import { DataTable } from "./datatable"
import { RecordTable } from "./recordtable"

// Network and Data Types
export type NetworkCode = "NEM" | "WEM" | "AU"
export type DataInterval = "5m" | "1h" | "1d" | "7d" | "1M" | "3M" | "season" | "1y" | "fy"
export type DataPrimaryGrouping = "network" | "network_region"
export type DataSecondaryGrouping = "fueltech" | "fueltech_group" | "renewable"

// Metric Types
export type DataMetric = "power" | "energy" | "emissions" | "market_value"
export type MarketMetric = "price" | "demand" | "demand_energy"
export type Metric = DataMetric | MarketMetric

// Facility Types
export type UnitStatusType = "committed" | "operating" | "retired"
export type UnitFueltechType =
  | "battery"
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
  | "other"
  | "solar"
  | "wind"
  | "wind_offshore"
  | "imports"
  | "exports"
  | "interconnector"
  | "aggregator_vpp"
  | "aggregator_dr"

export type UnitDispatchType = "GENERATOR" | "LOAD" | "NETWORK" | "INTERCONNECTOR"

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
}

export interface INetworkTimeSeriesParams extends IMarketTimeSeriesParams {
  secondaryGrouping?: DataSecondaryGrouping
}

export interface IFacilityParams {
  status_id?: UnitStatusType[]
  fueltech_id?: UnitFueltechType[]
  network_id?: NetworkCode | NetworkCode[]
  network_region?: string
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
