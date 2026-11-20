/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/:path*.gltf',
        headers: [
          {
            key: 'Content-Type',
            value: 'model/gltf+json; charset=utf-8',
          },
        ],
      },
      {
        source: '/:path*.glb',
        headers: [
          {
            key: 'Content-Type',
            value: 'model/gltf-binary',
          },
        ],
      },
      {
        source: '/:path*.bin',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/octet-stream',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
