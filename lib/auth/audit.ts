import { supabase } from "lib/supabase/client";
import type { AdminSession, CustomerSession } from "lib/auth/session";

export type AuditEvent = {
  actorId: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  userAgent: string | null;
};

export const logAudit = async (event: AuditEvent): Promise<void> => {
  try {
    await supabase.from("audit_logs").insert({
      actor_id: event.actorId,
      actor_email: event.actorEmail,
      actor_role: event.actorRole,
      action: event.action,
      resource: event.resource,
      resource_id: event.resourceId,
      metadata: event.metadata ?? null,
      ip_address: event.ip,
      user_agent: event.userAgent,
    });
  } catch {
    // Audit logging must never break a request.
  }
};

export const auditFromSession = (
  session: AdminSession | null,
  action: string,
  resource: string,
  resourceId: string | null,
  metadata: Record<string, unknown> | null = null,
  ip: string | null = null,
  userAgent: string | null = null,
): AuditEvent => ({
  actorId: session?.userId ?? null,
  actorEmail: session?.email ?? null,
  actorRole: session ? "admin" : null,
  action,
  resource,
  resourceId,
  metadata,
  ip,
  userAgent,
});

export const auditFromCustomerSession = (
  session: CustomerSession | null,
  action: string,
  resource: string,
  resourceId: string | null,
  metadata: Record<string, unknown> | null = null,
  ip: string | null = null,
  userAgent: string | null = null,
): AuditEvent => ({
  actorId: session?.userId ?? null,
  actorEmail: session?.email ?? null,
  actorRole: session ? "customer" : null,
  action,
  resource,
  resourceId,
  metadata,
  ip,
  userAgent,
});
