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
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  customizations: CustomizationOption[];
};

export type CustomizationOption = {
  id: string;
  name: string;
  price: number;
};

type OrderContextValue = {
  orderItems: OrderItem[];
  orderList: Record<string, OrderItem>;
  total: number;
  itemCount: number;
  addItem: (
    itemId: string,
    name: string,
    price: number,
    customizations?: CustomizationOption[],
  ) => void;
  removeItem: (menuItemId: string) => void;
  getItemQuantity: (menuItemId: string) => number;
  getLastCustomizations: (menuItemId: string) => CustomizationOption[];
  clearOrder: () => void;
};

const OrderContext = createContext<OrderContextValue | null>(null);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orderList, setOrderList] = useState<Record<string, OrderItem>>({});

  const addItem = useCallback(
    (
      itemId: string,
      name: string,
      price: number,
      customizations: CustomizationOption[] = [],
    ) => {
      setOrderList((previousOrder) => {
        const nextOrder = { ...previousOrder };
        const sortedCustomizations = [...customizations].sort((a, b) =>
          a.id.localeCompare(b.id),
        );
        const lineId = `${itemId}-${
          sortedCustomizations.map((option) => option.id).join("-") || "plain"
        }`;
        const existingItem = nextOrder[lineId];

        if (existingItem) {
          nextOrder[lineId] = {
            ...existingItem,
            quantity: existingItem.quantity + 1,
          };
        } else {
          nextOrder[lineId] = {
            id: lineId,
            menuItemId: itemId,
            name,
            price,
            quantity: 1,
            customizations: sortedCustomizations,
          };
        }

        return nextOrder;
      });
    },
    [],
  );

  const removeItem = useCallback((menuItemId: string) => {
    setOrderList((previousOrder) => {
      const nextOrder = { ...previousOrder };
      const matchingItems = Object.entries(nextOrder).filter(
        ([, item]) => item.menuItemId === menuItemId,
      );
      const lastItem = matchingItems[matchingItems.length - 1];

      if (!lastItem) return nextOrder;

      const [lineId, item] = lastItem;
      if (item.quantity === 1) {
        delete nextOrder[lineId];
      } else {
        nextOrder[lineId] = { ...item, quantity: item.quantity - 1 };
      }

      return nextOrder;
    });
  }, []);

  const getItemQuantity = useCallback(
    (menuItemId: string) =>
      Object.values(orderList)
        .filter((item) => item.menuItemId === menuItemId)
        .reduce((sum, item) => sum + item.quantity, 0),
    [orderList],
  );

  const getLastCustomizations = useCallback(
    (menuItemId: string) => {
      const matchingItems = Object.values(orderList).filter(
        (item) => item.menuItemId === menuItemId,
      );
      return matchingItems[matchingItems.length - 1]?.customizations ?? [];
    },
    [orderList],
  );

  const clearOrder = useCallback(() => {
    setOrderList({});
  }, []);

  const value = useMemo(() => {
    const orderItems = Object.values(orderList);
    const total = orderItems.reduce(
      (sum, item) =>
        sum +
        (item.price +
          item.customizations.reduce(
            (customizationTotal, customization) =>
              customizationTotal + customization.price,
            0,
          )) *
          item.quantity,
      0,
    );
    const itemCount = orderItems.reduce((sum, item) => sum + item.quantity, 0);

    return {
      orderItems,
      orderList,
      total,
      itemCount,
      addItem,
      removeItem,
      getItemQuantity,
      getLastCustomizations,
      clearOrder,
    };
  }, [
    addItem,
    clearOrder,
    getItemQuantity,
    getLastCustomizations,
    orderList,
    removeItem,
  ]);

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
