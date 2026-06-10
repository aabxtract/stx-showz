/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
  transpilePackages: [
    "@stacks/connect",
    "@stacks/connect-ui",
    "@stacks/auth",
    "@stacks/profile",
    "@stacks/transactions",
    "@stacks/network",
    "@stacks/common",
  ],
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };
    return config;
  },
};
module.exports = nextConfig;
