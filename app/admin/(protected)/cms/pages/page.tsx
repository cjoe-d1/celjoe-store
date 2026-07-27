import { buildMetadata } from "lib/seo";
import {
  AdminPageContainer,
  AdminTopBar,
} from "components/chds/admin";
import { Card, Label, Button } from "components/chds";
import Link from "next/link";
import { listCmsPages } from "lib/supabase/admin/cms";
import { PagesManager } from "./manager";
import { requireAdmin } from "lib/auth/guards";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Pages",
  description: "Edit static pages across the site.",
  path: "/admin/cms/pages",
  noIndex: true,
});

export default async function CmsPagesPage() {
  await requireAdmin();
  const pages = await listCmsPages();

  return (
    <>
      <AdminTopBar
        title="Pages"
        description="Create, edit, and publish static pages."
        actions={
          <Button asChild variant="ghost">
            <Link href="/admin/cms">Back to CMS</Link>
          </Button>
        }
      />
      <AdminPageContainer>
        <Card variant="dashboard">
          <Label tone="muted">All pages</Label>
          <div className="mt-[var(--ds-space-4)]">
            <PagesManager initial={pages} />
          </div>
        </Card>
      </AdminPageContainer>
    </>
  );
}
