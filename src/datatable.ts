/**
 * Utility functions for OpenElectricity API client
 */

import { NetworkCode, NetworkTimeSeries } from './client';
import { NETWORK_TIMEZONE_OFFSETS } from './config';

export interface TimeSeriesTable {
  timestamps: Date[];
  columns: {
    name: string;
    values: (number | null)[];
    labels: Record<string, string>;
  }[];
}

/**
 * Creates a date with the correct network timezone
 * @param isoString ISO timestamp string
 * @param network Network code for timezone
 * @returns Date object with correct timezone offset
 */
function createNetworkDate(isoString: string, network: NetworkCode): Date {
  const offset = NETWORK_TIMEZONE_OFFSETS[network];
  const offsetStr = offset >= 0 ? `+${offset.toString().padStart(2, '0')}:00` : `-${Math.abs(offset).toString().padStart(2, '0')}:00`;
  // Remove any existing timezone info and add network timezone
  const localIsoString = isoString.replace(/\.\d+Z$|\.\d+[+-]\d+:\d+$|Z$|[+-]\d+:\d+$/, offsetStr);
  return new Date(localIsoString);
}

/**
 * Transforms a NetworkTimeSeries into a tabular format with parsed dates
 * @param timeSeries The network time series data to transform
 * @param network Network code for timezone information (required)
 * @returns A table representation with parsed dates and columns
 */
export function transformTimeSeriesTable(timeSeries: NetworkTimeSeries, network: NetworkCode): TimeSeriesTable {
  if (!network) {
    throw new Error('Network code is required for correct timezone handling');
  }

  // Get unique sorted timestamps from all results
  const timestamps = new Set<string>();
  timeSeries.results.forEach(result => {
    result.data.forEach(([timestamp]) => timestamps.add(timestamp));
  });

  // Sort timestamps and parse into Date objects with network timezone
  const sortedTimestamps = Array.from(timestamps)
    .sort()
    .reverse()
    .map(timestamp => createNetworkDate(timestamp, network));

  // Create a map of timestamp -> value for each result
  const columns = timeSeries.results.map(result => {
    // Create a map using the ISO string representation for comparison
    const valueMap = new Map(
      result.data.map(([timestamp, value]) => {
        const date = createNetworkDate(timestamp, network);
        return [date, value];
      })
    );

    return {
      name: result.name,
      labels: result.labels,
      values: sortedTimestamps.map(date => valueMap.get(date) ?? null)
    };
  });

  return {
    timestamps: sortedTimestamps,
    columns
  };
}

/**
 * Creates a console-friendly table from a TimeSeriesTable
 * @param table The time series table to format
 * @returns An object suitable for console.table()
 */
export function createConsoleTable(table: TimeSeriesTable): Record<string, Record<string, string | number | null>> {
  const result: Record<string, Record<string, string | number | null>> = {};

  table.timestamps.forEach((timestamp, i) => {
    result[timestamp.toISOString()] = table.columns.reduce(
      (acc, column) => ({
        ...acc,
        [column.name]: column.values[i]
      }),
      {}
    );
  });

  return result;
}

/**
 * Time series data manipulation utilities
 */
export class TimeSeriesData {
  private _table: TimeSeriesTable;

  constructor(table: TimeSeriesTable) {
    this._table = table;
  }

  /**
   * Accessor for the underlying table
   */
  get table() {
    return this._table;
  }

  /**
   * Calculate mean values for each column
   */
  mean() {
    return this._table.columns.map(col => ({
      name: col.name,
      value: col.values.filter(val => val !== null).reduce((sum, val) => sum + (val ?? 0), 0) / col.values.filter(val => val !== null).length,
      labels: col.labels
    }));
  }

  /**
   * Filter time series data by value threshold
   */
  filter(columnName: string, threshold: number, operator: '>' | '<' | '==' = '>') {
    const column = this._table.columns.find(c => c.name === columnName);
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
      timestamps: this._table.timestamps.filter((_, i) => filteredIndices[i]),
      columns: this._table.columns.map(col => ({
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
      timestamps: this._table.timestamps,
      columns: this._table.columns.map(col => ({
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
    const relevantColumns = this._table.columns
      .filter(col => columnNames.includes(col.name));

    return {
      name: columnNames.join('+'),
      values: this._table.timestamps.map((_, i) => {
        const values = relevantColumns.map(col => col.values[i] || 0);
        return values.reduce((a, b) => a + b, 0);
      })
    };
  }
}
