import Link from "next/link";
import { buildMetadata } from "lib/seo";
import { AdminPageContainer, AdminTopBar } from "components/chds/admin";
import { Card, Label, Button } from "components/chds";
import { getCurrentSession } from "lib/auth/session";
import { requirePermission } from "lib/auth/guards";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Content",
  description: "Manage homepage, marketing, and editorial content.",
  path: "/admin/cms",
  noIndex: true,
});

const SECTIONS = [
  { title: "Homepage", href: "/admin/cms/homepage", description: "Hero, sections, ordering, and visibility." },
  { title: "Kitchen", href: "/admin/cms/kitchen", description: "Editorial dining copy and curation." },
  { title: "Smokehouse", href: "/admin/cms/smokehouse", description: "BBQ storytelling, photography, and weekend specials." },
  { title: "Catering", href: "/admin/cms/catering", description: "Packages, event categories, and copy." },
  { title: "Our Story", href: "/admin/cms/our-story", description: "Story, philosophy, timeline." },
  { title: "Testimonials", href: "/admin/cms/testimonials", description: "Guest stories across the site." },
  { title: "Pages", href: "/admin/cms/pages", description: "Custom CMS pages and routing." },
  { title: "Navigation", href: "/admin/cms/navigation", description: "Top navigation and footer ordering." },
  { title: "Promotions", href: "/admin/cms/promotions", description: "Active announcements and promos." },
];

export default async function AdminCmsIndexPage() {
  const session = await getCurrentSession();
  if (!session) return null;
  requirePermission(session, "cms:read");

  return (
    <>
      <AdminTopBar
        title="Content"
        description="Every customer-facing surface is editable from here."
        actions={
          <Button asChild variant="primary">
            <Link href="/admin/cms/homepage">Edit homepage</Link>
          </Button>
        }
      />
      <AdminPageContainer>
        <div className="grid grid-cols-1 gap-[var(--ds-space-4)] sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((s) => (
            <Card key={s.href} variant="cms" className="flex flex-col gap-[var(--ds-space-3)]">
              <Label tone="muted">{s.title}</Label>
              <p className="text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]">
                {s.description}
              </p>
              <div className="mt-auto">
                <Button asChild variant="outline" size="sm">
                  <Link href={s.href}>Open</Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </AdminPageContainer>
    </>
  );
}
