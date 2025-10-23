import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable experimental features for better compatibility
  experimental: {
    // Enable server components
    serverComponentsExternalPackages: ['firebase'],
  },
  
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
