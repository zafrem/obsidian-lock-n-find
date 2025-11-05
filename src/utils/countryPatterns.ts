import { Notice } from "obsidian";
import type PiiLockPlugin from "../../main";

/* ──────────────── Default Patterns Utilities ──────────────── */
export interface CountryPattern {
  displayName: string; // Human readable name like "United States"
  name: string;        // Regex pattern for person names
  address: string;     // Regex pattern for addresses/IDs
  phone: string;       // Regex pattern for phone numbers
}

// Country display name mapping
export const countryDisplayNames: Record<string, string> = {
  'US': 'United States',
  'Korea': 'South Korea',
  'Japan': 'Japan',
  'Taiwan': 'Taiwan',
  'India': 'India',
  'None': 'No Default Pattern'
};

export async function loadDefaultPatternsFromFile(plugin: PiiLockPlugin): Promise<string> {
  try {
    const adapter = plugin.app.vault.adapter;
    const pluginDir = plugin.manifest.dir || '';
    const filePath = `${pluginDir}/default-patterns.ini`;
    
    const content = await adapter.read(filePath);
    return content;
  } catch (error) {
    console.warn('Could not load default-patterns.ini, using empty patterns:', error);
    return '';
  }
}

export function parseDefaultPatterns(iniString: string): Record<string, CountryPattern> {
  const result: Record<string, CountryPattern> = {};
  const lines = iniString.split('\n');
  let currentSection = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      currentSection = trimmed.slice(1, -1);
      result[currentSection] = { 
        displayName: countryDisplayNames[currentSection] || currentSection,
        name: '', 
        address: '',
        phone: ''
      };
    } else if (currentSection && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=');
      if (key === 'name') {
        result[currentSection].name = value;
      } else if (key === 'address') {
        result[currentSection].address = value;
      } else if (key === 'phone') {
        result[currentSection].phone = value;
      }
    }
  }

  return result;
}

export function serializeDefaultPatterns(patterns: Record<string, CountryPattern>): string {
  let result = '';
  for (const [country, pattern] of Object.entries(patterns)) {
    result += `[${country}]\n`;
    result += `name=${pattern.name}\n`;
    result += `address=${pattern.address}\n`;
    result += `phone=${pattern.phone}\n`;
    if (Object.keys(patterns).indexOf(country) < Object.keys(patterns).length - 1) {
      result += '\n';
    }
  }
  return result;
}

export async function saveDefaultPatternsToFile(plugin: PiiLockPlugin, content: string): Promise<void> {
  try {
    const adapter = plugin.app.vault.adapter;
    const pluginDir = plugin.manifest.dir || '';
    const filePath = `${pluginDir}/default-patterns.ini`;
    
    await adapter.write(filePath, content);
  } catch (error) {
    console.error('Could not save default-patterns.ini:', error);
    new Notice('Failed to save default patterns file');
  }
}
