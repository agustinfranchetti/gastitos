import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import App from "./App";
import { DesktopPhoneFrame } from "./components/DesktopPhoneFrame";
import "./index.css";
import { DemoModeProvider } from "./lib/demoMode";
import { I18nProvider } from "./lib/i18n";

function AppInFrame() {
  return (
    <DesktopPhoneFrame>
      <App />
    </DesktopPhoneFrame>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <DemoModeProvider>
        <I18nProvider>
          <Routes>
            <Route path="/" element={<AppInFrame />} />
            <Route path="/demo" element={<AppInFrame />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </I18nProvider>
      </DemoModeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
