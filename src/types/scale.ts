export type InterpolationMethod = "nearest" | "bilinear";

export type ResizeUnit = "percent" | "pixels";

export interface ResizeDimensions {
  width: number;
  height: number;
}

export interface InterpolationMethodInfo {
  method: InterpolationMethod;
  label: string;
  description: string;
}

export const SCALE_PERCENT_MIN = 12;
export const SCALE_PERCENT_MAX = 300;
export const SCALE_PERCENT_DEFAULT = 100;

export const INTERPOLATION_METHODS: InterpolationMethodInfo[] = [
  {
    method: "nearest",
    label: "Nearest neighbor",
    description:
      "Fastest method. Keeps hard pixel edges, but can create jagged borders and blocky artifacts.",
  },
  {
    method: "bilinear",
    label: "Bilinear",
    description:
      "Default method. Uses four neighboring pixels, produces smoother scaling and fewer sharp artifacts.",
  },
];

export function getInterpolationMethodInfo(
  method: InterpolationMethod
): InterpolationMethodInfo {
  return (
    INTERPOLATION_METHODS.find((item) => item.method === method) ??
    INTERPOLATION_METHODS[1]
  );
}