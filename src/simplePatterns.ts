// src/simplePatterns.ts
// Simple, flat pattern library - no complex metadata or dual arrays

export interface SimplePattern {
  id: string;
  name: string;
  regex: string;
  enabled: boolean;
  category: 'user' | 'common' | 'financial' | 'personal' | 'government';
  description?: string;
}

// Built-in pattern library
export const PATTERN_LIBRARY: SimplePattern[] = [
  // Common patterns
  {
    id: 'email',
    name: 'Email Address',
    regex: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
    enabled: true,
    category: 'common',
    description: 'Matches email addresses'
  },
  {
    id: 'phone-us',
    name: 'US Phone Number',
    regex: '\\d{3}[-.]?\\d{3}[-.]?\\d{4}',
    enabled: true,
    category: 'common',
    description: 'Matches US phone numbers in various formats'
  },
  {
    id: 'url',
    name: 'URL',
    regex: 'https?://[^\\s]+',
    enabled: false,
    category: 'common',
    description: 'Matches web URLs'
  },

  // Financial
  {
    id: 'credit-card',
    name: 'Credit Card',
    regex: '\\d{4}[-\\s]?\\d{4}[-\\s]?\\d{4}[-\\s]?\\d{4}',
    enabled: false,
    category: 'financial',
    description: 'Matches credit card numbers'
  },
  {
    id: 'ssn',
    name: 'US Social Security Number',
    regex: '\\d{3}-\\d{2}-\\d{4}',
    enabled: false,
    category: 'government',
    description: 'Matches US SSN format'
  },

  // International
  {
    id: 'korean-id',
    name: 'Korean ID Number',
    regex: '\\d{6}-\\d{7}',
    enabled: false,
    category: 'government',
    description: 'Matches Korean resident registration number'
  },
  {
    id: 'phone-kr',
    name: 'Korean Phone Number',
    regex: '010[-\\s]?\\d{4}[-\\s]?\\d{4}',
    enabled: false,
    category: 'common',
    description: 'Matches Korean mobile phone numbers'
  },

  // Personal
  {
    id: 'password-keyword',
    name: 'Password Text',
    regex: '(password|pwd|pass)\\s*[:=]\\s*\\S+',
    enabled: false,
    category: 'personal',
    description: 'Matches password-like patterns'
  },
  {
    id: 'api-key',
    name: 'API Key',
    regex: '[a-zA-Z0-9]{32,}',
    enabled: false,
    category: 'personal',
    description: 'Matches long alphanumeric strings (API keys)'
  }
];

// Simple management functions
export class PatternManager {
  private patterns: SimplePattern[] = [];

  constructor(savedPatterns?: SimplePattern[]) {
    // Start with library patterns
    this.patterns = [...PATTERN_LIBRARY];

    // Merge with saved patterns
    if (savedPatterns) {
      savedPatterns.forEach(saved => {
        const existing = this.patterns.find(p => p.id === saved.id);
        if (existing) {
          // Update existing pattern
          Object.assign(existing, saved);
        } else {
          // Add user pattern
          this.patterns.push(saved);
        }
      });
    }
  }

  // Get all patterns
  getAll(): SimplePattern[] {
    return [...this.patterns];
  }

  // Get only enabled patterns
  getEnabled(): SimplePattern[] {
    return this.patterns.filter(p => p.enabled);
  }

  // Get regex strings for scanning
  getRegexList(): string[] {
    return this.getEnabled().map(p => p.regex);
  }

  // Add custom pattern
  addCustom(name: string, regex: string, description?: string): SimplePattern {
    const pattern: SimplePattern = {
      id: `custom_${Date.now()}`,
      name,
      regex,
      enabled: true,
      category: 'user',
      description
    };

    this.patterns.push(pattern);
    return pattern;
  }

  // Toggle pattern
  toggle(id: string, enabled: boolean): void {
    const pattern = this.patterns.find(p => p.id === id);
    if (pattern) {
      pattern.enabled = enabled;
    }
  }

  // Update pattern
  update(id: string, updates: Partial<SimplePattern>): void {
    const pattern = this.patterns.find(p => p.id === id);
    if (pattern) {
      Object.assign(pattern, updates);
    }
  }

  // Delete pattern (only user patterns)
  delete(id: string): boolean {
    const index = this.patterns.findIndex(p => p.id === id);
    if (index >= 0 && this.patterns[index].category === 'user') {
      this.patterns.splice(index, 1);
      return true;
    }
    return false;
  }

  // Get by category
  getByCategory(category: string): SimplePattern[] {
    return this.patterns.filter(p => p.category === category);
  }

  // Search patterns
  search(query: string): SimplePattern[] {
    const lowerQuery = query.toLowerCase();
    return this.patterns.filter(p =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description?.toLowerCase().includes(lowerQuery)
    );
  }

  // Export for saving
  serialize(): SimplePattern[] {
    return this.patterns;
  }

  // Import patterns from JSON
  import(patterns: SimplePattern[]): void {
    patterns.forEach(p => {
      if (!this.patterns.find(existing => existing.id === p.id)) {
        this.patterns.push(p);
      }
    });
  }

  // Quick enable/disable all in category
  toggleCategory(category: string, enabled: boolean): void {
    this.patterns
      .filter(p => p.category === category)
      .forEach(p => p.enabled = enabled);
  }
}
