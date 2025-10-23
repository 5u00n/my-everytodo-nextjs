import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // External packages for server components
  serverExternalPackages: ['firebase'],
  
  // Ensure proper static file handling
  trailingSlash: false,
  
  // Optimize for production
  compress: true,
  
  // Ensure proper image optimization
  images: {
    unoptimized: false,
  },
};

export default nextConfig;
