export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000" ||
  "http://proptimus.ceitec.cz/api";
console.log("API_URL:", API_URL);

export async function apiFetch(path: string, options?: RequestInit) {
  const url = path.startsWith("http") ? path : `${API_URL}${path}`;
  return fetch(url, {
    ...options,
    mode: "cors",
    credentials: "omit",
  });
}
