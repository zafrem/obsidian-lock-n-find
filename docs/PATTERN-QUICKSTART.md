# Pattern Management - Quick Start

## 🚀 3 Ways to Add Patterns (Choose One!)

### Option 1: Simple Text File (Recommended!)

**1. Create** `patterns.txt` **in your vault:**
```
Email | [a-zA-Z0-9@.]+ | Email addresses
Phone | \d{3}-\d{4} | Phone numbers
```

**2. Import in settings:**
- Settings → Lock & Find → Import Patterns
- Enter: `patterns.txt`
- Click Import

**Done! ✨**

---

### Option 2: From Internet

**1. Use a URL:**
- Settings → Lock & Find → Import from URL
- Paste: `https://raw.githubusercontent.com/your-repo/patterns.json`
- Click Download

**That's it! 🎉**

---

### Option 3: Copy-Paste

**1. Copy this JSON:**
```json
[
  {"name": "Email", "regex": "[a-z@.]+", "enabled": true},
  {"name": "Phone", "regex": "\\d{3}-\\d{4}", "enabled": true}
]
```

**2. In settings:**
- Click "Import Patterns"
- Paste in text box
- Click Import

**Easy! 🎊**

---

## 📝 File Format Cheat Sheet

### Text (.txt)
```
Name | Regex | Description
```

### JSON (.json)
```json
[{"name": "X", "regex": "Y", "enabled": true}]
```

### CSV (.csv)
```
name,regex,description,enabled
X,Y,description,true
```

### Markdown (.md)
```markdown
## Category
- Name: `regex` - description
```

---

## 🔄 Auto-Update Patterns

**Keep patterns synced:**

1. Save patterns to GitHub/Gist
2. Settings → Auto-Update Patterns
3. Enter URL
4. Choose frequency (daily/weekly)

Patterns update automatically! 🔄

---

## 💡 Pro Tips

✅ **DO:**
- Keep patterns in vault for easy editing
- Use text format for simplicity
- Version control with git
- Test patterns before importing

❌ **DON'T:**
- Hardcode patterns in settings UI
- Forget to escape backslashes in JSON (`\\d` not `\d`)
- Import untested patterns

---

## 🆘 Quick Help

**Problem:** Pattern not found
- Check if enabled
- Verify regex syntax

**Problem:** Import failed
- Check file path
- Test JSON syntax

**Problem:** URL not working
- Verify URL is public
- Try in browser first

---

## 📂 Example Files

Copy from `/examples` folder:
- `patterns.json` - Full example
- `patterns.txt` - Simple format
- `patterns.csv` - Spreadsheet format
- `patterns.md` - Documentation style

---

## 🎯 Most Common Patterns

```
Email: [a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}
Phone (US): \d{3}[-.]?\d{3}[-.]?\d{4}
SSN: \d{3}-\d{2}-\d{4}
Credit Card: \d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}
IPv4: \b(?:\d{1,3}\.){3}\d{1,3}\b
URL: https?://[^\s]+
```

---

**Full Documentation:** [PATTERN-MANAGEMENT.md](./PATTERN-MANAGEMENT.md)
