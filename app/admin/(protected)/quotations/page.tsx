import Link from "next/link";
import { buildMetadata } from "lib/seo";
import {
  AdminPageContainer,
  AdminTopBar,
} from "components/chds/admin";
import { Button, Field, Select, TextInput, Label } from "components/chds";
import { AdminTable, EmptyTable, FilterRow, BulkActions } from "components/chds/table";
import {
  Pagination,
  type PaginationModel,
} from "components/chds/navigation";
import { listQuotations } from "lib/supabase/admin/quotations";
import { requireAdmin } from "lib/auth/guards";
import { Suspense } from "react";
import { waChatUrl } from "lib/services/whatsapp";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Quotations",
  description: "Customer quotation requests.",
  path: "/admin/quotations",
  noIndex: true,
});

const STATUSES = [
  "all",
  "pending",
  "quoted",
  "accepted",
  "completed",
  "declined",
] as const;

type SearchParams = Promise<{
  status?: string;
  q?: string;
  page?: string;
}>;

const STATUS_PILL_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  quoted: "bg-blue-100 text-blue-800",
  accepted: "bg-green-100 text-green-800",
  completed: "bg-emerald-100 text-emerald-800",
  declined: "bg-red-100 text-red-800",
};

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_PILL_COLORS[status] ?? "bg-gray-100 text-gray-800";
  return (
    <span
      className={`inline-flex items-center rounded-full px-[var(--ds-space-2)] py-[var(--ds-space-0-5)] text-[length:var(--ds-text-caption)] font-[var(--ds-font-weight-medium)] capitalize ${color}`}
    >
      {status}
    </span>
  );
}

export default async function AdminQuotationsPage(props: {
  searchParams: SearchParams;
}) {
  await requireAdmin();
  const sp = await props.searchParams;
  const status = (STATUSES as readonly string[]).includes(sp.status ?? "")
    ? (sp.status as (typeof STATUSES)[number])
    : "all";
  const q = sp.q ?? "";
  const page = Number(sp.page ?? "1") || 1;

  return (
    <>
      <AdminTopBar
        title="Quotations"
        description="Customer quotation requests from the catering form and other channels."
      />
      <AdminPageContainer>
        <FilterRow>
          <form className="flex flex-wrap items-center gap-[var(--ds-space-3)]" method="get">
            <Field label="Search">
              <TextInput
                name="q"
                defaultValue={q}
                placeholder="Name, email, quote #"
              />
            </Field>
            <Field label="Status">
              <Select name="status" defaultValue={status}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s === "all" ? "All statuses" : s.replace(/_/g, " ")}
                  </option>
                ))}
              </Select>
            </Field>
            <input type="hidden" name="page" value="1" />
            <Button type="submit" variant="primary">
              Apply
            </Button>
            <Button asChild variant="ghost">
              <Link href="/admin/quotations">Reset</Link>
            </Button>
          </form>
        </FilterRow>

        <Suspense fallback={<div className="h-96 w-full animate-pulse rounded-[var(--ds-radius-xl)] bg-[var(--ds-color-border)]/40" />}>
          <QuotationsList status={status} q={q} page={page} />
        </Suspense>
      </AdminPageContainer>
    </>
  );
}

async function QuotationsList({
  status,
  q,
  page,
}: {
  status: string;
  q: string;
  page: number;
}) {
  const result = await listQuotations({
    status: status === "all" ? undefined : (status as typeof STATUSES[number]),
    search: q,
    page,
    pageSize: 20,
  });

  if (result.quotations.length === 0) {
    return (
      <EmptyTable
        title="No quotations match these filters."
        description="Try a different search or clear the filters."
      />
    );
  }

  const pagination: PaginationModel = {
    currentPage: result.page,
    totalPages: result.totalPages,
  };

  return (
    <>
      <AdminTable>
        <table className="w-full border-collapse text-left text-[length:var(--ds-text-body)]">
          <thead className="bg-[var(--ds-color-surface-muted)] text-[length:var(--ds-text-label)] uppercase tracking-wide text-[var(--ds-color-muted)]">
            <tr>
              <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]">Quote #</th>
              <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]">Customer</th>
              <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]">Event</th>
              <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]">Status</th>
              <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-right">Amount</th>
              <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {result.quotations.map((q) => (
              <tr key={q.id} className="border-t border-[var(--ds-color-border)]">
                <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]">
                  <Link
                    href={`/admin/quotations/${q.id}`}
                    className="text-[var(--ds-color-fg)] hover:text-[var(--ds-color-accent)]"
                  >
                    {q.quote_number}
                  </Link>
                  <div className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                    {new Date(q.created_at).toLocaleString("en-NG")}
                  </div>
                </td>
                <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]">
                  <div className="text-[var(--ds-color-fg)]">{q.customer_name}</div>
                  <div className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                    {q.customer_email}
                  </div>
                </td>
                <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]">
                  <div className="text-[var(--ds-color-fg)]">
                    {q.event_type ?? "—"}
                  </div>
                  <div className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                    {q.guest_count ? `${q.guest_count} guests` : ""}
                    {q.event_date ? ` · ${q.event_date}` : ""}
                  </div>
                </td>
                <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]">
                  <StatusBadge status={q.status} />
                </td>
                <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-right text-[var(--ds-color-fg)]">
                  {q.quoted_amount != null
                    ? `₦${Number(q.quoted_amount).toLocaleString("en-NG")}`
                    : "—"}
                </td>
                <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-right">
                  <div className="flex items-center justify-end gap-[var(--ds-space-2)]">
                    {q.customer_phone ? (
                      <a
                        href={waChatUrl(
                          q.customer_phone,
                          `Hi ${q.customer_name}, regarding your quotation ${q.quote_number}...`,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`WhatsApp ${q.customer_name}`}
                        className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] px-[var(--ds-space-2)] py-[var(--ds-space-1)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-fg)] transition-colors hover:bg-[var(--ds-color-surface-muted)]"
                      >
                        WA
                      </a>
                    ) : null}
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/quotations/${q.id}`}>View</Link>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTable>
      {pagination.totalPages > 1 ? (
        <div className="flex justify-end">
          <Pagination model={pagination} onPageChange={() => {}} />
        </div>
      ) : null}
    </>
  );
}
