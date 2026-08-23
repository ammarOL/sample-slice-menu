"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

export type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type OrderContextValue = {
  orderItems: OrderItem[];
  orderList: Record<string, OrderItem>;
  total: number;
  itemCount: number;
  setItemQuantity: (
    itemId: string,
    name: string,
    price: number,
    quantity: number,
  ) => void;
  clearOrder: () => void;
};

const OrderContext = createContext<OrderContextValue | null>(null);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orderList, setOrderList] = useState<Record<string, OrderItem>>({});

  const setItemQuantity = useCallback(
    (itemId: string, name: string, price: number, quantity: number) => {
      setOrderList((previousOrder) => {
        const nextOrder = { ...previousOrder };

        if (quantity <= 0) {
          delete nextOrder[itemId];
          return nextOrder;
        }

        nextOrder[itemId] = {
          id: itemId,
          name,
          price,
          quantity,
        };

        return nextOrder;
      });
    },
    [],
  );

  const clearOrder = useCallback(() => {
    setOrderList({});
  }, []);

  const value = useMemo(() => {
    const orderItems = Object.values(orderList);
    const total = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const itemCount = orderItems.reduce((sum, item) => sum + item.quantity, 0);

    return {
      orderItems,
      orderList,
      total,
      itemCount,
      setItemQuantity,
      clearOrder,
    };
  }, [clearOrder, orderList, setItemQuantity]);

  return (
    <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
  );
}

export function useOrder() {
  const context = useContext(OrderContext);

  if (!context) {
    throw new Error("useOrder must be used within an OrderProvider");
  }

  return context;
}
