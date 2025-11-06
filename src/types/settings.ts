import type { ApiSettings, KeyInfo } from "../api/types";
import { DEFAULT_API_SETTINGS } from "../api/types";

/* ──────────────── Type and Default Value ──────────────── */
export interface PatternWithMetadata {
  pattern: string;
  source: string; // 'user' or country code like 'US', 'Korea'
  displayName: string; // 'User Pattern 1' or 'United States - SSN'
}

export interface PiiSettings {
  patterns: string[];          // Regex lists (for backward compatibility)
  patternMetadata: PatternWithMetadata[]; // Enhanced pattern tracking
  encryptAlgo: "AES-GCM";      // Prepare for future expansion of options
  storedPassword?: string;     // Temporarily stored password (hashed)
  defaultPatterns: string;     // INI format string with country-specific patterns
  selectedCountries: string[]; // List of selected countries
  api: ApiSettings;            // API configuration
  apiKeys: KeyInfo[];          // API keys storage
}

export const DEFAULT_SETTINGS: PiiSettings = {
  patterns: ["\\d{6}-\\d{7}", "\\d{3}-\\d{4}-\\d{4}"], // Social Security Number-Phone Number Example
  patternMetadata: [
    { pattern: "\\d{6}-\\d{7}", source: "user", displayName: "User Pattern 1" },
    { pattern: "\\d{3}-\\d{4}-\\d{4}", source: "user", displayName: "User Pattern 2" }
  ],
  encryptAlgo: "AES-GCM",
  storedPassword: undefined,
  defaultPatterns: "", // Will be loaded from external file
  selectedCountries: [], // No countries selected by default
  api: DEFAULT_API_SETTINGS,
  apiKeys: [],
};
