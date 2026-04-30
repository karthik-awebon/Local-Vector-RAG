import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Top-level turbopack configuration for Next.js 16+
    turbopack: {
        resolveAlias: {
            "sharp": { browser: "./src/lib/empty.js" },
            "onnxruntime-node": { browser: "./src/lib/empty.js" },
            "fs": { browser: "./src/lib/empty.js" },
            "path": { browser: "./src/lib/empty.js" },
            "url": { browser: "./src/lib/empty.js" },
        },
    },
    // Top-level external packages configuration in Next.js 16+
    serverExternalPackages: ['@xenova/transformers'],
    // Configure webpack to ignore node-specific modules (for non-turbo builds)
    webpack: (config) => {
        config.resolve.alias = {
            ...config.resolve.alias,
            "sharp$": false,
            "onnxruntime-node$": false,
            "fs": false,
            "path": false,
            "url": false,
        };
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            path: false,
            url: false,
        };
        return config;
    },
};

export default nextConfig;
