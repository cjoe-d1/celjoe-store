import { listAdminOrders, type AdminOrder } from "lib/supabase/admin/orders";
import { listAdminCustomers, type AdminCustomer } from "lib/supabase/admin/customers";
import { listIngredients, listSuppliers } from "lib/supabase/admin/catalog";
import { formatMoney } from "lib/supabase/orders";

export type DashboardKpi = {
  label: string;
  value: string;
  hint?: string;
  tone: "neutral" | "success" | "warning" | "danger";
};

export type DashboardAlert = {
  id: string;
  title: string;
  description: string;
  tone: "info" | "warning" | "danger";
  href: string;
};

export type OperationsDashboard = {
  kpis: DashboardKpi[];
  alerts: DashboardAlert[];
  recentOrders: AdminOrder[];
  customers: AdminCustomer[];
  lowStock: number;
};

const sumTotals = (orders: AdminOrder[]): number =>
  orders.reduce((acc, o) => acc + Number(o.total ?? 0), 0);

export async function getOperationsDashboard(): Promise<OperationsDashboard> {
  const [live, today, customersResult, ingredients] = await Promise.all([
    listAdminOrders({ status: "all", pageSize: 8 }),
    listAdminOrders({
      status: "all",
      pageSize: 50,
      dateFrom: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
    }),
    listAdminCustomers(),
    listIngredients(),
  ]);

  const customers = customersResult.customers;

  const inKitchen = live.orders.filter((o) =>
    ["preparing", "confirmed"].includes(o.orderStatus),
  ).length;
  const ready = live.orders.filter((o) => o.orderStatus === "ready").length;

  const todayRevenue = sumTotals(today.orders);
  const lowStock = ingredients.filter(
    (i) => Number(i.stock) <= Number(i.lowStockThreshold),
  ).length;

  const kpis: DashboardKpi[] = [
    {
      label: "Today's revenue",
      value: formatMoney(todayRevenue),
      hint: `${today.orders.length} order${today.orders.length === 1 ? "" : "s"}`,
      tone: "success",
    },
    {
      label: "Live orders",
      value: String(live.total),
      hint: `${inKitchen} in kitchen · ${ready} ready`,
      tone: "neutral",
    },
    {
      label: "Customers",
      value: String(customers.length),
      hint: `${customers.filter((c) => c.loyaltyTier !== "guest").length} active members`,
      tone: "neutral",
    },
    {
      label: "Low stock items",
      value: String(lowStock),
      hint: lowStock > 0 ? "Action required" : "All ingredients healthy",
      tone: lowStock > 0 ? "warning" : "success",
    },
  ];

  const alerts: DashboardAlert[] = [];
  if (lowStock > 0) {
    alerts.push({
      id: "low-stock",
      title: `${lowStock} ingredient${lowStock === 1 ? "" : "s"} below threshold`,
      description: "Review the inventory module and reorder.",
      tone: "warning",
      href: "/admin/inventory",
    });
  }
  if (ready > 0) {
    alerts.push({
      id: "ready-pickup",
      title: `${ready} order${ready === 1 ? "" : "s"} ready for pickup`,
      description: "Hand off to the customer.",
      tone: "info",
      href: "/admin/orders?status=ready",
    });
  }

  return {
    kpis,
    alerts,
    recentOrders: live.orders,
    customers: customers.slice(0, 6),
    lowStock,
  };
}

void listSuppliers;
