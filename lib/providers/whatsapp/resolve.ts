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

let _resolved: IWhatsAppProvider | null | undefined;

export function resolveWhatsAppProvider(): IWhatsAppProvider | null {
  // Cache the resolution; env vars don't change at runtime.
  if (_resolved !== undefined) return _resolved;

  const enabled = process.env.WHATSAPP_ENABLED === "true";
  if (!enabled) {
    console.log("[WhatsApp] WHATSAPP_ENABLED is not true — notifications will be logged only.");
    _resolved = null;
    return null;
  }

  const apiUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;
  const instance = process.env.EVOLUTION_INSTANCE;
  const businessNumber = process.env.BUSINESS_WHATSAPP_NUMBER;

  if (apiUrl && apiKey && instance && businessNumber) {
    _resolved = new EvolutionWhatsAppProvider({
      apiUrl,
      apiKey,
      instance,
      businessNumber,
    });
    console.log("[WhatsApp] Evolution API provider registered.");
    return _resolved;
  }

  console.log(
    "[WhatsApp] Evolution API credentials incomplete — notifications will be logged only.",
  );
  _resolved = null;
  return null;
}
