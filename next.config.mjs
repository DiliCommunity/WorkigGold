/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [{ source: "/stats", destination: "/orders", permanent: false }];
  },
};

export default nextConfig;
