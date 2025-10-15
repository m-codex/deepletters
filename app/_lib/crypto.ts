// app/_lib/crypto.ts

const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12; // bytes

// Generate a new AES-GCM encryption key
export async function generateEncryptionKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    {
      name: ALGORITHM,
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

// Encrypts data using a CryptoKey
export async function encryptData(key: CryptoKey, data: ArrayBuffer): Promise<ArrayBuffer> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encryptedData = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv: iv,
    },
    key,
    data
  );

  const result = new Uint8Array(iv.length + encryptedData.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(encryptedData), iv.length);

  return result.buffer;
}

// Decrypts data using a CryptoKey
export async function decryptData(key: CryptoKey, data: ArrayBuffer): Promise<ArrayBuffer> {
  const iv = data.slice(0, IV_LENGTH);
  const encryptedData = data.slice(IV_LENGTH);

  return crypto.subtle.decrypt(
    {
      name: ALGORITHM,
      iv: new Uint8Array(iv),
    },
    key,
    encryptedData
  );
}

// Export a CryptoKey to a URL-safe base64 string for transport
export async function exportKeyToString(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('raw', key);
  const base64 = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(exported))));
  // Make base64 URL-safe
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Import a CryptoKey from a URL-safe base64 string
export async function importKeyFromString(keyString: string): Promise<CryptoKey> {
  // URL-safe base64 to standard base64
  let base64 = keyString.replace(/-/g, '+').replace(/_/g, '/');
  // Pad with '=' chars
  while (base64.length % 4) {
    base64 += '=';
  }
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return crypto.subtle.importKey(
    'raw',
    bytes.buffer,
    {
      name: ALGORITHM,
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}
