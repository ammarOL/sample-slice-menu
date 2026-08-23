"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { MenuProvider } from "./menu-context/menu-context";
import { OrderProvider } from "./order-context/order-context";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <MenuProvider>
      <OrderProvider>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </OrderProvider>
    </MenuProvider>
  );
}
