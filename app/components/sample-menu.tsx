"use client";
import { useEffect, useState } from "react";
import type { KeyboardEvent } from "react";
import SingleMenuItem from "./menu-components/single-menu-item";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useOrder } from "../order-context/order-context";
import { useMenu } from "../menu-context/menu-context";

const quickTransition = { duration: 0.18, ease: [0.25, 1, 0.5, 1] } as const;
const stateTransition = { duration: 0.24, ease: [0.25, 1, 0.5, 1] } as const;
const headerTransition = { duration: 0.4, ease: [0.22, 1, 0.36, 1] } as const;
const headerExitTransition = {
  duration: 0.28,
  ease: [0.25, 1, 0.5, 1],
} as const;

const cafeMetadata = [
  { label: "Neighborhood", value: "Camp, Pune" },
  { label: "Open today", value: "8 AM - 10 PM" },
  { label: "Kitchen", value: "Coffee, plates, desserts" },
];

export default function SampleMenu() {
  const { menuItems } = useMenu();
  const shouldReduceMotion = useReducedMotion();
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
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
  const quick = shouldReduceMotion ? { duration: 0 } : quickTransition;
  const state = shouldReduceMotion ? { duration: 0 } : stateTransition;
  const header = shouldReduceMotion ? { duration: 0 } : headerTransition;
  const headerExit = shouldReduceMotion ? { duration: 0 } : headerExitTransition;

  function toggleHeader() {
    setIsHeaderExpanded((current) => !current);
  }

  function toggleHeaderWithKeyboard(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    toggleHeader();
  }

  useEffect(() => {
    if (!isHeaderExpanded) return;

    function closeWithEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setIsHeaderExpanded(false);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeWithEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeWithEscape);
    };
  }, [isHeaderExpanded]);

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
          <motion.header
            role="button"
            tabIndex={0}
            aria-expanded={isHeaderExpanded}
            onClick={toggleHeader}
            onKeyDown={toggleHeaderWithKeyboard}
            className="relative isolate block w-full cursor-pointer overflow-hidden border-b border-stone-200 px-4 py-8 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white sm:px-6"
            initial={false}
            animate={{ minHeight: 224 }}
            transition={header}
          >
            <motion.div
              aria-hidden="true"
              className="absolute inset-0 -z-20 bg-cover bg-[center_72%]"
              style={{ backgroundImage: "url('/cafe-bg.jpg')" }}
              initial={false}
              animate={{ scale: isHeaderExpanded ? 1.015 : 1 }}
              transition={header}
            />
            <motion.div
              aria-hidden="true"
              className="absolute inset-0 -z-10 bg-stone-950"
              initial={false}
              animate={{ opacity: isHeaderExpanded ? 0.5 : 0.55 }}
              transition={state}
            />
            <div className="relative flex min-h-40 flex-col justify-end text-white">
              <motion.div layout transition={header}>
                <h1 className="font-garamond text-4xl font-medium text-white">
                  Cafe Sonder
                </h1>
                <p className="mt-1 text-sm text-white/90">
                  Serving coffee, plates, and desserts in Pune since 1951.
                </p>
              </motion.div>
            </div>
          </motion.header>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 py-2">
          <motion.button
            type="button"
            aria-pressed={bestsellersOnly}
            onClick={() => setBestsellersOnly((current) => !current)}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
            transition={quick}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2 ${
              bestsellersOnly
                ? "border-transparent bg-stone-900 text-white"
                : "border-stone-300 bg-transparent text-stone-500 hover:bg-stone-100/70"
            }`}
          >
            <span aria-hidden="true">★</span>
            Bestsellers
            <AnimatePresence initial={false}>
              {bestsellersOnly && (
                <motion.span
                  aria-hidden="true"
                  className="inline-block overflow-hidden text-sm leading-none text-stone-300"
                  initial={{ opacity: 0, scale: 0.7, width: 0 }}
                  animate={{ opacity: 1, scale: 1, width: "auto" }}
                  exit={{ opacity: 0, scale: 0.7, width: 0 }}
                  transition={quick}
                >
                  ×
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
          <motion.button
            type="button"
            role="switch"
            aria-checked={vegMode}
            onClick={() => setVegMode((current) => !current)}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
            transition={quick}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border bg-transparent px-2.5 py-1.5 text-xs font-medium transition hover:bg-stone-100/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2 ${
              vegMode
                ? "border-transparent bg-stone-100 text-stone-900"
                : "border-stone-300 text-stone-500"
            }`}
          >
            <motion.span
              aria-hidden="true"
              className={`relative h-4 w-7 rounded-full transition ${
                vegMode ? "bg-emerald-700" : "bg-stone-400"
              }`}
              transition={quick}
            >
              <motion.span
                className="absolute left-0.5 top-0.5 size-3 rounded-full bg-white"
                initial={false}
                animate={{ x: vegMode ? 16 : 0 }}
                transition={quick}
              />
            </motion.span>
            Veg mode {vegMode ? "on" : "off"}
            <AnimatePresence initial={false}>
              {vegMode && (
                <motion.span
                  aria-hidden="true"
                  className="inline-block overflow-hidden text-sm leading-none text-stone-400"
                  initial={{ opacity: 0, scale: 0.7, width: 0 }}
                  animate={{ opacity: 1, scale: 1, width: "auto" }}
                  exit={{ opacity: 0, scale: 0.7, width: 0 }}
                  transition={quick}
                >
                  ×
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
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

        <AnimatePresence initial={false}>
          {total !== 0 && (
            <motion.div
              className="fixed inset-x-0 bottom-0 z-20 px-4 pb-3 sm:px-6"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={state}
            >
              <motion.div
                layout
                className="mx-auto flex max-w-2xl items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white px-4 py-3 shadow-[0_-8px_20px_rgba(28,25,23,0.14)] sm:px-6"
                transition={state}
              >
                <div>
                  <div className="text-xs text-stone-600">
                    {itemCount} {itemCount === 1 ? "item" : "items"}
                  </div>
                  <div className="text-lg font-semibold">₹{total}</div>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    type="button"
                    onClick={clearOrder}
                    whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                    transition={quick}
                    className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2"
                  >
                    Clear
                  </motion.button>
                  <Link
                    href="/checkout"
                    className="cursor-pointer rounded-md bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2"
                  >
                    Checkout
                  </Link>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence initial={false}>
        {isHeaderExpanded && (
          <motion.div
            className="fixed inset-0 z-30 overflow-y-auto bg-stone-950/68 px-4 py-8 backdrop-blur-[2px] sm:py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={headerExit}
            onClick={() => setIsHeaderExpanded(false)}
          >
            <motion.article
              role="dialog"
              aria-modal="true"
              aria-labelledby="cafe-expanded-title"
              className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-lg text-left shadow-[0_8px_24px_rgba(28,25,23,0.24)]"
              initial={{
                opacity: 0,
                y: shouldReduceMotion ? 0 : -18,
                scale: shouldReduceMotion ? 1 : 0.96,
              }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{
                opacity: 0,
                y: shouldReduceMotion ? 0 : -16,
                scale: shouldReduceMotion ? 1 : 0.98,
              }}
              transition={headerExit}
              onClick={(event) => event.stopPropagation()}
            >
              <motion.button
                type="button"
                aria-label="Close cafe details"
                onClick={() => setIsHeaderExpanded(false)}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
                transition={quick}
                className="absolute right-3 top-3 z-10 grid size-9 cursor-pointer place-items-center rounded-md bg-stone-950/45 text-xl font-light leading-none text-white transition hover:bg-stone-950/65 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
              >
                ×
              </motion.button>
              <div className="relative isolate flex min-h-[500px] items-end overflow-hidden px-5 py-7 sm:min-h-[560px] sm:px-9 sm:py-9">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 -z-20 bg-cover bg-[center_72%]"
                  style={{ backgroundImage: "url('/cafe-bg.jpg')" }}
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 bg-linear-to-t from-stone-950/82 via-stone-950/42 to-stone-950/18"
                />
                <div className="max-w-2xl text-white">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={state}
                  >
                    <p className="text-sm font-semibold text-white/85">
                      Cafe Sonder
                    </p>
                    <h2
                      id="cafe-expanded-title"
                      className="mt-3 max-w-lg font-garamond text-4xl font-medium leading-none text-white sm:text-5xl"
                    >
                      Coffee, plates, and desserts in Pune.
                    </h2>
                    <p className="mt-4 max-w-2xl text-sm leading-6 text-white/88 sm:text-base">
                      A compact neighborhood cafe with a slow-roasted coffee
                      bar, all-day snacks, and a small dessert counter for
                      quick table orders.
                    </p>
                  </motion.div>
                  <motion.div
                    className="mt-5 flex flex-wrap gap-2"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={state}
                  >
                    {cafeMetadata.map((item) => (
                      <span
                        key={item.label}
                        className="rounded-md bg-white/14 px-3 py-2 text-xs text-white backdrop-blur-sm"
                      >
                        <span className="font-semibold text-white">
                          {item.label}:
                        </span>{" "}
                        <span className="text-white/82">{item.value}</span>
                      </span>
                    ))}
                  </motion.div>
                </div>
              </div>
            </motion.article>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
