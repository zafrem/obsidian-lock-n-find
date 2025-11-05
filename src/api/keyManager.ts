// src/api/keyManager.ts
import { KeyInfo } from "./types";

/**
 * Manages API key generation, validation, and storage
 */
export class ApiKeyManager {
  private keys: Map<string, KeyInfo> = new Map();

  constructor(private saveCallback: () => Promise<void>) {}

  /**
   * Generate a cryptographically secure API key
   * Format: lnf_<32 random hex chars>
   */
  async generateKey(name: string): Promise<string> {
    // Generate random bytes for the key
    const keyBytes = new Uint8Array(32);
    crypto.getRandomValues(keyBytes);
    const rawKey = `lnf_${Array.from(keyBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")}`;

    // Hash the key for storage
    const keyHash = await this.hashKey(rawKey);

    const keyInfo: KeyInfo = {
      id: this.generateId(),
      name,
      keyHash,
      createdAt: Date.now(),
      usageCount: 0,
      enabled: true,
    };

    this.keys.set(keyInfo.id, keyInfo);
    await this.saveCallback();

    // Return the raw key (only time it's visible)
    return rawKey;
  }

  /**
   * Validate an API key using constant-time comparison
   */
  async validateKey(rawKey: string): Promise<KeyInfo | null> {
    if (!rawKey || !rawKey.startsWith("lnf_")) {
      return null;
    }

    const targetHash = await this.hashKey(rawKey);

    // Find matching key using constant-time comparison
    for (const keyInfo of this.keys.values()) {
      if (!keyInfo.enabled) continue;

      if (this.constantTimeCompare(targetHash, keyInfo.keyHash)) {
        // Update usage stats
        keyInfo.lastUsed = Date.now();
        keyInfo.usageCount++;
        await this.saveCallback();
        return keyInfo;
      }
    }

    return null;
  }

  /**
   * Revoke an API key by ID
   */
  async revokeKey(keyId: string): Promise<boolean> {
    const keyInfo = this.keys.get(keyId);
    if (!keyInfo) return false;

    keyInfo.enabled = false;
    await this.saveCallback();
    return true;
  }

  /**
   * Delete an API key permanently
   */
  async deleteKey(keyId: string): Promise<boolean> {
    const deleted = this.keys.delete(keyId);
    if (deleted) {
      await this.saveCallback();
    }
    return deleted;
  }

  /**
   * List all API keys (without sensitive data)
   */
  listKeys(): KeyInfo[] {
    return Array.from(this.keys.values()).map((key) => ({
      ...key,
      keyHash: "[REDACTED]",
    }));
  }

  /**
   * Get key by ID
   */
  getKey(keyId: string): KeyInfo | undefined {
    return this.keys.get(keyId);
  }

  /**
   * Load keys from serialized data
   */
  loadKeys(keysData: KeyInfo[]): void {
    this.keys.clear();
    keysData.forEach((key) => {
      this.keys.set(key.id, key);
    });
  }

  /**
   * Serialize keys for storage
   */
  serializeKeys(): KeyInfo[] {
    return Array.from(this.keys.values());
  }

  /**
   * Hash an API key using SHA-256 with multiple rounds
   */
  private async hashKey(key: string): Promise<string> {
    const encoder = new TextEncoder();
    let hash = await crypto.subtle.digest("SHA-256", encoder.encode(key));

    // Additional rounds for key stretching
    for (let i = 0; i < 10000; i++) {
      hash = await crypto.subtle.digest("SHA-256", hash);
    }

    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      // To maintain constant time, still do a comparison (result intentionally unused)
      let result = 0;
      for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i % b.length);
      }
      void result; // Explicitly mark as intentionally unused for timing attack prevention
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }

  /**
   * Generate a unique ID for a key
   */
  private generateId(): string {
    return `key_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
}
