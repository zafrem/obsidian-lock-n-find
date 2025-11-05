// src/api/server.ts
import type { App } from "obsidian";
import type PiiLockPlugin from "../../main";
import { ApiKeyManager } from "./keyManager";
import {
  ApiSettings,
  ApiError,
  ApiErrorCode,
  ApiResponse,
  RequestLog,
} from "./types";

/**
 * Lightweight API server for Lock & Find
 * Note: This is a simplified implementation for Obsidian plugin context
 */
export class LnFApiServer {
  private keyManager: ApiKeyManager;
  private requestLogs: RequestLog[] = [];
  private rateLimitMap: Map<string, number[]> = new Map();
  private server: unknown = null;
  private isRunning = false;

  constructor(private app: App, private plugin: PiiLockPlugin) {
    this.keyManager = new ApiKeyManager(async () => {
      await this.plugin.saveSettings();
    });
  }

  /**
   * Start the API server
   */
  start(settings: ApiSettings): void {
    if (this.isRunning) {
      console.warn("API server already running");
      return;
    }

    // Load API keys from settings
    if (this.plugin.settings.apiKeys) {
      this.keyManager.loadKeys(this.plugin.settings.apiKeys);
    }

    // In Obsidian plugin context, we cannot create a real HTTP server
    // Instead, we'll use the Obsidian local REST API if available
    // For now, this is a placeholder for the actual implementation
    console.debug(`API server started on port ${settings.port}`);
    console.debug(`TLS enabled: ${!!settings.tlsCertPath}`);
    console.debug(`Rate limit: ${settings.rateLimit.maxRequests} requests per ${settings.rateLimit.windowMs}ms`);

    this.isRunning = true;
  }

  /**
   * Stop the API server
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    if (this.server) {
      // Close server if it exists
      this.server.close();
      this.server = null;
    }

    this.isRunning = false;
    console.debug("API server stopped");
  }

  /**
   * Handle incoming API request (called by Obsidian's request handler)
   */
  async handleRequest(
    method: string,
    path: string,
    headers: Record<string, string>,
    body: unknown
  ): Promise<ApiResponse> {
    const startTime = Date.now();
    let keyId = "unknown";

    try {
      // Extract API key from header
      const apiKey = headers["x-api-key"] || headers["X-API-Key"];
      if (!apiKey) {
        throw new ApiError(
          ApiErrorCode.UNAUTHORIZED,
          "Missing API key",
          401
        );
      }

      // Validate API key
      const keyInfo = await this.keyManager.validateKey(apiKey);
      if (!keyInfo) {
        throw new ApiError(
          ApiErrorCode.UNAUTHORIZED,
          "Invalid API key",
          401
        );
      }
      keyId = keyInfo.id;

      // Check rate limit
      if (!this.checkRateLimit(keyId)) {
        throw new ApiError(
          ApiErrorCode.RATE_LIMIT_EXCEEDED,
          "Rate limit exceeded",
          429
        );
      }

      // Route the request
      const result = await this.routeRequest(method, path, body);

      // Log successful request
      this.logRequest({
        id: this.generateLogId(),
        timestamp: Date.now(),
        method,
        path,
        keyId,
        statusCode: 200,
        duration: Date.now() - startTime,
      });

      return {
        success: true,
        data: result,
        timestamp: Date.now(),
      };
    } catch (error) {
      const statusCode = error instanceof ApiError ? error.statusCode : 500;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      // Log failed request
      this.logRequest({
        id: this.generateLogId(),
        timestamp: Date.now(),
        method,
        path,
        keyId,
        statusCode,
        duration: Date.now() - startTime,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Route request to appropriate handler
   */
  private async routeRequest(
    method: string,
    path: string,
    body: unknown
  ): Promise<unknown> {
    // Import route handlers dynamically
    const { handleSearchRequest } = await import("./routes/search");
    const { handleEncryptRequest } = await import("./routes/encrypt");

    if (method === "POST" && path === "/api/search/regex") {
      return await handleSearchRequest(this.app, body, "regex");
    }

    if (method === "POST" && path === "/api/search/direct") {
      return await handleSearchRequest(this.app, body, "direct");
    }

    if (method === "POST" && path === "/api/encrypt") {
      return await handleEncryptRequest(body, "encrypt");
    }

    if (method === "POST" && path === "/api/decrypt") {
      return await handleEncryptRequest(body, "decrypt");
    }

    if (method === "GET" && path === "/api/health") {
      return {
        status: "ok",
        version: this.plugin.manifest.version,
        uptime: Date.now(),
      };
    }

    throw new ApiError(
      ApiErrorCode.NOT_FOUND,
      `Route not found: ${method} ${path}`,
      404
    );
  }

  /**
   * Check rate limit for a key
   */
  private checkRateLimit(keyId: string): boolean {
    const settings = this.plugin.settings.api;
    const now = Date.now();
    const windowMs = settings.rateLimit.windowMs;
    const maxRequests = settings.rateLimit.maxRequests;

    // Get existing requests for this key
    let requests = this.rateLimitMap.get(keyId) || [];

    // Remove requests outside the time window
    requests = requests.filter((timestamp) => now - timestamp < windowMs);

    // Check if limit exceeded
    if (requests.length >= maxRequests) {
      return false;
    }

    // Add current request
    requests.push(now);
    this.rateLimitMap.set(keyId, requests);

    return true;
  }

  /**
   * Log API request
   */
  private logRequest(log: RequestLog): void {
    if (!this.plugin.settings.api.logRequests) {
      return;
    }

    this.requestLogs.push(log);

    // Keep only last 1000 logs
    if (this.requestLogs.length > 1000) {
      this.requestLogs = this.requestLogs.slice(-1000);
    }

    // Also log to console for debugging
    console.debug(
      `[API] ${log.method} ${log.path} - ${log.statusCode} (${log.duration}ms)${
        log.error ? ` - ${log.error}` : ""
      }`
    );
  }

  /**
   * Get request logs
   */
  getRequestLogs(limit = 100): RequestLog[] {
    return this.requestLogs.slice(-limit);
  }

  /**
   * Clear request logs
   */
  clearRequestLogs(): void {
    this.requestLogs = [];
  }

  /**
   * Get key manager for external access
   */
  getKeyManager(): ApiKeyManager {
    return this.keyManager;
  }

  /**
   * Generate unique log ID
   */
  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  /**
   * Check if server is running
   */
  isServerRunning(): boolean {
    return this.isRunning;
  }
}
