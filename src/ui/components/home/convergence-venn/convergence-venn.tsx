import { cn } from "@/lib/ui/cn";

// Soft-fill convergence mark. Label boxes are clearance-checked against all
// three circumferences (≥12px). Only 「内容 IP」 lives inside the triple core.
// 叠色交汇图：全部标签相对三圆周做间距校验；仅「内容 IP」落在三圈核心内。

type ConvergenceVennProps = {
  className?: string;
};

/** viewBox 800×660 — discs sit in the middle with air for every label. */
const A = { cx: 400, cy: 255, r: 140 };
const B = { cx: 315, cy: 375, r: 140 };
const C = { cx: 485, cy: 375, r: 140 };

export function ConvergenceVenn({ className }: ConvergenceVennProps) {
  return (
    <figure className={cn("convergence-venn", className)}>
      <svg
        className="convergence-venn__svg"
        viewBox="0 0 800 660"
        role="img"
        aria-label="通信网络、计算技术与内容媒体三圈交汇：实时推流、互动直播、短视频算法，核心为内容 IP"
      >
        <g className="convergence-venn__discs">
          <circle cx={A.cx} cy={A.cy} r={A.r} />
          <circle cx={B.cx} cy={B.cy} r={B.r} />
          <circle cx={C.cx} cy={C.cy} r={C.r} />
        </g>

        <g className="convergence-venn__frame">
          <text x="400" y="58" textAnchor="middle">
            <tspan x="400" dy="0">
              Communications
            </tspan>
            <tspan x="400" dy="15">
              Networks
            </tspan>
          </text>
          <text x="68" y="386" textAnchor="middle">
            <tspan x="68" dy="0">
              Computing /
            </tspan>
            <tspan x="68" dy="15">
              Information
            </tspan>
            <tspan x="68" dy="15">
              Technology
            </tspan>
          </text>
          <text x="732" y="398" textAnchor="middle">
            <tspan x="732" dy="0">
              Content
            </tspan>
            <tspan x="732" dy="15">
              (Media)
            </tspan>
          </text>
        </g>

        <g className="convergence-venn__callout">
          <text x="187" y="203" textAnchor="middle">
            实时推流
          </text>
          <text x="613" y="203" textAnchor="middle">
            互动直播
          </text>
          <text x="400" y="553" textAnchor="middle">
            短视频算法
          </text>
        </g>

        <text
          className="convergence-venn__core"
          x="400"
          y="335"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          内容 IP
        </text>
      </svg>

      <figcaption className="convergence-venn__caption">
        直播 × 短视频 · 三圈交汇处的内容经营
      </figcaption>
    </figure>
  );
}
