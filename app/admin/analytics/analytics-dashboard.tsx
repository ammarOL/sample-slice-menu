"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMemo, useState } from "react";
import { PrimarySidebar } from "../admin-sidebar";
import { useMenu } from "../../menu-context/menu-context";
import { useOrders } from "../../orders-context/orders-context";
import type { OrderStatus, PlacedOrder } from "../../orders-context/orders-context";

type TrendPoint = {
  date: string;
  label: string;
  orders: number;
  revenue: number;
};

type ItemPerformance = {
  name: string;
  units: number;
  revenue: number;
};

type CategoryPerformance = {
  category: string;
  revenue: number;
};

type StatusPerformance = {
  name: string;
  value: number;
};

type Analytics = {
  revenue: number;
  orderCount: number;
  averageOrderValue: number;
  itemsSold: number;
  topItems: ItemPerformance[];
  categories: CategoryPerformance[];
  statuses: StatusPerformance[];
  trend: TrendPoint[];
  bestItem: ItemPerformance | null;
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  new: "New",
  preparing: "Preparing",
  ready: "Ready",
  "out-for-delivery": "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_COLORS = ["#b45309", "#57534e", "#0f766e", "#2563eb", "#15803d", "#b91c1c"];
const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function dayKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getRecentDateRange() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - 6);
  const end = new Date(today);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function isInRange(order: PlacedOrder, start: Date, end: Date) {
  const submittedAt = new Date(order.submittedAt);
  return submittedAt >= start && submittedAt < end;
}

function calculateAnalytics(
  orders: PlacedOrder[],
  menuItems: ReturnType<typeof useMenu>["menuItems"],
): Analytics {
  const { start, end } = getRecentDateRange();
  const recentOrders = orders.filter((order) => isInRange(order, start, end));
  const businessOrders = recentOrders.filter((order) => order.status !== "cancelled");
  const menuById = new Map(menuItems.map((item) => [item.id, item]));
  const itemMap = new Map<string, ItemPerformance>();
  const categoryMap = new Map<string, number>();

  let itemsSold = 0;
  for (const order of businessOrders) {
    for (const item of order.items) {
      const customizationTotal = item.customizations.reduce(
        (sum, customization) => sum + customization.price,
        0,
      );
      const itemRevenue = (item.price + customizationTotal) * item.quantity;
      const existingItem = itemMap.get(item.menuItemId) ?? {
        name: item.name,
        units: 0,
        revenue: 0,
      };
      existingItem.units += item.quantity;
      existingItem.revenue += itemRevenue;
      itemMap.set(item.menuItemId, existingItem);

      const category = menuById.get(item.menuItemId)?.category ?? "Other";
      categoryMap.set(category, (categoryMap.get(category) ?? 0) + itemRevenue);
      itemsSold += item.quantity;
    }
  }

  const trend: TrendPoint[] = [];
  for (let offset = 0; offset < 7; offset += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + offset);
    const key = dayKey(date);
    const dayOrders = businessOrders.filter((order) => dayKey(new Date(order.submittedAt)) === key);
    trend.push({
      date: key,
      label: date.toLocaleDateString("en-IN", { weekday: "short" }),
      orders: dayOrders.length,
      revenue: dayOrders.reduce((sum, order) => sum + order.total, 0),
    });
  }

  const statuses = (Object.keys(STATUS_LABELS) as OrderStatus[])
    .map((status) => ({
      name: STATUS_LABELS[status],
      value: recentOrders.filter((order) => order.status === status).length,
    }))
    .filter((status) => status.value > 0);
  const topItems = [...itemMap.values()].sort((a, b) => b.units - a.units || b.revenue - a.revenue);
  const categories = [...categoryMap.entries()]
    .map(([category, revenue]) => ({ category, revenue }))
    .sort((a, b) => b.revenue - a.revenue);
  const revenue = businessOrders.reduce((sum, order) => sum + order.total, 0);

  return {
    revenue,
    orderCount: businessOrders.length,
    averageOrderValue: businessOrders.length ? revenue / businessOrders.length : 0,
    itemsSold,
    topItems,
    categories,
    statuses,
    trend,
    bestItem: topItems[0] ?? null,
  };
}

function ChartFrame({ children, height = 280 }: { children: React.ReactNode; height?: number }) {
  return <div style={{ height }} className="w-full">{children}</div>;
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-md bg-stone-50 px-6 text-center text-sm text-stone-600">
      {message}
    </div>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="rounded-lg border border-stone-200 bg-white p-4 sm:p-5">
      <p className="text-sm text-stone-600">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-stone-950">{value}</p>
      <p className="mt-1 text-xs text-stone-500">{detail}</p>
    </article>
  );
}

