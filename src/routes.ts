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
