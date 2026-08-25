"use client";
import Image from "next/image";
import { useState } from "react";
import type { CustomizationOption } from "../../order-context/order-context";
import { motion } from "motion/react";

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
  const [customizationMode, setCustomizationMode] = useState<
    "options" | "repeat" | null
  >(null);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const isCustomizable = customizationOptions.length > 0;

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
          <div className="mt-2 min-w-24 rounded-md border border-stone-300 bg-white text-center text-sm font-semibold">
            {quantity > 0 ? (
              <div className="grid grid-cols-3 items-center">
                <button
                  type="button"
                  onClick={() => removeItem(itemId)}
                  className="h-9 cursor-pointer rounded-l-md text-lg leading-none text-stone-700 transition hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2"
                  aria-label={`Remove one ${itemName}`}
                >
                  -
                </button>
                <span className="tabular-nums text-stone-950">{quantity}</span>
                <button
                  type="button"
                  onClick={openAddFlow}
                  className="h-9 cursor-pointer rounded-r-md text-lg leading-none text-stone-700 transition hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2"
                  aria-label={`Add one ${itemName}`}
                >
                  +
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={openAddFlow}
                className="h-9 w-full cursor-pointer rounded-md px-4 text-stone-950 transition hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2"
              >
                Add
              </button>
            )}
          </div>
          {isCustomizable && (
            <p className="mt-1 text-center text-[11px] font-medium text-stone-500">
              Customizable
            </p>
          )}
        </div>
      </article>

      {customizationMode && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-stone-950/40 p-4 sm:items-center">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${itemId}-customization-title`}
            className="relative w-full max-w-md rounded-lg bg-white p-5 shadow-xl sm:p-6"
          >
            <button
              type="button"
              onClick={() => setCustomizationMode(null)}
              aria-label="Cancel customization"
              className="absolute right-4 top-4 grid size-8 cursor-pointer place-items-center rounded-md text-xl font-light leading-none text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2"
            >
              ×
            </button>
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
                    ? lastCustomizations.map((option) => option.name).join(", ")
                    : "No extras selected"}
                </div>
                <div className="mt-6 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOptionIds([]);
                      setCustomizationMode("options");
                    }}
                    className="cursor-pointer rounded-md border border-stone-300 px-3 py-3 text-sm font-semibold text-stone-800 transition hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2"
                  >
                    Customize again
                  </button>
                  <button
                    type="button"
                    onClick={() => addCustomizedItem(lastCustomizations)}
                    className="cursor-pointer rounded-md bg-stone-950 px-3 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2"
                  >
                    Repeat customization
                  </button>
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
                    <label
                      key={option.id}
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
                      <span className="text-stone-600">+₹{option.price}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setCustomizationMode(null)}
                    className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      addCustomizedItem(
                        customizationOptions.filter((option) =>
                          selectedOptionIds.includes(option.id),
                        ),
                      )
                    }
                    className="cursor-pointer rounded-md bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2"
                  >
                    Add item
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}
