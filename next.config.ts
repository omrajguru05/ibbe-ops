import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Trigger restart for env vars
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tyrfelevhybumxynsahn.supabase.co",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      }
    ],
  },
};

export default nextConfig;
