import Svg, { Circle, Line, Path, Polyline } from 'react-native-svg';

/* Íconos lineales mínimos (sin fuentes externas). */

interface IconProps {
  color: string;
  size?: number;
}

const stroke = (color: string) => ({
  stroke: color,
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none',
});

export function SunIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={4} {...stroke(color)} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const r = (deg * Math.PI) / 180;
        return (
          <Line
            key={deg}
            x1={12 + Math.cos(r) * 7}
            y1={12 + Math.sin(r) * 7}
            x2={12 + Math.cos(r) * 9.5}
            y2={12 + Math.sin(r) * 9.5}
            {...stroke(color)}
          />
        );
      })}
    </Svg>
  );
}

export function SproutIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 21v-9" {...stroke(color)} />
      <Path d="M12 12c0-4 3-7 8-7 0 4-3 7-8 7z" {...stroke(color)} />
      <Path d="M12 14c0-3-2.5-5.5-7-5.5 0 3 2.5 5.5 7 5.5z" {...stroke(color)} />
    </Svg>
  );
}

export function NotebookIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M6 3h11a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6z" {...stroke(color)} />
      <Line x1={6} y1={3} x2={6} y2={21} {...stroke(color)} />
      <Line x1={10} y1={8} x2={15} y2={8} {...stroke(color)} />
      <Line x1={10} y1={12} x2={15} y2={12} {...stroke(color)} />
    </Svg>
  );
}

export function LoopIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 12a8 8 0 0 1 13.7-5.6" {...stroke(color)} />
      <Polyline points="18 2.5 18 6.5 14 6.5" {...stroke(color)} />
      <Path d="M20 12a8 8 0 0 1-13.7 5.6" {...stroke(color)} />
      <Polyline points="6 21.5 6 17.5 10 17.5" {...stroke(color)} />
    </Svg>
  );
}

export function GearIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={3} {...stroke(color)} />
      <Path
        d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"
        {...stroke(color)}
      />
    </Svg>
  );
}

export function PlusIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Line x1={12} y1={5} x2={12} y2={19} {...stroke(color)} strokeWidth={2.5} />
      <Line x1={5} y1={12} x2={19} y2={12} {...stroke(color)} strokeWidth={2.5} />
    </Svg>
  );
}

export function ChevronIcon({ color, size = 24, direction = 'right' }: IconProps & { direction?: 'left' | 'right' | 'up' | 'down' }) {
  const d = {
    left: 'M15 5l-7 7 7 7',
    right: 'M9 5l7 7-7 7',
    up: 'M5 15l7-7 7 7',
    down: 'M5 9l7 7 7-7',
  }[direction];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={d} {...stroke(color)} />
    </Svg>
  );
}

export function DropIcon({ color, size = 16 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" fill={color} />
    </Svg>
  );
}
