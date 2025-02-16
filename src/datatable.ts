/**
 * DataTable implementation for OpenElectricity API
 * Provides a pandas/polars-like interface for time series data
 */

import { INetworkTimeSeries } from "./types"

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
  private metrics: Map<string, string> // Map of metric name to unit

  constructor(rows: IDataTableRow[], groupings: string[], metrics: Map<string, string>) {
    this.rows = rows
    this.groupings = groupings
    this.metrics = metrics
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
   * Get the metrics and their units
   */
  public getMetrics(): Map<string, string> {
    return this.metrics
  }

  /**
   * Filter rows based on a condition
   */
  public filter(condition: (row: IDataTableRow) => boolean): DataTable {
    return new DataTable(this.rows.filter(condition), this.groupings, this.metrics)
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

    // Filter metrics to only include those in selected columns
    const newMetrics = new Map<string, string>()
    this.metrics.forEach((unit, metric) => {
      if (columns.includes(metric)) {
        newMetrics.set(metric, unit)
      }
    })

    return new DataTable(
      newRows,
      this.groupings.filter((g) => columns.includes(g)),
      newMetrics
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
        groups.set(groupKey, [row])
      } else {
        groups.get(groupKey)?.push(row)
      }
    })

    // Aggregate values for each group
    const newRows: IDataTableRow[] = []
    groups.forEach((groupRows) => {
      const firstRow = groupRows[0]
      const newRow: IDataTableRow = {
        interval: firstRow.interval,
      }

      // Add grouping columns
      columns.forEach((col) => {
        newRow[col] = firstRow[col]
      })

      // Aggregate metric values
      this.metrics.forEach((_, metric) => {
        const values = groupRows.map((row) => row[metric] as number).filter((val) => val !== null && !isNaN(val))
        if (values.length > 0) {
          if (aggregation === "sum") {
            newRow[metric] = values.reduce((sum, val) => sum + val, 0)
          } else {
            newRow[metric] = values.reduce((sum, val) => sum + val, 0) / values.length
          }
        } else {
          newRow[metric] = null
        }
      })

      newRows.push(newRow)
    })

    return new DataTable(newRows, columns, this.metrics)
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

    return new DataTable(sortedRows, this.groupings, this.metrics)
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
 * Create a DataTable from NetworkTimeSeries responses
 */
export function createDataTable(data: INetworkTimeSeries[]): DataTable {
  const rows: IDataTableRow[] = []
  const groupings = data[0].groupings || []
  const metrics = new Map<string, string>()

  // Create a map of all metrics and their units
  data.forEach((series) => {
    metrics.set(series.metric, series.unit)
  })

  // Process each time series into rows
  data.forEach((series) => {
    series.results.forEach((result) => {
      result.data.forEach(([timestamp, value]) => {
        const date = createNetworkDate(timestamp, series.network_timezone_offset)
        const dateKey = date.toISOString()

        // Find or create row for this timestamp
        let row = rows.find(
          (r) =>
            r.interval.toISOString() === dateKey && Object.entries(result.columns).every(([key, val]) => r[key] === val)
        )

        if (!row) {
          // Create a new row with all columns from the result
          row = {
            interval: date,
            ...result.columns,
            [series.metric]: value,
          }
          rows.push(row)
        } else {
          // Update metric value in existing row
          row[series.metric] = value
        }
      })
    })
  })

  // Sort rows by interval
  rows.sort((a, b) => a.interval.getTime() - b.interval.getTime())

  return new DataTable(rows, groupings, metrics)
}

/**
 * Creates a date with the correct network timezone
 */
function createNetworkDate(isoString: string, timezoneOffset: string): Date {
  // Parse the ISO string into a Date object
  const date = new Date(isoString)

  // Get the timezone offset in minutes
  const offsetMatch = timezoneOffset.match(/([+-])(\d{2}):(\d{2})/)
  if (!offsetMatch) return date

  const [, sign, hours, minutes] = offsetMatch
  const offsetMinutes = (parseInt(hours) * 60 + parseInt(minutes)) * (sign === "+" ? 1 : -1)

  // Adjust the date by the timezone offset
  const utcTime = date.getTime() + (date.getTimezoneOffset() + offsetMinutes) * 60 * 1000
  return new Date(utcTime)
}
