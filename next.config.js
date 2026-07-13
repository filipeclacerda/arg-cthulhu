/**
 * @format
 * @type {import('next').NextConfig}
 */

const isDesktopBuild = process.env.BUILD_TARGET === "desktop";

const nextConfig = {
  // Playwright uses the loopback hostname for a stable local webServer URL.
  allowedDevOrigins: ["127.0.0.1"],
  ...(isDesktopBuild
    ? {
        output: "export",
        trailingSlash: true,
      }
    : {}),
  images: {
    unoptimized: isDesktopBuild,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "win98icons.alexmeub.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  ...(!isDesktopBuild
    ? {
        async rewrites() {
          return [
            {
              source: "/ingest/static/:path*",
              destination: "https://us-assets.i.posthog.com/static/:path*",
            },
            {
              source: "/ingest/array/:path*",
              destination: "https://us-assets.i.posthog.com/array/:path*",
            },
            {
              source: "/ingest/:path*",
              destination: "https://us.i.posthog.com/:path*",
            },
          ];
        },
      }
    : {}),
  skipTrailingSlashRedirect: true,
};

module.exports = nextConfig;
