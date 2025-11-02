// src/externalPatterns.ts
// Simple ways to import/update patterns from external sources

import { Notice } from "obsidian";
import type { App } from "obsidian";

export interface ExternalPattern {
  name: string;
  regex: string;
  description?: string;
  enabled?: boolean;
  category?: string;
}

export interface PatternSource {
  name: string;
  url?: string;
  file?: string;
  lastUpdate?: number;
}

/**
 * Method 1: Import from JSON file
 * Just drop a patterns.json file in your vault
 */
export async function importFromJSON(app: App, filePath: string): Promise<ExternalPattern[]> {
  try {
    const file = app.vault.getAbstractFileByPath(filePath);
    if (!file) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = await app.vault.read(file as any);
    const patterns = JSON.parse(content);

    new Notice(`Imported ${patterns.length} patterns from ${filePath}`);
    return patterns;
  } catch (error) {
    new Notice(`Failed to import patterns: ${error.message}`);
    return [];
  }
}

/**
 * Method 2: Import from simple text file
 * Format: name | regex | description (one per line)
 * Example:
 * Email | [a-z@.]+ | Matches emails
 * Phone | \d{3}-\d{4} | Phone numbers
 */
export async function importFromTextFile(app: App, filePath: string): Promise<ExternalPattern[]> {
  try {
    const file = app.vault.getAbstractFileByPath(filePath);
    if (!file) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = await app.vault.read(file as any);
    const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));

    const patterns: ExternalPattern[] = lines.map(line => {
      const parts = line.split('|').map(p => p.trim());
      return {
        name: parts[0] || 'Unnamed',
        regex: parts[1] || '.*',
        description: parts[2],
        enabled: true
      };
    });

    new Notice(`Imported ${patterns.length} patterns from ${filePath}`);
    return patterns;
  } catch (error) {
    new Notice(`Failed to import patterns: ${error.message}`);
    return [];
  }
}

/**
 * Method 3: Import from URL (GitHub, etc.)
 * Fetch patterns from a remote JSON file
 */
export async function importFromURL(url: string): Promise<ExternalPattern[]> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const patterns = await response.json();
    new Notice(`Downloaded ${patterns.length} patterns from ${url}`);
    return patterns;
  } catch (error) {
    new Notice(`Failed to download patterns: ${error.message}`);
    return [];
  }
}

/**
 * Method 4: Import from CSV
 * Format: name,regex,description,enabled,category
 */
export async function importFromCSV(app: App, filePath: string): Promise<ExternalPattern[]> {
  try {
    const file = app.vault.getAbstractFileByPath(filePath);
    if (!file) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = await app.vault.read(file as any);
    const lines = content.split('\n').filter(line => line.trim());

    // Skip header if present
    const dataLines = lines[0].toLowerCase().includes('name') ? lines.slice(1) : lines;

    const patterns: ExternalPattern[] = dataLines.map(line => {
      const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
      return {
        name: parts[0] || 'Unnamed',
        regex: parts[1] || '.*',
        description: parts[2],
        enabled: parts[3]?.toLowerCase() !== 'false',
        category: parts[4]
      };
    });

    new Notice(`Imported ${patterns.length} patterns from ${filePath}`);
    return patterns;
  } catch (error) {
    new Notice(`Failed to import CSV: ${error.message}`);
    return [];
  }
}

/**
 * Method 5: Import from Markdown file
 * Format:
 * ## Category Name
 * - Pattern Name: `regex` - description
 */
