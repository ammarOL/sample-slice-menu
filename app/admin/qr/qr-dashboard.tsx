"use client";

import QRCode from "qrcode";
import Image from "next/image";
import { startTransition, useEffect, useState } from "react";
import { PrimarySidebar } from "../admin-sidebar";

const QR_LINK_STORAGE_KEY = "airmenus_qr_link_v1";

function defaultMenuLink() {
  return `${window.location.origin}/menu`;
}

function validateLink(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) return "Enter a link to generate a QR code.";

  try {
    const url = new URL(trimmedValue);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "Use an http:// or https:// link.";
    }
  } catch {
    return "Enter a valid link, including http:// or https://.";
  }

  return "";
}

export default function QrDashboard() {
  const [link, setLink] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const savedLink = window.localStorage.getItem(QR_LINK_STORAGE_KEY);
    startTransition(() => {
      setLink(savedLink || defaultMenuLink());
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    window.localStorage.setItem(QR_LINK_STORAGE_KEY, link);
    const validationError = validateLink(link);

    if (validationError) {
      startTransition(() => setQrDataUrl(""));
      return;
    }

    let cancelled = false;
    QRCode.toDataURL(link.trim(), {
      width: 360,
      margin: 2,
      errorCorrectionLevel: "M",
    }).then((dataUrl) => {
      if (!cancelled) setQrDataUrl(dataUrl);
    }).catch(() => {
      if (!cancelled) {
        setQrDataUrl("");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [hydrated, link]);

  return (
    <main className="min-h-screen bg-stone-100 font-inter text-stone-950">
      <header className="flex items-center justify-between border-b border-stone-200 bg-white px-4 py-4 lg:hidden">
        <div>
          <p className="font-garamond text-2xl">Cafe Sonder</p>
          <p className="text-xs text-stone-600">QR code</p>
        </div>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("toggle-admin-navigation"))}
          className="cursor-pointer rounded-md border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-800"
        >
          Menu
        </button>
      </header>

      <div className="mx-auto min-h-screen max-w-[1600px] lg:grid lg:grid-cols-[190px_minmax(0,1fr)]">
        <div className="hidden lg:block">
          <PrimarySidebar activePage="qr" />
        </div>
        <QrContent
          link={link}
          setLink={setLink}
          error={hydrated ? validateLink(link) : ""}
          qrDataUrl={qrDataUrl}
        />
      </div>

      <MobileNavigation />
    </main>
  );
}

function QrContent({
  link,
  setLink,
  error,
  qrDataUrl,
}: {
  link: string;
  setLink: (value: string) => void;
  error: string;
  qrDataUrl: string;
}) {
  return (
    <section className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-medium text-stone-600">Admin dashboard</p>
        <h1 className="mt-1 font-garamond text-4xl font-medium">QR code</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600">
          Create a scannable code for your cafe menu or any other customer-facing link.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-stone-200 bg-white p-5 sm:p-6">
          <label className="block text-sm font-semibold text-stone-900" htmlFor="qr-link">
            Link to encode
          </label>
          <input
            id="qr-link"
            type="url"
            value={link}
            onChange={(event) => setLink(event.target.value)}
            placeholder="https://example.com/menu"
            className="mt-2 block w-full rounded-md border border-stone-300 px-3 py-3 text-sm outline-none transition focus:border-stone-700 focus:ring-2 focus:ring-stone-400 focus:ring-offset-1"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "qr-link-error" : "qr-link-help"}
          />
          {error ? (
            <p id="qr-link-error" className="mt-2 text-sm text-red-700">
              {error}
            </p>
          ) : (
            <p id="qr-link-help" className="mt-2 text-sm text-stone-600">
              Customers will open this link after scanning the code.
            </p>
          )}
        </section>

        <section className="flex flex-col items-center rounded-lg border border-stone-200 bg-white p-5 sm:p-6">
          <div className="flex min-h-[360px] w-full items-center justify-center rounded-md bg-stone-50 p-4">
            {qrDataUrl ? (
              <Image
                src={qrDataUrl}
                alt={`QR code for ${link}`}
                width={320}
                height={320}
                unoptimized
                className="size-full max-w-[320px] object-contain"
              />
            ) : (
              <p className="max-w-[220px] text-center text-sm leading-6 text-stone-600">
                Enter a valid link to see its QR code.
              </p>
            )}
          </div>
          <a
            href={qrDataUrl || undefined}
            download="cafe-menu-qr-code.png"
            aria-disabled={!qrDataUrl}
            className={`mt-5 inline-flex w-full cursor-pointer items-center justify-center rounded-md px-4 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2 ${
              qrDataUrl
                ? "bg-stone-950 text-white hover:bg-stone-800"
                : "pointer-events-none bg-stone-200 text-stone-500"
            }`}
          >
            Download QR code
          </a>
        </section>
      </div>
    </section>
  );
}

function MobileNavigation() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const openNavigation = () => setOpen(true);
    window.addEventListener("toggle-admin-navigation", openNavigation);
    return () => window.removeEventListener("toggle-admin-navigation", openNavigation);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 bg-stone-950/40 lg:hidden" onClick={() => setOpen(false)}>
      <div className="h-full w-72" onClick={(event) => event.stopPropagation()}>
        <PrimarySidebar activePage="qr" onNavigate={() => setOpen(false)} />
      </div>
    </div>
  );
}
