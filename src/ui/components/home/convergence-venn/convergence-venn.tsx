// Three-circle convergence diagram: industry frame stays classic; intersections
// name Qingyi's live / short-video practice at the network–compute–content nexus.
// 三圈交汇：外圈保留产业框架，交叉区写清青意在直播与短视频上的专业落点。

const REGIONS = [
  {
    id: "networks",
    kind: "outer" as const,
    label: "Communications\nNetworks",
    x: 50,
    y: 11.5,
  },
  {
    id: "computing",
    kind: "outer" as const,
    label: "Computing /\nInformation Technology",
    x: 18,
    y: 78,
  },
  {
    id: "content",
    kind: "outer" as const,
    label: "Content\n(Media)",
    x: 82,
    y: 78,
  },
  {
    id: "live-delivery",
    kind: "pair" as const,
    en: "Live Delivery",
    zh: "实时推流与中控",
    x: 34,
    y: 42,
  },
  {
    id: "interactive-live",
    kind: "pair" as const,
    en: "Interactive Live",
    zh: "互动直播运营",
    x: 66,
    y: 42,
  },
  {
    id: "short-video",
    kind: "pair" as const,
    en: "Short Video Ops",
    zh: "短视频与算法",
    x: 50,
    y: 68,
  },
  {
    id: "center",
    kind: "center" as const,
    en: "Creator Content IP",
    zh: "直播 × 短视频内容 IP",
    x: 50,
    y: 52,
  },
] as const;

export function ConvergenceVenn() {
  return (
    <section className="convergence" aria-labelledby="convergence-heading">
      <div className="convergence__intro">
        <p className="convergence__eyebrow">Convergence</p>
        <h2 id="convergence-heading" className="font-display convergence__title">
          三圈交汇，我们做交点
        </h2>
        <p className="convergence__lead">
          通信网络、计算技术与内容媒体正在融合成一块产业。青意站在交叉处，把直播与短视频做成可经营的内容能力。
        </p>
      </div>

      <div className="convergence__stage">
        <svg
          className="convergence__svg"
          viewBox="0 0 640 560"
          role="img"
          aria-label="通信网络、计算技术与内容媒体的三圈交汇，交叉区为青意的直播与短视频能力"
        >
          <defs>
            <filter id="convergence-soft" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow
                dx="0"
                dy="10"
                stdDeviation="14"
                floodColor="#282828"
                floodOpacity="0.06"
              />
            </filter>
          </defs>

          <g filter="url(#convergence-soft)" className="convergence__discs">
            {/* Top — Communications Networks */}
            <circle cx="320" cy="198" r="152" className="convergence__disc" />
            {/* Bottom-left — Computing / IT */}
            <circle cx="228" cy="338" r="152" className="convergence__disc" />
            {/* Bottom-right — Content (Media) */}
            <circle cx="412" cy="338" r="152" className="convergence__disc" />
          </g>

          {/* Crisp outlines on top of fills */}
          <g className="convergence__rings" fill="none">
            <circle cx="320" cy="198" r="152" />
            <circle cx="228" cy="338" r="152" />
            <circle cx="412" cy="338" r="152" />
          </g>
        </svg>

        <ul className="convergence__labels">
          {REGIONS.map((region) => {
            if (region.kind === "outer") {
              return (
                <li
                  key={region.id}
                  className="convergence__label convergence__label--outer"
                  style={{ left: `${region.x}%`, top: `${region.y}%` }}
                >
                  {region.label.split("\n").map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </li>
              );
            }

            return (
              <li
                key={region.id}
                className={
                  region.kind === "center"
                    ? "convergence__label convergence__label--center"
                    : "convergence__label convergence__label--pair"
                }
                style={{ left: `${region.x}%`, top: `${region.y}%` }}
              >
                <span className="convergence__label-zh">{region.zh}</span>
                <span className="convergence__label-en">{region.en}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
