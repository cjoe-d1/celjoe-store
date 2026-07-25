import { buildMetadata } from "lib/seo";
import { AdminPageContainer, AdminTopBar, StatusPill } from "components/chds/admin";
import { Label, Button, Card } from "components/chds";
import { AdminTable, EmptyTable } from "components/chds/table";
import { listRiders } from "lib/supabase/admin/people";
import { getCurrentSession } from "lib/auth/session";
import { requirePermission } from "lib/auth/guards";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Riders",
  description: "Delivery team.",
  path: "/admin/riders",
  noIndex: true,
});

export default async function AdminRidersPage() {
  const session = await getCurrentSession();
  if (!session) return null;
  requirePermission(session, "orders:read");
  const riders = await listRiders();

  return (
    <>
      <AdminTopBar
        title="Riders"
        description="Active delivery team, status, and performance."
        actions={
          <Button variant="primary" disabled>
            Add rider
          </Button>
        }
      />
      <AdminPageContainer>
        {riders.length === 0 ? (
          <EmptyTable
            title="No riders yet"
            description="Once the riders table is provisioned, your team will appear here."
          />
        ) : (
          <AdminTable>
            <table className="w-full border-collapse text-left text-[length:var(--ds-text-body)]">
              <thead className="bg-[var(--ds-color-surface-muted)] text-[length:var(--ds-text-label)] uppercase tracking-wide text-[var(--ds-color-muted)]">
                <tr>
                  <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]">Rider</th>
                  <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]">Phone</th>
                  <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]">Vehicle</th>
                  <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]">Status</th>
                  <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-right">Deliveries</th>
                </tr>
              </thead>
              <tbody>
                {riders.map((r) => (
                  <tr key={r.id} className="border-t border-[var(--ds-color-border)]">
                    <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-[var(--ds-color-fg)]">
                      {r.fullName}
                    </td>
                    <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-[var(--ds-color-muted)]">
                      {r.phone}
                    </td>
                    <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-[var(--ds-color-fg)]">
                      {r.vehicleType}
                    </td>
                    <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-right text-[var(--ds-color-fg)]">
                      {r.deliveriesCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTable>
        )}

        <Card variant="dashboard">
          <Label tone="muted">Maps & live tracking</Label>
          <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
            Map provider foundation is in place. Connect your provider credentials in
            the integrations settings to enable live tracking.
          </p>
        </Card>
      </AdminPageContainer>
    </>
  );
}
