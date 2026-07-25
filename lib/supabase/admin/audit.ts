import { supabase } from "lib/supabase/client";

const isMissingTable = (code: string | undefined): boolean =>
  code === "PGRST205" || code === "42P01" || code === "PGRST116";

export type AuditLogEntry = {
  id: string;
  createdAt: string;
  actorId: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
};

export type AuditLogFilters = {
  actorEmail?: string;
  action?: string;
  resource?: string;
  page?: number;
  pageSize?: number;
};

export type PaginatedAuditLogs = {
  entries: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function listAuditLogs(
  filters: AuditLogFilters = {},
): Promise<PaginatedAuditLogs> {
  const {
    actorEmail,
    action,
    resource,
    page = 1,
    pageSize = 25,
  } = filters;
  const fromRow = (page - 1) * pageSize;
  const toRow = fromRow + pageSize - 1;

  try {
    let query = supabase
      .from("audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(fromRow, toRow);

    if (actorEmail) query = query.ilike("actor_email", `%${actorEmail}%`);
    if (action) query = query.ilike("action", `%${action}%`);
    if (resource) query = query.eq("resource", resource);

    const { data, error, count } = await query;
    if (error) {
      if (isMissingTable(error.code))
        return { entries: [], total: 0, page, pageSize, totalPages: 0 };
      throw error;
    }

    const entries: AuditLogEntry[] = (data ?? []).map((d: Record<string, unknown>) => ({
      id: String(d.id),
      createdAt: String(d.created_at ?? new Date().toISOString()),
      actorId: (d.actor_id as string | null) ?? null,
      actorEmail: (d.actor_email as string | null) ?? null,
      actorRole: (d.actor_role as string | null) ?? null,
      action: String(d.action ?? ""),
      resource: String(d.resource ?? ""),
      resourceId: (d.resource_id as string | null) ?? null,
      metadata: (d.metadata as Record<string, unknown> | null) ?? null,
      ipAddress: (d.ip_address as string | null) ?? null,
    }));

    return {
      entries,
      total: count ?? entries.length,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil((count ?? entries.length) / pageSize)),
    };
  } catch {
    return { entries: [], total: 0, page, pageSize, totalPages: 0 };
  }
}
