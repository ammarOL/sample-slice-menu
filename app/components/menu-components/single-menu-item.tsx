"use client";
import Image from "next/image";
import { useState } from "react";
import type { CustomizationOption } from "../../order-context/order-context";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const quickTransition = { duration: 0.18, ease: [0.25, 1, 0.5, 1] } as const;
const stateTransition = { duration: 0.24, ease: [0.25, 1, 0.5, 1] } as const;

export default function SingleMenuItem({
  itemId,
  itemName,
  itemDescription,
  itemPrice,
  isVegetarian,
  isBestseller,
  imageUrl,
  customizationOptions = [],
  quantity,
  addItem,
  removeItem,
  lastCustomizations,
}: {
  itemId: string;
  itemName: string;
  itemDescription: string;
  itemPrice: number;
  isVegetarian: boolean;
  isBestseller: boolean;
  imageUrl: string;
  customizationOptions?: CustomizationOption[];
  quantity: number;
  addItem: (
    itemId: string,
    name: string,
    price: number,
    customizations?: CustomizationOption[],
  ) => void;
  removeItem: (menuItemId: string) => void;
  lastCustomizations: CustomizationOption[];
}) {
  const shouldReduceMotion = useReducedMotion();
  const [customizationMode, setCustomizationMode] = useState<
    "options" | "repeat" | null
  >(null);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const isCustomizable = customizationOptions.length > 0;
  const quick = shouldReduceMotion ? { duration: 0 } : quickTransition;
  const state = shouldReduceMotion ? { duration: 0 } : stateTransition;

  function openAddFlow() {
    if (!isCustomizable) {
      addItem(itemId, itemName, itemPrice);
      return;
    }

    if (quantity > 0) {
      setCustomizationMode("repeat");
      return;
    }

    setSelectedOptionIds([]);
    setCustomizationMode("options");
  }

  function addCustomizedItem(customizations: CustomizationOption[]) {
    addItem(itemId, itemName, itemPrice, [...customizations]);
    setCustomizationMode(null);
  }

  function toggleOption(optionId: string) {
    setSelectedOptionIds((current) =>
      current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId],
    );
  }

  return (
    <>
      <article className="flex gap-4 border-b border-stone-200 px-4 py-4 last:border-b-0 sm:px-6">
        <div className="min-w-0 flex-1">
          <h2 className="flex flex-wrap items-center gap-2 text-base font-semibold text-stone-950">
            <span
              aria-label={isVegetarian ? "Vegetarian" : "Non-vegetarian"}
              className={`grid size-4 shrink-0 place-items-center rounded-[3px] border-2 ${
                isVegetarian ? "border-emerald-700" : "border-red-700"
              }`}
            >
              <span
                aria-hidden="true"
                className={`size-1.5 rounded-full ${
                  isVegetarian ? "bg-emerald-700" : "bg-red-700"
                }`}
              />
            </span>
            {itemName}
            {isBestseller && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                <span aria-hidden="true">★</span>
                Bestseller
              </span>
            )}
          </h2>
          <p className="mt-1 text-sm leading-5 text-stone-700">
            {itemDescription}
          </p>
          <p className="mt-2 text-sm font-semibold text-stone-950">
            ₹{itemPrice}
          </p>
        </div>

        <div className="w-24 shrink-0">
          <div className="relative aspect-square overflow-hidden rounded-md bg-stone-100">
            <Image
              src={imageUrl}
              alt={itemName}
              fill
              sizes="96px"
              className="object-cover"
            />
          </div>
          <div className="mt-2 w-24 rounded-md bg-stone-100 text-center text-sm font-semibold">
            <div className="relative h-9 overflow-hidden">
              <motion.div
                className="absolute inset-0 grid grid-cols-3 items-center"
                aria-hidden={quantity === 0}
                animate={{ opacity: quantity > 0 ? 1 : 0 }}
                transition={state}
                style={{ pointerEvents: quantity > 0 ? "auto" : "none" }}
              >
                <motion.button
                  type="button"
                  onClick={() => removeItem(itemId)}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.92 }}
                  transition={quick}
                  className="h-9 cursor-pointer rounded-l-md text-lg leading-none text-stone-700 transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-600"
                  aria-label={`Remove one ${itemName}`}
                  tabIndex={quantity > 0 ? 0 : -1}
                >
                  -
                </motion.button>
                <span className="grid h-9 place-items-center tabular-nums text-stone-950">
                  {quantity}
                </span>
                <motion.button
                  type="button"
                  onClick={openAddFlow}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.92 }}
                  transition={quick}
                  className="h-9 cursor-pointer rounded-r-md text-lg leading-none text-stone-700 transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-600"
                  aria-label={`Add one ${itemName}`}
                  tabIndex={quantity > 0 ? 0 : -1}
                >
                  +
                </motion.button>
              </motion.div>
              <motion.button
                type="button"
                onClick={openAddFlow}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                animate={{ opacity: quantity > 0 ? 0 : 1 }}
                transition={state}
                style={{ pointerEvents: quantity > 0 ? "none" : "auto" }}
                tabIndex={quantity > 0 ? -1 : 0}
                className="absolute inset-0 h-9 w-full cursor-pointer rounded-md px-4 text-stone-950 transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-600"
              >
                Add
              </motion.button>
            </div>
          </div>
          {isCustomizable && (
            <p className="mt-1 text-center text-[11px] font-medium text-stone-500">
              Customizable
            </p>
          )}
        </div>
      </article>

      <AnimatePresence initial={false}>
        {customizationMode && (
          <motion.div
            className="fixed inset-0 z-40 flex items-end justify-center bg-stone-950/40 p-4 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={state}
          >
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby={`${itemId}-customization-title`}
              className="relative w-full max-w-md rounded-lg bg-white p-5 shadow-xl sm:p-6"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={state}
            >
              <motion.button
                type="button"
                onClick={() => setCustomizationMode(null)}
                aria-label="Cancel customization"
                whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
                transition={quick}
                className="absolute right-4 top-4 grid size-8 cursor-pointer place-items-center rounded-md text-xl font-light leading-none text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2"
              >
                ×
              </motion.button>
              {customizationMode === "repeat" ? (
                <>
                  <h3
                    id={`${itemId}-customization-title`}
                    className="pr-8 font-garamond text-2xl font-medium text-stone-950"
                  >
                    Repeat your customization?
                  </h3>
                  <p className="mt-2 text-sm leading-5 text-stone-700">
                    You already added {itemName} with these options. Would you
                    like to use them again?
                  </p>
                  <div className="mt-4 rounded-md bg-stone-50 px-3 py-2 text-sm text-stone-800">
                    {lastCustomizations.length > 0
                      ? lastCustomizations
                          .map((option) => option.name)
                          .join(", ")
                      : "No extras selected"}
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-2">
                    <motion.button
                      type="button"
                      onClick={() => {
                        setSelectedOptionIds([]);
                        setCustomizationMode("options");
                      }}
                      whileTap={
                        shouldReduceMotion ? undefined : { scale: 0.98 }
                      }
                      transition={quick}
                      className="cursor-pointer rounded-md border border-stone-300 px-3 py-3 text-sm font-semibold text-stone-800 transition hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2"
                    >
                      Customize again
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={() => addCustomizedItem(lastCustomizations)}
                      whileTap={
                        shouldReduceMotion ? undefined : { scale: 0.98 }
                      }
                      transition={quick}
                      className="cursor-pointer rounded-md bg-stone-950 px-3 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2"
                    >
                      Repeat customization
                    </motion.button>
                  </div>
                </>
              ) : (
                <>
                  <h3
                    id={`${itemId}-customization-title`}
                    className="pr-8 font-garamond text-2xl font-medium text-stone-950"
                  >
                    Customize {itemName}
                  </h3>
                  <p className="mt-2 text-sm text-stone-700">
                    Choose any extras you would like to add.
                  </p>
                  <div className="mt-4 space-y-2">
                    {customizationOptions.map((option) => (
                      <motion.label
                        key={option.id}
                        layout
                        transition={quick}
                        className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-stone-200 px-3 py-3 text-sm transition hover:bg-stone-50"
                      >
                        <span className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedOptionIds.includes(option.id)}
                            onChange={() => toggleOption(option.id)}
                            className="size-4 accent-stone-950"
                          />
                          <span className="text-stone-900">{option.name}</span>
                        </span>
                        <span className="text-stone-600">
                          +₹{option.price}
                        </span>
                      </motion.label>
                    ))}
                  </div>
                  <div className="mt-6 flex items-center justify-between gap-3">
                    <motion.button
                      type="button"
                      onClick={() => setCustomizationMode(null)}
                      whileTap={
                        shouldReduceMotion ? undefined : { scale: 0.98 }
                      }
                      transition={quick}
                      className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={() =>
                        addCustomizedItem(
                          customizationOptions.filter((option) =>
                            selectedOptionIds.includes(option.id),
                          ),
                        )
                      }
                      whileTap={
                        shouldReduceMotion ? undefined : { scale: 0.98 }
                      }
                      transition={quick}
                      className="cursor-pointer rounded-md bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2"
                    >
                      Add item
                    </motion.button>
                  </div>
                </>
              )}
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
