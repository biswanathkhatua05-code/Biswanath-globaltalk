/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    allowedDevOrigins: [
      "https://3001-firebase-studio-1747018792422.cluster-iktsryn7.xnhpexlu6255bftka4.cloudworkstations.dev",
      "https://6000-firebase-studio-1747198792422.cluster-iktsryn7xnhpexlu6255bftka4.cloudworkstations.dev"
    ],
  },
};

module.exports = nextConfig;
