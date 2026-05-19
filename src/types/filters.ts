export type FilterMode = "kernel" | "median";

export type KernelPresetId =
  | "identity"
  | "sharpen"
  | "gaussian-blur-3x3"
  | "box-blur"
  | "prewitt-x"
  | "prewitt-y";

export type EdgeHandlingStrategy = "black" | "white" | "copy";

export type FilterChannel = "red" | "green" | "blue" | "alpha";

export type FilterChannels = Record<FilterChannel, boolean>;

export type Kernel3x3 = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number
];

export interface KernelPreset {
  id: KernelPresetId;
  label: string;
  description: string;
  kernel: Kernel3x3;
}

export interface FilterSettings {
  mode: FilterMode;
  presetId: KernelPresetId;
  kernel: Kernel3x3;
  channels: FilterChannels;
  edgeHandling: EdgeHandlingStrategy;
  previewEnabled: boolean;
}

export const DEFAULT_FILTER_CHANNELS: FilterChannels = {
  red: true,
  green: true,
  blue: true,
  alpha: false,
};

export const DEFAULT_EDGE_HANDLING: EdgeHandlingStrategy = "copy";

export const KERNEL_PRESETS: KernelPreset[] = [
  {
    id: "identity",
    label: "Identity",
    description:
      "Leaves the image unchanged. Useful as the initial kernel and for resetting custom values.",
    kernel: [0, 0, 0, 0, 1, 0, 0, 0, 0],
  },
  {
    id: "sharpen",
    label: "Sharpen",
    description:
      "Increases local contrast around edges and makes image details look sharper.",
    kernel: [0, -1, 0, -1, 5, -1, 0, -1, 0],
  },
  {
    id: "gaussian-blur-3x3",
    label: "Gaussian blur 3×3",
    description:
      "Smooths the image using a small Gaussian-like kernel with higher weight in the center.",
    kernel: [
      1 / 16,
      2 / 16,
      1 / 16,
      2 / 16,
      4 / 16,
      2 / 16,
      1 / 16,
      2 / 16,
      1 / 16,
    ],
  },
  {
    id: "box-blur",
    label: "Box blur",
    description:
      "Averages neighboring pixels equally and produces a simple rectangular blur.",
    kernel: [
      1 / 9,
      1 / 9,
      1 / 9,
      1 / 9,
      1 / 9,
      1 / 9,
      1 / 9,
      1 / 9,
      1 / 9,
    ],
  },
  {
    id: "prewitt-x",
    label: "Prewitt X",
    description:
      "Detects vertical edges by measuring horizontal intensity changes.",
    kernel: [-1, 0, 1, -1, 0, 1, -1, 0, 1],
  },
  {
    id: "prewitt-y",
    label: "Prewitt Y",
    description:
      "Detects horizontal edges by measuring vertical intensity changes.",
    kernel: [-1, -1, -1, 0, 0, 0, 1, 1, 1],
  },
];

export function getKernelPreset(presetId: KernelPresetId): KernelPreset {
  return (
    KERNEL_PRESETS.find((preset) => preset.id === presetId) ??
    KERNEL_PRESETS[0]
  );
}

export function createDefaultFilterSettings(): FilterSettings {
  const identityPreset = getKernelPreset("identity");

  return {
    mode: "kernel",
    presetId: identityPreset.id,
    kernel: [...identityPreset.kernel] as Kernel3x3,
    channels: {
      ...DEFAULT_FILTER_CHANNELS,
    },
    edgeHandling: DEFAULT_EDGE_HANDLING,
    previewEnabled: true,
  };
}