/**
 * Hand-drawn, engraving-style line illustrations.
 * Sepia ink strokes with soft watercolour washes, in the manner of an
 * old decorator's pattern book.
 */
import type { ReactNode, SVGProps } from "react";

const INK = "#3b2f26";
const ROSE = "#d9aaa3";
const DUCK = "#bcd2cc";
const SAGE = "#b6bf9f";
const OCHRE = "#e2c58f";

type Props = SVGProps<SVGSVGElement> & { title: string };

function Plate({ title, children, viewBox = "0 0 200 160", ...rest }: Props & { children: ReactNode }) {
  return (
    <svg
      viewBox={viewBox}
      role="img"
      aria-label={title}
      fill="none"
      stroke={INK}
      strokeWidth={1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <title>{title}</title>
      {children}
    </svg>
  );
}

/* Faint cross-hatching used for shadow, like an engraver's burin */
function Hatch({ x, y, w, h, gap = 4 }: { x: number; y: number; w: number; h: number; gap?: number }) {
  const lines = [];
  for (let i = 0; i <= w + h; i += gap) {
    const x1 = x + Math.max(0, i - h);
    const y1 = y + Math.min(h, i);
    const x2 = x + Math.min(w, i);
    const y2 = y + Math.max(0, i - w);
    lines.push(<line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={0.4} opacity={0.5} />);
  }
  return <g>{lines}</g>;
}

export function HeroWindow(props: SVGProps<SVGSVGElement>) {
  return (
    <Plate title="A tall French window with draped curtains opening onto a formal garden" viewBox="0 0 320 400" {...props}>
      {/* Wall wash with faint toile sprigs */}
      <rect x="0" y="0" width="320" height="400" fill="#f3e6d2" stroke="none" />
      {Array.from({ length: 6 }).map((_, r) =>
        Array.from({ length: 5 }).map((__, c) => (
          <g key={`${r}-${c}`} transform={`translate(${20 + c * 68 + (r % 2) * 34} ${24 + r * 64})`} opacity={0.35} strokeWidth={0.7}>
            <path d="M0 8 C 4 0, 10 0, 12 6 C 14 0, 20 0, 22 8" stroke="#9c5a55" />
            <path d="M11 6 L11 16" stroke="#64704f" />
          </g>
        )),
      )}

      {/* Window opening and view */}
      <path d="M70 360 L70 120 Q160 40 250 120 L250 360 Z" fill={DUCK} stroke="none" opacity={0.6} />
      <path d="M70 280 L250 280 L250 360 L70 360 Z" fill={SAGE} stroke="none" opacity={0.7} />
      {/* Parterre & topiary in the distance */}
      <g strokeWidth={0.9}>
        <path d="M90 300 Q160 285 230 300" />
        <path d="M100 320 Q160 305 220 320" />
        <ellipse cx="160" cy="312" rx="22" ry="6" />
        {[100, 130, 190, 220].map((x) => (
          <g key={x}>
            <path d={`M${x} 292 l0 -6`} />
            <circle cx={x} cy={279} r={7} fill={SAGE} />
          </g>
        ))}
        <path d="M150 280 L150 250 L170 250 L170 280" />
        <path d="M145 250 L160 238 L175 250" />
      </g>

      {/* Window frame & glazing bars */}
      <path d="M70 360 L70 120 Q160 40 250 120 L250 360" strokeWidth={2.2} />
      <path d="M80 360 L80 124 Q160 54 240 124 L240 360" />
      <line x1="160" y1="72" x2="160" y2="360" strokeWidth={1.6} />
      {[150, 200, 250, 300].map((y) => (
        <line key={y} x1="80" y1={y} x2="240" y2={y} strokeWidth={0.9} />
      ))}
      <path d="M100 100 Q160 70 220 100" strokeWidth={0.9} />

      {/* Pelmet & curtain pole */}
      <line x1="30" y1="62" x2="290" y2="62" strokeWidth={2.4} />
      <circle cx="26" cy="62" r="5" fill={OCHRE} />
      <circle cx="294" cy="62" r="5" fill={OCHRE} />
      <path d="M40 62 Q75 92 110 62 Q145 92 160 62 Q175 92 210 62 Q245 92 280 62" fill={ROSE} opacity={0.85} />

      {/* Left curtain, gathered with a tie-back */}
      <g className="curtain-left" style={{ transformOrigin: "40px 62px", animation: "curtain-left 2.4s ease-out both" }}>
        <path d="M40 62 C 44 160, 90 200, 92 230 C 70 260, 50 330, 44 392 L22 392 C 26 300, 30 160, 30 62 Z" fill={ROSE} />
        {[42, 56, 70].map((x, i) => (
          <path key={x} d={`M${x} 64 C ${x + 4} 140, ${x + 26 - i * 6} 200, ${80 - i * 8} 228`} strokeWidth={0.7} />
        ))}
        <path d="M36 300 C 38 340, 34 370, 32 392" strokeWidth={0.7} />
        <path d="M84 222 q12 6 8 16 q-10 4 -16 -6" fill={OCHRE} />
      </g>

      {/* Right curtain */}
      <g style={{ transformOrigin: "280px 62px", animation: "curtain-right 2.4s ease-out both" }}>
        <path d="M280 62 C 276 160, 230 200, 228 230 C 250 260, 270 330, 276 392 L298 392 C 294 300, 290 160, 290 62 Z" fill={ROSE} />
        {[278, 264, 250].map((x, i) => (
          <path key={x} d={`M${x} 64 C ${x - 4} 140, ${x - 26 + i * 6} 200, ${240 + i * 8} 228`} strokeWidth={0.7} />
        ))}
        <path d="M284 300 C 282 340, 286 370, 288 392" strokeWidth={0.7} />
        <path d="M236 222 q-12 6 -8 16 q10 4 16 -6" fill={OCHRE} />
      </g>

      {/* Skirting & parquet */}
      <line x1="0" y1="372" x2="320" y2="372" strokeWidth={1.4} />
      {[0, 40, 80, 120, 160, 200, 240, 280].map((x) => (
        <path key={x} d={`M${x} 400 L${x + 20} 380 L${x + 40} 400`} strokeWidth={0.6} opacity={0.6} />
      ))}
    </Plate>
  );
}

export function ChildrenBedroom(props: SVGProps<SVGSVGElement>) {
  return (
    <Plate title="A child's bedroom with a cot, a hanging mobile and striped wallpaper" {...props}>
      {[20, 40, 60, 80, 100, 120, 140, 160, 180].map((x) => (
        <rect key={x} x={x} y="0" width="10" height="118" fill={ROSE} stroke="none" opacity={0.35} />
      ))}
      <line x1="0" y1="118" x2="200" y2="118" />
      {/* Mobile */}
      <line x1="100" y1="0" x2="100" y2="22" />
      <path d="M72 22 L128 22" />
      {[72, 100, 128].map((x, i) => (
        <g key={x}>
          <line x1={x} y1="22" x2={x} y2={34 + i * 3} strokeWidth={0.7} />
          <path d={`M${x} ${36 + i * 3} l4 6 l-8 0 z`} fill={i === 1 ? OCHRE : DUCK} />
        </g>
      ))}
      {/* Cot */}
      <path d="M50 64 Q50 54 60 54 L140 54 Q150 54 150 64 L150 130 L50 130 Z" fill="#fbf3e6" />
      {Array.from({ length: 11 }).map((_, i) => (
        <line key={i} x1={58 + i * 8.4} y1="62" x2={58 + i * 8.4} y2="112" strokeWidth={0.9} />
      ))}
      <line x1="50" y1="112" x2="150" y2="112" strokeWidth={1.4} />
      <path d="M60 112 Q100 100 140 112" fill={DUCK} opacity={0.7} />
      <line x1="54" y1="130" x2="54" y2="142" />
      <line x1="146" y1="130" x2="146" y2="142" />
      {/* Rug */}
      <ellipse cx="100" cy="148" rx="70" ry="8" fill={SAGE} opacity={0.5} />
    </Plate>
  );
}

export function ParentsSuite(props: SVGProps<SVGSVGElement>) {
  return (
    <Plate title="A parents' suite with a canopied bed and bedside lamps" {...props}>
      <rect x="0" y="0" width="200" height="120" fill={DUCK} stroke="none" opacity={0.3} />
      <line x1="0" y1="120" x2="200" y2="120" />
      {/* Canopy */}
      <path d="M60 14 Q100 2 140 14 L140 22 L60 22 Z" fill={ROSE} />
      <path d="M60 22 C 58 60, 52 90, 48 116 L58 116 C 62 80, 66 50, 68 22" fill={ROSE} opacity={0.8} />
      <path d="M140 22 C 142 60, 148 90, 152 116 L142 116 C 138 80, 134 50, 132 22" fill={ROSE} opacity={0.8} />
      {/* Headboard & bed */}
      <path d="M70 92 L70 56 Q100 40 130 56 L130 92" fill="#fbf3e6" />
      <path d="M76 90 L76 60 Q100 48 124 60 L124 90" strokeWidth={0.7} />
      <rect x="60" y="92" width="80" height="30" rx="3" fill="#fbf3e6" />
      <path d="M60 104 L140 104" strokeWidth={0.7} />
      <path d="M62 122 Q100 132 138 122 L140 138 L60 138 Z" fill={OCHRE} opacity={0.6} />
      <ellipse cx="84" cy="90" rx="10" ry="5" fill="#fff" />
      <ellipse cx="116" cy="90" rx="10" ry="5" fill="#fff" />
      {/* Bedside tables & lamps */}
      {[28, 172].map((x) => (
        <g key={x}>
          <rect x={x - 12} y="100" width="24" height="26" fill="#efe2c9" />
          <line x1={x} y1="100" x2={x} y2="84" />
          <path d={`M${x - 9} 84 L${x + 9} 84 L${x + 6} 72 L${x - 6} 72 Z`} fill={OCHRE} />
        </g>
      ))}
      <Hatch x={0} y={140} w={200} h={20} gap={5} />
    </Plate>
  );
}

export function Playroom(props: SVGProps<SVGSVGElement>) {
  return (
    <Plate title="A playroom with a rocking horse, bunting and a toy chest" {...props}>
      <line x1="0" y1="120" x2="200" y2="120" />
      {/* Bunting */}
      <path d="M0 14 Q100 40 200 14" strokeWidth={0.8} />
      {Array.from({ length: 9 }).map((_, i) => {
        const x = 12 + i * 22;
        const y = 14 + Math.sin((x / 200) * Math.PI) * 22;
        const fill = [ROSE, DUCK, OCHRE, SAGE][i % 4];
        return <path key={i} d={`M${x - 7} ${y} L${x + 7} ${y} L${x} ${y + 14} Z`} fill={fill} />;
      })}
      {/* Rocking horse */}
      <path d="M30 138 Q75 152 120 138" strokeWidth={2} />
      <path d="M46 140 L54 112 M104 140 L96 112" />
      <path d="M50 112 Q75 102 100 112 L102 98 Q90 92 60 96 L50 104 Z" fill="#fbf3e6" />
      <path d="M100 98 L112 70 Q118 62 126 68 L130 78 L118 84 L108 104" fill="#fbf3e6" />
      <path d="M112 70 C 104 72, 102 82, 104 92" stroke={"#9c5a55"} strokeWidth={2} />
      <circle cx="121" cy="72" r="1.2" fill={INK} />
      <path d="M50 104 C 40 104, 34 112, 36 124" stroke={"#9c5a55"} strokeWidth={2} />
      <path d="M72 96 L74 106 L88 106 L90 96" fill={ROSE} />
      {/* Toy chest */}
      <rect x="140" y="104" width="46" height="34" fill={DUCK} />
      <path d="M140 104 Q163 92 186 104" fill={DUCK} />
      <circle cx="163" cy="120" r="5" />
      {/* Ball */}
      <circle cx="132" cy="146" r="8" fill={OCHRE} />
      <path d="M124 146 Q132 140 140 146" strokeWidth={0.7} />
    </Plate>
  );
}

export function Kitchen(props: SVGProps<SVGSVGElement>) {
  return (
    <Plate title="A farmhouse kitchen with a range cooker, copper pans and chequered tiles" {...props}>
      {/* Tiled splashback */}
      {Array.from({ length: 5 }).map((_, r) =>
        Array.from({ length: 20 }).map((__, c) => (
          <rect
            key={`${r}-${c}`}
            x={c * 10}
            y={40 + r * 10}
            width="10"
            height="10"
            fill={(r + c) % 2 ? DUCK : "#fbf3e6"}
            strokeWidth={0.3}
          />
        )),
      )}
      {/* Pot rail with copper pans */}
      <line x1="30" y1="22" x2="170" y2="22" strokeWidth={1.6} />
      {[50, 80, 120, 150].map((x, i) => (
        <g key={x}>
          <line x1={x} y1="22" x2={x} y2="30" strokeWidth={0.7} />
          <circle cx={x} cy={38} r={6 + (i % 2) * 2} fill={OCHRE} />
        </g>
      ))}
      {/* Range cooker */}
      <rect x="62" y="90" width="76" height="50" fill="#efe2c9" />
      <rect x="62" y="84" width="76" height="6" fill={INK} opacity={0.75} />
      <rect x="70" y="100" width="28" height="30" rx="2" />
      <rect x="102" y="100" width="28" height="30" rx="2" />
      <line x1="74" y1="104" x2="94" y2="104" strokeWidth={1.6} />
      <line x1="106" y1="104" x2="126" y2="104" strokeWidth={1.6} />
      {/* Cabinets */}
      <rect x="0" y="90" width="62" height="50" fill={SAGE} opacity={0.7} />
      <rect x="138" y="90" width="62" height="50" fill={SAGE} opacity={0.7} />
      <line x1="31" y1="94" x2="31" y2="136" strokeWidth={0.8} />
      <line x1="169" y1="94" x2="169" y2="136" strokeWidth={0.8} />
      <rect x="0" y="86" width="62" height="4" fill="#fbf3e6" />
      <rect x="138" y="86" width="62" height="4" fill="#fbf3e6" />
      <Hatch x={0} y={140} w={200} h={20} gap={5} />
    </Plate>
  );
}

export function Wardrobe(props: SVGProps<SVGSVGElement>) {
  return (
    <Plate title="A carved armoire with open doors showing hanging dresses and shelves" {...props}>
      <line x1="0" y1="140" x2="200" y2="140" />
      {/* Cornice */}
      <path d="M44 20 Q100 4 156 20 L160 28 L40 28 Z" fill={OCHRE} opacity={0.7} />
      {/* Body */}
      <rect x="46" y="28" width="108" height="106" fill="#efe2c9" />
      <rect x="54" y="36" width="92" height="90" fill="#fbf3e6" />
      {/* Rail and garments */}
      <line x1="56" y1="46" x2="144" y2="46" strokeWidth={1.4} />
      {[
        { x: 66, f: ROSE },
        { x: 82, f: DUCK },
        { x: 98, f: SAGE },
        { x: 114, f: ROSE },
      ].map(({ x, f }) => (
        <g key={x}>
          <path d={`M${x} 46 l0 4`} />
          <path d={`M${x - 6} 52 L${x + 6} 52 L${x + 9} 92 L${x - 9} 92 Z`} fill={f} />
        </g>
      ))}
      {/* Shelves */}
      {[100, 112].map((y) => (
        <line key={y} x1="126" y1={y} x2="146" y2={y} />
      ))}
      <line x1="126" y1="50" x2="126" y2="126" strokeWidth={0.8} />
      <rect x="130" y="104" width="12" height="8" fill={OCHRE} opacity={0.7} />
      <rect x="130" y="92" width="12" height="8" fill={DUCK} opacity={0.8} />
      {/* Open doors */}
      <path d="M46 28 L20 36 L20 130 L46 134 Z" fill="#efe2c9" />
      <path d="M154 28 L180 36 L180 130 L154 134 Z" fill="#efe2c9" />
      <path d="M26 50 L40 46 L40 116 L26 118 Z" strokeWidth={0.7} />
      <path d="M174 50 L160 46 L160 116 L174 118 Z" strokeWidth={0.7} />
      {/* Feet */}
      <path d="M50 134 l0 6 M150 134 l0 6" strokeWidth={2} />
      <rect x="54" y="118" width="92" height="8" fill="none" strokeWidth={0.7} />
    </Plate>
  );
}

export function Entrance(props: SVGProps<SVGSVGElement>) {
  return (
    <Plate title="An entrance hall with a panelled front door, fanlight and a console table" {...props}>
      <rect x="0" y="0" width="200" height="140" fill={SAGE} stroke="none" opacity={0.35} />
      {/* Door with fanlight */}
      <path d="M70 140 L70 52 Q100 22 130 52 L130 140" fill="#fbf3e6" strokeWidth={1.6} />
      <path d="M76 52 Q100 30 124 52 Z" fill={DUCK} />
      {[84, 92, 100, 108, 116].map((x) => (
        <line key={x} x1="100" y1="52" x2={x} y2={x < 100 ? 40 + (100 - x) / 3 : 40 + (x - 100) / 3} strokeWidth={0.6} />
      ))}
      <rect x="78" y="58" width="44" height="80" fill={DUCK} opacity={0.45} />
      <rect x="82" y="62" width="16" height="32" strokeWidth={0.7} />
      <rect x="102" y="62" width="16" height="32" strokeWidth={0.7} />
      <rect x="82" y="100" width="16" height="32" strokeWidth={0.7} />
      <rect x="102" y="100" width="16" height="32" strokeWidth={0.7} />
      <circle cx="116" cy="98" r="2" fill={OCHRE} />
      {/* Console with vase */}
      <rect x="146" y="98" width="44" height="4" fill="#efe2c9" />
      <path d="M150 102 L152 140 M186 102 L184 140" />
      <path d="M162 98 Q160 86 166 82 L170 82 Q176 86 174 98 Z" fill={ROSE} />
      <path d="M168 82 C 160 70, 164 62, 158 56 M168 82 C 170 68, 176 64, 180 58" strokeWidth={0.8} />
      <circle cx="158" cy="56" r="3" fill={ROSE} />
      <circle cx="180" cy="58" r="3" fill={OCHRE} />
      {/* Chequerboard floor */}
      {Array.from({ length: 10 }).map((_, c) => (
        <path
          key={c}
          d={`M${c * 20} 140 L${c * 20 + 20} 140 L${c * 22 + 22 - 12} 160 L${c * 22 - 12} 160 Z`}
          fill={c % 2 ? INK : "#fbf3e6"}
          opacity={c % 2 ? 0.55 : 1}
          strokeWidth={0.4}
        />
      ))}
      {/* Umbrella stand */}
      <rect x="22" y="116" width="16" height="24" fill={OCHRE} opacity={0.7} />
      <path d="M26 116 L22 92 M34 116 L40 96" strokeWidth={1.2} />
    </Plate>
  );
}

export function EnglishGarden(props: SVGProps<SVGSVGElement>) {
  return (
    <Plate title="An English cottage garden with a rose arch, winding path and deep borders" {...props}>
      <rect x="0" y="0" width="200" height="160" fill={DUCK} stroke="none" opacity={0.25} />
      {/* Winding path */}
      <path d="M86 160 C 96 130, 70 120, 96 96 C 108 86, 100 80, 102 74 L110 74 C 110 82, 118 90, 108 100 C 88 120, 116 132, 116 160 Z" fill={OCHRE} opacity={0.55} />
      {/* Rose arch */}
      <path d="M72 120 L72 54 Q106 18 140 54 L140 120" strokeWidth={1.6} />
      <path d="M78 120 L78 56 Q106 28 134 56 L134 120" strokeWidth={0.8} />
      {[
        [74, 60],
        [84, 42],
        [100, 34],
        [118, 36],
        [132, 46],
        [138, 66],
        [72, 84],
        [140, 90],
      ].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={4} fill={ROSE} />
          <path d={`M${x - 3} ${y} q3 -3 6 0`} strokeWidth={0.5} />
          <path d={`M${x + 4} ${y + 4} q4 2 6 -2`} fill={SAGE} strokeWidth={0.6} />
        </g>
      ))}
      {/* Borders: foxgloves, lavender, hollyhocks in drifts */}
      {[12, 22, 34, 46, 56].map((x, i) => (
        <g key={x}>
          <path d={`M${x} 150 L${x} ${96 - (i % 2) * 14}`} stroke="#64704f" />
          {Array.from({ length: 5 }).map((_, j) => (
            <ellipse key={j} cx={x + (j % 2 ? 2 : -2)} cy={100 - (i % 2) * 14 + j * 8} rx="3" ry="2.4" fill={i % 2 ? ROSE : "#c9b6d6"} />
          ))}
        </g>
      ))}
      {[148, 160, 172, 184, 194].map((x, i) => (
        <g key={x}>
          <path d={`M${x} 150 L${x} ${104 - (i % 3) * 8}`} stroke="#64704f" />
          <circle cx={x} cy={102 - (i % 3) * 8} r="5" fill={i % 2 ? OCHRE : "#fbf3e6"} />
        </g>
      ))}
      <path d="M0 150 Q50 136 86 150 M116 150 Q160 136 200 150" fill={SAGE} opacity={0.7} />
      <path d="M0 160 L0 146 Q50 132 86 146 L86 160 Z" fill={SAGE} opacity={0.6} stroke="none" />
      <path d="M116 160 L116 146 Q160 132 200 146 L200 160 Z" fill={SAGE} opacity={0.6} stroke="none" />
    </Plate>
  );
}

