"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { logoutAdmin } from "./actions";
import { useMenu } from "../menu-context/menu-context";
import type { CustomizationOption, MenuItem } from "../data";

type EditorMode = "item" | "category" | null;
type MobilePanel = "navigation" | "actions" | null;

type CustomizationDraft = {
  id: string;
  name: string;
  price: string;
};

type ItemDraft = {
  name: string;
  description: string;
  imageUrl: string;
  price: string;
  category: string;
  isVegetarian: boolean;
  isBestseller: boolean;
  customizationOptions: CustomizationDraft[];
};

function createDraftId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `option-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function emptyItemDraft(): ItemDraft {
  return {
    name: "",
    description: "",
    imageUrl: "",
    price: "",
    category: "",
    isVegetarian: true,
    isBestseller: false,
    customizationOptions: [{ id: createDraftId(), name: "", price: "" }],
  };
}

function draftFromItem(item: MenuItem): ItemDraft {
  return {
    name: item.name,
    description: item.description,
    imageUrl: item.imageUrl,
    price: String(item.price),
    category: item.category,
    isVegetarian: item.isVegetarian,
    isBestseller: item.isBestseller,
    customizationOptions: (item.customizationOptions ?? []).map((option) => ({
      id: option.id,
      name: option.name,
      price: String(option.price),
    })),
  };
}

function PrimarySidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <aside className="flex h-full flex-col border-stone-200 bg-stone-950 p-4 text-white lg:border-r">
      <div>
        <p className="font-garamond text-2xl">Cafe Sonder</p>
        <p className="mt-1 text-xs text-stone-400">Administration</p>
      </div>
      <nav className="mt-8 space-y-1" aria-label="Admin navigation">
        <button
          type="button"
          onClick={onNavigate}
          className="flex w-full cursor-pointer items-center rounded-md bg-white/10 px-3 py-2.5 text-left text-sm font-semibold text-white"
        >
          Menu customization
        </button>
      </nav>
      <div className="mt-auto border-t border-white/10 pt-4">
        <Link
          href="/menu"
          onClick={onNavigate}
          className="block cursor-pointer rounded-md px-3 py-2 text-sm text-stone-300 transition hover:bg-white/10 hover:text-white"
        >
          View public menu
        </Link>
        <form action={logoutAdmin} className="mt-1">
          <button
            type="submit"
            className="w-full cursor-pointer rounded-md px-3 py-2 text-left text-sm text-stone-300 transition hover:bg-white/10 hover:text-white"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}

function OptionsSidebar({
  onAddItem,
  onAddCategory,
  onNavigate,
}: {
  onAddItem: () => void;
  onAddCategory: () => void;
  onNavigate?: () => void;
}) {
  return (
    <aside className="border-stone-200 bg-white p-4 lg:border-r">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
        Menu tools
      </p>
      <div className="mt-3 space-y-2">
        <button
          type="button"
          onClick={() => {
            onAddItem();
            onNavigate?.();
          }}
          className="flex w-full cursor-pointer items-center justify-between rounded-md border border-stone-300 px-3 py-2.5 text-left text-sm font-semibold text-stone-900 transition hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2"
        >
          Add menu item
          <span aria-hidden="true" className="text-lg leading-none text-stone-500">
            +
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            onAddCategory();
            onNavigate?.();
          }}
          className="flex w-full cursor-pointer items-center justify-between rounded-md border border-stone-300 px-3 py-2.5 text-left text-sm font-semibold text-stone-900 transition hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2"
        >
          Add category
          <span aria-hidden="true" className="text-lg leading-none text-stone-500">
            +
          </span>
        </button>
      </div>
      <p className="mt-8 text-sm leading-5 text-stone-600">
        Select Edit on any menu item to update its details and customizations.
      </p>
    </aside>
  );
}

export default function AdminDashboard() {
  const { categories, createCategory, createMenuItem, menuItems, updateMenuItem } =
    useMenu();
  const [editorMode, setEditorMode] = useState<EditorMode>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [itemDraft, setItemDraft] = useState<ItemDraft>(emptyItemDraft);
  const [categoryDraft, setCategoryDraft] = useState("");
  const [error, setError] = useState("");
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null);

  const groupedItems = useMemo(
    () =>
      categories.map((category) => ({
        category,
        items: menuItems.filter((item) => item.category === category),
      })),
    [categories, menuItems],
  );

  function openNewItem() {
    setError("");
    setEditingId(null);
    setItemDraft(emptyItemDraft());
    setEditorMode("item");
  }

  function openEditItem(item: MenuItem) {
    setError("");
    setEditingId(item.id);
    setItemDraft(draftFromItem(item));
    setEditorMode("item");
  }

  function openNewCategory() {
    setError("");
    setCategoryDraft("");
    setEditorMode("category");
  }

  function closeEditor() {
    setEditorMode(null);
    setEditingId(null);
    setError("");
  }

  function updateDraft<K extends keyof ItemDraft>(field: K, value: ItemDraft[K]) {
    setItemDraft((current) => ({ ...current, [field]: value }));
  }

  function updateCustomization(
    id: string,
    field: "name" | "price",
    value: string,
  ) {
    setItemDraft((current) => ({
      ...current,
      customizationOptions: current.customizationOptions.map((option) =>
        option.id === id ? { ...option, [field]: value } : option,
      ),
    }));
  }

  function saveItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = itemDraft.name.trim();
    const trimmedDescription = itemDraft.description.trim();
    const trimmedImageUrl = itemDraft.imageUrl.trim();
    const price = Number(itemDraft.price);

    if (
      !trimmedName ||
      !trimmedDescription ||
      !trimmedImageUrl ||
      !itemDraft.category ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      setError("Complete the required fields and enter a valid price.");
      return;
    }

    const customizationOptions: CustomizationOption[] = itemDraft.customizationOptions
      .map((option) => ({
        id: option.id,
        name: option.name.trim(),
        price: Number(option.price),
      }))
      .filter(
        (option) =>
          option.name.length > 0 && Number.isFinite(option.price) && option.price > 0,
      );

    const item = {
      name: trimmedName,
      description: trimmedDescription,
      imageUrl: trimmedImageUrl,
      price,
      category: itemDraft.category,
      isVegetarian: itemDraft.isVegetarian,
      isBestseller: itemDraft.isBestseller,
      customizationOptions,
    };

    if (editingId) {
      updateMenuItem({ ...item, id: editingId });
    } else {
      createMenuItem(item);
    }

    closeEditor();
  }

  function saveCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = categoryDraft.trim();

    if (!name) {
      setError("Enter a category name.");
      return;
    }

    if (categories.some((category) => category.toLowerCase() === name.toLowerCase())) {
      setError("That category already exists.");
      return;
    }

    createCategory(name);
    closeEditor();
  }

  return (
    <main className="min-h-screen bg-stone-100 font-inter text-stone-950">
      <header className="flex items-center justify-between border-b border-stone-200 bg-white px-4 py-4 lg:hidden">
        <div>
          <p className="font-garamond text-2xl">Cafe Sonder</p>
          <p className="text-xs text-stone-600">Menu customization</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMobilePanel("navigation")}
            className="cursor-pointer rounded-md border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-800"
          >
            Menu
          </button>
          <button
            type="button"
            onClick={() => setMobilePanel("actions")}
            className="cursor-pointer rounded-md bg-stone-950 px-3 py-2 text-sm font-semibold text-white"
          >
            Tools
          </button>
        </div>
      </header>

      <div className="mx-auto min-h-screen max-w-[1600px] lg:grid lg:grid-cols-[190px_210px_minmax(0,1fr)]">
        <div className="hidden lg:block">
          <PrimarySidebar />
        </div>
        <div className="hidden lg:block">
          <OptionsSidebar onAddItem={openNewItem} onAddCategory={openNewCategory} />
        </div>

        <section className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-stone-600">Admin dashboard</p>
              <h1 className="mt-1 font-garamond text-4xl font-medium">
                Menu customization
              </h1>
            </div>
            <p className="hidden text-right text-sm text-stone-600 sm:block">
              {menuItems.length} {menuItems.length === 1 ? "item" : "items"}
              <br />
              {categories.length} {categories.length === 1 ? "category" : "categories"}
            </p>
          </div>

          <div className="space-y-5">
            {groupedItems.map(({ category, items }) => (
              <section key={category} className="overflow-hidden rounded-lg border border-stone-200 bg-white">
                <header className="flex items-center justify-between border-b border-stone-200 px-4 py-3 sm:px-5">
                  <h2 className="font-garamond text-2xl font-medium">{category}</h2>
                  <span className="text-xs text-stone-600">
                    {items.length} {items.length === 1 ? "item" : "items"}
                  </span>
                </header>
                {items.length > 0 ? (
                  <div className="divide-y divide-stone-200">
                    {items.map((item) => (
                      <article key={item.id} className="flex items-center gap-4 px-4 py-4 sm:px-5">
                        <div
                          role="img"
                          aria-label={item.name}
                          className="size-16 shrink-0 rounded-md bg-stone-100 bg-cover bg-center"
                          style={{ backgroundImage: `url(${item.imageUrl})` }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-stone-950">{item.name}</h3>
                            {item.isBestseller && (
                              <span className="text-xs font-medium text-amber-700">★ Bestseller</span>
                            )}
                          </div>
                          <p className="mt-1 line-clamp-2 text-sm text-stone-600">
                            {item.description}
                          </p>
                          <p className="mt-1 text-sm font-semibold">₹{item.price}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => openEditItem(item)}
                          className="cursor-pointer rounded-md border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-800 transition hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2"
                        >
                          Edit
                        </button>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="px-4 py-5 text-sm text-stone-600 sm:px-5">
                    No items in this category yet.
                  </p>
                )}
              </section>
            ))}
          </div>
        </section>
      </div>

      {mobilePanel && (
        <div className="fixed inset-0 z-40 bg-stone-950/40 lg:hidden" onClick={() => setMobilePanel(null)}>
          <div
            className="h-full w-72 bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-200 px-4 py-4">
              <h2 className="font-semibold">
                {mobilePanel === "navigation" ? "Navigation" : "Menu tools"}
              </h2>
              <button
                type="button"
                onClick={() => setMobilePanel(null)}
                className="size-8 cursor-pointer rounded-md text-xl text-stone-500 hover:bg-stone-100"
                aria-label="Close panel"
              >
                ×
              </button>
            </div>
            {mobilePanel === "navigation" ? (
              <PrimarySidebar onNavigate={() => setMobilePanel(null)} />
            ) : (
              <OptionsSidebar
                onAddItem={openNewItem}
                onAddCategory={openNewCategory}
                onNavigate={() => setMobilePanel(null)}
              />
            )}
          </div>
        </div>
      )}

      {editorMode && (
        <div className="fixed inset-0 z-50 flex justify-end bg-stone-950/40" onClick={closeEditor}>
          <aside
            className="h-full w-full max-w-xl overflow-y-auto bg-white px-5 py-6 shadow-xl sm:px-7"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-stone-200 pb-4">
              <div>
                <p className="text-sm font-medium text-stone-600">Menu tools</p>
                <h2 className="mt-1 font-garamond text-3xl font-medium">
                  {editorMode === "item"
                    ? editingId
                      ? "Edit menu item"
                      : "Add menu item"
                    : "Add category"}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeEditor}
                aria-label="Close editor"
                className="size-8 cursor-pointer rounded-md text-xl text-stone-500 hover:bg-stone-100"
              >
                ×
              </button>
            </div>

            {editorMode === "category" ? (
              <form onSubmit={saveCategory} className="mt-6 space-y-5">
                <label className="block text-sm font-medium text-stone-800">
                  Category name
                  <input
                    value={categoryDraft}
                    onChange={(event) => setCategoryDraft(event.target.value)}
                    autoFocus
                    className="mt-1.5 block w-full rounded-md border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-stone-700 focus:ring-2 focus:ring-stone-400 focus:ring-offset-1"
                  />
                </label>
                {error && <p className="text-sm text-red-700">{error}</p>}
                <EditorActions onCancel={closeEditor} submitLabel="Add category" />
              </form>
            ) : (
              <form onSubmit={saveItem} className="mt-6 space-y-5">
                <TextField label="Name" value={itemDraft.name} onChange={(value) => updateDraft("name", value)} required />
                <TextAreaField label="Description" value={itemDraft.description} onChange={(value) => updateDraft("description", value)} required />
                <TextField label="Image URL" value={itemDraft.imageUrl} onChange={(value) => updateDraft("imageUrl", value)} required />
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField label="Price" type="number" min="0.01" step="0.01" value={itemDraft.price} onChange={(value) => updateDraft("price", value)} required />
                  <label className="block text-sm font-medium text-stone-800">
                    Category
                    <select
                      value={itemDraft.category}
                      onChange={(event) => updateDraft("category", event.target.value)}
                      className="mt-1.5 block w-full rounded-md border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-stone-700 focus:ring-2 focus:ring-stone-400 focus:ring-offset-1"
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                    </select>
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <ToggleField label="Vegetarian" checked={itemDraft.isVegetarian} onChange={(value) => updateDraft("isVegetarian", value)} />
                  <ToggleField label="Bestseller" checked={itemDraft.isBestseller} onChange={(value) => updateDraft("isBestseller", value)} />
                </div>
                <fieldset>
                  <legend className="text-sm font-semibold text-stone-900">Customizations</legend>
                  <p className="mt-1 text-xs text-stone-600">Blank or invalid rows will not be saved.</p>
                  <div className="mt-3 space-y-2">
                    {itemDraft.customizationOptions.map((option) => (
                      <div key={option.id} className="grid grid-cols-[1fr_100px_auto] items-end gap-2">
                        <TextField label="Name" value={option.name} onChange={(value) => updateCustomization(option.id, "name", value)} />
                        <TextField label="Price" type="number" min="0.01" step="0.01" value={option.price} onChange={(value) => updateCustomization(option.id, "price", value)} />
                        <button
                          type="button"
                          onClick={() => setItemDraft((current) => ({ ...current, customizationOptions: current.customizationOptions.filter((entry) => entry.id !== option.id) }))}
                          className="mb-0.5 size-10 cursor-pointer rounded-md text-lg text-stone-500 hover:bg-stone-100"
                          aria-label="Remove customization"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setItemDraft((current) => ({ ...current, customizationOptions: [...current.customizationOptions, { id: createDraftId(), name: "", price: "" }] }))}
                    className="mt-3 cursor-pointer text-sm font-semibold text-stone-700 underline decoration-stone-300 underline-offset-4 hover:text-stone-950"
                  >
                    + Add customization
                  </button>
                </fieldset>
                {error && <p className="text-sm text-red-700">{error}</p>}
                <EditorActions onCancel={closeEditor} submitLabel={editingId ? "Save changes" : "Add item"} />
              </form>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  min,
  step,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  min?: string;
  step?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-medium text-stone-800">
      {label}
      <input
        type={type}
        value={value}
        min={min}
        step={step}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 block w-full rounded-md border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-stone-700 focus:ring-2 focus:ring-stone-400 focus:ring-offset-1"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-medium text-stone-800">
      {label}
      <textarea
        value={value}
        required={required}
        rows={3}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 block w-full resize-y rounded-md border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-stone-700 focus:ring-2 focus:ring-stone-400 focus:ring-offset-1"
      />
    </label>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-md border border-stone-200 px-3 py-3 text-sm font-medium text-stone-800">
      {label}
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 cursor-pointer accent-stone-950"
      />
    </label>
  );
}

function EditorActions({
  onCancel,
  submitLabel,
}: {
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-stone-200 pt-5">
      <button
        type="button"
        onClick={onCancel}
        className="cursor-pointer rounded-md px-3 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100"
      >
        Cancel
      </button>
      <button
        type="submit"
        className="cursor-pointer rounded-md bg-stone-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-800"
      >
        {submitLabel}
      </button>
    </div>
  );
}
