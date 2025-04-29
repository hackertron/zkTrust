/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // This is needed for WebAssembly (WASM) support
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      syncWebAssembly: true
    };
    return config;
  }
};

module.exports = nextConfig;