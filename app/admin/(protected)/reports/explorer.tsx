"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, Field, TextInput } from "components/chds";
import { formatMoney } from "lib/supabase/orders";
import type { AdminOrder } from "lib/supabase/admin/orders";
import type { Product } from "lib/supabase/products";

type Props = {
  from: string;
  to: string;
  orders: AdminOrder[];
  products: Product[];
};

type ReportTab = "revenue" | "orders" | "products" | "customers";

export function ReportsExplorer({ from, to, orders, products }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [tab, setTab] = useState<ReportTab>(
    (params.get("tab") as ReportTab) || "revenue",
  );

  const fromTs = new Date(from).getTime();
  const toTs = new Date(to).getTime() + 24 * 60 * 60 * 1000;

  const filtered = useMemo(
    () =>
      orders.filter((o) => {
        const t = new Date(o.createdAt).getTime();
        return t >= fromTs && t <= toTs;
      }),
    [orders, fromTs, toTs],
  );

  const totalRevenue = filtered.reduce((s, o) => s + Number(o.total ?? 0), 0);
  const completed = filtered.filter((o) => o.orderStatus === "completed");
  const cancelled = filtered.filter((o) => o.orderStatus === "cancelled");
  const pending = filtered.filter((o) => o.orderStatus === "pending");
  const avgOrder = filtered.length > 0 ? totalRevenue / filtered.length : 0;

  const onExport = (format: "csv" | "print") => {
    if (format === "print") {
      window.print();
      return;
    }
    const headers = ["Order", "Status", "Total", "Customer", "Created"];
    const rows = filtered.map((o) => [
      o.orderNumber,
      o.orderStatus,
      String(o.total),
      o.customerName,
      o.createdAt,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `celjoe-report-${from}-to-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-[var(--ds-space-4)]">
      <form
        className="grid grid-cols-1 gap-[var(--ds-space-3)] md:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const f = String(formData.get("from") ?? from);
          const t = String(formData.get("to") ?? to);
          router.push(`/admin/reports?from=${f}&to=${t}&tab=${tab}`);
        }}
      >
        <Field label="From">
          <TextInput name="from" type="date" defaultValue={from} />
        </Field>
        <Field label="To">
          <TextInput name="to" type="date" defaultValue={to} />
        </Field>
        <div className="flex items-end">
          <Button type="submit" variant="primary">
            Apply
          </Button>
        </div>
        <div className="flex items-end gap-[var(--ds-space-2)]">
          <Button variant="outline" onClick={() => onExport("csv")}>
            Export CSV
          </Button>
          <Button variant="ghost" onClick={() => onExport("print")}>
            Print
          </Button>
        </div>
      </form>

      <div className="flex flex-wrap gap-[var(--ds-space-2)]">
        {(["revenue", "orders", "products", "customers"] as const).map((t) => (
          <Button
            key={t}
            variant={tab === t ? "primary" : "ghost"}
            size="sm"
            onClick={() => {
              setTab(t);
              router.replace(`/admin/reports?from=${from}&to=${to}&tab=${t}`);
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </Button>
        ))}
      </div>

      {tab === "revenue" ? (
        <div className="grid grid-cols-1 gap-[var(--ds-space-3)] md:grid-cols-3">
          <Stat label="Total revenue" value={formatMoney(totalRevenue)} />
          <Stat label="Orders" value={String(filtered.length)} />
          <Stat label="Average order" value={formatMoney(avgOrder)} />
          <Stat label="Completed" value={String(completed.length)} />
          <Stat label="Pending" value={String(pending.length)} />
          <Stat label="Cancelled" value={String(cancelled.length)} />
        </div>
      ) : null}

      {tab === "orders" ? (
        <Table
          headers={["Order", "Status", "Total", "Customer", "Date"]}
          rows={filtered.map((o) => [
            o.orderNumber,
            o.orderStatus,
            formatMoney(o.total),
            o.customerName,
            new Date(o.createdAt).toLocaleString("en-NG"),
          ])}
        />
      ) : null}

      {tab === "products" ? (
        <Table
          headers={["Product", "Price"]}
          rows={products.map((p) => [
            p.name,
            formatMoney(Number(p.price?.amount ?? 0)),
          ])}
        />
      ) : null}

      {tab === "customers" ? (
        <Table
          headers={["Customer", "Orders", "Total"]}
          rows={Array.from(
            filtered.reduce((acc, o) => {
              const prev = acc.get(o.customerName) ?? { count: 0, total: 0 };
              acc.set(o.customerName, {
                count: prev.count + 1,
                total: prev.total + Number(o.total ?? 0),
              });
              return acc;
            }, new Map<string, { count: number; total: number }>()),
          ).map(([name, v]) => [name, String(v.count), formatMoney(v.total)])}
        />
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] p-[var(--ds-space-4)]">
      <div className="text-[length:var(--ds-text-caption)] uppercase tracking-wide text-[var(--ds-color-muted)]">
        {label}
      </div>
      <div className="mt-[var(--ds-space-1)] text-[length:var(--ds-text-h3)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
        {value}
      </div>
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[length:var(--ds-text-body)]">
        <thead className="text-[length:var(--ds-text-label)] uppercase tracking-wide text-[var(--ds-color-muted)]">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-[var(--ds-space-3)] py-[var(--ds-space-2)]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={headers.length}
                className="px-[var(--ds-space-3)] py-[var(--ds-space-6)] text-center text-[var(--ds-color-muted)]"
              >
                No data.
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i} className="border-t border-[var(--ds-color-border)] text-[var(--ds-color-fg)]">
                {r.map((c, j) => (
                  <td key={j} className="px-[var(--ds-space-3)] py-[var(--ds-space-2)]">
                    {c}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
