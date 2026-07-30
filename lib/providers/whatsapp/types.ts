/**
 * WhatsApp provider abstraction.
 *
 * Orders and Quotations call NotificationService, which
 * delegates to this provider. Swapping the underlying
 * implementation (Hosted Evolution API, Meta Cloud API,
 * or any future provider) requires changing only the
 * implementation behind this interface — no action files
 * are touched.
 */

export interface IWhatsAppProvider {
  /**
   * Send a plain-text WhatsApp message.
   *
   * @returns { ok: false, error } on failure — callers MUST
   *   treat notification failures as non-fatal.
   */
  sendTextMessage(
    to: string,
    text: string,
  ): Promise<{ ok: boolean; error?: string }>;

  /**
   * Send an image via WhatsApp.
   *
   * Reserved for future use (quotation PDFs, receipts, product images).
   * Throws "Not Implemented" in current providers.
   */
  sendImage(
    to: string,
    imageUrl: string,
    caption?: string,
  ): Promise<{ ok: boolean; error?: string }>;

  /**
   * Send a document via WhatsApp.
   *
   * Reserved for future use (invoices, statements).
   * Throws "Not Implemented" in current providers.
   */
  sendDocument(
    to: string,
    documentUrl: string,
    filename?: string,
  ): Promise<{ ok: boolean; error?: string }>;
}

export interface WhatsAppProviderConfig {
  apiUrl: string;
  apiKey: string;
  instance: string;
  /** Business owner's WhatsApp number (with country code, no +). */
  businessNumber: string;
}
