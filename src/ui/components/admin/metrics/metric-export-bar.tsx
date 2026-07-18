"use client";

import { useState } from "react";
import { Select, TextInput } from "@/ui/components/admin/form/fields";

// Data export controls. Presets fill the from/to date inputs; the form submits a
// GET to the export route which streams a CSV download. An optional streamer
// filter narrows the export to a single creator.
// 数据导出控件。预设按钮会填充起止日期；表单以 GET 提交到导出路由，触发 CSV 下载。
// 可选的主播筛选可将导出范围限定到单个创作者。
function iso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function MetricExportBar({
  streamers,
}: {
  streamers: { id: string; name: string }[];
}) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const applyRange = (start: Date, end: Date) => {
    setFrom(iso(start));
    setTo(iso(end));
  };

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const presets = [
    {
      label: "本月",
      onClick: () =>
        applyRange(new Date(year, month, 1), new Date(year, month + 1, 0)),
    },
    {
      label: "上月",
      onClick: () =>
        applyRange(new Date(year, month - 1, 1), new Date(year, month, 0)),
    },
    {
      label: "本年",
      onClick: () =>
        applyRange(new Date(year, 0, 1), new Date(year, 11, 31)),
    },
    {
      label: "全部",
      onClick: () => {
        setFrom("");
        setTo("");
      },
    },
  ];

  return (
    <form
      action="/api/admin/metrics/export"
      method="get"
      className="border border-mist-100/10 bg-white p-4"
    >
      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-mist-400">
            主播（可选）
          </span>
          <Select name="streamerId" defaultValue="" className="w-44">
            <option value="">全部主播</option>
            {streamers.map((streamer) => (
              <option key={streamer.id} value={streamer.id}>
                {streamer.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-mist-400">
            起始日期
          </span>
          <TextInput
            name="from"
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            className="w-40"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-mist-400">
            结束日期
          </span>
          <TextInput
            name="to"
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            className="w-40"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={preset.onClick}
              className="border border-mist-100/15 px-3 py-2 text-xs text-mist-300 transition-colors hover:border-jade-500 hover:text-jade-500"
            >
              {preset.label}
            </button>
          ))}
        </div>

        <button
          type="submit"
          className="bg-jade-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-jade-600"
        >
          导出 CSV
        </button>
      </div>
      <p className="mt-2 text-xs text-mist-400">
        导出内容包含各期粉丝数与直播收入，可用 Excel / 表格软件打开。留空日期即导出全部记录。
      </p>
    </form>
  );
}
