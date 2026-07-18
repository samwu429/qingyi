import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lightweight liveness probe used by uptime pings / keep-alive jobs. Avoids
// touching the database so cold-start wakeups stay cheap.
// 轻量存活探测，供保活 / 监控轮询使用；不访问数据库，降低冷启动唤醒成本。
export async function GET() {
  return NextResponse.json(
    { ok: true, service: "qingyi", ts: Date.now() },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
