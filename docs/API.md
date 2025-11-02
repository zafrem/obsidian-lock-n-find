# Lock & Find API Documentation

## Overview

The Lock & Find API provides programmatic access to privacy scanning, search, and encryption functionality. All communication uses HTTPS with TLS 1.3+ and requires API key authentication.

**Base URL:** `https://localhost:27750` (configurable)

## Table of Contents

- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Health Check](#health-check)
  - [Regex Search](#regex-search)
  - [Direct Search](#direct-search)
  - [Encrypt](#encrypt)
  - [Decrypt](#decrypt)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [Examples](#examples)
- [Security](#security)

## Authentication

All API requests require authentication using an API key.

### Generating an API Key

1. Open Obsidian with Lock & Find plugin installed
2. Go to Settings → Lock & Find → API Settings
3. Enable "API Server"
4. Click "Manage Keys"
5. Click "Generate Key"
6. Copy the generated key (shown only once)

### Using the API Key

Include the API key in the `X-API-Key` header:

```http
X-API-Key: lnf_1234567890abcdef...
```

### Key Format

API keys follow the format: `lnf_<64 hexadecimal characters>`

Example: `lnf_a1b2c3d4e5f6...` (64 hex chars after prefix)

## Endpoints

### Health Check

Check API server status and version.

**Endpoint:** `GET /api/health`

**Headers:**
```http
X-API-Key: your-api-key
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "version": "0.1.0",
    "uptime": 1234567890
  },
  "timestamp": 1234567890
}
```

**cURL Example:**
```bash
curl -X GET https://localhost:27750/api/health \
  -H "X-API-Key: lnf_your_key_here" \
  -k
```

---

### Regex Search

Search vault content using regular expressions.

**Endpoint:** `POST /api/search/regex`

**Headers:**
```http
Content-Type: application/json
X-API-Key: your-api-key
```

**Request Body:**
```json
{
  "query": "\\d{3}-\\d{4}-\\d{4}",
  "caseSensitive": false,
  "maxResults": 100,
  "timestamp": 1234567890
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| query | string | Yes | Regular expression pattern |
| caseSensitive | boolean | No | Case-sensitive matching (default: false) |
| maxResults | number | No | Maximum results to return (default: 1000, max: 10000) |
| timestamp | number | Yes | Unix timestamp of request |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "file": "notes/personal.md",
      "line": 42,
      "col": 15,
      "text": "123-456-7890",
      "context": "Phone: 123-456-7890"
    }
  ],
  "timestamp": 1234567890
}
```

**Result Fields:**

| Field | Type | Description |
|-------|------|-------------|
| file | string | Relative file path |
| line | number | Line number (0-indexed) |
| col | number | Column position (0-indexed) |
| text | string | Matched text |
| context | string | Full line containing the match |

**Error Responses:**

- `400` - Invalid regex pattern
- `401` - Invalid or missing API key
- `429` - Rate limit exceeded

**cURL Example:**
```bash
curl -X POST https://localhost:27750/api/search/regex \
  -H "Content-Type: application/json" \
  -H "X-API-Key: lnf_your_key_here" \
  -d '{
    "query": "\\d{3}-\\d{4}",
    "caseSensitive": false,
    "maxResults": 50,
    "timestamp": 1234567890
  }' \
  -k
```

---

### Direct Search

Search vault for exact text matches.

**Endpoint:** `POST /api/search/direct`

**Headers:**
```http
Content-Type: application/json
X-API-Key: your-api-key
```

**Request Body:**
```json
{
  "query": "sensitive information",
  "caseSensitive": true,
  "maxResults": 100,
  "timestamp": 1234567890
}
```

**Parameters:** Same as Regex Search

**Response:** Same structure as Regex Search

**cURL Example:**
```bash
curl -X POST https://localhost:27750/api/search/direct \
  -H "Content-Type: application/json" \
  -H "X-API-Key: lnf_your_key_here" \
  -d '{
    "query": "password",
    "caseSensitive": false,
    "maxResults": 100,
    "timestamp": 1234567890
  }' \
  -k
```

---

### Encrypt

Encrypt text using AES-GCM.

**Endpoint:** `POST /api/encrypt`

**Headers:**
```http
Content-Type: application/json
X-API-Key: your-api-key
```

**Request Body:**
```json
{
  "text": "Secret message to encrypt",
  "password": "strong-password-123",
  "timestamp": 1234567890
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| text | string | Yes | Text to encrypt (max 1MB) |
| password | string | No | Encryption password (min 8 chars) |
| timestamp | number | Yes | Unix timestamp of request |

**Response:**
```json
{
  "success": true,
  "data": {
    "ciphertext": "aGVsbG8=.d29ybGQ=",
    "algorithm": "AES-GCM"
  },
  "timestamp": 1234567890
}
```

**Ciphertext Format:** `<base64_iv>.<base64_encrypted_data>`

**cURL Example:**
```bash
curl -X POST https://localhost:27750/api/encrypt \
  -H "Content-Type: application/json" \
  -H "X-API-Key: lnf_your_key_here" \
  -d '{
    "text": "My secret data",
    "password": "secure-password-123",
    "timestamp": 1234567890
  }' \
  -k
```

---

### Decrypt

Decrypt AES-GCM encrypted text.

**Endpoint:** `POST /api/decrypt`

**Headers:**
```http
Content-Type: application/json
X-API-Key: your-api-key
```

**Request Body:**
```json
{
  "ciphertext": "aGVsbG8=.d29ybGQ=",
  "password": "strong-password-123",
  "timestamp": 1234567890
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| ciphertext | string | Yes | Encrypted text from encrypt endpoint |
| password | string | Yes | Decryption password (min 8 chars) |
| timestamp | number | Yes | Unix timestamp of request |

**Response:**
```json
{
  "success": true,
  "data": {
    "plaintext": "Secret message to encrypt"
  },
  "timestamp": 1234567890
}
```

**Error Responses:**

- `400` - Invalid ciphertext or wrong password
- `401` - Invalid or missing API key
- `429` - Rate limit exceeded

**cURL Example:**
```bash
curl -X POST https://localhost:27750/api/decrypt \
  -H "Content-Type: application/json" \
  -H "X-API-Key: lnf_your_key_here" \
  -d '{
    "ciphertext": "aGVsbG8=.d29ybGQ=",
    "password": "secure-password-123",
    "timestamp": 1234567890
  }' \
  -k
```

## Rate Limiting

API requests are rate-limited per API key.

**Default Limits:**
- 100 requests per minute per API key
- 1000 requests per hour per API key

**Rate Limit Headers:**

Responses include rate limit information:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

**Rate Limit Exceeded Response:**

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "timestamp": 1234567890
}
```

HTTP Status: `429 Too Many Requests`

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": "Error message description",
  "timestamp": 1234567890
}
```

**HTTP Status Codes:**

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request (invalid parameters) |
| 401 | Unauthorized (invalid or missing API key) |
| 404 | Not Found (endpoint doesn't exist) |
| 429 | Too Many Requests (rate limit exceeded) |
| 500 | Internal Server Error |

**Common Error Messages:**

- `Missing API key` - No X-API-Key header provided
- `Invalid API key` - API key is invalid or revoked
- `Rate limit exceeded` - Too many requests
- `Query is required and must be a string` - Invalid search query
- `Invalid regular expression` - Malformed regex pattern
- `Text too large (max 1MB)` - Encryption payload too large
- `Password must be at least 8 characters` - Password too short
- `Decryption failed: Invalid password or corrupted data` - Wrong password

## Examples

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const client = axios.create({
  baseURL: 'https://localhost:27750',
  headers: {
    'X-API-Key': 'lnf_your_key_here',
    'Content-Type': 'application/json'
  },
  httpsAgent: new https.Agent({
    rejectUnauthorized: false // Only for self-signed certs
  })
});

// Regex search
const searchResults = await client.post('/api/search/regex', {
  query: '\\d{3}-\\d{4}',
  caseSensitive: false,
  maxResults: 50,
  timestamp: Date.now()
});

console.log(searchResults.data);

// Encrypt text
const encrypted = await client.post('/api/encrypt', {
  text: 'Secret data',
  password: 'my-password',
  timestamp: Date.now()
});

console.log(encrypted.data.data.ciphertext);
```

### Python

```python
import requests
import time

API_BASE = 'https://localhost:27750'
API_KEY = 'lnf_your_key_here'

headers = {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
}

# Regex search
response = requests.post(
    f'{API_BASE}/api/search/regex',
    headers=headers,
    json={
        'query': r'\d{3}-\d{4}',
        'caseSensitive': False,
        'maxResults': 50,
        'timestamp': int(time.time() * 1000)
    },
    verify=False  # Only for self-signed certs
)

print(response.json())

# Encrypt
response = requests.post(
    f'{API_BASE}/api/encrypt',
    headers=headers,
    json={
        'text': 'Secret data',
        'password': 'my-password',
        'timestamp': int(time.time() * 1000)
    },
    verify=False
)

print(response.json())
```

### Go

```go
package main

import (
    "bytes"
    "crypto/tls"
    "encoding/json"
    "fmt"
    "net/http"
    "time"
)

type SearchRequest struct {
    Query         string `json:"query"`
    CaseSensitive bool   `json:"caseSensitive"`
    MaxResults    int    `json:"maxResults"`
    Timestamp     int64  `json:"timestamp"`
}

func main() {
    client := &http.Client{
        Transport: &http.Transport{
            TLSClientConfig: &tls.Config{
                InsecureSkipVerify: true, // Only for self-signed certs
            },
        },
    }

    reqBody := SearchRequest{
        Query:         `\d{3}-\d{4}`,
        CaseSensitive: false,
        MaxResults:    50,
        Timestamp:     time.Now().UnixMilli(),
    }

    jsonData, _ := json.Marshal(reqBody)

    req, _ := http.NewRequest("POST",
        "https://localhost:27750/api/search/regex",
        bytes.NewBuffer(jsonData))

    req.Header.Set("X-API-Key", "lnf_your_key_here")
    req.Header.Set("Content-Type", "application/json")

    resp, err := client.Do(req)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()

    var result map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&result)
    fmt.Println(result)
}
```

## Security

### TLS/HTTPS

- All communication must use HTTPS
- TLS 1.3 or higher recommended
- Self-signed certificates accepted for development
- Production should use CA-signed certificates

### API Key Security

- **Never** commit API keys to version control
- Store keys in environment variables or secure vaults
- Rotate keys regularly
- Revoke compromised keys immediately
- Use separate keys for different applications

### Password Security

- Passwords use PBKDF2 key derivation (10,000+ iterations)
- Minimum password length: 8 characters
- Passwords are never stored or logged
- Use strong, unique passwords for encryption

### Data Privacy

- API doesn't store search results or encrypted data
- All processing happens in-memory
- Enable request logging only for debugging
- Audit logs contain metadata only, not sensitive data

### Best Practices

1. **Use TLS Certificate Validation**
   ```typescript
   // Production
   tlsOptions: { rejectUnauthorized: true }
   ```

2. **Handle Errors Securely**
   ```typescript
   try {
     await client.encrypt(data, password);
   } catch (error) {
     // Don't log sensitive data
     console.error('Encryption failed');
   }
   ```

3. **Implement Retry Logic with Backoff**
   ```typescript
   async function searchWithRetry(query, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await client.regexSearch(query);
       } catch (error) {
         if (error.status === 429) {
           await sleep(Math.pow(2, i) * 1000);
         } else {
           throw error;
         }
       }
     }
   }
   ```

4. **Validate Input Before Sending**
   ```typescript
   function validatePassword(password: string): boolean {
     return password.length >= 8;
   }
   ```

## Support

- **Issues:** [GitHub Issues](https://github.com/zafrem/obsidian-lock-n-find/issues)
- **Documentation:** [Plugin Documentation](https://github.com/zafrem/obsidian-lock-n-find)
- **API Version:** Check `/api/health` endpoint

## Changelog

### Version 0.1.0 (2025-01-XX)

- Initial API release
- Regex and direct search endpoints
- Encryption/decryption endpoints
- API key authentication
- Rate limiting
- TLS support
