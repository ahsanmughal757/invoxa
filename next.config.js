/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  crossOrigin: "anonymous",
  allowedDevOrigins: [
    'droopingly-corked-royce.ngrok-free.dev', '*.clerk.com'
  ],
  devIndicators: false
};


module.exports = nextConfig;
