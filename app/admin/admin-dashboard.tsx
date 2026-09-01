"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { PrimarySidebar } from "./admin-sidebar";
import { useMenu } from "../menu-context/menu-context";
import type { CustomizationOption, MenuItem } from "../data";

type EditorMode = "item" | "category" | null;
type MobilePanel = "navigation" | "actions" | null;
type ImportStatus =
  | "idle"
  | "selected"
  | "preparing"
  | "parsing"
  | "review"
  | "importing"
  | "error";

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

type ImportedItemDraft = ItemDraft & {
  id: string;
  selected: boolean;
  reviewFields: string[];
};

type ParsedImportItem = {
  name: string;
  description: string;
  price: number | null;
  category: string;
  isVegetarian: boolean;
  isBestseller: boolean;
  imageUrl: string;
  customizationOptions: Array<{
    name: string;
    price: number | null;
  }>;
};

const MAX_IMPORT_PAGES = 5;
const MAX_IMPORT_IMAGE_SIZE = 1536 * 1024;
const MAX_IMPORT_DOCX_SIZE = 8 * 1024 * 1024;
const DEFAULT_IMPORT_IMAGE_URL =
  "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=320&q=80";

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

function OptionsSidebar({
  onAddItem,
  onAddCategory,
  onUploadMenu,
  onNavigate,
}: {
  onAddItem: () => void;
  onAddCategory: () => void;
  onUploadMenu: () => void;
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
        <button
          type="button"
          onClick={() => {
            onUploadMenu();
            onNavigate?.();
          }}
          className="flex w-full cursor-pointer items-center justify-between rounded-md border border-stone-300 px-3 py-2.5 text-left text-sm font-semibold text-stone-900 transition hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2"
        >
          Upload menu
          <span aria-hidden="true" className="text-lg leading-none text-stone-500">
            ↑
          </span>
        </button>
      </div>
      <p className="mt-8 text-sm leading-5 text-stone-600">
        Select Edit on any menu item to update details, or upload a menu to import
        several items at once.
      </p>
    </aside>
  );
}

async function canvasToSizedJpegDataUrl(canvas: HTMLCanvasElement) {
  let quality = 0.68;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);

  while (dataUrl.length > MAX_IMPORT_IMAGE_SIZE && quality > 0.34) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }

  return dataUrl;
}

async function imageFileToDataUrl(file: File) {
  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  image.src = objectUrl;

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("This image could not be opened."));
  });

  const maxSide = 1200;
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser could not prepare the menu image.");

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(objectUrl);
  return canvasToSizedJpegDataUrl(canvas);
}

async function pdfFileToDataUrls(file: File) {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url,
  ).toString();

  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data }).promise;
  const pageCount = Math.min(pdf.numPages, MAX_IMPORT_PAGES);
  const images: string[] = [];

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.25 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser could not prepare the PDF page.");

    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    await page.render({ canvas, canvasContext: context, viewport }).promise;
    images.push(await canvasToSizedJpegDataUrl(canvas));
  }

  return images;
}

async function fileToMenuImages(file: File) {
  if (file.type === "application/pdf") return pdfFileToDataUrls(file);
  if (file.type.startsWith("image/")) return [await imageFileToDataUrl(file)];

  throw new Error("Upload a PDF, DOCX, or image file.");
}

function isDocxFile(file: File) {
  return (
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.toLowerCase().endsWith(".docx")
  );
}

