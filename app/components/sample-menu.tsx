"use client";
import { useState } from "react";
import SingleMenuItem from "./menu-components/single-menu-item";
import Link from "next/link";
import { menuItems } from "../data";
import { useOrder } from "../order-context/order-context";

export default function SampleMenu() {
  const { clearOrder, itemCount, orderList, setItemQuantity, total } =
    useOrder();
  const categoryGroups = menuItems.reduce<Record<string, typeof menuItems>>(
    (groups, item) => {
      groups[item.category] ??= [];
      groups[item.category].push(item);
      return groups;
    },
    {},
  );
  const [openCategories, setOpenCategories] = useState(
    () => new Set([menuItems[0]?.category]),
  );

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 font-inter text-stone-950">
      <div className="mx-auto max-w-2xl overflow-hidden rounded-lg border border-stone-200 bg-white">
        <header className="border-b border-stone-200 px-4 py-5 sm:px-6">
          <h1 className="font-garamond text-3xl font-medium text-stone-950">
            Cafe Sonder
          </h1>
          <p className="mt-1 text-sm text-stone-700">
            Serving coffee, plates, and desserts in Pune since 1951.
          </p>
        </header>

        <div>
          {Object.entries(categoryGroups).map(([category, items]) => (
            <details
              key={category}
              open={openCategories.has(category)}
              onToggle={(event) => {
                const nextOpen = event.currentTarget.open;
                setOpenCategories((current) => {
                  const next = new Set(current);
                  if (nextOpen) {
                    next.add(category);
                  } else {
                    next.delete(category);
                  }
                  return next;
                });
              }}
              className="group border-b border-stone-200 last:border-b-0"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 text-stone-950 outline-none transition hover:bg-stone-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stone-900 sm:px-6 [&::-webkit-details-marker]:hidden">
                <span>
                  <span className="block font-garamond text-2xl font-medium">
                    {category}
                  </span>
                  <span className="mt-1 block text-xs text-stone-600">
                    {items.length} {items.length === 1 ? "item" : "items"}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className="text-2xl leading-none text-stone-500 transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <div>
                {items.map((each) => (
                  <SingleMenuItem
                    key={each.id}
                    itemId={each.id}
                    itemName={each.name}
                    itemDescription={each.description}
                    itemPrice={each.price}
                    quantity={orderList[each.id]?.quantity ?? 0}
                    alterQtyFunction={setItemQuantity}
                  />
                ))}
              </div>
            </details>
          ))}
        </div>

        {total !== 0 && (
          <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-stone-200 bg-white px-4 py-3 shadow-sm sm:px-6">
            <div>
              <div className="text-xs text-stone-600">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </div>
              <div className="text-lg font-semibold">₹{total}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearOrder}
                className="rounded-md px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2"
              >
                Clear
              </button>
              <Link
                href="/checkout"
                className="rounded-md bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2"
              >
                Checkout
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
