/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Remove custom distDir for Render compatibility
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' }
    ]
  },
  experimental: {
    typedRoutes: true
  },
  // Add output configuration for better deployment
  output: 'standalone',
  // Ensure proper static file serving
  trailingSlash: false,
  // Add proper headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

export default nextConfig;