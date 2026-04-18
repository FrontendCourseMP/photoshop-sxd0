export interface LabColor {
  l: number;
  a: number;
  b: number;
}

function srgbToLinear(channel: number): number {
  const normalized = channel / 255;

  if (normalized <= 0.04045) {
    return normalized / 12.92;
  }

  return Math.pow((normalized + 0.055) / 1.055, 2.4);
}

function xyzToLabComponent(value: number): number {
  const epsilon = 216 / 24389;
  const kappa = 24389 / 27;

  if (value > epsilon) {
    return Math.cbrt(value);
  }

  return (kappa * value + 16) / 116;
}

export function rgbToLab(red: number, green: number, blue: number): LabColor {
  const r = srgbToLinear(red);
  const g = srgbToLinear(green);
  const b = srgbToLinear(blue);

  const x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
  const y = r * 0.2126729 + g * 0.7151522 + b * 0.072175;
  const z = r * 0.0193339 + g * 0.119192 + b * 0.9503041;

  const refX = 0.95047;
  const refY = 1.0;
  const refZ = 1.08883;

  const fx = xyzToLabComponent(x / refX);
  const fy = xyzToLabComponent(y / refY);
  const fz = xyzToLabComponent(z / refZ);

  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}