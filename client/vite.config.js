import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5050",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "http://localhost:5050",
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    chunkSizeWarningLimit: 2400,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/three") || id.includes("node_modules/react-globe.gl") || id.includes("node_modules/globe.gl") || id.includes("node_modules/three-globe")) {
            return "globe-engine";
          }
          if (id.includes("node_modules/framer-motion")) {
            return "motion";
          }
        },
      },
    },
  },
});
