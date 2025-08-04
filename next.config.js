
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    allowedDevOrigins: [
      "https://3001-firebase-studio-1747018792422.cluster-iktsryn7.xnhpexlu6255bftka4.cloudworkstations.dev",
      "https://6000-firebase-studio-1747198792422.cluster-iktsryn7xnhpexlu6255bftka4.cloudworkstations.dev",
      "https://3000-firebase-studio-1747018792422.cluster-iktsryn7.xnhpexlu6255bftka4.cloudworkstations.dev", // Example, if you also use port 3000
      "https://9003-firebase-studio-1747198792422.cluster-iktsryn7xnhpexlu6255bftka4.cloudworkstations.dev", // Added for new port
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_TURN_URL: process.env.NEXT_PUBLIC_TURN_URL,
    NEXT_PUBLIC_TURN_USERNAME: process.env.NEXT_PUBLIC_TURN_USERNAME,
    NEXT_PUBLIC_TURN_PASSWORD: process.env.NEXT_PUBLIC_TURN_PASSWORD,
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  },
};

module.exports = nextConfig;
