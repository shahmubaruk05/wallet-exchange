import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  serverRuntimeConfig: {
    MERCURY_API_TOKEN: process.env.MERCURY_API_TOKEN,
  },
  devServer: {
    allowedDevOrigins: [
      'https://6000-firebase-studio-1762288315383.cluster-c36dgv2kibakqwbbbsgmia3fny.cloudworkstations.dev',
    ],
  },
};

export default nextConfig;
