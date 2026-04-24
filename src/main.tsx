import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import App from "./App";
import "./index.css";
import { DemoModeProvider } from "./lib/demoMode";
import { I18nProvider } from "./lib/i18n";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <DemoModeProvider>
        <I18nProvider>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/demo" element={<App />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </I18nProvider>
      </DemoModeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
