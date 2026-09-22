/**
 * Canonical list of clean (History API) section paths.
 * Single source of truth — gen-redirects.mjs reads this exact file at build
 * time to generate public/_redirects, so the host fallback can never drift
 * out of sync with the router.
 */
export const CLEAN_PATHS: string[] = [
  "/home",
  "/search",
  "/radio",
  "/library",
  "/favorites",
  "/history",
  "/settings",
  "/about",
];
