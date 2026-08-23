"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { menuItems as staticMenuItems } from "../data";
import type { MenuItem } from "../data";
import { normalizeMenuImageUrl } from "../lib/image-url";

const MENU_STORAGE_KEY = "airmenus_menu_v1";
const CATEGORY_STORAGE_KEY = "airmenus_categories_v1";

type NewMenuItem = Omit<MenuItem, "id">;

type MenuContextValue = {
  menuItems: MenuItem[];
  categories: string[];
  hydrated: boolean;
  createMenuItem: (item: NewMenuItem) => void;
  updateMenuItem: (item: MenuItem) => void;
  deleteMenuItem: (id: string) => void;
  createCategory: (name: string) => void;
  deleteCategory: (name: string) => void;
};

const MenuContext = createContext<MenuContextValue | null>(null);

function createStableId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getInitialCategories() {
  return Array.from(new Set(staticMenuItems.map((item) => item.category)));
}

function normalizeMenuItems(items: MenuItem[]) {
  return items.map((item) => ({
    ...item,
    imageUrl: normalizeMenuImageUrl(item.imageUrl),
  }));
}

export function MenuProvider({ children }: { children: ReactNode }) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(staticMenuItems);
  const [categories, setCategories] = useState<string[]>(getInitialCategories);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let savedMenuItems: MenuItem[] | null = null;
    let savedCategoryList: string[] | null = null;

    try {
      const savedItems = window.localStorage.getItem(MENU_STORAGE_KEY);
      const savedCategories = window.localStorage.getItem(CATEGORY_STORAGE_KEY);

      if (savedItems) {
        const parsedItems = JSON.parse(savedItems) as MenuItem[];
        if (Array.isArray(parsedItems)) savedMenuItems = normalizeMenuItems(parsedItems);
      }

      if (savedCategories) {
        const parsedCategories = JSON.parse(savedCategories) as string[];
        if (Array.isArray(parsedCategories)) savedCategoryList = parsedCategories;
      }
    } catch {
      // Fall back to the static menu if browser storage contains invalid data.
    }

    startTransition(() => {
      if (savedMenuItems) setMenuItems(savedMenuItems);
      if (savedCategoryList) setCategories(savedCategoryList);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    window.localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(menuItems));
    window.localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categories));
  }, [categories, hydrated, menuItems]);

  const createMenuItem = useCallback((item: NewMenuItem) => {
    setMenuItems((current) => [
      ...current,
      {
        ...item,
        id: createStableId("menu"),
        imageUrl: normalizeMenuImageUrl(item.imageUrl),
      },
    ]);
  }, []);

  const updateMenuItem = useCallback((item: MenuItem) => {
    setMenuItems((current) =>
      current.map((existing) =>
        existing.id === item.id
          ? { ...item, imageUrl: normalizeMenuImageUrl(item.imageUrl) }
          : existing,
      ),
    );
  }, []);

  const deleteMenuItem = useCallback((id: string) => {
    setMenuItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const createCategory = useCallback((name: string) => {
    setCategories((current) =>
      current.includes(name) ? current : [...current, name],
    );
  }, []);

  const deleteCategory = useCallback((name: string) => {
    setCategories((current) => current.filter((category) => category !== name));
  }, []);

  const value = useMemo(
    () => ({
      menuItems,
      categories,
      hydrated,
      createMenuItem,
      deleteMenuItem,
      deleteCategory,
      updateMenuItem,
      createCategory,
    }),
    [
      categories,
      createCategory,
      createMenuItem,
      deleteCategory,
      deleteMenuItem,
      hydrated,
      menuItems,
      updateMenuItem,
    ],
  );

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenu() {
  const context = useContext(MenuContext);

  if (!context) throw new Error("useMenu must be used within MenuProvider");

  return context;
}
