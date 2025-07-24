import type PiiLockPlugin from "../../main";
import { PatternWithMetadata } from "../types/settings";
import { CountryPattern, saveDefaultPatternsToFile, serializeDefaultPatterns } from "./countryPatterns";

export function getPatternsFromSelectedCountries(
  selectedCountries: string[], 
  defaultPatterns: Record<string, CountryPattern>
): string[] {
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

export function syncPatternMetadata(
  plugin: PiiLockPlugin, 
  defaultPatterns: Record<string, CountryPattern>
) {
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

export async function updatePatternInINI(
  plugin: PiiLockPlugin, 
  oldPattern: string, 
  newPattern: string, 
  source: string, 
  defaultPatterns: Record<string, CountryPattern>
) {
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
