"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { MenuProvider } from "./menu-context/menu-context";
import { OrderProvider } from "./order-context/order-context";
import { OrdersProvider } from "./orders-context/orders-context";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <MenuProvider>
      <OrderProvider>
        <OrdersProvider>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </OrdersProvider>
      </OrderProvider>
    </MenuProvider>
  );
}
