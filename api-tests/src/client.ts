// api-tests/src/client.ts
 
import axios, { AxiosInstance, AxiosError } from 'axios';

export interface SearchOptions {
  caseSensitive?: boolean;
  maxResults?: number;
}

export interface SearchResult {
  file: string;
  line: number;
  col: number;
  text: string;
  context?: string;
}

export interface EncryptResponse {
  ciphertext: string;
  algorithm: string;
}

export interface DecryptResponse {
  plaintext: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface ClientOptions {
  baseUrl: string;
  apiKey: string;
  tlsOptions?: {
    rejectUnauthorized?: boolean;
    cert?: Buffer;
    key?: Buffer;
    ca?: Buffer;
  };
  timeout?: number;
}

/**
 * Client for Lock & Find API
 */
export class LnFApiClient {
  private client: AxiosInstance;

  constructor(private options: ClientOptions) {
    this.client = axios.create({
      baseURL: options.baseUrl,
      timeout: options.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': options.apiKey,
      },
      httpsAgent: options.tlsOptions ? {
        rejectUnauthorized: options.tlsOptions.rejectUnauthorized ?? true,
        cert: options.tlsOptions.cert,
        key: options.tlsOptions.key,
        ca: options.tlsOptions.ca,
      } : undefined,
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          // Server responded with error
          const data = error.response.data as ApiResponse;
          throw new Error(data.error || `API Error: ${error.response.status}`);
        } else if (error.request) {
          // Request was made but no response received
          throw new Error('No response from API server. Is it running?');
        } else {
          // Error setting up request
          throw new Error(`Request error: ${error.message}`);
        }
      }
    );
  }

  /**
   * Search vault using regular expression
   */
  async regexSearch(
    query: string,
    options?: SearchOptions
  ): Promise<SearchResult[]> {
    const response = await this.client.post<ApiResponse<SearchResult[]>>(
      '/api/search/regex',
      {
        query,
        caseSensitive: options?.caseSensitive ?? false,
        maxResults: options?.maxResults ?? 1000,
        timestamp: Date.now(),
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.error || 'Search failed');
    }

    return response.data.data || [];
  }

  /**
   * Search vault for direct text match
   */
  async directSearch(
    query: string,
    options?: SearchOptions
  ): Promise<SearchResult[]> {
    const response = await this.client.post<ApiResponse<SearchResult[]>>(
      '/api/search/direct',
      {
        query,
        caseSensitive: options?.caseSensitive ?? false,
        maxResults: options?.maxResults ?? 1000,
        timestamp: Date.now(),
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.error || 'Search failed');
    }

    return response.data.data || [];
  }

  /**
   * Encrypt text
   */
  async encrypt(text: string, password?: string): Promise<string> {
    const response = await this.client.post<ApiResponse<EncryptResponse>>(
      '/api/encrypt',
      {
        text,
        password,
        timestamp: Date.now(),
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.error || 'Encryption failed');
    }

    return response.data.data?.ciphertext || '';
  }

  /**
   * Decrypt ciphertext
   */
  async decrypt(ciphertext: string, password: string): Promise<string> {
    const response = await this.client.post<ApiResponse<DecryptResponse>>(
      '/api/decrypt',
      {
        ciphertext,
        password,
        timestamp: Date.now(),
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.error || 'Decryption failed');
    }

    return response.data.data?.plaintext || '';
  }

  /**
   * Health check
   */
  async health(): Promise<{ status: string; version: string; uptime: number }> {
    const response = await this.client.get<
      ApiResponse<{ status: string; version: string; uptime: number }>
    >('/api/health');

    if (!response.data.success) {
      throw new Error(response.data.error || 'Health check failed');
    }

    return (
      response.data.data || { status: 'unknown', version: 'unknown', uptime: 0 }
    );
  }
}
