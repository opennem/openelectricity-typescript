/**
 * DataTable implementation for OpenElectricity API
 * Provides a pandas/polars-like interface for time series data
 */

import { createNetworkDate } from "./datetime"

import type { INetworkTimeSeries } from "./types"

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

interface IDataTableCache {
  sortedRows?: Map<string, IDataTableRow[]>
  groupedRows?: Map<string, Map<string, IDataTableRow[]>>
  latestTimestamp?: number
  columnIndexes?: Map<string, Map<string | number | boolean, IDataTableRow[]>>
}

export class DataTable {
  private rows: IDataTableRow[]
  private groupings: string[]
  private metrics: Map<string, string>
  private cache: IDataTableCache = {}
  private rowsMap: Map<string, IDataTableRow>

  constructor(
    rows: IDataTableRow[],
    groupings: string[],
    metrics: Map<string, string>,
  ) {
    this.rows = rows
    this.groupings = groupings
    this.metrics = metrics
    this.rowsMap = new Map()

    // Create initial indexes
    this.createRowMap()
    this.createColumnIndexes()
  }

  /**
   * Create a DataTable from NetworkTimeSeries responses
   */
  public static fromNetworkTimeSeries(data: INetworkTimeSeries[]): DataTable {
    const rows: IDataTableRow[] = []
    const groupings = data[0].groupings || []
    const metrics = new Map<string, string>()
    const table = new DataTable(rows, groupings, metrics)

    // Create a map of all metrics and their units
    data.forEach((series) => {
      metrics.set(series.metric, series.unit)
    })

    // Process each time series into rows
    data.forEach((series) => {
      series.results.forEach((result) => {
        result.data.forEach(([timestamp, value]) => {
          const date = createNetworkDate(
            timestamp,
            series.network_timezone_offset,
          )
          const dateKey = date.toISOString()

          // Create a unique key for the row
          const rowKey = [
            dateKey,
            ...Object.entries(result.columns).map(([k, v]) => `${k}:${v}`),
          ].join("_")

          // Find or create row using rowsMap
          let row = table.getRowByKey(rowKey)
          if (!row) {
            row = {
              interval: date,
              ...result.columns,
              [series.metric]: value,
            }
          } else {
            row[series.metric] = value
          }
          table.setRowByKey(rowKey, row)
        })
      })
    })

    // Sort rows by interval
    table.rows.sort((a, b) => a.interval.getTime() - b.interval.getTime())

    return table
  }

  private createRowMap(): void {
    this.rowsMap = new Map(
      this.rows.map((row) => [this.createRowKey(row), row]),
    )
  }

  private createRowKey(row: IDataTableRow): string {
    const parts = [row.interval.toISOString()]
    for (const grouping of this.groupings) {
      parts.push(`${grouping}:${row[grouping]}`)
    }
    return parts.join("_")
  }

  private createColumnIndexes(): void {
    this.cache.columnIndexes = new Map()

    // Create indexes for grouping columns
    for (const column of this.groupings) {
      const columnIndex = new Map<string | number | boolean, IDataTableRow[]>()

      for (const row of this.rows) {
        const value = row[column]
        // Skip null values in index
        if (value === null || value instanceof Date) continue

        if (!columnIndex.has(value)) {
          columnIndex.set(value, [])
        }
        const rows = columnIndex.get(value)
        if (rows) {
          rows.push(row)
        }
      }

      this.cache.columnIndexes.set(column, columnIndex)
    }
  }

  /**
   * Get a row by its unique key
   * Used internally for efficient row lookups
   */
  private getRowByKey(key: string): IDataTableRow | undefined {
    return this.rowsMap.get(key)
  }

  /**
   * Update or add a row by its key
   * Used internally for merging data
   */
  private setRowByKey(key: string, row: IDataTableRow): void {
    this.rowsMap.set(key, row)
    if (!this.rows.includes(row)) {
      this.rows.push(row)
    }
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
   * Get the latest timestamp in the data
   */
  public getLatestTimestamp(): number {
    if (!this.cache.latestTimestamp) {
      this.cache.latestTimestamp = Math.max(
        ...this.rows.map((r) => r.interval.getTime()),
      )
    }
    return this.cache.latestTimestamp
  }

  /**
   * Filter rows based on a condition
   */
  public filter(condition: (row: IDataTableRow) => boolean): DataTable {
    // Check if we can use index for simple equality conditions
    const indexedFilter = this.tryIndexFilter(condition)
    if (indexedFilter) {
      return indexedFilter
    }

    // Fall back to regular filter for complex conditions
    const filteredRows = this.rows.filter(condition)
    return new DataTable(filteredRows, this.groupings, this.metrics)
  }

  private tryIndexFilter(
    condition: (row: IDataTableRow) => boolean,
  ): DataTable | null {
    // Try to find matching rows in our column indexes
    for (const [column, columnIndex] of this.cache.columnIndexes || []) {
      // Test the first row to see if this is a simple equality check on this column
      if (this.rows.length === 0) return null
      const testRow = { ...this.rows[0] }

      // Try each possible value from the index
      for (const [value, rows] of columnIndex) {
        // Test if this is an equality check for this value
        testRow[column] = value
        const otherValues = { ...testRow }
        otherValues[column] =
          value === true ? false : value === false ? true : value === 0 ? 1 : 0

        if (condition(testRow) && !condition(otherValues)) {
          return new DataTable([...rows], this.groupings, this.metrics)
        }
      }
    }

    return null
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
      newMetrics,
    )
  }

