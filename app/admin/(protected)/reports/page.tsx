import { buildMetadata } from "lib/seo";
import { AdminPageContainer, AdminTopBar } from "components/chds/admin";
import { Card, Label, Button } from "components/chds";
import { getCurrentSession } from "lib/auth/session";
import { requirePermission } from "lib/auth/guards";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Reports",
  description: "Operational and financial reports.",
  path: "/admin/reports",
  noIndex: true,
});

const REPORTS = [
  { title: "Revenue", description: "Daily, weekly, monthly revenue with category split." },
  { title: "Orders", description: "Order volume by status, channel, and time window." },
  { title: "Products", description: "Best sellers, slow movers, and stock turnover." },
  { title: "Kitchen", description: "Preparation times, queue depth, and delays." },
  { title: "Inventory", description: "Stock health, waste, and purchase history." },
  { title: "Customers", description: "Acquisition, retention, and lifetime value." },
  { title: "Deliveries", description: "Rider performance, ETA accuracy, and on-time rate." },
];

export default async function AdminReportsPage() {
  const session = await getCurrentSession();
  if (!session) return null;
  requirePermission(session, "orders:read");

  return (
    <>
      <AdminTopBar
        title="Reports"
        description="Operational and financial insights. Connect exports when ready."
        actions={
          <Button variant="outline" disabled>
            Schedule report
          </Button>
        }
      />
      <AdminPageContainer>
        <div className="grid grid-cols-1 gap-[var(--ds-space-4)] sm:grid-cols-2 lg:grid-cols-3">
          {REPORTS.map((r) => (
            <Card key={r.title} variant="dashboard" className="flex flex-col gap-[var(--ds-space-2)]">
              <Label tone="muted">{r.title}</Label>
              <p className="text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]">
                {r.description}
              </p>
              <div className="mt-auto flex gap-[var(--ds-space-2)]">
                <Button variant="outline" size="sm" disabled>
                  Preview
                </Button>
                <Button variant="ghost" size="sm" disabled>
                  Export CSV
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </AdminPageContainer>
    </>
  );
}
