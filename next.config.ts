import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placeholders.io",
      }
    ]
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  allowedDevOrigins: ["*"],
  async headers() {
    const commonHeaders = [
      {
        key: 'Cache-Control',
        value: 'no-cache, no-store, must-revalidate',
      },
      { key: "Pragma", value: "no-cache" },
      { key: "Expires", value: "0" },
      // CSP for iframe embedding - permissive in non-production
      {
        key: 'Content-Security-Policy',
        value: isProduction
          ? "frame-ancestors 'self' https://web.totalum.app https://totalum-frontend-test.web.app http://localhost:8100"
          : "frame-ancestors *",
      },
    ];

    // Add CORS headers for non-production
    if (!isProduction) {
      commonHeaders.push(
        { key: "Access-Control-Allow-Origin", value: "*" },
        { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, PATCH, OPTIONS" },
        { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization, X-Requested-With" },
        { key: "Access-Control-Max-Age", value: "86400" }
      );
    }

    return [
      {
        source: '/:path*',
        headers: commonHeaders,
      },
    ];
  },
};

export default nextConfig;

// added by create cloudflare to enable calling `getCloudflareContext()` in `next dev`
// conditionally initialize based on environment variable
if (process.env.DISABLE_OPENNEXT !== 'true') {
  try {
    const { initOpenNextCloudflareForDev } = require("@opennextjs/cloudflare");
    initOpenNextCloudflareForDev();
  } catch (error) {
    console.warn("OpenNext Cloudflare dev initialization failed:", error instanceof Error ? error.message : String(error));
    console.warn("Falling back to standard Next.js development mode");
  }
}
