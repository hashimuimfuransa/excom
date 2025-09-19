/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' }
    ]
  },
  experimental: {
    typedRoutes: true
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'rw'],
  }
};

export default nextConfig;