async function docxFileToDataUrl(file: File) {
  if (file.size > MAX_IMPORT_DOCX_SIZE) {
    throw new Error("Upload a DOCX file under 8 MB.");
  }

  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${btoa(
    binary,
  )}`;
}

function importedDraftFromParsed(item: ParsedImportItem): ImportedItemDraft {
  const reviewFields: string[] = [];
  const description = item.description.trim();
  const category = item.category.trim() || "Imported";
  const imageUrl = item.imageUrl.trim() || DEFAULT_IMPORT_IMAGE_URL;
  const price = item.price && item.price > 0 ? String(item.price) : "";

  if (!description) reviewFields.push("Description");
  if (!item.category.trim()) reviewFields.push("Category");
  if (!item.imageUrl.trim()) reviewFields.push("Image");
  if (!price) reviewFields.push("Price");

  return {
    id: createDraftId(),
    selected: Boolean(item.name.trim() && price),
    reviewFields,
    name: item.name.trim(),
    description,
    imageUrl,
    price,
    category,
    isVegetarian: item.isVegetarian,
    isBestseller: item.isBestseller,
    customizationOptions: item.customizationOptions.map((option) => ({
      id: createDraftId(),
      name: option.name.trim(),
      price: option.price && option.price > 0 ? String(option.price) : "",
    })),
  };
}

function labelForField(field: keyof ItemDraft) {
  if (field === "imageUrl") return "Image";
  return field.charAt(0).toUpperCase() + field.slice(1);
}

function isImportDraftValid(item: ImportedItemDraft) {
  const price = Number(item.price);
  return (
    item.name.trim().length > 0 &&
    item.description.trim().length > 0 &&
    item.imageUrl.trim().length > 0 &&
    item.category.trim().length > 0 &&
    Number.isFinite(price) &&
    price > 0
  );
}

function ImportPanel({
  fileName,
  status,
  error,
  importedItems,
  onClose,
  onRetry,
  onImport,
  onToggleItem,
  onRemoveItem,
  onUpdateItem,
  onUpdateCustomization,
}: {
  fileName: string;
  status: ImportStatus;
  error: string;
  importedItems: ImportedItemDraft[];
  onClose: () => void;
  onRetry: () => void;
  onImport: () => void;
  onToggleItem: (id: string, selected: boolean) => void;
  onRemoveItem: (id: string) => void;
  onUpdateItem: <K extends keyof ItemDraft>(
    id: string,
    field: K,
    value: ItemDraft[K],
  ) => void;
  onUpdateCustomization: (
    itemId: string,
    optionId: string,
    field: "name" | "price",
    value: string,
  ) => void;
}) {
  const selectedCount = importedItems.filter((item) => item.selected).length;
  const isBusy = status === "preparing" || status === "parsing" || status === "importing";
  const statusLabel =
    status === "selected"
      ? "File selected"
      : status === "preparing"
        ? "Preparing pages"
        : status === "parsing"
          ? "Parsing menu"
          : status === "importing"
            ? "Importing items"
            : status === "error"
              ? "Import needs attention"
              : "Review parsed items";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-stone-950/40" onClick={onClose}>
      <aside
        className="h-full w-full max-w-4xl overflow-y-auto bg-white px-5 py-6 shadow-xl sm:px-7"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-stone-200 pb-4">
          <div>
            <p className="text-sm font-medium text-stone-600">Menu import</p>
            <h2 className="mt-1 font-garamond text-3xl font-medium">
              Upload menu
            </h2>
            {fileName && (
              <p className="mt-1 text-sm text-stone-600">
                {statusLabel}: {fileName}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close import panel"
            className="size-8 cursor-pointer rounded-md text-xl text-stone-500 hover:bg-stone-100"
          >
            ×
          </button>
        </div>

        <div className="mt-6">
          {isBusy && (
            <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-4">
              <p className="text-sm font-semibold text-stone-900">{statusLabel}</p>
              <p className="mt-1 text-sm text-stone-600">
                Keep this panel open while the menu is prepared for review.
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-4">
              <p className="text-sm font-semibold text-red-900">Menu import failed</p>
              <p className="mt-1 text-sm text-red-800">{error}</p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-4 cursor-pointer rounded-md bg-stone-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-800"
              >
                Choose another file
              </button>
            </div>
          )}

          {status === "review" && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-stone-900">
                    {importedItems.length} parsed{" "}
                    {importedItems.length === 1 ? "item" : "items"}
                  </p>
                  <p className="mt-1 text-sm text-stone-600">
                    Review inferred fields before adding selected rows to the menu.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onRetry}
                    className="cursor-pointer rounded-md border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-50"
                  >
                    Replace file
                  </button>
                  <button
                    type="button"
                    onClick={onImport}
                    className="cursor-pointer rounded-md bg-stone-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
                    disabled={selectedCount === 0}
                  >
                    Import {selectedCount} selected
                  </button>
                </div>
              </div>

              {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

              <div className="mt-5 space-y-4">
                {importedItems.map((item) => {
                  const isValid = isImportDraftValid(item);

                  return (
                    <article
                      key={item.id}
                      className="rounded-lg border border-stone-200 bg-white p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-stone-900">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={(event) =>
                              onToggleItem(item.id, event.target.checked)
                            }
                            className="size-4 cursor-pointer accent-stone-950"
                          />
                          Import this item
                        </label>
                        <div className="flex items-center gap-2">
                          {!isValid && (
                            <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                              Needs review
                            </span>
                          )}
                          {item.reviewFields.length > 0 && (
                            <span className="text-xs text-stone-600">
                              Check {item.reviewFields.join(", ")}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => onRemoveItem(item.id)}
                            className="cursor-pointer rounded-md px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr_120px]">
                        <TextField
                          label="Name"
                          value={item.name}
                          onChange={(value) => onUpdateItem(item.id, "name", value)}
                          required
                        />
                        <TextField
                          label="Category"
                          value={item.category}
                          onChange={(value) => onUpdateItem(item.id, "category", value)}
                          required
                        />
                        <TextField
                          label="Price"
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={item.price}
                          onChange={(value) => onUpdateItem(item.id, "price", value)}
                          required
                        />
                      </div>

                      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_220px]">
                        <TextAreaField
                          label="Description"
                          value={item.description}
                          onChange={(value) =>
                            onUpdateItem(item.id, "description", value)
                          }
                          required
                        />
                        <TextField
                          label="Image URL"
                          value={item.imageUrl}
                          onChange={(value) => onUpdateItem(item.id, "imageUrl", value)}
                          required
                        />
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <ToggleField
                          label="Vegetarian"
                          checked={item.isVegetarian}
                          onChange={(value) =>
                            onUpdateItem(item.id, "isVegetarian", value)
                          }
                        />
                        <ToggleField
                          label="Bestseller"
                          checked={item.isBestseller}
                          onChange={(value) =>
                            onUpdateItem(item.id, "isBestseller", value)
                          }
                        />
                      </div>

                      {item.customizationOptions.length > 0 && (
                        <fieldset className="mt-4">
                          <legend className="text-sm font-semibold text-stone-900">
                            Customizations
                          </legend>
                          <div className="mt-3 space-y-2">
                            {item.customizationOptions.map((option) => (
                              <div
                                key={option.id}
                                className="grid grid-cols-[1fr_120px] gap-2"
                              >
                                <TextField
                                  label="Name"
                                  value={option.name}
                                  onChange={(value) =>
                                    onUpdateCustomization(
                                      item.id,
                                      option.id,
                                      "name",
                                      value,
                                    )
                                  }
                                />
                                <TextField
                                  label="Price"
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  value={option.price}
                                  onChange={(value) =>
                                    onUpdateCustomization(
                                      item.id,
                                      option.id,
                                      "price",
                                      value,
                                    )
                                  }
                                />
                              </div>
                            ))}
                          </div>
                        </fieldset>
                      )}
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

export default function AdminDashboard() {
  const {
    categories,
    createCategory,
    createMenuItem,
    deleteCategory,
    deleteMenuItem,
    importMenuItems,
    menuItems,
    updateMenuItem,
  } = useMenu();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [editorMode, setEditorMode] = useState<EditorMode>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [itemDraft, setItemDraft] = useState<ItemDraft>(emptyItemDraft);
  const [categoryDraft, setCategoryDraft] = useState("");
  const [error, setError] = useState("");
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<ImportStatus>("idle");
  const [importFileName, setImportFileName] = useState("");
  const [importError, setImportError] = useState("");
  const [importedItems, setImportedItems] = useState<ImportedItemDraft[]>([]);

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
    setConfirmDelete(false);
    setEditingId(null);
    setItemDraft(emptyItemDraft());
    setEditorMode("item");
  }

  function openEditItem(item: MenuItem) {
    setError("");
    setConfirmDelete(false);
    setEditingId(item.id);
    setItemDraft(draftFromItem(item));
    setEditorMode("item");
  }

  function openNewCategory() {
    setError("");
    setCategoryDraft("");
    setEditorMode("category");
  }

  function openMenuUpload() {
    closeEditor();
    fileInputRef.current?.click();
  }

  function closeEditor() {
    setEditorMode(null);
    setEditingId(null);
    setConfirmDelete(false);
    setError("");
  }

  function handleDeleteItem() {
    if (!editingId) return;
    deleteMenuItem(editingId);
    closeEditor();
  }

  function requestCategoryDelete(category: string, itemCount: number) {
    if (itemCount > 0) {
      toast.error("Category still has menu items", {
        description: "Move or delete the items in this category before deleting it.",
      });
      return;
    }

    setError("");
    setCategoryToDelete(category);
  }

  function confirmCategoryDelete(category: string) {
    deleteCategory(category);
    setCategoryToDelete(null);
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

  function updateImportedItem<K extends keyof ItemDraft>(
    id: string,
    field: K,
    value: ItemDraft[K],
  ) {
    setImportedItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
              reviewFields: item.reviewFields.filter((entry) => entry !== labelForField(field)),
            }
          : item,
      ),
    );
  }

  function updateImportedCustomization(
    itemId: string,
    optionId: string,
    field: "name" | "price",
    value: string,
  ) {
    setImportedItems((current) =>
      current.map((item) =>
        item.id === itemId
          ? {
              ...item,
              customizationOptions: item.customizationOptions.map((option) =>
                option.id === optionId ? { ...option, [field]: value } : option,
              ),
            }
          : item,
      ),
    );
  }

  async function handleMenuFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setImportFileName(file.name);
    setImportedItems([]);
    setImportError("");
    setImportStatus("selected");

    try {
      setImportStatus("preparing");
      const payload: { document: string } | { images: string[] } = isDocxFile(file)
        ? { document: await docxFileToDataUrl(file) }
        : { images: await fileToMenuImages(file) };

      if (
        "images" in payload &&
        payload.images.some((image) => image.length > MAX_IMPORT_IMAGE_SIZE)
      ) {
        throw new Error("One or more menu pages are still over 1.5 MB after compression.");
      }

      setImportStatus("parsing");
      const response = await fetch("/api/admin/menu-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "This menu could not be parsed.");
      }

      const parsedItems = Array.isArray(result?.items)
        ? (result.items as ParsedImportItem[])
        : [];

      if (parsedItems.length === 0) {
        throw new Error("No menu items were found in that upload.");
      }

      setImportedItems(parsedItems.map(importedDraftFromParsed));
      setImportStatus("review");
      toast.success("Menu parsed", {
        description: `Review ${parsedItems.length} ${
          parsedItems.length === 1 ? "item" : "items"
        } before importing.`,
      });
    } catch (caughtError) {
      setImportError(
        caughtError instanceof Error
          ? caughtError.message
          : "This menu could not be imported.",
      );
      setImportStatus("error");
    }
  }

  function toggleImportedItem(id: string, selected: boolean) {
    setImportedItems((current) =>
      current.map((item) => (item.id === id ? { ...item, selected } : item)),
    );
  }

  function removeImportedItem(id: string) {
    setImportedItems((current) => current.filter((item) => item.id !== id));
  }

  function closeImportPanel() {
    setImportStatus("idle");
    setImportFileName("");
    setImportError("");
    setImportedItems([]);
  }

  function importReviewedItems() {
    const selectedItems = importedItems.filter((item) => item.selected);
    const invalidItems = selectedItems.filter((item) => !isImportDraftValid(item));

    if (selectedItems.length === 0) {
      setImportError("Select at least one parsed item to import.");
      return;
    }

    if (invalidItems.length > 0) {
      setImportError("Complete name, price, category, image, and description for selected items.");
      return;
    }

    setImportStatus("importing");
    const result = importMenuItems(
      selectedItems.map((item) => ({
        name: item.name.trim(),
        description: item.description.trim(),
        imageUrl: item.imageUrl.trim(),
        price: Number(item.price),
        category: item.category.trim(),
        isVegetarian: item.isVegetarian,
        isBestseller: item.isBestseller,
        customizationOptions: item.customizationOptions
          .map((option) => ({
            id: option.id,
            name: option.name.trim(),
            price: Number(option.price),
          }))
          .filter(
            (option) =>
              option.name.length > 0 &&
              Number.isFinite(option.price) &&
              option.price > 0,
          ),
      })),
    );

    toast.success("Menu items imported", {
      description: `${result.itemCount} ${
        result.itemCount === 1 ? "item" : "items"
      } added${
        result.categoryCount > 0
          ? ` with ${result.categoryCount} new ${
              result.categoryCount === 1 ? "category" : "categories"
            }`
          : ""
      }.`,
    });
    closeImportPanel();
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
          <PrimarySidebar activePage="menu" />
        </div>
        <div className="hidden lg:block">
          <OptionsSidebar
            onAddItem={openNewItem}
            onAddCategory={openNewCategory}
            onUploadMenu={openMenuUpload}
          />
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
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-stone-600">
                      {items.length} {items.length === 1 ? "item" : "items"}
                    </span>
                    {categoryToDelete === category ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => confirmCategoryDelete(category)}
                          className="cursor-pointer rounded-md bg-red-700 px-2 py-1 text-xs font-semibold text-white hover:bg-red-800"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setCategoryToDelete(null)}
                          className="cursor-pointer rounded-md px-2 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-100"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => requestCategoryDelete(category, items.length)}
                        className="cursor-pointer rounded-md px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    )}
                  </div>
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
          {error && <p className="text-sm text-red-700">{error}</p>}
        </section>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={handleMenuFileChange}
      />

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
              <PrimarySidebar activePage="menu" onNavigate={() => setMobilePanel(null)} />
            ) : (
              <OptionsSidebar
                onAddItem={openNewItem}
                onAddCategory={openNewCategory}
                onUploadMenu={openMenuUpload}
                onNavigate={() => setMobilePanel(null)}
              />
            )}
          </div>
        </div>
      )}

      {importStatus !== "idle" && (
        <ImportPanel
          fileName={importFileName}
          status={importStatus}
          error={importError}
          importedItems={importedItems}
          onClose={closeImportPanel}
          onRetry={openMenuUpload}
          onImport={importReviewedItems}
          onToggleItem={toggleImportedItem}
          onRemoveItem={removeImportedItem}
          onUpdateItem={updateImportedItem}
          onUpdateCustomization={updateImportedCustomization}
        />
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
                {editingId && (
                  <div className="border-t border-red-100 pt-5">
                    {!confirmDelete ? (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        className="cursor-pointer rounded-md px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2"
                      >
                        Delete item
                      </button>
                    ) : (
                      <div className="rounded-md border border-red-200 bg-red-50 p-3">
                        <p className="text-sm font-medium text-red-900">
                          Delete this menu item permanently?
                        </p>
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(false)}
                            className="cursor-pointer rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-red-100"
                          >
                            Keep item
                          </button>
                          <button
                            type="button"
                            onClick={handleDeleteItem}
                            className="cursor-pointer rounded-md bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800"
                          >
                            Delete permanently
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
