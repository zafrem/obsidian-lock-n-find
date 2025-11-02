# Pattern Management Guide

## Overview

Lock & Find supports **external pattern management** - you can maintain your regex patterns in simple text files and import them whenever you want. No need to manually type patterns in the settings UI!

## 🎯 Quick Start

### Method 1: Simple Text File (Easiest!)

1. Create a file `patterns.txt` in your vault:
```
Email | [a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,} | Email addresses
Phone | \d{3}-\d{3}-\d{4} | US phone numbers
SSN | \d{3}-\d{2}-\d{4} | Social Security Number
```

2. In Lock & Find settings, click "Import Patterns"
3. Enter the file path: `patterns.txt`
4. Done! 🎉

### Method 2: JSON File (Most Flexible)

1. Create `patterns.json`:
```json
[
  {
    "name": "Email",
    "regex": "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
    "description": "Email addresses",
    "enabled": true,
    "category": "common"
  },
  {
    "name": "Phone",
    "regex": "\\d{3}-\\d{3}-\\d{4}",
    "description": "US phone",
    "enabled": true,
    "category": "common"
  }
]
```

2. Import same way as above
3. All patterns are loaded with their settings

### Method 3: From URL (Auto-update!)

1. Upload your patterns to GitHub/Gist/anywhere
2. In settings, click "Import from URL"
3. Enter URL: `https://example.com/patterns.json`
4. Patterns are downloaded and imported

---

## 📄 Supported File Formats

### 1. Text File (.txt)

**Format:** `Name | Regex | Description`

**Example:**
```
# Comments start with #
Email | [a-z@.]+ | Email addresses
Phone | \d{3}-\d{4} | Phone numbers
SSN | \d{3}-\d{2}-\d{4} | Social Security
```

**Pros:**
- ✅ Simplest format
- ✅ Easy to edit
- ✅ No JSON syntax

**Cons:**
- ❌ No enabled/category settings

---

### 2. JSON File (.json)

**Format:**
```json
[
  {
    "name": "Pattern Name",
    "regex": "regex-pattern",
    "description": "Optional description",
    "enabled": true,
    "category": "common"
  }
]
```

**Full Example:**
```json
[
  {
    "name": "Email Address",
    "regex": "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
    "description": "Matches email addresses",
    "enabled": true,
    "category": "common"
  },
  {
    "name": "Credit Card",
    "regex": "\\d{4}[-\\s]?\\d{4}[-\\s]?\\d{4}[-\\s]?\\d{4}",
    "description": "16-digit credit card",
    "enabled": false,
    "category": "financial"
  }
]
```

**Pros:**
- ✅ Full control over settings
- ✅ Structured data
- ✅ Can enable/disable individually
- ✅ Categories

**Cons:**
- ❌ Requires valid JSON
- ❌ Need to escape backslashes (`\\`)

---

### 3. CSV File (.csv)

**Format:** `name,regex,description,enabled,category`

**Example:**
```csv
name,regex,description,enabled,category
Email,[a-z@.]+,Email addresses,true,common
Phone,\d{3}-\d{4},Phone numbers,true,common
SSN,\d{3}-\d{2}-\d{4},Social Security,false,government
```

**Pros:**
- ✅ Excel/Sheets compatible
- ✅ Easy bulk editing
- ✅ Import/export friendly

**Cons:**
- ❌ Quotes in regex can be tricky
- ❌ Commas in descriptions need escaping

---

### 4. Markdown File (.md)

**Format:**
```markdown
## Category Name

- Pattern Name: `regex` - description
- Another Pattern: `\d+` - matches numbers
```

**Example:**
```markdown
# My Pattern Library

## Common Patterns

- Email: `[a-z@.]+` - Email addresses
- Phone: `\d{3}-\d{4}` - Phone numbers

## Financial

- Credit Card: `\d{16}` - Card numbers
- Bitcoin: `[13][a-z0-9]{25,34}` - BTC address
```

**Pros:**
- ✅ Human-readable
- ✅ Nice documentation
- ✅ Organize by categories
- ✅ Comments and notes

**Cons:**
- ❌ Must follow exact format
- ❌ No enabled flags

---

## 🌐 Import from URL

### From GitHub

1. Create a `patterns.json` file in your repo
2. Get the raw URL: `https://raw.githubusercontent.com/user/repo/main/patterns.json`
3. Import from URL in settings

### From GitHub Gist

1. Create a Gist with `patterns.json`
2. Get Gist ID from URL (e.g., `abc123def456`)
3. Import from Gist in settings

### From Any Website

Any publicly accessible JSON file works:
```
https://example.com/patterns.json
https://mysite.io/data/pii-patterns.json
```

---

## 🔄 Auto-Update Patterns

Keep your patterns synchronized with a remote source:

