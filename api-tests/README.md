# Lock & Find API Tests

External test suite for the Lock & Find API.

## Setup

1. Install dependencies:
```bash
cd api-tests
npm install
```

2. Set environment variables:
```bash
export API_BASE_URL="https://localhost:27750"
export API_KEY="your-api-key-here"
export RATE_LIMIT="100"
```

Or create a `.env` file:
```
API_BASE_URL=https://localhost:27750
API_KEY=lnf_1234567890abcdef...
RATE_LIMIT=100
```

## Running Tests

Run all tests:
```bash
npm test
```

Run specific test file:
```bash
npm test -- auth.test.ts
```

Watch mode:
```bash
npm run test:watch
```

Coverage report:
```bash
npm run test:coverage
```

## Test Categories

### Authentication Tests (`auth.test.ts`)
- Valid API key acceptance
- Invalid API key rejection
- Missing API key handling
- Revoked key rejection

### Search Tests (`search.test.ts`)
- Regex search functionality
- Direct text search
- Case sensitivity options
- Result limiting
- Performance benchmarks

### Encryption Tests (`encrypt.test.ts`)
- Text encryption
- Decryption with correct/incorrect passwords
- End-to-end encryption cycles
- Security validations

### Security Tests (`security.test.ts`)
- TLS/HTTPS enforcement
- Rate limiting
- Input validation
- XSS/SQL injection protection
- ReDoS prevention
- API key security
- Data privacy

## Requirements

Before running tests:

1. **Start the API server** in Obsidian:
   - Open Obsidian
   - Go to Lock & Find settings
   - Enable API Server
   - Generate an API key

2. **Configure TLS** (for production):
   - Place your TLS certificate and key in the plugin directory
   - Update the API settings with the paths
   - For testing with self-signed certificates, tests use `rejectUnauthorized: false`

3. **Prepare test vault**:
   - Create some markdown files with test data
   - Include various patterns for regex testing

## Test Data

The tests assume your Obsidian vault contains:
- Markdown files with various text content
- Some files containing numbers in format `\d{3}-\d{4}`
- Files with the word "test" (case variations)

## CI/CD Integration

To run tests in CI:

```yaml
# .github/workflows/api-tests.yml
name: API Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd api-tests && npm ci
      - name: Run tests
        env:
          API_BASE_URL: ${{ secrets.API_BASE_URL }}
          API_KEY: ${{ secrets.API_KEY }}
        run: cd api-tests && npm test
```

## Troubleshooting

### Connection Refused
- Ensure the API server is running in Obsidian
- Check the port number matches your configuration
- Verify firewall settings

### Certificate Errors
- For self-signed certificates, tests use `rejectUnauthorized: false`
- For production, use proper CA-signed certificates
- Update `tlsOptions` in client configuration

### Rate Limit Errors
- Wait for the rate limit window to reset (default: 1 minute)
- Adjust `RATE_LIMIT` environment variable to match server settings
- Run tests with `--maxWorkers=1` to prevent parallel request flooding

### Test Timeout
- Increase Jest timeout: `jest.setTimeout(30000)`
- Check API server performance
- Reduce `maxResults` in search tests

## Contributing

When adding new tests:

1. Follow existing test structure
2. Use descriptive test names
3. Clean up test data after tests
4. Handle errors appropriately
5. Add documentation for new test categories

## License

MIT
