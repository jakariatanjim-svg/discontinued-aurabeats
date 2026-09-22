import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// Hide splash immediately before first React paint
const splash = document.getElementById("app-loading");
if (splash) {
  splash.style.opacity = "0";
  splash.style.pointerEvents = "none";
  setTimeout(() => splash.remove(), 400);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
