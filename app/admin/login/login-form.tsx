"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAdmin } from "../actions";

const initialState = { message: "" };

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAdmin,
    initialState,
  );

  return (
    <main className="flex min-h-screen items-center bg-stone-50 px-4 py-6 font-inter text-stone-950">
      <section className="mx-auto w-full max-w-md rounded-lg border border-stone-200 bg-white px-5 py-6 sm:px-6 sm:py-7">
        <Link
          href="/menu"
          className="inline-flex cursor-pointer items-center text-sm font-medium text-stone-600 transition hover:text-stone-950 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2"
        >
          ← Back to menu
        </Link>
        <div className="mt-6 border-b border-stone-200 pb-5">
          <p className="text-sm font-medium text-stone-600">Cafe Sonder</p>
          <h1 className="mt-1 font-garamond text-3xl font-medium">
            Admin sign in
          </h1>
          <p className="mt-2 text-sm leading-5 text-stone-700">
            Sign in to access the cafe administration area.
          </p>
        </div>

        <form action={formAction} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-stone-800"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              className="mt-1.5 block w-full rounded-md border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-stone-700 focus:ring-2 focus:ring-stone-400 focus:ring-offset-1"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-stone-800"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1.5 block w-full rounded-md border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-stone-700 focus:ring-2 focus:ring-stone-400 focus:ring-offset-1"
            />
          </div>

          {state.message && (
            <p
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
            >
              {state.message}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full cursor-pointer rounded-md bg-stone-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
