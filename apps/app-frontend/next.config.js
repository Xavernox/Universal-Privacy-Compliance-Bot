/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    dirs: ['app', 'components', 'lib'],
  },
};

module.exports = nextConfig;
