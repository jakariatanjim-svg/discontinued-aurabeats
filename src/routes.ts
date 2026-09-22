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
  | `playlist:${string}`;

export interface RouteMeta {
  key: RouteKey;
  label: string;
}

/* ------------------------- hash-based deep links ------------------------- *
 * The whole app is one self-contained index.html, so section URLs live in the
 * fragment: #/  #/search  #/radio  #/library  #/favorites  #/history
 * #/settings  #/about  #/playlist/<id>
 * Fragments never hit the network — one file serves everything, and audit /
 * sharing tools can still deep-link any section directly.
 * ------------------------------------------------------------------------ */

export function routeToHash(route: RouteKey): string {
  if (route.startsWith("playlist:")) return `#/playlist/${route.slice("playlist:".length)}`;
  return route === "home" ? "#/" : `#/${route}`;
}

export function hashToRoute(hash: string): RouteKey {
  const clean = hash.replace(/^#\/?/, "").replace(/\/+$/, "");
  if (!clean) return "home";
  if (clean.startsWith("playlist/")) {
    const id = clean.slice("playlist/".length);
    return id ? (`playlist:${id}` as RouteKey) : "library";
  }
  const valid = ["home", "search", "radio", "library", "favorites", "history", "settings", "about"] as const;
  return (valid as readonly string[]).includes(clean) ? (clean as RouteKey) : "home";
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
    default:
      return "AuraBeats";
  }
}
