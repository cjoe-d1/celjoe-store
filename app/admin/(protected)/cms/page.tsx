import Link from "next/link";
import { buildMetadata } from "lib/seo";
import { AdminPageContainer, AdminTopBar } from "components/chds/admin";
import { Card, Label } from "components/chds";
import { requireAdmin } from "lib/auth/guards";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "CMS",
  description: "Editorial content management.",
  path: "/admin/cms",
  noIndex: true,
});

const SUB_PAGES = [
  { slug: "testimonials", label: "Testimonials", description: "Guest stories." },
  { slug: "navigation", label: "Navigation", description: "Header and footer." },
  { slug: "promotions", label: "Promotions", description: "Discount codes and offers." },
  { slug: "pages", label: "Pages", description: "Static pages." },
] as const;

export default async function AdminCmsPage() {
  await requireAdmin();

  return (
    <>
      <AdminTopBar
        title="Content & CMS"
        description="Edit content, navigation, testimonials, promotions, and pages."
      />
      <AdminPageContainer>
        <Card variant="dashboard">
          <Label tone="muted">Site content</Label>
          <div className="mt-[var(--ds-space-3)] grid grid-cols-1 gap-[var(--ds-space-3)] md:grid-cols-2">
            {SUB_PAGES.map((s) => (
              <Link
                key={s.slug}
                href={`/admin/cms/${s.slug}`}
                className="block rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] p-[var(--ds-space-4)] transition-colors hover:border-[var(--ds-color-accent)]"
              >
                <div className="text-[length:var(--ds-text-h4)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
                  {s.label}
                </div>
                <div className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                  {s.description}
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </AdminPageContainer>
    </>
  );
}