export async function importFromMarkdown(app: App, filePath: string): Promise<ExternalPattern[]> {
  try {
    const file = app.vault.getAbstractFileByPath(filePath);
    if (!file) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = await app.vault.read(file as any);
    const lines = content.split('\n');

    const patterns: ExternalPattern[] = [];
    let currentCategory = 'imported';

    lines.forEach(line => {
      const trimmed = line.trim();

      // Category header
      if (trimmed.startsWith('##')) {
        currentCategory = trimmed.replace(/^#+\s*/, '').toLowerCase();
      }
      // Pattern line
      else if (trimmed.startsWith('-')) {
        const match = trimmed.match(/^-\s*(.+?):\s*`(.+?)`(?:\s*-\s*(.+))?/);
        if (match) {
          patterns.push({
            name: match[1].trim(),
            regex: match[2].trim(),
            description: match[3]?.trim(),
            category: currentCategory,
            enabled: true
          });
        }
      }
    });

    new Notice(`Imported ${patterns.length} patterns from ${filePath}`);
    return patterns;
  } catch (error) {
    new Notice(`Failed to import markdown: ${error.message}`);
    return [];
  }
}

/**
 * Method 6: Watch folder for pattern files
 * Auto-import any .patterns.json files in a specific folder
 */
export async function watchPatternFolder(app: App, folderPath: string): Promise<ExternalPattern[]> {
  try {
    const folder = app.vault.getAbstractFileByPath(folderPath);
    if (!folder) {
      throw new Error(`Folder not found: ${folderPath}`);
    }

    const files = app.vault.getFiles()
      .filter(f => f.path.startsWith(folderPath) && f.name.endsWith('.patterns.json'));

    const allPatterns: ExternalPattern[] = [];

    for (const file of files) {
      const content = await app.vault.read(file);
      const patterns = JSON.parse(content);
      allPatterns.push(...patterns);
    }

    new Notice(`Loaded ${allPatterns.length} patterns from ${files.length} files`);
    return allPatterns;
  } catch (error) {
    new Notice(`Failed to watch folder: ${error.message}`);
    return [];
  }
}

/**
 * Method 7: Export current patterns to file
 */
export async function exportToJSON(app: App, patterns: ExternalPattern[], filePath: string): Promise<void> {
  try {
    const json = JSON.stringify(patterns, null, 2);
    await app.vault.create(filePath, json);
    new Notice(`Exported ${patterns.length} patterns to ${filePath}`);
  } catch (error) {
    new Notice(`Failed to export: ${error.message}`);
  }
}

/**
 * Method 8: Sync with GitHub Gist
 */
export async function syncWithGist(gistId: string, token?: string): Promise<ExternalPattern[]> {
  try {
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json'
    };

    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    const response = await fetch(`https://api.github.com/gists/${gistId}`, { headers });
    const data = await response.json();

    // Assuming the gist has a file named 'patterns.json'
    const file = data.files['patterns.json'] || data.files[Object.keys(data.files)[0]];
    const patterns = JSON.parse(file.content);

    new Notice(`Synced ${patterns.length} patterns from GitHub Gist`);
    return patterns;
  } catch (error) {
    new Notice(`Failed to sync with Gist: ${error.message}`);
    return [];
  }
}

/**
 * Method 9: Command line import via file drop
 * User can drag-drop a file to import
 */
export function setupFileDrop(element: HTMLElement, onImport: (patterns: ExternalPattern[]) => void): void {
  element.addEventListener('dragover', (e) => {
    e.preventDefault();
    element.addClass('pii-drop-active');
  });

  element.addEventListener('dragleave', () => {
    element.removeClass('pii-drop-active');
  });

  element.addEventListener('drop', async (e) => {
    e.preventDefault();
    element.removeClass('pii-drop-active');

    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;

        // Auto-detect format
        let patterns: ExternalPattern[] = [];

        if (file.name.endsWith('.json')) {
          patterns = JSON.parse(content);
        } else if (file.name.endsWith('.csv')) {
          // Parse CSV
          const lines = content.split('\n').slice(1); // Skip header
          patterns = lines.map(line => {
            const [name, regex, description] = line.split(',');
            return { name, regex, description };
          });
        } else if (file.name.endsWith('.txt')) {
          // Parse text format
          const lines = content.split('\n').filter(l => l.trim());
          patterns = lines.map(line => {
            const [name, regex, description] = line.split('|').map(p => p.trim());
            return { name, regex, description };
          });
        }

        onImport(patterns);
        new Notice(`Imported ${patterns.length} patterns from ${file.name}`);
      } catch (error) {
        new Notice(`Failed to parse file: ${error.message}`);
      }
    };

    reader.readAsText(file);
  });
}

/**
 * Method 10: Auto-update from URL on schedule
 */
export class PatternAutoUpdater {
  private intervalId?: number;

  constructor(
    private url: string,
    private updateIntervalHours: number,
    private onUpdate: (patterns: ExternalPattern[]) => void
  ) {}

  start(): void {
    // Update immediately
    this.update();

    // Then update periodically
    this.intervalId = window.setInterval(
      () => this.update(),
      this.updateIntervalHours * 60 * 60 * 1000
    );
  }

  stop(): void {
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
    }
  }

  private async update(): Promise<void> {
    try {
      const patterns = await importFromURL(this.url);
      this.onUpdate(patterns);
    } catch (error) {
      console.error('Auto-update failed:', error);
    }
  }
}
