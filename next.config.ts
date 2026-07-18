import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Smaller runtime image for Docker / Asia hosts.
  // 更小的运行时镜像，便于 Docker / 亚洲主机部署。
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [
      {
        // Cache durable media bytes aggressively; URLs are content-addressed by id.
        // 对持久媒体字节积极缓存；URL 以 id 寻址，内容不变。
        source: "/api/media/:id*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
