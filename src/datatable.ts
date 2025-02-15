/**
 * DataTable implementation for OpenElectricity API
 * Provides a pandas/polars-like interface for time series data
 */

import { INetworkTimeSeries } from "./client"

export interface IDataTableRow {
  interval: Date
  [key: string]: Date | string | number | boolean | null
}

export interface IDescribeResult {
  count: number
  mean: number
  std: number
  min: number
  q25: number
  median: number
  q75: number
  max: number
}

export class DataTable {
  private rows: IDataTableRow[]
  private groupings: string[]
  private metric: string
  private unit: string

  constructor(rows: IDataTableRow[], groupings: string[], metric: string, unit: string) {
    this.rows = rows
    this.groupings = groupings
    this.metric = metric
    this.unit = unit
  }

  /**
   * Get all rows in the table
   */
  public getRows(): IDataTableRow[] {
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
  public filter(condition: (row: IDataTableRow) => boolean): DataTable {
    return new DataTable(this.rows.filter(condition), this.groupings, this.metric, this.unit)
  }

  /**
   * Select specific columns
   */
  public select(columns: string[]): DataTable {
    const newRows = this.rows.map((row) => {
      const newRow: IDataTableRow = { interval: row.interval }
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
    const groups = new Map<string, IDataTableRow[]>()

    // Group rows by the specified columns
    this.rows.forEach((row) => {
      const groupKey = columns.map((col) => `${col}:${row[col]}`).join("_")
      if (!groups.has(groupKey)) {
        groups.set(groupKey, [])
      }
      const group = groups.get(groupKey)
      if (group) {
        group.push(row)
      }
    })

    // Aggregate values for each group
    const newRows: IDataTableRow[] = []
    groups.forEach((groupRows) => {
      const firstRow = groupRows[0]
      const newRow: IDataTableRow = { interval: firstRow.interval }

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
  public toConsole(): Record<string, unknown>[] {
    return this.rows.map((row) => {
      const { interval, ...rest } = row
      return {
        interval: interval.toISOString(),
        ...rest,
      }
    })
  }

  /**
   * Generate summary statistics for numeric columns
   */
  public describe(): Record<string, IDescribeResult> {
    const result: Record<string, IDescribeResult> = {}
    const numericColumns = Object.keys(this.rows[0] || {}).filter((key) => typeof this.rows[0][key] === "number")

    numericColumns.forEach((column) => {
      const values = this.rows
        .map((row) => row[column])
        .filter((val): val is number => typeof val === "number" && !isNaN(val))
        .sort((a, b) => a - b)

      if (values.length === 0) return

      const count = values.length
      const mean = values.reduce((sum, val) => sum + val, 0) / count
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / count
      const std = Math.sqrt(variance)
      const min = values[0]
      const max = values[values.length - 1]
      const q25 = values[Math.floor(count * 0.25)]
      const median = values[Math.floor(count * 0.5)]
      const q75 = values[Math.floor(count * 0.75)]

      result[column] = {
        count,
        mean,
        std,
        min,
        q25,
        median,
        q75,
        max,
      }
    })

    return result
  }
}

/**
 * Create a DataTable from NetworkTimeSeries response
 */
export function createDataTable(data: INetworkTimeSeries): DataTable {
  const rows: IDataTableRow[] = []
  const groupings = data.groupings || []
  const { metric, unit } = data

  // Process each result into rows
  data.results.forEach((result) => {
    result.data.forEach(([timestamp, value]) => {
      const row: IDataTableRow = {
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