  /**
   * Group by specified columns and aggregate values
   */
  public groupBy(
    columns: string[],
    aggregation: "sum" | "mean" = "sum",
  ): DataTable {
    const cacheKey = `${columns.join("_")}_${aggregation}`
    const cachedGroups = this.cache.groupedRows?.get(cacheKey)
    if (cachedGroups) {
      return new DataTable(
        Array.from(cachedGroups.values()).flat(),
        columns,
        this.metrics,
      )
    }

    const groups = new Map<string, IDataTableRow[]>()
    const groupKeyMap = new Map<string, Record<string, unknown>>()

    // Single pass grouping and aggregation
    for (const row of this.rows) {
      const groupKey = columns.map((col) => `${col}:${row[col]}`).join("_")

      if (!groups.has(groupKey)) {
        groups.set(groupKey, [])
        groupKeyMap.set(
          groupKey,
          columns.reduce(
            (acc, col) => {
              acc[col] = row[col]
              return acc
            },
            {} as Record<string, unknown>,
          ),
        )
      }

      const groupRows = groups.get(groupKey)
      if (groupRows) {
        groupRows.push(row)
      }
    }

    // Efficient aggregation using pre-allocated arrays
    const newRows: IDataTableRow[] = []
    const metricNames = Array.from(this.metrics.keys())

    for (const [groupKey, groupRows] of groups) {
      const groupValues = groupKeyMap.get(groupKey)
      if (!groupValues) continue

      const newRow: IDataTableRow = {
        interval: groupRows[0].interval,
        ...(groupValues as Record<string, unknown>),
      }

      // Pre-allocate arrays for metric values
      const metricArrays = new Map<string, number[]>()
      metricNames.forEach((metric) => {
        metricArrays.set(metric, new Array(groupRows.length))
      })

      // Single pass to collect all metric values
      for (let i = 0; i < groupRows.length; i++) {
        const row = groupRows[i]
        metricNames.forEach((metric) => {
          const value = row[metric] as number
          const metricArray = metricArrays.get(metric)
          if (value !== null && !Number.isNaN(value) && metricArray) {
            metricArray[i] = value
          }
        })
      }

      // Calculate aggregations
      metricNames.forEach((metric) => {
        const metricArray = metricArrays.get(metric)
        if (metricArray) {
          const values = metricArray.filter((v) => v !== undefined)
          if (values.length > 0) {
            const sum = values.reduce((a, b) => a + b, 0)
            newRow[metric] = aggregation === "sum" ? sum : sum / values.length
          } else {
            newRow[metric] = null
          }
        }
      })

      newRows.push(newRow)
    }

    // Cache the results
    if (!this.cache.groupedRows) {
      this.cache.groupedRows = new Map()
    }
    this.cache.groupedRows.set(cacheKey, groups)

    return new DataTable(newRows, columns, this.metrics)
  }

  /**
   * Sort rows by specified columns
   */
  public sortBy(columns: string[], ascending = true): DataTable {
    const cacheKey = `${columns.join("_")}_${ascending}`
    const cachedRows = this.cache.sortedRows?.get(cacheKey)
    if (cachedRows) {
      return new DataTable([...cachedRows], this.groupings, this.metrics)
    }

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

    // Cache the results
    if (!this.cache.sortedRows) {
      this.cache.sortedRows = new Map()
    }
    this.cache.sortedRows.set(cacheKey, sortedRows)

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
    const numericColumns = Object.keys(this.rows[0] || {}).filter(
      (key) => typeof this.rows[0][key] === "number",
    )

    // Pre-allocate arrays for each column
    const columnArrays = new Map<string, number[]>()
    numericColumns.forEach((column) => {
      columnArrays.set(column, [])
    })

    // Single pass to collect all values
    for (const row of this.rows) {
      numericColumns.forEach((column) => {
        const value = row[column] as number
        const columnArray = columnArrays.get(column)
        if (typeof value === "number" && !Number.isNaN(value) && columnArray) {
          columnArray.push(value)
        }
      })
    }

    // Calculate statistics for each column
    numericColumns.forEach((column) => {
      const values = columnArrays.get(column)
      if (!values || values.length === 0) return

      values.sort((a, b) => a - b)
      const count = values.length
      const sum = values.reduce((a, b) => a + b, 0)
      const mean = sum / count

      // Calculate variance in single pass
      let variance = 0
      for (const value of values) {
        variance += (value - mean) ** 2
      }
      variance /= count

      result[column] = {
        count,
        mean,
        std: Math.sqrt(variance),
        min: values[0],
        q25: values[Math.floor(count * 0.25)],
        median: values[Math.floor(count * 0.5)],
        q75: values[Math.floor(count * 0.75)],
        max: values[values.length - 1],
      }
    })

    return result
  }
}

/**
 * Create a DataTable from NetworkTimeSeries responses
 */
export function createDataTable(data: INetworkTimeSeries[]): DataTable {
  return DataTable.fromNetworkTimeSeries(data)
}
