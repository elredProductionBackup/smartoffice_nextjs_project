/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // `images.domains` is deprecated; remotePatterns is the supported (and safer) equivalent
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "assets-pretest.elred.io" },
      { protocol: "https", hostname: "randomuser.me" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  compiler: {
    // Strip leftover debug console.log calls from production bundles (keeps console.error / console.warn)
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  poweredByHeader: false,
};

export default nextConfig;
