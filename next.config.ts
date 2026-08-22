import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["192.168.29.240"],
  turbopack: {
    root: "/home/ammar/airmenus-slice/frontend",
  },
};

export default nextConfig;
