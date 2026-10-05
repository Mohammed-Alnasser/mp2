import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { copyFileSync } from "node:fs";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: "github-pages-fallback",
      // Pages serves this HTML for direct visits to /mp2/pokemon/25.
      closeBundle() {
        copyFileSync("dist/index.html", "dist/404.html");
      },
    },
  ],
  base: "/mp2/",
});
