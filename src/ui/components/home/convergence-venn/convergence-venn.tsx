import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

// Compact three-circle diagram. Intersection copy sits on paper plates so
// circle arcs never cut through glyphs; plates sit at exclusive-lens centroids.
// 紧凑三圈图：交叉文案落在纸色底板中心，避开交界弧线，保证不穿字。

type ConvergenceVennProps = {
  className?: string;
};

function LabelPlate({
  x,
  y,
  width,
  height,
  children,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  children: ReactNode;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect
        className="convergence-venn__plate"
        x={-width / 2}
        y={-height / 2}
        width={width}
        height={height}
      />
      {children}
    </g>
  );
}

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

        {/*
          Geometry: A(320,200) B(230,335) C(410,335) r=142
          Triple centroid ≈ (320, 290)
          Exclusive-lens anchors pushed away from the triple so arcs miss the type.
        */}
        <g filter="url(#venn-soft)">
          <circle cx="320" cy="200" r="142" className="convergence-venn__disc" />
          <circle cx="230" cy="335" r="142" className="convergence-venn__disc" />
          <circle cx="410" cy="335" r="142" className="convergence-venn__disc" />
        </g>

        <g className="convergence-venn__rings" fill="none">
          <circle cx="320" cy="200" r="142" />
          <circle cx="230" cy="335" r="142" />
          <circle cx="410" cy="335" r="142" />
        </g>

        {/* Outer industry labels — clear of the rings */}
        <g className="convergence-venn__outer">
          <text x="320" y="72" textAnchor="middle">
            <tspan x="320" dy="0">
              Communications
            </tspan>
            <tspan x="320" dy="15">
              Networks
            </tspan>
          </text>
          <text x="108" y="448" textAnchor="middle">
            <tspan x="108" dy="0">
              Computing /
            </tspan>
            <tspan x="108" dy="15">
              Information Technology
            </tspan>
          </text>
          <text x="532" y="448" textAnchor="middle">
            <tspan x="532" dy="0">
              Content
            </tspan>
            <tspan x="532" dy="15">
              (Media)
            </tspan>
          </text>
        </g>

        {/* Intersection labels on opaque paper plates */}
        <g className="convergence-venn__labels">
          <LabelPlate x={236} y={248} width={72} height={28}>
            <text className="convergence-venn__pair" textAnchor="middle" y="5">
              实时推流
            </text>
          </LabelPlate>

          <LabelPlate x={404} y={248} width={72} height={28}>
            <text className="convergence-venn__pair" textAnchor="middle" y="5">
              互动直播
            </text>
          </LabelPlate>

          <LabelPlate x={320} y={392} width={88} height={28}>
            <text className="convergence-venn__pair" textAnchor="middle" y="5">
              短视频算法
            </text>
          </LabelPlate>

          <LabelPlate x={320} y={290} width={96} height={44}>
            <text className="convergence-venn__core" textAnchor="middle" y="-2">
              内容 IP
            </text>
            <text
              className="convergence-venn__core-sub"
              textAnchor="middle"
              y="16"
            >
              直播 × 短视频
            </text>
          </LabelPlate>
        </g>
      </svg>
    </div>
  );
}
