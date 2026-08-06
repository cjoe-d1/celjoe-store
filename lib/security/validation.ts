/**
 * Server-side input validation utilities.
 *
 * Use these to sanitise and validate user-supplied data before
 * passing it to Supabase, Paystack, or any external service.
 *
 * Sanitisation rules:
 *   - Trim whitespace
 *   - Strip control characters
 *   - Enforce length limits
 *   - Validate format (email, phone, etc.)
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?\d{7,15}$/;
const URL_SAFE_RE = /^[a-zA-Z0-9_-]+$/;
const MAX_TEXT_LENGTH = 5000;
const MAX_NAME_LENGTH = 200;

/** Strip characters that could be used for XSS or control injection. */
function sanitiseString(input: string): string {
  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // strip control chars
    .trim();
}

export function validateEmail(input: unknown): string {
  if (typeof input !== "string") throw new Error("Email must be a string.");
  const cleaned = sanitiseString(input).toLowerCase();
  if (!cleaned) throw new Error("Email is required.");
  if (cleaned.length > 254) throw new Error("Email is too long.");
  if (!EMAIL_RE.test(cleaned)) throw new Error("Invalid email format.");
  return cleaned;
}

export function validatePhone(input: unknown): string {
  if (typeof input !== "string") throw new Error("Phone must be a string.");
  const cleaned = sanitiseString(input).replace(/[\s()-]/g, "");
  if (!cleaned) throw new Error("Phone is required.");
  if (!PHONE_RE.test(cleaned)) throw new Error("Invalid phone format.");
  return cleaned;
}

export function validateName(input: unknown): string {
  if (typeof input !== "string") throw new Error("Name must be a string.");
  const cleaned = sanitiseString(input);
  if (!cleaned) throw new Error("Name is required.");
  if (cleaned.length > MAX_NAME_LENGTH) throw new Error("Name is too long.");
  return cleaned;
}

export function validateText(input: unknown): string {
  if (typeof input !== "string") return "";
  const cleaned = sanitiseString(input);
  if (cleaned.length > MAX_TEXT_LENGTH) {
    throw new Error(`Text exceeds ${MAX_TEXT_LENGTH} character limit.`);
  }
  return cleaned;
}

export function validateSlug(input: unknown): string {
  if (typeof input !== "string") throw new Error("Slug must be a string.");
  const cleaned = sanitiseString(input).toLowerCase();
  if (!cleaned) throw new Error("Slug is required.");
  if (!URL_SAFE_RE.test(cleaned)) {
    throw new Error("Slug contains invalid characters.");
  }
  if (cleaned.length > 200) throw new Error("Slug is too long.");
  return cleaned;
}

export function validatePositiveNumber(input: unknown): number {
  const n = Number(input);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error("Must be a positive number.");
  }
  return n;
}

export function validatePaymentReference(input: unknown): string {
  if (typeof input !== "string") throw new Error("Reference must be a string.");
  const cleaned = sanitiseString(input);
  if (!cleaned) throw new Error("Payment reference is required.");
  if (cleaned.length > 100) throw new Error("Reference is too long.");
  // Allow alphanumeric, dash, underscore (CELJOE-xxx-xxx format)
  if (!/^[a-zA-Z0-9_-]+$/.test(cleaned)) {
    throw new Error("Invalid payment reference format.");
  }
  return cleaned;
}
