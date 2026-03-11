/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb', // Increase to 500MB
    },
  },
}

module.exports = nextConfig
