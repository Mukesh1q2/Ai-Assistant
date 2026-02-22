/**
 * Encryption utilities for sensitive data (API keys)
 * Uses AES-256-GCM with per-value random IVs.
 * Falls back to plaintext if ENCRYPTION_KEY is not set.
 */

import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';
import { config } from '../config';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * Derive a 32-byte key from the ENCRYPTION_KEY using SHA-256.
 */
function getKey(): Buffer | null {
    if (!config.ENCRYPTION_KEY) return null;
    return createHash('sha256').update(config.ENCRYPTION_KEY).digest();
}

/**
 * Encrypt a plaintext string.
 * Returns a hex string in the format: iv:encrypted:authTag
 * If no encryption key is configured, returns the plaintext as-is.
 */
export function encrypt(plaintext: string): string {
    const key = getKey();
    if (!key) return plaintext; // No encryption key — store plaintext

    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${encrypted}:${authTag}`;
}

/**
 * Decrypt a previously encrypted string.
 * Expects format: iv:encrypted:authTag (hex-encoded).
 * If the string doesn't look encrypted (no colons), returns it as-is.
 */
export function decrypt(encryptedText: string): string {
    const key = getKey();
    if (!key) return encryptedText; // No encryption key — return as-is

    // If it doesn't look encrypted, return as-is (backward compatibility)
    if (!encryptedText.includes(':')) return encryptedText;

    try {
        const [ivHex, encrypted, authTagHex] = encryptedText.split(':');
        if (!ivHex || !encrypted || !authTagHex) return encryptedText;

        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const decipher = createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch {
        // If decryption fails, the value might be plaintext (migration scenario)
        return encryptedText;
    }
}
