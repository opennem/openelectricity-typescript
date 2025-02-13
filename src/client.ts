/**
 * OpenElectricity API Client
 *
 * A TypeScript client for the OpenElectricity API v4.
 * Provides access to electricity network data and metrics.
 */

// Type definitions
export type Interval = '5m' | '1h' | '1d' | '7d' | '1M' | '3M' | 'season' | '1y' | 'fy';
export type PrimaryGrouping = 'network' | 'network_region';
export type SecondaryGrouping = 'fueltech' | 'fueltech_group' | 'status' | 'renewable';
export type Metric = 'power' | 'energy' | 'price' | 'market_value' | 'emissions' | 'renewable_proportion';

export interface TimeSeriesResult {
  name: string;
  date_start: string;
  date_end: string;
  labels: Record<string, string>;
  data: [string, number | null][];
}

export interface NetworkTimeSeries {
  network_code: string;
  metric: Metric;
  unit: string;
  interval: Interval;
  start: string;
  end: string;
  primary_grouping: PrimaryGrouping;
  secondary_groupings: SecondaryGrouping[];
  results: TimeSeriesResult[];
}

export interface NetworkTimeSeriesResponse {
  version: string;
  created_at: string;
  success: boolean;
  error: string | null;
  data: NetworkTimeSeries;
  total_records?: number;
}

export interface OpenElectricityUser {
  valid: boolean;
  id: string;
  owner_id?: string;
  error?: string;
  roles: ('admin' | 'pro' | 'academic' | 'user' | 'anonymous')[];
}

const debug = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[OpenElectricity] ${message}`, data ? data : '');
  }
};

export class OpenElectricityClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(options: {
    apiKey?: string;
    baseUrl?: string;
  } = {}) {
    this.apiKey = options.apiKey || process.env.OPENELECTRICITY_API_KEY || '';
    this.baseUrl = options.baseUrl || process.env.OPENELECTRICITY_API_URL || 'https://api.openelectricity.org.au/v4';

    debug('Initializing client', { baseUrl: this.baseUrl });

    if (!this.apiKey) {
      throw new Error('API key is required. Set OPENELECTRICITY_API_KEY environment variable or pass apiKey in options.');
    }
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    debug('Making request', {
      url,
      method: options.method || 'GET',
      headers: { ...headers, Authorization: '***' }
    });

    const startTime = Date.now();
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const duration = Date.now() - startTime;
    debug(`Request completed in ${duration}ms`, {
      status: response.status,
      statusText: response.statusText
    });

    if (!response.ok) {
      debug('Request failed', {
        status: response.status,
        statusText: response.statusText
      });
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json() as T;
    debug('Response data', data);
    return data;
  }

  async getNetworkEnergy(
    networkCode: string,
    params: {
      interval?: Interval;
      dateStart?: string;
      dateEnd?: string;
      primaryGrouping?: PrimaryGrouping;
      secondaryGrouping?: SecondaryGrouping;
    } = {}
  ): Promise<NetworkTimeSeriesResponse> {
    debug('Getting network energy', { networkCode, params });

    const queryParams = new URLSearchParams();
    if (params.interval) queryParams.set('interval', params.interval);
    if (params.dateStart) queryParams.set('date_start', params.dateStart);
    if (params.dateEnd) queryParams.set('date_end', params.dateEnd);
    if (params.primaryGrouping) queryParams.set('primary_grouping', params.primaryGrouping);
    if (params.secondaryGrouping) queryParams.set('secondary_grouping', params.secondaryGrouping);

    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request<NetworkTimeSeriesResponse>(`/data/energy/network/${networkCode}${query}`);
  }

  async getFacilityEnergy(
    networkCode: string,
    facilityCode: string
  ): Promise<any> {
    debug('Getting facility energy', { networkCode, facilityCode });
    return this.request(`/data/energy/network/${networkCode}/${facilityCode}`);
  }

  async getCurrentUser(): Promise<OpenElectricityUser> {
    debug('Getting current user');
    return this.request('/me');
  }
}
