import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this app's own directory — the monorepo has
  // a root-level package-lock.json (for `npm run dev` orchestration) that
  // otherwise makes Turbopack misdetect the root.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
