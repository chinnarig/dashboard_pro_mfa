import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.MFA_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || 'your-encryption-key-change-this';
const MFA_ISSUER_NAME = process.env.MFA_ISSUER_NAME || 'Dashboard Pro';
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

/**
 * Get encryption key buffer (32 bytes for aes-256)
 */
function getEncryptionKey(): Buffer {
  return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
}

/**
 * Encrypt sensitive data like MFA secrets
 */
export function encryptData(data: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Return IV + encrypted data
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt sensitive data
 */
export function decryptData(encryptedData: string): string {
  if (!encryptedData) return '';
  
  const key = getEncryptionKey();
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Generate a random base32 secret for TOTP
 */
export function generateMfaSecret(): string {
  return speakeasy.generateSecret({
    length: 32,
    name: MFA_ISSUER_NAME,
  }).base32;
}

/**
 * Generate provisioning URI for authenticator apps
 */
export function getTotpUri(secret: string, email: string): string {
  return speakeasy.otpauthURL({
    secret: secret,
    label: email,
    issuer: MFA_ISSUER_NAME,
    encoding: 'base32',
  });
}

/**
 * Generate QR code image and return as base64 data URI
 */
export async function generateQrCode(uri: string): Promise<string> {
  try {
    const qrCode = await QRCode.toDataURL(uri, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    return qrCode;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Verify a TOTP code against the secret
 */
export function verifyTotpCode(secret: string, code: string): boolean {
  try {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: code,
      window: 1, // Allow 1 period (30 seconds) time drift
    });
  } catch (error) {
    console.error('Error verifying TOTP code:', error);
    return false;
  }
}

/**
 * Generate backup codes for MFA
 */
export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    // Format as XXXX-XXXX for readability
    const formattedCode = `${code.slice(0, 4)}-${code.slice(4)}`;
    codes.push(formattedCode);
  }
  return codes;
}

/**
 * Encrypt backup codes for storage
 */
export function encryptBackupCodes(codes: string[]): string {
  const codesJson = JSON.stringify(codes);
  return encryptData(codesJson);
}

/**
 * Decrypt backup codes from storage
 */
export function decryptBackupCodes(encryptedCodes: string): string[] {
  if (!encryptedCodes) return [];
  try {
    const codesJson = decryptData(encryptedCodes);
    return JSON.parse(codesJson);
  } catch (error) {
    console.error('Error decrypting backup codes:', error);
    return [];
  }
}

/**
 * Verify a backup code and remove it from the list
 * Returns: [isValid, updatedEncryptedCodes]
 */
export function verifyBackupCode(
  encryptedCodes: string,
  code: string
): [boolean, string] {
  const codes = decryptBackupCodes(encryptedCodes);
  
  // Normalize the code (remove hyphens and convert to uppercase)
  const normalizedCode = code.replace(/-/g, '').toUpperCase();
  
  const index = codes.findIndex(
    (storedCode) => storedCode.replace(/-/g, '').toUpperCase() === normalizedCode
  );
  
  if (index !== -1) {
    // Remove the used code
    codes.splice(index, 1);
    // Return updated encrypted codes
    return [true, encryptBackupCodes(codes)];
  }
  
  return [false, encryptedCodes];
}

/**
 * Format secret in groups of 4 for easier manual entry
 */
export function formatSecretForManualEntry(secret: string): string {
  return secret.match(/.{1,4}/g)?.join(' ') || secret;
}
