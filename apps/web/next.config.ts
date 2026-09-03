import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Keep module resolution scoped to this app even though a stray
    // lockfile elsewhere on the machine would otherwise confuse root detection.
    root: __dirname,
  },
};

export default nextConfig;
