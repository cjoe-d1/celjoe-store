import { buildMetadata } from "lib/seo";
import {
  AdminPageContainer,
  AdminTopBar,
} from "components/chds/admin";
import { Card, Label, Button } from "components/chds";
import Link from "next/link";
import { listPromotions } from "lib/supabase/admin/cms";
import { PromotionsManager } from "./manager";
import { requireAdmin } from "lib/auth/guards";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Promotions",
  description: "Run promotional codes and special offers.",
  path: "/admin/cms/promotions",
  noIndex: true,
});

export default async function CmsPromotionsPage() {
  await requireAdmin();
  const promotions = await listPromotions();

  return (
    <>
      <AdminTopBar
        title="Promotions"
        description="Create, schedule, and toggle promotional codes."
        actions={
          <Button asChild variant="ghost">
            <Link href="/admin/cms">Back to CMS</Link>
          </Button>
        }
      />
      <AdminPageContainer>
        <Card variant="dashboard">
          <Label tone="muted">All promotions</Label>
          <div className="mt-[var(--ds-space-4)]">
            <PromotionsManager initial={promotions} />
          </div>
        </Card>
      </AdminPageContainer>
    </>
  );
}
