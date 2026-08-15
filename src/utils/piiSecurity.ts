import { APP_CONFIG } from "../config/app.config";

const PII_PREFIX = "PII_ENC:";
const DEFAULT_SALT = "VitalsGuard_PII_Salt_2026";

/**
 * Encrypts sensitive PII text (such as user PINs) into a salted ciphertext payload
 */
export function encryptPII(plainText: string, secretKey: string = APP_CONFIG.security.adminPasscode): string {
  if (!plainText) return "";
  if (plainText.startsWith(PII_PREFIX)) return plainText; // Already encrypted

  const combinedKey = `${secretKey}_${DEFAULT_SALT}`;
  let cipher = "";
  for (let i = 0; i < plainText.length; i++) {
    const charCode = plainText.charCodeAt(i);
    const keyChar = combinedKey.charCodeAt(i % combinedKey.length);
    cipher += String.fromCharCode(charCode ^ keyChar);
  }
  
  // Encode to safe hex representation
  const hex = Array.from(cipher).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
  return `${PII_PREFIX}${hex}`;
}

/**
 * Decrypts a PII ciphertext payload back into cleartext using the master secret key
 */
export function decryptPII(cipherText: string, secretKey: string = APP_CONFIG.security.adminPasscode): string {
  if (!cipherText) return "1234";
  if (!cipherText.startsWith(PII_PREFIX)) return cipherText; // Plaintext legacy payload

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
 * Mask PII credentials for display
 */
export function maskPII(text: string): string {
  if (!text) return "••••";
  return "••••";
}

/**
 * Verifies entered input against stored PII PIN payload
 */
export function verifyPIIPin(
  enteredInput: string,
  storedCipherOrPlain: string,
  masterPasscode: string = APP_CONFIG.security.adminPasscode
): boolean {
  const input = enteredInput.trim();
  if (!input) return false;

  const customAdminPin = localStorage.getItem("vitalsguard_admin_pin");

  // 1. If stored PIN is empty/null/undefined or "1234", and input is "1234", it is valid
  if ((!storedCipherOrPlain || storedCipherOrPlain === "1234") && input === "1234") {
    return true;
  }

  // 2. Direct cleartext match
  if (input === storedCipherOrPlain) {
    return true;
  }

  // 3. Decrypt stored payload with passed masterPasscode
  const actualPin = decryptPII(storedCipherOrPlain, masterPasscode);
  if (input === actualPin) {
    return true;
  }

  // 4. Decrypt with default APP_CONFIG passcode fallback
  if (masterPasscode !== APP_CONFIG.security.adminPasscode) {
    const defaultKeyPin = decryptPII(storedCipherOrPlain, APP_CONFIG.security.adminPasscode);
    if (input === defaultKeyPin) {
      return true;
    }
  }

  // 5. Decrypt with custom admin passcode from localStorage
  if (customAdminPin && customAdminPin !== masterPasscode && customAdminPin !== APP_CONFIG.security.adminPasscode) {
    const customKeyPin = decryptPII(storedCipherOrPlain, customAdminPin);
    if (input === customKeyPin) {
      return true;
    }
  }

  // 6. Robust check for reset/default PIN "1234"
  if (input === "1234") {
    const isEncrypted1234 =
      storedCipherOrPlain === "1234" ||
      storedCipherOrPlain === encryptPII("1234", APP_CONFIG.security.adminPasscode) ||
      storedCipherOrPlain === encryptPII("1234", masterPasscode) ||
      (customAdminPin ? storedCipherOrPlain === encryptPII("1234", customAdminPin) : false);
    if (isEncrypted1234) {
      return true;
    }
  }

  // 7. Master Admin Passcode override (Admin can use active Master Passcode to verify any profile PIN)
  if (
    (masterPasscode && input === masterPasscode) ||
    (customAdminPin && input === customAdminPin)
  ) {
    return true;
  }

  return false;
}
