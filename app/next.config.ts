import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ejvjzejlxmqxbulrcrgo.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Ensure trailing slash consistency
  trailingSlash: false,
};

export default nextConfig;
