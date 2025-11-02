// api-tests/src/tests/auth.test.ts
import { LnFApiClient } from '../client';

describe('API Authentication', () => {
  const baseUrl = process.env.API_BASE_URL || 'https://localhost:27750';
  const validApiKey = process.env.API_KEY || 'lnf_test_key';

  test('valid API key is accepted', async () => {
    const client = new LnFApiClient({
      baseUrl,
      apiKey: validApiKey,
      tlsOptions: { rejectUnauthorized: false },
    });

    const health = await client.health();
    expect(health.status).toBe('ok');
  });

  test('invalid API key is rejected', async () => {
    const client = new LnFApiClient({
      baseUrl,
      apiKey: 'invalid_key',
      tlsOptions: { rejectUnauthorized: false },
    });

    await expect(client.health()).rejects.toThrow();
  });

  test('missing API key is rejected', async () => {
    const client = new LnFApiClient({
      baseUrl,
      apiKey: '',
      tlsOptions: { rejectUnauthorized: false },
    });

    await expect(client.health()).rejects.toThrow();
  });

  test('revoked API key is rejected', async () => {
    // This test assumes you have a revoked key in env
    const revokedKey = process.env.REVOKED_API_KEY;
    if (!revokedKey) {
      console.warn('Skipping revoked key test - no REVOKED_API_KEY env var');
      return;
    }

    const client = new LnFApiClient({
      baseUrl,
      apiKey: revokedKey,
      tlsOptions: { rejectUnauthorized: false },
    });

    await expect(client.health()).rejects.toThrow();
  });
});
