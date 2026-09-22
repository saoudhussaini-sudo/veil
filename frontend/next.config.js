/** @type {import('next').NextConfig} */
const isGithubPages = process.env.GITHUB_PAGES === "true";

const nextConfig = {
  reactStrictMode: true,
  output: isGithubPages ? "export" : undefined,
  basePath: isGithubPages ? "/veil" : "",
  images: {
    unoptimized: true,
  },
  ...(isGithubPages
    ? {}
    : {
        async rewrites() {
          const backendUrl = (
            process.env.BACKEND_URL ||
            process.env.NEXT_PUBLIC_API_URL ||
            "http://127.0.0.1:8000"
          ).replace(/\/+$/, "");
          return [
            {
              source: "/api/:path*",
              destination: `${backendUrl}/api/:path*`,
            },
          ];
        },
      }),
};

module.exports = nextConfig;
