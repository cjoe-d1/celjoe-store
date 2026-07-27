import { buildMetadata } from "lib/seo";
import {
  AdminPageContainer,
  AdminTopBar,
} from "components/chds/admin";
import { Card, Label, Button } from "components/chds";
import Link from "next/link";
import { listTestimonials } from "lib/supabase/admin/cms";
import { TestimonialsManager } from "./manager";
import { requireAdmin } from "lib/auth/guards";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Testimonials",
  description: "Manage guest testimonials displayed across the site.",
  path: "/admin/cms/testimonials",
  noIndex: true,
});

export default async function CmsTestimonialsPage() {
  await requireAdmin();
  const testimonials = await listTestimonials();

  return (
    <>
      <AdminTopBar
        title="Testimonials"
        description="Curate guest stories shown across the storefront."
        actions={
          <Button asChild variant="ghost">
            <Link href="/admin/cms">Back to CMS</Link>
          </Button>
        }
      />
      <AdminPageContainer>
        <Card variant="dashboard">
          <Label tone="muted">All testimonials</Label>
          <div className="mt-[var(--ds-space-4)]">
            <TestimonialsManager initial={testimonials} />
          </div>
        </Card>
      </AdminPageContainer>
    </>
  );
}
