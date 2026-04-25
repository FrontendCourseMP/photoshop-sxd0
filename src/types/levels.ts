import type { ChannelModel } from "./image";

export type LevelsHistogramMode = "linear" | "log";

export type LevelsChannelTarget =
  | "master"
  | "grayscale"
  | "red"
  | "green"
  | "blue"
  | "alpha";

export interface LevelsInputValues {
  blackPoint: number;
  gamma: number;
  whitePoint: number;
}

export type LevelsSettingsMap = Record<LevelsChannelTarget, LevelsInputValues>;

export interface LevelsDialogState {
  isOpen: boolean;
  previewEnabled: boolean;
  histogramMode: LevelsHistogramMode;
  selectedChannel: LevelsChannelTarget;
}

export interface HistogramData {
  bins: number[];
  maxValue: number;
  totalPixels: number;
}

export function createDefaultLevelsValues(): LevelsInputValues {
  return {
    blackPoint: 0,
    gamma: 1,
    whitePoint: 255,
  };
}

export function createDefaultLevelsSettings(): LevelsSettingsMap {
  return {
    master: createDefaultLevelsValues(),
    grayscale: createDefaultLevelsValues(),
    red: createDefaultLevelsValues(),
    green: createDefaultLevelsValues(),
    blue: createDefaultLevelsValues(),
    alpha: createDefaultLevelsValues(),
  };
}

export function getDefaultLevelsChannel(
  channelModel: ChannelModel
): LevelsChannelTarget {
  return channelModel === "grayscale" ? "grayscale" : "master";
}