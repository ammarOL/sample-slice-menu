"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { CustomizationOption } from "../data";
import type { OrderItem } from "../order-context/order-context";

const ORDERS_STORAGE_KEY = "airmenus_orders_v1";

export type OrderStatus =
  | "new"
  | "preparing"
  | "ready"
  | "out-for-delivery"
  | "delivered"
  | "cancelled";

export type OrderSnapshotItem = Pick<
  OrderItem,
  "id" | "menuItemId" | "name" | "price" | "quantity"
> & {
  customizations: CustomizationOption[];
};

export type PlacedOrder = {
  id: string;
  orderNumber: string;
  submittedAt: string;
  items: OrderSnapshotItem[];
  total: number;
  status: OrderStatus;
};

type OrdersContextValue = {
  orders: PlacedOrder[];
  hydrated: boolean;
  createOrder: (items: OrderItem[], total: number) => PlacedOrder;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
};

const OrdersContext = createContext<OrdersContextValue | null>(null);

function createStableId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createOrderNumber() {
  return `#${Date.now().toString().slice(-6)}`;
}

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<PlacedOrder[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let savedOrderList: PlacedOrder[] | null = null;

    try {
      const savedOrders = window.localStorage.getItem(ORDERS_STORAGE_KEY);
      if (savedOrders) {
        const parsedOrders = JSON.parse(savedOrders) as PlacedOrder[];
        if (Array.isArray(parsedOrders)) savedOrderList = parsedOrders;
      }
    } catch {
      // Keep the empty list when browser storage contains invalid data.
    }

    startTransition(() => {
      if (savedOrderList) setOrders(savedOrderList);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    }
  }, [hydrated, orders]);

  const createOrder = useCallback((items: OrderItem[], total: number) => {
    const order: PlacedOrder = {
      id: createStableId(),
      orderNumber: createOrderNumber(),
      submittedAt: new Date().toISOString(),
      items: items.map((item) => ({
        id: item.id,
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        customizations: item.customizations.map((customization) => ({ ...customization })),
      })),
      total,
      status: "new",
    };

    setOrders((current) => [order, ...current]);
    return order;
  }, []);

  const updateOrderStatus = useCallback((id: string, status: OrderStatus) => {
    setOrders((current) =>
      current.map((order) => (order.id === id ? { ...order, status } : order)),
    );
  }, []);

  const value = useMemo(
    () => ({ orders, hydrated, createOrder, updateOrderStatus }),
    [createOrder, hydrated, orders, updateOrderStatus],
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const context = useContext(OrdersContext);
  if (!context) throw new Error("useOrders must be used within OrdersProvider");
  return context;
}
