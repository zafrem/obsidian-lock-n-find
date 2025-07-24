// src/crypto.ts
export async function deriveKey(pwd: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(pwd),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode("pii-salt"),
      iterations: 50_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encrypt(text: string, pwd: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pwd);
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc);
  return `${Buffer.from(iv).toString("base64")}.${Buffer.from(buf).toString("base64")}`;
}

export async function decrypt(data: string, pwd: string): Promise<string> {
  const [ivB64, bufB64] = data.split(".");
  const iv = Uint8Array.from(Buffer.from(ivB64, "base64"));
  const buf = Buffer.from(bufB64, "base64");
  const key = await deriveKey(pwd);
  const dec = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, buf);
  return new TextDecoder().decode(dec);
}
