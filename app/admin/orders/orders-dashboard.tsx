"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PrimarySidebar } from "../admin-sidebar";
import { useOrders } from "../../orders-context/orders-context";
import type { OrderStatus, PlacedOrder } from "../../orders-context/orders-context";

type MobilePanel = "navigation" | null;

const statusOptions: { value: OrderStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "preparing", label: "Preparing" },
  { value: "ready", label: "Ready" },
  { value: "out-for-delivery", label: "Out for delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const pastStatuses = new Set<OrderStatus>(["delivered", "cancelled"]);

function statusLabel(status: OrderStatus) {
  return statusOptions.find((option) => option.value === status)?.label ?? status;
}

function formatSubmittedAt(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusTone(status: OrderStatus) {
  if (status === "delivered") return "bg-emerald-50 text-emerald-800";
  if (status === "cancelled") return "bg-red-50 text-red-800";
  if (status === "new") return "bg-amber-50 text-amber-800";
  return "bg-stone-100 text-stone-700";
}

function OrderCard({
  order,
  onStatusChange,
}: {
  order: PlacedOrder;
  onStatusChange: (status: OrderStatus) => void;
}) {
  return (
    <article className="rounded-lg border border-stone-200 bg-white p-4 sm:p-5">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-200 pb-4">
        <div>
          <p className="font-semibold text-stone-950">Order {order.orderNumber}</p>
          <p className="mt-1 text-sm text-stone-600">
            {formatSubmittedAt(order.submittedAt)}
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone(order.status)}`}>
            {statusLabel(order.status)}
          </span>
          <span className="sr-only">Change order status</span>
          <select
            value={order.status}
            onChange={(event) => onStatusChange(event.target.value as OrderStatus)}
            className="cursor-pointer rounded-md border border-stone-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-stone-700 focus:ring-2 focus:ring-stone-400 focus:ring-offset-1"
            aria-label={`Change status for order ${order.orderNumber}`}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </header>

      <div className="divide-y divide-stone-100">
        {order.items.map((item) => {
          const customizationTotal = item.customizations.reduce(
            (sum, customization) => sum + customization.price,
            0,
          );

          return (
            <div key={item.id} className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="font-semibold text-stone-950">
                  {item.quantity} × {item.name}
                </p>
                {item.customizations.length > 0 && (
                  <p className="mt-1 text-sm text-stone-600">
                    {item.customizations
                      .map((customization) => `${customization.name} (+₹${customization.price})`)
                      .join(", ")}
                  </p>
                )}
              </div>
              <p className="shrink-0 text-sm font-semibold tabular-nums text-stone-800">
                ₹{(item.price + customizationTotal) * item.quantity}
              </p>
            </div>
          );
        })}
      </div>

      <footer className="mt-4 flex items-center justify-between border-t border-stone-200 pt-4">
        <span className="text-sm text-stone-600">
          {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
        </span>
        <span className="text-lg font-semibold tabular-nums">₹{order.total}</span>
      </footer>
    </article>
  );
}

function OrderSection({
  title,
  orders,
  onStatusChange,
}: {
  title: string;
  orders: PlacedOrder[];
  onStatusChange: (id: string, status: OrderStatus) => void;
}) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-garamond text-2xl font-medium">{title}</h2>
        <span className="text-sm text-stone-600">{orders.length}</span>
      </div>
      {orders.length > 0 ? (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={(status) => onStatusChange(order.id, status)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-stone-300 bg-white px-5 py-8 text-center">
          <p className="text-sm text-stone-600">
            {title === "Live orders"
              ? "New orders will appear here as they are placed."
              : "Delivered and cancelled orders will appear here."}
          </p>
        </div>
      )}
    </section>
  );
}

export default function OrdersDashboard() {
  const { orders, hydrated, updateOrderStatus } = useOrders();
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null);
  const liveOrders = useMemo(
    () => orders.filter((order) => !pastStatuses.has(order.status)),
    [orders],
  );
  const pastOrders = useMemo(
    () => orders.filter((order) => pastStatuses.has(order.status)),
    [orders],
  );

  function handleStatusChange(id: string, status: OrderStatus) {
    updateOrderStatus(id, status);
    toast.success(`Order status changed to ${statusLabel(status)}`);
  }

  return (
    <main className="min-h-screen bg-stone-100 font-inter text-stone-950">
      <header className="flex items-center justify-between border-b border-stone-200 bg-white px-4 py-4 lg:hidden">
        <div>
          <p className="font-garamond text-2xl">Cafe Sonder</p>
          <p className="text-xs text-stone-600">Orders</p>
        </div>
        <button
          type="button"
          onClick={() => setMobilePanel("navigation")}
          className="cursor-pointer rounded-md border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-800"
        >
          Menu
        </button>
      </header>

      <div className="mx-auto min-h-screen max-w-[1600px] lg:grid lg:grid-cols-[190px_minmax(0,1fr)]">
        <div className="hidden lg:block">
          <PrimarySidebar activePage="orders" />
        </div>

        <section className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-stone-600">Admin dashboard</p>
              <h1 className="mt-1 font-garamond text-4xl font-medium">Orders</h1>
            </div>
            {hydrated && (
              <p className="hidden text-right text-sm text-stone-600 sm:block">
                {orders.length} {orders.length === 1 ? "order" : "orders"} received
              </p>
            )}
          </div>

          {!hydrated ? (
            <p className="text-sm text-stone-600">Loading orders...</p>
          ) : (
            <div className="space-y-10">
              <OrderSection title="Live orders" orders={liveOrders} onStatusChange={handleStatusChange} />
              <OrderSection title="Past orders" orders={pastOrders} onStatusChange={handleStatusChange} />
            </div>
          )}
        </section>
      </div>

      {mobilePanel && (
        <div className="fixed inset-0 z-40 bg-stone-950/40 lg:hidden" onClick={() => setMobilePanel(null)}>
          <div className="h-full w-72" onClick={(event) => event.stopPropagation()}>
            <PrimarySidebar activePage="orders" onNavigate={() => setMobilePanel(null)} />
          </div>
        </div>
      )}
    </main>
  );
}
