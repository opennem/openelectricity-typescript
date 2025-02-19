/**
 * RecordTable implementation for OpenElectricity API
 * Provides a simple interface for navigating record-style data like facilities
 */

export interface IRecord {
  [key: string]: string | number | boolean | null
}

export class RecordTable<T extends IRecord = IRecord> {
  private records: T[]
  private columnNames: string[]

  constructor(records: T[]) {
    this.records = records
    this.columnNames = records.length > 0 ? Object.keys(records[0]) : []
  }

  /**
   * Get all records
   */
  public getRecords(): T[] {
    return this.records
  }

  /**
   * Get available column names
   */
  public getColumns(): string[] {
    return this.columnNames
  }

  /**
   * Get a subset of columns
   */
  public select(columns: string[]): RecordTable<T> {
    const selectedRecords = this.records.map((record) => {
      const newRecord: IRecord = {}
      columns.forEach((col) => {
        if (col in record) {
          newRecord[col] = record[col]
        }
      })
      return newRecord as T
    })
    return new RecordTable(selectedRecords)
  }

  /**
   * Filter records based on a condition
   */
  public filter(condition: (record: T) => boolean): RecordTable<T> {
    return new RecordTable(this.records.filter(condition))
  }

  /**
   * Sort records by specified columns
   */
  public sortBy(columns: string[], ascending = true): RecordTable<T> {
    const sortedRecords = [...this.records].sort((a, b) => {
      for (const col of columns) {
        const aVal = a[col]
        const bVal = b[col]
        if (aVal === bVal) continue

        if (aVal === null) return ascending ? -1 : 1
        if (bVal === null) return ascending ? 1 : -1

        if (aVal < bVal) return ascending ? -1 : 1
        if (aVal > bVal) return ascending ? 1 : -1
      }
      return 0
    })
    return new RecordTable(sortedRecords)
  }

  /**
   * Get unique values in a column
   */
  public unique(column: string): (string | number | boolean | null)[] {
    const values = new Set<string | number | boolean | null>()
    this.records.forEach((record) => {
      values.add(record[column])
    })
    return Array.from(values)
  }

  /**
   * Get a slice of records
   */
  public slice(start?: number, end?: number): RecordTable<T> {
    return new RecordTable(this.records.slice(start, end))
  }

  /**
   * Convert to array format
   */
  public toArray(): T[] {
    return [...this.records]
  }

  /**
   * Convert to JSON string with pretty formatting
   */
  public toString(): string {
    return JSON.stringify(this.records, null, 2)
  }
}
