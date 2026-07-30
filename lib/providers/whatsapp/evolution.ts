import type { IWhatsAppProvider, WhatsAppProviderConfig } from "./types";

/**
 * Hosted Evolution API provider.
 *
 * Communicates with a self-hosted Evolution API instance via
 * HTTP. No SDKs required.
 *
 * Text endpoint:
 *   POST {apiUrl}/message/sendText/{instance}
 *
 * sendImage / sendDocument throw "Not Implemented" —
 * these will be added when the business needs quotation
 * PDFs, receipts, and invoices.
 */
export class EvolutionWhatsAppProvider implements IWhatsAppProvider {
  constructor(private readonly config: WhatsAppProviderConfig) {}

  // ------------------------------------------------------------------
  // sendTextMessage — implemented
  // ------------------------------------------------------------------

  async sendTextMessage(
    to: string,
    text: string,
  ): Promise<{ ok: boolean; error?: string }> {
    const url = `${this.config.apiUrl}/message/sendText/${this.config.instance}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: this.config.apiKey,
        },
        body: JSON.stringify({ number: to, text }),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        return {
          ok: false,
          error: `Evolution API ${response.status}: ${body.slice(0, 200)}`,
        };
      }

      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Evolution API unreachable",
      };
    }
  }

  // ------------------------------------------------------------------
  // sendImage — not yet implemented
  // ------------------------------------------------------------------

  async sendImage(
    _to: string,
    _imageUrl: string,
    _caption?: string,
  ): Promise<{ ok: boolean; error?: string }> {
    throw new Error(
      "Evolution API: sendImage is not yet implemented. " +
        "This will be added when quotation PDFs, receipts, or product images are needed.",
    );
  }

  // ------------------------------------------------------------------
  // sendDocument — not yet implemented
  // ------------------------------------------------------------------

  async sendDocument(
    _to: string,
    _documentUrl: string,
    _filename?: string,
  ): Promise<{ ok: boolean; error?: string }> {
    throw new Error(
      "Evolution API: sendDocument is not yet implemented. " +
        "This will be added when invoice or statement delivery is needed.",
    );
  }
}
