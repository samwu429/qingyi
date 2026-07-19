import { cn } from "@/lib/ui/cn";

// Compact three-circle diagram meant to sit beside other homepage content.
// Outer rings keep the classic industry frame; lenses carry short Qingyi labels.
// 紧凑三圈图，嵌在首页其他内容旁；外圈保留产业框架，交叉区用短词标青意落点。

type ConvergenceVennProps = {
  className?: string;
};

export function ConvergenceVenn({ className }: ConvergenceVennProps) {
  return (
    <div className={cn("convergence-venn", className)}>
      <svg
        className="convergence-venn__svg"
        viewBox="0 0 640 560"
        role="img"
        aria-label="通信网络、计算技术与内容媒体三圈交汇：实时推流、互动直播、短视频与内容 IP"
      >
        <defs>
          <filter id="venn-soft" x="-12%" y="-12%" width="124%" height="124%">
            <feDropShadow
              dx="0"
              dy="8"
              stdDeviation="12"
              floodColor="#282828"
              floodOpacity="0.05"
            />
          </filter>
        </defs>

        <g filter="url(#venn-soft)">
          <circle cx="320" cy="198" r="148" className="convergence-venn__disc" />
          <circle cx="228" cy="338" r="148" className="convergence-venn__disc" />
          <circle cx="412" cy="338" r="148" className="convergence-venn__disc" />
        </g>

        <g className="convergence-venn__rings" fill="none">
          <circle cx="320" cy="198" r="148" />
          <circle cx="228" cy="338" r="148" />
          <circle cx="412" cy="338" r="148" />
        </g>

        {/* Outer industry labels */}
        <g className="convergence-venn__outer">
          <text x="320" y="78" textAnchor="middle">
            <tspan x="320" dy="0">
              Communications
            </tspan>
            <tspan x="320" dy="16">
              Networks
            </tspan>
          </text>
          <text x="118" y="430" textAnchor="middle">
            <tspan x="118" dy="0">
              Computing /
            </tspan>
            <tspan x="118" dy="16">
              Information Technology
            </tspan>
          </text>
          <text x="522" y="430" textAnchor="middle">
            <tspan x="522" dy="0">
              Content
            </tspan>
            <tspan x="522" dy="16">
              (Media)
            </tspan>
          </text>
        </g>

        {/* Pairwise lenses — short Chinese only, no stacked EN */}
        <g className="convergence-venn__pair">
          <text x="248" y="248" textAnchor="middle">
            实时推流
          </text>
          <text x="392" y="248" textAnchor="middle">
            互动直播
          </text>
          <text x="320" y="412" textAnchor="middle">
            短视频算法
          </text>
        </g>

        {/* Triple core */}
        <g className="convergence-venn__core">
          <text x="320" y="300" textAnchor="middle">
            <tspan x="320" dy="0">
              内容 IP
            </tspan>
            <tspan className="convergence-venn__core-sub" x="320" dy="18">
              直播 × 短视频
            </tspan>
          </text>
        </g>
      </svg>
    </div>
  );
}
