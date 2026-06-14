/** @typedef {"dashboard" | "build" | "home" | "archive" | "history" | "settings"} AppView */

/** @type {Array<{ id: AppView, label: string, icon: string }>} */
export const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "📋" },
  { id: "build", label: "Build Mode", icon: "🔨" },
  { id: "home", label: "My Home", icon: "🏠" },
  { id: "archive", label: "Homes Archive", icon: "🗂" },
  { id: "history", label: "History", icon: "📜" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];
