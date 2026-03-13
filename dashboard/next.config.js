/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.BACKEND_URL || "http://localhost:4000"}/api/:path*`,
      },
      {
        source: "/auth/:path*",
        destination: `${process.env.BACKEND_URL || "http://localhost:4000"}/auth/:path*`,
      },
      {
        source: "/files/:path*",
        destination: `${process.env.BACKEND_URL || "http://localhost:4000"}/files/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;

