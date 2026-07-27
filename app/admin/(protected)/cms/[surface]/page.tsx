import { buildMetadata } from "lib/seo";
import {
  AdminPageContainer,
  AdminTopBar,
} from "components/chds/admin";
import { Card, Label, Button } from "components/chds";
import Link from "next/link";
import { getCmsSurface, getCmsVersions } from "lib/supabase/admin/cms";
import { CmsEditor } from "../editor";
import { isCmsSurface } from "lib/supabase/admin/cms";
import { notFound } from "next/navigation";
import { requireAdmin } from "lib/auth/guards";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: { params: Promise<{ surface: string }> }) {
  const p = await props.params;
  return buildMetadata({
    title: `Edit ${p.surface}`,
    path: `/admin/cms/${p.surface}`,
    noIndex: true,
  });
}

export default async function CmsSurfacePage(props: {
  params: Promise<{ surface: string }>;
}) {
  await requireAdmin();

  const { surface } = await props.params;
  if (!isCmsSurface(surface)) notFound();

  const [data, versions] = await Promise.all([
    getCmsSurface(surface),
    getCmsVersions(surface),
  ]);

  return (
    <>
      <AdminTopBar
        title={`Edit ${surface}`}
        description="Live edit, save drafts, publish, schedule, and restore previous versions."
        actions={
          <Button asChild variant="ghost">
            <Link href="/admin/cms">Back to CMS</Link>
          </Button>
        }
      />
      <AdminPageContainer>
        <Card variant="dashboard">
          <Label tone="muted">Editor</Label>
          <div className="mt-[var(--ds-space-4)]">
            <CmsEditor
              surface={surface}
              initial={{
                title: data?.title ?? "",
                subtitle: data?.subtitle ?? "",
                body: data?.body ?? "",
                heroImageUrl: data?.heroImageUrl ?? "",
                visibility: data?.visibility ?? "draft",
                scheduledFor: data?.scheduledFor ?? "",
                seoTitle: data?.seoTitle ?? "",
                seoDescription: data?.seoDescription ?? "",
              }}
              versions={versions}
            />
          </div>
        </Card>
      </AdminPageContainer>
    </>
  );
}
