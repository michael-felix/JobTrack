import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";
import path from "path";

// Plain Vite (no crx bundler plugin): builds popup.html and options.html as a
// small multi-page app, with fixed (non-hashed) output filenames so
// manifest.json can reference them directly, and copies manifest.json +
// icons into dist/ unchanged.
export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [{ src: "manifest.json", dest: "." }],
    }),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, "popup.html"),
        options: path.resolve(__dirname, "options.html"),
      },
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name]-chunk.js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
});
