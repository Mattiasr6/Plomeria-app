import type { NextConfig } from "next";

const nextConfig = {
  cacheComponents: true,
  server: {
    allowedHosts: ["100.107.236.28", "localhost", "0.0.0.0"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "jionoyqmmxxcpvdxgycn.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
