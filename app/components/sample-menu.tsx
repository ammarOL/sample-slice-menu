"use client";
import { useState } from "react";
import SingleMenuItem from "./menu-components/single-menu-item";
import Link from "next/link";
import { menuItems } from "../data";
import { useOrder } from "../order-context/order-context";

export default function SampleMenu() {
  const {
    addItem,
    clearOrder,
    getItemQuantity,
    getLastCustomizations,
    itemCount,
    removeItem,
    total,
  } = useOrder();
  const [bestsellersOnly, setBestsellersOnly] = useState(false);
  const [vegMode, setVegMode] = useState(false);
  const filteredItems = menuItems.filter((item) => {
    if (bestsellersOnly && !item.isBestseller) return false;
    if (vegMode && !item.isVegetarian) return false;
    return true;
  });
  const categoryGroups = filteredItems.reduce<Record<string, typeof menuItems>>(
    (groups, item) => {
      groups[item.category] ??= [];
      groups[item.category].push(item);
      return groups;
    },
    {},
  );
  const [openCategories, setOpenCategories] = useState(
    () => new Set(menuItems.map((item) => item.category)),
  );

  return (
    <main
      className={`min-h-screen bg-stone-50 px-4 pt-6 font-inter text-stone-950 ${
        total !== 0 ? "pb-28" : "pb-6"
      }`}
    >
      <div className="mx-auto max-w-2xl">
        <div className="overflow-hidden rounded-t-lg border border-stone-200 border-b-0 bg-white">
        <header className="relative isolate min-h-56 overflow-hidden border-b border-stone-200 px-4 py-8 sm:px-6">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-20 bg-cover bg-[center_72%]"
            style={{ backgroundImage: "url('/cafe-bg.jpg')" }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-stone-950/55"
          />
          <div className="relative flex min-h-40 flex-col justify-end text-white">
            <h1 className="font-garamond text-4xl font-medium text-white">
              Cafe Sonder
            </h1>
            <p className="mt-1 text-sm text-white/90">
              Serving coffee, plates, and desserts in Pune since 1951.
            </p>
          </div>
        </header>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 py-2">
          <button
            type="button"
            aria-pressed={bestsellersOnly}
            onClick={() => setBestsellersOnly((current) => !current)}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2 ${
              bestsellersOnly
                ? "border-transparent bg-stone-900 text-white"
                : "border-stone-300 bg-transparent text-stone-500 hover:bg-stone-100/70"
            }`}
          >
            <span aria-hidden="true">★</span>
            Bestsellers
            {bestsellersOnly && (
              <span aria-hidden="true" className="text-sm leading-none text-stone-300">
                ×
              </span>
            )}
          </button>
          <button
            type="button"
            role="switch"
            aria-checked={vegMode}
            onClick={() => setVegMode((current) => !current)}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border bg-transparent px-2.5 py-1.5 text-xs font-medium transition hover:bg-stone-100/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2 ${
              vegMode
                ? "border-transparent bg-stone-100 text-stone-900"
                : "border-stone-300 text-stone-500"
            }`}
          >
            <span
              aria-hidden="true"
              className={`relative h-4 w-7 rounded-full transition ${
                vegMode ? "bg-emerald-700" : "bg-stone-400"
              }`}
            >
              <span
                className={`absolute top-0.5 size-3 rounded-full bg-white transition ${
                  vegMode ? "left-4" : "left-0.5"
                }`}
              />
            </span>
            Veg mode {vegMode ? "on" : "off"}
            {vegMode && (
              <span aria-hidden="true" className="text-sm leading-none text-stone-400">
                ×
              </span>
            )}
          </button>
        </div>

        <div className="overflow-hidden rounded-b-lg border border-stone-200 bg-white">
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
                    isVegetarian={each.isVegetarian}
                    isBestseller={each.isBestseller}
                    imageUrl={each.imageUrl}
                    customizationOptions={each.customizationOptions}
                    quantity={getItemQuantity(each.id)}
                    addItem={addItem}
                    removeItem={removeItem}
                    lastCustomizations={getLastCustomizations(each.id)}
                  />
                ))}
              </div>
            </details>
          ))}
          {Object.keys(categoryGroups).length === 0 && (
            <p className="px-4 py-10 text-center text-sm text-stone-700 sm:px-6">
              No menu items match these filters.
            </p>
          )}
          </div>
        </div>

        {total !== 0 && (
          <div className="fixed inset-x-0 bottom-0 z-20 px-4 pb-3 sm:px-6">
            <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white px-4 py-3 shadow-[0_-8px_20px_rgba(28,25,23,0.14)] sm:px-6">
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
                className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2"
                >
                  Clear
                </button>
                <Link
                  href="/checkout"
                  className="cursor-pointer rounded-md bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2"
                >
                  Checkout
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
