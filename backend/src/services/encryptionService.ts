import crypto from 'crypto';
import { VAULT_ENCRYPTION_KEY } from '../config.js';

/**
 * Helper to derive 32-byte Key Buffer from VAULT_ENCRYPTION_KEY
 */
function getKeyBuffer(): Buffer {
  if (/^[0-9a-fA-F]{64}$/.test(VAULT_ENCRYPTION_KEY)) {
    return Buffer.from(VAULT_ENCRYPTION_KEY, 'hex');
  }
  return crypto.createHash('sha256').update(VAULT_ENCRYPTION_KEY).digest();
}

/**
 * Verifies that the SHA-256 hash of a buffer matches the expected hash hex string.
 */
export function verifyFileHash(buffer: Buffer, expectedHash: string): boolean {
  const actualHash = crypto.createHash('sha256').update(buffer).digest('hex');
  return actualHash.toLowerCase() === expectedHash.toLowerCase();
}

export interface EncryptionResult {
  encryptedBuffer: Buffer;
  ivHex: string;
}

/**
 * Encrypts a binary buffer using AES-256-GCM cipher algorithm with random 16-byte IV.
 * Appends 16-byte GCM authentication tag to the encrypted buffer for integrity verification.
 */
export function encryptBuffer(buffer: Buffer): EncryptionResult {
  const keyBuffer = getKeyBuffer();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);

  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Append 16-byte authentication tag to the encrypted payload
  const finalBuffer = Buffer.concat([encrypted, authTag]);

  return {
    encryptedBuffer: finalBuffer,
    ivHex: iv.toString('hex'),
  };
}

/**
 * Decrypts an AES-256-GCM encrypted payload using IV hex string and 16-byte appended auth tag.
 */
export function decryptBuffer(encryptedBuffer: Buffer, ivHex: string): Buffer {
  if (encryptedBuffer.length < 16) {
    throw new Error('Encrypted payload too short to contain authentication tag.');
  }

  const keyBuffer = getKeyBuffer();
  const iv = Buffer.from(ivHex, 'hex');

  // Extract 16-byte authentication tag from end of buffer
  const authTag = encryptedBuffer.subarray(encryptedBuffer.length - 16);
  const ciphertext = encryptedBuffer.subarray(0, encryptedBuffer.length - 16);

  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}
