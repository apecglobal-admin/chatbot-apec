import "server-only"

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    throw new Error(
      "Thiếu biến môi trường ENCRYPTION_KEY. Tạo bằng: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    )
  }
  return Buffer.from(key, "hex")
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns a base64 string: iv + authTag + ciphertext
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return ""

  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()

  // [iv (12)] + [authTag (16)] + [ciphertext]
  const combined = Buffer.concat([iv, authTag, encrypted])
  return combined.toString("base64")
}

/**
 * Decrypt a base64 string previously encrypted with `encrypt()`.
 * Returns the original plaintext.
 */
export function decrypt(encryptedBase64: string): string {
  if (!encryptedBase64) return ""

  const key = getEncryptionKey()
  const combined = Buffer.from(encryptedBase64, "base64")

  const iv = combined.subarray(0, IV_LENGTH)
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()])

  return decrypted.toString("utf8")
}
