import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "graph.facebook.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "platform-lookaside.fbsbx.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.amazonaws.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.cloudfront.net",
        port: "",
        pathname: "/**",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer, dev }) => {
    // Fix for webpack module loading issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false, // Let Node.js handle crypto natively
      stream: false,
      url: false,
      zlib: false,
      http: false,
      https: false,
      assert: false,
      os: false,
      path: false,
    };

    // Ensure crypto module is not bundled
    if (isServer) {
      config.externals = config.externals || [];
      if (typeof config.externals === "function") {
        const originalExternals = config.externals;
        config.externals = (context, request, callback) => {
          if (request === "crypto" || request === "node:crypto") {
            return callback(null, "commonjs crypto");
          }
          return originalExternals(context, request, callback);
        };
      } else if (Array.isArray(config.externals)) {
        config.externals.push("crypto");
        config.externals.push("node:crypto");
      }
    }

    // Ensure proper module resolution
    config.resolve.alias = {
      ...config.resolve.alias,
    };

    // Fix for eval code issues in development
    if (dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            default: {
              minChunks: 1,
              priority: -20,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    return config;
  },
  experimental: {
    // Disable flight client entry loader issues
    clientRouterFilter: false,
    clientRouterFilterRedirects: false,
  },
  serverExternalPackages: [],
};

export default nextConfig;
