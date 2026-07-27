import Link from "next/link";
import { notFound } from "next/navigation";
import { buildMetadata } from "lib/seo";
import {
  AdminPageContainer,
  AdminTopBar,
} from "components/chds/admin";
import { Card, Label, Button } from "components/chds";
import { getQuotationById } from "lib/supabase/admin/quotations";
import { requireAdmin } from "lib/auth/guards";
import { QuotationActions } from "./quotation-actions";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}) {
  const p = await props.params;
  return buildMetadata({
    title: `Quotation ${p.id.slice(0, 8)}`,
    path: `/admin/quotations/${p.id}`,
    noIndex: true,
  });
}

export default async function AdminQuotationDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await props.params;
  const quotation = await getQuotationById(id);
  if (!quotation) notFound();

  return (
    <>
      <AdminTopBar
        title={`Quotation ${quotation.quote_number}`}
        description={`Submitted ${new Date(quotation.created_at).toLocaleString("en-NG")}`}
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/quotations">Back to quotations</Link>
          </Button>
        }
      />
      <AdminPageContainer>
        <div className="grid grid-cols-1 gap-[var(--ds-space-4)] lg:grid-cols-3">
          {/* Main info card */}
          <Card variant="dashboard" className="lg:col-span-2">
            <div className="flex items-center justify-between">
              <Label tone="muted">Status</Label>
              <span className="inline-flex items-center rounded-full bg-blue-100 px-[var(--ds-space-2-5)] py-[var(--ds-space-0-5)] text-[length:var(--ds-text-caption)] font-[var(--ds-font-weight-medium)] capitalize text-blue-800">
                {quotation.status}
              </span>
            </div>

            <div className="mt-[var(--ds-space-4)] grid grid-cols-1 gap-[var(--ds-space-3)] sm:grid-cols-2">
              <div>
                <Label tone="muted">Customer</Label>
                <div className="mt-[var(--ds-space-1)] text-[var(--ds-color-fg)]">
                  {quotation.customer_name}
                </div>
                <div className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                  {quotation.customer_email}
                </div>
                {quotation.customer_phone ? (
                  <div className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                    {quotation.customer_phone}
                  </div>
                ) : null}
              </div>

              <div>
                <Label tone="muted">Event details</Label>
                <div className="mt-[var(--ds-space-1)] text-[var(--ds-color-fg)]">
                  {quotation.event_type ?? "Not specified"}
                </div>
                <div className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                  {quotation.guest_count != null
                    ? `${quotation.guest_count} guest${quotation.guest_count === 1 ? "" : "s"}`
                    : "Guest count not provided"}
                </div>
                {quotation.event_date ? (
                  <div className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                    Event date: {quotation.event_date}
                  </div>
                ) : null}
              </div>
            </div>

            {quotation.quoted_amount != null ? (
              <div className="mt-[var(--ds-space-4)]">
                <Label tone="muted">Quoted amount</Label>
                <div className="mt-[var(--ds-space-1)] text-[length:var(--ds-text-h4)] text-[var(--ds-color-fg)]">
                  ₦{Number(quotation.quoted_amount).toLocaleString("en-NG")}
                </div>
              </div>
            ) : null}

            {quotation.notes ? (
              <div className="mt-[var(--ds-space-4)]">
                <Label tone="muted">Customer notes</Label>
                <p className="mt-[var(--ds-space-1)] whitespace-pre-line text-[var(--ds-color-fg)]">
                  {quotation.notes}
                </p>
              </div>
            ) : null}

            {quotation.admin_notes ? (
              <div className="mt-[var(--ds-space-4)]">
                <Label tone="muted">Internal notes</Label>
                <p className="mt-[var(--ds-space-1)] whitespace-pre-line text-[var(--ds-color-fg)]">
                  {quotation.admin_notes}
                </p>
              </div>
            ) : null}

            <div className="mt-[var(--ds-space-4)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
              Last updated: {new Date(quotation.updated_at).toLocaleString("en-NG")}
            </div>
          </Card>

          {/* Actions sidebar */}
          <QuotationActions quotation={quotation} />
        </div>
      </AdminPageContainer>
    </>
  );
}
