import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/infrastructure/auth/session/current-admin";
import { metricService } from "@/domain/metrics/metric.service";
import { buildMetricCsv } from "@/domain/metrics/export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin-only CSV export of streamer performance data. Supports an optional date
// range (from/to, inclusive, interpreted in UTC to match stored record dates)
// and an optional single-streamer filter. Presets (month/year) are computed on
// the client and passed as concrete from/to values.
// 仅管理员可用的主播运营数据 CSV 导出。支持可选日期范围（from/to，闭区间，按 UTC 解释以匹配
// 存储的记录日期）与可选的单主播筛选。前端将「本月/本年」等预设转换为具体的 from/to 值传入。
function parseFrom(value: string | null): Date | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function parseTo(value: string | null): Date | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T23:59:59.999Z`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function GET(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const from = parseFrom(url.searchParams.get("from"));
  const to = parseTo(url.searchParams.get("to"));
  const streamerId = url.searchParams.get("streamerId") || undefined;

  const rows = await metricService.getExportRows({ from, to, streamerId });
  const csv = buildMetricCsv(rows);

  const stamp = new Date().toISOString().slice(0, 10);
  const scope =
    url.searchParams.get("from") || url.searchParams.get("to")
      ? `${url.searchParams.get("from") ?? "all"}_${url.searchParams.get("to") ?? "now"}`
      : "all";
  const filename = `qingyi-metrics_${scope}_${stamp}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
