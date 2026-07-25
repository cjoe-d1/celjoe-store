import { buildMetadata } from "lib/seo";
import { AdminPageContainer, AdminTopBar } from "components/chds/admin";
import { Label, Button, Card } from "components/chds";
import { AdminTable, EmptyTable } from "components/chds/table";
import { listStaff } from "lib/supabase/admin/people";
import { getCurrentSession } from "lib/auth/session";
import { requirePermission } from "lib/auth/guards";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Staff",
  description: "Celjoe team directory.",
  path: "/admin/staff",
  noIndex: true,
});

export default async function AdminStaffPage() {
  const session = await getCurrentSession();
  if (!session) return null;
  requirePermission(session, "users:read");
  const staff = await listStaff();

  return (
    <>
      <AdminTopBar
        title="Staff"
        description="Team directory, departments, and roles."
        actions={
          <Button variant="primary" disabled>
            Invite team member
          </Button>
        }
      />
      <AdminPageContainer>
        {staff.length === 0 ? (
          <EmptyTable
            title="No staff members yet"
            description="Invite your first team member from the operations settings panel."
          />
        ) : (
          <AdminTable>
            <table className="w-full border-collapse text-left text-[length:var(--ds-text-body)]">
              <thead className="bg-[var(--ds-color-surface-muted)] text-[length:var(--ds-text-label)] uppercase tracking-wide text-[var(--ds-color-muted)]">
                <tr>
                  <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]">Member</th>
                  <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]">Email</th>
                  <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]">Role</th>
                  <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]">Department</th>
                  <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]">Active</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s.id} className="border-t border-[var(--ds-color-border)]">
                    <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-[var(--ds-color-fg)]">
                      {s.fullName}
                    </td>
                    <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-[var(--ds-color-muted)]">
                      {s.email}
                    </td>
                    <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-[var(--ds-color-fg)]">
                      {s.role}
                    </td>
                    <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-[var(--ds-color-fg)]">
                      {s.department}
                    </td>
                    <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-[var(--ds-color-fg)]">
                      {s.active ? "Active" : "Disabled"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTable>
        )}

        <Card variant="dashboard">
          <Label tone="muted">Schedules</Label>
          <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
            Shift planning foundation is in place. Connect your scheduling provider
            to enable shifts, swaps, and time-off in this panel.
          </p>
        </Card>
      </AdminPageContainer>
    </>
  );
}
