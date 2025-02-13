/**
 * Utility functions for OpenElectricity API client
 */

import { NetworkTimeSeries } from './client';

export interface TimeSeriesTable {
  timestamps: string[];
  columns: {
    name: string;
    values: (number | null)[];
    labels: Record<string, string>;
  }[];
}

/**
 * Transforms time series results into a tabular format
 * @param timeSeries The network time series response data
 * @returns Tabular representation of the time series
 */
export function transformTimeSeriesTable(timeSeries: NetworkTimeSeries): TimeSeriesTable {
  // Get unique sorted timestamps from all results
  const timestamps = new Set<string>();
  timeSeries.results.forEach(result => {
    result.data.forEach(([timestamp]) => timestamps.add(timestamp));
  });

  const sortedTimestamps = Array.from(timestamps).sort().reverse();

  // Create a map of timestamp -> value for each result
  const columns = timeSeries.results.map(result => {
    const valueMap = new Map(result.data);
    return {
      name: result.name,
      labels: result.labels,
      values: sortedTimestamps.map(timestamp => valueMap.get(timestamp) ?? null)
    };
  });

  return {
    timestamps: sortedTimestamps,
    columns
  };
}

/**
 * Creates a console-friendly table from time series data
 * @param table The time series table data
 * @returns Object suitable for console.table
 */
export function createConsoleTable(table: TimeSeriesTable) {
  return table.timestamps.map((timestamp, i) => {
    const row: Record<string, number | null | string> = { timestamp };
    table.columns.forEach(column => {
      row[column.name] = column.values[i];
    });
    return row;
  });
}

/**
 * Time series data manipulation utilities
 */
export class TimeSeriesData {
  private table: TimeSeriesTable;

  constructor(table: TimeSeriesTable) {
    this.table = table;
  }

  /**
   * Calculate mean values for each column
   */
  mean() {
    return this.table.columns.map(col => ({
      name: col.name,
      value: col.values.filter(val => val !== null).reduce((sum, val) => sum + (val ?? 0), 0) / col.values.filter(val => val !== null).length,
      labels: col.labels
    }));
  }

  /**
   * Filter time series data by value threshold
   */
  filter(columnName: string, threshold: number, operator: '>' | '<' | '==' = '>') {
    const column = this.table.columns.find(c => c.name === columnName);
    if (!column) return this;

    const filteredIndices = column.values.map((val, i) => {
      if (!val) return false;
      switch (operator) {
        case '>': return val > threshold;
        case '<': return val < threshold;
        case '==': return val === threshold;
      }
    });

    return new TimeSeriesData({
      timestamps: this.table.timestamps.filter((_, i) => filteredIndices[i]),
      columns: this.table.columns.map(col => ({
        ...col,
        values: col.values.filter((_, i) => filteredIndices[i])
      }))
    });
  }

  /**
   * Calculate rolling average
   */
  rollingAverage(window: number) {
    return new TimeSeriesData({
      timestamps: this.table.timestamps,
      columns: this.table.columns.map(col => ({
        ...col,
        values: col.values.map((_, i) => {
          const slice = col.values.slice(Math.max(0, i - window), i + 1);
          const validValues = slice.filter(v => v !== null) as number[];
          return validValues.length ?
            validValues.reduce((a, b) => a + b, 0) / validValues.length :
            null;
        })
      }))
    });
  }

  /**
   * Sum values across specified columns
   */
  sumColumns(columnNames: string[]) {
    const relevantColumns = this.table.columns
      .filter(col => columnNames.includes(col.name));

    return {
      name: columnNames.join('+'),
      values: this.table.timestamps.map((_, i) => {
        const values = relevantColumns.map(col => col.values[i] || 0);
        return values.reduce((a, b) => a + b, 0);
      })
    };
  }
}
