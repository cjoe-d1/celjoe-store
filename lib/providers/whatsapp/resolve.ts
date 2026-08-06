import { EvolutionWhatsAppProvider } from "./evolution";
import type { IWhatsAppProvider } from "./types";

/**
 * Resolve the active WhatsApp provider from environment variables.
 *
 * This is the single factory responsible for choosing which
 * provider implementation to use. UI code (app/layout.tsx,
 * components) never touches this — only the NotificationService
 * calls it.
 *
 * To swap providers, change only the constructor and import below.
 *
 * Supported providers:
 *   - Hosted Evolution API
 *   - Meta WhatsApp Cloud API (future)
 *   - Any provider implementing IWhatsAppProvider
 */

// Common placeholder values that indicate the .env.local was
// never configured properly.
const PLACEHOLDERS = new Set([
  "your-api-key",
  "your-api-url",
  "your-instance",
  "your-evolution-url",
  "your-evolution-api-key",
  "change-me",
  "placeholder",
]);

let _validated = false;
let _resolved: IWhatsAppProvider | null | undefined;

/**
 * Validate Evolution API environment variables on first access.
 *
 * Throws a descriptive error if any required variable is missing
 * or contains a placeholder value. This prevents silent failures
 * and hours of debugging caused by misconfigured .env files.
 */
function validateEnvVars(): void {
  if (_validated) return;
  _validated = true;

  const required: Array<[string, string | undefined]> = [
    ["EVOLUTION_API_URL", process.env.EVOLUTION_API_URL],
    ["EVOLUTION_API_KEY", process.env.EVOLUTION_API_KEY],
    ["EVOLUTION_INSTANCE", process.env.EVOLUTION_INSTANCE],
    ["BUSINESS_WHATSAPP_NUMBER", process.env.BUSINESS_WHATSAPP_NUMBER],
  ];

  const missing: string[] = [];
  const placeholder: string[] = [];

  for (const [name, value] of required) {
    if (!value || value.trim().length === 0) {
      missing.push(name);
      continue;
    }
    const trimmed = value.trim().toLowerCase();
    if (PLACEHOLDERS.has(trimmed)) {
      placeholder.push(`${name}=${value}`);
    }
  }

  const errors: string[] = [];

  if (missing.length > 0) {
    errors.push(
      `Missing environment variables: ${missing.join(", ")}. ` +
        "Add them to .env.local before starting the application.",
    );
  }

  if (placeholder.length > 0) {
    errors.push(
      `Placeholder values detected: ${placeholder.join(", ")}. ` +
        "Replace with real values in .env.local.",
    );
  }

  if (errors.length > 0) {
    throw new Error(
      `[WhatsApp] Evolution API configuration error:\n${errors.join("\n")}`,
    );
  }
}

export function resolveWhatsAppProvider(): IWhatsAppProvider | null {
  // Cache the resolution; env vars don't change at runtime.
  if (_resolved !== undefined) return _resolved;

  const enabled = process.env.WHATSAPP_ENABLED === "true";
  if (!enabled) {
    console.log("[WhatsApp] WHATSAPP_ENABLED is not true — notifications will be logged only.");
    _resolved = null;
    return null;
  }

  validateEnvVars();

  const apiUrl = process.env.EVOLUTION_API_URL!;
  const apiKey = process.env.EVOLUTION_API_KEY!;
  const instance = process.env.EVOLUTION_INSTANCE!;
  const businessNumber = process.env.BUSINESS_WHATSAPP_NUMBER!;

  _resolved = new EvolutionWhatsAppProvider({
    apiUrl,
    apiKey,
    instance,
    businessNumber,
  });
  console.log("[WhatsApp] Evolution API provider registered.");
  return _resolved;
}
