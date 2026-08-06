/**
 * WhatsApp provider abstraction — INACTIVE (Phase G redesign)
 *
 * This module is preserved for future server-side WhatsApp
 * integration (Meta Cloud API, Evolution API, Twilio, etc.).
 * Currently no provider is active.
 *
 * When a server-side provider is needed:
 *   1. Create a new implementation of IWhatsAppProvider
 *      (e.g., providers/whatsapp/meta.ts)
 *   2. Wire it into lib/services/whatsapp.ts
 *   3. Restore the notify() helper with retry logic
 *
 * Current Phase G architecture:
 *   - Customer → wa.me link (no server-side WhatsApp)
 *   - Admin ← Push Notifications (lib/push/send.ts)
 */

export { EvolutionWhatsAppProvider } from "./evolution";
export { resolveWhatsAppProvider } from "./resolve";
export type { IWhatsAppProvider, WhatsAppProviderConfig } from "./types";
