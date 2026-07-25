import { buildMetadata } from "lib/seo";
import { AdminPageContainer, AdminTopBar } from "components/chds/admin";
import { Label, Field, TextInput, Button } from "components/chds";
import { FilterRow } from "components/chds/table";
import { AdminTable, EmptyTable } from "components/chds/table";
import { listAuditLogs } from "lib/supabase/admin/audit";
import { getCurrentSession } from "lib/auth/session";
import { requirePermission } from "lib/auth/guards";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Audit log",
  description: "System activity and security audit trail.",
  path: "/admin/audit",
  noIndex: true,
});

type SearchParams = Promise<{
  actor?: string;
  action?: string;
  resource?: string;
  page?: string;
}>;

export default async function AdminAuditPage(props: { searchParams: SearchParams }) {
  const session = await getCurrentSession();
  if (!session) return null;
  requirePermission(session, "settings:read");
  const sp = await props.searchParams;
  const page = Number(sp.page ?? "1") || 1;
  const result = await listAuditLogs({
    actorEmail: sp.actor,
    action: sp.action,
    resource: sp.resource,
    page,
    pageSize: 25,
  });

  return (
    <>
      <AdminTopBar
        title="Audit log"
        description="Every state-changing action in the operations centre."
      />
      <AdminPageContainer>
        <FilterRow>
          <form className="flex flex-wrap items-end gap-[var(--ds-space-3)]" method="get">
            <Field label="Actor email">
              <TextInput name="actor" defaultValue={sp.actor ?? ""} placeholder="someone@celjoe.store" />
            </Field>
            <Field label="Action">
              <TextInput name="action" defaultValue={sp.action ?? ""} placeholder="order.update" />
            </Field>
            <Field label="Resource">
              <TextInput name="resource" defaultValue={sp.resource ?? ""} placeholder="orders" />
            </Field>
            <Button type="submit">Filter</Button>
          </form>
        </FilterRow>

        {result.entries.length === 0 ? (
          <EmptyTable
            title="No audit events yet"
            description="Events appear here as soon as your team starts using the operations centre."
          />
        ) : (
          <AdminTable>
            <table className="w-full border-collapse text-left text-[length:var(--ds-text-body)]">
              <thead className="bg-[var(--ds-color-surface-muted)] text-[length:var(--ds-text-label)] uppercase tracking-wide text-[var(--ds-color-muted)]">
                <tr>
                  <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]">When</th>
                  <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]">Actor</th>
                  <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]">Action</th>
                  <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]">Resource</th>
                  <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]">IP</th>
                </tr>
              </thead>
              <tbody>
                {result.entries.map((e) => (
                  <tr key={e.id} className="border-t border-[var(--ds-color-border)]">
                    <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-[var(--ds-color-fg)]">
                      {new Date(e.createdAt).toLocaleString("en-NG")}
                    </td>
                    <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-[var(--ds-color-fg)]">
                      <div>{e.actorEmail ?? "system"}</div>
                      <div className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                        {e.actorRole ?? "—"}
                      </div>
                    </td>
                    <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-[var(--ds-color-fg)]">
                      {e.action}
                    </td>
                    <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-[var(--ds-color-muted)]">
                      {e.resource}
                    </td>
                    <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-[var(--ds-color-muted)]">
                      {e.ipAddress ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTable>
        )}
      </AdminPageContainer>
    </>
  );
}
