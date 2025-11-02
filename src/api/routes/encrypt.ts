// src/api/routes/encrypt.ts
import { encrypt, decrypt } from "../../crypto";
import {
  EncryptRequest,
  DecryptRequest,
  EncryptResponse,
  DecryptResponse,
  ApiError,
  ApiErrorCode,
} from "../types";

/**
 * Handle encryption and decryption requests
 */
export async function handleEncryptRequest(
  body: EncryptRequest | DecryptRequest,
  operation: "encrypt" | "decrypt"
): Promise<EncryptResponse | DecryptResponse> {
  if (operation === "encrypt") {
    return await handleEncrypt(body as EncryptRequest);
  } else {
    return await handleDecrypt(body as DecryptRequest);
  }
}

/**
 * Handle encryption request
 */
async function handleEncrypt(body: EncryptRequest): Promise<EncryptResponse> {
  // Validate request
  if (!body.text || typeof body.text !== "string") {
    throw new ApiError(
      ApiErrorCode.INVALID_REQUEST,
      "Text is required and must be a string",
      400
    );
  }

  if (body.text.length > 1000000) {
    throw new ApiError(
      ApiErrorCode.INVALID_REQUEST,
      "Text too large (max 1MB)",
      400
    );
  }

  // Use provided password or generate a default one
  const password = body.password || "default-api-password";

  if (!password || password.length < 8) {
    throw new ApiError(
      ApiErrorCode.INVALID_REQUEST,
      "Password must be at least 8 characters",
      400
    );
  }

  try {
    const ciphertext = await encrypt(body.text, password);

    return {
      ciphertext,
      algorithm: "AES-GCM",
    };
  } catch (error) {
    throw new ApiError(
      ApiErrorCode.ENCRYPTION_FAILED,
      `Encryption failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      500
    );
  }
}

/**
 * Handle decryption request
 */
async function handleDecrypt(body: DecryptRequest): Promise<DecryptResponse> {
  // Validate request
  if (!body.ciphertext || typeof body.ciphertext !== "string") {
    throw new ApiError(
      ApiErrorCode.INVALID_REQUEST,
      "Ciphertext is required and must be a string",
      400
    );
  }

  if (!body.password || typeof body.password !== "string") {
    throw new ApiError(
      ApiErrorCode.INVALID_REQUEST,
      "Password is required",
      400
    );
  }

  if (body.password.length < 8) {
    throw new ApiError(
      ApiErrorCode.INVALID_REQUEST,
      "Password must be at least 8 characters",
      400
    );
  }

  try {
    const plaintext = await decrypt(body.ciphertext, body.password);

    return {
      plaintext,
    };
  } catch (error) {
    throw new ApiError(
      ApiErrorCode.DECRYPTION_FAILED,
      `Decryption failed: ${error instanceof Error ? error.message : "Invalid password or corrupted data"}`,
      400
    );
  }
}
