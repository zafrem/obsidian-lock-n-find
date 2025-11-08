// api-tests/src/client.ts
 
import { requestUrl, RequestUrlParam, RequestUrlResponse } from 'obsidian';

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
  constructor(private options: ClientOptions) {}

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: unknown
  ): Promise<ApiResponse<T>> {
    const url = `${this.options.baseUrl}${path}`;
    
    const requestParams: RequestUrlParam = {
      url,
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.options.apiKey,
      },
      body: body ? JSON.stringify(body) : undefined,
      throw: false,
    };

    try {
      const response: RequestUrlResponse = await requestUrl(requestParams);
      
      if (response.status >= 400) {
        const data = response.json as ApiResponse<T>;
        throw new Error(data.error || `API Error: ${response.status}`);
      }

      return response.json as ApiResponse<T>;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('No response from API server. Is it running?');
    }
  }

  /**
   * Search vault using regular expression
   */
  async regexSearch(
    query: string,
    options?: SearchOptions
  ): Promise<SearchResult[]> {
    const response = await this.request<SearchResult[]>(
      'POST',
      '/api/search/regex',
      {
        query,
        caseSensitive: options?.caseSensitive ?? false,
        maxResults: options?.maxResults ?? 1000,
        timestamp: Date.now(),
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Search failed');
    }

    return response.data || [];
  }

  /**
   * Search vault for direct text match
   */
  async directSearch(
    query: string,
    options?: SearchOptions
  ): Promise<SearchResult[]> {
    const response = await this.request<SearchResult[]>(
      'POST',
      '/api/search/direct',
      {
        query,
        caseSensitive: options?.caseSensitive ?? false,
        maxResults: options?.maxResults ?? 1000,
        timestamp: Date.now(),
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Search failed');
    }

    return response.data || [];
  }

  /**
   * Encrypt text
   */
  async encrypt(text: string, password?: string): Promise<string> {
    const response = await this.request<EncryptResponse>(
      'POST',
      '/api/encrypt',
      {
        text,
        password,
        timestamp: Date.now(),
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Encryption failed');
    }

    return response.data?.ciphertext || '';
  }

  /**
   * Decrypt ciphertext
   */
  async decrypt(ciphertext: string, password: string): Promise<string> {
    const response = await this.request<DecryptResponse>(
      'POST',
      '/api/decrypt',
      {
        ciphertext,
        password,
        timestamp: Date.now(),
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Decryption failed');
    }

    return response.data?.plaintext || '';
  }

  /**
   * Health check
   */
  async health(): Promise<{ status: string; version: string; uptime: number }> {
    const response = await this.request<{
      status: string;
      version: string;
      uptime: number;
    }>('GET', '/api/health');

    if (!response.success) {
      throw new Error(response.error || 'Health check failed');
    }

    return response.data || { status: 'unknown', version: 'unknown', uptime: 0 };
  }
}
