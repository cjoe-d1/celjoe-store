import type { IWhatsAppProvider, WhatsAppProviderConfig } from "./types";

// ------------------------------------------------------------------
// Diagnostic helpers
// ------------------------------------------------------------------

/**
 * Map low-level system error codes to human-readable labels.
 */
function classifyError(err: unknown): string {
  if (!(err instanceof Error)) return "Unknown (not an Error instance)";

  const msg = err.message.toLowerCase();
  const code = (err as NodeJS.ErrnoException).code?.toLowerCase() ?? "";

  if (code === "enotfound" || msg.includes("enotfound") || msg.includes("getaddrinfo")) {
    return "DNS lookup failure (ENOTFOUND) — the hostname could not be resolved";
  }
  if (code === "econnrefused" || msg.includes("econnrefused") || msg.includes("connection refused")) {
    return "Connection refused (ECONNREFUSED) — the server is not accepting connections";
  }
  if (code === "etimedout" || msg.includes("etimedout") || msg.includes("timeout")) {
    return "Connection timed out (ETIMEDOUT)";
  }
  if (code === "econnreset" || msg.includes("econnreset") || msg.includes("connection reset")) {
    return "Connection reset (ECONNRESET)";
  }
  if (
    msg.includes("certificate") ||
    msg.includes("ssl") ||
    msg.includes("tls") ||
    msg.includes("self signed") ||
    msg.includes("unable to verify") ||
    msg.includes("cert_")
  ) {
    return "SSL/TLS certificate error";
  }
  if (msg.includes("socket") || code === "eai_again") {
    return "Socket error";
  }

  return err.name || "Unclassified network error";
}

/**
 * Recursively log an error and its cause chain.
 * Never throws, never suppresses properties.
 */
function logFetchError(err: unknown): void {
  const seen = new Set<unknown>();

  function recurse(e: unknown, depth: number): void {
    if (e == null) return;
    if (seen.has(e)) return;
    seen.add(e);

    const prefix = depth === 0 ? "[Evolution] Fetch error:" : `[Evolution]   cause[${depth}]:`;

    if (e instanceof Error) {
      const code = (e as NodeJS.ErrnoException).code ?? undefined;
      console.error(prefix, {
        name: e.name,
        message: e.message,
        code,
        classification: classifyError(e),
        stack: e.stack,
        cause: e.cause == null ? undefined : "(see below)",
        error: e,
      });

      if (e.cause != null) {
        recurse(e.cause, depth + 1);
      }
    } else {
      console.error(prefix, { type: typeof e, value: e });
    }
  }

  recurse(err, 0);
}

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
    const payload = { number: to, text };

    // ---- DIAGNOSTIC LOG (temporary) ----
    console.log("[Evolution] Instance:", this.config.instance);
    console.log("[Evolution] Request:", {
      method: "POST",
      url,
      headers: {
        "Content-Type": "application/json",
        apikey: this.config.apiKey.slice(0, 4) + "***" + this.config.apiKey.slice(-4),
      },
      payload,
    });
    // ------------------------------------

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: this.config.apiKey,
        },
        body: JSON.stringify(payload),
      });

      const responseBody = await response.text().catch(() => "(empty)");

      // ---- DIAGNOSTIC LOG (temporary) ----
      console.log("[Evolution] Response:", {
        status: response.status,
        statusText: response.statusText,
        body: responseBody,
      });
      // ------------------------------------

      if (!response.ok) {
        return {
          ok: false,
          error: `Evolution API ${response.status}: ${responseBody.slice(0, 200)}`,
        };
      }

      return { ok: true };
    } catch (err) {
      // ---- DIAGNOSTIC LOG (temporary) ----
      logFetchError(err);
      // ------------------------------------
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
