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
  
  // Environment variables
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '1.0.0',
    NEXT_PUBLIC_BUILD_DATE: new Date().toISOString(),
    NEXT_PUBLIC_NODE_VERSION: process.version,
  },
};

export default nextConfig;
