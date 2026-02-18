import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Relative base makes GitHub Pages deployments work even if the repo name changes.
  // (Avoids the classic "blank page" caused by incorrect asset paths.)
  base: "./",
});
