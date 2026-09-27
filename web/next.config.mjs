/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] },
  // nsfwjs/tfjs use dynamic requires internally that webpack can't statically
  // analyse — load them from node_modules at runtime instead of bundling.
  serverExternalPackages: ['nsfwjs', '@tensorflow/tfjs', 'image-size', 'sharp', '@xenova/transformers'],
};

export default nextConfig;
