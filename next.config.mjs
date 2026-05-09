/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/__/auth/action',
        destination: '/reset-password',
      },
    ];
  },
};

export default nextConfig;
