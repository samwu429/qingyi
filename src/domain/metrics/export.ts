import type { MetricExportRow } from "@/domain/metrics/metric.service";

// Serialise export rows into CSV. A UTF-8 BOM is prepended so Excel on Chinese
// Windows opens the file without mojibake.
// 将导出行序列化为 CSV。前置 UTF-8 BOM，使中文 Windows 上的 Excel 打开不乱码。

const HEADERS = [
  "主播",
  "分类",
  "统计周期",
  "记录日期",
  "粉丝数",
  "直播收入(元)",
  "备注",
];

function escapeCell(value: string | number): string {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildMetricCsv(rows: MetricExportRow[]): string {
  const lines = [HEADERS.join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.name,
        row.category,
        row.period,
        row.recordedAt,
        row.followers,
        row.income,
        row.note,
      ]
        .map(escapeCell)
        .join(","),
    );
  }
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}
