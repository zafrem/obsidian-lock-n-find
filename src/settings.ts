import {
    App,
    PluginSettingTab,
    Setting,
    Notice,
  } from "obsidian";
  import type PiiLockPlugin from "../main";
  
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
  };

  /* ──────────────── Default Patterns Utilities ──────────────── */
  export interface CountryPattern {
    displayName: string; // Human readable name like "United States"
    name: string;        // Regex pattern for person names
    address: string;     // Regex pattern for addresses/IDs
    phone: string;       // Regex pattern for phone numbers
  }

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

    // Country display name mapping
    const countryDisplayNames: Record<string, string> = {
      'US': 'United States',
      'Korea': 'South Korea',
      'Japan': 'Japan',
      'Taiwan': 'Taiwan',
      'India': 'India',
      'None': 'No Default Pattern'
    };

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

  export function getPatternsFromSelectedCountries(selectedCountries: string[], defaultPatterns: Record<string, CountryPattern>): string[] {
    const patterns: string[] = [];
    
    for (const country of selectedCountries) {
      const countryPattern = defaultPatterns[country];
      if (countryPattern) {
        // Add name patterns
        if (countryPattern.name) {
          const namePatterns = countryPattern.name.split('|').filter(p => p.trim());
          patterns.push(...namePatterns);
        }
        // Add address patterns
        if (countryPattern.address) {
          const addressPatterns = countryPattern.address.split('|').filter(p => p.trim());
          patterns.push(...addressPatterns);
        }
        // Add phone patterns
        if (countryPattern.phone) {
          const phonePatterns = countryPattern.phone.split('|').filter(p => p.trim());
          patterns.push(...phonePatterns);
        }
      }
    }
    
    return patterns;
  }

  export function syncPatternMetadata(plugin: PiiLockPlugin, defaultPatterns: Record<string, CountryPattern>) {
    // Initialize metadata if it doesn't exist
    if (!plugin.settings.patternMetadata) {
      plugin.settings.patternMetadata = [];
    }

    const newMetadata: PatternWithMetadata[] = [];
    let userPatternCount = 1;

    // Process each pattern in the patterns array
    for (const pattern of plugin.settings.patterns) {
      let found = false;
      
      // Check if it's from a selected country
      for (const country of plugin.settings.selectedCountries) {
        const countryPattern = defaultPatterns[country];
        if (countryPattern) {
          // Check name patterns
          if (countryPattern.name) {
            const namePatterns = countryPattern.name.split('|').filter(p => p.trim());
            if (namePatterns.includes(pattern)) {
              const patternIndex = namePatterns.indexOf(pattern) + 1;
              newMetadata.push({
                pattern,
                source: country,
                displayName: `${country} Name ${patternIndex}`
              });
              found = true;
              break;
            }
          }
          // Check address patterns
          if (!found && countryPattern.address) {
            const addressPatterns = countryPattern.address.split('|').filter(p => p.trim());
            if (addressPatterns.includes(pattern)) {
              const patternIndex = addressPatterns.indexOf(pattern) + 1;
              newMetadata.push({
                pattern,
                source: country,
                displayName: `${country} Address ${patternIndex}`
              });
              found = true;
              break;
            }
          }
          // Check phone patterns
          if (!found && countryPattern.phone) {
            const phonePatterns = countryPattern.phone.split('|').filter(p => p.trim());
            if (phonePatterns.includes(pattern)) {
              const patternIndex = phonePatterns.indexOf(pattern) + 1;
              newMetadata.push({
                pattern,
                source: country,
                displayName: `${country} Phone ${patternIndex}`
              });
              found = true;
              break;
            }
          }
        }
      }
      
      // If not from a country, it's a user pattern
      if (!found) {
        newMetadata.push({
          pattern,
          source: "user",
          displayName: `User Pattern ${userPatternCount}`
        });
        userPatternCount++;
      }
    }

    plugin.settings.patternMetadata = newMetadata;
  }

  export async function updatePatternInINI(plugin: PiiLockPlugin, oldPattern: string, newPattern: string, source: string, defaultPatterns: Record<string, CountryPattern>) {
    if (source !== 'user') {
      // This is a country pattern, update the INI file
      const countryPattern = defaultPatterns[source];
      if (countryPattern) {
        let updated = false;
        
        // Check if it's a name pattern
        if (countryPattern.name) {
          const namePatterns = countryPattern.name.split('|').filter(p => p.trim());
          const nameIndex = namePatterns.indexOf(oldPattern);
          if (nameIndex !== -1) {
            namePatterns[nameIndex] = newPattern;
            countryPattern.name = namePatterns.join('|');
            updated = true;
          }
        }
        
        // Check if it's an address pattern
        if (!updated && countryPattern.address) {
          const addressPatterns = countryPattern.address.split('|').filter(p => p.trim());
          const addressIndex = addressPatterns.indexOf(oldPattern);
          if (addressIndex !== -1) {
            addressPatterns[addressIndex] = newPattern;
            countryPattern.address = addressPatterns.join('|');
            updated = true;
          }
        }
        
        // Check if it's a phone pattern
        if (!updated && countryPattern.phone) {
          const phonePatterns = countryPattern.phone.split('|').filter(p => p.trim());
          const phoneIndex = phonePatterns.indexOf(oldPattern);
          if (phoneIndex !== -1) {
            phonePatterns[phoneIndex] = newPattern;
            countryPattern.phone = phonePatterns.join('|');
            updated = true;
          }
        }
        
        if (updated) {
          // Save back to INI file
          const serialized = serializeDefaultPatterns(defaultPatterns);
          await saveDefaultPatternsToFile(plugin, serialized);
        }
      }
    }
  }
  
  /* ──────────────── Setting Tab ──────────────── */
  export class PiiSettingTab extends PluginSettingTab {
    plugin: PiiLockPlugin;
  
    constructor(app: App, plugin: PiiLockPlugin) {
      super(app, plugin);
      this.plugin = plugin;
    }
  
    private async handlePasswordChange(): Promise<void> {
    const { PwModal } = await import("../ui/LnFSidebarView");
    const modal = new PwModal(this.app, "Set Encryption Password", true);
    const password = await modal.wait();
    
    if (password) {
      // Simple hash for storage (in a real implementation, use proper key derivation)
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      this.plugin.settings.storedPassword = hashHex;
      await this.plugin.saveSettings();
      new Notice("Password saved successfully");
    }
  }

  display(): void {
      const { containerEl } = this;
      containerEl.empty();
      
      this.renderContent();
  }

  private async renderContent(): Promise<void> {
      const { containerEl } = this;
      containerEl.addClass('pii-settings-container');

      // Create collapsible Manage Patterns section
      const patternsHeader = containerEl.createEl("details");
      patternsHeader.createEl("summary", { text: "Manage Patterns", cls: "pii-collapsible-header" });
      const patternsContainer = patternsHeader.createDiv("pii-patterns-container");

      // Load default patterns
      const defaultPatternsContent = await loadDefaultPatternsFromFile(this.plugin);
      const defaultPatterns = parseDefaultPatterns(defaultPatternsContent);
      
      // Initialize patternMetadata if it doesn't exist (for backward compatibility)
      if (!this.plugin.settings.patternMetadata) {
        this.plugin.settings.patternMetadata = [];
        // Migrate existing patterns to metadata format
        let userPatternCount = 1;
        for (const pattern of this.plugin.settings.patterns) {
          this.plugin.settings.patternMetadata.push({
            pattern,
            source: "user",
            displayName: `User Pattern ${userPatternCount}`
          });
          userPatternCount++;
        }
        await this.plugin.saveSettings();
      }
  
      // Pattern List UI with enhanced naming
      this.plugin.settings.patternMetadata.forEach((patternMeta, idx) => {
        const s = new Setting(patternsContainer)
          .setName(patternMeta.displayName)
          .addText((t) =>
            t
              .setPlaceholder("\\d{6}-...")
              .setValue(patternMeta.pattern)
              .onChange(async (v) => {
                const oldPattern = patternMeta.pattern;
                
                // Update the pattern in both arrays
                this.plugin.settings.patterns[idx] = v;
                this.plugin.settings.patternMetadata[idx].pattern = v;
                
                // If this is a country pattern, update the INI file
                await updatePatternInINI(this.plugin, oldPattern, v, patternMeta.source, defaultPatterns);
                
                await this.plugin.saveSettings();
              })
          )
          .addExtraButton((btn) =>
            btn
              .setIcon("trash")
              .setTooltip("remove")
              .onClick(async () => {
                this.plugin.settings.patterns.splice(idx, 1);
                this.plugin.settings.patternMetadata.splice(idx, 1);
                
                // If removing a country pattern, also remove from selected countries
                if (patternMeta.source !== 'user') {
                  const remainingCountryPatterns = this.plugin.settings.patternMetadata.filter(p => p.source === patternMeta.source);
                  if (remainingCountryPatterns.length === 0) {
                    this.plugin.settings.selectedCountries = this.plugin.settings.selectedCountries.filter(c => c !== patternMeta.source);
                  }
                }
                
                await this.plugin.saveSettings();
                this.display();
              })
          );
        // Disable the remove button if there's only one pattern left
        if (this.plugin.settings.patterns.length === 1) {
          const button = s.controlEl.querySelector('button');
          if (button) button.disabled = true;
        }
      });
  
      // + Button
      new Setting(patternsContainer).addButton((btn) =>
        btn
          .setButtonText("+")
          .setTooltip("Add pattern")
          .setCta()
          .onClick(async () => {
            // Count existing user patterns to get the next number
            const userPatternCount = this.plugin.settings.patternMetadata.filter(p => p.source === 'user').length + 1;
            
            this.plugin.settings.patterns.push("");
            this.plugin.settings.patternMetadata.push({
              pattern: "",
              source: "user",
              displayName: `User Pattern ${userPatternCount}`
            });
            await this.plugin.saveSettings();
            this.display();
          })
      );

      containerEl.createEl("hr");
      
      // Use the already loaded default patterns
      const availableCountries = Object.keys(defaultPatterns).filter(c => c !== 'None');

      // Show currently selected countries
      const selectedCountries = this.plugin.settings.selectedCountries;
      const selectedCountryNames = selectedCountries.map(c => defaultPatterns[c]?.displayName || c).join(', ');
      
      containerEl.createEl("h3", { text: "Add Country Patterns" });
      
      new Setting(containerEl)
        .setName("Selected Countries")
        .setDesc(selectedCountries.length > 0 ? selectedCountryNames : "No countries selected")
        .addButton((btn) =>
          btn
            .setButtonText("Clear All")
            .onClick(async () => {
              this.plugin.settings.selectedCountries = [];
              // Keep only user patterns
              const userPatterns = this.plugin.settings.patternMetadata.filter(p => p.source === 'user');
              this.plugin.settings.patterns = userPatterns.map(p => p.pattern);
              this.plugin.settings.patternMetadata = userPatterns;
              await this.plugin.saveSettings();
              new Notice("Cleared all selected countries");
              this.display();
            })
        );

      // Country selection buttons
      const countryButtonsContainer = containerEl.createDiv("pii-country-buttons");
      
      availableCountries.forEach(country => {
        const pattern = defaultPatterns[country];
        const isSelected = this.plugin.settings.selectedCountries.includes(country);
        
        new Setting(countryButtonsContainer)
          .setName(pattern.displayName)
          .setDesc(`Add patterns for ${pattern.displayName}`)
          .addButton((btn) =>
            btn
              .setButtonText(isSelected ? "Remove" : "Add")
              .setClass(isSelected ? "mod-warning" : "mod-cta")
              .onClick(async () => {
                // Check current state instead of using stale isSelected
                const currentlySelected = this.plugin.settings.selectedCountries.includes(country);
                if (currentlySelected) {
                  // Remove country and its patterns
                  this.plugin.settings.selectedCountries = this.plugin.settings.selectedCountries.filter(c => c !== country);
                  // Remove the country's patterns from both arrays
                  const allCountryPatterns: string[] = [];
                  if (pattern.name) {
                    const namePatterns = pattern.name.split('|').filter(p => p.trim());
                    allCountryPatterns.push(...namePatterns);
                  }
                  if (pattern.address) {
                    const addressPatterns = pattern.address.split('|').filter(p => p.trim());
                    allCountryPatterns.push(...addressPatterns);
                  }
                  if (pattern.phone) {
                    const phonePatterns = pattern.phone.split('|').filter(p => p.trim());
                    allCountryPatterns.push(...phonePatterns);
                  }
                  this.plugin.settings.patterns = this.plugin.settings.patterns.filter(p => !allCountryPatterns.includes(p));
                  this.plugin.settings.patternMetadata = this.plugin.settings.patternMetadata.filter(p => p.source !== country);
                  new Notice(`Removed ${pattern.displayName} patterns`);
                } else {
                  // Add country and its patterns (check if not already selected)
                  if (!this.plugin.settings.selectedCountries.includes(country)) {
                    this.plugin.settings.selectedCountries.push(country);
                  } else {
                    new Notice(`${pattern.displayName} is already selected`);
                    return;
                  }
                  // Add the country's patterns to both arrays
                  
                  // Add name patterns first
                  if (pattern.name) {
                    const namePatterns = pattern.name.split('|').filter(p => p.trim());
                    this.plugin.settings.patterns = [...this.plugin.settings.patterns, ...namePatterns];
                    namePatterns.forEach((namePattern, index) => {
                      this.plugin.settings.patternMetadata.push({
                        pattern: namePattern,
                        source: country,
                        displayName: `${country} Name ${index + 1}`
                      });
                    });
                  }
                  
                  // Add address patterns
                  if (pattern.address) {
                    const addressPatterns = pattern.address.split('|').filter(p => p.trim());
                    this.plugin.settings.patterns = [...this.plugin.settings.patterns, ...addressPatterns];
                    addressPatterns.forEach((addressPattern, index) => {
                      this.plugin.settings.patternMetadata.push({
                        pattern: addressPattern,
                        source: country,
                        displayName: `${country} Address ${index + 1}`
                      });
                    });
                  }
                  
                  // Add phone patterns
                  if (pattern.phone) {
                    const phonePatterns = pattern.phone.split('|').filter(p => p.trim());
                    this.plugin.settings.patterns = [...this.plugin.settings.patterns, ...phonePatterns];
                    phonePatterns.forEach((phonePattern, index) => {
                      this.plugin.settings.patternMetadata.push({
                        pattern: phonePattern,
                        source: country,
                        displayName: `${country} Phone ${index + 1}`
                      });
                    });
                  }
                  new Notice(`Added ${pattern.displayName} patterns`);
                }
                await this.plugin.saveSettings();
                this.display();
              })
          );
      });

      containerEl.createEl("hr");
      containerEl.createEl("h3", { text: "Default Patterns" });

      // Create Default Patterns File button
      new Setting(containerEl)
        .setName("Create Default Patterns File")
        .setDesc("Create the default-patterns.ini file with standard country patterns")
        .addButton((btn) =>
          btn
            .setButtonText("Create File")
            .setCta()
            .onClick(async () => {
              const defaultContent = `[US]
name=[A-Z][a-z]+\\s[A-Z][a-z]+|[A-Z][a-z]+\\s[A-Z]\\.\\s[A-Z][a-z]+
address=\\d{3}-\\d{2}-\\d{4}
phone=\\d{3}-\\d{3}-\\d{4}|\\(\\d{3}\\)\\s\\d{3}-\\d{4}|\\+1\\s\\d{3}\\s\\d{3}\\s\\d{4}

[Korea]
name=[가-힣]{2,4}|[A-Z][a-z]+\\s[A-Z][a-z]+
address=\\d{6}-\\d{7}
phone=010[- ]?\\d{4}[- ]?\\d{4}|\\+82\\s\\d{2}\\s\\d{4}\\s\\d{4}

[Japan]
name=[ひらがな-カタカナ一-龯]{2,6}|[A-Z][a-z]+\\s[A-Z][a-z]+
address=\\d{3}-\\d{4}|\\d{7}
phone=\\d{3}-\\d{4}-\\d{4}|\\d{4}-\\d{2}-\\d{4}|\\+81\\s\\d{3}\\s\\d{4}\\s\\d{4}

[Taiwan]
name=[一-龯]{2,4}|[A-Z][a-z]+\\s[A-Z][a-z]+
address=\\d{8}|\\d{10}
phone=\\d{4}-\\d{3}-\\d{3}|\\d{2}-\\d{8}|\\+886\\s\\d{3}\\s\\d{3}\\s\\d{3}

[India]
name=[A-Z][a-z]+\\s[A-Z][a-z]+|[अ-ह]{2,6}
address=\\d{4}\\s\\d{4}\\s\\d{4}
phone=\\d{3}-\\d{3}-\\d{4}|\\+91\\s\\d{5}\\s\\d{5}|\\d{10}

[None]
name=
address=
phone=
`;
              
              try {
                await saveDefaultPatternsToFile(this.plugin, defaultContent);
                new Notice("Default patterns file created successfully!");
                this.display(); // Refresh to load the new patterns
              } catch (error) {
                console.error("Failed to create default patterns file:", error);
                new Notice("Failed to create default patterns file");
              }
            })
        );

      containerEl.createEl("hr");
      containerEl.createEl("h3", { text: "Password Management" });

      // Password status
      const hasStoredPassword = !!this.plugin.settings.storedPassword;
      const statusText = hasStoredPassword ? "Password is currently stored" : "No password stored";
      const statusEl = containerEl.createEl("p", { 
        text: statusText,
        cls: hasStoredPassword ? "pii-password-status-active" : "pii-password-status-inactive"
      });

      // Change password button
      new Setting(containerEl)
        .setName(hasStoredPassword ? "Change Password" : "Set Password")
        .setDesc(hasStoredPassword ? "Update your encryption password" : "Set a password for encryption operations")
        .addButton((btn) =>
          btn
            .setButtonText(hasStoredPassword ? "Change" : "Set")
            .setCta()
            .onClick(async () => {
              await this.handlePasswordChange();
              this.display(); // Refresh the display
            })
        );

      // Clear password button (only show if password is stored)
      if (hasStoredPassword) {
        new Setting(containerEl)
          .setName("Clear Stored Password")
          .setDesc("Remove the stored password. You will be prompted for password on each operation.")
          .addButton((btn) =>
            btn
              .setButtonText("Clear")
              .setWarning()
              .onClick(async () => {
                this.plugin.settings.storedPassword = undefined;
                await this.plugin.saveSettings();
                new Notice("Password cleared successfully");
                this.display(); // Refresh the display
              })
          );
      }
    }
  }
  