export function FrenchGarden(props: SVGProps<SVGSVGElement>) {
  return (
    <Plate title="A formal French parterre with clipped box hedges, topiary cones and a central fountain" {...props}>
      <rect x="0" y="0" width="200" height="60" fill={DUCK} stroke="none" opacity={0.35} />
      {/* Distant château */}
      <path d="M70 60 L70 36 L130 36 L130 60" fill="#fbf3e6" />
      <path d="M66 36 L100 22 L134 36 Z" fill={DUCK} />
      {[78, 92, 108, 122].map((x) => (
        <rect key={x} x={x - 3} y="42" width="6" height="10" strokeWidth={0.7} />
      ))}
      {/* Gravel */}
      <path d="M0 60 L200 60 L200 160 L0 160 Z" fill={OCHRE} opacity={0.35} stroke="none" />
      {/* Parterre beds in perspective */}
      <path d="M20 150 L60 74 L96 74 L90 150 Z" fill={SAGE} />
      <path d="M180 150 L140 74 L104 74 L110 150 Z" fill={SAGE} />
      <path d="M34 140 Q56 112 60 84 M44 140 Q70 110 88 84" strokeWidth={0.7} stroke="#fbf3e6" />
      <path d="M166 140 Q144 112 140 84 M156 140 Q130 110 112 84" strokeWidth={0.7} stroke="#fbf3e6" />
      <path d="M48 128 q12 -10 24 0 q-12 10 -24 0 Z" stroke="#fbf3e6" strokeWidth={0.7} />
      <path d="M128 128 q12 -10 24 0 q-12 10 -24 0 Z" stroke="#fbf3e6" strokeWidth={0.7} />
      {/* Central fountain */}
      <ellipse cx="100" cy="118" rx="16" ry="5" fill={DUCK} />
      <path d="M100 116 L100 100 M100 100 Q92 104 90 112 M100 100 Q108 104 110 112" strokeWidth={0.8} />
      {/* Topiary cones on the axis */}
      {[
        [58, 72, 0.6],
        [142, 72, 0.6],
        [34, 120, 1],
        [166, 120, 1],
      ].map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
          <path d="M0 -28 L10 0 L-10 0 Z" fill="#64704f" />
          <rect x="-5" y="0" width="10" height="8" fill="#9c5a55" />
        </g>
      ))}
    </Plate>
  );
}

/** Small ornamental corner flourish, drawn in gold */
export function Flourish(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 120 24" fill="none" stroke="#b08d48" strokeWidth={1} aria-hidden="true" {...props}>
      <path d="M2 12 C 20 12, 26 2, 40 6 C 50 9, 46 18, 38 16 C 32 14, 36 8, 42 10" />
      <path d="M118 12 C 100 12, 94 2, 80 6 C 70 9, 74 18, 82 16 C 88 14, 84 8, 78 10" />
      <path d="M52 12 Q60 2 68 12 Q60 22 52 12 Z" fill="#d9bf86" />
    </svg>
  );
}
