import type { NextConfig } from "next";

const securityHeaders = [
  // Force HTTPS in production (no-op over plain HTTP, respected by browsers).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Prevent clickjacking — the app is not meant to be framed.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Prevent MIME-type sniffing.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Limit referrer information leakage.
  { key: "Referrer-Policy", value: "origin-when-cross-origin" },
  // Lock down powerful browser APIs the app does not use.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // Do not advertise the framework via the X-Powered-By header.
  poweredByHeader: false,
  images: {
    // Prefer AVIF, fall back to WebP.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "diaryimg.liuxiaohai.ren" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
