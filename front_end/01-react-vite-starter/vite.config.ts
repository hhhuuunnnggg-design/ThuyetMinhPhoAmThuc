import react from "@vitejs/plugin-react-swc";
import dns from "dns";
import path from "path";
import { defineConfig, loadEnv } from "vite";

dns.setDefaultResultOrder("verbatim");

export default defineConfig(({ mode }) => {
  // 👇 load đúng file .env.development
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    server: {
      port: Number(env.VITE_FRONTEND_PORT) || 3000,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      global: "globalThis",
    },
  };
});
