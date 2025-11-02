# Lock & Find API Quick Start Guide

Get started with the Lock & Find API in 5 minutes!

## Step 1: Enable the API Server

1. Open Obsidian
2. Go to **Settings** → **Lock & Find** → **API Settings**
3. Toggle **Enable API Server** to ON
4. Note the port number (default: 27750)

## Step 2: Generate an API Key

1. Click **Manage Keys**
2. Click **Generate Key**
3. Enter a name (e.g., "My App")
4. **Copy the key immediately** - you won't see it again!

Example key: `lnf_a1b2c3d4e5f6...`

## Step 3: Test the Connection

### Using cURL

```bash
curl -X GET https://localhost:27750/api/health \
  -H "X-API-Key: lnf_your_key_here" \
  -k
```

Expected response:
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

### Using the Test Client

Install the test client:

```bash
cd api-tests
npm install
```

Create `.env` file:
```bash
API_BASE_URL=https://localhost:27750
API_KEY=lnf_your_key_here
```

Run tests:
```bash
npm test
```

## Step 4: Make Your First Search

### Search for Phone Numbers

```bash
curl -X POST https://localhost:27750/api/search/regex \
  -H "Content-Type: application/json" \
  -H "X-API-Key: lnf_your_key_here" \
  -d '{
    "query": "\\d{3}-\\d{3}-\\d{4}",
    "caseSensitive": false,
    "maxResults": 10,
    "timestamp": '$(date +%s000)'
  }' \
  -k | jq
```

### Search for Exact Text

```bash
curl -X POST https://localhost:27750/api/search/direct \
  -H "Content-Type: application/json" \
  -H "X-API-Key: lnf_your_key_here" \
  -d '{
    "query": "password",
    "caseSensitive": false,
    "maxResults": 10,
    "timestamp": '$(date +%s000)'
  }' \
  -k | jq
```

## Step 5: Encrypt & Decrypt

### Encrypt Text

```bash
curl -X POST https://localhost:27750/api/encrypt \
  -H "Content-Type: application/json" \
  -H "X-API-Key: lnf_your_key_here" \
  -d '{
    "text": "My secret message",
    "password": "secure-password-123",
    "timestamp": '$(date +%s000)'
  }' \
  -k | jq
```

Save the ciphertext from the response!

### Decrypt Text

```bash
curl -X POST https://localhost:27750/api/decrypt \
  -H "Content-Type: application/json" \
  -H "X-API-Key: lnf_your_key_here" \
  -d '{
    "ciphertext": "aGVsbG8=.d29ybGQ=",
    "password": "secure-password-123",
    "timestamp": '$(date +%s000)'
  }' \
  -k | jq
```

## Using with Programming Languages

### JavaScript/Node.js

Install axios:
```bash
npm install axios
```

Create `test.js`:
```javascript
const axios = require('axios');
const https = require('https');

const client = axios.create({
  baseURL: 'https://localhost:27750',
  headers: {
    'X-API-Key': 'lnf_your_key_here'
  },
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
});

async function search() {
  const response = await client.post('/api/search/regex', {
    query: '\\d{3}-\\d{4}',
    caseSensitive: false,
    maxResults: 10,
    timestamp: Date.now()
  });

  console.log(response.data);
}

search();
```

Run:
```bash
node test.js
```

### Python

Install requests:
```bash
pip install requests
```

Create `test.py`:
```python
import requests
import time

API_BASE = 'https://localhost:27750'
API_KEY = 'lnf_your_key_here'

headers = {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
}

response = requests.post(
    f'{API_BASE}/api/search/regex',
    headers=headers,
    json={
        'query': r'\d{3}-\d{4}',
        'caseSensitive': False,
        'maxResults': 10,
        'timestamp': int(time.time() * 1000)
    },
    verify=False
)

print(response.json())
```

Run:
```bash
python test.py
```

## Common Issues

### Connection Refused

**Problem:** `curl: (7) Failed to connect to localhost port 27750`

**Solution:**
1. Check if API server is enabled in settings
2. Verify the port number
3. Restart Obsidian

### Unauthorized Error

**Problem:** `{"success": false, "error": "Invalid API key"}`

**Solution:**
1. Verify you copied the full API key
2. Check for extra spaces in the key
3. Ensure the key hasn't been revoked
4. Generate a new key if needed

### Rate Limit Exceeded

**Problem:** `{"success": false, "error": "Rate limit exceeded"}`

**Solution:**
1. Wait 60 seconds for the rate limit to reset
2. Reduce request frequency
3. Increase rate limit in settings (default: 100/minute)

### Certificate Error

**Problem:** `SSL certificate problem: self signed certificate`

**Solution:**
- For testing: Use `-k` flag with curl or `verify=False` in code
- For production: Use proper CA-signed certificates

## Next Steps

- Read the [Full API Documentation](./API.md)
- Explore the [Test Suite](../api-tests/README.md)
- Check out [Security Best Practices](./API.md#security)

## Tips & Tricks

### Save API Key Securely

Create a `.env` file:
```bash
# .env
LOCK_N_FIND_API_KEY=lnf_your_key_here
LOCK_N_FIND_API_URL=https://localhost:27750
```

**Never commit this file to git!**

Add to `.gitignore`:
```
.env
*.key
```

### Create an Alias

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
alias lnf-search='curl -X POST https://localhost:27750/api/search/direct \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $LOCK_N_FIND_API_KEY" \
  -d '"'"'{"query": "$1", "timestamp": '$(date +%s000)'}'"'"' \
  -k | jq'
```

Usage:
```bash
lnf-search "password"
```

### Monitor API Usage

Check request logs in Obsidian:
1. Go to Settings → Lock & Find → API Settings
2. Enable "Log API Requests"
3. Check the console (Ctrl+Shift+I / Cmd+Option+I)

## Support

Need help?
- Check the [FAQ](./API.md#error-handling)
- Open an [issue](https://github.com/zafrem/obsidian-lock-n-find/issues)
- Read the [full documentation](./API.md)
