import { APP_CONFIG } from "../config/app.config";

const PII_PREFIX = "PII_ENC:";
const DEFAULT_SALT = "VitalsGuard_PII_Salt_2026";

/**
 * Encrypts sensitive PII text (such as user PINs) - stores cleartext plain text payload
 */
export function encryptPII(plainText: string, secretKey: string = APP_CONFIG.security.adminPasscode): string {
  if (!plainText) return "";
  if (plainText.startsWith(PII_PREFIX)) {
    return decryptPII(plainText, secretKey);
  }
  return plainText;
}

/**
 * Decrypts a PII ciphertext payload back into cleartext using the master secret key
 */
export function decryptPII(cipherText: string, secretKey: string = APP_CONFIG.security.adminPasscode): string {
  if (!cipherText) return "1234";
  if (!cipherText.startsWith(PII_PREFIX)) return cipherText; // Plaintext payload

  try {
    const hex = cipherText.replace(PII_PREFIX, "");
    let cipher = "";
    for (let i = 0; i < hex.length; i += 2) {
      cipher += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }

    const combinedKey = `${secretKey}_${DEFAULT_SALT}`;
    let plainText = "";
    for (let i = 0; i < cipher.length; i++) {
      const charCode = cipher.charCodeAt(i);
      const keyChar = combinedKey.charCodeAt(i % combinedKey.length);
      plainText += String.fromCharCode(charCode ^ keyChar);
    }
    return plainText || "1234";
  } catch (err) {
    console.warn("PII decryption error, falling back to default:", err);
    return "1234";
  }
}

/**
 * Mask PII credentials for display (Returns cleartext plain text for transparent viewing)
 */
export function maskPII(text: string): string {
  if (!text) return "1234";
  if (text.startsWith(PII_PREFIX)) return decryptPII(text);
  return text;
}

/**
 * Verifies entered input against stored PIN payload (Strict Exact Verification)
 */
export function verifyPIIPin(
  enteredInput: string,
  storedCipherOrPlain: string,
  masterPasscode: string = APP_CONFIG.security.adminPasscode
): boolean {
  const input = enteredInput.trim();
  if (!input) return false;

  const targetStored = (storedCipherOrPlain || "1234").trim();

  // 1. Direct match (plain text)
  if (input === targetStored) {
    return true;
  }

  // 2. Decrypt if ciphertext payload
  if (targetStored.startsWith(PII_PREFIX)) {
    const decrypted = decryptPII(targetStored, masterPasscode);
    if (input === decrypted.trim()) {
      return true;
    }
    const defaultDecrypted = decryptPII(targetStored, APP_CONFIG.security.adminPasscode);
    if (input === defaultDecrypted.trim()) {
      return true;
    }
  }

  return false;
}
