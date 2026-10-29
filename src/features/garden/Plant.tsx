import Svg, { Circle, Ellipse, G, Line, Path } from 'react-native-svg';

import type { GardenStage, Hydration } from '../../domain/garden';

/*
 * Planta del jardín dibujada con SVG (viewBox 100×100).
 * - La etapa define la altura del tallo, el número de hojas y las flores.
 * - La hidratación cambia el color y la postura de las hojas (se inclinan hacia abajo
 *   cuando está mustia), pero la planta nunca muere.
 * - Raíz firme: se dibujan raíces bajo la tierra.
 */

interface Palette {
  leaf: string;
  vein: string;
  stem: string;
  petal: string;
}

const HYDRATION: Record<Hydration, Palette & { droop: number; bend: number }> = {
  vibrant: { leaf: '#3FA66B', vein: '#2C7F50', stem: '#2E7A4E', petal: '#F2A1B6', droop: -12, bend: 0 },
  normal: { leaf: '#63A872', vein: '#4A8C5B', stem: '#3E7852', petal: '#EDA9BA', droop: 0, bend: 1 },
  wilted: { leaf: '#A2AA60', vein: '#868D4C', stem: '#7B8049', petal: '#D8B4BD', droop: 28, bend: 6 },
  very_wilted: { leaf: '#B29F69', vein: '#978553', stem: '#8B7B56', petal: '#C9AAA3', droop: 50, bend: 11 },
};

const STAGE: Record<GardenStage, { height: number; leaves: number; leafSize: number; flowers: number }> = {
  seed: { height: 8, leaves: 2, leafSize: 7, flowers: 0 },
  sprout: { height: 26, leaves: 2, leafSize: 15, flowers: 0 },
  young: { height: 44, leaves: 4, leafSize: 18, flowers: 0 },
  plant: { height: 58, leaves: 6, leafSize: 20, flowers: 0 },
  bloom: { height: 61, leaves: 6, leafSize: 20, flowers: 3 },
};

/** Fondo circular suave según la hidratación. */
const BACKDROP: Record<Hydration, string> = {
  vibrant: '#7BC59A',
  normal: '#9CC9A8',
  wilted: '#D2C79A',
  very_wilted: '#D6BFA0',
};

const GROUND_Y = 82;

/** Punto sobre la curva cuadrática del tallo. */
function stemPoint(t: number, height: number, bend: number): { x: number; y: number } {
  const p0 = { x: 50, y: GROUND_Y };
  const p1 = { x: 50 + bend * 0.15, y: GROUND_Y - height * 0.55 };
  const p2 = { x: 50 + bend, y: GROUND_Y - height };
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
}

function Leaf({ x, y, size, side, angle, colors }: { x: number; y: number; size: number; side: 1 | -1; angle: number; colors: Palette }) {
  const L = size;
  const W = size * 0.42;
  const d = `M0 0 C ${L * 0.3} ${-W} ${L * 0.75} ${-W} ${L} 0 C ${L * 0.75} ${W * 0.55} ${L * 0.3} ${W * 0.55} 0 0 Z`;
  return (
    <G transform={`translate(${x} ${y}) scale(${side} 1) rotate(${angle})`}>
      <Path d={d} fill={colors.leaf} />
      <Line x1={0} y1={0} x2={L * 0.85} y2={0} stroke={colors.vein} strokeWidth={0.8} strokeLinecap="round" />
    </G>
  );
}

function Flower({ x, y, r, colors }: { x: number; y: number; r: number; colors: Palette }) {
  return (
    <G>
      {[0, 72, 144, 216, 288].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return <Circle key={deg} cx={x + Math.cos(rad) * r} cy={y + Math.sin(rad) * r} r={r * 0.85} fill={colors.petal} />;
      })}
      <Circle cx={x} cy={y} r={r * 0.6} fill="#F4C84A" />
    </G>
  );
}

export function Plant({
  stage,
  hydration,
  firmRoots = false,
  size = 88,
  soil,
}: {
  stage: GardenStage | 'unplanted';
  hydration: Hydration;
  firmRoots?: boolean;
  size?: number;
  soil: { fill: string; dark: string };
}) {
  const ground = (
    <>
      {firmRoots ? (
        <G stroke={soil.dark} strokeWidth={1.4} strokeLinecap="round" fill="none">
          <Path d="M50 82 C 49 88, 46 92, 41 97" />
          <Path d="M50 82 C 51 89, 54 93, 60 97" />
          <Path d="M50 83 L 50 98" />
          <Path d="M47 88 C 43 89, 38 91, 34 94" />
          <Path d="M53 88 C 57 89, 62 91, 66 94" />
        </G>
      ) : null}
      <Ellipse cx={50} cy={GROUND_Y + 3} rx={36} ry={7.5} fill={soil.fill} />
    </>
  );

  if (stage === 'unplanted') {
    return (
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Ellipse cx={50} cy={GROUND_Y + 3} rx={36} ry={7.5} fill="none" stroke={soil.fill} strokeWidth={1.5} strokeDasharray="3 3" />
        <Circle cx={40} cy={GROUND_Y + 3} r={1.6} fill={soil.fill} />
        <Circle cx={55} cy={GROUND_Y + 1} r={1.2} fill={soil.fill} />
        <Circle cx={62} cy={GROUND_Y + 5} r={1.4} fill={soil.fill} />
      </Svg>
    );
  }

  const h = HYDRATION[hydration];
  const s = STAGE[stage];
  const backdrop = <Circle cx={50} cy={50} r={44} fill={BACKDROP[hydration]} opacity={0.18} />;
  const top = stemPoint(1, s.height, h.bend);
  const stemD = `M50 ${GROUND_Y} Q ${50 + h.bend * 0.15} ${GROUND_Y - s.height * 0.55} ${top.x} ${top.y}`;

  const leaves = Array.from({ length: s.leaves }, (_, i) => {
    // Hojas alternadas, de abajo hacia arriba; las de arriba son algo más pequeñas.
    const t = s.leaves === 2 ? 0.92 : 0.3 + (0.62 * i) / (s.leaves - 1);
    const p = stemPoint(t, s.height, h.bend);
    const side: 1 | -1 = i % 2 === 0 ? 1 : -1;
    const sizeFactor = s.leaves === 2 ? 1 : 1 - (i / s.leaves) * 0.35;
    const baseAngle = -32 + t * -8;
    return { key: i, x: p.x, y: p.y, side, size: s.leafSize * sizeFactor, angle: baseAngle + h.droop };
  });

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {backdrop}
      {ground}
      {stage === 'seed' ? <Ellipse cx={50} cy={GROUND_Y + 1} rx={6} ry={4} fill={soil.dark} /> : null}
      <Path d={stemD} stroke={h.stem} strokeWidth={stage === 'seed' ? 2 : 3} fill="none" strokeLinecap="round" />
      {leaves.map((l) => (
        <Leaf key={l.key} x={l.x} y={l.y} size={l.size} side={l.side} angle={l.angle} colors={h} />
      ))}
      {s.flowers > 0 ? (
        <>
          <Flower x={top.x} y={top.y - 3} r={5.6} colors={h} />
          {leaves.length >= 4 && leaves[2] && leaves[3] ? (
            <>
              <Flower x={leaves[2].x + 17} y={leaves[2].y - 8 + h.droop * 0.15} r={3.8} colors={h} />
              <Flower x={leaves[3].x - 17} y={leaves[3].y - 8 + h.droop * 0.15} r={3.8} colors={h} />
            </>
          ) : null}
        </>
      ) : null}
    </Svg>
  );
}
