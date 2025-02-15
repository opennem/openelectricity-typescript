/**
 * DataTable implementation for OpenElectricity API
 * Provides a pandas/polars-like interface for time series data
 */

import { NetworkCode, NetworkTimeSeries } from "./client"

export interface DataTableRow {
  interval: Date
  [key: string]: Date | string | number | boolean | null
}

export class DataTable {
  private rows: DataTableRow[]
  private groupings: string[]
  private metric: string
  private unit: string

  constructor(rows: DataTableRow[], groupings: string[], metric: string, unit: string) {
    this.rows = rows
    this.groupings = groupings
    this.metric = metric
    this.unit = unit
  }

  /**
   * Get all rows in the table
   */
  public getRows(): DataTableRow[] {
    return this.rows
  }

  /**
   * Get available grouping columns
   */
  public getGroupings(): string[] {
    return this.groupings
  }

  /**
   * Get the metric name
   */
  public getMetric(): string {
    return this.metric
  }

  /**
   * Get the unit of measurement
   */
  public getUnit(): string {
    return this.unit
  }

  /**
   * Filter rows based on a condition
   */
  public filter(condition: (row: DataTableRow) => boolean): DataTable {
    return new DataTable(this.rows.filter(condition), this.groupings, this.metric, this.unit)
  }

  /**
   * Select specific columns
   */
  public select(columns: string[]): DataTable {
    const newRows = this.rows.map((row) => {
      const newRow: DataTableRow = { interval: row.interval }
      columns.forEach((col) => {
        if (col in row) {
          newRow[col] = row[col]
        }
      })
      return newRow
    })

    return new DataTable(
      newRows,
      this.groupings.filter((g) => columns.includes(g)),
      this.metric,
      this.unit
    )
  }

  /**
   * Group by specified columns and aggregate values
   */
  public groupBy(columns: string[], aggregation: "sum" | "mean" = "sum"): DataTable {
    const groups = new Map<string, DataTableRow[]>()

    // Group rows by the specified columns
    this.rows.forEach((row) => {
      const key = columns.map((col) => `${col}:${row[col]}`).join("_")
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(row)
    })

    // Aggregate values for each group
    const newRows: DataTableRow[] = []
    groups.forEach((groupRows, key) => {
      const firstRow = groupRows[0]
      const newRow: DataTableRow = { interval: firstRow.interval }

      // Add grouping columns
      columns.forEach((col) => {
        newRow[col] = firstRow[col]
      })

      // Aggregate metric value
      if (aggregation === "sum") {
        newRow[this.metric] = groupRows.reduce((sum, row) => sum + (row[this.metric] as number), 0)
      } else {
        newRow[this.metric] = groupRows.reduce((sum, row) => sum + (row[this.metric] as number), 0) / groupRows.length
      }

      newRows.push(newRow)
    })

    return new DataTable(newRows, columns, this.metric, this.unit)
  }

  /**
   * Sort rows by specified columns
   */
  public sortBy(columns: string[], ascending = true): DataTable {
    const sortedRows = [...this.rows].sort((a, b) => {
      for (const col of columns) {
        const aVal = a[col]
        const bVal = b[col]

        if (aVal === null && bVal === null) continue
        if (aVal === null) return ascending ? -1 : 1
        if (bVal === null) return ascending ? 1 : -1

        if (aVal < bVal) return ascending ? -1 : 1
        if (aVal > bVal) return ascending ? 1 : -1
      }
      return 0
    })

    return new DataTable(sortedRows, this.groupings, this.metric, this.unit)
  }

  /**
   * Convert to console-friendly format
   */
  public toConsole(): Record<string, any>[] {
    return this.rows.map((row) => {
      const { interval, ...rest } = row
      return {
        interval: interval.toISOString(),
        ...rest,
      }
    })
  }
}

/**
 * Create a DataTable from NetworkTimeSeries response
 */
export function transformTimeSeriesTable(data: NetworkTimeSeries, network: NetworkCode): DataTable {
  const rows: DataTableRow[] = []
  const groupings = data.groupings || []
  const { metric, unit } = data

  // Process each result into rows
  data.results.forEach((result) => {
    result.data.forEach(([timestamp, value]) => {
      const row: DataTableRow = {
        interval: createNetworkDate(timestamp, data.network_timezone_offset),
        [metric]: value,
      }

      // Add grouping columns from result.columns
      Object.entries(result.columns).forEach(([key, value]) => {
        row[key] = value
      })

      rows.push(row)
    })
  })

  return new DataTable(rows, groupings, metric, unit)
}

/**
 * Creates a date with the correct network timezone
 */
function createNetworkDate(isoString: string, timezoneOffset: string): Date {
  const localIsoString = isoString.replace(/\.\d+Z$|\.\d+[+-]\d+:\d+$|Z$|[+-]\d+:\d+$/, timezoneOffset)
  return new Date(localIsoString)
}
