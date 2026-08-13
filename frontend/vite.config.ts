import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const frontendRoot = path.dirname(fileURLToPath(import.meta.url));
const lanHttpsEnabled = process.env.DASHFORGE_LAN_HTTPS === "1";
const lanIp = process.env.DASHFORGE_LAN_IP ?? "";
const lanPort = Number(process.env.DASHFORGE_PORT ?? "5173");

function lanServerConfig() {
  if (!lanHttpsEnabled) {
    return {};
  }

  const certificateDirectory = path.join(frontendRoot, ".certs");
  const certificatePath = path.join(
    certificateDirectory,
    "dashforge-lan-cert.pem",
  );
  const keyPath = path.join(certificateDirectory, "dashforge-lan-key.pem");

  if (!fs.existsSync(certificatePath) || !fs.existsSync(keyPath)) {
    throw new Error(
      "LAN HTTPS certificate is missing. Start with `npm run dev:lan` so it can be generated.",
    );
  }

  return {
    allowedHosts: lanIp ? [lanIp] : (true as const),
    host: "0.0.0.0",
    https: {
      cert: fs.readFileSync(certificatePath),
      key: fs.readFileSync(keyPath),
    },
    port: lanPort,
    strictPort: true,
  };
}
export default defineConfig({
  plugins: [react()],
  server: lanServerConfig(),
  build: {
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/echarts")) {
            return "echarts";
          }
          if (id.includes("node_modules/react")) {
            return "react-vendor";
          }
          return undefined;
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});
