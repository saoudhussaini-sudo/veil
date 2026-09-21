/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || (process.env.VERCEL ? "" : "http://127.0.0.1:8000");
    if (!backendUrl) {
      return [];
    }
    return [
      {
        source: "/api/files/:path*",
        destination: `${backendUrl.replace(/\/+$/, "")}/api/files/:path*`,
      },
      {
        source: "/api/analytics/:path*",
        destination: `${backendUrl.replace(/\/+$/, "")}/api/analytics/:path*`,
      },
      {
        source: "/api/settings",
        destination: `${backendUrl.replace(/\/+$/, "")}/api/settings`,
      },
      {
        source: "/api/compare",
        destination: `${backendUrl.replace(/\/+$/, "")}/api/compare`,
      },
    ];
  },
};

module.exports = nextConfig;
