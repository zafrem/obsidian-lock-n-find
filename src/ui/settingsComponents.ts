import { Notice, Setting } from "obsidian";
import type PiiLockPlugin from "../../main";
import { CountryPattern } from "../utils/countryPatterns";
import { updatePatternInINI } from "../utils/patternManagement";

/**
 * Creates pattern list settings UI
 */
export function createPatternListUI(
  container: HTMLElement,
  plugin: PiiLockPlugin,
  defaultPatterns: Record<string, CountryPattern>
): void {
  // Pattern List UI with enhanced naming
  plugin.settings.patternMetadata.forEach((patternMeta, idx) => {
    const s = new Setting(container)
      .setName(patternMeta.displayName)
      .addText((t) =>
        t
          .setPlaceholder("\\d{6}-...")
          .setValue(patternMeta.pattern)
          .onChange(async (v) => {
            const oldPattern = patternMeta.pattern;
            
            // Update the pattern in both arrays
            plugin.settings.patterns[idx] = v;
            plugin.settings.patternMetadata[idx].pattern = v;
            
            // If this is a country pattern, update the INI file
            await updatePatternInINI(plugin, oldPattern, v, patternMeta.source, defaultPatterns);
            
            await plugin.saveSettings();
          })
      )
      .addExtraButton((btn) =>
        btn
          .setIcon("trash")
          .setTooltip("Remove")
          .onClick(async () => {
            plugin.settings.patterns.splice(idx, 1);
            plugin.settings.patternMetadata.splice(idx, 1);
            
            // If removing a country pattern, also remove from selected countries
            if (patternMeta.source !== 'user') {
              const remainingCountryPatterns = plugin.settings.patternMetadata.filter(p => p.source === patternMeta.source);
              if (remainingCountryPatterns.length === 0) {
                plugin.settings.selectedCountries = plugin.settings.selectedCountries.filter(c => c !== patternMeta.source);
              }
            }
            
            await plugin.saveSettings();
            // Refresh the display - this will be handled by the caller
          })
      );
    // Disable the remove button if there's only one pattern left
    if (plugin.settings.patterns.length === 1) {
      const button = s.controlEl.querySelector('button');
      if (button) button.disabled = true;
    }
  });
}

/**
 * Creates the add pattern button
 */
export function createAddPatternButton(
  container: HTMLElement,
  plugin: PiiLockPlugin,
  refreshDisplay: () => void
): void {
  new Setting(container).addButton((btn) =>
    btn
      .setButtonText("+")
      .setTooltip("Add pattern")
      .setCta()
      .onClick(async () => {
        // Count existing user patterns to get the next number
        const userPatternCount = plugin.settings.patternMetadata.filter(p => p.source === 'user').length + 1;
        
        plugin.settings.patterns.push("");
        plugin.settings.patternMetadata.push({
          pattern: "",
          source: "user",
          displayName: `User Pattern ${userPatternCount}`
        });
        await plugin.saveSettings();
        refreshDisplay();
      })
  );
}

/**
 * Creates country selection UI
 */
export function createCountrySelectionUI(
  container: HTMLElement,
  plugin: PiiLockPlugin,
  defaultPatterns: Record<string, CountryPattern>,
  refreshDisplay: () => void
): void {
  // Show currently selected countries
  const selectedCountries = plugin.settings.selectedCountries;
  const selectedCountryNames = selectedCountries.map(c => defaultPatterns[c]?.displayName || c).join(', ');
  
  new Setting(container)
    .setName("Selected countries")
    .setDesc(selectedCountries.length > 0 ? selectedCountryNames : "No countries selected")
    .addButton((btn) =>
      btn
        .setButtonText("Clear all")
        .onClick(async () => {
          plugin.settings.selectedCountries = [];
          // Keep only user patterns
          const userPatterns = plugin.settings.patternMetadata.filter(p => p.source === 'user');
          plugin.settings.patterns = userPatterns.map(p => p.pattern);
          plugin.settings.patternMetadata = userPatterns;
          await plugin.saveSettings();
          new Notice("Cleared all selected countries");
          refreshDisplay();
        })
    );

  // Country selection buttons
  container.createEl("h4", { text: "Add country patterns" });
  const countryButtonsContainer = container.createDiv("pii-country-buttons");
  
  const availableCountries = Object.keys(defaultPatterns).filter(c => c !== 'None');
  availableCountries.forEach(country => {
    const pattern = defaultPatterns[country];
    const isSelected = plugin.settings.selectedCountries.includes(country);
    
    new Setting(countryButtonsContainer)
      .setName(pattern.displayName)
      .setDesc(`Add patterns for ${pattern.displayName}`)
      .addButton((btn) =>
        btn
          .setButtonText(isSelected ? "Remove" : "Add")
          .setClass(isSelected ? "mod-warning" : "mod-cta")
          .onClick(async () => {
            // Check current state instead of using stale isSelected
            const currentlySelected = plugin.settings.selectedCountries.includes(country);
            if (currentlySelected) {
              // Remove country and its patterns
              plugin.settings.selectedCountries = plugin.settings.selectedCountries.filter(c => c !== country);
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
              plugin.settings.patterns = plugin.settings.patterns.filter(p => !allCountryPatterns.includes(p));
              plugin.settings.patternMetadata = plugin.settings.patternMetadata.filter(p => p.source !== country);
              new Notice(`Removed ${pattern.displayName} patterns`);
            } else {
              // Add country and its patterns (check if not already selected)
              if (!plugin.settings.selectedCountries.includes(country)) {
                plugin.settings.selectedCountries.push(country);
              } else {
                new Notice(`${pattern.displayName} is already selected`);
                return;
              }
              
              addCountryPatterns(plugin, country, pattern);
              new Notice(`Added ${pattern.displayName} patterns`);
            }
            await plugin.saveSettings();
            refreshDisplay();
          })
      );
  });
}

