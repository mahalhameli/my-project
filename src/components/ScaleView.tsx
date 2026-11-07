/**
 * "À l'échelle": a wall of the client's own room, drawn to scale in cm,
 * dressed with the chosen paper or paint, curtains and floor, with a cot
 * or bed for a sense of size. Patterns are shown at their true repeat.
 */
import type { AgeStage } from "@/lib/consultation";
import type { Material } from "@/lib/materials";
import { PatternDef } from "./Swatch";

const INK = "#3b2f26";
const TRIM = "#f3efe6";

export function ScaleView({
  uid,
  wall,
  fabric,
  flooring,
  ceilingM,
  wallLengthM,
  windowWidthCm,
  ageStage,
}: {
  uid: string;
  wall?: Material;
  fabric?: Material;
  flooring?: Material;
  ceilingM: number;
  wallLengthM: number;
  windowWidthCm: number; // 0 = no window
  ageStage: AgeStage;
}) {
  const W = Math.round(Math.min(Math.max(wallLengthM, 2.4), 4.5) * 100);
  const H = Math.round(ceilingM * 100);
  const FLOOR = 46;
  const ids = { wall: `${uid}-wall`, fabric: `${uid}-fab`, floor: `${uid}-floor` };

  const winW = Math.min(windowWidthCm, W - 220);
  const hasWindow = winW >= 40;
  const winX = W - winW - 70;
  const winTop = H - Math.min(210, H - 25);
  const winBottom = H - 90;
  const poleY = Math.max(6, winTop - 15);
  const curtainW = ((winW + 40) / 2) * 0.62;
  const curtainBottom = H - 1;

  const isCot = ageStage === "nursery";

  return (
    <svg
      viewBox={`-30 -16 ${W + 60} ${H + FLOOR + 40}`}
      role="img"
      aria-label={`A ${(W / 100).toFixed(1)} metre wall of your room drawn to scale, ${ceilingM} metres high`}
      style={{ width: "100%", height: "auto" }}
    >
      <defs>
        {wall && <PatternDef id={ids.wall} spec={wall.pattern} />}
        {fabric && <PatternDef id={ids.fabric} spec={fabric.pattern} />}
        {flooring && <PatternDef id={ids.floor} spec={flooring.pattern} />}
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dbe8e4" />
          <stop offset="1" stopColor="#c3d6cf" />
        </linearGradient>
        <linearGradient id={`${uid}-shade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.08" />
          <stop offset="0.25" stopColor="#000" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Wall */}
      <rect x={0} y={0} width={W} height={H} fill={wall ? `url(#${ids.wall})` : "#efe6d4"} />
      <rect x={0} y={0} width={W} height={H} fill={`url(#${uid}-shade)`} />
      {/* Cornice & skirting */}
      <rect x={0} y={0} width={W} height={7} fill={TRIM} stroke={INK} strokeWidth={0.6} />
      <rect x={0} y={H - 14} width={W} height={14} fill={TRIM} stroke={INK} strokeWidth={0.6} />

      {/* Window */}
      {hasWindow && (
        <g>
          <rect x={winX - 6} y={winTop - 6} width={winW + 12} height={winBottom - winTop + 12} fill={TRIM} stroke={INK} strokeWidth={0.7} />
          <rect x={winX} y={winTop} width={winW} height={winBottom - winTop} fill={`url(#${uid}-sky)`} stroke={INK} strokeWidth={0.6} />
          <line x1={winX + winW / 2} y1={winTop} x2={winX + winW / 2} y2={winBottom} stroke={TRIM} strokeWidth={4} />
          <line x1={winX} y1={winTop + (winBottom - winTop) / 3} x2={winX + winW} y2={winTop + (winBottom - winTop) / 3} stroke={TRIM} strokeWidth={3} />
          <rect x={winX - 10} y={winBottom + 6} width={winW + 20} height={5} fill={TRIM} stroke={INK} strokeWidth={0.6} />
        </g>
      )}

      {/* Curtains, hung high and wide, floor-length */}
      {hasWindow && (
        <g>
          <line x1={winX - 26} y1={poleY} x2={winX + winW + 26} y2={poleY} stroke="#a9874a" strokeWidth={3} strokeLinecap="round" />
          <circle cx={winX - 28} cy={poleY} r={3.5} fill="#b08d48" />
          <circle cx={winX + winW + 28} cy={poleY} r={3.5} fill="#b08d48" />
          {[winX - 20, winX + winW + 20 - curtainW].map((x, i) => (
            <g key={i}>
              <rect x={x} y={poleY + 2} width={curtainW} height={curtainBottom - poleY - 2} fill={fabric ? `url(#${ids.fabric})` : "#e8dcc6"} stroke={INK} strokeWidth={0.5} />
              {Array.from({ length: 5 }).map((_, k) => (
                <line key={k} x1={x + (curtainW / 5) * (k + 0.5)} y1={poleY + 4} x2={x + (curtainW / 5) * (k + 0.5)} y2={curtainBottom} stroke="#000" strokeOpacity={0.12} strokeWidth={2.2} />
              ))}
            </g>
          ))}
        </g>
      )}

      {/* Furniture for a sense of size */}
      {isCot ? (
        <g stroke={INK} strokeWidth={0.8} fill={TRIM}>
          <rect x={40} y={H - 100} width={6} height={100} />
          <rect x={164} y={H - 100} width={6} height={100} />
          <rect x={46} y={H - 92} width={118} height={5} />
          <rect x={46} y={H - 42} width={118} height={5} />
          {Array.from({ length: 13 }).map((_, i) => (
            <line key={i} x1={52 + i * 9} y1={H - 87} x2={52 + i * 9} y2={H - 42} />
          ))}
          <rect x={46} y={H - 50} width={118} height={8} fill="#fbf7ee" />
        </g>
      ) : (
        <g stroke={INK} strokeWidth={0.8}>
          <rect x={30} y={H - 105} width={7} height={105} fill={TRIM} />
          <path d={`M37 ${H - 100} Q60 ${H - 112} 84 ${H - 100}`} fill="none" />
          <rect x={37} y={H - 45} width={190} height={22} fill={TRIM} />
          <rect x={37} y={H - 58} width={190} height={14} fill="#fbf7ee" />
          <path d={`M90 ${H - 58} L227 ${H - 58} L227 ${H - 30} Q160 ${H - 26} 90 ${H - 30} Z`} fill="#d9c9ad" />
          <ellipse cx={62} cy={H - 63} rx={20} ry={7} fill="#fff" />
          <rect x={224} y={H - 70} width={6} height={70} fill={TRIM} />
          <rect x={37} y={H - 23} width={4} height={23} fill={TRIM} />
        </g>
      )}

      {/* Floor */}
      <rect x={0} y={H} width={W} height={FLOOR} fill={flooring ? `url(#${ids.floor})` : "#cdb48b"} />
      <rect x={0} y={H} width={W} height={FLOOR} fill="#000" opacity={0.06} />
      <line x1={0} y1={H} x2={W} y2={H} stroke={INK} strokeWidth={0.8} />

      {/* Scale: one metre */}
      <g stroke={INK} strokeWidth={0.8} fontFamily="var(--font-body), serif" fontSize={9} fill={INK}>
        <line x1={0} y1={H + FLOOR + 14} x2={100} y2={H + FLOOR + 14} />
        <line x1={0} y1={H + FLOOR + 10} x2={0} y2={H + FLOOR + 18} />
        <line x1={50} y1={H + FLOOR + 12} x2={50} y2={H + FLOOR + 16} />
        <line x1={100} y1={H + FLOOR + 10} x2={100} y2={H + FLOOR + 18} />
        <text x={106} y={H + FLOOR + 17} stroke="none">
          1 metre
        </text>
        <line x1={W + 14} y1={0} x2={W + 14} y2={H} />
        <line x1={W + 10} y1={0} x2={W + 18} y2={0} />
        <line x1={W + 10} y1={H} x2={W + 18} y2={H} />
        <text x={W + 4} y={-5} stroke="none">
          {ceilingM.toFixed(2)} m
        </text>
      </g>
      <rect x={-1} y={-1} width={W + 2} height={H + FLOOR + 2} fill="none" stroke={INK} strokeWidth={1} />
    </svg>
  );
}
