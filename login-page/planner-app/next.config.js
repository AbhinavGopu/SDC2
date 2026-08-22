/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: false,
  webpack: (config) => {
    config.devtool = false;
    return config;
  },
};

module.exports = nextConfig;
