/** @type {import('next').NextConfig} */
module.exports = {
  // Use a fixed build ID to prevent leaking deployment info
  generateBuildId: async () => {
    return 'nukopt';
  },
  
  // Disable x-powered-by header
  poweredByHeader: false,
  
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};
