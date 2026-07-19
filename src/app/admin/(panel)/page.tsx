import Link from "next/link";
import { streamerService } from "@/domain/streamers/streamer.service";
import { postService } from "@/domain/blog/post.service";
import { inquiryService } from "@/domain/inquiries/inquiry.service";
import { metricService } from "@/domain/metrics/metric.service";
import type { StreamerMetricRow } from "@/domain/metrics/metric.service";
import { MetricExportBar } from "@/ui/components/admin/metrics/metric-export-bar";
import { AdminAssistantPanel } from "@/ui/components/admin/assistant/admin-assistant-panel";
import { isGroqConfigured } from "@/config/env";
import {
  formatFollowers,
  formatGrowthPct,
  formatMoney,
  formatSignedInt,
} from "@/lib/text/format";

export const dynamic = "force-dynamic";

// Back-office overview: content counts, quick actions, and internal-only
// performance leaderboards derived from uploaded streamer metrics.
// ?????????????????????????????????????
export default async function AdminDashboardPage() {
  const [streamerStats, postStats, unreadInquiries, dashboard] =
    await Promise.all([
      streamerService.stats(),
      postService.stats(),
      inquiryService.countUnread(),
      metricService.getDashboard(),
    ]);

  const cards = [
    {
      label: "????",
      value: streamerStats.total,
      detail: `??? ${streamerStats.published} · ?? ${streamerStats.featured}`,
      href: "/admin/streamers",
    },
    {
      label: "????",
      value: postStats.total,
      detail: `??? ${postStats.published}`,
      href: "/admin/posts",
    },
    {
      label: "????",
      value: unreadInquiries,
      detail: "??????????",
      href: "/admin/inquiries",
    },
  ];

  const { followersRank, incomeRank, growthRank, rows, totals } = dashboard;

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-2xl font-bold text-mist-100">????</h1>
        <p className="mt-1 text-sm text-mist-400">
          ?????????????????????????????
        </p>
      </header>

      <AdminAssistantPanel configured={isGroqConfigured()} />

      <div className="grid gap-5 sm:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="card-surface p-6">
            <p className="text-sm text-mist-400">{card.label}</p>
            <p className="mt-2 font-display text-4xl font-bold text-jade-500">
              {card.value}
            </p>
            <p className="mt-2 text-xs text-mist-400">{card.detail}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickAction href="/admin/streamers/new" label="????" />
        <QuickAction href="/admin/posts/new" label="????" />
        <QuickAction href="/admin/inquiries" label="????" />
        <QuickAction href="/admin/pages" label="??????" />
      </div>

      <section className="mt-12">
        <div className="mb-5">
          <h2 className="font-display text-xl font-bold text-mist-100">
            ??????????
          </h2>
          <p className="mt-1 text-sm text-mist-400">
            ????????????????????????????????????????
            ?????????????????????/??????????
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="????" value={formatFollowers(totals.followers)} />
          <StatTile label="??????" value={formatMoney(totals.income)} />
          <StatTile label="??????" value={`${totals.streamers}`} />
          <StatTile label="??????" value={`${totals.records}`} />
        </div>

        <div className="mt-4">
          <MetricExportBar
            streamers={rows.map((row) => ({ id: row.id, name: row.name }))}
          />
        </div>

        {totals.records === 0 ? (
          <p className="mt-6 border border-mist-100/10 bg-white p-8 text-center text-sm text-mist-400">
            ????????????
            <Link
              href="/admin/streamers"
              className="mx-1 text-jade-500 hover:underline"
            >
              ????
            </Link>
            ? ?????? ? ?????????????????????????????
          </p>
        ) : (
          <>
            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <RankTable
                title="????"
                unitLabel="???"
                rows={followersRank}
                render={(row) => formatFollowers(row.followers)}
              />
              <RankTable
                title="??????"
                unitLabel="????"
                rows={incomeRank}
                render={(row) => formatMoney(row.totalIncome)}
              />
              <RankTable
                title="???????????"
                unitLabel="????"
                rows={growthRank}
                render={(row) =>
                  `${formatSignedInt(row.followersDelta ?? 0)} (${formatGrowthPct(
                    row.followersGrowthPct,
                  )})`
                }
              />
            </div>

            <div className="mt-8">
              <h3 className="mb-3 font-display text-base font-semibold text-mist-100">
                ???????
              </h3>
              <div className="overflow-x-auto border border-mist-100/10 bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="bg-ink-850 text-mist-400">
                    <tr>
                      <th className="px-5 py-3 font-medium">??</th>
                      <th className="px-5 py-3 font-medium">??</th>
                      <th className="px-5 py-3 font-medium">????</th>
                      <th className="px-5 py-3 font-medium">????</th>
                      <th className="px-5 py-3 font-medium">????</th>
                      <th className="px-5 py-3 font-medium">??????</th>
                      <th className="px-5 py-3 font-medium">????</th>
                      <th className="px-5 py-3 font-medium">???</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-t border-mist-100/10 bg-white"
                      >
                        <td className="px-5 py-3">
                          <Link
                            href={`/admin/streamers/${row.id}/edit`}
                            className="font-medium text-mist-100 hover:text-jade-500"
                          >
                            {row.name}
                          </Link>
                        </td>
                        <td className="px-5 py-3 text-mist-400">
                          {row.category ?? "?"}
                        </td>
                        <td className="px-5 py-3 text-mist-200">
                          {formatFollowers(row.followers)}
                        </td>
                        <td className="px-5 py-3">
                          <GrowthCell
                            delta={row.followersDelta}
                            pct={row.followersGrowthPct}
                          />
                        </td>
                        <td className="px-5 py-3 text-mist-200">
                          {formatMoney(row.totalIncome)}
                        </td>
                        <td className="px-5 py-3 text-mist-400">
                          {row.recordCount > 0 ? formatMoney(row.latestIncome) : "?"}
                        </td>
                        <td className="px-5 py-3 text-mist-400">
                          {row.latestPeriod ?? "?"}
                        </td>
                        <td className="px-5 py-3 text-mist-400">
                          {row.recordCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="border border-mist-100/15 bg-white px-5 py-4 text-sm font-medium text-mist-200 transition-colors hover:border-jade-500 hover:text-jade-500"
    >
      {label} ?
    </Link>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-mist-100/10 bg-white p-5">
      <p className="text-xs text-mist-400">{label}</p>
      <p className="mt-1.5 font-display text-2xl font-bold text-mist-100">
        {value}
      </p>
    </div>
  );
}

function GrowthCell({
  delta,
  pct,
}: {
  delta: number | null;
  pct: number | null;
}) {
  if (delta === null) {
    return <span className="text-mist-400">?</span>;
  }
  const tone =
    delta > 0 ? "text-jade-600" : delta < 0 ? "text-red-600" : "text-mist-400";
  return (
    <span className={tone}>
      {formatSignedInt(delta)}
      <span className="ml-1 text-xs">({formatGrowthPct(pct)})</span>
    </span>
  );
}

function RankTable({
  title,
  unitLabel,
  rows,
  render,
}: {
  title: string;
  unitLabel: string;
  rows: StreamerMetricRow[];
  render: (row: StreamerMetricRow) => string;
}) {
  const top = rows.slice(0, 10);
  return (
    <div className="border border-mist-100/10 bg-white">
      <div className="border-b border-mist-100/10 bg-ink-850 px-5 py-3">
        <h3 className="font-display text-sm font-semibold text-mist-100">
          {title}
        </h3>
      </div>
      <table className="w-full text-left text-sm">
        <thead className="text-mist-400">
          <tr>
            <th className="px-5 py-2.5 font-medium">#</th>
            <th className="px-5 py-2.5 font-medium">??</th>
            <th className="px-5 py-2.5 text-right font-medium">{unitLabel}</th>
          </tr>
        </thead>
        <tbody>
          {top.map((row, index) => (
            <tr key={row.id} className="border-t border-mist-100/10">
              <td className="px-5 py-2.5 text-mist-400">{index + 1}</td>
              <td className="px-5 py-2.5">
                <Link
                  href={`/admin/streamers/${row.id}/edit`}
                  className="font-medium text-mist-100 hover:text-jade-500"
                >
                  {row.name}
                </Link>
              </td>
              <td className="px-5 py-2.5 text-right font-medium text-jade-500">
                {render(row)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
