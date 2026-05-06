import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register service worker for web push (calls, notifications)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// Source code protection (production only)
if (import.meta.env.PROD) {
  // Styled console messages
  const styles = "font-size:16px;font-weight:bold;color:#e11d48;";
  const funStyles = "font-size:14px;color:#6366f1;font-style:italic;";
  console.log("%c🚫 Stop right there!", styles);
  console.log("%cThis browser feature is intended for developers. If someone told you to copy-paste something here, they're trying to scam you.", funStyles);
  console.log("%c🔒 All data is secured server-side. There's nothing useful to find here.", "font-size:12px;color:#64748b;");
  console.log(
    "%c" +
    "   ___  ____  ___ _____ ___ _   _  ___  \n" +
    "  / _ \\|  _ \\|_ _|__  /|_ _| \\ | |/ _ \\ \n" +
    " | | | | |_) || |  / /  | ||  \\| | | | |\n" +
    " | |_| |  _ < | | / /   | || |\\  | |_| |\n" +
    "  \\___/|_| \\_|___/___|  |___|_| \\_|\\___/ \n",
    "color:#e11d48;font-family:monospace;font-size:10px;"
  );

  // Disable right-click context menu
  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });

  // Detect F12 / DevTools shortcuts
  document.addEventListener("keydown", (e) => {
    if (
      e.key === "F12" ||
      (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) ||
      (e.ctrlKey && e.key === "U")
    ) {
      e.preventDefault();
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
