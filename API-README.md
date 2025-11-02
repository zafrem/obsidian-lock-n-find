# Lock & Find API

**🔒 Secure, encrypted external API for Obsidian Lock & Find plugin**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![API Version](https://img.shields.io/badge/API-v0.1.0-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

## ✨ Features

- 🔐 **Secure Authentication** - API key-based with cryptographic hashing
- 🔒 **TLS Encryption** - All communication over HTTPS
- 🔍 **Powerful Search** - Regex and direct text search across your vault
- 🛡️ **Data Protection** - AES-GCM encryption for sensitive information
- ⚡ **Rate Limiting** - Built-in protection against abuse
- 📊 **Request Logging** - Optional audit trail for debugging
- 🧪 **Comprehensive Tests** - 50+ test cases for reliability
- 📚 **Full Documentation** - Complete API reference and examples

## 🚀 Quick Start

### 1. Enable the API

```
Obsidian → Settings → Lock & Find → API Settings → Enable API Server
```

### 2. Generate API Key

```
API Settings → Manage Keys → Generate Key → Copy
```

### 3. Make Your First Request

```bash
curl https://localhost:27750/api/health \
  -H "X-API-Key: lnf_your_key_here" \
  -k
```

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [Quick Start Guide](./docs/API-QUICKSTART.md) | Get up and running in 5 minutes |
| [Full API Reference](./docs/API.md) | Complete endpoint documentation |
| [Implementation Details](./docs/API-IMPLEMENTATION.md) | Architecture and technical details |
| [Test Suite](./api-tests/README.md) | External testing documentation |

## 🔧 API Endpoints

### Search

```bash
POST /api/search/regex
POST /api/search/direct
```

Search your vault using regex patterns or direct text matching.

**Example:**
```bash
curl -X POST https://localhost:27750/api/search/regex \
  -H "X-API-Key: lnf_key" \
  -H "Content-Type: application/json" \
  -d '{"query": "\\d{3}-\\d{4}", "timestamp": 1234567890}'
```

### Encryption

```bash
POST /api/encrypt
POST /api/decrypt
```

Encrypt and decrypt sensitive information.

**Example:**
```bash
curl -X POST https://localhost:27750/api/encrypt \
  -H "X-API-Key: lnf_key" \
  -H "Content-Type: application/json" \
  -d '{"text": "secret", "password": "pass123", "timestamp": 1234567890}'
```

### Health Check

```bash
GET /api/health
```

Check API server status and version.

## 🛠️ Installation & Setup

### Prerequisites

- Obsidian with Lock & Find plugin installed
- Node.js 18+ (for running tests)

### Plugin Installation

1. Install Lock & Find plugin from Obsidian Community Plugins
2. Enable the plugin
3. Configure API settings

### Test Suite Setup

```bash
cd api-tests
npm install

# Configure environment
export API_BASE_URL="https://localhost:27750"
export API_KEY="lnf_your_key_here"

# Run tests
npm test
```

## 🔐 Security

### Authentication

All requests require an API key in the `X-API-Key` header:

```http
X-API-Key: lnf_a1b2c3d4e5f6...
```

### Encryption

- **Transport**: TLS 1.3+ (HTTPS)
- **Data**: AES-GCM with random IV
- **Keys**: PBKDF2 with 10,000+ iterations
- **Authentication**: Constant-time comparison

### Rate Limiting

- **Default**: 100 requests per minute per key
- **Configurable**: Adjust in settings
- **Auto-reset**: Every 60 seconds

### Best Practices

✅ Use environment variables for API keys
✅ Enable TLS certificate validation in production
✅ Rotate keys regularly
✅ Use strong passwords (8+ characters)
✅ Enable request logging for debugging only
✅ Revoke compromised keys immediately

## 📊 Testing

### Run All Tests

```bash
cd api-tests
npm test
```

### Test Categories

- ✅ **Authentication** - Key validation and security
- ✅ **Search** - Regex and direct search functionality
- ✅ **Encryption** - End-to-end encryption tests
- ✅ **Security** - Rate limiting, input validation, TLS

### Coverage

```bash
npm run test:coverage
```

## 💡 Usage Examples

### JavaScript/TypeScript

```typescript
import { LnFApiClient } from './api-tests/src/client';

const client = new LnFApiClient({
  baseUrl: 'https://localhost:27750',
  apiKey: process.env.API_KEY!,
  tlsOptions: { rejectUnauthorized: false }
});

// Search
const results = await client.regexSearch('\\d{3}-\\d{4}');
console.log(results);

// Encrypt
const cipher = await client.encrypt('secret', 'password');
console.log(cipher);
```

### Python

```python
import requests

headers = {'X-API-Key': 'lnf_your_key'}
response = requests.post(
    'https://localhost:27750/api/search/regex',
    headers=headers,
    json={'query': r'\d{3}-\d{4}', 'timestamp': 1234567890},
    verify=False
)
print(response.json())
```

### cURL

```bash
curl -X POST https://localhost:27750/api/search/direct \
  -H "X-API-Key: lnf_your_key" \
  -H "Content-Type: application/json" \
  -d '{"query": "password", "timestamp": 1234567890}' \
  -k | jq
```

## 🏗️ Architecture

```
┌─────────────────────┐
│  Obsidian Plugin    │
│  ┌───────────────┐  │
│  │  API Server   │  │
│  │  - Auth       │  │
│  │  - Routing    │  │
│  │  - Rate Limit │  │
│  └───────┬───────┘  │
│          │          │
│  ┌───────┴───────┐  │
│  │   Routes      │  │
│  │ - Search      │  │
│  │ - Encrypt     │  │
│  └───────────────┘  │
└─────────────────────┘
          │
          │ HTTPS/TLS
          │ API Key
          ▼
┌─────────────────────┐
│  External Clients   │
│  - Apps             │
│  - Scripts          │
│  - Tests            │
└─────────────────────┘
```

## 🐛 Troubleshooting

### Connection Refused

**Problem:** Can't connect to API server

**Solution:**
1. Check if API is enabled in settings
2. Verify port number (default: 27750)
3. Restart Obsidian

### Unauthorized

**Problem:** `Invalid API key` error

**Solution:**
1. Regenerate API key
2. Check for spaces in key
3. Ensure key not revoked

### Rate Limit Exceeded

**Problem:** `429 Too Many Requests`

**Solution:**
1. Wait 60 seconds
2. Reduce request frequency
3. Increase limit in settings

See [Full Troubleshooting Guide](./docs/API-QUICKSTART.md#common-issues)

## 📈 Roadmap

- [ ] WebSocket support
- [ ] Batch operations
- [ ] Result pagination
- [ ] Webhook notifications
- [ ] OAuth2 support
- [ ] GraphQL endpoint

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Update documentation
5. Submit a pull request

## 📝 License

MIT License - see [LICENSE](./LICENSE) file

## 🙏 Acknowledgments

- Lock & Find Plugin by [Zafrem](https://github.com/zafrem)
- API Implementation by Claude (Anthropic)
- Obsidian Community

## 📞 Support

- **Documentation**: [/docs](./docs/)
- **Issues**: [GitHub Issues](https://github.com/zafrem/obsidian-lock-n-find/issues)
- **Discussions**: [GitHub Discussions](https://github.com/zafrem/obsidian-lock-n-find/discussions)

## 🌟 Star History

If you find this useful, please consider starring the repository!

---

**Made with ❤️ for the Obsidian community**
