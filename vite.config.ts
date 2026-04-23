import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "Gastitos — Subscriptions",
        short_name: "Gastitos",
        description:
          "A quiet, elegant tracker for every subscription you pay for.",
        theme_color: "#0b0906",
        background_color: "#0b0906",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          {
            src: "/icons/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "/icons/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        mode: "development",
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/img\.logo\.dev\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "logo-dev-cache",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /^https:\/\/api\.exchangerate\.host\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "fx-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 6 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(gstatic|googleapis)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
});
