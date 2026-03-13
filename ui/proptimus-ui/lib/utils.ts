export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
export const ALPHA_FIND_URL =
  process.env.NEXT_PUBLIC_ALPHA_FIND_URL ||
  "https://dev.af2.alphafind.dyn.cloud.e-infra.cz";

export async function apiFetch(path: string, options?: RequestInit) {
  const url = path.startsWith("http") ? path : `${API_URL}${path}`;
  return fetch(url, {
    ...options,
    mode: "cors",
    credentials: "omit",
  });
}

export async function alphaFindFetch(path: string, options?: RequestInit) {
  const url = path.startsWith("http") ? path : `${ALPHA_FIND_URL}${path}`;
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options?.headers,
    },
    mode: "cors",
    credentials: "omit",
  });
}

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
