// src/api/types.ts

/* ──────────── API Configuration ──────────── */
export interface ApiSettings {
  enabled: boolean;
  port: number;
  apiKey: string; // Hashed API key stored in settings
  tlsCertPath: string;
  tlsKeyPath: string;
  allowedOrigins: string[];
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  logRequests: boolean;
}

export const DEFAULT_API_SETTINGS: ApiSettings = {
  enabled: false,
  port: 27750,
  apiKey: '',
  tlsCertPath: '',
  tlsKeyPath: '',
  allowedOrigins: ['https://localhost'],
  rateLimit: {
    windowMs: 60000, // 1 minute
    maxRequests: 100
  },
  logRequests: true
};

/* ──────────── API Key Management ──────────── */
export interface KeyInfo {
  id: string;
  name: string;
  keyHash: string;
  createdAt: number;
  lastUsed?: number;
  usageCount: number;
  enabled: boolean;
}

/* ──────────── Request/Response Types ──────────── */
export interface ApiRequest {
  timestamp: number;
}

export interface SearchRequest extends ApiRequest {
  query: string;
  type: 'regex' | 'direct';
  caseSensitive?: boolean;
  maxResults?: number;
}

export interface EncryptRequest extends ApiRequest {
  text: string;
  password?: string;
}

export interface DecryptRequest extends ApiRequest {
  ciphertext: string;
  password: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface SearchResult {
  file: string;
  line: number;
  col: number;
  text: string;
  context?: string; // Optional line context
}

export interface EncryptResponse {
  ciphertext: string;
  algorithm: string;
}

export interface DecryptResponse {
  plaintext: string;
}

/* ──────────── API Errors ──────────── */
export enum ApiErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_REQUEST = 'INVALID_REQUEST',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SERVER_ERROR = 'SERVER_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  ENCRYPTION_FAILED = 'ENCRYPTION_FAILED',
  DECRYPTION_FAILED = 'DECRYPTION_FAILED',
  INVALID_REGEX = 'INVALID_REGEX'
}

export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/* ──────────── Request Logging ──────────── */
export interface RequestLog {
  id: string;
  timestamp: number;
  method: string;
  path: string;
  keyId: string;
  statusCode: number;
  duration: number;
  error?: string;
}
