/**
 * Draws a material's pattern as SVG, in real centimetres.
 * Because every pattern tile is measured in cm, the same material can be
 * shown as a small swatch or on a full-size wall at its true scale.
 */
import type { ReactNode } from "react";
import type { PatternSpec } from "@/lib/materials";

type Tile = { w: number; h: number; content: ReactNode };

function bloom(cx: number, cy: number, r: number, fill: string, centre: string): ReactNode {
  const petals = Array.from({ length: 6 }).map((_, i) => {
    const a = (i / 6) * Math.PI * 2;
    return (
      <circle key={i} cx={cx + Math.cos(a) * r * 0.55} cy={cy + Math.sin(a) * r * 0.55} r={r * 0.5} fill={fill} opacity={0.92} />
    );
  });
  return (
    <g>
      {petals}
      <circle cx={cx} cy={cy} r={r * 0.32} fill={centre} />
    </g>
  );
}

function leaf(x: number, y: number, len: number, angle: number, fill: string): ReactNode {
  return (
    <ellipse cx={x} cy={y} rx={len / 2} ry={len / 5} fill={fill} transform={`rotate(${angle} ${x} ${y})`} />
  );
}

function star(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 ? r * 0.45 : r;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${(cx + Math.cos(a) * rad).toFixed(2)},${(cy + Math.sin(a) * rad).toFixed(2)}`);
  }
  return pts.join(" ");
}

function tileFor(spec: PatternSpec): Tile {
  switch (spec.kind) {
    case "plain":
      return { w: 10, h: 10, content: <rect width={10} height={10} fill={spec.color} /> };

    case "stripe": {
      const w = spec.stripeCm + spec.gapCm;
      return {
        w,
        h: 10,
        content: (
          <>
            <rect width={w} height={10} fill={spec.bg} />
            <rect width={spec.stripeCm} height={10} fill={spec.color} />
            <rect x={spec.stripeCm + spec.gapCm / 2 - 0.1} width={0.2} height={10} fill={spec.color} opacity={0.7} />
          </>
        ),
      };
    }

    case "ticking":
      return {
        w: 5,
        h: 5,
        content: (
          <>
            <rect width={5} height={5} fill={spec.bg} />
            <rect x={0.4} width={0.9} height={5} fill={spec.color} />
            <rect x={1.7} width={0.2} height={5} fill={spec.color} />
            <rect x={2.2} width={0.2} height={5} fill={spec.color} />
          </>
        ),
      };

    case "gingham": {
      const s = spec.checkCm;
      return {
        w: s * 2,
        h: s * 2,
        content: (
          <>
            <rect width={s * 2} height={s * 2} fill={spec.bg} />
            <rect width={s} height={s * 2} fill={spec.color} opacity={0.45} />
            <rect width={s * 2} height={s} fill={spec.color} opacity={0.45} />
          </>
        ),
      };
    }

    case "dots": {
      const s = spec.spacingCm;
      return {
        w: s,
        h: s,
        content: (
          <>
            <rect width={s} height={s} fill={spec.bg} />
            <circle cx={s / 4} cy={s / 4} r={spec.radiusCm} fill={spec.color} />
            <circle cx={(3 * s) / 4} cy={(3 * s) / 4} r={spec.radiusCm} fill={spec.color} />
          </>
        ),
      };
    }

    case "sprig": {
      const s = spec.spacingCm;
      const sprig = (x: number, y: number, flip: number) => (
        <g>
          <path d={`M${x} ${y + s * 0.14} Q${x + flip * s * 0.05} ${y} ${x} ${y - s * 0.1}`} stroke={spec.leaf} strokeWidth={s * 0.02} fill="none" />
          {leaf(x - flip * s * 0.06, y + s * 0.05, s * 0.12, flip * -35, spec.leaf)}
          {leaf(x + flip * s * 0.06, y + s * 0.09, s * 0.1, flip * 35, spec.leaf)}
          {bloom(x, y - s * 0.12, s * 0.06, spec.flower, spec.bg)}
        </g>
      );
      return {
        w: s,
        h: s,
        content: (
          <>
            <rect width={s} height={s} fill={spec.bg} />
            {sprig(s * 0.25, s * 0.3, 1)}
            {sprig(s * 0.75, s * 0.8, -1)}
          </>
        ),
      };
    }

    case "floral": {
      const s = spec.repeatCm;
      return {
        w: s,
        h: s,
        content: (
          <>
            <rect width={s} height={s} fill={spec.bg} />
            <path d={`M${s * 0.05} ${s * 0.9} C ${s * 0.3} ${s * 0.6}, ${s * 0.2} ${s * 0.4}, ${s * 0.45} ${s * 0.2}`} stroke={spec.leaf} strokeWidth={s * 0.012} fill="none" />
            <path d={`M${s * 0.55} ${s * 0.95} C ${s * 0.7} ${s * 0.75}, ${s * 0.9} ${s * 0.7}, ${s * 0.95} ${s * 0.5}`} stroke={spec.leaf} strokeWidth={s * 0.012} fill="none" />
            {leaf(s * 0.18, s * 0.62, s * 0.14, -40, spec.leaf)}
            {leaf(s * 0.34, s * 0.42, s * 0.12, 30, spec.leaf)}
            {leaf(s * 0.78, s * 0.76, s * 0.13, -20, spec.leaf)}
            {leaf(s * 0.9, s * 0.6, s * 0.1, 60, spec.leaf)}
            {bloom(s * 0.45, s * 0.2, s * 0.12, spec.bloom, spec.bloom2)}
            {bloom(s * 0.95, s * 0.48, s * 0.09, spec.bloom2, spec.bloom)}
            {bloom(s * -0.05, s * 0.48, s * 0.09, spec.bloom2, spec.bloom)}
            {bloom(s * 0.22, s * 0.82, s * 0.07, spec.bloom, spec.bloom2)}
            {bloom(s * 0.7, s * 0.62, s * 0.05, spec.bloom, spec.bg)}
          </>
        ),
      };
    }

    case "toile": {
      const s = spec.repeatCm;
      const sw = s * 0.006;
      const ink = { stroke: spec.ink, strokeWidth: sw, fill: "none" } as const;
      return {
        w: s,
        h: s,
        content: (
          <>
            <rect width={s} height={s} fill={spec.bg} />
            {/* Tree */}
            <g {...ink}>
              <path d={`M${s * 0.2} ${s * 0.45} L${s * 0.2} ${s * 0.3}`} strokeWidth={sw * 2} />
              <circle cx={s * 0.2} cy={s * 0.2} r={s * 0.1} />
              <circle cx={s * 0.13} cy={s * 0.25} r={s * 0.06} />
              <circle cx={s * 0.27} cy={s * 0.26} r={s * 0.06} />
              <path d={`M${s * 0.05} ${s * 0.46} Q${s * 0.2} ${s * 0.42} ${s * 0.4} ${s * 0.46}`} />
            </g>
            {/* Cottage */}
            <g {...ink}>
              <rect x={s * 0.58} y={s * 0.66} width={s * 0.18} height={s * 0.12} />
              <path d={`M${s * 0.56} ${s * 0.66} L${s * 0.67} ${s * 0.57} L${s * 0.78} ${s * 0.66}`} />
              <rect x={s * 0.65} y={s * 0.71} width={s * 0.04} height={s * 0.07} />
              <path d={`M${s * 0.5} ${s * 0.8} Q${s * 0.67} ${s * 0.76} ${s * 0.86} ${s * 0.8}`} />
              <path d={`M${s * 0.72} ${s * 0.6} L${s * 0.72} ${s * 0.55} L${s * 0.75} ${s * 0.55} L${s * 0.75} ${s * 0.63}`} />
            </g>
            {/* Birds and a sprig */}
            <g {...ink}>
              <path d={`M${s * 0.62} ${s * 0.18} q${s * 0.03} -${s * 0.03} ${s * 0.06} 0 q${s * 0.03} -${s * 0.03} ${s * 0.06} 0`} />
              <path d={`M${s * 0.76} ${s * 0.28} q${s * 0.02} -${s * 0.02} ${s * 0.04} 0 q${s * 0.02} -${s * 0.02} ${s * 0.04} 0`} />
              <path d={`M${s * 0.15} ${s * 0.9} q${s * 0.05} -${s * 0.1} ${s * 0.1} -${s * 0.12}`} />
              <circle cx={s * 0.25} cy={s * 0.77} r={s * 0.02} />
              <circle cx={s * 0.19} cy={s * 0.84} r={s * 0.015} />
            </g>
          </>
        ),
      };
    }

    case "stars": {
      const s = spec.spacingCm;
      return {
        w: s,
        h: s,
        content: (
          <>
            <rect width={s} height={s} fill={spec.bg} />
            <polygon points={star(s * 0.25, s * 0.25, s * 0.11)} fill={spec.color} />
            <polygon points={star(s * 0.75, s * 0.75, s * 0.07)} fill={spec.color} />
            <circle cx={s * 0.78} cy={s * 0.2} r={s * 0.02} fill={spec.color} />
          </>
        ),
      };
    }

    case "scallop": {
      const s = spec.sizeCm;
      const h = s / 2;
      return {
        w: s,
        h,
        content: (
          <>
            <rect width={s} height={h} fill={spec.bg} />
            <path d={`M0 0 A${s / 2} ${s / 2} 0 0 0 ${s} 0`} fill={spec.color} opacity={0.85} />
            <path d={`M${s * 0.12} 0 A${s * 0.38} ${s * 0.38} 0 0 0 ${s * 0.88} 0`} fill="none" stroke={spec.bg} strokeWidth={s * 0.02} />
          </>
        ),
      };
    }

    case "trellis": {
      const s = spec.sizeCm;
      const sw = s * 0.025;
      return {
        w: s,
        h: s,
        content: (
          <>
            <rect width={s} height={s} fill={spec.bg} />
            <path d={`M0 ${s / 2} L${s / 2} 0 L${s} ${s / 2} L${s / 2} ${s} Z`} fill="none" stroke={spec.color} strokeWidth={sw} />
            <circle cx={s / 2} cy={0} r={s * 0.04} fill={spec.color} />
            <circle cx={0} cy={s / 2} r={s * 0.04} fill={spec.color} />
            <circle cx={s} cy={s / 2} r={s * 0.04} fill={spec.color} />
            <circle cx={s / 2} cy={s} r={s * 0.04} fill={spec.color} />
          </>
        ),
      };
    }

    case "boards": {
      const b = spec.boardCm;
      const w = 160;
      return {
        w,
        h: b * 2,
        content: (
          <>
            <rect width={w} height={b * 2} fill={spec.base} />
            <rect y={b} width={w} height={b} fill={spec.line} opacity={0.12} />
            <path d={`M0 0 H${w} M0 ${b} H${w}`} stroke={spec.line} strokeWidth={0.3} />
            <path d={`M60 0 V${b} M130 ${b} V${b * 2} M20 ${b} V${b * 2}`} stroke={spec.line} strokeWidth={0.3} />
            <path d={`M10 ${b * 0.3} Q50 ${b * 0.45} 90 ${b * 0.3} M80 ${b * 1.6} Q110 ${b * 1.5} 150 ${b * 1.65}`} stroke={spec.line} strokeWidth={0.15} fill="none" opacity={0.6} />
          </>
        ),
      };
    }

    case "herringbone": {
      const a = spec.blockCm;
      return {
        w: a * 2,
        h: a,
        content: (
          <>
            <rect width={a * 2} height={a} fill={spec.base} />
            <polygon points={`0,${a} ${a},0 ${a},${a / 2} ${a / 2},${a}`} fill={spec.alt} />
            <polygon points={`${a},0 ${a * 2},${a} ${a * 1.5},${a} ${a},${a / 2}`} fill={spec.alt} opacity={0.6} />
            <path d={`M0 ${a} L${a} 0 L${a * 2} ${a} M${a} 0 V${a}`} stroke={spec.line} strokeWidth={0.25} fill="none" />
          </>
        ),
      };
    }

    case "weave":
      return {
        w: 2,
        h: 2,
        content: (
          <>
            <rect width={2} height={2} fill={spec.base} />
            <path d="M0 0.5 H1 M1 1.5 H2 M0.5 1 V2 M1.5 0 V1" stroke={spec.line} strokeWidth={0.35} />
          </>
        ),
      };

    case "carpet":
      return {
        w: 4,
        h: 4,
        content: (
          <>
            <rect width={4} height={4} fill={spec.base} />
            {[
              [0.5, 0.7],
              [2.6, 0.4],
              [1.4, 2.1],
              [3.3, 2.8],
              [0.9, 3.4],
              [2.2, 3.6],
            ].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={0.18} fill={spec.fleck} />
            ))}
          </>
        ),
      };
  }
}

/** A <pattern> definition, so callers can fill any shape with the material. */
export function PatternDef({ id, spec }: { id: string; spec: PatternSpec }) {
  const tile = tileFor(spec);
  return (
    <pattern id={id} patternUnits="userSpaceOnUse" width={tile.w} height={tile.h}>
      {tile.content}
    </pattern>
  );
}

/** A square swatch showing `sizeCm` × `sizeCm` of the material at true proportion. */
export function Swatch({
  spec,
  uid,
  sizeCm = 40,
  title,
  className,
}: {
  spec: PatternSpec;
  uid: string;
  sizeCm?: number;
  title: string;
  className?: string;
}) {
  const id = `sw-${uid}`;
  return (
    <svg viewBox={`0 0 ${sizeCm} ${sizeCm}`} role="img" aria-label={title} className={className}>
      <title>{title}</title>
      <defs>
        <PatternDef id={id} spec={spec} />
      </defs>
      <rect width={sizeCm} height={sizeCm} fill={`url(#${id})`} />
    </svg>
  );
}
