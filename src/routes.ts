/** Route keys are plain strings so playlists can be addressed as `playlist:<id>`. */
export type RouteKey =
  | "home"
  | "search"
  | "radio"
  | "library"
  | "favorites"
  | "history"
  | "settings"
  | "about"
  | "privacy"
  | "downloads"
  | `playlist:${string}`;

export interface RouteMeta {
  key: RouteKey;
  label: string;
}

/* -------------------- clean slash URLs (History API) -------------------- *
 * Sections live on real paths — /home /search /radio /library /favorites
 * /history /settings /about /playlist/<id> — served by ONE index.html thanks
 * to public/_redirects (Cloudflare SPA fallback). Static assets keep working
 * (Cloudflare serves the real file first; the fallback only catches routes
 * that have no matching asset). On file:// (double-click offline) it degrades
 * gracefully to the Discover section without any URL mangling.
 * Deep-linkable, back/forward friendly, and every section can be audited
 * directly as a real path — no hash fragment weirdness.
 * ------------------------------------------------------------------------ */

export function routeToPath(route: RouteKey): string {
  if (route.startsWith("playlist:")) return `/playlist/${route.slice("playlist:".length)}`;
  return route === "home" ? "/home" : `/${route}`;
}

export function pathToRoute(pathname: string): RouteKey {
  const clean = (pathname || "/").replace(/\/+$/, "") || "/";
  if (clean === "/") return "home";
  if (clean.startsWith("/playlist/")) {
    const id = clean.slice("/playlist/".length);
    return id ? (`playlist:${id}` as RouteKey) : "library";
  }
  const key = clean.slice(1);
  const valid: RouteKey[] = ["home", "search", "radio", "library", "favorites", "history", "settings", "about", "privacy", "downloads"];
  return valid.includes(key as RouteKey) ? (key as RouteKey) : "home";
}

export function routeLabel(route: RouteKey): string {
  if (route.startsWith("playlist:")) return "Playlist";
  switch (route) {
    case "home":
      return "Discover";
    case "search":
      return "Search";
    case "radio":
      return "Live Radio";
    case "library":
      return "Your Library";
    case "favorites":
      return "Favourites";
    case "history":
      return "Recently Played";
    case "settings":
      return "Settings";
    case "about":
      return "About AuraBeats";
    case "privacy":
      return "Privacy Policy";
    case "downloads":
      return "Downloads";
    default:
      return "AuraBeats";
  }
}
