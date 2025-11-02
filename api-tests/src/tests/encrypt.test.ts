// api-tests/src/tests/encrypt.test.ts
import { LnFApiClient } from '../client';

describe('Encryption API', () => {
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

  describe('Encryption', () => {
    test('encrypts text successfully', async () => {
      const plaintext = 'This is a secret message';
      const password = 'test-password-123';

      const ciphertext = await client.encrypt(plaintext, password);

      expect(ciphertext).toBeDefined();
      expect(typeof ciphertext).toBe('string');
      expect(ciphertext.length).toBeGreaterThan(0);
      expect(ciphertext).not.toBe(plaintext);
    });

    test('encrypts empty string', async () => {
      const ciphertext = await client.encrypt('', 'password');
      expect(ciphertext).toBeDefined();
      expect(typeof ciphertext).toBe('string');
    });

    test('different passwords produce different ciphertexts', async () => {
      const plaintext = 'Same message';
      const cipher1 = await client.encrypt(plaintext, 'password1');
      const cipher2 = await client.encrypt(plaintext, 'password2');

      expect(cipher1).not.toBe(cipher2);
    });

    test('same encryption produces different ciphertexts (IV randomness)', async () => {
      const plaintext = 'Same message';
      const password = 'same-password';

      const cipher1 = await client.encrypt(plaintext, password);
      const cipher2 = await client.encrypt(plaintext, password);

      // Due to random IV, ciphertexts should be different
      expect(cipher1).not.toBe(cipher2);
    });

    test('password too short is rejected', async () => {
      await expect(client.encrypt('test', 'short')).rejects.toThrow();
    });

    test('text too large is rejected', async () => {
      const largeText = 'a'.repeat(2000000); // 2MB
      await expect(client.encrypt(largeText, 'password123')).rejects.toThrow();
    });
  });

  describe('Decryption', () => {
    test('decrypts successfully with correct password', async () => {
      const plaintext = 'Secret message for decryption';
      const password = 'decrypt-test-password';

      const ciphertext = await client.encrypt(plaintext, password);
      const decrypted = await client.decrypt(ciphertext, password);

      expect(decrypted).toBe(plaintext);
    });

    test('decryption fails with wrong password', async () => {
      const plaintext = 'Secret message';
      const password = 'correct-password';

      const ciphertext = await client.encrypt(plaintext, password);

      await expect(
        client.decrypt(ciphertext, 'wrong-password')
      ).rejects.toThrow();
    });

    test('decryption fails with corrupted ciphertext', async () => {
      const corrupted = 'not-a-valid-ciphertext';
      await expect(client.decrypt(corrupted, 'password')).rejects.toThrow();
    });

    test('empty password is rejected', async () => {
      const ciphertext = 'some.cipher';
      await expect(client.decrypt(ciphertext, '')).rejects.toThrow();
    });
  });

  describe('End-to-End Encryption', () => {
    test('encrypt and decrypt preserves data', async () => {
      const testCases = [
        'Simple text',
        'Text with special chars: !@#$%^&*()',
        'Multi\nline\ntext',
        'Unicode: 你好 مرحبا שלום',
        '{"json": "data", "number": 123}',
        'Very long text: ' + 'a'.repeat(1000),
      ];

      const password = 'end-to-end-test-password';

      for (const plaintext of testCases) {
        const ciphertext = await client.encrypt(plaintext, password);
        const decrypted = await client.decrypt(ciphertext, password);
        expect(decrypted).toBe(plaintext);
      }
    });

    test('multiple encrypt/decrypt cycles work', async () => {
      let text = 'Initial text';
      const password = 'cycle-test-password';

      for (let i = 0; i < 5; i++) {
        const encrypted = await client.encrypt(text, password);
        const decrypted = await client.decrypt(encrypted, password);
        expect(decrypted).toBe(text);
        text = `Cycle ${i + 1}: ${text}`;
      }
    });
  });

  describe('Security', () => {
    test('ciphertext format is correct', async () => {
      const ciphertext = await client.encrypt('test', 'password123');

      // Ciphertext should have format: base64.base64
      expect(ciphertext).toMatch(/^[A-Za-z0-9+/=]+\.[A-Za-z0-9+/=]+$/);
      expect(ciphertext.split('.')).toHaveLength(2);
    });

    test('IV is unique for each encryption', async () => {
      const plaintext = 'test';
      const password = 'password';

      const ciphers = await Promise.all([
        client.encrypt(plaintext, password),
        client.encrypt(plaintext, password),
        client.encrypt(plaintext, password),
      ]);

      // Extract IVs (first part before dot)
      const ivs = ciphers.map((c) => c.split('.')[0]);

      // All IVs should be unique
      const uniqueIvs = new Set(ivs);
      expect(uniqueIvs.size).toBe(3);
    });
  });
});
