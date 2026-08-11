import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatMoney, mapOrderRow, mapOrderItemRow, type OrderLine } from "lib/supabase/orders";
import { db } from "lib/supabase/admin";
import { siteConfig } from "lib/site-config";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ trackingToken: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { trackingToken } = await params;
  return {
    title: `Receipt`,
    description: `Order receipt from CELJOE Grills & Juicebar.`,
    robots: { index: false },
  };
}

export default async function ReceiptPage({ params }: PageProps) {
  const { trackingToken } = await params;

  if (!trackingToken) notFound();

  const { data: orderData, error } = await db
    .from("orders")
    .select("*, payments(reference, amount, channel, status)")
    .eq("tracking_token", trackingToken)
    .maybeSingle();

  if (error || !orderData) notFound();

  const { data: itemData } = await db
    .from("order_items")
    .select("*")
    .eq("order_id", orderData.id)
    .order("created_at", { ascending: true });

  const items: OrderLine[] = (itemData ?? []).map((it: unknown) =>
    mapOrderItemRow(it as unknown as Record<string, unknown> as Parameters<typeof mapOrderItemRow>[0]),
  );

  const order = mapOrderRow(orderData as unknown as Record<string, unknown> as Parameters<typeof mapOrderRow>[0], items);
  const raw = orderData as Record<string, unknown>;
  const payments = (raw.payments as Array<Record<string, unknown>> | null) ?? [];
  const paymentRef = payments.length > 0 ? (payments[0]?.reference as string) ?? null : null;

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Receipt — {order.orderNumber}</title>
        <link rel="stylesheet" href="/assets/tailwind.css" />
      </head>
      <body className="bg-white text-gray-900 font-sans print:bg-white">
        <ReceiptDocument
          order={order}
          items={items}
          raw={raw}
          paymentRef={paymentRef}
        />
      </body>
    </html>
  );
}

function ReceiptDocument({
  order,
  items,
  raw,
  paymentRef,
}: {
  order: ReturnType<typeof mapOrderRow>;
  items: OrderLine[];
  raw: Record<string, unknown>;
  paymentRef: string | null;
}) {
  return (
    <div className="max-w-[420px] mx-auto px-6 py-10 print:px-4 print:py-4">
      {/* Header */}
      <div className="text-center border-b border-gray-200 pb-4 mb-5 print:border-gray-300">
        <h1 className="text-xl font-bold tracking-tight">CELJOE Grills &amp; Juicebar</h1>
        <p className="text-sm text-gray-500 mt-1">Lagos, Nigeria</p>
        <p className="text-sm text-gray-500">{siteConfig.contact.phone}</p>
      </div>

      {/* Order info */}
      <div className="mb-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Order Receipt</h2>
        <div className="mt-2 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">Order</span>
            <span className="font-medium">{order.orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Date</span>
            <span>{new Date(order.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</span>
          </div>
        </div>
      </div>

      {/* Customer info */}
      <div className="mb-5 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Customer</span>
          <span className="font-medium">{order.customerName}</span>
        </div>
        {order.customerEmail ? (
          <div className="flex justify-between mt-1">
            <span className="text-gray-500">Email</span>
            <span>{order.customerEmail}</span>
          </div>
        ) : null}
        {order.customerPhone ? (
          <div className="flex justify-between mt-1">
            <span className="text-gray-500">Phone</span>
            <span>{order.customerPhone}</span>
          </div>
        ) : null}
      </div>

      {/* Delivery address */}
      {raw.delivery_method ? (
        <div className="mb-5 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Delivery</span>
            <span className="capitalize">
              {raw.delivery_method === "pickup" ? "Store pickup" : "Standard delivery"}
            </span>
          </div>
          {raw.address_line1 ? (
            <div className="mt-1 text-right text-gray-600">
              {raw.address_line1 as string}
              {raw.city ? `, ${raw.city}` : ""}
              {raw.state ? `, ${raw.state}` : ""}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Items */}
      <div className="border-t border-gray-200 pt-4 mb-4 print:border-gray-300">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm py-2 border-b border-gray-100 print:border-gray-200">
            <div className="flex-1 min-w-0">
              <span className="font-medium">{item.productName}</span>
              {item.variantName ? <span className="text-gray-500"> &mdash; {item.variantName}</span> : null}
              <span className="text-gray-400 ml-2">&times;{item.quantity}</span>
            </div>
            <div className="text-right shrink-0 ml-4">
              <div>{formatMoney(item.lineTotal)}</div>
              <div className="text-xs text-gray-400">{formatMoney(item.unitPrice)} each</div>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="text-sm space-y-1 mb-5">
        <div className="flex justify-between">
          <span className="text-gray-500">Subtotal</span>
          <span>{formatMoney(order.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Delivery fee</span>
          <span>{formatMoney(order.deliveryFee)}</span>
        </div>
        <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-base print:border-gray-300">
          <span>Total</span>
          <span>{formatMoney(order.total)}</span>
        </div>
      </div>

      {/* Payment info */}
      <div className="text-sm space-y-1 mb-5">
        <div className="flex justify-between">
          <span className="text-gray-500">Payment status</span>
          <span className="capitalize font-medium">{order.paymentStatus}</span>
        </div>
        {paymentRef ? (
          <div className="flex justify-between">
            <span className="text-gray-500">Reference</span>
            <span className="text-xs font-mono">{paymentRef}</span>
          </div>
        ) : null}
      </div>

      {/* Print button — hidden when printing */}
      <div className="mb-5 text-center print:hidden">
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          Print receipt
        </button>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 pt-4 text-center text-xs text-gray-400 print:border-gray-300">
        <p>Thank you for choosing CELJOE Grills &amp; Juicebar.</p>
        <p className="mt-1">This is a computer-generated receipt.</p>
      </div>
    </div>
  );
}
