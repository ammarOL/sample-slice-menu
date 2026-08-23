"use client";

import Link from "next/link";
import { logoutAdmin } from "./actions";

export type AdminPage = "menu" | "orders" | "qr" | "analytics";

export function PrimarySidebar({
  activePage,
  onNavigate,
}: {
  activePage: AdminPage;
  onNavigate?: () => void;
}) {
  const linkClass = (page: AdminPage) =>
    `flex w-full cursor-pointer items-center rounded-md px-3 py-2.5 text-left text-sm font-semibold transition ${
      activePage === page
        ? "bg-white/10 text-white"
        : "text-stone-400 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <aside className="flex h-full flex-col border-stone-200 bg-stone-950 p-4 text-white lg:border-r">
      <div>
        <p className="font-garamond text-2xl">Cafe Sonder</p>
        <p className="mt-1 text-xs text-stone-400">Administration</p>
      </div>
      <nav className="mt-8 space-y-1" aria-label="Admin navigation">
        <Link href="/admin" onClick={onNavigate} className={linkClass("menu")}>
          Menu customization
        </Link>
        <Link href="/admin/orders" onClick={onNavigate} className={linkClass("orders")}>
          Orders
        </Link>
        <Link href="/admin/qr" onClick={onNavigate} className={linkClass("qr")}>
          QR code
        </Link>
        <Link href="/admin/analytics" onClick={onNavigate} className={linkClass("analytics")}>
          Analytics
        </Link>
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
