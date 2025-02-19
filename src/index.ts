/**
 * OpenElectricity API Client
 * Main entry point for the OpenElectricity API client library
 */

// Export the client
export * from "./client"
export { OpenElectricityClient as default } from "./client"

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
  // User Types
  UserPlan
} from "./types"

// Export DataTable types
export type { IDataTableRow, IDescribeResult } from "./datatable"

// Export DataTable class
export { DataTable } from "./datatable"
