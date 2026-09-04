import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import "./App.css";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SidebarProvider } from "./contexts/SidebarContext";
import { DataSaverProvider } from "./contexts/DataSaverContext";
import { ConnectivityProvider } from "./lib/resilience/ConnectivityProvider";
import { ConnectivityStatus } from "./components/connectivity/ConnectivityStatus";
import App from "./App.tsx";

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => { void navigator.serviceWorker.register('/sw.js').catch(() => undefined); });
}

createRoot(document.getElementById("root")!).render(
  <DataSaverProvider>
    <ConnectivityProvider>
      <ThemeProvider>
        <SidebarProvider>
          <BrowserRouter>
            <DndProvider backend={HTML5Backend}>
              <App />
              <ConnectivityStatus />
            </DndProvider>
          </BrowserRouter>
        </SidebarProvider>
      </ThemeProvider>
    </ConnectivityProvider>
  </DataSaverProvider>,
);
