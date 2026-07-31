import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this app's own directory — the monorepo has
  // a root-level package-lock.json (for `npm run dev` orchestration) that
  // otherwise makes Turbopack misdetect the root.
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    // Product images are served by the backend (cross-origin from the
    // frontend's own port) — next/image requires the host allow-listed.
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "6060", pathname: "/static/**" },
    ],
  },
};

export default nextConfig;
