import type { NextConfig } from "next";

const config: NextConfig = {
  images: {
    // Previews are served from /public. Masters never are.
    formats: ["image/avif", "image/webp"],
  },
};

export default config;