export default function AnalyticsDashboard() {
  const { menuItems, hydrated: menuHydrated } = useMenu();
  const { orders, hydrated: ordersHydrated } = useOrders();
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const analytics = useMemo(
    () => calculateAnalytics(orders, menuItems),
    [menuItems, orders],
  );
  const hasOrders = analytics.statuses.length > 0;

  return (
    <main className="min-h-screen bg-stone-100 font-inter text-stone-950">
      <header className="flex items-center justify-between border-b border-stone-200 bg-white px-4 py-4 lg:hidden">
        <div>
          <p className="font-garamond text-2xl">Cafe Sonder</p>
          <p className="text-xs text-stone-600">Analytics</p>
        </div>
        <button
          type="button"
          onClick={() => setMobileNavigationOpen(true)}
          className="cursor-pointer rounded-md border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-800"
        >
          Menu
        </button>
      </header>

      <div className="mx-auto min-h-screen max-w-[1600px] lg:grid lg:grid-cols-[190px_minmax(0,1fr)]">
        <div className="hidden lg:block">
          <PrimarySidebar activePage="analytics" />
        </div>
        <section className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-stone-600">Admin dashboard</p>
              <h1 className="mt-1 font-garamond text-4xl font-medium">Analytics</h1>
              <p className="mt-2 text-sm text-stone-600">Last 7 days · cancelled orders excluded from business metrics</p>
            </div>
            {ordersHydrated && <p className="text-sm text-stone-600">{orders.length} total stored orders</p>}
          </div>

          {!menuHydrated || !ordersHydrated ? (
            <p className="text-sm text-stone-600">Loading analytics...</p>
          ) : !hasOrders ? (
            <div className="rounded-lg border border-dashed border-stone-300 bg-white px-6 py-14 text-center">
              <h2 className="font-garamond text-2xl font-medium">Your analytics will appear here</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-600">
                Place a few orders to see revenue, popular items, category performance, and order trends.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Net revenue" value={formatCurrency(analytics.revenue)} detail="Non-cancelled orders" />
                <MetricCard label="Orders" value={String(analytics.orderCount)} detail="Non-cancelled orders" />
                <MetricCard label="Average order value" value={formatCurrency(analytics.averageOrderValue)} detail="Per non-cancelled order" />
                <MetricCard label="Items sold" value={String(analytics.itemsSold)} detail="Including repeated quantities" />
              </div>

              <section className="rounded-lg border border-stone-200 bg-white p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-stone-600">Best performer</p>
                    <h2 className="mt-1 font-garamond text-3xl font-medium">{analytics.bestItem?.name ?? "No item data"}</h2>
                  </div>
                  {analytics.bestItem && (
                    <div className="text-right text-sm text-stone-600">
                      <p>{analytics.bestItem.units} units sold</p>
                      <p className="mt-1 font-semibold text-stone-950">{formatCurrency(analytics.bestItem.revenue)} revenue</p>
                    </div>
                  )}
                </div>
              </section>

              <div className="grid gap-6 xl:grid-cols-2">
                <ChartPanel title="Revenue and orders" subtitle="Daily activity across the last 7 days">
                  <ChartFrame>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics.trend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke="#e7e5e4" strokeDasharray="3 3" />
                        <XAxis dataKey="label" tick={{ fill: "#78716c", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="revenue" tick={{ fill: "#78716c", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value}`} />
                        <YAxis yAxisId="orders" orientation="right" allowDecimals={false} tick={{ fill: "#78716c", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(value, name) => [name === "Revenue" ? formatCurrency(Number(value)) : value, name]} />
                        <Legend />
                        <Line yAxisId="revenue" type="monotone" dataKey="revenue" name="Revenue" stroke="#0f766e" strokeWidth={2.5} dot={{ r: 3 }} />
                        <Line yAxisId="orders" type="monotone" dataKey="orders" name="Orders" stroke="#b45309" strokeWidth={2.5} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartFrame>
                </ChartPanel>

                <ChartPanel title="Top-selling items" subtitle="Ranked by units sold">
                  {analytics.topItems.length ? (
                    <ChartFrame>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.topItems.slice(0, 6)} layout="vertical" margin={{ top: 4, right: 12, left: 20, bottom: 0 }}>
                          <CartesianGrid stroke="#e7e5e4" strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" allowDecimals={false} tick={{ fill: "#78716c", fontSize: 12 }} axisLine={false} tickLine={false} />
                          <YAxis type="category" dataKey="name" width={100} tick={{ fill: "#57534e", fontSize: 12 }} axisLine={false} tickLine={false} />
                          <Tooltip formatter={(value) => [`${value} units`, "Sold"]} />
                          <Bar dataKey="units" fill="#0f766e" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartFrame>
                  ) : <EmptyChart message="No item sales in this period." />}
                </ChartPanel>

                <ChartPanel title="Revenue by category" subtitle="Add-ons included in item revenue">
                  {analytics.categories.length ? (
                    <ChartFrame>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.categories} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                          <CartesianGrid stroke="#e7e5e4" strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="category" tick={{ fill: "#78716c", fontSize: 12 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: "#78716c", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value}`} />
                          <Tooltip formatter={(value) => [formatCurrency(Number(value)), "Revenue"]} />
                          <Bar dataKey="revenue" fill="#b45309" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartFrame>
                  ) : <EmptyChart message="No category sales in this period." />}
                </ChartPanel>

                <ChartPanel title="Order status" subtitle="All orders received in the period">
                  {analytics.statuses.length ? (
                    <ChartFrame>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={analytics.statuses} dataKey="value" nameKey="name" cx="50%" cy="48%" innerRadius={65} outerRadius={95} paddingAngle={3}>
                            {analytics.statuses.map((status, index) => <Cell key={status.name} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartFrame>
                  ) : <EmptyChart message="No order status data in this period." />}
                </ChartPanel>
              </div>
            </div>
          )}
        </section>
      </div>

      {mobileNavigationOpen && (
        <div className="fixed inset-0 z-40 bg-stone-950/40 lg:hidden" onClick={() => setMobileNavigationOpen(false)}>
          <div className="h-full w-72" onClick={(event) => event.stopPropagation()}>
            <PrimarySidebar activePage="analytics" onNavigate={() => setMobileNavigationOpen(false)} />
          </div>
        </div>
      )}
    </main>
  );
}

function ChartPanel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 sm:p-6">
      <header className="mb-4">
        <h2 className="font-garamond text-2xl font-medium">{title}</h2>
        <p className="mt-1 text-sm text-stone-600">{subtitle}</p>
      </header>
      {children}
    </section>
  );
}
