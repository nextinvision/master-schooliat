/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:4000/api/:path*",
      },
      {
        source: "/auth/:path*",
        destination: "http://localhost:4000/auth/:path*",
      },
      {
        source: "/files/:path*",
        destination: "http://localhost:4000/files/:path*",
      },
    ];
  },
};

module.exports = nextConfig;

