import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "./src/shared"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        // 本地開發預設代理到本機後端
        // Docker / Railway 環境由 Nginx 或 VITE_API_URL 接管
        target: process.env.VITE_API_URL ?? "http://127.0.0.1:8080",
        changeOrigin: true,
      },
    },
  },
  build: {
    // 輸出目錄（Nginx 會 serve 這裡）
    outDir: "dist",
    sourcemap: false,
  },
});
