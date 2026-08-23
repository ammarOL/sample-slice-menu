"use client";

import Link from "next/link";
import { useState } from "react";
import { menuItems } from "../data";
import { useOrder } from "../order-context/order-context";

const customizationOptionsById = new Map(
  menuItems
    .flatMap((item) => item.customizationOptions ?? [])
    .map((option) => [option.id, option]),
);

export default function Checkout() {
  const { clearOrder, itemCount, orderItems, total } = useOrder();
  const [hasPlacedOrder, setHasPlacedOrder] = useState(false);

  function handlePlaceOrder() {
    setHasPlacedOrder(true);
    clearOrder();
  }

  if (hasPlacedOrder) {
    return (
      <main className="flex min-h-screen items-center bg-stone-50 px-4 py-6 font-inter text-stone-950">
        <section className="mx-auto w-full max-w-md rounded-lg border border-stone-200 bg-white px-5 py-6 text-center">
          <h1 className="font-garamond text-3xl font-medium">
            Order placed
          </h1>
          <p className="mt-2 text-sm leading-6 text-stone-700">
            Your order has been sent to the counter.
          </p>
          <Link
            href="/menu"
            className="mt-5 inline-flex cursor-pointer rounded-md bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2"
          >
            Back to menu
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 font-inter text-stone-950">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-2xl flex-col overflow-hidden rounded-lg border border-stone-200 bg-white">
        <header className="border-b border-stone-200 px-4 py-5 sm:px-6">
          <div className="mb-4 border-b border-stone-200 pb-4">
            <Link
              href="/menu"
              className="inline-flex cursor-pointer items-center text-sm font-medium text-stone-600 transition hover:text-stone-950 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2"
            >
              ← Back to menu
            </Link>
          </div>
          <p className="text-sm font-medium text-stone-600">Checkout</p>
          <h1 className="mt-1 font-garamond text-3xl font-medium">
            Review your order
          </h1>
        </header>

        {orderItems.length > 0 ? (
          <>
            <div className="flex-1 divide-y divide-stone-200">
              {orderItems.map((item) => {
                const customizations =
                  item.customizations.length > 0
                    ? item.customizations
                    : item.id
                        .split("-")
                        .slice(1)
                        .map((optionId) =>
                          customizationOptionsById.get(optionId),
                        )
                        .filter((option) => option !== undefined);
                const customizationTotal = customizations.reduce(
                  (sum, customization) => sum + customization.price,
                  0,
                );

                return (
                  <article
                    key={item.id}
                    className="grid grid-cols-[1fr_auto] gap-4 px-4 py-4 sm:px-6"
                  >
                    <div>
                      <h2 className="font-semibold">{item.name}</h2>
                      <p className="mt-1 text-sm text-stone-700">
                        {item.quantity} × ₹{item.price}
                      </p>
                      {customizations.length > 0 && (
                        <p className="mt-2 text-xs text-stone-700">
                          <span className="font-medium text-stone-600">
                            Customizations:
                          </span>{" "}
                          {customizations
                            .map(
                              (customization) =>
                                `${customization.name} (+₹${customization.price})`,
                            )
                            .join(", ")}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-stone-600">Item total</p>
                      <p className="mt-1 font-semibold tabular-nums">
                        ₹{(item.price + customizationTotal) * item.quantity}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>

            <footer className="sticky bottom-0 border-t border-stone-200 bg-white px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-stone-600">
                    Total for {itemCount} {itemCount === 1 ? "item" : "items"}
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">
                    ₹{total}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  className="cursor-pointer rounded-md bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2"
                >
                  Place order
                </button>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center px-5 py-12 text-center">
            <h2 className="font-garamond text-2xl font-medium">
              Your order is empty
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-stone-700">
              Add a few items from the menu and they will appear here with
              quantities, item costs, and the total.
            </p>
            <Link
              href="/menu"
              className="mt-5 cursor-pointer rounded-md bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2"
            >
              Back to menu
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
