// api-tests/src/tests/search.test.ts
import { LnFApiClient } from '../client';

describe('Search API', () => {
  let client: LnFApiClient;

  beforeAll(() => {
    const baseUrl = process.env.API_BASE_URL || 'https://localhost:27750';
    const apiKey = process.env.API_KEY || 'lnf_test_key';

    client = new LnFApiClient({
      baseUrl,
      apiKey,
      tlsOptions: { rejectUnauthorized: false },
    });
  });

  describe('Regex Search', () => {
    test('finds matches with valid regex', async () => {
      const results = await client.regexSearch('\\d{3}-\\d{4}');
      expect(Array.isArray(results)).toBe(true);
    });

    test('returns empty array when no matches found', async () => {
      const results = await client.regexSearch('thisWillNeverMatchAnything12345XYZ');
      expect(results).toEqual([]);
    });

    test('case sensitive search works', async () => {
      const caseSensitive = await client.regexSearch('TEST', {
        caseSensitive: true,
      });
      const caseInsensitive = await client.regexSearch('TEST', {
        caseSensitive: false,
      });

      // Case insensitive should return same or more results
      expect(caseInsensitive.length).toBeGreaterThanOrEqual(caseSensitive.length);
    });

    test('maxResults limit is respected', async () => {
      const results = await client.regexSearch('.', { maxResults: 5 });
      expect(results.length).toBeLessThanOrEqual(5);
    });

    test('invalid regex throws error', async () => {
      await expect(client.regexSearch('[invalid')).rejects.toThrow();
    });

    test('result structure is correct', async () => {
      const results = await client.regexSearch('\\w+');
      if (results.length > 0) {
        const result = results[0];
        expect(result).toHaveProperty('file');
        expect(result).toHaveProperty('line');
        expect(result).toHaveProperty('col');
        expect(result).toHaveProperty('text');
        expect(typeof result.file).toBe('string');
        expect(typeof result.line).toBe('number');
        expect(typeof result.col).toBe('number');
        expect(typeof result.text).toBe('string');
      }
    });
  });

  describe('Direct Search', () => {
    test('finds exact text matches', async () => {
      const results = await client.directSearch('test');
      expect(Array.isArray(results)).toBe(true);
    });

    test('returns empty array when no matches found', async () => {
      const results = await client.directSearch('thisWillNeverMatchAnything12345XYZ');
      expect(results).toEqual([]);
    });

    test('case sensitive search works', async () => {
      const caseSensitive = await client.directSearch('TEST', {
        caseSensitive: true,
      });
      const caseInsensitive = await client.directSearch('TEST', {
        caseSensitive: false,
      });

      // Case insensitive should return same or more results
      expect(caseInsensitive.length).toBeGreaterThanOrEqual(caseSensitive.length);
    });

    test('special characters are handled correctly', async () => {
      const results = await client.directSearch('$special@chars!');
      expect(Array.isArray(results)).toBe(true);
    });

    test('empty query returns error', async () => {
      await expect(client.directSearch('')).rejects.toThrow();
    });
  });

  describe('Performance', () => {
    test('regex search completes in reasonable time', async () => {
      const start = Date.now();
      await client.regexSearch('\\d+');
      const duration = Date.now() - start;

      // Should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
    });

    test('direct search completes in reasonable time', async () => {
      const start = Date.now();
      await client.directSearch('test');
      const duration = Date.now() - start;

      // Should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
    });
  });
});
