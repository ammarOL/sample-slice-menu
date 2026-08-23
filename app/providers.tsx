"use client";

import type { ReactNode } from "react";
import { OrderProvider } from "./order-context/order-context";

export default function Providers({ children }: { children: ReactNode }) {
  return <OrderProvider>{children}</OrderProvider>;
}
