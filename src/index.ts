/**
 * OpenElectricity API Client
 * Main entry point for the OpenElectricity API client library
 */

// Export the client
export * from "./client"
export { OpenElectricityClient as default, OpenElectricityClient } from "./client"

// Export all types
export type {
  DataInterval,
  // Metric Types
  DataMetric,
  DataPrimaryGrouping,
  DataSecondaryGrouping,
  // API Response Types
  IAPIResponse,
  // Request Parameter Types
  IFacilityTimeSeriesParams,
  IMarketTimeSeriesParams,
  INetworkTimeSeries,
  INetworkTimeSeriesParams,

  // Response Types
  ITimeSeriesResponse,
  ITimeSeriesResult,
  IUser,
  IUserMeta,
  MarketMetric,
  Metric,
  // Network and Data Types
  NetworkCode,
  UnitDispatchType,
  UnitFueltechGroupType,
  UnitFueltechType,
  UnitStatusType,
  // User Types
  UserPlan
} from "./types"

// Export DataTable types
export type { IDataTableRow, IDescribeResult } from "./datatable"

// Export DataTable class
export { DataTable } from "./datatable"

// Export datetime utilities
export {
  getLastCompleteInterval,
  getNetworkTimezone,
  getNetworkTimezoneOffset,
  isAware,
  makeAware,
  stripTimezone
} from "./datetime"
