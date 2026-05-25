/**
 * OpenElectricity API Client
 * Main entry point for the OpenElectricity API client library
 */

// Export the client
export * from "./client"
export {
  OpenElectricityClient as default,
  OpenElectricityClient,
} from "./client"

// Export enums as constants for easier usage
export { FuelTech, FuelTechGroup, OpenNEMRoles, UnitStatus } from "./types"

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
  IFacilityPollutionParams,
  IFacilityTimeSeriesParams,
  IMarketTimeSeriesParams,
  IMetricMetadata,
  IMetricsResponse,
  INetworkTimeSeries,
  INetworkTimeSeriesParams,
  // Response Types
  ITimeSeriesResponse,
  ITimeSeriesResult,
  IUser,
  IUserMeta,
  IValidationErrorDetail,
  MarketMetric,
  Metric,
  // Network and Data Types
  NetworkCode,
  OpenNEMRolesType,
  UnitDispatchType,
  UnitFueltechGroupType,
  UnitFueltechType,
  UnitStatusType,
  // User Types
  UserPlan,
} from "./types"

// Export DataTable types
export type { IDataTableRow, IDescribeResult } from "./datatable"

// Export DataTable class
export { DataTable } from "./datatable"

// Export RecordTable
export { RecordTable } from "./recordtable"
export type { IRecord } from "./recordtable"

// Export datetime utilities
export {
  createNetworkDate,
  getLastCompleteInterval,
  getNetworkTimezone,
  getNetworkTimezoneOffset,
  isAware,
  makeAware,
  stripTimezone,
} from "./datetime"