/**
 * Creates password management UI
 */
export function createPasswordManagementUI(
  container: HTMLElement,
  plugin: PiiLockPlugin,
  handlePasswordChange: () => Promise<void>,
  refreshDisplay: () => void
): void {
  // Password status
  const hasStoredPassword = !!plugin.settings.storedPassword;
  const statusText = hasStoredPassword ? "Password is currently stored" : "No password stored";
  container.createEl("p", {
    text: statusText,
    cls: hasStoredPassword ? "pii-password-status-active" : "pii-password-status-inactive"
  });

  // Change password button
  new Setting(container)
    .setName(hasStoredPassword ? "Change Password" : "Set Password")
    .setDesc(hasStoredPassword ? "Update your encryption password" : "Set a password for encryption operations")
    .addButton((btn) =>
      btn
        .setButtonText(hasStoredPassword ? "Change" : "Set")
        .setCta()
        .onClick(async () => {
          await handlePasswordChange();
          refreshDisplay(); // Refresh the display
        })
    );

  // Clear password button (only show if password is stored)
  if (hasStoredPassword) {
    new Setting(container)
      .setName("Clear stored password")
      .setDesc("Remove the stored password. You will be prompted for password on each operation.")
      .addButton((btn) =>
        btn
          .setButtonText("Clear")
          .setWarning()
          .onClick(async () => {
            plugin.settings.storedPassword = undefined;
            await plugin.saveSettings();
            new Notice("Password cleared successfully");
            refreshDisplay(); // Refresh the display
          })
      );
  }
}

/**
 * Helper function to add patterns from a country
 */
function addCountryPatterns(
  plugin: PiiLockPlugin,
  country: string,
  pattern: CountryPattern
): void {
  // Add name patterns first
  if (pattern.name) {
    const namePatterns = pattern.name.split('|').filter(p => p.trim());
    plugin.settings.patterns = [...plugin.settings.patterns, ...namePatterns];
    namePatterns.forEach((namePattern, index) => {
      plugin.settings.patternMetadata.push({
        pattern: namePattern,
        source: country,
        displayName: `${country} Name ${index + 1}`
      });
    });
  }
  
  // Add address patterns
  if (pattern.address) {
    const addressPatterns = pattern.address.split('|').filter(p => p.trim());
    plugin.settings.patterns = [...plugin.settings.patterns, ...addressPatterns];
    addressPatterns.forEach((addressPattern, index) => {
      plugin.settings.patternMetadata.push({
        pattern: addressPattern,
        source: country,
        displayName: `${country} Address ${index + 1}`
      });
    });
  }
  
  // Add phone patterns
  if (pattern.phone) {
    const phonePatterns = pattern.phone.split('|').filter(p => p.trim());
    plugin.settings.patterns = [...plugin.settings.patterns, ...phonePatterns];
    phonePatterns.forEach((phonePattern, index) => {
      plugin.settings.patternMetadata.push({
        pattern: phonePattern,
        source: country,
        displayName: `${country} Phone ${index + 1}`
      });
    });
  }
}
