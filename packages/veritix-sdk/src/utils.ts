/**
 * Internal utility functions for the Veritix SDK.
 * @internal
 */

/**
 * Build a URL by joining a base URL with a path and optional query parameters.
 * Handles trailing/leading slashes gracefully.
 */
export function buildUrl(
  baseUrl: string,
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>,
): string {
  const base = baseUrl.replace(/\/+$/, "");
  const cleanPath = path.replace(/^\/+/, "");
  const url = `${base}/${cleanPath}`;

  if (!params) return url;

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }

  const qs = search.toString();
  return qs ? `${url}?${qs}` : url;
}

/**
 * Detect whether we are running in a browser-like environment.
 */
export function isBrowser(): boolean {
  return (
    typeof globalThis !== "undefined" &&
    typeof globalThis.window !== "undefined" &&
    typeof globalThis.document !== "undefined"
  );
}

/**
 * Convert STX (as a number or string) to micro-STX (bigint-safe integer string).
 * 1 STX = 1,000,000 micro-STX.
 *
 * @example
 * stxToMicroStx("1.5") // "1500000"
 * stxToMicroStx(2)      // "2000000"
 */
export function stxToMicroStx(stx: string | number): string {
  const value = typeof stx === "string" ? parseFloat(stx) : stx;
  if (Number.isNaN(value) || value < 0) {
    throw new Error(`Invalid STX amount: ${stx}`);
  }
  // Multiply by 1e6 and round to avoid floating-point issues
  return Math.round(value * 1_000_000).toString();
}

/**
 * Convert micro-STX to STX as a string.
 */
export function microStxToStx(microStx: string | number): string {
  const value = typeof microStx === "string" ? parseInt(microStx, 10) : microStx;
  return (value / 1_000_000).toString();
}
