import { cn } from "@/lib/ui/cn";

// Soft-fill convergence mark. Only 「内容 IP」 sits inside the triple core;
// practice words annotate from outside the outer cusps so nothing crosses an arc.
// 叠色交汇图：圈内仅「内容 IP」；业务词从外侧尖角标注，不与任何弧线交叉。

type ConvergenceVennProps = {
  className?: string;
};

const A = { cx: 360, cy: 220, r: 175 };
const B = { cx: 255, cy: 365, r: 175 };
const C = { cx: 465, cy: 365, r: 175 };

export function ConvergenceVenn({ className }: ConvergenceVennProps) {
  return (
    <figure className={cn("convergence-venn", className)}>
      <svg
        className="convergence-venn__svg"
        viewBox="0 0 720 620"
        role="img"
        aria-label="通信网络、计算技术与内容媒体三圈交汇：实时推流、互动直播、短视频算法，核心为内容 IP"
      >
        <g className="convergence-venn__discs">
          <circle cx={A.cx} cy={A.cy} r={A.r} />
          <circle cx={B.cx} cy={B.cy} r={B.r} />
          <circle cx={C.cx} cy={C.cy} r={C.r} />
        </g>

        <g className="convergence-venn__frame">
          <text x="360" y="48" textAnchor="middle">
            <tspan x="360" dy="0">
              Communications
            </tspan>
            <tspan x="360" dy="15">
              Networks
            </tspan>
          </text>
          <text x="72" y="470" textAnchor="middle">
            <tspan x="72" dy="0">
              Computing /
            </tspan>
            <tspan x="72" dy="15">
              Information Technology
            </tspan>
          </text>
          <text x="648" y="470" textAnchor="middle">
            <tspan x="648" dy="0">
              Content
            </tspan>
            <tspan x="648" dy="15">
              (Media)
            </tspan>
          </text>
        </g>

        <g className="convergence-venn__callout">
          <text x="152" y="178" textAnchor="middle">
            实时推流
          </text>
          <text x="568" y="178" textAnchor="middle">
            互动直播
          </text>
          <text x="360" y="580" textAnchor="middle">
            短视频算法
          </text>
        </g>

        <text
          className="convergence-venn__core"
          x="360"
          y="317"
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
