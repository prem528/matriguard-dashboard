/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  experimental: {
    serverActions: {
      // Post bodies travel as HTML through a Server Action. Images upload
      // separately, so this only has to cover long articles.
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
