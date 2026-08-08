"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Field, TextInput, Label } from "components/chds";
import { formatCurrency } from "lib/format-currency";
import {
  fetchAnalytics,
  fetchTimeBoundMetrics,
  type ReportsAnalytics,
  type TimeBoundMetrics,
  type BestSeller,
} from "lib/supabase/admin/analytics";

// ---------------------------------------------------------------------------
// Inline types — avoid transitive imports from lib/supabase/admin/orders
// and lib/supabase/products (those pull lib/supabase/client → Proxy → error).
// ---------------------------------------------------------------------------

type AdminOrder = {
  id: string;
  orderNumber: string;
  orderStatus: string;
  total: number;
  customerName: string;
  customerEmail: string | null;
  createdAt: string;
};

type Product = {
  name: string;
  price?: { amount?: number | string | null } | null;
};

const formatMoney = (n: number | null | undefined): string =>
  formatCurrency(n);

// ---------------------------------------------------------------------------
// Date helpers — localised dates → UTC range
// ---------------------------------------------------------------------------

function todayRange(): { from: string; to: string } {
  const start = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  return {
    from: start.toISOString(),
    to: new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString(),
  };
}

function yesterdayRange(): { from: string; to: string } {
  const start = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  const y = new Date(start.getTime() - 24 * 60 * 60 * 1000);
  return {
    from: y.toISOString(),
    to: new Date(y.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString(),
  };
}

function last7DaysRange(): { from: string; to: string } {
  const start = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  return {
    from: new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    to: new Date().toISOString(),
  };
}

function last30DaysRange(): { from: string; to: string } {
  const start = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  return {
    from: new Date(start.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    to: new Date().toISOString(),
  };
}

function toDateInput(iso: string): string {
  return iso.slice(0, 10);
}

type Preset = "today" | "yesterday" | "7days" | "30days" | "custom";

type ReportTab = "revenue" | "orders" | "products" | "customers";

type Props = {
  initialFrom: string;
  initialTo: string;
  initialOrders: AdminOrder[];
  products: Product[];
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReportsExplorer({
  initialFrom,
  initialTo,
  initialOrders,
  products,
}: Props) {
  const router = useRouter();
  const params = useSearchParams();

  // ---- State ---------------------------------------------------------
  const [tab, setTab] = useState<ReportTab>(
    (params.get("tab") as ReportTab) || "revenue",
  );
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [activePreset, setActivePreset] = useState<Preset>("30days");
  const [analytics, setAnalytics] = useState<ReportsAnalytics>({
    orders: initialOrders,
    totalRevenue: 0,
    totalOrders: 0,
    aov: 0,
    pending: 0,
    confirmed: 0,
    preparing: 0,
    ready: 0,
    completed: 0,
    cancelled: 0,
    bestSellers: [],
    returningCustomers: 0,
  });
  const [timeBound, setTimeBound] = useState<TimeBoundMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  // ---- Derived -------------------------------------------------------
  const a = analytics;
  const tbm = timeBound;

  // ---- Data fetching -------------------------------------------------
  const loadData = useCallback(
    async (dateFrom: string, dateTo: string) => {
      setLoading(true);
      const [aData, tbData] = await Promise.all([
        fetchAnalytics(dateFrom, dateTo),
        fetchTimeBoundMetrics(),
      ]);
      setAnalytics(aData);
      setTimeBound(tbData);
      setLoading(false);
    },
    [],
  );

  // Initial load
  useEffect(() => {
    loadData(initialFrom, initialTo);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Preset handler ------------------------------------------------
  function applyPreset(preset: Preset) {
    setActivePreset(preset);
    let range: { from: string; to: string };
    switch (preset) {
      case "today":
        range = todayRange();
        break;
      case "yesterday":
        range = yesterdayRange();
        break;
      case "7days":
        range = last7DaysRange();
        break;
      case "30days":
      default:
        range = last30DaysRange();
        break;
    }
    setFrom(toDateInput(range.from));
    setTo(toDateInput(range.to));
    router.replace(
      `/admin/reports?from=${toDateInput(range.from)}&to=${toDateInput(range.to)}&tab=${tab}`,
    );
    loadData(range.from, range.to);
  }

  function applyCustom() {
    setActivePreset("custom");
    const dateFrom = new Date(
      new Date(from).getFullYear(),
      new Date(from).getMonth(),
      new Date(from).getDate(),
    ).toISOString();
    const dateTo = new Date(
      new Date(to).getFullYear(),
      new Date(to).getMonth(),
      new Date(to).getDate(),
      23,
      59,
      59,
      999,
    ).toISOString();
    router.replace(`/admin/reports?from=${from}&to=${to}&tab=${tab}`);
    loadData(dateFrom, dateTo);
  }

  // ---- CSV Export ----------------------------------------------------
  const onExportCSV = useCallback(() => {
    const headers = [
      "Metric",
      "Value",
    ];
    const rows: string[][] = [
      ["Period", `${from} to ${to}`],
      ["Total Revenue", formatMoney(a.totalRevenue)],
      ["Total Orders", String(a.totalOrders)],
      ["Average Order Value (AOV)", formatMoney(a.aov)],
      ["Pending Orders", String(a.pending)],
      ["Confirmed Orders", String(a.confirmed)],
      ["Preparing Orders", String(a.preparing)],
      ["Ready Orders", String(a.ready)],
      ["Completed Orders", String(a.completed)],
      ["Cancelled Orders", String(a.cancelled)],
      ["Returning Customers", String(a.returningCustomers)],
      ...(tbm
        ? [
            ["Today Revenue", formatMoney(tbm.todayRevenue)],
            ["Yesterday Revenue", formatMoney(tbm.yesterdayRevenue)],
            ["Last 7 Days Revenue", formatMoney(tbm.weeklyRevenue)],
            ["Last 30 Days Revenue", formatMoney(tbm.monthlyRevenue)],
            ["Today Orders", String(tbm.todayOrders)],
            ["Yesterday Orders", String(tbm.yesterdayOrders)],
            ["Last 7 Days Orders", String(tbm.weeklyOrders)],
            ["Last 30 Days Orders", String(tbm.monthlyOrders)],
          ]
        : []),
      ["", ""],
      ["Best Sellers", ""],
      ...a.bestSellers.map((bs: BestSeller) => [bs.productName, String(bs.count)]),
    ];

    const csv = [headers, ...rows]
      .map((r) =>
        r
          .map((c) => `"${String(c).replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `celjoe-report-${from}-to-${to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [a, tbm, from, to]);

  // ---- Render --------------------------------------------------------
  const presets: { key: Preset; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "yesterday", label: "Yesterday" },
    { key: "7days", label: "Last 7 Days" },
    { key: "30days", label: "Last 30 Days" },
  ];

  return (
    <div className="flex flex-col gap-[var(--ds-space-4)]">
      {/* Quick presets */}
      <div className="flex flex-wrap items-center gap-[var(--ds-space-2)]">
        <span className="text-[length:var(--ds-text-label)] uppercase tracking-wide text-[var(--ds-color-muted)]">
          Quick range:
        </span>
        {presets.map((p) => (
          <Button
            key={p.key}
            variant={activePreset === p.key ? "primary" : "outline"}
            size="sm"
            onClick={() => applyPreset(p.key)}
            disabled={loading}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {/* Date filter form */}
      <form
        className="grid grid-cols-1 gap-[var(--ds-space-3)] md:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          applyCustom();
        }}
      >
        <Field label="From">
          <TextInput
            name="from"
            type="date"
            value={from}
            onChange={(ev) => {
              setFrom(ev.target.value);
              setActivePreset("custom");
            }}
          />
        </Field>
        <Field label="To">
          <TextInput
            name="to"
            type="date"
            value={to}
            onChange={(ev) => {
              setTo(ev.target.value);
              setActivePreset("custom");
            }}
          />
        </Field>
        <div className="flex items-end">
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Loading…" : "Apply"}
          </Button>
        </div>
        <div className="flex items-end gap-[var(--ds-space-2)]">
          <Button variant="outline" onClick={onExportCSV} disabled={loading}>
            Export CSV
          </Button>
          <Button
            variant="ghost"
            onClick={() => window.print()}
            disabled={loading}
          >
            Print
          </Button>
        </div>
      </form>

      {/* Tab switcher */}
      <div className="flex flex-wrap gap-[var(--ds-space-2)]">
        {(["revenue", "orders", "products", "customers"] as const).map((t) => (
          <Button
            key={t}
            variant={tab === t ? "primary" : "ghost"}
            size="sm"
            onClick={() => {
              setTab(t);
              router.replace(
                `/admin/reports?from=${from}&to=${to}&tab=${t}`,
              );
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </Button>
        ))}
      </div>

      {/* Loading indicator */}
      {loading ? (
        <div className="text-center text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)] py-[var(--ds-space-8)]">
          Loading report data…
        </div>
      ) : (
        <>
          {/* Revenue tab — Phase J: all financial & volume KPI cards */}
          {tab === "revenue" ? (
            <>
              {/* Time-bound KPI row */}
              {tbm ? (
                <div className="grid grid-cols-2 gap-[var(--ds-space-3)] md:grid-cols-4">
                  <Stat
                    label="Today"
                    value={formatMoney(tbm.todayRevenue)}
                    hint={`${tbm.todayOrders} order${tbm.todayOrders === 1 ? "" : "s"}`}
                  />
                  <Stat
                    label="Yesterday"
                    value={formatMoney(tbm.yesterdayRevenue)}
                    hint={`${tbm.yesterdayOrders} order${tbm.yesterdayOrders === 1 ? "" : "s"}`}
                  />
                  <Stat
                    label="Last 7 Days"
                    value={formatMoney(tbm.weeklyRevenue)}
                    hint={`${tbm.weeklyOrders} order${tbm.weeklyOrders === 1 ? "" : "s"}`}
                  />
                  <Stat
                    label="Last 30 Days"
                    value={formatMoney(tbm.monthlyRevenue)}
                    hint={`${tbm.monthlyOrders} order${tbm.monthlyOrders === 1 ? "" : "s"}`}
                  />
                </div>
              ) : null}

              {/* Financials, volume & order breakdown */}
              <div className="grid grid-cols-1 gap-[var(--ds-space-3)] md:grid-cols-3">
                <Stat label="Total revenue" value={formatMoney(a.totalRevenue)} />
                <Stat label="Orders" value={String(a.totalOrders)} />
                <Stat label="Average order (AOV)" value={formatMoney(a.aov)} />
                <Stat label="Pending" value={String(a.pending)} />
                <Stat label="Confirmed" value={String(a.confirmed)} />
                <Stat label="Preparing" value={String(a.preparing)} />
                <Stat
                  label="Completed"
                  value={String(a.completed)}
                />
                <Stat label="Ready" value={String(a.ready)} />
                <Stat label="Cancelled" value={String(a.cancelled)} />
                <Stat
                  label="Returning customers"
                  value={String(a.returningCustomers)}
                />
              </div>
            </>
          ) : null}

          {/* Orders tab */}
          {tab === "orders" ? (
            <Table
              headers={["Order", "Status", "Total", "Customer", "Date"]}
              rows={a.orders.map((o: AdminOrder) => [
                o.orderNumber,
                o.orderStatus,
                formatMoney(o.total),
                o.customerName,
                new Date(o.createdAt).toLocaleString("en-NG"),
              ])}
            />
          ) : null}

          {/* Products tab — includes Best Sellers */}
          {tab === "products" ? (
            <div className="flex flex-col gap-[var(--ds-space-4)]">
              {a.bestSellers.length > 0 ? (
                <div>
                  <Label tone="muted">Best sellers</Label>
                  <div className="mt-[var(--ds-space-2)]">
                    <Table
                      headers={["Product", "Units sold"]}
                      rows={a.bestSellers.map((bs: BestSeller) => [
                        bs.productName,
                        String(bs.count),
                      ])}
                    />
                  </div>
                </div>
              ) : null}
              <div>
                <Label tone="muted">All products</Label>
                <div className="mt-[var(--ds-space-2)]">
                  <Table
                    headers={["Product", "Price"]}
                    rows={products.map((p: Product) => [
                      p.name,
                      formatMoney(Number(p.price?.amount ?? 0)),
                    ])}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {/* Customers tab — includes Returning Customers */}
          {tab === "customers" ? (
            <div className="flex flex-col gap-[var(--ds-space-4)]">
              <Stat
                label="Returning customers (period)"
                value={String(a.returningCustomers)}
              />
              <Table
                headers={["Customer", "Orders", "Total"]}
                rows={Array.from(
                  a.orders.reduce(
                    (acc, o) => {
                      const prev = acc.get(o.customerName) ?? {
                        count: 0,
                        total: 0,
                      };
                      acc.set(o.customerName, {
                        count: prev.count + 1,
                        total: prev.total + Number(o.total ?? 0),
                      });
                      return acc;
                    },
                    new Map<
                      string,
                      { count: number; total: number }
                    >(),
                  ),
                ).map(([name, v]) => [
                  name,
                  String(v.count),
                  formatMoney(v.total),
                ])}
              />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Display helpers (unchanged visual design)
// ---------------------------------------------------------------------------

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] p-[var(--ds-space-4)]">
      <div className="text-[length:var(--ds-text-caption)] uppercase tracking-wide text-[var(--ds-color-muted)]">
        {label}
      </div>
      <div className="mt-[var(--ds-space-1)] text-[length:var(--ds-text-h3)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
        {value}
      </div>
      {hint ? (
        <div className="mt-[var(--ds-space-1)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
          {hint}
        </div>
      ) : null}
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
              <th
                key={h}
                className="px-[var(--ds-space-3)] py-[var(--ds-space-2)]"
              >
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
              <tr
                key={i}
                className="border-t border-[var(--ds-color-border)] text-[var(--ds-color-fg)]"
              >
                {r.map((c, j) => (
                  <td
                    key={j}
                    className="px-[var(--ds-space-3)] py-[var(--ds-space-2)]"
                  >
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
