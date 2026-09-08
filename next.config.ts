import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/gmap/vt/:path*',
        destination: 'https://mt0.google.com/vt/lyrs=:path*',
      },
      {
        source: '/nominatim/:path*',
        destination: 'https://nominatim.openstreetmap.org/:path*',
      },
      {
        source: '/photon/api/:path*',
        destination: 'https://photon.komoot.io/api/:path*',
      },
      {
        source: '/flagcdn/:path*',
        destination: 'https://flagcdn.com/:path*',
      },
    ]
  },
};

export default nextConfig;