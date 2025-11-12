import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',

  // Update images config - 'domains' is deprecated, use 'remotePatterns'
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
    ],
  },

  // Fix for clientReferenceManifest issue
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Ensure proper file tracing
  outputFileTracingIncludes: {
    '/*': ['./public/**/*'],
  },
};

export default nextConfig;