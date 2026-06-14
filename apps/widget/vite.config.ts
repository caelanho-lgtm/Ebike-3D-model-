import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          three: ["three", "@react-three/fiber", "@react-three/drei"]
        }
      }
    }
  },
  server: {
    host: "0.0.0.0",
    port: 5173
  }
});
