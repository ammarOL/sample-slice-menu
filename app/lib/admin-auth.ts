import "server-only";

import { cookies } from "next/headers";

const ADMIN_SESSION_COOKIE = "airmenus_admin_session";
const ADMIN_SESSION_VALUE = "authenticated";
const ADMIN_SESSION_DURATION = 60 * 60 * 8;

// Temporary credentials are intentionally isolated here for an easy migration later.
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "password123";

export type LoginState = {
  message?: string;
};

export function isValidAdminCredentials(
  username: string,
  password: string,
) {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

export async function createAdminSession() {
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_SESSION_COOKIE, ADMIN_SESSION_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_DURATION,
  });
}

export async function hasAdminSession() {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_SESSION_COOKIE)?.value === ADMIN_SESSION_VALUE;
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}