1. Set up auto-update in settings
2. Provide URL to patterns file
3. Choose update frequency (daily/weekly)
4. Patterns automatically update in background

**Example Use Cases:**
- Company-wide pattern standards
- Community-maintained lists
- Compliance requirements
- Industry-specific patterns

---

## 💾 Export Your Patterns

Export your current patterns to share or backup:

1. Go to Settings → Lock & Find
2. Click "Export Patterns"
3. Choose format (JSON/CSV/TXT)
4. File is created in your vault

---

## 🚀 Advanced Usage

### Pattern Sources Management

Keep multiple pattern sources:

```json
{
  "sources": [
    {
      "name": "Company Patterns",
      "url": "https://company.com/patterns.json",
      "autoUpdate": true,
      "updateInterval": "daily"
    },
    {
      "name": "Personal Patterns",
      "file": "my-patterns.json",
      "autoUpdate": false
    }
  ]
}
```

### Pattern Merging

When importing:
- **New patterns** are added
- **Existing patterns** (same name) are updated
- **Disabled patterns** stay disabled (unless explicitly enabled in import)

### Pattern Priority

If multiple patterns match the same text:
1. User patterns take priority
2. Then by category (government > financial > common)
3. Then by specificity (longer regex first)

---

## 📚 Example Pattern Libraries

### Basic PII Patterns

```json
[
  {"name": "Email", "regex": "[a-z@.]+"},
  {"name": "Phone", "regex": "\\d{3}-\\d{4}"},
  {"name": "SSN", "regex": "\\d{3}-\\d{2}-\\d{4}"}
]
```

### Financial Patterns

```json
[
  {"name": "Credit Card", "regex": "\\d{16}"},
  {"name": "Bank Account", "regex": "\\d{10,12}"},
  {"name": "Routing Number", "regex": "\\d{9}"}
]
```

### Technical Patterns

```json
[
  {"name": "IPv4", "regex": "\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}"},
  {"name": "API Key", "regex": "[a-z0-9]{32,}"},
  {"name": "JWT", "regex": "eyJ[a-zA-Z0-9_-]+\\.[a-zA-Z0-9_-]+\\.[a-zA-Z0-9_-]+"}
]
```

### International IDs

```json
[
  {"name": "Korean ID", "regex": "\\d{6}-\\d{7}"},
  {"name": "UK NI Number", "regex": "[A-Z]{2}\\d{6}[A-Z]"},
  {"name": "Canadian SIN", "regex": "\\d{3}-\\d{3}-\\d{3}"}
]
```

---

## 🛠️ Best Practices

### 1. Keep Patterns Simple
```
❌ Too complex: (?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08...
✅ Simple:      [a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}
```

### 2. Test Your Patterns
Use regex testing tools before importing:
- regex101.com
- regexr.com
- regexpal.com

### 3. Use Categories
Organize patterns by type for easier management:
- `common` - frequently used
- `financial` - money-related
- `government` - IDs, SSN, etc.
- `technical` - API keys, IPs
- `user` - custom patterns

### 4. Version Control
Keep your pattern files in git:
```bash
git add patterns.json
git commit -m "Add credit card pattern"
git push
```

### 5. Comment Your Patterns
Use descriptions to explain what each pattern matches:
```json
{
  "name": "Complex ID",
  "regex": "[A-Z]{2}\\d{6}",
  "description": "Two letters followed by 6 digits - used in XYZ system"
}
```

---

## 🔧 Troubleshooting

### Pattern Not Matching

**Problem:** Pattern in file but not finding matches

**Solutions:**
1. Check if pattern is enabled
2. Verify regex syntax (escape backslashes in JSON)
3. Test pattern separately
4. Check category filters

### Import Failed

**Problem:** "Failed to import patterns"

**Solutions:**
1. Check file path is correct
2. Verify JSON syntax (use JSONLint)
3. Check file permissions
4. Try different format (TXT instead of JSON)

### URL Import Not Working

**Problem:** Can't download from URL

**Solutions:**
1. Check URL is publicly accessible
2. Test URL in browser
3. Check CORS settings
4. Try raw GitHub URL

### Patterns Disappeared

**Problem:** Patterns vanished after import

**Solutions:**
1. Check if they were merged (not replaced)
2. Look in pattern history
3. Re-import from backup
4. Check vault .trash folder

---

## 📞 Support

- **Documentation:** [Full Docs](./API.md)
- **Examples:** See `/examples` folder
- **Issues:** [GitHub Issues](https://github.com/your-repo/issues)

---

## 🎓 Examples in This Repo

Check the `/examples` folder for:
- `patterns.json` - Full JSON example
- `patterns.txt` - Simple text format
- `patterns.csv` - CSV format
- `patterns.md` - Markdown format

Copy any of these to your vault and start using them immediately!
