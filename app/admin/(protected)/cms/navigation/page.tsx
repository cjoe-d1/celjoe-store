import { buildMetadata } from "lib/seo";
import {
  AdminPageContainer,
  AdminTopBar,
} from "components/chds/admin";
import { Card, Label, Button } from "components/chds";
import Link from "next/link";
import { getNavigation } from "lib/supabase/admin/cms";
import { NavigationManager } from "./manager";
import { requireAdmin } from "lib/auth/guards";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Navigation",
  description: "Edit header and footer navigation items.",
  path: "/admin/cms/navigation",
  noIndex: true,
});

export default async function CmsNavigationPage() {
  await requireAdmin();
  const [header, footer] = await Promise.all([
    getNavigation("header"),
    getNavigation("footer"),
  ]);

  return (
    <>
      <AdminTopBar
        title="Navigation"
        description="Reorder, rename, and re-link the menu and footer."
        actions={
          <Button asChild variant="ghost">
            <Link href="/admin/cms">Back to CMS</Link>
          </Button>
        }
      />
      <AdminPageContainer>
        <div className="grid grid-cols-1 gap-[var(--ds-space-4)]">
          <Card variant="dashboard">
            <Label tone="muted">Header navigation</Label>
            <div className="mt-[var(--ds-space-4)]">
              <NavigationManager location="header" initial={header?.items ?? []} />
            </div>
          </Card>
          <Card variant="dashboard">
            <Label tone="muted">Footer navigation</Label>
            <div className="mt-[var(--ds-space-4)]">
              <NavigationManager location="footer" initial={footer?.items ?? []} />
            </div>
          </Card>
        </div>
      </AdminPageContainer>
    </>
  );
}
